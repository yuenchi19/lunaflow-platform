import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Make sure lines 1-3 imports are correct context

export const dynamic = 'force-dynamic'; // Ensure cron runs dynamically

export async function GET(req: NextRequest) {
    // Basic Cron Authentication (optional but recommended for Vercel Cron)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    try {
        const now = new Date();
        const pendingFeedbacks = await prisma.userProgress.findMany({
            where: {
                feedbackContent: { not: null },
                feedbackResponse: null,
                // We process 'pending' or null status
                OR: [
                    { feedbackStatus: 'pending' },
                    { feedbackStatus: null }
                ]
            },
            include: {
                block: true
            }
        });

        const results = [];

        for (const progress of pendingFeedbacks) {
            // Only process if block is AI type
            if (progress.block.feedbackType !== 'ai') continue;

            const updatedAt = new Date(progress.updatedAt);
            const diffMs = now.getTime() - updatedAt.getTime();
            const diffMins = diffMs / (1000 * 60);

            // 1. Time Delay Check (15 mins)
            if (diffMins < 15) {
                results.push({ id: progress.id, status: 'skipped_too_soon', diffMins });
                continue;
            }

            // 2. Time Window Check (10:00 - 22:00 JST)
            // JST is UTC+9.
            // We can convert to JST string to get hour
            const jstDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
            const jstHour = jstDate.getHours();

            // Window: 10 <= hour < 22
            if (jstHour < 10 || jstHour >= 22) {
                // However, user said "Next morning 10:00 onwards sequentially"
                // If it's night, we skip.
                results.push({ id: progress.id, status: 'skipped_outside_window', jstHour });
                continue;
            }

            // Generate AI Response
            // (Using mock for now as per previous implementation, but removing signature)
            // Ideally call Gemini API here.
            // For now, I'll use a better fixed message or call Gemini if available.
            // Since User requested: "Don't reveal AI".

            const aiResponse = "提出ありがとうございます！内容を確認いたしました。\n素晴らしい気づきですね。この調子で学習を続けましょう！";

            await prisma.userProgress.update({
                where: { id: progress.id },
                data: {
                    feedbackResponse: aiResponse,
                    feedbackStatus: 'completed',
                    isFeedbackRead: false, // Mark as unread so badge appears
                    updatedAt: new Date() // Update timestamp to now? No, keep original? 
                    // Prisma updates updatedAt automatically usually.
                    // But we want to preserve submission time? 
                    // No, feedback arrival time is Now.
                }
            });

            results.push({ id: progress.id, status: 'processed' });
        }

        return NextResponse.json({ processed: results.length, details: results });

    } catch (e: any) {
        console.error("Cron Error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
