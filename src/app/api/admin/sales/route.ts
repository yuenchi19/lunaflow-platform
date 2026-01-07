import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Admin
    const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
    });

    if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Fetch all Ledger Entries (Sales)
        const sales = await prisma.ledgerEntry.findMany({
            where: {
                sellDate: { not: null }
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { sellDate: 'desc' }
        });

        // 1. Monthly Aggregation
        const monthlyStats: Record<string, { revenue: number, profit: number, count: number }> = {};

        // 2. Platform Aggregation
        const platformStats: Record<string, { revenue: number, profit: number, count: number }> = {};

        sales.forEach(sale => {
            if (!sale.sellDate) return;
            const date = new Date(sale.sellDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            // Monthly
            if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { revenue: 0, profit: 0, count: 0 };
            monthlyStats[monthKey].revenue += sale.sellPrice || 0;
            monthlyStats[monthKey].profit += sale.profit || 0;
            monthlyStats[monthKey].count += 1;

            // Platform
            const platform = sale.salePlatform || 'Unspecified';
            if (!platformStats[platform]) platformStats[platform] = { revenue: 0, profit: 0, count: 0 };
            platformStats[platform].revenue += sale.sellPrice || 0;
            platformStats[platform].profit += sale.profit || 0;
            platformStats[platform].count += 1;
        });

        return NextResponse.json({
            sales,
            monthlyStats,
            platformStats
        });

    } catch (e) {
        console.error("Sales Fetch Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
