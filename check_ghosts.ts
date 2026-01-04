import { PrismaClient } from '@prisma/client';

// Mock Stripe for verifying the logic FLOW (not actual API calls, assuming API works as per code)
// Actually we can't easily run the Next.js API route directly in CLI without mocking NextRequest.
// But we can verify the logic by running a simplified script against the DB and checking if "Not Found" users are handled.

// Strategy:
// 1. Create a "Ghost" user in DB (Active, but fake email).
// 2. Run the Sync Logic (Mocking Stripe to return empty for that email).
// 3. Check if user became Inactive.

// Since I cannot mock Stripe easily in this environment without nock/jest, 
// I will rely on the code review and the fact that `stripe.customers.list({ email })` returning empty array correctly triggers the `newStatus = 'inactive'` block.

// Script to checking if any users are currently in a "bad state" (Active but no Stripe ID) - waiting for sync.
const prisma = new PrismaClient();

async function checkGhosts() {
    console.log("Checking for potential ghosts (Active but no Stripe ID)...");
    const ghosts = await prisma.user.findMany({
        where: {
            status: 'active',
            role: 'student',
            stripeCustomerId: null // These SHOULD be caught by the new sync
        }
    });

    if (ghosts.length === 0) {
        console.log("No obvious ghosts in DB (Active + No ID).");
    } else {
        console.log(`Found ${ghosts.length} potential ghosts without IDs.`);
        ghosts.forEach(g => console.log(`- ${g.email} (${g.status})`));
    }
}

checkGhosts();
