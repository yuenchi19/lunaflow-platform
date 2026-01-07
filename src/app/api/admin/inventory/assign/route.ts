import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return req.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
                },
            },
        }
    );
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Admin
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.role !== 'admin' && dbUser?.role !== 'staff') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { itemId, userId } = await req.json();

    if (!itemId || !userId) {
        return NextResponse.json({ error: "Item ID and User ID required" }, { status: 400 });
    }

    const updatedItem = await prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
            assignedToUserId: userId,
            status: 'ASSIGNED',
            // Do NOT overwrite supplier info - keep Admin's entry or "Market A" etc.
            // supplier: 'LunaFlow Operation (LunaFlow運営)', 
            receivedAt: null, // Reset receipt verification
        }
    });

    return NextResponse.json({ success: true, item: updatedItem });
}
