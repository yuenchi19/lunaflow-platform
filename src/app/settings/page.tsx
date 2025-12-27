"use client";

import { useState, useEffect } from "react";
import { MOCK_USERS } from "@/lib/data";
import { ArrowLeft, Mail, MapPin, Save } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const defaultUser = MOCK_USERS[0];
    const [email, setEmail] = useState(defaultUser.email);
    const [address, setAddress] = useState(defaultUser.address || "");
    const [phoneNumber, setPhoneNumber] = useState(defaultUser.phoneNumber || "");
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        // Load from storage, fallback to mock user default if not in storage (for demo continuity)
        const storedEmail = localStorage.getItem("user_email");
        const storedAddress = localStorage.getItem("user_address");
        const storedPhone = localStorage.getItem("user_phone");

        if (storedEmail) setEmail(storedEmail);
        if (storedAddress) setAddress(storedAddress);
        if (storedPhone) setPhoneNumber(storedPhone);
    }, []);

    const handleSave = () => {
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_address", address);
        localStorage.setItem("user_phone", phoneNumber);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-800 pb-20">
            {/* Header / Nav */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-20 shadow-sm flex items-center gap-4">
                <Link href="/student/dashboard" className="text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="font-bold text-lg text-slate-800">設定</h1>
            </div>

            <main className="max-w-2xl mx-auto p-8">
                <div className="space-y-8">

                    {/* Email Settings */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">メールアドレス変更</h2>
                                <p className="text-xs text-slate-500">ログインや通知に使用するメールアドレスを変更します。</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">新しいメールアドレス</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-blue-500 transition-colors"
                                    placeholder="your-email@example.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address & Phone Settings */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">登録住所・電話番号</h2>
                                <p className="text-xs text-slate-500">教材送付先や緊急連絡先情報です。</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">電話番号</label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-emerald-500 transition-colors"
                                    placeholder="090-0000-0000"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">ご住所</label>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-emerald-500 transition-colors min-h-[120px] resize-none"
                                    placeholder="〒000-0000 東京都..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subscription Management */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                <span className="font-bold text-lg">💳</span>
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">契約・支払いの管理</h2>
                                <p className="text-xs text-slate-500">プラン変更、解約、クレジットカード情報の変更はこちら。</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await fetch('/api/create-portal-session', { method: 'POST' });
                                        if (!res.ok) throw new Error("Portal creation failed");
                                        const data = await res.json();
                                        window.location.href = data.url;
                                    } catch (error) {
                                        alert("管理画面への移動に失敗しました。まだ決済情報が登録されていない可能性があります。");
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                            >
                                契約管理画面へ移動（Stripe）
                            </button>
                            <p className="text-[10px] text-slate-400 text-center">※外部サイト（Stripe）へ移動します。</p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            className={`
                                flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all
                                ${isSaved ? "bg-green-500 hover:bg-green-600" : "bg-slate-800 hover:bg-slate-900"}
                            `}
                        >
                            <Save className="w-4 h-4" />
                            {isSaved ? "保存しました" : "変更を保存"}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}
