import { createClient } from "./client";
import imageCompression from 'browser-image-compression';

const BUCKET_NAME = 'inventory-items';

export async function uploadInventoryImage(file: File): Promise<string | null> {
    const supabase = createClient();

    try {
        let fileToUpload = file;

        // 1. Try Compress Image
        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                // useWebWorker: true // Disable WebWorker if it causes issues on some devices
                // Fallback: If compression fails (e.g. HEIC on unsupported browser), we catch and use original.
            };
            fileToUpload = await imageCompression(file, options);
        } catch (compressionError) {
            console.warn("Image Compression Failed, using original file:", compressionError);
            // Fallback to original file
            fileToUpload = file;
        }

        // 2. Generate Unique Path
        // Ensure extension matches the actual file we are uploading (compressed might be blob/file)
        // If compressed, it usually becomes a Blob with correct type. 
        // We will default to original name extension or jpg if compressed.
        const originalExt = file.name.split('.').pop();
        const fileExt = originalExt || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        // 3. Upload
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, fileToUpload);

        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            // Throw specific error for RLS/Permission issues
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 4. Get Public URL
        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return data.publicUrl;

    } catch (error: any) {
        console.error("Image Upload Process Error:", error);
        throw new Error(error.message || "Image upload failed");
    }
}
