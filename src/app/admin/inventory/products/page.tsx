
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
        name: '', description: '', price: 0, image: '', stripePriceId: '', stock: 0, isVisible: true
    });

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

            if (!res.ok) throw new Error('Save failed');

            showToast(editingProduct ? "更新しました" : "登録しました", "success");
            fetchProducts();
            setIsAddModalOpen(false);
            setEditingProduct(null);
            setFormData({ name: '', description: '', price: 0, image: '', stripePriceId: '', stock: 0, isVisible: true });

        } catch (error) {
            showToast("保存に失敗しました", "error");
        }
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({ ...product });
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
                <h1 className="text-2xl font-bold text-slate-800">商品管理 (リペアグッズ)</h1>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setFormData({ name: '', description: '', price: 0, image: '', stripePriceId: '', stock: 0, isVisible: true });
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
                            <th className="px-6 py-4 text-xs font-bold text-slate-500">商品名</th>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-[500px] max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingProduct ? '商品編集' : '商品登録'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">商品名</label>
                                <input type="text" required className="w-full border rounded p-2"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">説明</label>
                                <textarea className="w-full border rounded p-2"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">価格 (¥)</label>
                                    <input type="number" required className="w-full border rounded p-2"
                                        value={formData.price} onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">在庫数</label>
                                    <input type="number" required className="w-full border rounded p-2"
                                        value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">画像URL</label>
                                <input type="text" className="w-full border rounded p-2"
                                    value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Stripe Price ID</label>
                                <input type="text" placeholder="price_..." className="w-full border rounded p-2"
                                    value={formData.stripePriceId} onChange={e => setFormData({ ...formData, stripePriceId: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="isVisible"
                                    checked={formData.isVisible} onChange={e => setFormData({ ...formData, isVisible: e.target.checked })} />
                                <label htmlFor="isVisible" className="text-sm font-bold text-slate-700">公開する</label>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded">キャンセル</button>
                                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
