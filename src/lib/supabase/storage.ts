import { createClient } from "./client";
import imageCompression from 'browser-image-compression';

const BUCKET_NAME = 'inventory-items';

export async function uploadInventoryImage(file: File): Promise<string | null> {
    const supabase = createClient();

    try {
        // 1. Compress Image
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true
        };
        const compressedFile = await imageCompression(file, options);

        // 2. Generate Unique Path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        // 3. Upload
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, compressedFile);

        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            // If bucket doesn't exist, we might need to handle creation or assume it exists.
            // For now, logging error.
            return null;
        }

        // 4. Get Public URL
        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return data.publicUrl;

    } catch (error) {
        console.error("Image Processing Error:", error);
        return null;
    }
}
