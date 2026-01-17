import { Google } from "arctic";
import { prisma } from "./db";

// Initialize Google OAuth provider
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUri = process.env.NODE_ENV === "production"
    ? `${process.env.APP_URL || "https://resumeforge-6saw.onrender.com"}/auth/google/callback`
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

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const bcrypt = await import("bcrypt");
    return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hashed password
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    const bcrypt = await import("bcrypt");
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a random verification token
 */
export function generateVerificationToken(): string {
    return crypto.randomUUID();
}

/**
 * Get expiry time for verification token (24 hours from now)
 */
export function getVerificationTokenExpiry(): Date {
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

/**
 * Get expiry time for password reset token (1 hour from now)
 */
export function getResetTokenExpiry(): Date {
    return new Date(Date.now() + 60 * 60 * 1000);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }

    return { valid: errors.length === 0, errors };
}
