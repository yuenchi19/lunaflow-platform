"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, Loader2, Camera } from "lucide-react";
import Link from "next/link";
import { uploadInventoryImage } from "@/lib/supabase/storage";

export default function NewInventoryItemPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    // Main Images
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    // Damage Images
    const [damageImages, setDamageImages] = useState<File[]>([]);
    const [damagePreviewUrls, setDamagePreviewUrls] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const damageInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        brand: "",
        name: "",
        category: "",
        costPrice: "",
        condition: "",
        hasAccessories: false,
        accessories: [] as string[],
        note: ""
    });

    // Constants
    const CATEGORIES = [
        { id: "bag", label: "バッグ" },
        { id: "wallet_small", label: "財布（小さい）" },
        { id: "wallet_large", label: "財布（大きい）" },
        { id: "key_case", label: "キーケース" },
        { id: "cigarette_case", label: "シガーレットケース" },
        { id: "other_small", label: "その他小物いれ" },
        { id: "accessory", label: "アクセサリー" },
        { id: "apparel_tops", label: "アパレル（トップス）" },
        { id: "apparel_bottoms", label: "アパレル（ボトムス）" },
        { id: "apparel_outer", label: "アパレル（アウター）" },
        { id: "shoes", label: "シューズ" },
        { id: "watch", label: "時計" },
        { id: "scarf", label: "スカーフ" },
        { id: "belt", label: "ベルト" },
        { id: "perfume", label: "香水" },
        { id: "tie", label: "ネクタイ" },
        { id: "other", label: "その他雑貨" }
    ];

    const CONDITIONS = [
        { id: "S", label: "S：新品同様" },
        { id: "A", label: "A：状態良好（リペア不要レベル）" },
        { id: "B", label: "B：一般的な中古（使用感あり、リペア必要）" },
        { id: "C", label: "C：小ダメージ（リペア必須）" },
        { id: "D", label: "D：大ダメージ（困難なリペア）" }
    ];

    const ACCESSORIES_LIST = [
        "箱", "保存袋", "ギャランティーカード", "ショルダーストラップ", "レシート", "その他"
    ];

    // Image Handlers
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'damage') => {
        if (e.target.files) {
            setLoading(true);
            try {
                const { processImageClientSide } = await import("@/lib/client-image-processing");
                const newFiles = Array.from(e.target.files);
                const processedFiles: File[] = [];

                for (const file of newFiles) {
                    try {
                        console.log(`Processing file: ${file.name}`);
                        const processed = await processImageClientSide(file);
                        processedFiles.push(processed);
                    } catch (err) {
                        console.error("File processing failed", err);
                        alert(`ファイルの処理に失敗しました: ${file.name}`);
                    }
                }

                if (type === 'main') {
                    if (images.length + processedFiles.length > 1) {
                        alert("メイン画像は1枚のみです");
                        setLoading(false);
                        return;
                    }
                    setImages(prev => [...prev, ...processedFiles]);
                    setPreviewUrls(prev => [...prev, ...processedFiles.map(f => URL.createObjectURL(f))]);
                } else {
                    if (damageImages.length + processedFiles.length > 5) {
                        alert("ダメージ画像は最大5枚まで");
                        setLoading(false);
                        return;
                    }
                    setDamageImages(prev => [...prev, ...processedFiles]);
                    setDamagePreviewUrls(prev => [...prev, ...processedFiles.map(f => URL.createObjectURL(f))]);
                }
            } catch (error) {
                console.error("Error processing images:", error);
                alert("画像の処理中にエラーが発生しました。");
            } finally {
                setLoading(false);
            }
        }
    };

    const removeImage = (index: number, type: 'main' | 'damage') => {
        if (type === 'main') {
            setImages(prev => prev.filter((_, i) => i !== index));
            setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        } else {
            setDamageImages(prev => prev.filter((_, i) => i !== index));
            setDamagePreviewUrls(prev => prev.filter((_, i) => i !== index));
        }
    };

    const toggleAccessory = (item: string) => {
        setForm(prev => {
            const newAcc = prev.accessories.includes(item)
                ? prev.accessories.filter(a => a !== item)
                : [...prev.accessories, item];
            return { ...prev, accessories: newAcc };
        });
    };

    const sellingPrice = form.costPrice ? Math.floor(Number(form.costPrice) * 1.15) : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.brand || !form.costPrice) {
            alert("必須項目を入力してください");
            return;
        }

        setLoading(true);
        try {

            // Upload Images - Images are ALREADY PROCESSED in handleFileSelect
            const mainUrls = [];
            for (const file of images) {
                // file is already a processed JPEG File object
                const url = await uploadInventoryImage(file);
                if (url) mainUrls.push(url);
            }
            const damageUrls = [];
            for (const file of damageImages) {
                // file is already a processed JPEG File object
                const url = await uploadInventoryImage(file);
                if (url) damageUrls.push(url);
            }

            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    sellingPrice,
                    images: mainUrls,
                    damageImages: damageUrls,
                    hasAccessories: form.accessories.length > 0
                }),
            });

            if (res.ok) {
                alert("登録完了！");
                router.push('/admin/inventory');
                router.refresh();
            } else {
                const d = await res.json();
                alert(`エラー: ${d.error}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`エラー: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
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
                        <p className="text-xs text-slate-500 mt-1">詳細情報を入力して在庫を登録します</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">

                        {/* Images Section */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">① メイン写真 <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-3 gap-2">
                                    {previewUrls.map((url, i) => (
                                        <div key={i} className="aspect-square relative group">
                                            <img src={url} className="w-full h-full object-cover rounded-md border border-slate-200" />
                                            <button type="button" onClick={() => removeImage(i, 'main')} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                    {images.length < 1 && (
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:bg-slate-50"><Camera className="w-6 h-6" /></button>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={e => handleFileSelect(e, 'main')} />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">② 傷・ダメージ写真</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {damagePreviewUrls.map((url, i) => (
                                        <div key={i} className="aspect-square relative group">
                                            <img src={url} className="w-full h-full object-cover rounded-md border border-slate-200" />
                                            <button type="button" onClick={() => removeImage(i, 'damage')} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                    {damageImages.length < 5 && (
                                        <button type="button" onClick={() => damageInputRef.current?.click()} className="aspect-square rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:bg-slate-50"><Camera className="w-6 h-6" /></button>
                                    )}
                                </div>
                                <input type="file" ref={damageInputRef} hidden accept="image/*" multiple onChange={e => handleFileSelect(e, 'damage')} />
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Basic Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">ブランド名 <span className="text-red-500">*</span></label>
                                <input required value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full border border-slate-200 rounded p-2.5 font-bold" placeholder="例: Chanel" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">商品名 / 型番</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded p-2.5" placeholder="例: マトラッセ" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">カテゴリ <span className="text-red-500">*</span></label>
                                <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border border-slate-200 rounded p-2.5 bg-white">
                                    <option value="">選択してください</option>
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">コンディションランク</label>
                                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="w-full border border-slate-200 rounded p-2.5 bg-white">
                                    <option value="">選択してください</option>
                                    {CONDITIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Accessories */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">付属品</label>
                            <div className="flex flex-wrap gap-3">
                                {ACCESSORIES_LIST.map(item => (
                                    <label key={item} className={`cursor-pointer px-3 py-1.5 rounded-full border text-sm font-bold transition-all ${form.accessories.includes(item) ? 'bg-indigo-100 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                        <input type="checkbox" className="hidden" checked={form.accessories.includes(item)} onChange={() => toggleAccessory(item)} />
                                        {item}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Calculation */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">仕入れ価格 (円) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">¥</span>
                                    <input required type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded text-lg font-bold font-mono" placeholder="0" />
                                </div>
                            </div>
                            <div className="text-right md:text-left">
                                <label className="block text-xs font-bold text-slate-500 mb-1">販売価格 (自動計算 115%)</label>
                                <div className="text-2xl font-bold text-indigo-600 font-mono">
                                    ¥{sellingPrice.toLocaleString()}
                                </div>
                                <p className="text-[10px] text-slate-400">※顧客ページにはこの価格が表示されます</p>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded text-slate-500 font-bold hover:bg-slate-100">キャンセル</button>
                            <button type="submit" disabled={loading} className="px-8 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? '登録中...' : '登録する'}
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
