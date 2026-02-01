
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CourseDashboard from "@/components/student/CourseDashboard";
import { prisma } from "@/lib/prisma";
import { MOCK_USERS } from "@/lib/data";

// Refresh every 0 seconds (always fresh)
export const revalidate = 0;

export default async function StudentCoursePage({ params }: { params: { id: string } }) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                    } catch { }
                },
            },
        }
    );

    let userId: string | null = null;
    let userRole = 'student';

    // 1. Strict Auth Check
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        // GUEST DETECTED -> BLOCK ACCESS
        // Try fallback to Local Mock (Dev Environment Only)
        // If in Production, this is a SECURITY RISK if we default to mock.
        // We will ONLY allow mock fallback if we clearly are in a dev scenario or if the user is clearly a dev.
        // But for safety:
        return redirect('/login?error=login_required');
    }

    // 2. Resolve Database User
    if (authUser?.email) {
        const dbUser = await prisma.user.findUnique({
            where: { email: authUser.email },
            select: { id: true, role: true }
        });

        if (dbUser) {
            userId = dbUser.id;
            userRole = dbUser.role;
        }
    }

    // 3. Handle "User Missing in DB" (Edge Case)
    if (!userId) {
        // Only allow Preview if Admin/Staff
        const metadataRole = authUser.user_metadata?.role || 'student';
        if (metadataRole === 'admin' || metadataRole === 'staff') {
            console.warn(`Admin/Staff user ${authUser.email} missing in DB. Allowing Preview Mode.`);
            userId = "preview-admin";
        } else {
            // Student missing in DB -> Block
            console.error(`Student user ${authUser.email} missing in DB. Blocking access.`);
            return <div className="p-10 text-center text-rose-600">
                Account setup incomplete. Please contact support.<br />
                (User ID missing)
            </div>;
        }
    }

    // ... Fetch Data using userId ...
    const courseId = params.id;

    const [courseData, progressData, targetsData] = await Promise.all([
        prisma.course.findUnique({
            where: { id: courseId },
            include: {
                categories: {
                    include: { blocks: true },
                    orderBy: { order: 'asc' }
                }
            }
        }),
        prisma.userProgress.findMany({
            where: {
                userId: userId,
                block: { category: { courseId: courseId } }
            }
        }),
        prisma.learningTarget.findMany({
            where: { userId: userId }
        })
    ]);

    if (!courseData) {
        return <div className="p-10 text-center">Course not found</div>;
    }

    const serializedCourse = JSON.parse(JSON.stringify(courseData));
    const serializedProgress = progressData.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        completedAt: p.completedAt?.toISOString() || null
    }));

    const targetMap: Record<string, string> = {};
    targetsData.forEach(t => {
        targetMap[t.categoryId] = t.targetDate.toISOString().split('T')[0];
    });

    return (
        <CourseDashboard
            courseId={courseId}
            initialCourse={serializedCourse}
            initialProgress={serializedProgress}
            initialTargets={targetMap}
        />
    );
}
