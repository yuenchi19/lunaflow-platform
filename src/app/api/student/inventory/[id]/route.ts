import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;

        // Fetch item to verify ownership and status
        const item = await prisma.inventoryItem.findUnique({
            where: { id }
        });

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // Strict Permission Check
        // 1. Must be Self-Sourced
        // 2. Must be Owned by User (assignedToUserId or adminId)
        // 3. Must NOT be SOLD

        // @ts-ignore
        if (!item.isSelfSourced) {
            return NextResponse.json({ error: "Cannot delete items provided by school" }, { status: 403 });
        }

        if (item.assignedToUserId !== user.id && item.adminId !== user.id) {
            return NextResponse.json({ error: "You do not have permission to delete this item" }, { status: 403 });
        }

        if (item.status === 'SOLD') {
            return NextResponse.json({ error: "Cannot delete sold items" }, { status: 400 });
        }

        // Proceed to Delete
        await prisma.inventoryItem.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete Inventory Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
