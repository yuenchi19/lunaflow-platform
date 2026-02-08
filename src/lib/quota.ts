
import { prisma } from "@/lib/prisma";

export type QuotaType = 'research' | 'listing';

export async function checkQuota(userId: string, type: QuotaType): Promise<{ allowed: boolean; current: number; limit: number }> {
    const date = new Date();
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const quota = await prisma.userQuota.findUnique({
        where: {
            userId_month: {
                userId,
                month,
            },
        },
    });

    // Default limits if no quota record exists yet
    // You might want to fetch default limits from a SystemConfig or use constants
    const defaultLimit = 50;

    const limit = quota ? (type === 'research' ? quota.researchLimit : quota.listingLimit) : defaultLimit;
    const current = quota ? (type === 'research' ? quota.researchCount : quota.listingCount) : 0;

    return {
        allowed: current < limit,
        current,
        limit,
    };
}

export async function incrementQuota(userId: string, type: QuotaType) {
    const date = new Date();
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Upsert ensures the record is created if it doesn't exist
    await prisma.userQuota.upsert({
        where: {
            userId_month: {
                userId,
                month,
            },
        },
        update: {
            researchCount: type === 'research' ? { increment: 1 } : undefined,
            listingCount: type === 'listing' ? { increment: 1 } : undefined,
        },
        create: {
            userId,
            month,
            researchCount: type === 'research' ? 1 : 0,
            listingCount: type === 'listing' ? 1 : 0,
            // Default limits can be set here or inherited from defaults in schema
            researchLimit: 50,
            listingLimit: 50,
        },
    });
}

export async function getQuota(userId: string) {
    const date = new Date();
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const quota = await prisma.userQuota.findUnique({
        where: {
            userId_month: {
                userId,
                month,
            },
        },
    });

    return quota || {
        researchCount: 0,
        researchLimit: 50,
        listingCount: 0,
        listingLimit: 50,
        month
    };
}
