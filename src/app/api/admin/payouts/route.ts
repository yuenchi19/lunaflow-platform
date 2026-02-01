
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookies().getAll(); } } }
    );
    const { data: { user } } = await supabase.auth.getUser();

    // Check Admin (Simplified check, assuming middleware or separate check usually, but good to have)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Proper role check
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const requests = await prisma.payoutRequest.findMany({
        include: {
            user: {
                select: { id: true, name: true, email: true, bankName: true, bankAccountNumber: true, bankBranch: true, bankAccountHolder: true, bankAccountType: true }
            }
        },
        orderBy: { requestedAt: 'desc' }
    });

    return NextResponse.json(requests);
}

export async function PUT(req: NextRequest) {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookies().getAll(); } } }
    );
    const { data: { user } } = await supabase.auth.getUser();

    // Proper role check
    const dbUser = await prisma.user.findUnique({ where: { id: user?.id || 'unknown' } });
    if (!dbUser || dbUser.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { requestId, status, note } = body; // status: 'paid' | 'rejected'

    if (!['paid', 'rejected'].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    try {
        const result = await prisma.$transaction(async (tx) => {
            const current = await tx.payoutRequest.findUnique({ where: { id: requestId } });
            if (!current) throw new Error("Request not found");
            if (current.status !== 'pending') throw new Error("Request already processed");

            const updated = await tx.payoutRequest.update({
                where: { id: requestId },
                data: {
                    status,
                    processedAt: new Date(),
                    note
                }
            });

            if (status === 'rejected') {
                // Refund
                await tx.rewardTransaction.create({
                    data: {
                        userId: current.userId,
                        amount: current.amount, // Positive amount to refund
                        type: 'payout_refund',
                        description: `Refund for Payout Request ${requestId}: ${note || 'Rejected'}`
                    }
                });
            }

            return updated;
        });

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }

}
