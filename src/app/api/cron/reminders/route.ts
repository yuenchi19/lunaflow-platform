
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lineClient } from '@/lib/line-client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // 1. Authorization Check (Vercel Cron / Internal Secret)
    // We check for 'Authorization' header matching CRON_SECRET
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Fetch Settings from DB
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: ['line_reminder_enabled', 'line_reminder_days', 'line_reminder_template']
                }
            }
        });

        const enabled = settings.find(s => s.key === 'line_reminder_enabled')?.value === 'true';
        if (!enabled) {
            return NextResponse.json({ message: 'Reminders are disabled.', skipped: true });
        }

        const days = parseInt(settings.find(s => s.key === 'line_reminder_days')?.value || '7', 10);
        let template = settings.find(s => s.key === 'line_reminder_template')?.value ||
            "お久しぶりです！\n最近ログインされていないようです。\n学習の進捗はいかがでしょうか？\n\n[Login URL]";

        const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "https://example.com";
        template = template.replace('[Login URL]', loginUrl);

        // 3. Find Inactive Users
        // Logic: 
        // - Linked to LINE
        // - Last login > X days ago
        // - (Last Reminder IS NULL) OR (Last Reminder > X days ago) -- avoiding daily spam

        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - days);

        const inactiveUsers = await prisma.user.findMany({
            where: {
                lineUserId: { not: null },
                lastLoginDate: {
                    lt: thresholdDate
                },
                OR: [
                    { lastLineReminderSentAt: null },
                    { lastLineReminderSentAt: { lt: thresholdDate } }
                ]
            }
        });

        if (inactiveUsers.length === 0) {
            return NextResponse.json({ message: 'No users require reminders.', count: 0 });
        }

        console.log(`[Cron] Sending LINE reminders to ${inactiveUsers.length} users...`);

        // 4. Send Messages
        let successCount = 0;
        let failCount = 0;

        // Vercel Serverless Function Limit considerations:
        // If user count is huge, we might need to batch or offload.
        // For MVP, simple iteration is fine. 
        // We use sequential processing to ensure DB updates track correctly and avoid rate limits.

        for (const user of inactiveUsers) {
            if (!user.lineUserId || !lineClient) continue;

            try {
                await lineClient.pushMessage(user.lineUserId, {
                    type: 'text',
                    text: template
                });

                // Update Reminder Log
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLineReminderSentAt: new Date() }
                });

                successCount++;
            } catch (error) {
                console.error(`Failed to send reminder to ${user.id}:`, error);
                failCount++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: inactiveUsers.length,
            sent: successCount,
            failed: failCount
        });

    } catch (error) {
        console.error('Cron Reminder Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
