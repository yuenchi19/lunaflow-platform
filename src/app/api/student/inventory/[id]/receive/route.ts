import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const item = await prisma.inventoryItem.findUnique({ where: { id } });

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        if (item.assignedToUserId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updated = await prisma.inventoryItem.update({
            where: { id },
            data: {
                receivedAt: new Date(),
                // Optionally update status to IN_STOCK if that's the convention for "Active" items
                status: 'IN_STOCK'
            }
        });

        return NextResponse.json({ success: true, item: updated });

    } catch (error) {
        console.error("Receive Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
