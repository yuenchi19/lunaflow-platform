import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Schema Update...');

    try {
        // Attempt to create a dummy user with the new fields to verify they exist
        // We won't actually save it, or we will delete it immediately.
        // Actually, just checking introspection or "count" usage of fields is safer.

        // Check if we can select the new fields
        const users = await prisma.user.findMany({
            take: 1,
            select: {
                id: true,
                initialPaymentDate: true,
                githubId: true,
                githubUsername: true,
                githubInviteStatus: true
            }
        });

        console.log('Successfully queried new fields!');
        console.log('Sample User Data:', users[0] || 'No users found, but query succeeded.');

    } catch (e: any) {
        console.error('Verification Failed:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
