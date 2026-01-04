const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            plan: true,
        }
    });

    console.log("--- USER DATA DIAGNOSTIC ---");
    console.log(`Total Users: ${users.length}`);

    const activeStudents = users.filter(u => {
        if (u.role !== 'student') return false;
        if (u.status === 'active') return true;
        return false;
    });
    console.log(`Total 'Active' Students (by status='active'): ${activeStudents.length}`);

    // Find staff
    const staff = users.filter(u => ['admin', 'staff', 'accounting'].includes(u.role));
    console.log(`\n--- STAFF LIST (${staff.length}) ---`);
    staff.forEach(u => {
        const paidPlans = ['partner', 'light', 'standard', 'premium'];
        const isPaid = paidPlans.includes(u.plan);
        const flag = isPaid ? "[PAID]" : "";
        console.log(`${flag} ${u.email} (${u.name}) - Role: ${u.role}, Plan: ${u.plan}, Status: ${u.status}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
