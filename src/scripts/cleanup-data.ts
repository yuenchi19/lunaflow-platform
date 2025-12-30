
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function cleanupData() {
    console.log('Starting data cleanup...');

    // 1. Delete all users who are NOT admins or staff
    // We'll query the public 'User' table first
    const { data: usersToDelete, error: fetchError } = await supabase
        .from('User')
        .select('id, email, role')
        .not('role', 'in', '("admin","staff")'); // Keep admin and staff

    if (fetchError) {
        console.error('Error fetching users to delete:', fetchError);
        return;
    }

    if (!usersToDelete || usersToDelete.length === 0) {
        console.log('No eligible dummy users found to delete.');
        return;
    }

    console.log(`Found ${usersToDelete.length} users to delete.`);

    for (const user of usersToDelete) {
        console.log(`Deleting user: ${user.email} (${user.id})`);

        // Delete from public 'User' table (Others should cascade if configured, but let's be safe)
        // Purchases, etc. might be linked.

        // First, delete related purchases
        const { error: purchaseError } = await supabase
            .from('purchases')
            .delete()
            .eq('user_id', user.id);

        if (purchaseError) console.error(`Failed to delete purchases for ${user.id}:`, purchaseError);

        // Delete from public 'User' table
        const { error: deletePublicError } = await supabase
            .from('User')
            .delete()
            .eq('id', user.id);

        if (deletePublicError) {
            console.error(`Failed to delete public profile for ${user.id}:`, deletePublicError);
            continue;
        }

        // Delete from Auth (Supabase Auth)
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);

        if (deleteAuthError) {
            console.error(`Failed to delete auth user ${user.id}:`, deleteAuthError);
        } else {
            console.log(`Successfully deleted ${user.email}`);
        }
    }

    console.log('Cleanup completed.');
}

cleanupData().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
