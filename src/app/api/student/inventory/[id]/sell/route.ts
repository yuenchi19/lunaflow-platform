
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
        const { sellPrice, sellDate, shippingCost, platformFee, note, salePlatform, saleNote } = body;

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
                    sellingPrice: sale, // Update selling price on item too
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
                    salePlatform: salePlatform,
                    saleNote: saleNote,
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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const itemId = params.id;
        const body = await req.json();
        const { sellPrice, sellDate, shippingCost, platformFee, note, salePlatform, saleNote } = body;

        // Verify ownership
        const item = await prisma.inventoryItem.findUnique({
            where: { id: itemId }
        });

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        if (item.adminId !== user.id && item.assignedToUserId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const cost = item.costPrice;
        const sale = Number(sellPrice);
        const shipping = Number(shippingCost) || 0;
        const fee = Number(platformFee) || 0;
        const profit = sale - cost - shipping - fee;

        // Update Ledger logic
        // Find existing ledger entry by originItemId
        const existingLedger = await prisma.ledgerEntry.findFirst({
            where: { originItemId: itemId }
        });

        let ledgerEntry;
        if (existingLedger) {
            ledgerEntry = await prisma.ledgerEntry.update({
                where: { id: existingLedger.id },
                data: {
                    sellPrice: sale,
                    sellDate: new Date(sellDate),
                    shippingCost: shipping,
                    platformFee: fee,
                    profit: profit,
                    salePlatform: salePlatform,
                    saleNote: saleNote
                }
            });
        } else {
            // Fallback create
            ledgerEntry = await prisma.ledgerEntry.create({
                data: {
                    userId: user.id,
                    originItemId: itemId,
                    brand: item.brand,
                    purchaseDate: item.createdAt,
                    purchasePrice: cost,
                    images: item.images,
                    sellDate: new Date(sellDate),
                    sellPrice: sale,
                    shippingCost: shipping,
                    platformFee: fee,
                    profit: profit,
                    salePlatform,
                    saleNote,
                    status: 'SOLD'
                }
            });
        }

        const updatedItem = await prisma.inventoryItem.update({
            where: { id: itemId },
            data: {
                sellingPrice: sale,
                status: 'SOLD'
            }
        });

        return NextResponse.json({ item: updatedItem, ledger: ledgerEntry });

    } catch (error: any) {
        console.error("Update Sale Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
