"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Plus, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function StudentInventoryNewPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        brand: '',
        name: '',
        category: '',
        costPrice: '',
        condition: 'B',
        note: '',
        // Kobutsusho Fields
        supplier: '',
        purchaseDate: new Date().toISOString().split('T')[0]
    });

    // Image Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const file = e.target.files[0];

        try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });

            if (res.ok) {
                const data = await res.json();
                setImages([...images, data.url]);
            } else {
                alert("画像のアップロードに失敗しました");
            }
        } catch (err) {
            console.error(err);
            alert("通信エラー");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Strict Validation
        if (images.length === 0) {
            alert("画像は必須です（少なくとも1枚）");
            return;
        }
        if (!formData.category || !formData.condition) {
            alert("カテゴリーと状態は必須です");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/student/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    costPrice: Number(formData.costPrice),
                    images
                })
            });

            if (res.ok) {
                router.push('/student/inventory');
                router.refresh();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (error) {
            alert("通信エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <Link href="/student/inventory" className="text-sm text-slate-500 hover:text-slate-700 mb-4 inline-block">
                    &larr; 一覧に戻る
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">商品を登録する</h1>
                <p className="text-sm text-slate-500 mt-1">
                    手元にある商品を在庫として登録します。
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Images */}
                {/* Images */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-2">商品画像 (メイン1枚 + サブ5枚) <span className="text-red-500">*</span></h3>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative w-24 h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                                <Image src={img} alt="Product" fill className="object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                                    className="absolute top-0 right-0 bg-black/50 text-white p-1 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {images.length < 6 && (
                            <label className={`w-24 h-24 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : <Plus className="w-6 h-6 text-slate-400" />}
                                <span className="text-[10px] text-slate-400 font-bold mt-1">追加</span>
                            </label>
                        )}
                    </div>
                    {images.length === 0 && <p className="text-xs text-red-500 mt-2 font-bold">※メイン画像は必須です。</p>}
                </div>

                {/* Basic Info */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-bold text-slate-700">基本情報</h3>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">ブランド名 <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={formData.brand}
                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Ex. Louis Vuitton"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">商品名 / モデル <span className="text-xs text-slate-400 font-normal ml-1">任意</span></label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Ex. Speedy 30"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">カテゴリー <span className="text-red-500">*</span></label>
                            <select
                                required
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white"
                            >
                                <option value="">選択してください</option>
                                <option value="Bags">バッグ</option>
                                <option value="Wallets">財布</option>
                                <option value="Accessories">アクセサリー</option>
                                <option value="Apparel">アパレル</option>
                                <option value="Other">その他</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">状態</label>
                            <select
                                value={formData.condition}
                                onChange={e => setFormData({ ...formData, condition: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white"
                            >
                                <option value="S">S (新品同様)</option>
                                <option value="A">A (非常に良い)</option>
                                <option value="B">B (良い)</option>
                                <option value="C">C (可)</option>
                                <option value="D">D (難あり)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">仕入れ価格 (円) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                value={formData.costPrice}
                                onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg pl-8 pr-4 py-2 font-mono text-lg font-bold text-slate-700"
                                placeholder="0"
                            />
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">¥</span>
                        </div>
                    </div>
                </div>

                {/* Ledger Details (Accordion) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <details className="group">
                        <summary className="flex items-center justify-between p-6 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors list-none">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-700">古物台帳 詳細情報</h3>
                                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">任意</span>
                            </div>
                            <span className="transition-transform group-open:rotate-180">
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                            </span>
                        </summary>
                        <div className="p-6 border-t border-slate-200 space-y-6 animate-in slide-in-from-top-2">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">購入日 (仕入れ日)</label>
                                <input
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">仕入れ先名 (購入元)</label>
                                <input
                                    type="text"
                                    value={formData.supplier}
                                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                                    placeholder="店舗名、個人名、オークションIDなど"
                                />
                                <p className="text-xs text-slate-400 mt-1">古物台帳の記録要件を満たすため、可能な限り入力してください。</p>
                            </div>
                        </div>
                    </details>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : '商品を登録する'}
                    </button>
                </div>
            </form>
        </div>
    );
}
