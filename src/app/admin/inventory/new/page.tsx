"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, Loader2, Camera } from "lucide-react";
import Link from "next/link";
import { uploadInventoryImage } from "@/lib/supabase/storage";

export default function NewInventoryItemPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        brand: "",
        name: "",
        category: "",
        costPrice: ""
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (images.length + newFiles.length > 5) {
                alert("画像は最大5枚まで登録可能です");
                return;
            }

            setImages(prev => [...prev, ...newFiles]);

            // Create Previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.brand || !form.costPrice) {
            alert("ブランド名と仕入れ価格は必須です");
            return;
        }

        setLoading(true);
        try {
            // 1. Upload Images
            const uploadedUrls: string[] = [];
            for (const file of images) {
                const url = await uploadInventoryImage(file);
                if (url) uploadedUrls.push(url);
            }

            // 2. Submit Data
            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    images: uploadedUrls
                }),
            });

            if (res.ok) {
                alert("商品を登録しました！");
                router.push('/admin/inventory');
                router.refresh();
            } else {
                const data = await res.json();
                alert(`エラー: ${data.error}`);
            }

        } catch (error) {
            console.error("Submit Error:", error);
            alert("通信エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Link href="/admin/inventory" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 mb-6 text-sm font-bold">
                    <ArrowLeft className="w-4 h-4" />
                    在庫一覧に戻る
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <PackageIcon className="w-5 h-5 text-indigo-600" />
                            新規商品登録
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">マスター在庫として登録します</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">

                        {/* Image Upload Area */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">商品画像 (最大5枚)</label>

                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                                {previewUrls.map((url, idx) => (
                                    <div key={idx} className="aspect-square rounded-lg border border-slate-200 overflow-hidden relative group">
                                        <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {images.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all gap-2"
                                    >
                                        <Camera className="w-6 h-6" />
                                        <span className="text-[10px] font-bold">追加</span>
                                    </button>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                            />
                            <p className="text-[10px] text-slate-400">※写真は自動的に圧縮されます。</p>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ブランド名 <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    value={form.brand}
                                    onChange={e => setForm({ ...form, brand: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors font-bold"
                                    placeholder="例: Chanel"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">商品名 / 型番 (任意)</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                                    placeholder="例: マトラッセ チェーンショルダー"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">カテゴリ</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                                    >
                                        <option value="">未選択</option>
                                        <option value="bag">バッグ</option>
                                        <option value="wallet">財布</option>
                                        <option value="accessory">小物・アクセ</option>
                                        <option value="apparel">アパレル</option>
                                        <option value="other">その他</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">仕入れ価格 (円) <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="number"
                                        value={form.costPrice}
                                        onChange={e => setForm({ ...form, costPrice: e.target.value })}
                                        className="w-full border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors font-mono"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-70"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? '登録中...' : '商品を登録'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

// Icon Helper
function PackageIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22v-8" />
        </svg>
    )
}
