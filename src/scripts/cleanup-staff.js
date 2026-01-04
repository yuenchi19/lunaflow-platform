const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting Staff Cleanup...");

    const keepEmail = 'yuenchi1991@gmail.com';

    // 1. Find all staff/admin/accounting
    const staff = await prisma.user.findMany({
        where: {
            role: { in: ['admin', 'staff', 'accounting'] },
            email: { not: keepEmail }
        },
        select: { id: true, email: true, role: true, plan: true }
    });

    console.log(`Found ${staff.length} staff to remove/demote.`);

    for (const u of staff) {
        if (u.plan && u.plan !== 'free' && u.plan !== 'trial') {
            // If they have a paid plan, DEMOTE to student so payment record isn't orphaned/lost
            // (Unless user explicitly wants to delete paid records too, but "Delete is fine" might refer to the staff entry)
            // Safer to demote.
            console.log(`Demoting PAID staff ${u.email} to 'student'...`);
            await prisma.user.update({
                where: { id: u.id },
                data: { role: 'student' }
            });
        } else {
            // If no plan, DELETE.
            console.log(`Deleting staff ${u.email}...`);
            // Note: If they have foreign keys (e.g. created items), delete might fail.
            // If so, we catch and demote.
            try {
                await prisma.user.delete({ where: { id: u.id } });
            } catch (e) {
                console.warn(`Could not delete ${u.email} (likely has related data). Demoting instead.`);
                await prisma.user.update({
                    where: { id: u.id },
                    data: { role: 'student', status: 'inactive' }
                });
            }
        }
    }

    console.log("Cleanup Complete.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
