import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // This is our token

        if (!code || !state) {
            return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
        }

        // 1. Verify Token (State) again
        const oneTimeToken = await prisma.oneTimeToken.findUnique({
            where: { token: state },
        });

        if (!oneTimeToken) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        if (oneTimeToken.usedAt) {
            return NextResponse.json({ error: 'Token already used' }, { status: 400 });
        }

        if (oneTimeToken.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Token expired' }, { status: 400 });
        }

        // 2. Exchange Code for Access Token
        // NOTE: In a real implementation, we would call LINE API here.
        // Since we don't have real credentials in this environment, we will Mock the profile retrieval.

        // 2. Exchange Code for Access Token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/line/callback`,
                client_id: process.env.LINE_CLIENT_ID!,
                client_secret: process.env.LINE_CHANNEL_SECRET!,
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('LINE Token Error:', errorData);
            return NextResponse.json({ error: 'Failed to exchange token', details: errorData }, { status: 400 });
        }

        const tokenData = await tokenResponse.json();

        // Get Profile
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (!profileResponse.ok) {
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 400 });
        }

        const profile = await profileResponse.json();
        const lineUserId = profile.userId;

        // 3. Check for existing link
        const existingLinearUser = await prisma.user.findUnique({
            where: { lineUserId: lineUserId },
            select: { id: true }
        });

        const targetUserId = oneTimeToken.userId;

        if (existingLinearUser) {
            if (existingLinearUser.id === targetUserId) {
                // Already linked to this user. Just consume token.
                await prisma.oneTimeToken.update({
                    where: { id: oneTimeToken.id },
                    data: { usedAt: new Date() }
                });
                // Success redirect
                const dashboardUrl = new URL('/student/dashboard', req.url);
                dashboardUrl.searchParams.set('line_linked', 'already_done');
                return NextResponse.redirect(dashboardUrl);
            } else {
                // Linked to ANOTHER user.
                // For now, return a clear error.
                return NextResponse.json({
                    error: 'Content Conflict',
                    message: 'This LINE account is already linked to another email address.'
                }, { status: 409 });
            }
        }

        // 4. Update User and Token (Fresh Link)
        await prisma.$transaction([
            prisma.user.update({
                where: { id: targetUserId },
                data: { lineUserId: lineUserId }
            }),
            prisma.oneTimeToken.update({
                where: { id: oneTimeToken.id },
                data: { usedAt: new Date() }
            })
        ]);

        // 5. Redirect to Dashboard
        const dashboardUrl = new URL('/student/dashboard', req.url);
        dashboardUrl.searchParams.set('line_linked', 'true');

        return NextResponse.redirect(dashboardUrl);

    } catch (error: any) {
        console.error('LINE Callback Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
