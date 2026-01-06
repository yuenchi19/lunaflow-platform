
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const path = `products/${filename}`;
        const bucketName = 'product-images';

        // Auto-create bucket if not exists
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find(b => b.name === bucketName)) {
            console.log(`Bucket ${bucketName} not found. Creating...`);
            await supabase.storage.createBucket(bucketName, {
                public: true,
                fileSizeLimit: 10485760,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });
            // Public access policy is usually separate in SQL, but public: true helps for read.
            // Note: If RLS is enabled, we might need a policy. 
            // For now, assuming basic Supabase setup allows creator to write.
        }

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error("Upload error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(path);

        return NextResponse.json({ url: publicUrl });

    } catch (e: any) {
        console.error("Upload handler error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
