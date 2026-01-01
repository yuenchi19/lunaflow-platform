"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadInventoryImage } from "@/lib/supabase/storage";
import { Loader2, Upload, X } from "lucide-react";

// Categories from prompt
const CATEGORIES = [
    "Bag", "Wallet (Small)", "Wallet (Large)", "Key Case",
    "Cigarette Case", "Other Small Items", "Accessories",
    "Apparel (Tops)", "Apparel (Bottoms)", "Apparel (Outer)",
    "Shoes", "Watch", "Scarf", "Belt", "Perfume", "Tie", "Other Goods"
];

const CONDITIONS = [
    { id: 'S', label: 'S: 新品同様' },
    { id: 'A', label: 'A: 状態良好（リペア不要レベル）' },
    { id: 'B', label: 'B: 一般的な中古（使用感あり、リペア必要）' },
    { id: 'C', label: 'C: 小ダメージ（リペア必須）' },
    { id: 'D', label: 'D: 大ダメージ（困難なリペア）' },
];

const ACCESSORY_OPTIONS = [
    "箱", "保存袋", "ギャランティーカード",
    "ショルダーストラップ", "レシート", "その他"
];

export default function StudentInventoryNewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        brand: '',
        category: '',
        costPrice: '',
        condition: 'B',
        hasAccessories: false,
        accessories: [] as string[],
        note: ''
    });

    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
    const [damageImages, setDamageImages] = useState<File[]>([]);
    const [damageImagePreviews, setDamageImagePreviews] = useState<string[]>([]);

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setMainImage(file);
            setMainImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDamageImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setDamageImages(prev => [...prev, ...files]);
            const newPreviews = files.map(f => URL.createObjectURL(f));
            setDamageImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeDamageImage = (index: number) => {
        setDamageImages(prev => prev.filter((_, i) => i !== index));
        setDamageImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const toggleAccessory = (item: string) => {
        setFormData(prev => {
            if (prev.accessories.includes(item)) {
                return { ...prev, accessories: prev.accessories.filter(i => i !== item) };
            } else {
                return { ...prev, accessories: [...prev.accessories, item] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mainImage || !formData.brand || !formData.costPrice) {
            alert("必須項目を入力してください");
            return;
        }

        setLoading(true);
        setUploading(true);

        try {
            // 1. Upload Main Image
            const mainImageUrl = await uploadInventoryImage(mainImage);
            if (!mainImageUrl) throw new Error("Main image upload failed");

            // 2. Upload Damage Images
            const damageUrls = await Promise.all(damageImages.map(f => uploadInventoryImage(f)));
            const validDamageUrls = damageUrls.filter(u => u !== null) as string[];

            // 3. Submit Data
            const payload = {
                ...formData,
                costPrice: parseInt(formData.costPrice),
                images: [mainImageUrl],
                damageImages: validDamageUrls
            };

            const res = await fetch('/api/student/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Submission failed");
            }

            alert("商品を登録しました！");
            router.push('/student/dashboard'); // Or back to list if exists

        } catch (error: any) {
            console.error(error);
            alert("エラーが発生しました: " + error.message);
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white min-h-screen">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">商品登録 (Inventory Input)</h1>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 1. Main Photo */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">① メイン写真 <span className="text-red-500">*</span></label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                        {mainImagePreview ? (
                            <div className="relative w-full max-w-xs mx-auto">
                                <img src={mainImagePreview} alt="Preview" className="w-full h-auto rounded-lg shadow-sm" />
                                <button type="button" onClick={() => { setMainImage(null); setMainImagePreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <input type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" id="main-image" />
                                <label htmlFor="main-image" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload className="w-8 h-8 text-slate-400" />
                                    <span className="text-sm text-slate-500 font-bold">写真をアップロード</span>
                                </label>
                            </>
                        )}
                    </div>
                </div>

                {/* 2. Damage Photos */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">② 傷などの写真</label>
                    <div className="grid grid-cols-4 gap-4">
                        {damageImagePreviews.map((src, i) => (
                            <div key={i} className="relative aspect-square border rounded-lg overflow-hidden bg-slate-100">
                                <img src={src} alt="Damage" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeDamageImage(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
                            <PlusIcon />
                            <span className="text-xs font-bold text-slate-400 mt-1">追加</span>
                            <input type="file" accept="image/*" multiple onChange={handleDamageImagesChange} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">ブランド / メーカー <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="例: Louis Vuitton" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">カテゴリ <span className="text-red-500">*</span></label>
                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-300 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="">選択してください</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Condition */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">コンディションランク <span className="text-red-500">*</span></label>
                    <div className="space-y-2">
                        {CONDITIONS.map(c => (
                            <label key={c.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${formData.condition === c.id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50'}`}>
                                <input type="radio" name="condition" value={c.id} checked={formData.condition === c.id} onChange={e => setFormData({ ...formData, condition: e.target.value })} className="mr-3 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm font-bold text-slate-700">{c.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Accessories */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-bold text-slate-700">付属品の有無</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={formData.hasAccessories} onChange={() => setFormData({ ...formData, hasAccessories: true })} className="text-indigo-600" />
                                <span className="text-sm">あり</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={!formData.hasAccessories} onChange={() => setFormData({ ...formData, hasAccessories: false })} className="text-indigo-600" />
                                <span className="text-sm">なし</span>
                            </label>
                        </div>
                    </div>

                    {formData.hasAccessories && (
                        <div className="pl-4 border-l-2 border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-3">
                            {ACCESSORY_OPTIONS.map(opt => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.accessories.includes(opt)} onChange={() => toggleAccessory(opt)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                    <span className="text-sm text-slate-600">{opt}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Price */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">仕入れ単価 (¥) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input type="number" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-3 font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" />
                        <span className="absolute left-3 top-3.5 text-slate-400 font-bold">¥</span>
                    </div>
                    {formData.costPrice && (
                        <p className="text-xs text-indigo-600 font-bold text-right">
                            お客様表示価格 (15%UP): ¥{Math.floor(parseInt(formData.costPrice) * 1.15).toLocaleString()}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "登録する"}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-4">
                        ※登録内容は管理者に通知されます
                    </p>
                </div>

            </form>
        </div>
    );
}

function PlusIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-6 h-6 text-slate-300"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    )
}
