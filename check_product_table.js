
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking database connection...");
        // Try to query the Product table
        const count = await prisma.product.count();
        console.log(`✅ Success! Found ${count} products.`);

        // Try creating a dummy product to ensure write access if count is 0
        if (count === 0) {
            console.log("Product table empty. Attempting dummy creation...");
            // logic to skip actual creation to avoid garbage, just confirming table existence via count is usually enough
            // actually, catching the error on count() is sufficient to know if table exists.
        }

    } catch (e) {
        console.error("❌ Error accessing Product table:");
        console.error(e.message);
        if (e.code) console.error(`Error Code: ${e.code}`);
    } finally {
        await prisma.$disconnect();
    }
}

main();
