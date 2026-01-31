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

        // 2. Check User Plan & Access
        const userPlan = authUser && !authError ?
            (await prisma.user.findUnique({ where: { email: authUser.email! }, select: { plan: true, role: true } }))
            : null;

        const isStaff = userPlan?.role === 'admin' || userPlan?.role === 'staff';
        const currentUserPlan = userPlan?.plan || 'light';

        // 3. Fetch Course
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

        // 4. Access Checks
        // Allow staff to see unpublished courses context
        if (!course.published && !isStaff) {
            return NextResponse.json({ error: 'Course not found (unpublished)' }, { status: 404 });
        }

        const allowedPlans = new Set(course.allowedPlans || []);

        if (!isStaff && allowedPlans.size > 0 && !allowedPlans.has(currentUserPlan)) {
            return NextResponse.json({ error: 'Plan upgrade required to access this course.' }, { status: 403 });
        }

        return NextResponse.json(course);

    } catch (error) {
        console.error("Course Detail API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
