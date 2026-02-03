"use client";

import { useEffect, useState } from "react";
import { getChannels, MOCK_USERS } from "@/lib/data";
import { Channel, Plan } from "@/types";
import { Settings, Shield, UserCheck, Save, CheckCircle, FileText } from "lucide-react";

export default function CommunitySettingsPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [rulesContent, setRulesContent] = useState("");
    const [introContent, setIntroContent] = useState("");

    useEffect(() => {
        setChannels(getChannels());
        // Fetch System Config
        fetch('/api/system/content?keys=community_rules_content,community_intro_content')
            .then(res => res.json())
            .then(data => {
                setRulesContent(data.community_rules_content || "");
                setIntroContent(data.community_intro_content || "");
            })
            .catch(err => console.error(err));
    }, []);

    const handleTogglePlan = (channelId: string, plan: Plan) => {
        setChannels(prev => prev.map(ch => {
            if (ch.id === channelId) {
                const newPlans = ch.allowedPlans.includes(plan)
                    ? ch.allowedPlans.filter(p => p !== plan)
                    : [...ch.allowedPlans, plan];
                return { ...ch, allowedPlans: newPlans };
            }
            return ch;
        }));
    };

    const handleSave = async () => {
        setStatus("saving");
        try {
            await Promise.all([
                fetch('/api/system/content', { method: 'POST', body: JSON.stringify({ key: 'community_rules_content', value: rulesContent }) }),
                fetch('/api/system/content', { method: 'POST', body: JSON.stringify({ key: 'community_intro_content', value: introContent }) })
            ]);
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 3000);
        } catch (e) {
            console.error(e);
            alert("保存に失敗しました");
            setStatus("idle");
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 text-slate-700">
            <div className="border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-serif font-bold mb-2">コミュニティ詳細設定</h1>
                <p className="text-slate-500">
                    プランごとのアクセス権限や、スタッフの管理権限を詳細に設定できます。
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Channel Permissions */}
                <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-rose-800 font-bold mb-6">
                        <Shield className="w-5 h-5" />
                        <span>プラン別チャンネルアクセス制限</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-4 px-4 font-bold text-slate-500 text-sm italic">チャンネル名</th>
                                    <th className="text-center py-4 px-4 font-bold text-slate-500 text-sm">ライト (Light)</th>
                                    <th className="text-center py-4 px-4 font-bold text-slate-500 text-sm">スタンダード (Standard)</th>
                                    <th className="text-center py-4 px-4 font-bold text-slate-500 text-sm">プレミアム (Premium)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {channels.map(channel => (
                                    <tr key={channel.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="font-bold"># {channel.name}</div>
                                            <div className="text-xs text-slate-400">{channel.description}</div>
                                        </td>
                                        {(['light', 'standard', 'premium'] as Plan[]).map(plan => (
                                            <td key={plan} className="py-4 px-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={channel.allowedPlans.includes(plan)}
                                                    onChange={() => handleTogglePlan(channel.id, plan)}
                                                    className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Staff Control */}
                <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-rose-800 font-bold mb-6">
                        <UserCheck className="w-5 h-5" />
                        <span>スタッフ & モデレーター設定</span>
                    </div>

                    <div className="bg-rose-50 p-4 rounded border border-rose-100 text-sm text-rose-900 leading-relaxed mb-6">
                        <p className="font-bold mb-1 italic">管理者 (Admin) の権限について</p>
                        管理者は全てのチャンネルの閲覧・発言、および不適切なメッセージの削除が可能です。
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-slate-100 rounded hover:border-rose-200 transition-colors">
                            <div>
                                <div className="font-bold text-slate-800">スタッフによるメッセージ管理</div>
                                <div className="text-xs text-slate-500">スタッフにメッセージの削除権限を付与します。</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400">OFF</span>
                                <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
                                </div>
                                <span className="text-xs font-bold text-rose-600">ON</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-slate-100 rounded">
                            <div>
                                <div className="font-bold text-slate-800">スタッフの閲覧制限</div>
                                <div className="text-xs text-slate-500">スタッフは「学習サポート」チャンネルのみ作業可能にする（シミュレーション）。</div>
                            </div>
                            <div className="px-3 py-1 bg-slate-100 rounded text-xs font-bold text-slate-500">有効</div>
                        </div>
                    </div>
                </section>

                {/* Content Settings */}
                <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-rose-800 font-bold mb-6">
                        <FileText className="w-5 h-5" />
                        <span>チャンネル内テキスト設定</span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">コミュニティルール (#ルール)</label>
                            <textarea
                                value={rulesContent}
                                onChange={(e) => setRulesContent(e.target.value)}
                                className="w-full h-40 border border-slate-200 rounded-lg p-3 text-sm focus:border-rose-500 outline-none"
                                placeholder="Markdown形式で入力可能です..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">はじめに② (#はじめに②)</label>
                            <textarea
                                value={introContent}
                                onChange={(e) => setIntroContent(e.target.value)}
                                className="w-full h-40 border border-slate-200 rounded-lg p-3 text-sm focus:border-rose-500 outline-none"
                                placeholder="Markdown形式で入力可能です..."
                            />
                        </div>
                    </div>
                </section>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={status === "saving"}
                        className="bg-slate-800 text-white px-10 py-3 rounded-md hover:bg-slate-700 transition-all font-bold disabled:opacity-50 flex items-center gap-2"
                    >
                        {status === "saving" ? "保存中..." : "コミュニティ設定を保存する"}
                        {status === "saved" && <CheckCircle className="w-5 h-5" />}
                        {status !== "saving" && status !== "saved" && <Save className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
