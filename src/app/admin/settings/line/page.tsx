"use client";

import { useState, useEffect } from "react";
import { saveLineSettings, getLineSettings } from "@/lib/line-settings"; // We'll create this lib file
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";

export default function AdminLineSettingsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        enabled: false,
        reminderDays: 7,
        reminderMessage: "こんにちは！LunaFlow事務局です。\n学習の進み具合はいかがでしょうか？\nもし操作方法や内容で分からないことがあれば、このLINEでいつでも質問してくださいね！\n\n▼ 学習を再開する\nhttps://www.lunaflow.space/"
    });

    useEffect(() => {
        // Mock fetching settings
        const loaded = getLineSettings();
        setSettings(loaded);
        setLoading(false);
    }, []);

    const handleSave = () => {
        saveLineSettings(settings);
        showToast("LINE設定を保存しました", "success");
    };

    if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-800 mb-2">LINE連携設定</h1>
                <p className="text-slate-500">公式LINEとの連携機能と自動リマインドの設定を行います。</p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">

                {/* Feature Toggle */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">自動リマインド機能</h3>
                        <p className="text-sm text-slate-500">最終ログインから一定期間経過したユーザーにメッセージを送信します。</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.enabled}
                            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {/* Days Setting */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">未ログイン経過日数 (トリガー)</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="1"
                            max="365"
                            className="w-24 p-2 border border-slate-200 rounded-md text-right font-mono"
                            value={settings.reminderDays}
                            onChange={(e) => setSettings({ ...settings, reminderDays: parseInt(e.target.value) || 7 })}
                        />
                        <span className="text-slate-600">日</span>
                    </div>
                    <p className="text-xs text-slate-400">※ 指定した日数以上ログインしていないユーザーが対象になります。</p>
                </div>

                {/* Message Template */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700">送信メッセージ内容</label>
                    <textarea
                        className="w-full h-48 p-4 border border-slate-200 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        value={settings.reminderMessage}
                        onChange={(e) => setSettings({ ...settings, reminderMessage: e.target.value })}
                        placeholder="送信するメッセージを入力してください..."
                    />
                    <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 leading-relaxed">
                        <span className="font-bold">プレビュー:</span><br />
                        {settings.reminderMessage.split('\n').map((line, i) => (
                            <span key={i}>{line}<br /></span>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                    >
                        <Save className="w-4 h-4" /> 設定を保存
                    </button>
                </div>

            </div>
        </div>
    );
}
