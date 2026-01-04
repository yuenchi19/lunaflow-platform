import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from '@supabase/ssr';
import { Plan } from "@/types";

export const dynamic = 'force-dynamic';

const PLAN_PRICES = {
    premium: 29800,
    standard: 9800,
    light: 2980,
    partner: 0
};

export async function GET(req: NextRequest) {
    // Manual Supabase Client creation to avoid build-time "cookies()" error
    let response = NextResponse.next({ request: { headers: req.headers } });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                },
            },
        }
    );

    try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! },
            select: { id: true, affiliateCode: true, plan: true, createdAt: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // If user is not Standard/Premium/Partner, they might not have rewards access, but we return 0.
        if (user.plan !== 'standard' && user.plan !== 'premium' && user.plan !== 'partner') {
            return NextResponse.json({ balance: 0, lifetimeEarnings: 0, totalUsed: 0 });
        }
        if (!user.affiliateCode) {
            return NextResponse.json({ balance: 0, lifetimeEarnings: 0, totalUsed: 0 });
        }

        // 1. Calculate Lifetime Earnings from Referrals
        // Level 1: Direct
        const directReferrals = await prisma.user.findMany({
            where: { referredBy: user.affiliateCode },
            select: { id: true, plan: true, affiliateCode: true }
        });

        let lifetimeEarnings = 0;

        for (const direct of directReferrals) {
            // Logic for Monthly Earnings:
            const price = PLAN_PRICES[direct.plan as Plan] || 0;
            lifetimeEarnings += Math.floor(price * 0.07); // This is monthly.

            if (direct.affiliateCode) {
                const indirectReferrals = await prisma.user.findMany({
                    where: { referredBy: direct.affiliateCode },
                    select: { plan: true }
                });
                for (const indirect of indirectReferrals) {
                    const indPrice = PLAN_PRICES[indirect.plan as Plan] || 0;
                    lifetimeEarnings += Math.floor(indPrice * 0.03);
                }
            }
        }

        // This `lifetimeEarnings` var is actually "Monthly Earnings".
        const monthlyEarnings = lifetimeEarnings;

        // Calculate months active
        const now = new Date();
        const regDate = user.createdAt ? new Date(user.createdAt) : new Date();
        // Diff in months
        let monthsActive = (now.getFullYear() - regDate.getFullYear()) * 12 + (now.getMonth() - regDate.getMonth());
        if (monthsActive < 1) monthsActive = 1;

        // Total Virtual Earnings
        const totalVirtualEarnings = monthlyEarnings * monthsActive;

        // Fetch Actual Usage (Negative transactions)
        const transactions = await prisma.rewardTransaction.findMany({
            where: { userId: user.id }
        });

        const totalUsed = transactions.reduce((sum, t) => sum + (t.amount < 0 ? -t.amount : 0), 0);
        const totalDbEarnings = transactions.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);

        const finalCalculatedEarnings = totalDbEarnings > 0 ? totalDbEarnings : totalVirtualEarnings;

        const balance = Math.max(0, finalCalculatedEarnings - totalUsed);

        return NextResponse.json({
            balance,
            monthlyEarnings,
            totalUsed
        });

    } catch (error: any) {
        console.error("Rewards API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
