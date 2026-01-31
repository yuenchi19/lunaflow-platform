
import CourseDashboard from "@/components/student/CourseDashboard";
import { prisma } from "@/lib/prisma";
import { MOCK_USERS } from "@/lib/data";

// Refresh every 0 seconds (always fresh) or 60s. For a dashboard, 0 is safer.
export const revalidate = 0;

export default async function StudentCoursePage({ params }: { params: { id: string } }) {
    // 1. Emulate Auth (Match client-side mock)
    const mockEmail = MOCK_USERS[0].email;
    const user = await prisma.user.findUnique({
        where: { email: mockEmail },
        select: { id: true }
    });

    if (!user) {
        return <div className="p-10 text-center">User not found (Mock Setup Error)</div>;
    }

    const courseId = params.id;
    const userId = user.id;

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
        // Progress
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
        // Targets
        prisma.learningTarget.findMany({
            where: { userId: userId }
        })
    ]);

    if (!courseData) {
        return <div className="p-10 text-center">Course not found</div>;
    }

    // Refetch targets constrained by category if needed, but fetching all for user is okay if not too many.
    // Better: Fetch targets for this user.
    const userTargets = await prisma.learningTarget.findMany({
        where: { userId: userId }
    });


    // 3. Serialize Data (Convert Dates to Strings)
    // Course
    const serializedCourse = JSON.parse(JSON.stringify(courseData));

    // Progress (Convert Date objects to strings)
    const serializedProgress = progressData.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        completedAt: p.completedAt?.toISOString() || null
    }));

    // Targets (Convert to Record<string, string>)
    const targetMap: Record<string, string> = {};
    userTargets.forEach(t => {
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
