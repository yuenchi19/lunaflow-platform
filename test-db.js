
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing DB connection...');
    try {
        const result = await prisma.featureUnlock.upsert({
            where: { featureKey: 'test_key' },
            update: { requiredCourseId: null },
            create: { featureKey: 'test_key', requiredCourseId: null },
        });
        console.log('Upsert successful:', result);
    } catch (e) {
        console.error('Upsert failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
