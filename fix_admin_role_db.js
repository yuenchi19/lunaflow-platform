
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const email = 'yuenchi1991@gmail.com';
    console.log(`Syncing admin role to public.User for: ${email}`);

    // 1. Get Auth User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("List users failed:", listError);
        return;
    }
    const authUser = users.find(u => u.email === email);

    if (!authUser) {
        console.error("User not found in Auth! Run setup_admin.js first.");
        return;
    }

    console.log(`Auth User ID: ${authUser.id}`);

    // 2. Check Public User Table by Email first to avoid unique constraint error
    const { data: existingPublicUser, error: findError } = await supabase
        .from('User')
        .select('id')
        .eq('email', email)
        .single();

    if (existingPublicUser) {
        console.log(`Found existing Public User by Email (ID: ${existingPublicUser.id}). Updating role...`);
        const { error: updateError } = await supabase
            .from('User')
            .update({
                role: 'admin',
                plan: 'premium',
                subscriptionStatus: 'active',
                updatedAt: new Date().toISOString()
            })
            .eq('id', existingPublicUser.id);

        if (updateError) console.error("Update failed:", updateError);
        else console.log("Update Success (Existing User).");
        return;
    }

    // 3. Update Public User Table (Upsert by ID if not found by email - unlikely given error)
    console.log("User not found by email in public DB. Inserting...");
    const { error: upsertError } = await supabase
        .from('User')
        .upsert({
            id: authUser.id,
            email: email,
            role: 'admin',
            // Default fields to avoid constraints if new
            name: 'Admin',
            plan: 'premium',
            subscriptionStatus: 'active',
            updatedAt: new Date().toISOString()
        }, { onConflict: 'id' });

    if (upsertError) {
        console.error("DB Update failed:", upsertError);
    } else {
        console.log("DB Update Success: User inserted and Role set to 'admin'");
    }
}

main();
