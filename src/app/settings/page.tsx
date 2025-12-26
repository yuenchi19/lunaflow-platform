"use client";

import { useState, useEffect } from "react";
import { MOCK_USERS } from "@/lib/data";
import { ArrowLeft, Mail, MapPin, Save } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const defaultUser = MOCK_USERS[0];
    const [email, setEmail] = useState(defaultUser.email);
    const [address, setAddress] = useState("");
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        // Load from storage
        const storedEmail = localStorage.getItem("user_email");
        const storedAddress = localStorage.getItem("user_address");
        if (storedEmail) setEmail(storedEmail);
        if (storedAddress) setAddress(storedAddress);
    }, []);

    const handleSave = () => {
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_address", address);
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

                    {/* Address Settings */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-800">荷物送付住所変更</h2>
                                <p className="text-xs text-slate-500">教材や特典の送付先住所を変更します。</p>
                            </div>
                        </div>

                        <div className="space-y-4">
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
