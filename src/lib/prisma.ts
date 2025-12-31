import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    // HARDCODED: Emergency Fix for Vercel Database Connection Mismatch
    // TODO: Revert this to use process.env.DATABASE_URL after Vercel Env is confirmed fixed.
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL_OVERRIDE || 'postgresql://postgres:UverLove2026@db.fksvpyrvrzxmhhvetqrx.supabase.co:5432/postgres',
            },
        },
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
