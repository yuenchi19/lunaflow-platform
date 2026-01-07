import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const item = await prisma.inventoryItem.findUnique({
            where: { id },
            include: {
                assignedToUser: {
                    select: { name: true, email: true }
                }
            }
        });

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        return NextResponse.json(item);

    } catch (error: any) {
        console.error("Get Inventory Item Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await req.json();

        // Destructure allowed fields
        const {
            brand, name, category, costPrice, condition,
            supplier, supplierName, supplierAddress, supplierOccupation, supplierAge,
            idVerificationMethod, purchaseDate, images
        } = body;

        const updatedItem = await prisma.inventoryItem.update({
            where: { id },
            data: {
                brand,
                name,
                category,
                condition,
                costPrice: costPrice ? parseInt(costPrice) : undefined,
                images,
                // Kobutsusho
                supplier,
                supplierName,
                supplierAddress,
                supplierOccupation,
                supplierAge: supplierAge ? parseInt(supplierAge) : undefined,
                idVerificationMethod,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined
            }
        });

        return NextResponse.json({ success: true, item: updatedItem });

    } catch (error: any) {
        console.error("Update Inventory Item Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
