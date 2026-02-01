import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // No-op for read-only user check in API route
                },
            },
        }
    );

    try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! },
            select: { id: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const progress = await prisma.userProgress.findMany({
            where: { userId: user.id },
            select: {
                blockId: true,
                status: true,
                feedbackContent: true,
                feedbackStatus: true,
                feedbackResponse: true,
                completedAt: true
            }
        });

        return NextResponse.json(progress);

    } catch (error: any) {
        console.error("Progress API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // No-op
                },
            },
        }
    );

    try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! },
            select: { id: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const { blockId, status, feedbackContent } = body;

        if (!blockId || !status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch block to check settings
        const block = await prisma.block.findUnique({
            where: { id: blockId },
            select: { feedbackType: true }
        });

        let feedbackResponse = undefined;
        let feedbackStatus = feedbackContent ? 'pending' : undefined;

        if (block?.feedbackType === 'ai' && feedbackContent) {
            // Immediate AI Response (No Cron)
            feedbackResponse = "提出ありがとうございます！内容を確認いたしました。\n素晴らしい気づきですね。この調子で学習を続けましょう！";
            feedbackStatus = 'completed';
        }

        const result = await prisma.userProgress.upsert({
            where: {
                userId_blockId: {
                    userId: user.id,
                    blockId: blockId
                }
            },
            update: {
                status,
                completedAt: status === 'completed' ? new Date() : undefined,
                feedbackContent: feedbackContent || undefined,
                feedbackResponse: feedbackResponse,
                feedbackStatus: feedbackStatus,
                isFeedbackRead: feedbackResponse ? false : undefined
            },
            create: {
                userId: user.id,
                blockId,
                status,
                completedAt: status === 'completed' ? new Date() : undefined,
                feedbackContent: feedbackContent || undefined,
                feedbackResponse: feedbackResponse,
                feedbackStatus: feedbackStatus,
                isFeedbackRead: feedbackResponse ? false : undefined
            }
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Progress Save API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
