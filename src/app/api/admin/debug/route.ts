
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const dbUrl = process.env.DATABASE_URL || "";
        const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');

        let productCount = "Error";
        let courseCount = "Error";
        let userCount = "Error";
        let inventoryCount = "Error";
        let dbError = null;

        try { productCount = (await prisma.product.count()).toString(); } catch (e: any) { dbError = e.message; productCount = "Table Missing"; }
        try { courseCount = (await prisma.course.count()).toString(); } catch (e: any) { courseCount = "Table Missing"; }
        try { inventoryCount = (await prisma.inventoryItem.count()).toString(); } catch (e: any) { inventoryCount = "Table Missing"; }
        try { userCount = (await prisma.user.count()).toString(); } catch (e) { }

        return NextResponse.json({
            env: {
                NODE_ENV: process.env.NODE_ENV,
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                DATABASE_URL_MASKED: maskedUrl,
                DIRECT_URL_DEFINED: !!process.env.DIRECT_URL
            },
            counts: {
                products: productCount,
                courses: courseCount,
                inventory: inventoryCount,
                users: userCount
            },
            error: dbError
        }, { status: 200 });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const mode = body.mode || 'product_only';

        if (mode === 'test_insert') {
            try {
                const course = await prisma.course.create({
                    data: {
                        title: "DEBUG_COURSE_" + Date.now(),
                        allowedPlans: ["light"],
                        order: 999,
                        published: false
                    }
                });

                const firstUser = await prisma.user.findFirst();
                const inventory = await prisma.inventoryItem.create({
                    data: {
                        adminId: firstUser?.id || 'debug_admin',
                        brand: "DEBUG_BRAND",
                        costPrice: 1000,
                        images: [],
                        status: 'IN_STOCK',
                        isOmakase: true
                    }
                });

                return NextResponse.json({
                    success: true,
                    message: "Test Insert Successful!",
                    courseId: course.id,
                    inventoryId: inventory.id
                });

            } catch (e: any) {
                return NextResponse.json({ success: false, error: "Insert Failed: " + e.message, stack: e.stack });
            }
        }

        if (mode === 'full_repair') {
            const sqlStatements = [
                // 1. Course
                `CREATE TABLE IF NOT EXISTS "Course" (
                    "id" TEXT NOT NULL,
                    "title" TEXT NOT NULL,
                    "description" TEXT,
                    "label" TEXT,
                    "thumbnailUrl" TEXT,
                    "order" INTEGER NOT NULL DEFAULT 0,
                    "published" BOOLEAN NOT NULL DEFAULT false,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    "allowedPlans" TEXT[] DEFAULT ARRAY[]::TEXT[],
                    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
                );`,

                // 2. Category
                `CREATE TABLE IF NOT EXISTS "Category" (
                    "id" TEXT NOT NULL,
                    "courseId" TEXT NOT NULL,
                    "title" TEXT NOT NULL,
                    "order" INTEGER NOT NULL DEFAULT 0,
                    "published" BOOLEAN NOT NULL DEFAULT true,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
                );`,

                // 3. Block
                `CREATE TABLE IF NOT EXISTS "Block" (
                    "id" TEXT NOT NULL,
                    "categoryId" TEXT NOT NULL,
                    "title" TEXT NOT NULL,
                    "type" TEXT NOT NULL,
                    "content" TEXT,
                    "videoUrl" TEXT,
                    "fileUrl" TEXT,
                    "order" INTEGER NOT NULL DEFAULT 0,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    "feedbackType" TEXT,
                    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
                );`,

                // 4. InventoryItem
                `DO $$ BEGIN
                    CREATE TYPE "ItemStatus" AS ENUM ('IN_STOCK', 'ASSIGNED', 'SHIPPED', 'RECEIVED', 'SOLD', 'RETURNED');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;`,

                `CREATE TABLE IF NOT EXISTS "InventoryItem" (
                    "id" TEXT NOT NULL,
                    "adminId" TEXT NOT NULL,
                    "brand" TEXT NOT NULL,
                    "name" TEXT,
                    "category" TEXT,
                    "costPrice" INTEGER NOT NULL,
                    "sellingPrice" INTEGER,
                    "images" TEXT[],
                    "damageImages" TEXT[],
                    "isSelfSourced" BOOLEAN NOT NULL DEFAULT false,
                    "isOmakase" BOOLEAN NOT NULL DEFAULT true,
                    "status" "ItemStatus" NOT NULL DEFAULT 'IN_STOCK',
                    "condition" TEXT,
                    "hasAccessories" BOOLEAN NOT NULL DEFAULT false,
                    "accessories" TEXT[],
                    "note" TEXT,
                    "supplier" TEXT,
                    "supplierName" TEXT,
                    "supplierAddress" TEXT,
                    "supplierOccupation" TEXT,
                    "supplierAge" INTEGER,
                    "idVerificationMethod" TEXT,
                    "purchaseDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
                    "receivedAt" TIMESTAMP(3),
                    "assignedToUserId" TEXT,
                    "purchaseRequestId" TEXT,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
                );`,

                // 5. Product (Store)
                `CREATE TABLE IF NOT EXISTS "Product" (
                    "id" TEXT NOT NULL,
                    "name" TEXT NOT NULL,
                    "description" TEXT,
                    "price" INTEGER NOT NULL,
                    "image" TEXT,
                    "stripePriceId" TEXT,
                    "stock" INTEGER NOT NULL DEFAULT 0,
                    "isVisible" BOOLEAN NOT NULL DEFAULT true,
                    "brand" TEXT,
                    "category" TEXT,
                    "condition" TEXT,
                    "accessories" TEXT[],
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
                );`,

                // 6. UserProgress
                `CREATE TABLE IF NOT EXISTS "UserProgress" (
                    "id" TEXT NOT NULL,
                    "userId" TEXT NOT NULL,
                    "blockId" TEXT NOT NULL,
                    "status" TEXT NOT NULL,
                    "completedAt" TIMESTAMP(3),
                    "feedbackContent" TEXT,
                    "feedbackStatus" TEXT,
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updatedAt" TIMESTAMP(3) NOT NULL,
                    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
                );`,

                // 7. Fix Existing User Table (ALTER)
                `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';`,
                `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'light';`,
                `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'student';`,
                `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "affiliateCode" TEXT;`,
                `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;`,
                `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isLedgerEnabled" BOOLEAN DEFAULT false;`,
                `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;`,
                `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;`,
                `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT DEFAULT 'active';`
            ];

            const results = [];
            for (const sql of sqlStatements) {
                try {
                    await prisma.$executeRawUnsafe(sql);
                    results.push({ success: true, sql: sql.substring(0, 50) + "..." });
                } catch (e: any) {
                    results.push({ success: false, error: e.message, sql: sql.substring(0, 50) + "..." });
                }
            }

            return NextResponse.json({ success: true, mode: 'full_repair', results });
        }

        // Default: Old Product Fix
        const sql = `
        CREATE TABLE IF NOT EXISTS "Product" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "price" INTEGER NOT NULL,
            "image" TEXT,
            "stripePriceId" TEXT,
            "stock" INTEGER NOT NULL DEFAULT 0,
            "isVisible" BOOLEAN NOT NULL DEFAULT true,
            "brand" TEXT,
            "category" TEXT,
            "condition" TEXT,
            "accessories" TEXT[],
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
        );
        `;
        const sql2 = `
        CREATE TABLE IF NOT EXISTS "ProductRestockSubscription" (
            "id" TEXT NOT NULL,
            "productId" TEXT NOT NULL,
            "userId" TEXT,
            "email" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "ProductRestockSubscription_pkey" PRIMARY KEY ("id")
        );
        `;
        await prisma.$executeRawUnsafe(sql);
        await prisma.$executeRawUnsafe(sql2);
        return NextResponse.json({ success: true, message: "Tables created" });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
