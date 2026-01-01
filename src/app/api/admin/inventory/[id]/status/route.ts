import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await req.json();
        const { status, assignedToUserId, note } = body;

        // Validation based on status
        if (status === 'ASSIGNED' && !assignedToUserId) {
            return NextResponse.json({ error: "User ID is required when status is ASSIGNED" }, { status: 400 });
        }

        const item = await prisma.inventoryItem.findUnique({ where: { id } });
        if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

        // User restriction Logic:
        // If current status is SHIPPED, and we are NOT returning (i.e. not setting to RETURNED or IN_STOCK), reject user change.
        if (item.status === 'SHIPPED') {
            if (status !== 'RETURNED' && status !== 'IN_STOCK' && status !== 'SHIPPED') {
                // Trying to change to ASSIGNED or something else?
                // Or if status IS SHIPPED but different user?
                if (assignedToUserId && assignedToUserId !== item.assignedToUserId) {
                    return NextResponse.json({ error: "Cannot change user for SHIPPED item. Process Return first." }, { status: 400 });
                }
            }
        }

        const updateData: any = { status };
        if (assignedToUserId) updateData.assignedToUserId = assignedToUserId;
        if (note) updateData.note = note;

        // If setting to IN_STOCK or RETURNED, maybe clear user?
        // User said "Return procedure".
        if (status === 'IN_STOCK' || status === 'RETURNED') {
            updateData.assignedToUserId = null;
        }

        const updated = await prisma.inventoryItem.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updated);

    } catch (error: any) {
        console.error("Update Inventory Status Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
