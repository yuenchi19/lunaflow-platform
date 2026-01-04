const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { role: 'student' },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            plan: true,
            initialPaymentDate: true,
            createdAt: true,
            subscriptionStatus: true // Assuming valid now or ignored if CJS? No, Prisma Client will parse it if schema is generated
        }
    });

    console.log(`--- DETAIL STUDENT DIAGNOSTIC (${users.length}) ---`);
    users.forEach(u => {
        console.log(`[${u.email}] Status: ${u.status}, SubStatus: ${u.subscriptionStatus}, InitialPay: ${u.initialPaymentDate}, Plan: ${u.plan}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
