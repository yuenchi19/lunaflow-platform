
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    const email = 'yuenchi1991@gmail.com';
    const password = 'uverlove';
    console.log(`Setting up admin user: ${email}`);

    // Check if user exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Failed to list users:", listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log(`User exists (ID: ${existingUser.id}). Updating password...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password, user_metadata: { role: 'admin' }, email_confirm: true }
        );
        if (updateError) {
            console.error("Update failed:", updateError);
        } else {
            console.log("Password updated successfully.");
        }
    } else {
        console.log("User does not exist. Creating...");
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'admin' }
        });
        if (createError) {
            console.error("Create failed:", createError);
        } else {
            console.log("User created successfully:", data.user.id);
        }
    }
}

main();
