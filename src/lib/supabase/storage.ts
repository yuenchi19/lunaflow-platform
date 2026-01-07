import { createClient } from "./client";
import imageCompression from 'browser-image-compression';

const BUCKET_NAME = 'inventory-items';

export async function uploadInventoryImage(file: File): Promise<string | null> {
    const supabase = createClient();

    try {
        let fileToUpload = file;

        // HEIC Conversion (Client-side)
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
            try {
                // Dynamic import to avoid SSR issues
                const heic2any = (await import('heic2any')).default;
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.8
                });

                // heic2any can return Blob or Blob[]
                const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

                // Convert Blob back to File for consistency with downstream logic
                fileToUpload = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
            } catch (heicError) {
                console.warn("HEIC Conversion failed:", heicError);
                // Continue with original file (Fallback logic will catch compression failure if any)
            }
        }

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
