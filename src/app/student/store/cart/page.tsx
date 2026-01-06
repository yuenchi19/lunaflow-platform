
"use client";

import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/ToastContext";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();
    const { showToast } = useToast();
    const router = useRouter();
    const [bundleWithOmakase, setBundleWithOmakase] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleCheckout = async () => {
        if (bundleWithOmakase) {
            router.push('/student/dashboard?openPurchase=true');
            return;
        }

        setIsCheckingOut(true);
        try {
            const res = await fetch('/api/products/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Checkout failed');
            }
        } catch (e: any) {
            showToast(e.message || "エラーが発生しました", "error");
            setIsCheckingOut(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] p-8 flex flex-col items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
                    <div className="text-6xl mb-4">🛒</div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">カートは空です</h2>
                    <p className="text-slate-500 mb-8">ストアでお買い物を続けましょう。</p>
                    <Link href="/student/store" className="bg-[#1E3A8A] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2C3E50] transition block w-full">
                        ストアへ戻る
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Link href="/student/store" className="text-slate-400 hover:text-indigo-600 transition">←</Link>
                    ショッピングカート
                </h1>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                    <div className="divide-y divide-slate-100">
                        {items.map(item => (
                            <div key={item.id} className="p-6 flex flex-col md:flex-row items-center gap-6">
                                <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>
                                    )}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                                    <p className="text-indigo-600 font-bold">¥{item.price.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-50 font-bold"
                                        disabled={item.quantity <= 1}
                                    >−</button>
                                    <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-50 font-bold"
                                        disabled={item.quantity >= item.stock}
                                    >+</button>
                                </div>
                                <div className="text-right min-w-[100px]">
                                    <div className="font-bold text-lg text-slate-900">¥{(item.price * item.quantity).toLocaleString()}</div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-xs text-red-500 hover:underline mt-1"
                                    >削除</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xl font-bold text-slate-600">合計金額</span>
                        <span className="text-3xl font-bold text-slate-900">¥{totalAmount.toLocaleString()}</span>
                    </div>

                    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={bundleWithOmakase}
                                onChange={(e) => setBundleWithOmakase(e.target.checked)}
                                className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <div>
                                <span className="font-bold text-indigo-900 block">次回の『おまかせ仕入れ』に同梱して発送する</span>
                                <span className="text-xs text-indigo-700 block mt-0.5">※送料がお得になります（仕入れ送料との比較で高い方1件分のみ適用）</span>
                            </div>
                        </label>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="w-full bg-[#1E3A8A] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#2C3E50] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCheckingOut ? '処理中...' : (bundleWithOmakase ? '仕入れ依頼へ進む' : 'レジへ進む')}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">
                        ※Stripeによる安全な決済が行われます
                    </p>
                </div>
            </div>
        </div>
    );
}
