import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all completed ledger entries with profit
        const entries = await prisma.ledgerEntry.findMany({
            where: {
                userId: user.id,
                profit: { not: null }
            },
            orderBy: { sellDate: 'asc' }
        });

        // 1. Monthly Profit
        const monthlyProfitMap = new Map<string, number>();
        let totalProfit = 0;
        let currentMonthProfit = 0;

        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        entries.forEach(entry => {
            const date = entry.sellDate || entry.createdAt;
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const profit = entry.profit || 0;

            monthlyProfitMap.set(monthKey, (monthlyProfitMap.get(monthKey) || 0) + profit);
            totalProfit += profit;

            if (monthKey === currentMonthKey) {
                currentMonthProfit += profit;
            }
        });

        // Fill in last 6 months even if empty
        const monthlyProfit = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyProfit.push({
                month: key,
                profit: monthlyProfitMap.get(key) || 0
            });
        }

        // 2. Platform Distribution
        const platformMap = new Map<string, number>();
        entries.forEach(entry => {
            const platform = entry.salePlatform || "その他";
            const profit = entry.profit || 0;
            if (profit > 0) {
                platformMap.set(platform, (platformMap.get(platform) || 0) + profit);
            }
        });

        const platformDistribution = Array.from(platformMap.entries()).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value);

        return NextResponse.json({
            monthlyProfit,
            platformDistribution,
            summary: {
                totalProfit,
                currentMonthProfit
            }
        });

    } catch (error: any) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
