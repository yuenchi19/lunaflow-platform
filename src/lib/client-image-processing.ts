import imageCompression from 'browser-image-compression';

export const processImageClientSide = async (file: File): Promise<File> => {
    // 1. Browser Check
    if (typeof window === 'undefined') return file;

    // 2. HEIC Handling (Use heic2any loaded dynamically)
    let fileToProcess = file;
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
        try {
            const heic2any = (await import('heic2any')).default;
            // Force conversion to ArrayBuffer first to avoid Blob issues
            const arrayBuffer = await file.arrayBuffer();
            // Strategy 1: image/heic
            try {
                console.log('[Client] Trying HEIC conversion (Strategy 1: image/heic)...');
                const blob = new Blob([arrayBuffer], { type: 'image/heic' });
                const result = await heic2any({ blob, toType: 'image/jpeg', quality: 0.8 });
                const jpgBlob = Array.isArray(result) ? result[0] : result;
                fileToProcess = new File([jpgBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
            } catch (e1) {
                console.warn('[Client] Strategy 1 failed.', e1);

                // Strategy 2: image/heif
                try {
                    console.log('[Client] Trying HEIC conversion (Strategy 2: image/heif)...');
                    const blob = new Blob([arrayBuffer], { type: 'image/heif' });
                    const result = await heic2any({ blob, toType: 'image/jpeg', quality: 0.8 });
                    const jpgBlob = Array.isArray(result) ? result[0] : result;
                    fileToProcess = new File([jpgBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
                } catch (e2) {
                    console.warn('[Client] Strategy 2 failed.', e2);

                    // Strategy 3: application/octet-stream (Raw)
                    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
                    const result = await heic2any({ blob, toType: 'image/jpeg', quality: 0.8 });
                    const jpgBlob = Array.isArray(result) ? result[0] : result;
                    fileToProcess = new File([jpgBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
                }
            }
        } catch (e) {
            console.error('[Client] HEIC Conversion Failed:', e);
            // Don't throw immediately, fallback or specific error
            throw new Error(`HEIC変換エラー: ${(e as any).message || '不明なエラー'}`);
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
