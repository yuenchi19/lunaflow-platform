
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastContext";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    stripePriceId: string;
    stock: number;
    isVisible: boolean;
}

export default function AdminProductPage() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form inputs
    const [formData, setFormData] = useState({
        name: '', description: '', price: 0, image: '', stock: 0, isVisible: true
    });

    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: uploadFormData
            });
            const data = await res.json();
            if (res.ok && data.url) {
                setFormData(prev => ({ ...prev, image: data.url }));
                showToast("画像をアップロードしました", "success");
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (e) {
            showToast("画像のアップロードに失敗しました", "error");
            console.error(e);
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/admin/inventory/products');
            if (res.ok) {
                setProducts(await res.json());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingProduct
                ? `/api/admin/inventory/products/${editingProduct.id}`
                : '/api/admin/inventory/products';

            const method = editingProduct ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                // Throw with specific message from server
                throw new Error(data.error || 'Save failed');
            }

            showToast(editingProduct ? "更新しました" : "登録しました", "success");
            fetchProducts();
            setIsAddModalOpen(false);
            setEditingProduct(null);
            resetForm();

        } catch (error: any) {
            console.error("Save Error:", error);
            showToast(error.message || "保存に失敗しました", "error");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', description: '', price: 0, image: '', stock: 0, isVisible: true
        });
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            stock: product.stock,
            isVisible: product.isVisible
        });
        setIsAddModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            const res = await fetch(`/api/admin/inventory/products/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            showToast("削除しました", "success");
            fetchProducts();
        } catch (e) {
            showToast("削除に失敗しました", "error");
        }
    };



    return (
        <div className="p-8 bg-[#FDFCFB] min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800">商品管理 (ストア販売用)</h1>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        resetForm();
                        setIsAddModalOpen(true);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition"
                >
                    ＋ 商品登録
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500">商品情報</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500">ブランド/カテゴリ</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500">価格</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500">在庫</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500">ステータス</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {p.image && <img src={p.image} className="w-10 h-10 object-cover rounded bg-slate-100" />}
                                        <div className="font-bold text-slate-800">{p.name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate">
                                    {p.description}
                                </td>
                                <td className="px-6 py-4 text-slate-600">¥{p.price.toLocaleString()}</td>
                                <td className="px-6 py-4 text-slate-600">{p.stock}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full font-bold ${p.isVisible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {p.isVisible ? '公開中' : '非公開'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openEdit(p)} className="text-indigo-600 text-xs font-bold hover:underline mr-4">編集</button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 text-xs font-bold hover:underline">削除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-[800px] max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600">👜</span>
                                {editingProduct ? '商品編集' : '新規商品登録'}
                            </h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">



                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">① メイン写真 *</label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                                            </div>
                                        )}
                                        {formData.image ? (
                                            <div className="relative">
                                                <img src={formData.image} alt="Main" className="h-40 mx-auto object-contain rounded" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, image: '' })}
                                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                                                >×</button>
                                            </div>
                                        ) : (
                                            <div className="py-8">
                                                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                                                    <span className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold mb-2">画像を選択</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleImageUpload}
                                                    />
                                                    <p className="text-xs text-slate-400">またはファイルをドロップ<br />(10MB以下)</p>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">商品名 *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none"
                                            placeholder="商品名を入力"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">商品説明 / メモ</label>
                                        <textarea
                                            className="w-full h-[120px] border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none resize-none"
                                            placeholder="商品の状態や特記事項を入力..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Removed Brand and Product Name section */}
                            {/* Removed Category and Condition section */}
                            {/* Removed Accessories section */}

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                {/* Images Section */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">販売価格 (円) *</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 font-bold">¥</span>
                                            <input
                                                type="number"
                                                required
                                                className="w-full bg-white border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500 font-mono text-lg"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">※Stripeにも自動反映されます</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">在庫数</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-white border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500 font-mono text-lg"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <input
                                    type="checkbox"
                                    id="isVisible"
                                    className="w-5 h-5 text-indigo-600 rounded bg-white border-gray-300"
                                    checked={formData.isVisible}
                                    onChange={e => setFormData({ ...formData, isVisible: e.target.checked })}
                                />
                                <label htmlFor="isVisible" className="text-sm font-bold text-yellow-800 cursor-pointer select-none">ストアに公開する</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">キャンセル</button>
                                <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-200 transition-colors">
                                    {editingProduct ? '更新して保存' : '商品を登録'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
