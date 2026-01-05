
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

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
    console.log(`Attempting to create user: ${email}`);

    // 1. Try Create
    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: { name: 'Test Staff', role: 'admin' }
    });

    if (error) {
        console.log("Create Error Name:", error.name);
        console.log("Create Error Message:", error.message);
        console.log("Create Error Status:", error.status);

        if (error.message.includes("already registered") || error.status === 422 || error.status === 400) {
            console.log("User exists (presumably). Trying to find user...");

            // Try Public DB Lookup
            const { data: publicUser } = await supabase.from('User').select('id, email').eq('email', email).single();
            if (publicUser) {
                console.log(`Found in Public DB: ${publicUser.id}`);
            } else {
                console.log("Not in Public DB. Searching Auth List...");
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                if (listError) console.error("List Users Error:", listError);

                const found = users.find(u => u.email === email);
                console.log("Found in Auth List?", found ? found.id : "NO");
            }
        }
    } else {
        console.log("User Created Success:", data.user.id);
    }
}

main();
