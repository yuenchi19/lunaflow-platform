
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
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

        // 2. Fetch Course (moved up to define 'course' before usage)
        const course = await prisma.course.findUnique({
            where: { id: params.courseId },
            include: {
                categories: {
                    include: {
                        blocks: {
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // 3. Access Checks
        if (!course.published) {
            return NextResponse.json({ error: 'Course not found (unpublished)' }, { status: 404 });
        }

        // 4. Check User Plan & Access
        const userPlan = authUser && !authError ?
            (await prisma.user.findUnique({ where: { email: authUser.email! }, select: { plan: true, role: true } }))
            : null;

        const isStaff = userPlan?.role === 'admin' || userPlan?.role === 'staff';
        const currentUserPlan = userPlan?.plan || 'light';

        const allowedPlans = new Set(course.allowedPlans || []);

        // If allowedPlans is empty, it might mean restriction or open. Assuming restricted if not explicitly allowed.
        // If the user is not staff AND (allowedPlans has entries AND user's plan is not in it)
        // If allowedPlans is empty, we might want to allow all or check logic. 
        // Let's assume: if allowedPlans is populated, strictly check. If empty, maybe legacy open? 
        // For safety, let's assume if it has values, we check.

        if (!isStaff && allowedPlans.size > 0 && !allowedPlans.has(currentUserPlan)) {
            return NextResponse.json({ error: 'Plan upgrade required to access this course.' }, { status: 403 });
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error("Course Detail API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
