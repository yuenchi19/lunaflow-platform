
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AffiliateEarnings, Plan } from '@/types';

// Constants for calculation
// NOTE: These match src/lib/data.ts logic. 
// Ideally these should be in a config or DB, but hardcoding for consistency with current system.
const PLAN_PRICES = {
    premium: 29800,
    standard: 9800,
    light: 2980
};

export async function GET() {
    try {
        // 1. Fetch ALL users to calculate relationships (we need everyone to know who referred whom)
        // We only RETURN Standard/Premium users, but we need Light users to calculate earnings.
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                plan: true,
                affiliateCode: true,
                referredBy: true,
                payoutPreference: true,
                // avatarUrl? Not in schema, mocked in UI
            }
        });

        // 2. Identify Affiliates (Standard/Premium only)
        // User request: Show them even if earnings 0.
        // Also we want to ensure they appear even if they don't have a code strictly yet? (Usually they should).
        // If they don't have a code, we'll just show empty code or handle it in UI.
        const affiliates = allUsers.filter(u =>
            (u.plan === 'standard' || u.plan === 'premium') &&
            !u.email.endsWith('@example.com') // Exclude mock users
        );

        // 3. Fetch Payouts for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const payouts = await prisma.rewardTransaction.findMany({
            where: {
                type: 'payout',
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        // 4. Calculate Earnings for each Affiliate
        const stats = affiliates.map(affiliate => {
            let directCount = 0;
            let indirectCount = 0;
            let monthlyEarnings = 0;

            // Level 1: Users referred by this affiliate
            const directReferrals = allUsers.filter(u => u.referredBy === affiliate.affiliateCode);
            directCount = directReferrals.length;

            directReferrals.forEach(direct => {
                // Calculate 7%
                const price = PLAN_PRICES[direct.plan as Plan] || 0;
                monthlyEarnings += Math.floor(price * 0.07);

                // Level 2: Users referred by the direct referral (if direct referral has a code)
                if (direct.affiliateCode) {
                    const indirectReferrals = allUsers.filter(u => u.referredBy === direct.affiliateCode);
                    indirectCount += indirectReferrals.length;

                    indirectReferrals.forEach(indirect => {
                        // Calculate 3%
                        const indPrice = PLAN_PRICES[indirect.plan as Plan] || 0;
                        monthlyEarnings += Math.floor(indPrice * 0.03);
                    });
                }
            });

            // Adjust for Payouts (reset if paid)
            const userPayouts = payouts.filter(p => p.userId === affiliate.id)
                .reduce((sum, p) => sum + Math.abs(p.amount), 0);

            const unpaidEarnings = Math.max(0, monthlyEarnings - userPayouts);

            return {
                ...affiliate,
                avatarUrl: `https://ui-avatars.com/api/?name=${affiliate.name || 'User'}&background=random`,
                earnings: {
                    directReferrals: directCount,
                    indirectReferrals: indirectCount,
                    monthlyEarnings: unpaidEarnings // Show unpaid amount
                }
            };
        });

        // Sort by earnings desc
        stats.sort((a, b) => b.earnings.monthlyEarnings - a.earnings.monthlyEarnings);

        return NextResponse.json(stats);

    } catch (e: any) {
        console.error("Affiliate API Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
