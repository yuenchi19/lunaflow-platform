import { User, Course, Announcement, AffiliateEarnings, RewardTransaction } from "@/types";

// ... existing data ...
// For now, since we don't have a real DB, we'll just export helpers that would normally query the DB.
// In a real app, this would be Prisma/SQL.

export const MOCK_REWARD_HISTORY: RewardTransaction[] = [
    { id: 'tx_1', userId: 'user-1', date: '2025-12-01', amount: 5000, type: 'earning', description: '11月分成果報酬', status: 'completed' },
];

export function getRewardHistory(userId: string): RewardTransaction[] {
    // In real app: return db.rewardTransactions.findMany({ where: { userId } })
    // For Mock: return static + localStorage
    if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('mock_reward_history') || '[]');
        return [...MOCK_REWARD_HISTORY, ...stored].filter(t => t.userId === userId || t.userId === 'user-1'); // Mock user-1 is current
    }
    return MOCK_REWARD_HISTORY;
}

export function addRewardTransaction(transaction: Omit<RewardTransaction, 'id' | 'status'>) {
    if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('mock_reward_history') || '[]');
        const newTx: RewardTransaction = {
            ...transaction,
            id: `tx_${Date.now()}`,
            status: 'completed'
        };
        stored.push(newTx);
        localStorage.setItem('mock_reward_history', JSON.stringify(stored));
        return newTx;
    }
    return null;
}
