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

        const targets = await prisma.learningTarget.findMany({
            where: { userId: user.id },
            select: {
                categoryId: true,
                targetDate: true
            }
        });

        // Convert to record format { categoryId: dateString }
        const targetMap: Record<string, string> = {};
        targets.forEach(t => {
            targetMap[t.categoryId] = t.targetDate.toISOString().split('T')[0];
        });

        return NextResponse.json(targetMap);

    } catch (error: any) {
        console.error("Targets API Error:", error);
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
        const { categoryId, targetDate } = body;

        if (!categoryId || !targetDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Upsert target
        const result = await prisma.learningTarget.upsert({
            where: {
                userId_categoryId: {
                    userId: user.id,
                    categoryId: categoryId
                }
            },
            update: {
                targetDate: new Date(targetDate)
            },
            create: {
                userId: user.id,
                categoryId: categoryId,
                targetDate: new Date(targetDate)
            }
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Targets Save API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
