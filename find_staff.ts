import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findStaff() {
    console.log("Searching for staff '大市'...");
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: '大市' } },
                { email: 'yuenchi1991+light@gmail.com' } // Known from previous context
            ]
        }
    });

    users.forEach(u => {
        console.log(`Found: ${u.name} (<${u.email}>) - Role: ${u.role}, Status: ${u.status}, ID: ${u.id}`);
    });
}

findStaff();
