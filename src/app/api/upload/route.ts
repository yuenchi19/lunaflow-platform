import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });

    let supabase;
    if (supabaseServiceKey) supabase = createClient(supabaseUrl, supabaseServiceKey);
    else if (supabaseAnonKey) supabase = createServerClient(supabaseUrl, supabaseAnonKey, { cookies: { getAll() { return req.cookies.getAll(); }, setAll() { } } });
    else return NextResponse.json({ error: 'Missing Keys' }, { status: 500 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const bucket = formData.get('bucket') as string || 'product-images';

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

        let buffer = Buffer.from(await file.arrayBuffer());
        let contentType = file.type;
        let filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // Sharp Conversion (HEIC/HEIF -> JPEG)
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            try {
                const sharp = require('sharp');
                buffer = await sharp(buffer)
                    .toFormat('jpeg', { quality: 80 })
                    .toBuffer();
                contentType = 'image/jpeg';
                filename = filename.replace(/\.(heic|heif)$/i, '.jpg');
            } catch (e: any) {
                console.error("Sharp conversion failed:", e);
                return NextResponse.json({ error: '画像の変換に失敗しました' }, { status: 500 });
            }
        }

        const path = `${filename}`;

        // Ensure Bucket (Service Key only)
        if (supabaseServiceKey) {
            const { data: buckets } = await supabase.storage.listBuckets();
            if (!buckets?.find(b => b.name === bucket)) {
                await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 10485760 });
            }
        }

        const { error } = await supabase.storage.from(bucket).upload(path, buffer, { contentType, upsert: true });

        if (error) {
            console.error("Supabase Upload Error:", error);
            return NextResponse.json({ error: `アップロード失敗: ${error.message}` }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

        return NextResponse.json({ url: publicUrl });

    } catch (e: any) {
        console.error("Upload Handler Error:", e);
        return NextResponse.json({ error: `システムエラー: ${e.message}` }, { status: 500 });
    }
}
