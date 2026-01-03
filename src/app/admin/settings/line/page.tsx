
"use client";

import { useState, useEffect } from 'react';
import { Save, Send, MessageCircle } from 'lucide-react';

export default function LineSettingsPage() {
    const [enabled, setEnabled] = useState(false);
    const [days, setDays] = useState(7);
    const [template, setTemplate] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings/line');
                if (res.ok) {
                    const data = await res.json();
                    setEnabled(data.enabled);
                    setDays(data.days);
                    setTemplate(data.template);
                }
            } catch (error) {
                console.error('Failed to load settings', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/line', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled, days, template }),
            });
            if (res.ok) {
                alert('設定を保存しました');
            } else {
                alert('保存に失敗しました');
            }
        } catch (error) {
            console.error('Failed to save', error);
            alert('エラーが発生しました');
        } finally {
            setSaving(false);
        }
    };

    const handleTestSend = async () => {
        if (!confirm('あなた（ログイン中のユーザー）にテストメッセージを送信しますか？\n※LINE連携済みである必要があります。')) return;

        setSending(true);
        try {
            const res = await fetch('/api/admin/line/test-send', {
                method: 'POST',
            });
            const data = await res.json();

            if (res.ok) {
                alert('送信しました！LINEを確認してください。');
            } else {
                alert(`送信失敗: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to send test', error);
            alert('送信エラーが発生しました');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <MessageCircle className="w-8 h-8 text-[#06C755]" />
                        LINE通知設定
                    </h1>
                    <p className="text-slate-500 mt-1">未ログインユーザーへの自動リマインド設定</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Enable/Disable Switch */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                            <h3 className="font-semibold text-slate-800">自動配信を有効にする</h3>
                            <p className="text-sm text-slate-500">OFFにすると、条件を満たしてもメッセージは送信されません。</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06C755]"></div>
                        </label>
                    </div>

                    {/* Days Setting */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            未ログイン判定期間（日数）
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={days}
                                onChange={(e) => setDays(Number(e.target.value))}
                                min="1"
                                className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <span className="text-slate-600">日間ログインがない場合に送信</span>
                        </div>
                    </div>

                    {/* Template Setting */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            メッセージ文面
                        </label>
                        <textarea
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            rows={8}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                            placeholder="メッセージを入力..."
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            ※ `[Login URL]` は自動的にログイン用URLに置換されます。
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <button
                            onClick={handleTestSend}
                            disabled={sending}
                            className="flex items-center gap-2 px-4 py-2 text-[#06C755] border border-[#06C755] rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            {sending ? '送信中...' : '自分にテスト送信'}
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? '保存中...' : '設定を保存'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
