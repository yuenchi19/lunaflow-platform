
"use client";

import { useState } from "react";
import { Loader2, CheckCircle, Send, Mail, User, MessageSquare } from "lucide-react";
import Link from 'next/link';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", subject: "", message: "" });
            } else {
                setStatus("error");
            }
        } catch (error) {
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header (Simplified) */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold text-xl text-indigo-600">LunaFlow</Link>
                </div>
            </div>

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="bg-indigo-600 p-8 text-white text-center">
                        <h1 className="text-3xl font-bold mb-2">お問い合わせ</h1>
                        <p className="text-indigo-100">ご質問・ご相談はお気軽にどうぞ</p>
                    </div>

                    <div className="p-8">
                        {status === "success" ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">送信完了</h2>
                                <p className="text-slate-500 mb-8">お問い合せありがとうございます。<br />内容を確認次第、担当者よりご連絡いたします。</p>
                                <button
                                    onClick={() => setStatus("idle")}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition"
                                >
                                    戻る
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" /> お名前 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                            placeholder="山田 太郎"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-slate-400" /> メールアドレス <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                            placeholder="taro@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-slate-400" /> 件名
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                        placeholder="件名を入力してください"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">
                                        お問い合わせ内容 <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                                        placeholder="詳細をご記入ください..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>

                                {status === "error" && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                                        送信に失敗しました。時間をおいて再度お試しください。
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === "submitting"}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2"
                                >
                                    {status === "submitting" ? (
                                        <><Loader2 className="animate-spin w-5 h-5" /> 送信中...</>
                                    ) : (
                                        <><Send className="w-5 h-5" /> 送信メッセージを送る</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
                <div className="mt-8 text-slate-400 text-sm">
                    &copy; 2024 LunaFlow. All rights reserved.
                </div>
            </main>
        </div>
    );
}
