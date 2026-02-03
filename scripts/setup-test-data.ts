
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load Env
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else {
    dotenv.config({ path: envPath });
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase Env Vars");
    process.exit(1);
}

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

const prisma = new PrismaClient();

const USERS = [
    { email: 'test-admin@lunaflow.com', password: 'password123', role: 'admin', name: 'Test Admin' },
    { email: 'test-partner@lunaflow.com', password: 'password123', role: 'student', plan: 'partner', name: 'Test Partner', affiliateCode: 'TESTPARTNER' },
    { email: 'test-student@lunaflow.com', password: 'password123', role: 'student', plan: 'light', name: 'Test Student' },
];

async function main() {
    console.log("Starting Test Data Setup...");

    for (const u of USERS) {
        console.log(`Processing ${u.email}...`);

        let authUser;
        try {
            // 1. Check Auth User
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            authUser = users.find((x: any) => x.email === u.email);

            if (!authUser) {
                console.log(`Creating Auth User: ${u.email}`);
                const { data, error } = await supabaseAdmin.auth.admin.createUser({
                    email: u.email,
                    password: u.password,
                    email_confirm: true,
                    user_metadata: {
                        role: u.role,
                        plan: u.plan || 'student',
                        name: u.name
                    }
                });
                if (error) {
                    // Check if already exists (race condition or soft delete?)
                    if (error.message.includes('already registered')) {
                        console.log("User already registered (caught error). linking...");
                        // Retry find?
                        const { data: { users: usersRetry } } = await supabaseAdmin.auth.admin.listUsers();
                        authUser = usersRetry.find((x: any) => x.email === u.email);
                    } else {
                        console.error(`Failed to create ${u.email}:`, error.message);
                        continue;
                    }
                } else {
                    authUser = data.user;
                }
            } else {
                console.log(`Auth User exists: ${u.email}`);
                await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
                    user_metadata: {
                        role: u.role,
                        plan: u.plan || 'student',
                        name: u.name
                    },
                    password: u.password
                });
            }
        } catch (e) {
            console.error("Auth Error:", e);
            continue;
        }

        if (!authUser) {
            console.error("Could not find or create auth user.");
            continue;
        }

        // 2. Sync to DB
        console.log(`Syncing DB for ${u.email}`);
        try {
            await prisma.user.upsert({
                where: { id: authUser.id },
                create: {
                    id: authUser.id,
                    email: u.email,
                    name: u.name,
                    role: u.role,
                    plan: u.plan || 'student',
                    affiliateCode: u.affiliateCode || undefined
                },
                update: {
                    role: u.role,
                    plan: u.plan || 'student',
                    affiliateCode: u.affiliateCode || undefined
                }
            });
        } catch (e) {
            console.error("DB Error:", e);
        }
    }

    // 3. Create Dummy Product
    console.log("Creating Dummy Product...");
    try {
        const existingProduct = await prisma.product.findFirst({ where: { name: 'Test Product (Digital)' } });
        if (!existingProduct) {
            await prisma.product.create({
                data: {
                    name: 'Test Product (Digital)',
                    description: 'For testing',
                    price: 100,
                    stock: 100,
                    category: 'general',
                    image: '',
                    stripePriceId: 'price_test_dummy'
                }
            });
            console.log("Created Test Product.");
        } else {
            console.log("Test Product exists.");
        }
    } catch (e) {
        console.error("Product Creation Error:", e);
    }

    console.log("Done!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
