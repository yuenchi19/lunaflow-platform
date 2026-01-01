import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ItemStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { itemIds, assignedToUserId, status } = body;

        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return NextResponse.json({ error: "No items selected" }, { status: 400 });
        }

        if (!assignedToUserId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Fetch Items to check status logic
        const items = await prisma.inventoryItem.findMany({
            where: { id: { in: itemIds } }
        });

        // Filter valid items (e.g., skip SHIPPED items if we are Assigning)
        // If status is ASSIGNED, we can only update items that are NOT SHIPPED/SOLD/RETURNED (or we can overwrite? Standard flow usually from IN_STOCK)
        // Let's say we can re-assign ASSIGNED items too. But NOT SHIPPED.
        const validItemIds = items
            .filter(item => item.status !== ItemStatus.SHIPPED && item.status !== ItemStatus.SOLD && item.status !== ItemStatus.RETURNED)
            .map(item => item.id);

        if (validItemIds.length === 0) {
            return NextResponse.json({ error: "No eligible items for assignment (items might be shipped or sold)" }, { status: 400 });
        }

        const updated = await prisma.inventoryItem.updateMany({
            where: { id: { in: validItemIds } },
            data: {
                status: ItemStatus.ASSIGNED,
                assignedToUserId: assignedToUserId,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            count: updated.count,
            message: `${updated.count} items assigned successfully`
        });

    } catch (error: any) {
        console.error("Bulk Assign Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
