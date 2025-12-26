import { prisma } from './prisma';

/**
 * Calculates current available balance for a user.
 * Formula: Sum of all transaction amounts.
 * (Positive = Earnings, Negative = Usage)
 */
export async function getAffiliateBalance(userId: string): Promise<number> {
    const aggregations = await prisma.rewardTransaction.aggregate({
        _sum: {
            amount: true,
        },
        where: {
            userId: userId,
        },
    });

    return aggregations._sum.amount || 0;
}

/**
 * Creates a reward usage transaction (Debit).
 * Typically called within a larger transaction.
 */
export async function createUsageTransaction(
    tx: any, // Prisma Transaction Client
    userId: string,
    amount: number, // Positive integer (will be negated)
    description: string,
    purchaseRequestId: string
) {
    if (amount <= 0) throw new Error("Amount must be positive");

    return tx.rewardTransaction.create({
        data: {
            userId,
            amount: -amount, // Store as negative
            type: 'offset_purchase',
            description,
            purchaseRequestId
        }
    });
}
