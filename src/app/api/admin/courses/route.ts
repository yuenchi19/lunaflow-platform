import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all courses
export async function GET() {
    try {
        const courses = await prisma.course.findMany({
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { categories: true }
                },
                categories: {
                    select: {
                        blocks: {
                            select: { id: true }
                        }
                    }
                }
            }
        });

        // Calculate student count for each course
        // A student is counted if they have ANY progress record in ANY block of the course.
        // This might be heavy if users grow, but okay for now.
        const coursesWithCounts = await Promise.all(courses.map(async (course) => {
            const blockIds = course.categories.flatMap(c => c.blocks.map(b => b.id));
            let studentCount = 0;

            if (blockIds.length > 0) {
                const uniqueStudents = await prisma.userProgress.groupBy({
                    by: ['userId'],
                    where: {
                        blockId: { in: blockIds }
                    }
                });
                studentCount = uniqueStudents.length;
            }

            return {
                id: course.id,
                title: course.title,
                label: course.label,
                categoryCount: course._count.categories,
                studentCount: studentCount,
                order: course.order,
                thumbnailUrl: course.thumbnailUrl,
                published: course.published,
                allowedPlans: course.allowedPlans
            };
        }));

        return NextResponse.json(coursesWithCounts);
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new course
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, label, allowedPlans } = body;

        // Get max order to append at end
        const lastCourse = await prisma.course.findFirst({
            orderBy: { order: 'desc' }
        });
        const newOrder = (lastCourse?.order ?? 0) + 1;

        const course = await prisma.course.create({
            data: {
                title,
                label,
                allowedPlans: allowedPlans || ['light', 'standard', 'premium'], // Default all
                order: newOrder,
                published: true
            }
        });

        return NextResponse.json(course);
    } catch (error: any) {
        console.error('Error creating course:', error);
        // Expose error for debugging
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
