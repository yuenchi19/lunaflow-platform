
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { title, isPublic } = body; // isPublic not in schema yet? Check schema.

        // Schema check: Category has `title`. `isPublic`??
        // Prisma schema in Step 1096:
        // model Category { id, courseId, title, order, ... }
        // It does NOT have `isPublic` or `published`.
        // Wait, the UI has "Toggle Public".
        // I should check if I need to add `published` to Category schema too?
        // UI says: "公開中" / "非公開"

        // For now, I will update Title. If schema lacks published, I should add it or ignore.
        // Let's assume I need to add it if the UI relies on it.
        // Checking schema again... NO `published` on Category.
        // I will add it to Schema in next step if generic update fails.
        // For now, let's just support Title.

        const updated = await prisma.category.update({
            where: { id: params.id },
            data: {
                title
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.category.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
