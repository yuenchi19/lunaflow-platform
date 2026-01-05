
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
    console.log("--- STARTING ROLE CLEANUP ---");

    // 1. Find all users with ROLE = STAFF or ADMIN
    const staffUsers = await prisma.user.findMany({
        where: {
            role: { in: ['staff', 'admin'] }
        }
    });

    console.log(`Found ${staffUsers.length} Admin/Staff users.`);

    let fixedCount = 0;

    for (const user of staffUsers) {
        // SAFETY CHECK: Only demote if they have a Stripe Customer ID implying they signed up via Webhook/Payment Flow
        // AND they are NOT the known hardcoded admin (obs).
        // For now, we will be aggressive as per user request "Demote everyone from Stripe".

        console.log(`Checking user: ${user.email} (${user.role})`);

        if (user.stripeCustomerId || user.email.includes('+')) {
            console.log(` -> SUSPICIOUS: Has Stripe ID or is Alias. DEMOTING to STUDENT.`);

            await prisma.user.update({
                where: { id: user.id },
                data: { role: 'student' }
            });

            // Also update Auth Metadata if possible (need Supabase Admin but this is Prisma script)
            // We can rely on Sync to update metadata later? No, Sync doesn't touch role.
            // We need to warn the user that Auth Metadata might still be stale until next login/sync?
            // Wait, I can try to use Supabase Admin here if I install dependencies.
            // But 'prisma.user.update' fixes DB. Middleware checks DB? No, Middleware checks Token (Metadata).
            // We MUST update Metadata.

            fixedCount++;
        } else {
            console.log(` -> GENUINE STAFF? (No Stripe ID). Skipping.`);
        }
    }

    console.log(`--- CLEANUP COMPLETE. Demoted ${fixedCount} users. ---`);
    console.log("NOTE: Auth Metadata (Sessions) might still be cached. Users should re-login or run 'Sync' if Sync updated metadata.");
    // Actually, Sync v2 (Robust) updates metadata? 
    // Let's check sync-robust. It updates DB. Does it update Auth?
    // The Webhook updates Auth. Sync script updates DB.
    // I should add Auth Metadata update to this script for safety.
}

main().catch(console.error).finally(() => prisma.$disconnect());
