import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Generates a magic link token for LINE integration.
 * @param userId The ID of the user to generate the token for.
 * @param expiresInHours Evaluation time in hours (default: 72).
 * @returns The generated token string.
 */
export async function generateLineMagicLinkToken(userId: string, expiresInHours: number = 72): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    await prisma.oneTimeToken.create({
        data: {
            token,
            userId,
            type: "line_auth",
            expiresAt,
        },
    });

    return token;
}

/**
 * Generates the full Magic Link URL to be embedded in emails.
 */
export async function generateLineMagicLinkUrl(userId: string): Promise<string> {
    const token = await generateLineMagicLinkToken(userId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/line/auth?token=${token}`;
}
