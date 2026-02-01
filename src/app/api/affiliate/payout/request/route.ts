
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const { amount } = body;

        if (!amount || amount < 1000) {
            return NextResponse.json({ error: "Minimum payout amount is ¥1,000" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: authUser.email! },
            select: { id: true, bankAccountNumber: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (!user.bankAccountNumber) return NextResponse.json({ error: "Bank account not registered" }, { status: 400 });

        // Check Balance
        const balanceAgg = await prisma.rewardTransaction.aggregate({
            _sum: { amount: true },
            where: { userId: user.id }
        });
        const currentBalance = balanceAgg._sum.amount || 0;

        if (currentBalance < amount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Transaction: Create Payout Request AND Deduct Balance (Hold)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Request
            const request = await tx.payoutRequest.create({
                data: {
                    userId: user.id,
                    amount: amount,
                    status: 'pending'
                }
            });

            // 2. Create Transaction (Negative)
            await tx.rewardTransaction.create({
                data: {
                    userId: user.id,
                    amount: -amount,
                    type: 'payout_request', // Ensure this type is handled in frontend/types if strict enum
                    description: `Payout Request ID: ${request.id}`,
                    purchaseRequestId: undefined, // Schema might link to PurchaseRequest, but this is PayoutRequest. I added PayoutRequest model but didn't link RewardTransaction to it in Schema Relation (Wait, did I?).
                    // Checking Schema earlier: RewardTransaction has `purchaseRequestId` (nullable).
                    // I did NOT add `payoutRequestId` to RewardTransaction.
                    // So I'll rely on text description or add it if needed. Text is fine for MVP.
                }
            });

            return request;
        });

        return NextResponse.json({ success: true, request: result });

    } catch (e: any) {
        console.error("Payout Request Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
