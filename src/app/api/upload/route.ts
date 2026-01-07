import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        return NextResponse.json({ error: 'Server Config Error: Missing URL' }, { status: 500 });
    }

    let supabase;

    // Priority 1: Service Role Key (Bypass RLS)
    if (supabaseServiceKey) {
        supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    // Priority 2: SSR Client (User Auth / RLS)
    else if (supabaseAnonKey) {
        // Need to create a response object to handle cookie methods, though we won't use the response here for setting cookies
        // We just need to read cookies to pass to Supabase
        supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() { return req.cookies.getAll(); },
                    setAll(cookiesToSet) {
                        // We are not setting cookies in this upload handler, so empty implementation is fine for this purpose
                        // or we could assume we don't need to refresh tokens here as it's a simple upload
                    },
                },
            }
        );
    } else {
        return NextResponse.json({ error: 'Server Config Error: Missing Keys' }, { status: 500 });
    }

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

        // Check Bucket Existence (Only if using Service Key, otherwise listBuckets might fail RLS)
        if (supabaseServiceKey) {
            const { data: buckets } = await supabase.storage.listBuckets();
            if (!buckets?.find(b => b.name === bucketName)) {
                await supabase.storage.createBucket(bucketName, {
                    public: true,
                    fileSizeLimit: 10485760,
                    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
                });
            }
        }

        const { error } = await supabase.storage
            .from(bucketName)
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error("Upload error:", error);
            // Return detailed error for debugging
            return NextResponse.json({ error: `Storage Error: ${error.message}` }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(path);

        return NextResponse.json({ url: publicUrl });

    } catch (e: any) {
        console.error("Upload handler error:", e);
        return NextResponse.json({ error: `Server Error: ${e.message}` }, { status: 500 });
    }
}
