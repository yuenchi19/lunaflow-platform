
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

    // Must meet Plan requirement
    const userPlan = authUser && !authError ?
        (await prisma.user.findUnique({ where: { email: authUser.email! }, select: { plan: true, role: true } }))
        : null;

    const isStaff = userPlan?.role === 'admin' || userPlan?.role === 'staff';
    const currentUserPlan = userPlan?.plan || 'light'; // Default to light if no plan found? Or deny? Assuming light for guest/free fallback if architecture allows, but usually restricted.

    // Check if plan is allowed
    const allowedPlans = new Set(course.allowedPlans || []);

    // If allowedPlans is empty, assume accessible to all (or none? usually none if strict). 
    // Based on previous logic, let's assume if it's not set, we default to accessible or check existing logic.
    // Actually, schema migration added default [], so we should check inclusion.

    if (!isStaff && !allowedPlans.has(currentUserPlan)) {
        return NextResponse.json({ error: 'Plan upgrade required to access this course.' }, { status: 403 });
    }

    return NextResponse.json(course);
} catch (error) {
    console.error("Course Detail API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
}
