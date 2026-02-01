
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import CourseDashboard from "@/components/student/CourseDashboard";
import { prisma } from "@/lib/prisma";
import { MOCK_USERS } from "@/lib/data";

// Refresh every 0 seconds (always fresh)
export const revalidate = 0;

export default async function StudentCoursePage({ params }: { params: { id: string } }) {
    // 1. Resolve User (Real Auth -> Mock Fallback)
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
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing tokens.
                    }
                },
            },
        }
    );

    let userId: string | null = null;

    // Try Real Auth
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
            const dbUser = await prisma.user.findUnique({
                where: { email: authUser.email },
                select: { id: true }
            });
            if (dbUser) {
                userId = dbUser.id;
            }
        }
    } catch (e) {
        console.warn("Auth check failed:", e);
    }

    // Fallback to Mock if no real user found (Dev/Emergency)
    if (!userId) {
        const mockEmail = MOCK_USERS[0].email;
        const mockUser = await prisma.user.findUnique({
            where: { email: mockEmail },
            select: { id: true }
        });
        if (mockUser) {
            userId = mockUser.id;
        }
    }

    // Checking if we still don't have a user
    if (!userId) {
        // If we really can't find a user, we should probably redirect to login or show a generic preview.
        // For now, let's treat it as "Preview Mode" with no progress.
        // We do trigger a "User not found" error if strict, but let's be lenient for preview.
        // We can just pass a dummy ID that won't match any progress.
        console.warn("User not found in DB. Entering Preview Mode.");
        userId = "preview-guest";
    }

    const courseId = params.id;

    // 2. Fetch Data in Parallel
    const [courseData, progressData, targetsData] = await Promise.all([
        // Course
        prisma.course.findUnique({
            where: { id: courseId },
            include: {
                categories: {
                    include: { blocks: true },
                    orderBy: { order: 'asc' }
                }
            }
        }),
        // Progress (Empty if guest)
        prisma.userProgress.findMany({
            where: {
                userId: userId,
                block: {
                    category: {
                        courseId: courseId
                    }
                }
            }
        }),
        // Targets (Empty if guest)
        prisma.learningTarget.findMany({
            where: { userId: userId }
        })
    ]);

    if (!courseData) {
        return <div className="p-10 text-center">Course not found</div>;
    }

    // 3. Serialize Data
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
