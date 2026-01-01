import { prisma } from './src/lib/prisma';

async function main() {
  try {
    console.log("Verifying User table schema...");
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        isLedgerEnabled: true
      }
    });
    console.log("Success! Fetched user:", user);
    console.log("isLedgerEnabled exists and is accessible.");
  } catch (e) {
    console.error("Verification failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
