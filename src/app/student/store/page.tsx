
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

    const handleRestockRequest = async (productId: string) => {
        // Ideally prompt for email or use user's email. For now assuming user is logged in and we use their account email or prompt logic.
        // Or simpler: Just tell them "Registered".
        // Let's ask for email via a simple prompt or assume we fetch it? 
        // User said "Student registers email".
        // I'll make a simple prompt.
        const email = prompt("通知を受け取るメールアドレスを入力してください:", "");
        if (!email) return;

        try {
            const res = await fetch('/api/products/restock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, email })
            });
            if (res.ok) {
                alert("再入荷通知登録が完了しました。");
            } else {
                alert("登録に失敗しました。");
            }
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました。");
        }
    };

    if (loading) return <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4"><div className="animate-spin h-10 w-10 border-4 border-[#1E3A8A] border-t-transparent rounded-full"></div></div>;

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

                                <div className="flex flex-col items-start justify-between mt-4">
                                    <div className="text-2xl font-bold text-slate-900 font-serif mb-4">
                                        ¥{product.price.toLocaleString()}
                                    </div>
                                    {product.stock > 0 ? (
                                        <button
                                            onClick={() => handlePurchase(product.id)}
                                            className="w-full bg-[#1E3A8A] text-white font-bold py-3 rounded-lg hover:bg-[#2C3E50] transition shadow-md"
                                        >
                                            購入手続きへ
                                        </button>
                                    ) : (
                                        <div className="w-full space-y-2">
                                            <button
                                                onClick={() => handleRestockRequest(product.id)}
                                                className="w-full bg-slate-200 text-slate-600 font-bold py-3 rounded-lg hover:bg-slate-300 transition"
                                            >
                                                再入荷通知を受け取る
                                            </button>
                                            <p className="text-center text-xs text-slate-500">※入荷時にメールでお知らせします</p>
                                        </div>
                                    )}
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
