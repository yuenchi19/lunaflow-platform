
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function StoreSuccessPage() {
    const searchParams = useSearchParams();
    // we could verify session_id if needed

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                    ✓
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">ご購入ありがとうございます！</h1>
                <p className="text-slate-500 mb-8">
                    決済が完了しました。<br />
                    商品の発送まで今しばらくお待ちください。
                </p>
                <Link href="/student/store" className="block w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition">
                    ストアに戻る
                </Link>
            </div>
        </div>
    );
}
