
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

        let userTier = 1; // Default: Light/Guest

        if (authUser && !authError) {
            // 2. Get DB User to check Plan and Role
            const user = await prisma.user.findUnique({
                where: { email: authUser.email! },
                select: { plan: true, role: true }
            });

            if (user) {
                // Admin and Staff bypass tier restrictions (treat as Premium)
                if (user.role === 'admin' || user.role === 'staff') {
                    userTier = 3;
                } else if (user.plan) {
                    switch (user.plan.toLowerCase()) {
                        case 'premium':
                            userTier = 3;
                            break;
                        case 'standard':
                            userTier = 2;
                            break;
                        case 'light':
                        default:
                            userTier = 1;
                            break;
                    }
                }
            }
        }

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
        // Must be published (unless admin, but admin has separate API)
        if (!course.published) {
            return NextResponse.json({ error: 'Course not found (unpublished)' }, { status: 404 });
        }

        // Must meet Tier requirement
        const minTier = course.minTier || 1;
        if (minTier > userTier) {
            return NextResponse.json({ error: 'Plan upgrade required to access this course.' }, { status: 403 });
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error("Course Detail API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
