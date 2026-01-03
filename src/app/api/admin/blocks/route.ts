
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Handle Reorder
        if (body.action === 'reorder') {
            const { items } = body; // [{id, order}]

            await prisma.$transaction(
                items.map((item: any) =>
                    prisma.block.update({
                        where: { id: item.id },
                        data: { order: item.order }
                    })
                )
            );
            return NextResponse.json({ success: true });
        }

        // Handle Create
        const { categoryId, type, title, content, feedbackType } = body;

        // Get max order
        const lastBlock = await prisma.block.findFirst({
            where: { categoryId },
            orderBy: { order: 'desc' }
        });
        const newOrder = (lastBlock?.order ?? 0) + 1;

        // Map content to specific fields if needed, or store as JSON string in 'content' field if schema allows?
        // Schema has `content String? @db.Text` and specific columns like `videoUrl`.
        // Let's check schema details again or infer. 
        // Schema: 
        //   content      String?  @db.Text
        //   videoUrl     String?
        //   fileUrl      String?
        //   feedbackType String?

        // We will stringify the rich content into the `content` field for flexibility, 
        // but populating `videoUrl` etc might be useful for legacy or specific queries.
        // For now, let's store main configuration in `content` as JSON string.

        let videoUrl = null;
        if (type === 'video' && content?.url) videoUrl = content.url;

        const block = await prisma.block.create({
            data: {
                categoryId,
                type,
                title,
                content: JSON.stringify(content), // Store full content object as JSON
                videoUrl,
                order: newOrder,
                feedbackType: feedbackType || null
            }
        });

        // Revalidate Student Course Page
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            select: { courseId: true }
        });
        if (category) {
            revalidatePath(`/student/course/${category.courseId}`);
            revalidatePath(`/student/courses/${category.courseId}`); // Covers both singular/plural paths just in case
        }

        return NextResponse.json(block);

    } catch (error) {
        console.error("Block API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
