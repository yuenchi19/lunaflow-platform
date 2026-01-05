
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBuckets() {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('List buckets error:', error);
        return;
    }

    console.log('Buckets:', data.map(b => b.name));

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
        console.log(`Bucket '${bucketName}' already exists.`);
    }
}

checkBuckets();
