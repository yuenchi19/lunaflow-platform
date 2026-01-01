
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { Plan } from "@/types";

const PLAN_PRICES = {
    premium: 29800,
    standard: 9800,
    light: 2980
};

export async function GET(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! },
            select: { id: true, affiliateCode: true, plan: true, createdAt: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // If user is not Standard/Premium, they might not have rewards access, but we return 0.
        if (user.plan !== 'standard' && user.plan !== 'premium') {
            return NextResponse.json({ balance: 0, lifetimeEarnings: 0, totalUsed: 0 });
        }
        if (!user.affiliateCode) {
            return NextResponse.json({ balance: 0, lifetimeEarnings: 0, totalUsed: 0 });
        }

        // 1. Calculate Lifetime Earnings from Referrals
        // Fetch all users to find referrals (Simpler query possible if we just query by referredBy, but strictly we need level 2 too)

        // Level 1: Direct
        const directReferrals = await prisma.user.findMany({
            where: { referredBy: user.affiliateCode },
            select: { id: true, plan: true, affiliateCode: true }
        });

        let lifetimeEarnings = 0;

        for (const direct of directReferrals) {
            // Assume 1 month of revenue for MVP? 
            // OR ideally we should multiply by "months active". 
            // Since we don't have subscription history in this DB (mocked Stripe), 
            // we will just assume "Lifetime Purchase Total" / Price? 
            // Or simpler: Just calculate based on CURRENT plan as "Monthly Potential".
            // BUT for "Balance" to use, it implies past accumulation.
            // UNLESS the model is: "You get rewards every month".
            // The prompt says "Affiliate reward balance".

            // CRITICAL DECISION:
            // Since we don't have a cron job accumulating rewards monthly into a table,
            // AND we don't have full subscription history in DB,
            // We cannot accurately calculate "Past Earnings" dynamically.

            // HOWEVER, the user might expect us to just USE the mock data logic or implement a "Wallet" system.
            // Given the constraints and the previous "mock" nature of `lib/data.ts` which just calculated ONE month,
            // maybe we can't implement "Accumulated Balance" without a history table.

            // BUT, `RewardTransaction` table exists. 
            // Maybe we should assume that *Earnings* are also inserted into `RewardTransaction` by a some (missing) process?
            // If so, then Balance = Sum(RewardTransaction where type='earning') - Sum(RewardTransaction where type='usage').

            // Since I cannot implement the "Missing Process" (Cron) right now easily,
            // I will implement the API to return Balance = 0 (or Sum of RewardTransactions) 
            // BUT I will ALSO mock/simulate "Earnings" entries if the table is empty, so the user has something to test.
            // actually, let's just use `RewardTransaction` sum. 
            // And I will provide a developer button or script to "Sync/Generate Earnings" for the current month?
            // Or better, just calculate "Estimated Monthly Earnings" * "Months since registration"? 
            // That's risky.

            // Let's stick to: Balance = Sum of `RewardTransaction` (amount).
            // To make it usable, I will Insert a dummy "Earning" record if none exists? 
            // Or just return 0 and rely on Manual Admin "Payout" or "Adjustment"?

            // Wait, the prompt implies "Use affiliate rewards".
            // If I return 0, they can't use it.
            // I should fetch `RewardTransaction` sum.
            // AND I will create a temporary logic: 
            // if (Sum == 0), calculate "Potential Monthly Earnings" and Return that as "Simulated Balance" for Demo?
            // No, that's confusing.

            // Let's implement: Balance = Sum(RewardTransaction).
            // AND enable the system to treat "Monthly Earnings" (calculated dynamically) as "Available" for the *Current Month*?
            // "Affiliate reward offset" usually uses "Confirmed Rewards".

            // Let's assume for this "Fix/Feature" task that we rely on `RewardTransaction`. 
            // I will add a "Generate Mock Rewards" button in Admin or just manually insert some records via a seed script?
            // I will implement the API to return the Sum. 
            // I'll also calculate "Monthly Potential" just to show it, but "Balance" implies what's in the bank.

            // Let's check `lib/data.ts` again. `getAffiliateEarnings` returns `monthlyEarnings`.
            // The user probably wants to use *that* amount.
            // So: Balance = (Monthly Potential * X months? No)
            // Let's just use "Monthly Potential" as the "Available Balance for this month"? 
            // That's weird but possible for a MVP.
            // Let's say: Available Balance = (Total Earnings Recorded in DB).
            // I will assume there will be records. (I can create a migration/seed if needed).

            // Wait, I can calculate "Total Lifetime Earnings" by just summing up (Plan Price * 0.07 * Months Active).
            // `monthsActive` can be approximated by `user.createdAt`.

            // Let's try the "Approximation" approach:
            // 1. Calculate "Monthly Earnings" based on current referrals.
            // 2. Multiply by "Months since User Registration" (clamped to sensible max).
            // 3. Subtract "Used Amount" (from RewardTransaction).
            // This is a "Virtual Balance".

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

        // If we strictly use DB for earnings, we'd sum positive transactions.
        // But since we don't have them, we use Virtual.
        // But we must check if any "Earning" transactions exist to avoid double counting if we switch systems later.
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
