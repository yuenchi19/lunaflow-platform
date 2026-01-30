import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const courseId = params.id;

        // 1. Fetch Source Course with deep relations
        const sourceCourse = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                categories: {
                    include: {
                        blocks: true
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!sourceCourse) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // Determine new order (at the end)
        const lastCourse = await prisma.course.findFirst({
            orderBy: { order: 'desc' },
            select: { order: true }
        });
        const newOrder = (lastCourse?.order ?? 0) + 1;

        // 2. Transactional Deep Copy
        const result = await prisma.$transaction(async (tx) => {
            // Create New Course
            const newCourse = await tx.course.create({
                data: {
                    title: `${sourceCourse.title} (コピー)`,
                    description: sourceCourse.description,
                    label: sourceCourse.label,
                    thumbnailUrl: sourceCourse.thumbnailUrl,
                    order: newOrder,
                    published: false, // Default to draft
                    allowedPlans: sourceCourse.allowedPlans,
                }
            });

            // Recreate Categories and Blocks
            for (const category of sourceCourse.categories) {
                const newCategory = await tx.category.create({
                    data: {
                        courseId: newCourse.id,
                        title: category.title,
                        order: category.order,
                        published: category.published,
                    }
                });

                // Create Blocks for this Category
                if (category.blocks.length > 0) {
                    await tx.block.createMany({
                        data: category.blocks.map(block => ({
                            categoryId: newCategory.id,
                            title: block.title,
                            type: block.type,
                            content: block.content,
                            videoUrl: block.videoUrl,
                            fileUrl: block.fileUrl,
                            order: block.order,
                            feedbackType: block.feedbackType,
                        }))
                    });
                }
            }

            return newCourse;
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error duplicating course:', error);
        return NextResponse.json({ error: 'Failed to duplicate course' }, { status: 500 });
    }
}
