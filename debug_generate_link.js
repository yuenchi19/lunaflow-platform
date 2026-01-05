
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
    console.log("Testing generateLink for existing user...");
    // Use a known existing email or one that definitely exists in Auth
    const email = "yuenchi1991@gmail.com";

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email
    });

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success!");
        console.log("User ID in data?:", data.user?.id);
        if (data.user) {
            console.log("User object found:", data.user.id);
        } else {
            console.log("User object NOT found in data");
        }
    }
}

test();
