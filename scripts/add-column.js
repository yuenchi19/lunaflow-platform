
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking User table structure...');
        // Attempt to select the column to see if it exists
        try {
            await prisma.$executeRaw`SELECT "lastLoginDate" FROM "User" LIMIT 1;`;
            console.log('Column "lastLoginDate" already exists.');
        } catch (e) {
            console.log('Column "lastLoginDate" does not exist. Adding it...');
            await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "lastLoginDate" TIMESTAMP(3);`;
            console.log('Column added successfully.');
        }
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
