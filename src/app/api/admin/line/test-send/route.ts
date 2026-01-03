
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lineClient } from '@/lib/line-client';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
        });

        if (!dbUser || !dbUser.lineUserId) {
            return NextResponse.json({ error: 'LINE integration not found for this user.' }, { status: 400 });
        }

        if (!lineClient) {
            return NextResponse.json({ error: 'LINE Client not configured (Missing Enviroment Variables).' }, { status: 500 });
        }

        // Fetch template from DB
        const templateSetting = await prisma.systemSetting.findUnique({
            where: { key: 'line_reminder_template' }
        });

        let messageText = templateSetting?.value || "テストメッセージです。\nこれはリマインダーのテスト配信です。";

        // Replace placeholders if any
        messageText = messageText.replace('[Login URL]', process.env.NEXT_PUBLIC_APP_URL || 'https://example.com');

        await lineClient.pushMessage(dbUser.lineUserId, {
            type: 'text',
            text: messageText,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to send LINE test message', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
