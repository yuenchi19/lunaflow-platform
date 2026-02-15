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

        const { searchParams } = new URL(req.url);
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Fetch Ledger Entries (Sales and Purchases)
        const ledgerEntries = await prisma.ledgerEntry.findMany({
            where: {
                userId: user.id,
                OR: [
                    { purchaseDate: { gte: startDate, lte: endDate } },
                    { sellDate: { gte: startDate, lte: endDate } }
                ]
            }
        });

        // Fetch Purchase Requests
        const purchaseRequests = await prisma.purchaseRequest.findMany({
            where: {
                userId: user.id,
                createdAt: { gte: startDate, lte: endDate }
            }
        });

        const events: any[] = [];

        // Map Ledger Purchases
        ledgerEntries.forEach(entry => {
            if (entry.purchaseDate >= startDate && entry.purchaseDate <= endDate) {
                events.push({
                    id: `purchase-${entry.id}`,
                    title: `仕入: ${entry.brand}`,
                    date: entry.purchaseDate,
                    type: 'purchase',
                    amount: entry.purchasePrice
                });
            }
            if (entry.sellDate && entry.sellDate >= startDate && entry.sellDate <= endDate) {
                events.push({
                    id: `sale-${entry.id}`,
                    title: `売上: ${entry.brand}`,
                    date: entry.sellDate,
                    type: 'sale',
                    amount: entry.sellPrice,
                    profit: entry.profit
                });
            }
        });

        // Map Purchase Requests
        purchaseRequests.forEach(req => {
            events.push({
                id: `req-${req.id}`,
                title: `リクエスト: ¥${req.amount.toLocaleString()}`,
                date: req.createdAt,
                type: 'request',
                status: req.status
            });
        });

        return NextResponse.json({ events });

    } catch (error: any) {
        console.error("Calendar GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
