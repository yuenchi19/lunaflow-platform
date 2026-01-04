import { PrismaClient } from '@prisma/client';

// Hardcoded prisma init is handled inside the lib usually, but here we instantiate directly with the URL we found
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres.fksvpyrvrzxmhhvetqrx:UverLove2026@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
        },
    },
});

async function deleteStaff() {
    const targetEmail = 'yuenchi1991+light@gmail.com';
    console.log(`Deleting staff ${targetEmail} from DB (Soft Delete)...`);

    try {
        // 2. DB Update (Soft Delete)
        const result = await prisma.user.updateMany({
            where: { email: targetEmail },
            data: {
                status: 'inactive',
                role: 'student', // Downgrade
                subscriptionStatus: 'canceled'
            }
        });

        console.log(`DB updated: ${result.count} records set to inactive/student.`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

deleteStaff();
