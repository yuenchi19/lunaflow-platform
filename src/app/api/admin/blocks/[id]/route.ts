
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

        return NextResponse.json(updatedBlock);
    } catch (error) {
        console.error("Block Update Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.block.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
