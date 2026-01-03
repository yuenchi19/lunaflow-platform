
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { title, target, status, content, date } = body;
        const publishedAt = date ? new Date(date) : undefined;

        const updated = await prisma.announcement.update({
            where: { id: params.id },
            data: {
                title,
                target,
                status,
                content,
                publishedAt
            }
        });

        return NextResponse.json({
            id: updated.id,
            title: updated.title,
            target: updated.target,
            date: updated.publishedAt.toISOString().split('T')[0],
            status: updated.status,
            content: updated.content
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update news' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.announcement.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete news' }, { status: 500 });
    }
}
