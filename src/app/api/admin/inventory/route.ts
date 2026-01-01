import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

async function getSupabaseClient(req: NextRequest) {
    let response = NextResponse.next({ request: { headers: req.headers } });
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return req.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                },
            },
        }
    );
    return supabase;
}

export async function POST(req: NextRequest) {
    const supabase = await getSupabaseClient(req);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Admin Role
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.role !== 'admin' && dbUser?.role !== 'staff') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { brand, name, category, costPrice, images } = body;

    if (!brand || !costPrice) {
        return NextResponse.json({ error: "Brand and Cost Price are required" }, { status: 400 });
    }

    const newItem = await prisma.inventoryItem.create({
        data: {
            adminId: user.id,
            brand,
            name,
            category,
            costPrice: parseInt(costPrice),
            images: images || [],
            status: 'IN_STOCK'
        }
    });

    return NextResponse.json({ success: true, item: newItem });
}

export async function GET(req: NextRequest) {
    // Optional: Add Auth check here if needed using the same pattern
    const items = await prisma.inventoryItem.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            assignedToUser: { select: { name: true } }
        }
    });

    return NextResponse.json({ items });
}
