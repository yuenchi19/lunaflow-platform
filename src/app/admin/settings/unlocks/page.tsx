"use client";

import { useState, useEffect } from 'react';
import { Save, Lock, GripVertical } from 'lucide-react';

interface Course {
    id: string;
    title: string;
}

interface UnlockRule {
    featureKey: string;
    requiredCourseId: string | null;
    requiredBlockId: string | null;
}

const PLANS = [
    { key: 'light', label: 'Light Plan' },
    { key: 'standard', label: 'Standard Plan' },
    { key: 'premium', label: 'Premium Plan' }
];

const FEATURES = [
    { key: 'affiliate', label: 'アフィリエイト機能', description: '紹介コードの発行およびアフィリエイトダッシュボードの利用' },
    { key: 'inventory', label: '仕入れ・在庫管理・ストア公開機能', description: '商品管理台帳および仕入れ申請フォームの利用、ストア商品へのアクセス' },
];

export default function UnlockSettingsPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Key: featureKey_plan (e.g. "inventory_light") -> Value: Rule
    const [rules, setRules] = useState<Record<string, any>>({});
    const [selectedPlan, setSelectedPlan] = useState('standard');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, rulesRes] = await Promise.all([
                    fetch('/api/admin/courses'),
                    fetch('/api/admin/unlock-rules')
                ]);

                if (coursesRes.ok) {
                    const data = await coursesRes.json();
                    setCourses(data);
                }

                if (rulesRes.ok) {
                    const data = await rulesRes.json();
                    const rulesMap: Record<string, any> = {};
                    // Construct composite key map or just store by array
                    data.forEach((r: any) => {
                        rulesMap[`${r.featureKey}_${r.plan || 'standard'}`] = r;
                    });
                    setRules(rulesMap);
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = async (featureKey: string) => {
        setSaving(true);
        try {
            const ruleKey = `${featureKey}_${selectedPlan}`;
            const rule = rules[ruleKey] || {};

            const res = await fetch('/api/admin/unlock-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: featureKey,
                    plan: selectedPlan,
                    status: rule.status || 'active',
                    courseId: rule.requiredCourseId || null,
                    blockId: rule.requiredBlockId || null
                })
            });

            const text = await res.text();
            console.log('API Response:', res.status, text);

            if (res.ok) {
                alert('設定を保存しました');
            } else {
                let errorMessage = 'Save failed';
                try {
                    const data = JSON.parse(text);
                    errorMessage = data.error || errorMessage;
                } catch {
                    errorMessage = `Server Error (${res.status})`;
                }
                throw new Error(errorMessage);
            }
        } catch (e: any) {
            alert(`保存に失敗しました: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (featureKey: string, field: string, value: string) => {
        const ruleKey = `${featureKey}_${selectedPlan}`;
        setRules(prev => ({
            ...prev,
            [ruleKey]: {
                ...prev[ruleKey],
                featureKey,
                plan: selectedPlan,
                [field]: value === '' ? null : value
            }
        }));
    };

    if (loading) return <div className="p-8">読み込み中...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Lock className="w-6 h-6 text-indigo-600" />
                機能開放条件設定
            </h1>
            <p className="text-slate-500 mb-8">
                各プランごとの機能利用条件を設定します。
            </p>

            {/* Plan Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                {PLANS.map(plan => (
                    <button
                        key={plan.key}
                        onClick={() => setSelectedPlan(plan.key)}
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${selectedPlan === plan.key
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {plan.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {FEATURES.map(feature => {
                    const ruleKey = `${feature.key}_${selectedPlan}`;
                    const currentRule = rules[ruleKey] || { status: 'active', requiredCourseId: '' };

                    return (
                        <div key={feature.key} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{feature.label}</h3>
                                    <p className="text-sm text-slate-500">{feature.description}</p>
                                </div>
                                <button
                                    onClick={() => handleSave(feature.key)}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    保存
                                </button>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                                {/* Status Toggle */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                        利用ステータス
                                    </label>
                                    <select
                                        value={currentRule.status || 'active'}
                                        onChange={(e) => handleChange(feature.key, 'status', e.target.value)}
                                        className="w-full md:w-1/2 p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                    >
                                        <option value="active">条件付きで許可 (または即時開放)</option>
                                        <option value="locked">利用不可 (強制ロック)</option>
                                    </select>
                                </div>

                                {/* Condition Select */}
                                {(!currentRule.status || currentRule.status === 'active') && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                            開放に必要なコース完了
                                        </label>
                                        <select
                                            value={currentRule.requiredCourseId || ''}
                                            onChange={(e) => handleChange(feature.key, 'requiredCourseId', e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                        >
                                            <option value="">条件なし (即時開放)</option>
                                            {courses.map(course => (
                                                <option key={course.id} value={course.id}>
                                                    {course.title} (完了時に開放)
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-400 mt-2">
                                            ※ クライアント側へ設定が反映されるまで数分かかる場合があります。
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
