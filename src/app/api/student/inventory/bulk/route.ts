import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { itemIds, supplier, supplierName, supplierAddress, supplierOccupation, supplierAge, idVerificationMethod, purchaseDate, costPrice } = body;

        if (!itemIds || !Array.isArray(itemIds)) {
            return NextResponse.json({ error: "Invalid Item IDs" }, { status: 400 });
        }

        // Verify ownership for all items
        // We can do a updateMany with owner check logic
        // owner means (assignedToUserId = user.id OR adminId = user.id) AND isSelfSourced = true

        await prisma.inventoryItem.updateMany({
            where: {
                id: { in: itemIds },
                assignedToUserId: user.id, // Only update items assigned to user. 
                // Note: If user is Admin acting as student, this might fail, but this is student API.
                // Assuming "Self-Sourced" items are assigned to user.
            },
            data: {
                // Legacy/Display Supplier
                supplier: supplier || undefined,

                // Kobutsusho Fields
                supplierName: supplierName || undefined,
                supplierAddress: supplierAddress || undefined,
                supplierOccupation: supplierOccupation || undefined,
                supplierAge: supplierAge ? parseInt(supplierAge) : undefined,
                idVerificationMethod: idVerificationMethod || undefined,

                // Other fields
                purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
                costPrice: costPrice ? parseInt(costPrice) : undefined,
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Bulk Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
