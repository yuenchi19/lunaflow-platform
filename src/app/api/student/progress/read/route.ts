import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';

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

        // Update all unread feedback for this user to read
        await prisma.userProgress.updateMany({
            where: {
                userId: user.id,
                isFeedbackRead: false
            },
            data: {
                isFeedbackRead: true
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Mark Read API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
