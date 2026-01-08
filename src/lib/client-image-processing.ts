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
            fileToProcess = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
        } catch (e) {
            console.error('HEIC Conversion Failed:', e);
            throw new Error('HEIC画像の変換に失敗しました。詳細: ' + (e as Error).message);
        }
    }

    // 3. Compression / Resizing
    try {
        const options = {
            maxSizeMB: 1, // Max 1MB
            maxWidthOrHeight: 1200, // Max 1200px
            useWebWorker: true,
            fileType: 'image/jpeg'
        };
        const compressedFile = await imageCompression(fileToProcess, options);
        // Return as File object
        return new File([compressedFile], fileToProcess.name, { type: 'image/jpeg' });
    } catch (e) {
        console.error('Compression Failed:', e);
        // If compression fails, try removing size limit or return original if acceptable
        throw new Error('画像の圧縮に失敗しました。ファイルが破損している可能性があります。');
    }
};
