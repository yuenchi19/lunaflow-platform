
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use a fresh client to avoid global state issues in this debug route
const prisma = new PrismaClient();

export async function GET() {
    try {
        const dbUrl = process.env.DATABASE_URL || "";
        const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');

        // Check tables
        let productCount = "Error";
        let courseCount = "Error";
        let userCount = "Error";
        let dbError = null;

        try { productCount = (await prisma.product.count()).toString(); } catch (e: any) { dbError = e.message; productCount = "Table Missing/Error"; }
        try { courseCount = (await prisma.course.count()).toString(); } catch (e) { }
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
                users: userCount
            },
            error: dbError
        }, { status: 200 });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        // Raw SQL to create Product table if missing
        // Copied strictly from schema.prisma definition
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

        // Also create the relation table if needed
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

        // Add Foreign Keys? 
        // Failing to add FK is fine for immediate fix, but let's try.
        // ALTER TABLE "ProductRestockSubscription" ADD CONSTRAINT "ProductRestockSubscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

        return NextResponse.json({ success: true, message: "Tables created via Raw SQL" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
