
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'yuenchi1991+light@gmail.com';
    console.log(`Checking user: ${email}`);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        console.log(`ID: ${user.id}`);
        console.log(`Plan: ${user.plan}`);
        console.log(`Address: ${user.address}`);
        console.log(`Zip: ${user.zipCode}`);
    } else {
        console.log('User not found');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
