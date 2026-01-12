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

        // STRICT VALIDATION REMOVED: Allow HEIC as fallback
        // The client attempts conversion, but if it fails, we accept the raw file 
        // to prevent blocking the user.
        /*
        const isHeic = file.type === 'image/heic' ||
            file.type === 'image/heif' ||
            file.name.toLowerCase().endsWith('.heic') ||
            file.name.toLowerCase().endsWith('.heif');

        if (isHeic) {
            console.error("Server received HEIC file. Rejecting.");
            return NextResponse.json(
                { error: 'HEIC形式はサーバーで処理できません。クライアント側でJPEGに変換してください。' },
                { status: 400 }
            );
        }
        */

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
