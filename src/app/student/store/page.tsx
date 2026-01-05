
"use client";

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/ToastContext';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
}

export default function StudentStorePage() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                if (res.ok) setProducts(await res.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleBuy = async (productId: string) => {
        try {
            const res = await fetch('/api/products/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Checkout failed');
            }
        } catch (e: any) {
            showToast(e.message, "error");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Store...</div>;

    return (
        <div className="p-4 md:p-8 min-h-screen bg-[#FDFCFB]">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2 font-serif">Repar Goods Store</h1>
                    <p className="text-slate-500">ブランド転売の実践に役立つ、厳選リペアグッズをご用意しました。</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map(product => (
                        <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300 bg-slate-50">No Image</div>
                                )}
                                {product.stock < 1 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="bg-black text-white px-4 py-1 font-bold text-sm tracking-widest uppercase">SOLD OUT</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-xl text-slate-800 mb-2">{product.name}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">{product.description}</p>

                                <div className="flex items-end justify-between mt-4">
                                    <div className="text-2xl font-bold text-slate-900 font-serif">
                                        ¥{product.price.toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => handleBuy(product.id)}
                                        disabled={product.stock < 1}
                                        className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${product.stock > 0
                                                ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:shadow-lg hover:-translate-y-0.5'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {product.stock > 0 ? '購入する' : '在庫切れ'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {products.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-400">現在販売中の商品はございません。</p>
                    </div>
                )}
            </div>
        </div>
    );
}
