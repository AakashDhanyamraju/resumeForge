import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { readdir, readFile, writeFile, mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { google, createSession, validateSession, deleteSession } from "./lib/auth";
import { prisma } from "./lib/db";

const execAsync = promisify(exec);

// Check if dist directory exists (for production builds)
const distPath = join(process.cwd(), "client", "dist");
const isProduction = existsSync(distPath) || process.env.NODE_ENV === "production";

let app = new Elysia()
  .use(cors({ credentials: true, origin: true }))
  .use(cookie())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "fallback-secret-key-change-this",
    })
  )
  .derive(async ({ cookie: cookies }) => {
    // Add user to context if session cookie exists
    const sessionCookie = cookies[process.env.SESSION_COOKIE_NAME || "resume_session"];
    const sessionId = sessionCookie?.value; // Extract string value from cookie object
    const user = (sessionId && typeof sessionId === 'string') ? await validateSession(sessionId) : null;
    return { user };
  });

// Only serve static files in production (when dist exists)
if (isProduction) {
  app = app.use(staticPlugin({ assets: "./client/dist", prefix: "/" }));
  app = app.get("/", () => {
    return Bun.file("./client/dist/index.html");
  });
} else {
  // In development, just return a message pointing to Vite dev server
  app = app.get("/", () => {
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Resume Maker API</title></head>
<body>
  <h1>Resume Maker API Server</h1>
  <p>In development mode. Please access the frontend at <a href="http://localhost:5173">http://localhost:5173</a></p>
  <p>Make sure to run <code>bun run client:dev</code> in another terminal.</p>
</body>
</html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  });
}

app = app
  // ============================================
  // Authentication Routes
  // ============================================
  .get("/auth/google", async ({ cookie: cookies }) => {
    try {
      const state = crypto.randomUUID();
      const codeVerifier = crypto.randomUUID();
      const url = await google.createAuthorizationURL(state, codeVerifier, {
        scopes: ["profile", "email"],
      });

      // Store state and code verifier in cookies for validation
      cookies["google_oauth_state"].set({
        value: state,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10, // 10 minutes
      });

      cookies["google_code_verifier"].set({
        value: codeVerifier,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10, // 10 minutes
      });

      // Return proper redirect response
      return Response.redirect(url.toString(), 302);
    } catch (error) {
      console.error("OAuth initiation error:", error);
      return new Response(JSON.stringify({ error: "Failed to initiate OAuth flow" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  })
  .get("/auth/google/callback", async ({ query, cookie: cookies }) => {
    try {
      const code = query.code as string;
      const state = query.state as string;
      const storedStateCookie = cookies["google_oauth_state"];
      const codeVerifierCookie = cookies["google_code_verifier"];

      const storedState = storedStateCookie?.value;
      const codeVerifier = codeVerifierCookie?.value;

      if (!code || !state || !storedState || state !== storedState) {
        console.error("OAuth validation failed:", { code: !!code, state: !!state, storedState: !!storedState, match: state === storedState });
        return Response.redirect("/login?error=invalid_state", 302);
      }

      // Clear the state cookies
      delete cookies["google_oauth_state"];
      delete cookies["google_code_verifier"];

      // Exchange code for tokens
      const tokens = await google.validateAuthorizationCode(code, codeVerifier as string);

      // Get user info from Google
      const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      const googleUser = await response.json() as any;

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { googleId: googleUser.id },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            googleId: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
          },
        });
      } else {
        // Update user info in case it changed
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: googleUser.name,
            picture: googleUser.picture,
          },
        });
      }

      // Create session
      const session = await createSession(user.id);

      // Set session cookie with proper options
      const cookieName = process.env.SESSION_COOKIE_NAME || "resume_session";
      cookies[cookieName].set({
        value: session.id,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      });

      // Redirect to dashboard
      return Response.redirect("/dashboard", 302);
    } catch (error) {
      console.error("OAuth callback error:", error);
      return Response.redirect("/login?error=auth_failed", 302);
    }
  })
  .get("/auth/me", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { user: null };
    }
    return { user: { id: user.id, email: user.email, name: user.name, picture: user.picture } };
  })
  .post("/auth/logout", async ({ cookie: cookies, set }) => {
    const sessionCookie = cookies[process.env.SESSION_COOKIE_NAME || "resume_session"];
    const sessionId = sessionCookie?.value;
    if (sessionId && typeof sessionId === 'string') {
      await deleteSession(sessionId);
      delete cookies[process.env.SESSION_COOKIE_NAME || "resume_session"];
    }
    set.status = 200;
    return { success: true };
  })
  // ============================================
  // User Resume API (Protected)
  // ============================================
  .get("/api/user/resumes", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        template: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return { resumes };
  })
  .get("/api/user/resumes/:id", async ({ params, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const resume = await prisma.resume.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!resume) {
      set.status = 404;
      return { error: "Resume not found" };
    }

    return { resume };
  })
  .post("/api/user/resumes", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { name, template, content } = body as { name: string; template: string; content: string };

    const resume = await prisma.resume.create({
      data: {
        name,
        template,
        content,
        userId: user.id,
      },
    });

    return { resume };
  })
  .put("/api/user/resumes/:id", async ({ params, body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { name, content } = body as { name?: string; content?: string };

    // Verify ownership
    const existing = await prisma.resume.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      set.status = 404;
      return { error: "Resume not found" };
    }

    const resume = await prisma.resume.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(content && { content }),
      },
    });

    return { resume };
  })
  .delete("/api/user/resumes/:id", async ({ params, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const resume = await prisma.resume.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!resume) {
      set.status = 404;
      return { error: "Resume not found" };
    }

    await prisma.resume.delete({ where: { id: params.id } });

    return { success: true };
  })
  .post("/api/user/resumes/migrate", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { resumes } = body as { resumes: Array<{ name: string; template: string; content: string }> };

    if (!resumes || !Array.isArray(resumes)) {
      set.status = 400;
      return { error: "Invalid request body" };
    }

    // Create all resumes for the user
    const created = await prisma.resume.createMany({
      data: resumes.map((r) => ({
        name: r.name,
        template: r.template,
        content: r.content,
        userId: user.id,
      })),
    });

    return { success: true, count: created.count };
  })
  // ============================================
  // Public Template Routes
  // ============================================
  .get("/api/templates", async () => {
    const templatesDir = join(process.cwd(), "templates");
    if (!existsSync(templatesDir)) {
      await mkdir(templatesDir, { recursive: true });
      return { templates: [] };
    }

    const files = await readdir(templatesDir);
    const templates = await Promise.all(
      files
        .filter((f) => f.endsWith(".tex"))
        .map(async (file) => {
          const content = await readFile(join(templatesDir, file), "utf-8");
          const name = file.replace(".tex", "");
          return { name, content, filename: file };
        })
    );

    return { templates };
  })
  .get("/api/templates/:name", async ({ params }) => {
    const templatePath = join(process.cwd(), "templates", `${params.name}.tex`);
    if (!existsSync(templatePath)) {
      return { error: "Template not found" };
    }
    const content = await readFile(templatePath, "utf-8");
    return { name: params.name, content };
  })
  .post("/api/compile", async ({ body, set }) => {
    try {
      const { texContent } = body as { texContent: string };

      // Basic validation
      if (!texContent || !texContent.trim()) {
        set.status = 400;
        return {
          error: "Empty LaTeX content",
          details: "Please provide LaTeX content to compile.",
        };
      }

      // Check for required LaTeX document structure
      if (!texContent.includes("\\begin{document}")) {
        set.status = 400;
        return {
          error: "Missing \\begin{document}",
          details: "Your LaTeX document must include \\begin{document} and \\end{document} tags.\n\nMake sure your document has:\n- \\documentclass{...}\n- \\begin{document}\n- Your content\n- \\end{document}",
        };
      }

      if (!texContent.includes("\\end{document}")) {
        set.status = 400;
        return {
          error: "Missing \\end{document}",
          details: "Your LaTeX document must include \\end{document} at the end.",
        };
      }

      if (!texContent.includes("\\documentclass")) {
        set.status = 400;
        return {
          error: "Missing \\documentclass",
          details: "Your LaTeX document must start with \\documentclass{...} declaration.",
        };
      }

      // Create temp directory
      const tempDir = join(process.cwd(), "temp", `resume_${Date.now()}`);
      await mkdir(tempDir, { recursive: true });

      // Write .tex file
      const texPath = join(tempDir, "resume.tex");
      await writeFile(texPath, texContent, "utf-8");

      // Compile LaTeX to PDF
      try {
        // Normalize paths for Windows compatibility
        const normalizedOutputDir = tempDir.replace(/\\/g, "/");
        const normalizedTexPath = texPath.replace(/\\/g, "/");

        await execAsync(
          `pdflatex -interaction=nonstopmode -output-directory="${normalizedOutputDir}" "${normalizedTexPath}"`,
          { timeout: 30000 }
        );

        // Read PDF
        const pdfPath = join(tempDir, "resume.pdf");
        if (!existsSync(pdfPath)) {
          throw new Error("PDF generation failed");
        }

        const pdfBuffer = await Bun.file(pdfPath).arrayBuffer();

        // Cleanup (async, don't wait)
        rm(tempDir, { recursive: true, force: true }).catch(() => { });

        return new Response(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline; filename=resume.pdf",
          },
        });
      } catch (error: any) {
        set.status = 400; // Bad Request (Compilation Error)

        // Check if it's a "command not found" error
        const errorMsg = error.message || "";
        let errorMessage = "LaTeX compilation failed";
        let details = error.message;

        if (errorMsg.includes("not recognized") || errorMsg.includes("not found") || errorMsg.includes("ENOENT")) {
          set.status = 500; // Server Error
          errorMessage = "LaTeX (pdflatex) is not installed or not in your system PATH";
          details = `Please install a LaTeX distribution:
          
Windows: Install MiKTeX from https://miktex.org/ or TeX Live from https://www.tug.org/texlive/
After installation, restart your terminal and server.

To verify installation, run: pdflatex --version`;
        } else {
          // Try to read log for LaTeX compilation errors
          const logPath = join(tempDir, "resume.log");
          if (existsSync(logPath)) {
            const log = await readFile(logPath, "utf-8");

            // Extract LaTeX errors - look for "!" lines which indicate errors
            const errorLines: string[] = [];
            const lines = log.split('\n');

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              // LaTeX errors typically start with "!" and include the error message
              if (line.startsWith('!')) {
                errorLines.push(line);
                // Also get the next few lines which often contain error details
                for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                  const nextLine = lines[j].trim();
                  if (nextLine && !nextLine.startsWith('l.') && !nextLine.startsWith('?')) {
                    if (nextLine.length < 100) { // Avoid very long lines
                      errorLines.push(nextLine);
                    }
                  }
                }
                break; // Get first error
              }
              // Also check for "Error:" pattern
              if (line.includes('Error:') && !errorLines.length) {
                errorLines.push(line);
                break;
              }
            }

            if (errorLines.length > 0) {
              errorMessage = errorLines[0].replace(/^!\s*/, '').trim();
              if (errorLines.length > 1) {
                details = errorLines.slice(0, 3).join('\n');
              } else {
                details = error.message;
              }
            } else {
              // Fallback: look for common error patterns
              const missingDocMatch = log.match(/Missing \\begin\{document\}/i);
              const undefinedControlMatch = log.match(/Undefined control sequence[^\n]*/i);
              const fileNotFoundMatch = log.match(/File `[^']+' not found/i);

              if (missingDocMatch) {
                errorMessage = "Missing \\begin{document}";
                details = "Your LaTeX document must include \\begin{document} and \\end{document} tags. Make sure your document has a complete structure.";
              } else if (undefinedControlMatch) {
                errorMessage = undefinedControlMatch[0];
                details = "An undefined LaTeX command was used. Check for typos in command names.";
              } else if (fileNotFoundMatch) {
                errorMessage = fileNotFoundMatch[0];
                details = "A required LaTeX package or file is missing. You may need to install additional packages.";
              } else {
                // Extract last few lines of log as context
                const logLines = log.split('\n').filter(l => l.trim());
                const lastLines = logLines.slice(-10).join('\n');
                details = `LaTeX compilation failed. Last log entries:\n${lastLines}`;
              }
            }
          }
        }

        // Cleanup
        rm(tempDir, { recursive: true, force: true }).catch(() => { });

        return {
          error: errorMessage,
          details: details,
        };
      }
    } catch (error: any) {
      set.status = 500;
      return {
        error: "Compilation failed",
        details: error.message,
      };
    }
  })
  .listen(3000);

console.log(`🚀 Server is running at http://localhost:${app.server?.port}`);

