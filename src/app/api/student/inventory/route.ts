import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            brand,
            name,
            category,
            costPrice,
            images,
            damageImages,
            condition,
            hasAccessories,
            accessories,
            note
        } = body;

        // Validation
        if (!brand || !costPrice || !images || images.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Calculate Selling Price (Cost + 15%)
        const sellingPrice = Math.floor(costPrice * 1.15);

        // Verify user exists in DB to resolve relation if needed (though we might not link *creator* explicitly in this schema except via logs? 
        // Schema has `adminId` but this is a STUDENT submitting. 
        // Wait, the schema `InventoryItem` has `adminId String`. 
        // If a student submits, who is the `adminId`? 
        // Maybe we should allow `adminId` to be nullable or store `userId` of creator?
        // OR is this actually an "Admin" function that the user wants "Students" (who might be staff/partners) to use?
        // The prompt says "Student input screen".
        // Use `adminId` for the User ID for now, or assume this is a 'Purchase Request' flow?
        // "Inventory Management" usually implies company stock.
        // If a student sends it, it might be a 'Purchase Request' or 'Trade-in'. 
        // But the prompt says "Inventory Management... Student input screen".
        // I will assume the student is acting as a supplier or staff.
        // I'll populate `adminId` with the User's ID for now, but `adminId` implies Admin. 
        // Let's check Schema `adminId` again. It is `String`.

        const newItem = await prisma.inventoryItem.create({
            data: {
                adminId: user.id, // Using user ID as creator
                brand,
                name,
                category,
                costPrice: Number(costPrice),
                sellingPrice,
                images,
                damageImages: damageImages || [],
                condition,
                hasAccessories: hasAccessories || false,
                accessories: accessories || [],
                note,
                status: 'IN_STOCK', // Default
            }
        });

        return NextResponse.json(newItem);

    } catch (error: any) {
        console.error("Create Inventory Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
