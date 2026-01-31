import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lineClient } from '@/lib/line';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Verify Vercel Cron Secret (Optional but recommended)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new NextResponse('Unauthorized', { status: 401 });
    // }

    try {
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);
        threeDaysFromNow.setHours(0, 0, 0, 0);

        const threeDaysLaterEnd = new Date(threeDaysFromNow);
        threeDaysLaterEnd.setHours(23, 59, 59, 999);

        // Find targets due in 3 days
        const targets = await prisma.learningTarget.findMany({
            where: {
                targetDate: {
                    gte: threeDaysFromNow,
                    lte: threeDaysLaterEnd
                }
            },
            include: {
                user: {
                    select: { lineUserId: true, name: true }
                },
                category: {
                    select: { title: true }
                }
            }
        });

        console.log(`Found ${targets.length} targets due on ${threeDaysFromNow.toDateString()}`);

        const results = [];

        for (const target of targets) {
            if (target.user.lineUserId) {
                const message = {
                    type: 'text',
                    text: `${target.user.name}さん\n\n「${target.category.title}」カテゴリの完了予定日（${threeDaysFromNow.toLocaleDateString()}）が近づいています。\n\n計画通りに進んでいますか？\nマイページから学習状況を確認してみましょう！\n\nhttps://lunaflow.space/student/dashboard`
                };

                try {
                    await lineClient.pushMessage(target.user.lineUserId, [message]);
                    results.push({ userId: target.userId, status: 'sent' });
                } catch (e: any) {
                    console.error(`Failed to send LINE to ${target.userId}:`, e);
                    results.push({ userId: target.userId, status: 'failed', error: e.message });
                }
            } else {
                results.push({ userId: target.userId, status: 'skipped_no_line' });
            }
        }

        return NextResponse.json({ processed: targets.length, results });

    } catch (error: any) {
        console.error("Cron Job Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
