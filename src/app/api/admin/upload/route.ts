
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

        const { data, error } = await supabase.storage
            .from('product-images')
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
