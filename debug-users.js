const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log("--- All Users ---");
    users.forEach(u => {
        console.log(`ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Plan: ${u.plan}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
