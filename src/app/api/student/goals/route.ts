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

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { monthlyProfitGoal: true }
        });

        // Also calculate current month profit for progress comparison
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const entries = await prisma.ledgerEntry.findMany({
            where: {
                userId: user.id,
                sellDate: {
                    gte: startOfMonth,
                    lte: endOfMonth
                },
                profit: { not: null }
            }
        });

        const currentMonthProfit = entries.reduce((sum, entry) => sum + (entry.profit || 0), 0);

        return NextResponse.json({
            goal: dbUser?.monthlyProfitGoal || 0,
            currentProfit: currentMonthProfit
        });

    } catch (error: any) {
        console.error("Goals GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { goal } = body;

        if (typeof goal !== 'number' || goal < 0) {
            return NextResponse.json({ error: "Invalid goal amount" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { monthlyProfitGoal: goal }
        });

        return NextResponse.json({ goal: updatedUser.monthlyProfitGoal });

    } catch (error: any) {
        console.error("Goals POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
