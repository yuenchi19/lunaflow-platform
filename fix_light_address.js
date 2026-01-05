
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'yuenchi1991+light@gmail.com';
    console.log(`Updating user: ${email}`);

    // Dummy Address since we can't fetch from Stripe
    const dummyAddress = "東京都千代田区1-1-1 (Manual Fix)";

    const updated = await prisma.user.update({
        where: { email },
        data: {
            address: dummyAddress,
            plan: 'light', // Reinforce
            updatedAt: new Date()
        }
    });

    console.log(`Updated Address: ${updated.address}`);
    console.log(`Plan: ${updated.plan}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
