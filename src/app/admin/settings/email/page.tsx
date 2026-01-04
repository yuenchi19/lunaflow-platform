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
                        <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                            <Mail className="w-5 h-5" />
                            <span>メール配信設定</span>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">送信元メールアドレス</label>
                            <input
                                type="email"
                                value={emailSettings.gmailAddress}
                                onChange={(e) => setEmailSettings(s => ({ ...s, gmailAddress: e.target.value }))}
                                placeholder="info@lunaflow.space"
                                className="w-full border border-slate-300 rounded px-4 py-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                            />
                            <p className="text-xs text-slate-400 mt-1">※Resend等の配信サービスでVerified済みのドメインを使用してください。</p>
                        </div>

                        {/* App Password - Hidden/Optional for now as we prefer Resend */}
                        {/* <div>
                            <label className="block text-sm font-bold mb-1 flex items-center gap-1">
                                SMTPパスワード (Gmail等の場合)
                                <Info className="w-4 h-4 text-slate-400 cursor-help" />
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={emailSettings.appPassword}
                                    onChange={(e) => setEmailSettings(s => ({ ...s, appPassword: e.target.value }))}
                                    className="w-full border border-slate-300 rounded px-4 py-2 focus:ring-2 focus:ring-indigo-200 outline-none pr-10"
                                />
                                <Lock className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                            </div>
                        </div> */}

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
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1">
                            設定ガイド
                        </h4>
                        <ul className="text-sm text-slate-700 space-y-2 list-disc pl-4 leading-relaxed">
                            <li>送信元アドレスは、DNS設定で許可されたドメイン（例: info@lunaflow.space）を使用してください。</li>
                            <li>Gmail等のフリーアドレスは、到達率が低下する可能性があるため推奨されません。</li>
                            <li>現在はシステム設定（Resend）が優先されます。</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
