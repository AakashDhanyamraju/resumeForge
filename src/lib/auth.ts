import { Google } from "arctic";
import { prisma } from "./db";

// Initialize Google OAuth provider
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUri = process.env.NODE_ENV === "production"
    ? `${process.env.APP_URL || "http://localhost"}/auth/google/callback`
    : "http://localhost/auth/google/callback";

export const google = new Google(googleClientId, googleClientSecret, redirectUri);

/**
 * Create a new session for a user
 */
export async function createSession(userId: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    const session = await prisma.session.create({
        data: {
            userId,
            expiresAt,
        },
    });

    return session;
}

/**
 * Validate a session and return the user if valid
 */
export async function validateSession(sessionId: string) {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
    });

    if (!session) {
        return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: sessionId } });
        return null;
    }

    return session.user;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionId: string) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
        // Session might not exist, ignore error
    });
}

/**
 * Delete all expired sessions (cleanup utility)
 */
export async function deleteExpiredSessions() {
    await prisma.session.deleteMany({
        where: {
            expiresAt: { lt: new Date() },
        },
    });
}
