
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Checking UserProgress table...");
        const count = await prisma.userProgress.count();
        console.log(`Success! UserProgress table exists. Row count: ${count}`);
    } catch (e) {
        console.error("Error accessing UserProgress table:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
