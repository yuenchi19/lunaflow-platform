import { prisma } from './src/lib/prisma';

async function resetLineLinkage(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log(`User not found: ${email}`);
            return;
        }

        console.log(`Found user: ${user.name} (${user.id})`);
        console.log(`Current lineUserId: ${user.lineUserId}`);

        const updated = await prisma.user.update({
            where: { email },
            data: { lineUserId: null }, // Clear the link
        });

        console.log(`Successfully reset lineUserId for ${updated.email}`);
        console.log(`New lineUserId: ${updated.lineUserId}`);

    } catch (error) {
        console.error('Error resetting LINE linkage:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Reset for the user in the screenshot
resetLineLinkage('moms.villa0815@gmail.com');
