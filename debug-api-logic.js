const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Simulating Student List API Query ---");
    const students = await prisma.user.findMany({
        where: {
            OR: [
                { role: 'student' },
                { plan: { in: ['standard', 'premium'] } }
            ]
        }
    });
    console.log(`Found ${students.length} students/paying users:`);
    students.forEach(u => console.log(`- ${u.name} (${u.email}) [Role: ${u.role}, Plan: ${u.plan}]`));

    console.log("\n--- Simulating Staff List API Query (Logic) ---");
    // Staff API uses Supabase client but roughly maps to User table with role filter
    const staff = await prisma.user.findMany({
        where: {
            role: { in: ['admin', 'staff', 'accounting'] }
        }
    });
    console.log(`Found ${staff.length} staff users:`);
    staff.forEach(u => console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
