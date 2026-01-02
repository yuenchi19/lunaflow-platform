import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();
        const { sellPrice, sellDate, shippingCost, platformFee, note } = body;

        if (!sellPrice || !sellDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Fetch the item to check ownership and get cost price
        const item = await prisma.inventoryItem.findUnique({
            where: { id }
        });

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        // Verify ownership (either created by or assigned to)
        if (item.adminId !== user.id && item.assignedToUserId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const cost = item.costPrice;
        const sale = Number(sellPrice);
        const shipping = Number(shippingCost) || 0;
        const fee = Number(platformFee) || 0;

        // Profit Calculation = Sales - Cost - Shipping - Fee
        const profit = sale - cost - shipping - fee;

        // Transaction: Update Item and Create Ledger Entry
        const [updatedItem, ledgerEntry] = await prisma.$transaction([
            prisma.inventoryItem.update({
                where: { id },
                data: {
                    status: 'SOLD',
                    updatedAt: new Date(),
                    note: note ? `${item.note || ''}\n[Sold Note]: ${note}` : item.note
                }
            }),
            prisma.ledgerEntry.create({
                data: {
                    userId: user.id,
                    originItemId: item.id,
                    brand: item.brand,
                    purchaseDate: item.createdAt, // Using item creation as purchase date
                    purchasePrice: cost,
                    images: item.images,
                    sellDate: new Date(sellDate),
                    sellPrice: sale,
                    shippingCost: shipping,
                    platformFee: fee,
                    profit: profit,
                    status: 'SOLD'
                }
            })
        ]);

        return NextResponse.json({ item: updatedItem, ledger: ledgerEntry });

    } catch (error: any) {
        console.error("Sell Item Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
