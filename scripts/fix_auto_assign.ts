
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Auto-Assign Fix...');

    // Find all self-sourced items that are NOT assigned
    const items = await prisma.inventoryItem.findMany({
        where: {
            isSelfSourced: true,
            assignedToUserId: null,
        },
    });

    console.log(`Found ${items.length} unassigned self-sourced items.`);

    for (const item of items) {
        if (item.adminId) { // adminId stores the creator ID for self-sourced items
            await prisma.inventoryItem.update({
                where: { id: item.id },
                data: {
                    assignedToUserId: item.adminId, // Assign to creator
                    status: 'ASSIGNED', // Ensure status is correct
                },
            });
            console.log(`Assigned item ${item.id} (${item.brand}) to user ${item.adminId}`);
        } else {
            console.warn(`Item ${item.id} has no adminId (creator), skipping.`);
        }
    }

    console.log('Fix completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
