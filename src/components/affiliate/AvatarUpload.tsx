"use client";

import { useState } from 'react';
import { Loader2, Camera, UploadCloud } from 'lucide-react';
import Image from 'next/image';

interface AvatarUploadProps {
    currentAvatarUrl: string | null;
    onUploadComplete: (url: string) => void;
}

export default function AvatarUpload({ currentAvatarUrl, onUploadComplete }: AvatarUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validating file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/heic', 'image/heif'];
        if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
            setError('JPEG, PNG, GIF, HEIC形式のみアップロード可能です');
            return;
        }

        setIsUploading(true);
        setError(null);

        // Optimistic preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'avatars'); // Use specific bucket for avatars

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await res.json();
            onUploadComplete(data.url);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'アップロードに失敗しました');
            setPreviewUrl(currentAvatarUrl); // Revert preview
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                    {previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt="Avatar"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-slate-300">
                            <Camera size={32} />
                        </div>
                    )}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer shadow-sm transition-colors">
                        <UploadCloud size={16} />
                        <span>画像をアップロード</span>
                        <input
                            type="file"
                            accept="image/*,.heic,.heif"
                            onChange={handleFileChange}
                            disabled={isUploading}
                            className="hidden"
                        />
                    </label>
                    <p className="mt-2 text-xs text-slate-500">
                        推奨サイズ: 400x400px (JPG, PNG)<br />
                        ※HEICファイルも自動変換されます
                    </p>
                    {error && (
                        <p className="mt-1 text-xs text-red-600">{error}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
