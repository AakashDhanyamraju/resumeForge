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
import {
  google, createSession, validateSession, deleteSession,
  deleteExpiredSessions,
  hashPassword,
  verifyPassword,
  validatePassword,
  generateVerificationToken,
  getVerificationTokenExpiry
} from "./lib/auth";
import { sendVerificationEmail } from "./lib/email";
import { editResumeSection, chatWithResume, getResumeSuggestions, streamChatWithResume, fixLatexError, evaluateATSScore, convertResumeToLatex } from "./lib/ai";
import { prisma } from "./lib/db";
import { uploadTemplateImage, getTemplateImage } from "./lib/storage";
import AdmZip from "adm-zip";

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
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret && process.env.NODE_ENV === "production") {
          throw new Error("FATAL: JWT_SECRET environment variable is required in production. Server cannot start without it.");
        }
        return secret || "dev-fallback-secret-key";
      })(),
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
            emailVerified: true, // Google OAuth users are pre-verified
          },
        });
      } else {
        // Update user info in case it changed
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: googleUser.name,
            picture: googleUser.picture,
            emailVerified: true, // Ensure verified status
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
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        emailVerified: user.emailVerified,
        role: user.role,
        aiEnabled: user.aiEnabled,
        aiModel: user.aiModel
      }
    };
  })
  // ============================================
  // Email/Password Authentication
  // ============================================
  .post("/auth/signup", async ({ body, set }) => {
    try {
      const { email, password, name } = body as any;

      // Basic validation
      if (!email || !password || !name) {
        set.status = 400;
        return { error: "Missing required fields" };
      }

      // Check password strength
      const { valid, errors } = validatePassword(password);
      if (!valid) {
        set.status = 400;
        return { error: "Weak password", details: errors };
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        set.status = 400;
        return { error: "Email already registered" };
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();

      // Create user
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          emailVerified: false,
          verificationToken,
          tokenExpiry,
        },
      });

      // Send verification email
      try {
        await sendVerificationEmail(email, name, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue - user is created but simply needs to resend verification later
      }

      return { success: true, message: "Account created. Please verify your email." };
    } catch (error) {
      console.error("Signup error:", error);
      set.status = 500;
      return { error: "Failed to create account" };
    }
  })
  .post("/auth/login", async ({ body, cookie: cookies, set }) => {
    try {
      const { email, password } = body as any;

      if (!email || !password) {
        set.status = 400;
        return { error: "Missing permissions" };
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        // Use generic error message for security
        set.status = 401;
        return { error: "Invalid email or password" };
      }

      // Check if password matches
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        set.status = 401;
        return { error: "Invalid email or password" };
      }

      // Check if verified
      if (!user.emailVerified) {
        set.status = 403;
        return { error: "Email not verified", emailVerified: false };
      }

      // Create session
      const session = await createSession(user.id);

      // Set session cookie
      const cookieName = process.env.SESSION_COOKIE_NAME || "resume_session";
      cookies[cookieName].set({
        value: session.id,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return { success: true, user: { id: user.id, email: user.email, name: user.name, picture: user.picture } };
    } catch (error) {
      console.error("Login error:", error);
      set.status = 500;
      return { error: "Login failed" };
    }
  })
  .get("/auth/verify-email", async ({ query, cookie: cookies, set }) => {
    try {
      const token = query.token as string;

      if (!token) {
        return Response.redirect("/login?error=invalid_token", 302);
      }

      const user = await prisma.user.findUnique({
        where: { verificationToken: token },
      });

      if (!user || !user.tokenExpiry || user.tokenExpiry < new Date()) {
        return Response.redirect("/login?error=token_expired", 302);
      }

      // Update user status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          tokenExpiry: null,
        },
      });

      // Create session for auto-login
      const session = await createSession(user.id);
      const cookieName = process.env.SESSION_COOKIE_NAME || "resume_session";
      cookies[cookieName].set({
        value: session.id,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      return Response.redirect("/dashboard?verified=true", 302);
    } catch (error) {
      console.error("Verification error:", error);
      return Response.redirect("/login?error=verification_failed", 302);
    }
  })
  .post("/auth/resend-verification", async ({ body, set }) => {
    try {
      const { email } = body as any;

      if (!email) {
        set.status = 400;
        return { error: "Email is required" };
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Return success even if user not found to prevent user enumeration
        return { success: true, message: "If account exists, verification email sent" };
      }

      if (user.emailVerified) {
        return { success: true, message: "Email already verified" };
      }

      // Generate new token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          tokenExpiry,
        },
      });

      await sendVerificationEmail(email, user.name || "User", verificationToken);

      return { success: true, message: "Verification email sent" };
    } catch (error) {
      console.error("Resend verification error:", error);
      set.status = 500;
      return { error: "Failed to send verification email" };
    }
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

    // Fetch the associated template to get clsContent
    // Resumes store template name in 'template' field
    // We sanitize if needed, but usually the name matches exactly
    const template = await prisma.template.findUnique({
      where: { name: resume.template }
    });

    return {
      resume: {
        ...resume,
        clsContent: template?.clsContent || null,
        templateName: template?.name || resume.template
      }
    };
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
  // AI Resume Editing API (Protected)
  // ============================================
  .post("/api/ai/edit", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { selectedText, instruction, fullContent } = body as {
      selectedText: string;
      instruction: string;
      fullContent?: string;
    };

    if (!selectedText || !instruction) {
      set.status = 400;
      return { error: "selectedText and instruction are required" };
    }

    try {
      const editedText = await editResumeSection(selectedText, instruction, fullContent);
      return { editedText };
    } catch (error: any) {
      console.error("AI edit error:", error);
      set.status = 500;
      return { error: "Failed to process AI edit" };
    }
  })
  .post("/api/ai/chat", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { messages, resumeContent } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      resumeContent: string;
    };

    if (!messages || !resumeContent) {
      set.status = 400;
      return { error: "messages and resumeContent are required" };
    }

    try {
      const response = await chatWithResume(messages, resumeContent);
      return response;
    } catch (error: any) {
      console.error("AI chat error:", error);
      set.status = 500;
      return { error: "Failed to process chat message" };
    }
  })
  .post("/api/ai/chat/stream", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { messages, resumeContent } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      resumeContent: string;
    };

    if (!messages || !resumeContent) {
      set.status = 400;
      return { error: "messages and resumeContent are required" };
    }

    try {
      const stream = await streamChatWithResume(messages, resumeContent);

      // Create a ReadableStream for SSE
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } catch (error: any) {
      console.error("AI stream error:", error);
      set.status = 500;
      return { error: "Failed to stream chat" };
    }
  })
  .get("/api/ai/suggestions", async ({ query, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const resumeId = query.resumeId as string;
    if (!resumeId) {
      set.status = 400;
      return { error: "resumeId is required" };
    }

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
    });

    if (!resume) {
      set.status = 404;
      return { error: "Resume not found" };
    }

    try {
      const suggestions = await getResumeSuggestions(resume.content);
      return { suggestions };
    } catch (error: any) {
      console.error("AI suggestions error:", error);
      set.status = 500;
      return { error: "Failed to get suggestions" };
    }
  })
  .post("/api/ai/fix-error", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { latexContent, errorMessage } = body as {
      latexContent: string;
      errorMessage: string;
    };

    if (!latexContent || !errorMessage) {
      set.status = 400;
      return { error: "latexContent and errorMessage are required" };
    }

    try {
      const fixedContent = await fixLatexError(latexContent, errorMessage);
      return { fixedContent };
    } catch (error: any) {
      console.error("AI fix error:", error);
      set.status = 500;
      return { error: "Failed to fix error" };
    }
  })
  .post("/api/ai/ats-score", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { resumeContent, resumeId } = body as {
      resumeContent?: string;
      resumeId?: string;
    };

    let content = resumeContent;

    // If resumeId is provided, fetch the resume content
    if (!content && resumeId) {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId: user.id },
      });

      if (!resume) {
        set.status = 404;
        return { error: "Resume not found" };
      }

      content = resume.content;
    }

    if (!content) {
      set.status = 400;
      return { error: "resumeContent or resumeId is required" };
    }

    try {
      const result = await evaluateATSScore(content);
      return result;
    } catch (error: any) {
      console.error("ATS score error:", error);
      set.status = 500;
      return { error: "Failed to evaluate ATS score" };
    }
  })
  .post("/api/ai/ats-score/upload", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const formData = body as { file: File };
      const file = formData.file;

      if (!file) {
        set.status = 400;
        return { error: "No file provided" };
      }

      const fileName = file.name.toLowerCase();
      let textContent = "";

      // Parse file based on type
      if (fileName.endsWith(".pdf")) {
        // Dynamic import for pdf-parse
        const pdfParse = (await import("pdf-parse")).default;
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdfParse(buffer);
        textContent = pdfData.text;
      } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        // Dynamic import for mammoth
        const mammoth = await import("mammoth");
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await mammoth.extractRawText({ buffer });
        textContent = result.value;
      } else if (fileName.endsWith(".txt") || fileName.endsWith(".tex")) {
        textContent = await file.text();
      } else {
        set.status = 400;
        return { error: "Unsupported file type. Please upload PDF, DOCX, DOC, TXT, or TEX files." };
      }

      if (!textContent.trim()) {
        set.status = 400;
        return { error: "Could not extract text from the uploaded file. The file may be empty or corrupted." };
      }

      const result = await evaluateATSScore(textContent);
      return result;
    } catch (error: any) {
      console.error("ATS score upload error:", error);
      set.status = 500;
      return { error: "Failed to process file and evaluate ATS score" };
    }
  })
  .post("/api/ai/import-resume", async ({ body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const formData = body as { file: File; templateName: string };
      const file = formData.file;
      const templateName = formData.templateName;

      if (!file) {
        set.status = 400;
        return { error: "No file provided" };
      }

      if (!templateName) {
        set.status = 400;
        return { error: "No template selected" };
      }

      // Parse file to extract text
      const fileName = file.name.toLowerCase();
      let textContent = "";

      if (fileName.endsWith(".pdf")) {
        const pdfParse = (await import("pdf-parse")).default;
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdfParse(buffer);
        textContent = pdfData.text;
      } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
        const mammoth = await import("mammoth");
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await mammoth.extractRawText({ buffer });
        textContent = result.value;
      } else if (fileName.endsWith(".txt") || fileName.endsWith(".tex")) {
        textContent = await file.text();
      } else {
        set.status = 400;
        return { error: "Unsupported file type. Please upload PDF, DOCX, DOC, TXT, or TEX files." };
      }

      if (!textContent.trim()) {
        set.status = 400;
        return { error: "Could not extract text from the uploaded file. The file may be empty or corrupted." };
      }

      // Fetch template content
      const templatePath = join(process.cwd(), "templates", `${templateName}.tex`);
      if (!existsSync(templatePath)) {
        set.status = 404;
        return { error: "Template not found" };
      }
      const templateContent = await readFile(templatePath, "utf-8");

      // Convert to LaTeX using AI
      const latexContent = await convertResumeToLatex(textContent, templateContent);

      if (!latexContent || !latexContent.includes("\\documentclass")) {
        set.status = 500;
        return { error: "AI failed to generate valid LaTeX. Please try again." };
      }

      // Create resume in database
      const resume = await prisma.resume.create({
        data: {
          name: file.name.replace(/\.(pdf|docx?|txt|tex)$/i, "") || "Imported Resume",
          template: templateName,
          content: latexContent,
          userId: user.id,
        },
      });

      return {
        success: true,
        resumeId: resume.id,
        message: "Resume imported successfully"
      };
    } catch (error: any) {
      console.error("Resume import error:", error);
      set.status = 500;
      return { error: "Failed to import resume. Please try again." };
    }
  })
  // ============================================
  // Public Template Routes
  // ============================================
  .get("/api/templates", async () => {
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });
    return { templates };
  })
  .get("/api/templates/:name", async ({ params, set }) => {
    const template = await prisma.template.findFirst({
      where: {
        name: params.name,
        isActive: true
      },
    });

    if (!template) {
      set.status = 404;
      return { error: "Template not found" };
    }

    // Return content compatible with frontend expectation
    return {
      name: template.name,
      content: template.content,
      description: template.description
    };
  })
  .get("/api/images/templates/:name", async ({ params, set }) => {
    const stream = await getTemplateImage(params.name);
    if (!stream) {
      set.status = 404;
      return { error: "Image not found" };
    }

    return new Response(stream as any, {
      headers: { "Content-Type": "image/png" }
    });
  })
  .post("/api/compile", async ({ body, user, set }) => {
    // Authentication required to prevent DoS attacks
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized", details: "You must be logged in to compile resumes." };
    }

    try {
      let { texContent, clsContent, templateName } = body as { texContent: string; clsContent?: string; templateName?: string };

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

      // NEW: Copy template assets if they exist
      if (templateName) {
        const safeName = templateName.replace(/[^a-zA-Z0-9]/g, "");
        const templateDir = join(process.cwd(), "templates", safeName);
        if (existsSync(templateDir)) {
          // Copy all files from template dir to temp dir
          // We use shell cp because fs.cp is experimental in some node versions, 
          // but bun implements node fs. Let's use recursive cp via exec for reliability on linux container.
          await execAsync(`cp -r "${templateDir}/." "${tempDir}/"`);
        }
      }

      let className = "resume";
      // If clsContent is provided, force it to match template name if possible
      // or at least force consistency between .cls filename and \documentclass
      if (clsContent) {
        if (templateName) {
          // Sanitize template name to be a valid filename (alphanumeric only ideally)
          className = templateName.replace(/[^a-zA-Z0-9]/g, "");
          if (!className) className = "custom";
        } else {
          // Fallback to extracting from documentclass if no template name provided
          const classMatch = texContent.match(/\\documentclass(?:\[.*?\])?\{(.*?)\}/);
          if (classMatch && classMatch[1]) {
            className = classMatch[1].trim();
          }
        }

        // write the cls file
        const clsPath = join(tempDir, `${className}.cls`);
        await writeFile(clsPath, clsContent, "utf-8");

        // Force update the documentclass in texContent to match the className
        // This ensures "cls name is always same as template name" logic
        // We use a capture group $1 to preserve any options like [a4paper,11pt]
        texContent = texContent.replace(
          /(\\documentclass(?:\[.*?\])?)\{.*?\}/,
          `$1{${className}}`
        );
      }

      // Write .tex file (with potentially updated documentclass)
      const texPath = join(tempDir, "resume.tex");
      await writeFile(texPath, texContent, "utf-8");

      // Compile LaTeX to PDF
      try {
        // Run compilation in the temp directory so relative paths (fonts/, images/) work
        await execAsync(
          `xelatex -interaction=nonstopmode -output-directory="." "resume.tex"`,
          {
            timeout: 45000, // Increased timeout for xelatex
            cwd: tempDir
          }
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
          // DEBUG: List files in temp directory to help debug missing assets
          try {
            const { stdout } = await execAsync(`ls -R`, { cwd: tempDir });
            console.log("Compile failed. File structure:", stdout);
          } catch (e) {
            console.log("Could not list files:", e);
          }

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
  // ============================================
  // Admin Routes
  // ============================================
  // Get all templates (content_manager+)
  .get("/api/admin/templates", async ({ user, set }) => {
    if (!user || (user.role !== "admin" && user.role !== "content_manager")) {
      set.status = 403;
      return { error: "Access denied" };
    }

    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { templates };
  })
  // Upload template image (content_manager+)
  .post("/api/admin/templates/upload-image", async ({ user, body, set }) => {
    if (!user || (user.role !== "admin" && user.role !== "content_manager")) {
      set.status = 403;
      return { error: "Access denied" };
    }

    const { file, templateName } = body as { file: File; templateName: string };

    if (!file || !templateName) {
      set.status = 400;
      return { error: "File and template name are required" };
    }

    try {
      const imageUrl = await uploadTemplateImage(file, templateName);
      return { imageUrl };
    } catch (error: any) {
      console.error("Image upload failed:", error);
      set.status = 500;
      return { error: "Failed to upload image" };
    }
  })
  // Create template (content_manager+)
  .post("/api/admin/templates", async ({ user, body, set }) => {
    if (!user || (user.role !== "admin" && user.role !== "content_manager")) {
      set.status = 403;
      return { error: "Access denied" };
    }

    const { name, content, clsContent, description, zipFile } = body as {
      name: string;
      content?: string;
      clsContent?: string;
      description?: string;
      zipFile?: File;
    };

    let finalContent = content || "";
    let finalClsContent = clsContent || "";

    // 1. Handle ZIP Upload (Extract to FS + Get Content)
    if (zipFile) {
      try {
        const buffer = Buffer.from(await zipFile.arrayBuffer());
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        // Sanitize name for folder
        const safeName = name.replace(/[^a-zA-Z0-9]/g, "");
        const templateDir = join(process.cwd(), "templates", safeName);

        // Ensure directory exists (and clean it if it exists?)
        if (existsSync(templateDir)) {
          await rm(templateDir, { recursive: true, force: true });
        }
        await mkdir(templateDir, { recursive: true });

        // Extract ALL contents to templates/<safeName>/
        zip.extractAllTo(templateDir, true);

        // Read main.tex for DB
        const mainTex = zipEntries.find((entry: any) => entry.entryName === "main.tex" || entry.entryName.endsWith("main.tex"));
        if (mainTex) {
          finalContent = zip.readAsText(mainTex);
        } else {
          set.status = 400;
          return { error: "ZIP must contain main.tex" };
        }

        // Read .cls for DB
        const clsFile = zipEntries.find((entry: any) => entry.entryName.endsWith(".cls"));
        if (clsFile) {
          finalClsContent = zip.readAsText(clsFile);
        }

      } catch (e: any) {
        console.error("ZIP extraction failed:", e);
        set.status = 400;
        return { error: "Failed to read ZIP file: " + e.message };
      }
    }

    if (!finalContent) {
      set.status = 400;
      return { error: "Template content is required (either via text or main.tex in ZIP)" };
    }

    // Try to create template
    try {
      const template = await prisma.template.create({
        data: {
          name,
          content: finalContent,
          clsContent: finalClsContent || null,
          description,
        },
      });

      return { template };
    } catch (error: any) {
      if (error.code === 'P2002') {
        set.status = 409;
        return { error: "A template with this name already exists" };
      }
      console.error("Create template error:", error);
      set.status = 500;
      return { error: "Failed to create template" };
    }
  })

  // Update template (content_manager+)
  .put("/api/admin/templates/:id", async ({ user, params, body, set }) => {
    if (!user || (user.role !== "admin" && user.role !== "content_manager")) {
      set.status = 403;
      return { error: "Access denied" };
    }

    const { name, content, clsContent, description, isActive } = body as {
      name?: string;
      content?: string;
      clsContent?: string;
      description?: string;
      isActive?: boolean;
    };

    try {
      const template = await prisma.template.update({
        where: { id: params.id },
        data: {
          ...(name && { name }),
          ...(content && { content }),
          ...(clsContent !== undefined && { clsContent }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive }),
        },
      });
      return { template };
    } catch (error: any) {
      if (error.code === "P2025") {
        set.status = 404;
        return { error: "Template not found" };
      }
      throw error;
    }
  })
  // Delete template (content_manager+)
  .delete("/api/admin/templates/:id", async ({ user, params, set }) => {
    if (!user || (user.role !== "admin" && user.role !== "content_manager")) {
      set.status = 403;
      return { error: "Access denied" };
    }

    try {
      await prisma.template.delete({ where: { id: params.id } });
      return { success: true };
    } catch (error: any) {
      if (error.code === "P2025") {
        set.status = 404;
        return { error: "Template not found" };
      }
      throw error;
    }
  })
  // Get all users (admin only)  
  .get("/api/admin/users", async ({ user, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Access denied" };
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        aiEnabled: true,
        aiModel: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { users };
  })
  // Update user role (admin only)
  .patch("/api/admin/users/:id/role", async ({ user, params, body, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Access denied" };
    }

    const { role } = body as { role: string };
    if (!["admin", "content_manager", "user"].includes(role)) {
      set.status = 400;
      return { error: "Invalid role. Must be admin, content_manager, or user" };
    }

    // Prevent removing own admin role
    if (params.id === user.id && role !== "admin") {
      set.status = 400;
      return { error: "Cannot remove your own admin role" };
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: { role },
        select: { id: true, email: true, name: true, role: true },
      });
      return { user: updatedUser };
    } catch (error: any) {
      if (error.code === "P2025") {
        set.status = 404;
        return { error: "User not found" };
      }
      throw error;
    }
  })
  // Update user AI settings (admin only)
  .patch("/api/admin/users/:id/ai", async ({ user, params, body, set }) => {
    if (!user || user.role !== "admin") {
      set.status = 403;
      return { error: "Access denied" };
    }

    const { aiEnabled, aiModel } = body as { aiEnabled?: boolean; aiModel?: string };

    try {
      const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: {
          ...(aiEnabled !== undefined && { aiEnabled }),
          ...(aiModel && { aiModel }),
        },
        select: { id: true, email: true, name: true, aiEnabled: true, aiModel: true },
      });
      return { user: updatedUser };
    } catch (error: any) {
      if (error.code === "P2025") {
        set.status = 404;
        return { error: "User not found" };
      }
      throw error;
    }
  })
  // ============================================
  // Catch-all route for SPA (must be last!)
  // ============================================
  .get("/*", async ({ path }) => {
    // Skip API routes and static files
    if (path.startsWith("/api/") || path.startsWith("/auth/")) {
      return new Response("Not Found", { status: 404 });
    }

    // For all other routes, serve index.html (SPA routing)
    if (isProduction) {
      return Bun.file("./client/dist/index.html");
    }

    // Development mode - shouldn't hit this normally
    return new Response("In development, use the Vite dev server at http://localhost:5173", { status: 200 });
  })
  .listen(3000);

console.log(`🚀 Server is running at http://localhost:${app.server?.port}`);
