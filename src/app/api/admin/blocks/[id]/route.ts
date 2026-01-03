import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { title, content, type, feedbackType } = body;

        let videoUrl = null;
        if (type === 'video' && content?.url) videoUrl = content.url;

        const updatedBlock = await prisma.block.update({
            where: { id: params.id },
            data: {
                title,
                content: JSON.stringify(content),
                videoUrl,
                feedbackType: feedbackType || null
            }
        });

        // Revalidate
        const category = await prisma.category.findUnique({
            where: { id: updatedBlock.categoryId },
            select: { courseId: true }
        });
        if (category) {
            revalidatePath(`/student/course/${category.courseId}`);
            revalidatePath(`/student/courses/${category.courseId}`);
        }

        return NextResponse.json(updatedBlock);
    } catch (error) {
        console.error("Block Update Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        // Fetch before delete to get context
        const block = await prisma.block.findUnique({
            where: { id: params.id },
            include: { category: true }
        });

        await prisma.block.delete({
            where: { id: params.id }
        });

        if (block?.category) {
            revalidatePath(`/student/course/${block.category.courseId}`);
            revalidatePath(`/student/courses/${block.category.courseId}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
