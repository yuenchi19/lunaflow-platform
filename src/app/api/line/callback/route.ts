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

        /*
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/line/callback`,
                client_id: process.env.LINE_CLIENT_ID!,
                client_secret: process.env.LINE_CLIENT_SECRET!,
            }),
        });
        const tokenData = await tokenResponse.json();
        if (tokenData.error) throw new Error(tokenData.error_description);
        
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileResponse.json();
        const lineUserId = profile.userId;
        */

        // MOCK DATA for logic verification
        const mockLineUserId = `line_user_${Date.now().toString().slice(-6)}`;

        // 3. Update User and Token
        await prisma.$transaction([
            prisma.user.update({
                where: { id: oneTimeToken.userId },
                data: { lineUserId: mockLineUserId }
            }),
            prisma.oneTimeToken.update({
                where: { id: oneTimeToken.id },
                data: { usedAt: new Date() }
            })
        ]);

        // 4. Redirect to Dashboard with success flag
        // The user requested: "Automatically redirect to the official LINE talk screen... or the top page of the learning site."
        // We redirect to the student dashboard.
        const dashboardUrl = new URL('/student/dashboard', req.url);
        dashboardUrl.searchParams.set('line_linked', 'true');

        return NextResponse.redirect(dashboardUrl);

    } catch (error) {
        console.error('LINE Callback Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
