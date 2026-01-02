
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.fksvpyrvrzxmhhvetqrx:UverLove2026@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
        }
    }
});

async function main() {
    console.log('Migrating Course Tiers...');

    // update all courses to have minTier = 1 if not set (though default handles it for new, existing might need it if not default-filled retroactively)
    // Actually schema default fills it for new rows, but existing rows might need distinct update if we wanted logic.
    // For now, set ALL to 1 (Light) as baseline.

    // In a real scenario, we might map by Title:
    // const standards = await prisma.course.updateMany({ where: { title: { contains: 'Standard' } }, data: { minTier: 2 } });

    const update = await prisma.course.updateMany({
        data: {
            minTier: 1
        }
    });

    console.log(`Updated ${update.count} courses to Tier 1 (Light).`);

    const courses = await prisma.course.findMany();
    console.log('Current Courses:', courses.map(c => `${c.title}: Tier ${c.minTier}`));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
