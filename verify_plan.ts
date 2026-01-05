
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const emails = ['yuenchi1991+light@gmail.com', 'yuenchi1991+rite3@gmail.com'];
    console.log('--- Verifying User Plans ---');

    for (const email of emails) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            console.log(`User: ${email}`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Plan: ${user.plan} (Expected: light)`);
            console.log(`  Address: ${user.address}`);
            console.log(`  Zip: ${user.zipCode}`);
            console.log(`  StripeCust: ${user.stripeCustomerId}`);
            console.log(`  SubStatus: ${user.subscriptionStatus}`);
            console.log('-----------------------------------');
        } else {
            console.log(`User not found: ${email}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
