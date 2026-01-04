const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting Repair...");

    // 1. Fix Mixed Staff (Demote +standard to student)
    const mixedStaff = await prisma.user.findFirst({
        where: { email: 'yuenchi1991+standard@gmail.com' } // Targeted fix
    });

    if (mixedStaff && mixedStaff.role !== 'student') {
        console.log(`Demoting ${mixedStaff.email} from ${mixedStaff.role} to student...`);
        await prisma.user.update({
            where: { id: mixedStaff.id },
            data: { role: 'student' }
        });
        console.log("Done.");
    } else {
        console.log("Targeted staff fix not needed or user not found.");
    }

    // 2. Fix Initial Payment Date for visibility
    // If a student has a plan but no initialPaymentDate, set it to createdAt
    const students = await prisma.user.findMany({
        where: { role: 'student' }
    });

    for (const s of students) {
        if (!s.initialPaymentDate) {
            console.log(`Setting initialPaymentDate for ${s.email}...`);
            await prisma.user.update({
                where: { id: s.id },
                data: { initialPaymentDate: s.createdAt }
            });
        }
    }

    console.log("Repair Complete.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
