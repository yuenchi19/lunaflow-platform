
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll(); },
                    setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value)); } catch { } },
                },
            }
        );

        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! },
            select: { id: true, affiliateCode: true } // Need affiliateCode to count referrals
        });

        if (!user || !user.affiliateCode) {
            // If no code, return 0
            return NextResponse.json({
                directReferrals: 0,
                indirectReferrals: 0,
                monthlyEarnings: 0,
                totalBalance: 0
            });
        }

        // 1. Count Direct Referrals
        const directReferrals = await prisma.user.count({
            where: { referredBy: user.affiliateCode }
        });

        // 2. Count Indirect Referrals (Tier 2)
        // Find all users who were referred by me
        const directReferralUsers = await prisma.user.findMany({
            where: { referredBy: user.affiliateCode },
            select: { affiliateCode: true }
        });

        let indirectReferrals = 0;
        const directCodes = directReferralUsers.map(u => u.affiliateCode).filter(c => c !== null) as string[];

        if (directCodes.length > 0) {
            indirectReferrals = await prisma.user.count({
                where: { referredBy: { in: directCodes } }
            });
        }

        // 3. Calculate Earnings (Balance)
        const balanceAgg = await prisma.rewardTransaction.aggregate({
            _sum: { amount: true },
            where: { userId: user.id }
        });
        const totalBalance = balanceAgg._sum.amount || 0;

        // 4. Monthly Earnings (Earning type only)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyAgg = await prisma.rewardTransaction.aggregate({
            _sum: { amount: true },
            where: {
                userId: user.id,
                type: 'earning',
                createdAt: { gte: startOfMonth }
            }
        });
        const monthlyEarnings = monthlyAgg._sum.amount || 0;

        return NextResponse.json({
            directReferrals,
            indirectReferrals,
            monthlyEarnings,
            totalBalance
        });

    } catch (e: any) {
        console.error("Earnings Check Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
