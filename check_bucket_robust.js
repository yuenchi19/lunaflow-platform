
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
let env = {};
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        }
    });
} catch (e) {
    console.error('Could not read .env.local', e);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars. URLs:', supabaseUrl);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBuckets() {
    console.log('Checking buckets...');
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('List buckets error:', error);
        return;
    }

    const bucketName = 'product-images';
    const exists = data.find(b => b.name === bucketName);

    if (!exists) {
        console.log(`Bucket '${bucketName}' not found. Creating...`);
        const { data: createData, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });
        if (createError) {
            console.error('Create bucket error:', createError);
        } else {
            console.log(`Bucket '${bucketName}' created successfully.`);
        }
    } else {
        console.log(`Bucket '${bucketName}' already exists. Updating public status to be sure.`);
        // Ensure it's public (updateBucket is not always available/needed if already public, but let's try)
        await supabase.storage.updateBucket(bucketName, { public: true });
    }

    // List files to verify
    const { data: files } = await supabase.storage.from(bucketName).list();
    console.log(`Files in bucket: ${files?.length || 0}`);
}

checkBuckets();
