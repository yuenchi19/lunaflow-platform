
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
    console.log('Verifying User + PurchaseRequest relation...');

    // Fetch 1 user with PurchaseRequest
    // We try to find a user who MIGHT have purchases.
    const { data, error } = await supabase
        .from('User')
        .select(`
            id,
            email,
            PurchaseRequest (
                id,
                amount,
                status
            )
        `)
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! Data returned:', JSON.stringify(data, null, 2));
    }
}

verify();
