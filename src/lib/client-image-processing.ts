import imageCompression from 'browser-image-compression';

export const processImageClientSide = async (file: File): Promise<File> => {
    // 1. Browser Check
    if (typeof window === 'undefined') return file;

    // 2. HEIC Handling (Use heic2any loaded dynamically)
    let fileToProcess = file;
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
        try {
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            console.log(`[Client] HEIC Converted: ${file.name} -> JPEG`);
            fileToProcess = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
        } catch (e) {
            console.error('[Client] HEIC Conversion Failed:', e);
            throw new Error('HEIC画像の変換に失敗しました。詳細: ' + (e as Error).message);
        }
    }

    // 3. Compression / Resizing
    try {
        console.log(`[Client] Processing Image: ${fileToProcess.name}, Size: ${(fileToProcess.size / 1024).toFixed(2)}KB`);
        const options = {
            maxSizeMB: 1, // Max 1MB
            maxWidthOrHeight: 1200, // Max 1200px
            useWebWorker: true,
            fileType: 'image/jpeg'
        };
        const compressedFile = await imageCompression(fileToProcess, options);
        console.log(`[Client] Compression Success: ${compressedFile.name}, Final Size: ${(compressedFile.size / 1024).toFixed(2)}KB`);

        // Return as File object
        return new File([compressedFile], fileToProcess.name, { type: 'image/jpeg' });
    } catch (e) {
        console.error('[Client] Compression Failed:', e);
        // If compression fails, try removing size limit or return original if acceptable
        throw new Error('画像の圧縮に失敗しました。ファイルが破損している可能性があります。');
    }
};
