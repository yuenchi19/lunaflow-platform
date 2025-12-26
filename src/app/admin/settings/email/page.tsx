"use client";

import { useEffect, useState } from "react";
import { getEmailSettings, saveEmailSettings } from "@/lib/data";
import { Mail, Save, CheckCircle, Info, Lock } from "lucide-react";

export default function EmailSettingsPage() {
    const [emailSettings, setEmailSettings] = useState({
        gmailAddress: "",
        appPassword: "",
        senderName: "",
        notificationEnabled: true,
        signature: ""
    });
    const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

    useEffect(() => {
        setEmailSettings(getEmailSettings());
    }, []);

    const handleSave = () => {
        setStatus("saving");
        saveEmailSettings(emailSettings);
        setTimeout(() => setStatus("saved"), 800);
        setTimeout(() => setStatus("idle"), 3000);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 text-slate-700">
            {/* Header */}
            <div className="border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-serif font-bold mb-2">メール配信設定</h1>
                <p className="text-slate-500">
                    Gmail連携を行うことで、受講生への案内メールを直接送信・管理できます。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Settings */}
                <div className="md:col-span-2 space-y-6">
                    <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 text-rose-800 font-bold mb-4">
                            <Mail className="w-5 h-5" />
                            <span>Gmail 連携</span>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Gmailアドレス</label>
                            <input
                                type="email"
                                value={emailSettings.gmailAddress}
                                onChange={(e) => setEmailSettings(s => ({ ...s, gmailAddress: e.target.value }))}
                                className="w-full border border-slate-300 rounded px-4 py-2 focus:ring-2 focus:ring-rose-200 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1 flex items-center gap-1">
                                アプリパスワード
                                <Info className="w-4 h-4 text-slate-400 cursor-help" />
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={emailSettings.appPassword}
                                    onChange={(e) => setEmailSettings(s => ({ ...s, appPassword: e.target.value }))}
                                    className="w-full border border-slate-300 rounded px-4 py-2 focus:ring-2 focus:ring-rose-200 outline-none pr-10"
                                />
                                <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">※通常のログインパスワードではなく、アプリパスワードが必要です。</p>
                        </div>

                        <div className="pt-4">
                            <label className="block text-sm font-bold mb-1">送信者名</label>
                            <input
                                type="text"
                                value={emailSettings.senderName}
                                onChange={(e) => setEmailSettings(s => ({ ...s, senderName: e.target.value }))}
                                className="w-full border border-slate-300 rounded px-4 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">署名</label>
                            <textarea
                                rows={4}
                                value={emailSettings.signature}
                                onChange={(e) => setEmailSettings(s => ({ ...s, signature: e.target.value }))}
                                className="w-full border border-slate-300 rounded px-4 py-2 text-sm"
                            />
                        </div>
                    </section>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={status === "saving"}
                            className="bg-slate-800 text-white px-8 py-3 rounded-md hover:bg-slate-700 transition-all font-bold disabled:opacity-50 flex items-center gap-2"
                        >
                            {status === "saving" ? "保存中..." : "設定を更新する"}
                            {status === "saved" && <CheckCircle className="w-5 h-5" />}
                            {status !== "saving" && status !== "saved" && <Save className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Sidebar Tips */}
                <div className="space-y-4">
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg">
                        <h4 className="font-bold text-rose-900 mb-2 flex items-center gap-1">
                            設定ガイド
                        </h4>
                        <ol className="text-sm text-rose-800 space-y-2 list-decimal pl-4">
                            <li>Googleアカウントの「2段階認証」を有効にする</li>
                            <li>「アプリパスワード」を生成する</li>
                            <li>生成された16桁のコードを上記に入力</li>
                        </ol>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
                        <h4 className="font-bold text-slate-900 mb-2">
                            同じアドレスで返信
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Gmail連携を有効にすると、送信済みのメールはGmailの「送信済み」フォルダにも同期されます。<br /><br />
                            受講生が返信した内容は、お客様のGmail受信トレイに届き、そのままやり取りを継続いただけます。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
