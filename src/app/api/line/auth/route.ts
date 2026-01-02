import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token required' }, { status: 400 });
        }

        // 1. Validate Token
        const oneTimeToken = await prisma.oneTimeToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!oneTimeToken) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
        }

        if (oneTimeToken.usedAt) {
            return NextResponse.json({ error: 'This link has already been used.' }, { status: 410 });
        }

        if (oneTimeToken.expiresAt < new Date()) {
            return NextResponse.json({ error: 'This link has expired.' }, { status: 410 });
        }

        // 2. Check User Agent
        const headersList = headers();
        const userAgent = headersList.get('user-agent') || '';
        const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

        const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";
        // Using mock ID if env not set, for development
        const CLIENT_ID = process.env.LINE_CLIENT_ID || "1234567890";
        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const REDIRECT_URI = `${BASE_URL}/api/line/callback`;
        const STATE = token; // Use token as state to pass it to callback for verification

        const lineUrl = `${LINE_AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${STATE}&scope=profile%20openid`;

        if (isMobile) {
            // Mobile: Redirect directly to LINE
            return NextResponse.redirect(lineUrl);
        } else {
            // PC: Show QR Code pointing to THIS same URL (so scanning it on mobile triggers the mobile flow)
            // We append a timestamp or similar to prevent caching issues if needed, but token is unique enough.
            const currentUrl = `${BASE_URL}/api/line/auth?token=${token}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}`;

            const html = `
          <!DOCTYPE html>
          <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>LINE連携 - QRコードスキャン</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-gray-50 flex flex-col items-center justify-center min-h-screen p-4 text-center text-slate-800 font-sans">
            <div class="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
              <h1 class="text-xl font-bold mb-2">LINE連携を開始</h1>
              <p class="text-sm text-slate-500 mb-6">スマホのカメラで以下のQRコードを読み取って、<br>LINE連携を完了させてください。</p>
              
              <div class="bg-slate-100 p-4 rounded-xl mb-6 inline-block">
                <img src="${qrUrl}" alt="QR Code" class="w-48 h-48 mix-blend-multiply" />
              </div>

              <div class="text-xs text-rose-500 font-bold bg-rose-50 p-3 rounded-lg">
                ※ 画面を閉じずにスマホで操作してください
              </div>
            </div>
          </body>
          </html>
        `;
            return new NextResponse(html, { headers: { 'content-type': 'text/html' } });
        }
    } catch (error) {
        console.error('LINE Auth Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
