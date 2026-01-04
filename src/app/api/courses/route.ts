
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
        // 1. Get Auth User
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        let userTier = 1; // Default: Light/Guest

        if (authUser && !authError) {
            // 2. Get DB User to check Plan
            const user = await prisma.user.findUnique({
                where: { email: authUser.email! },
                select: { plan: true }
            });

            if (user && user.plan) {
                // Simply use the plan directly, no need for tier logic mapping anymore if we trust the plan strings
                // But for safety/normalization we could still normalize it
                userTier = 1; // Keeping userTier just in case downstream needs it, but mostly we need plan string
            }
        }

        // 3. Filter Courses
        // We need to know the user's plan to check against allowedPlans
        // But since we can't access 'user' here, we should fetch it properly or use a let variable

        let currentUserPlan = 'light'; // Default
        if (authUser && !authError) {
            const user = await prisma.user.findUnique({
                where: { email: authUser.email! },
                select: { plan: true }
            });
            if (user?.plan) currentUserPlan = user.plan;
        }

        const courses = await prisma.course.findMany({
            where: {
                published: true,
                allowedPlans: {
                    has: currentUserPlan
                }
            },
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { categories: true }
                }
            }
        });

        const formatted = courses.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            thumbnailUrl: c.thumbnailUrl,
            categoryCount: c._count.categories,
            allowedPlans: c.allowedPlans
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Courses API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
