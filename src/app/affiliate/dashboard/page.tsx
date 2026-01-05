"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, AffiliateEarnings } from "@/types";
import { hasAgreedToCompliance, getAffiliateEarnings, MOCK_USERS } from "@/lib/data";
import ComplianceModal from "@/components/affiliate/ComplianceModal";
import PayoutSettings from "@/components/affiliate/PayoutSettings";
import Link from "next/link";
import { LogOut, Copy, ExternalLink, TrendingUp, Users, DollarSign, Github, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PartnerDashboardPage() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
    const [earnings, setEarnings] = useState<AffiliateEarnings>({ directReferrals: 0, indirectReferrals: 0, monthlyEarnings: 0 });

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    router.push("/login?redirect=/affiliate/dashboard");
                    return;
                }

                // Fetch full profile
                const res = await fetch('/api/user/profile');
                if (res.ok) {
                    const profile = await res.json();

                    // STRICT PERMISSION CHECK
                    const ALLOWED_PLANS = ['standard', 'premium', 'partner'];
                    if (!ALLOWED_PLANS.includes(profile.plan)) {
                        setError("このプラン（Light等）ではアフィリエイト機能をご利用いただけません。スタンダードプラン以上へのアップグレードが必要です。");
                        return;
                    }

                    if (profile.plan !== 'partner' && profile.plan !== 'standard' && profile.plan !== 'premium') {
                        // Redundant safety check 
                        setError("権限がありません。");
                        return;
                    }

                    setUser(profile);

                    // Check Compliance
                    if (!hasAgreedToCompliance(profile.id)) {
                        setIsComplianceModalOpen(true);
                    }

                    // Fetch Earnings
                    const e = getAffiliateEarnings(profile.id);
                    setEarnings(e);
                } else {
                    const errData = await res.json().catch(() => ({}));
                    console.error("Profile fetch error:", res.status, errData);
                    setError(`プロフィールの取得に失敗しました (Status: ${res.status})`);
                }
            } catch (e: any) {
                console.error("Auth check failed", e);
                setError(`エラーが発生しました: ${e.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    const copyLink = () => {
        if (!user?.affiliateCode) return;
        const url = `${window.location.origin}?mode=register&ref=${user.affiliateCode}`;
        navigator.clipboard.writeText(url);
        alert("紹介リンクをコピーしました！");
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">Loading...</div>;

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB] p-4 text-center">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full">
                    <div className="text-red-500 mb-4">⚠️</div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">エラーが発生しました</h2>
                    <p className="text-slate-600 mb-6 text-sm">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        再読み込み
                    </button>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">トップページへ戻る</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-800 font-sans">
            <ComplianceModal
                isOpen={isComplianceModalOpen}
                userId={user.id}
                onAgree={() => {
                    setIsComplianceModalOpen(false);
                    // Ideally refresh user state or just local close
                }}
            />

            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="font-black text-xl text-slate-800 tracking-tight">Luna Flow</span>
                    <span className="text-xs font-bold text-white bg-purple-600 px-2 py-0.5 rounded-full uppercase">Partner</span>
                </div>
                <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors">
                    <LogOut className="w-4 h-4" />
                    ログアウト
                </button>
            </header>

            <main className="max-w-4xl mx-auto p-6 md:p-12 space-y-8">
                {/* Welcome & ID */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">こんにちは、{user.name}さん</h1>
                        <p className="text-sm text-slate-500">今日もアフィリエイト活動を頑張りましょう！</p>
                    </div>
                </div>

                {/* Missing Info Alert */}
                {(!user.bankName || !user.bankAccountNumber) && (
                    <div
                        onClick={() => {
                            document.getElementById('payout-settings')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-rose-100 transition-colors group"
                    >
                        <div className="bg-rose-100 p-2 rounded-full text-rose-600 group-hover:bg-rose-200">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-rose-800 text-sm">報酬を受け取るために、口座情報の登録が必要です。</h3>
                            <p className="text-xs text-rose-600">ここをクリックして設定を行ってください。</p>
                        </div>
                        <div className="text-rose-400">
                            →
                        </div>
                    </div>
                )}

                {/* Main Metrics Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wilder mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            今月の見込み収益
                        </div>
                        <div className="text-3xl font-black text-emerald-600">¥{earnings.monthlyEarnings.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wilder mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 ml-1" />
                            直接紹介 (Tier 1)
                        </div>
                        <div className="text-3xl font-black text-slate-800">{earnings.directReferrals} <span className="text-base font-normal text-slate-400">人</span></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wilder mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 ml-1 opacity-50" />
                            間接紹介 (Tier 2)
                        </div>
                        <div className="text-3xl font-black text-slate-800">{earnings.indirectReferrals} <span className="text-base font-normal text-slate-400">人</span></div>
                    </div>
                </div>

                {/* Action Area */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Link Generator */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                            <Copy className="w-32 h-32 text-amber-900" />
                        </div>
                        <h2 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                            <span className="p-1 bg-amber-200/50 rounded-lg">🔗</span>
                            紹介リンク
                        </h2>
                        <div className="relative z-10 space-y-4">
                            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200/50">
                                <p className="text-[10px] text-amber-800 font-bold uppercase mb-1">YOUR REFERRAL CODE</p>
                                <p className="text-2xl font-mono font-bold text-amber-900 tracking-wider select-all">
                                    {user.affiliateCode || "GENERATING..."}
                                </p>
                            </div>
                            <button
                                onClick={copyLink}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                リンクをコピーする
                            </button>
                            <p className="text-xs text-amber-700/80 leading-relaxed text-center">
                                このリンク経由で登録されたユーザーがあなたの紹介実績となります。SNSやブログでシェアしましょう！
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* GitHub Integration */}
                        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl shadow-slate-200">
                            <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
                                <Github className="w-32 h-32 text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                                <Github className="w-5 h-5" />
                                GitHub連携
                            </h2>
                            <div className="relative z-10 space-y-4">
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    アフィリエイト活動に必要な素材やマインドセット教材は、GitHubリポジトリ（Luna Flow-Partner）で提供されます。
                                </p>

                                <div className="p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-slate-400">STATUS</span>
                                        {user.githubInviteStatus === 'joined' ? (
                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">Active</span>
                                        ) : user.githubInviteStatus === 'invited' ? (
                                            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">Invited</span>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded border border-slate-400/20">Not Linked</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium">
                                        {user.githubInviteStatus === 'joined' ? '連携済み (Access Granted)' :
                                            user.githubInviteStatus === 'invited' ? '招待メールを確認してください' :
                                                '連携してアクセス権を取得'}
                                    </p>
                                </div>

                                {user.githubInviteStatus !== 'joined' && user.githubInviteStatus !== 'invited' && (
                                    <button
                                        onClick={async () => {
                                            const username = prompt("GitHubのユーザー名を入力してください");
                                            if (!username) return;
                                            try {
                                                const res = await fetch('/api/github/invite', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ githubUsername: username })
                                                });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    alert(data.message || '招待を送りました。');
                                                    setUser(prev => prev ? ({ ...prev, githubInviteStatus: 'invited' }) : null);
                                                } else {
                                                    alert(`エラー: ${data.error}`);
                                                }
                                            } catch (e) {
                                                alert('通信エラーが発生しました');
                                            }
                                        }}
                                        className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Github className="w-4 h-4" />
                                        GitHubアカウントを連携
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Payout Settings */}
                        <div id="payout-settings">
                            <PayoutSettings user={user} />
                        </div>

                        {/* Material Link */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-indigo-300 transition-colors group cursor-pointer" onClick={() => router.push('/student/course/course_1')}> {/* Assuming course_1 or specific ID */}
                            <h2 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                                学習教材（マインドセット）
                            </h2>
                            <p className="text-xs text-slate-500 mb-4">
                                アフィリエイト活動に必要な基礎知識とマインドセットを学びましょう。
                            </p>
                            <div className="flex justify-end">
                                <span className="text-xs font-bold text-indigo-600 group-hover:underline">教材へアクセス &rarr;</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
