"use client";

import { useEffect, useState } from "react";
import { getChannels, getStripeSettings, MOCK_LESSONS, saveStripeSettings } from "@/lib/data";
import { StripeSettings } from "@/types";
import { AlertCircle, CheckCircle, Save } from "lucide-react";

export default function StripeSettingsPage() {
    const [settings, setSettings] = useState<StripeSettings>({
        enabled: false,
        apiKey: "",
        targetCourseIds: [],
    });
    const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

    useEffect(() => {
        setSettings(getStripeSettings());
    }, []);

    const handleSave = () => {
        setStatus("saving");
        saveStripeSettings(settings);
        setTimeout(() => setStatus("saved"), 800);
        setTimeout(() => setStatus("idle"), 3000);
    };

    const handleCourseToggle = (courseId: string) => {
        setSettings(prev => {
            const current = prev.targetCourseIds;
            const updated = current.includes(courseId)
                ? current.filter(id => id !== courseId)
                : [...current, courseId];
            return { ...prev, targetCourseIds: updated };
        });
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 text-slate-700">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold mb-2">Stripe連携</h1>
                <p className="text-slate-500">
                    現在お持ちのサロンやコミュニティの決済サービスにStripeを使用している場合、受講生のデータを自動的に検出しオンクラスに共有することができます。
                </p>
                <div className="bg-red-50 border border-red-200 p-4 mt-4 rounded-md flex gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>
                        ※ 本機能は1日2回、日本時間での朝晩に更新処理が実施されます。リアルタイムでは受講状態は変わりませんので、設定が反映されるまでしばらくお待ちください。
                    </p>
                </div>
            </div>

            {/* Toggle Section */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                        className={`w-14 h-8 rounded-full transition-colors relative ${settings.enabled ? "bg-blue-600" : "bg-slate-300"}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${settings.enabled ? "left-7" : "left-1"}`} />
                    </button>
                    <span className="font-bold text-lg">Stripe連携ON</span>
                </div>

                <h3 className="font-bold text-lg text-blue-600 mb-2">stripe</h3>

                <div className="mb-6">
                    <h4 className="font-bold mb-2">サブスクリプション課金中の受講生を連携</h4>
                    <p className="text-sm text-slate-500 mb-4">
                        Stripeにログイン後、ダッシュボードの「開発者/APIキー」から制限付きのキーを発行し、トークンをこちらに入力してください。
                        制限付きキーに付与する権限はStripeデータ上の「Customers読み取り」「Subscriptions 読み取り」の2つのみで動作します。
                        詳しい設定方法に関しては「マニュアル/API連携についてのご案内/Stripe連携について」を参照して下さい。
                    </p>
                    <input
                        type="text"
                        placeholder="制限付きのキーのトークン"
                        value={settings.apiKey}
                        onChange={(e) => setSettings(s => ({ ...s, apiKey: e.target.value }))}
                        className="w-full max-w-lg border border-slate-300 rounded px-4 py-2"
                    />
                </div>

                <div className="mb-6">
                    <h4 className="font-bold mb-2">サブスクリプション課金中の受講生が受講可能なコースを選択</h4>
                    <div className="space-y-2">
                        {/* We use MOCK_LESSONS as 'courses' for this demo since we don't have a separate Course type populated, or we can use MOCK_COURSES if available. 
                            Wait, checking previous files, we didn't explicitly implement MOCK_COURSES in data.ts, only MOCK_LESSONS. 
                            However, the prompt screenshot says "Test" as a checkbox. 
                            I'll simulate courses.
                        */}
                        {[{ id: "course1", title: "テスト" }, { id: "course2", title: "React完全マスター" }].map(course => (
                            <label key={course.id} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.targetCourseIds.includes(course.id)}
                                    onChange={() => handleCourseToggle(course.id)}
                                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <span>{course.title}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-red-600 text-sm font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>既にStripe連携受講生を同期したコースのチェックを外し更新すると、受講生の受講権限も同時になくなります。</span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleSave}
                        disabled={status === "saving"}
                        className="bg-blue-900 text-white px-8 py-3 rounded hover:bg-blue-800 transition-colors font-bold disabled:opacity-50 flex items-center gap-2"
                    >
                        {status === "saving" ? "保存中..." : "設定を更新する"}
                        {status === "saved" && <CheckCircle className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
