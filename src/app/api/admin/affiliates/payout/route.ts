import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, amount } = body;

        if (!userId || amount === undefined) {
            return NextResponse.json({ error: 'Missing userId or amount' }, { status: 400 });
        }

        // Record the payout as a negative RewardTransaction
        const transaction = await prisma.rewardTransaction.create({
            data: {
                userId,
                amount: -amount, // Negative to represent outflow/payment
                type: 'payout',
                description: `Affiliate Payout for ${new Date().toLocaleString('ja-JP', { month: 'long', year: 'numeric' })}`,
            },
        });

        return NextResponse.json(transaction);
    } catch (error) {
        console.error('Error processing payout:', error);
        return NextResponse.json({ error: 'Internal User Error' }, { status: 500 });
    }
}
