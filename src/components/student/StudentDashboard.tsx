"use client";

import { useState, useEffect } from "react";
import { User, Course, Announcement } from "@/types";
import { createMockStripeSession } from "@/lib/stripe-integration";
import { MOCK_USERS, MOCK_COURSES, getAnnouncements, getAffiliateEarnings } from "@/lib/data";
import { User as UserIcon, Bell, ExternalLink, Book, LogOut, Settings, PlayCircle, Clock, Edit3, Camera, TrendingUp } from "lucide-react";
import Link from "next/link";
// import styles from "@/app/page.module.css"; 

export default function StudentDashboard() {
    const [user, setUser] = useState<User>(MOCK_USERS[0]); // Yamada Taro
    const [courses] = useState<Course[]>(MOCK_COURSES);
    const [announcements] = useState<Announcement[]>(getAnnouncements());
    const [affiliateEarnings, setAffiliateEarnings] = useState({ directReferrals: 0, indirectReferrals: 0, monthlyEarnings: 0 });

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [newName, setNewName] = useState(user.name);
    const [email, setEmail] = useState("");
    const [zipCode, setZipCode] = useState(""); // [NEW]
    const [address, setAddress] = useState("");
    const [communityNickname, setCommunityNickname] = useState(""); // [NEW]
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Purchase Form States
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    // Plan Change States
    const [isPlanChangeModalOpen, setIsPlanChangeModalOpen] = useState(false);
    const [lifetimePurchaseTotal, setLifetimePurchaseTotal] = useState(0);
    const [registrationDate, setRegistrationDate] = useState<Date>(new Date());

    const [purchaseForm, setPurchaseForm] = useState({
        email: "",
        name: "",
        postalCode: "",
        prefecture: "",
        address: "",
        phone: "",
        plan: "Standard",
        amount: "",
        carrier: "郵便局",
        payment: "銀行振込",
        note: ""
    });

    // Purchase Progress Logic
    const [currentMonthPurchaseTotal, setCurrentMonthPurchaseTotal] = useState(0);
    const [purchaseTarget, setPurchaseTarget] = useState(0);

    useEffect(() => {
        // Calculate Target based on Plan
        let target = 0;
        if (user.plan === 'light') target = 80000;
        else if (user.plan === 'standard') target = 60000;
        else if (user.plan === 'premium') target = 30000;
        setPurchaseTarget(target);

        // Calculate Current Total (Mock)
        if (typeof window !== 'undefined') {
            const requests = JSON.parse(localStorage.getItem("mock_purchase_requests") || "[]");
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const total = requests.reduce((sum: number, req: any) => {
                const reqDate = new Date(req.date); // Assuming req.date is locale string or convertible
                if (reqDate.getMonth() === currentMonth && reqDate.getFullYear() === currentYear) {
                    return sum + (parseInt(req.amount) || 0);
                }
                return sum;
            }, 0);
            setCurrentMonthPurchaseTotal(total);
        }
    }, [user.plan, isPurchaseModalOpen]); // Re-calc when modal closes

    useEffect(() => {
        // Calculate Lifetime Total & Mock Registration Date
        if (typeof window !== 'undefined') {
            const requests = JSON.parse(localStorage.getItem("mock_purchase_requests") || "[]");
            const total = requests.reduce((sum: number, req: any) => sum + (parseInt(req.amount) || 0), 0);
            setLifetimePurchaseTotal(total);

            // Mock Registration Date (6 months ago for demo if not stored)
            // In real app, this comes from user profile
            const mockDate = new Date();
            mockDate.setMonth(mockDate.getMonth() - 3); // Mock: 3 months ago (so < 6 months)
            setRegistrationDate(mockDate);
        }
    }, []);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePurchaseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseForm),
            });

            const data = await response.json();

            if (response.ok) {
                // Mock save to check in Admin later (using localStorage for demo)
                const requests = JSON.parse(localStorage.getItem("mock_purchase_requests") || "[]");
                requests.push({ ...purchaseForm, id: Date.now().toString(), status: "pending", date: new Date().toLocaleString() });
                localStorage.setItem("mock_purchase_requests", JSON.stringify(requests));

                alert("仕入れ希望を受け付けました。ご登録のメールアドレスに請求書を送付いたしました。");
                setIsPurchaseModalOpen(false);
                // Reset form
                setPurchaseForm({
                    email: "",
                    name: "",
                    postalCode: "",
                    prefecture: "",
                    address: "",
                    phone: "",
                    plan: "Standard",
                    amount: "",
                    carrier: "郵便局",
                    payment: "銀行振込",
                    note: ""
                });
            } else {
                alert(`エラーが発生しました: ${data.error}`);
            }
        } catch (error) {
            console.error("Purchase error:", error);
            alert("通信エラーが発生しました。");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePurchaseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPurchaseForm(prev => ({ ...prev, [name]: value }));
    };

    // Load data from storage on mount
    useEffect(() => {
        // Name
        const storedName = localStorage.getItem("current_user_name");
        if (storedName) {
            setUser(prev => ({ ...prev, name: storedName }));
            setNewName(storedName);
        }

        // Email
        const storedEmail = localStorage.getItem("user_email");
        if (storedEmail) setEmail(storedEmail);

        // Address
        const storedZip = localStorage.getItem("shipping_zip"); // [NEW]
        if (storedZip) setZipCode(storedZip);
        const storedAddress = localStorage.getItem("shipping_address");
        if (storedAddress) setAddress(storedAddress);

        // Nickname
        const storedNickname = localStorage.getItem("community_nickname"); // [NEW]
        if (storedNickname) setCommunityNickname(storedNickname);

        // Affiliate - Update logic
        // For demo purposes, we will recalculate on every load based on the current user ID
        const earnings = getAffiliateEarnings(user.id);
        setAffiliateEarnings(earnings);
    }, [user.id]);

    const handleProfileSave = () => {
        // ... existing save logic ...
        // (Simulated save)
        // 1. Name
        const updatedUser = { ...user, name: newName };
        setUser(updatedUser);
        localStorage.setItem("current_user_name", newName);

        // 2. Email
        localStorage.setItem("user_email", email);

        // 3. Address
        localStorage.setItem("shipping_address", address);
        localStorage.setItem("shipping_zip", zipCode); // [NEW]

        // 4. Nickname
        const updatedUserFinal = { ...updatedUser, communityNickname: communityNickname };
        setUser(updatedUserFinal);
        localStorage.setItem("community_nickname", communityNickname); // [NEW]

        setIsProfileModalOpen(false);
    };

    const handleSubscriptionUpgrade = async (plan: 'standard' | 'premium') => {
        await createMockStripeSession(plan);
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-800 pb-20 relative">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-20 shadow-sm">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/">
                            <img src="/logo.png" alt="LunaFlow" style={{ height: '28px' }} />
                        </Link>
                        <nav className="hidden md:flex items-center gap-6">
                            <span className="text-sm font-bold text-rose-700 border-b-2 border-rose-700 pb-0.5">マイページ</span>
                            <Link href="/manual" className="text-sm text-slate-500 hover:text-rose-700 transition-colors">マニュアル</Link>
                            <Link href="/community" className="text-sm text-slate-500 hover:text-rose-700 transition-colors">コミュニティ</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4 relative">
                        {/* Notification Bell Logic remains same... */}
                        <button
                            className="p-2 text-slate-400 hover:text-rose-700 transition-colors relative"
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotificationsOpen && (
                            <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                                <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-700">お知らせ</span>
                                    <button className="text-[10px] text-rose-600 font-bold hover:underline">すべて既読</button>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {announcements.slice(0, 3).map((item) => (
                                        <div key={item.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors cursor-pointer">
                                            <p className="text-xs text-slate-800 font-medium mb-1">{item.title}</p>
                                            <span className="text-[10px] text-slate-400">{item.date}</span>
                                        </div>
                                    ))}
                                    <div className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                                        <p className="text-xs text-slate-800 font-medium mb-1">コース「Webデザイン基礎」の進捗が50%を超えました！</p>
                                        <span className="text-[10px] text-slate-400">2時間前</span>
                                    </div>
                                </div>
                                <div className="px-4 py-2 border-t border-slate-50 text-center">
                                    <Link href="#" className="text-[10px] font-bold text-slate-400 hover:text-rose-600">すべてのお知らせを見る</Link>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-8 pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT SIDEBAR (Profile & Menu) - 3 Columns */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                            <div className="pt-6 pb-6 px-4 text-center">
                                <div className="flex flex-col items-center justify-center gap-1 mb-1">
                                    <h2 className="font-bold text-xl text-slate-800">{user.name}</h2>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">Contract: {user.plan}</span>
                                </div>



                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={() => setIsProfileModalOpen(true)}
                                        className="text-xs font-bold text-white bg-rose-600 rounded-lg px-6 py-2 hover:bg-rose-700 transition-colors shadow-sm"
                                    >
                                        プロフィール編集
                                    </button>
                                </div>
                            </div>
                            <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">アカウント情報</div>
                                <div className="text-xs text-slate-600 truncate mb-1">{user.email || "未設定"}</div>
                            </div>
                        </div>


                        {/* Monthly Purchase Target Tracker */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-sm p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <TrendingUp className="w-24 h-24 text-indigo-900" />
                            </div>

                            <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <span className="bg-indigo-100 p-1 rounded-md text-indigo-600">📊</span>
                                今月のおまかせ仕入れ状況
                            </h3>

                            <div className="relative z-10 space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-indigo-800 mb-1">
                                        <span>今月の目標</span>
                                        <span>{Math.round((currentMonthPurchaseTotal / (purchaseTarget || 1)) * 100)}% 達成</span>
                                    </div>
                                    <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-indigo-100">
                                        <div
                                            className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((currentMonthPurchaseTotal / (purchaseTarget || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                        <span>現在: ¥{currentMonthPurchaseTotal.toLocaleString()}</span>
                                        <span>目標: ¥{purchaseTarget.toLocaleString()}</span>
                                    </div>
                                </div>

                                {currentMonthPurchaseTotal < purchaseTarget ? (
                                    <div className="bg-white/80 rounded-xl p-3 border border-indigo-100">
                                        <p className="text-xs text-indigo-900 font-bold mb-1">あと ¥{(purchaseTarget - currentMonthPurchaseTotal).toLocaleString()} 仕入れると...</p>
                                        <div className="flex items-center gap-2 text-rose-600 font-bold">
                                            <span className="text-lg">💰</span>
                                            <span>見込み利益 ¥{Math.floor(purchaseTarget * 0.3).toLocaleString()} GETのチャンス！</span>
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-1">※売上目標(1.3倍)達成時の概算利益です</p>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 rounded-xl p-3 border border-green-100 text-center">
                                        <span className="text-lg">🎉</span>
                                        <p className="text-xs font-bold text-green-700">今月の目標達成！素晴らしいです！</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => setIsPurchaseModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    仕入れ希望フォーム
                                </button>
                            </div>
                        </div>


                        {/* Affiliate Menu (Standard/Premium Only) */}
                        {(user.plan === 'standard' || user.plan === 'premium') && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 shadow-sm overflow-hidden p-6 relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="text-6xl">🤝</span>
                                </div>
                                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                                    <span className="bg-amber-100 p-1 rounded-md">🤝</span>
                                    アフィリエイト
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">あなたの紹介コード</p>
                                        <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg p-2">
                                            <code className="flex-1 font-mono text-sm font-bold text-amber-800 text-center">{user.affiliateCode || "CODE_GENERATING..."}</code>
                                            <button
                                                className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold hover:bg-amber-200 transition-colors"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`https://lunaflow.com?ref=${user.affiliateCode}`);
                                                    alert("紹介リンクをコピーしました！");
                                                }}
                                            >
                                                コピー
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 rounded-lg p-3">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[10px] text-amber-800 font-bold">今月の見込み収益</span>
                                            <span className="text-lg font-bold text-amber-600">
                                                ¥{affiliateEarnings.monthlyEarnings.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 text-[9px] text-amber-700/70">
                                            <span>直紹介: {affiliateEarnings.directReferrals}人</span>
                                            <span>2次紹介: {affiliateEarnings.indirectReferrals}人</span>
                                        </div>
                                    </div>

                                    {/* Payout Preference */}
                                    <div className="pt-2 border-t border-amber-100/50">
                                        <p className="text-[10px] text-amber-800 font-bold mb-2">報酬の受け取り設定</p>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-start gap-2 text-xs text-amber-900 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="payoutPreference"
                                                    value="offset_purchase"
                                                    checked={user.payoutPreference !== 'bank_transfer'} // Default to offset
                                                    onChange={() => setUser({ ...user, payoutPreference: 'offset_purchase' })}
                                                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                                                />
                                                <div>
                                                    <span className="font-bold">仕入れ代金から相殺 (推奨)</span>
                                                    <p className="text-[9px] text-amber-700/80 mt-0.5">次回の仕入れ代金から自動的に値引きされます。</p>
                                                </div>
                                            </label>
                                            <label className="flex items-start gap-2 text-xs text-amber-900 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="payoutPreference"
                                                    value="bank_transfer"
                                                    checked={user.payoutPreference === 'bank_transfer'}
                                                    onChange={() => setUser({ ...user, payoutPreference: 'bank_transfer' })}
                                                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                                                />
                                                <div>
                                                    <span className="font-bold">銀行振込</span>
                                                    <div className="text-[9px] mt-0.5 space-y-0.5">
                                                        <p className="text-red-500 font-bold">※振込手数料 ¥1,000 が差し引かれます。</p>
                                                        <p className="text-amber-800">※この設定は、変更された月末に締めて支払いは翌月末になります。</p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => alert("履歴表示モーダルはまだ実装されていません（Mock: データとしてはAPIで記録されています）")}
                                        className="w-full text-[10px] text-amber-700 font-bold underline hover:text-amber-900 mt-2"
                                    >
                                        報酬履歴を確認する
                                    </button>

                                    <div className="text-[10px] text-amber-700 leading-tight">
                                        <p>✨ 紹介料率: 直紹介 7% / 2次 3%</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Menu */}
                        <nav className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-2">

                            <Link href="/manual" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors group">
                                <Book className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                                <span className="text-sm font-medium">利用マニュアル</span>
                            </Link>
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-red-600 rounded-lg transition-colors group text-left">
                                <LogOut className="w-4 h-4 text-slate-300 group-hover:text-red-400" />
                                <span className="text-sm font-medium">ログアウト</span>
                            </button>
                        </nav>
                    </div>

                    {/* RIGHT CONTENT (Courses & Info) - 9 Columns */}
                    <div className="lg:col-span-9 space-y-10">
                        {/* Courses & Announcements SECTIONS (unchanged usually but kept due to context length constraints, simplifying for safety) ... */}
                        {/* Assuming keeping existing structure... re-rendering minimal context to match replace rules */}

                        {/* Section: Learning Status */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center gap-2">
                                    <PlayCircle className="w-5 h-5 text-rose-600" />
                                    受講中のコース
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {courses.map((course) => (
                                    <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <PlayCircle className="w-24 h-24 text-rose-900" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-full">受講中</span>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-full">
                                                    <Clock className="w-3 h-3" />
                                                    期限: {course.expirationDate || "無期限"}
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-slate-800 mb-2 leading-relaxed group-hover:text-rose-700 transition-colors">
                                                <Link href={`/student/course/${course.id}`} className="before:absolute before:inset-0">
                                                    {course.title}
                                                </Link>
                                            </h3>

                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-4">
                                                <div className="bg-rose-500 h-full w-[35%] rounded-full"></div> {/* Mock Progress */}
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <p className="text-xs text-slate-500">進捗: 35%</p>
                                                <span className="text-xs font-bold text-rose-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                    学習を再開 &rarr;
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section: Announcements */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-amber-500" />
                                    お知らせ
                                </h2>
                                <Link href="#" className="text-xs font-bold text-slate-400 hover:text-rose-700">すべて見る</Link>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                                {announcements.map((item) => (
                                    <div key={item.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group">
                                        <div className="text-xs font-bold text-slate-400 pt-1 w-24 flex-shrink-0">{item.date}</div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-slate-700 mb-1 group-hover:text-rose-700 transition-colors">{item.title}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-1">{item.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section: Support */}
                        <section className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                    <Book className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-indigo-900 text-sm">学習ガイド・マニュアル</h3>
                                    <p className="text-xs text-indigo-700">システムの使い方がわからない場合はこちら</p>
                                </div>
                            </div>
                            <Link href="/manual" className="px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors">
                                マニュアルを見る
                            </Link>
                        </section>

                    </div>
                </div>
            </main >

            {/* Footer */}
            < footer className="max-w-6xl mx-auto px-8 py-10 text-center space-y-4 border-t border-slate-100 mt-12" >
                <img src="/logo.png" alt="LunaFlow" style={{ height: '20px' }} className="mx-auto grayscale opacity-30" />
                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">© 2025 LunaFlow Online School. All Rights Reserved.</p>
            </footer >

            {/* Profile Edit Modal */}
            {
                isProfileModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">プロフィール・設定編集</h3>

                            <div className="space-y-6">
                                {/* Name Section */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">お名前</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2">※フルネーム（漢字）で入力してください。</p>
                                </div>

                                {/* Email Section */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">メールアドレス</label>
                                    <div className="flex gap-2">
                                        <div className="bg-slate-100 rounded-l-lg px-3 py-3 flex items-center text-slate-400">
                                            <Settings className="w-4 h-4" /> {/* Reusing Settings Icon as Mail placeholder or import Mail */}
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-r-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>

                                {/* Address Section */}
                                {/* Nickname Section [NEW] */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">コミュニティ用ニックネーム（必須）</label>
                                    <input
                                        type="text"
                                        value={communityNickname}
                                        onChange={(e) => setCommunityNickname(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors"
                                        placeholder="コミュニティで表示される名前"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2">※コミュニティ内ではこの名前が表示されます。</p>
                                </div>

                                {/* Address Section */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">荷物送付住所</label>
                                    <div className="grid grid-cols-12 gap-4 mb-3">
                                        <div className="col-span-4">
                                            <input
                                                type="text"
                                                value={zipCode}
                                                onChange={(e) => setZipCode(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors"
                                                placeholder="〒"
                                            />
                                        </div>
                                        <div className="col-span-8">
                                            <input
                                                type="text"
                                                readOnly
                                                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed"
                                                placeholder="都道府県（自動入力）"
                                            />
                                        </div>
                                    </div>
                                    <textarea
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors min-h-[80px]"
                                        placeholder="市区町村以降の住所..."
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2">※おまかせ仕入れや教材やプレゼントの発送に使用します。正確にご入力ください。</p>
                                </div>

                                {/* Plan Management (Moved here) */}
                                <div className="pt-6 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-700 mb-3">契約プラン管理</h4>
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs text-slate-500">現在のプラン</span>
                                            <span className="text-sm font-bold text-slate-800 uppercase">{user.plan}</span>
                                        </div>

                                        {user.plan === 'light' ? (
                                            <div className="space-y-2">
                                                <button onClick={() => handleSubscriptionUpgrade('standard')} className="w-full text-xs bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors">スタンダードへアップグレード</button>
                                                <button onClick={() => handleSubscriptionUpgrade('premium')} className="w-full text-xs bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 transition-colors">プレミアムへアップグレード</button>
                                            </div>
                                        ) : (
                                            <button
                                                className="w-full text-xs border border-slate-200 text-slate-500 font-bold py-2 rounded-lg hover:bg-slate-50 transition-colors"
                                                onClick={() => setIsPlanChangeModalOpen(true)}
                                            >
                                                プランの変更・解約
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleProfileSave}
                                    className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                                >
                                    変更を保存
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Purchase Request Modal */}
            {
                isPurchaseModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">仕入れ希望フォーム</h3>
                            <form onSubmit={handlePurchaseSubmit} className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">メールアドレス <span className="text-red-500">*</span></label>
                                        <input required type="email" name="email" value={purchaseForm.email} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">お名前 <span className="text-red-500">*</span></label>
                                        <input required type="text" name="name" value={purchaseForm.name} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">郵便番号 <span className="text-red-500">*</span></label>
                                        <input required type="text" name="postalCode" value={purchaseForm.postalCode} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">都道府県 <span className="text-red-500">*</span></label>
                                        <input required type="text" name="prefecture" value={purchaseForm.prefecture} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-2">市区町村以降の住所 <span className="text-red-500">*</span></label>
                                    <input required type="text" name="address" value={purchaseForm.address} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">電話番号 <span className="text-red-500">*</span></label>
                                        <input required type="tel" name="phone" value={purchaseForm.phone} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">加入中のプラン <span className="text-red-500">*</span></label>
                                        <select name="plan" value={purchaseForm.plan} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                            <option value="Light">ライトプラン</option>
                                            <option value="Standard">スタンダードプラン</option>
                                            <option value="Premium">プレミアムプラン</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-2">希望購入金額 <span className="text-red-500">*</span></label>
                                    <input required type="text" name="amount" value={purchaseForm.amount} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" placeholder="例: 10000" />
                                    <p className="text-[10px] text-slate-400 mt-1">※月間仕入れ目標: Light 8万円 / Standard 6万円 / Premium 3万円</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">希望する配達業者 <span className="text-red-500">*</span></label>
                                        <select name="carrier" value={purchaseForm.carrier} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                            <option value="郵便局">郵便局</option>
                                            <option value="ヤマト">ヤマト</option>
                                            <option value="佐川急便">佐川急便</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-2">希望支払い方法 <span className="text-red-500">*</span></label>
                                        <select name="payment" value={purchaseForm.payment} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                            <option value="銀行振込">銀行振込</option>
                                            <option value="クレジットカード">クレジットカード</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-2">補足情報</label>
                                    <textarea name="note" value={purchaseForm.note} onChange={handlePurchaseChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 h-20" placeholder="ライブ購入との同梱希望など" />
                                </div>

                                <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsPurchaseModalOpen(false)}
                                        className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                                    >
                                        {isSubmitting ? "送信中..." : "希望を送信／請求書発行"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Plan Change Modal */}
            {
                isPlanChangeModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">プラン変更・解約手続き</h3>

                            <div className="space-y-6">
                                <div className="bg-slate-50 p-4 rounded-lg text-sm">
                                    <p className="font-bold text-slate-700 mb-2">現在の契約状況</p>
                                    <ul className="space-y-1 text-xs text-slate-600">
                                        <li>現在のプラン: <span className="font-bold uppercase">{user.plan}</span></li>
                                        <li>契約開始日: {registrationDate.toLocaleDateString()} ({Math.floor((new Date().getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24 * 30))}ヶ月経過)</li>
                                        <li>累積仕入れ額: ¥{lifetimePurchaseTotal.toLocaleString()}</li>
                                    </ul>
                                </div>

                                {/* Upgrade Section */}
                                <div>
                                    <h4 className="text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                                        <span className="bg-indigo-100 p-1 rounded">⬆️</span> アップグレード
                                    </h4>
                                    <p className="text-xs text-slate-500 mb-3">上位プランへの変更は<span className="font-bold text-indigo-600">即日可能</span>です。</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {user.plan !== 'premium' && (
                                            <button onClick={() => handleSubscriptionUpgrade('premium')} className="py-2 px-3 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                                                Premiumへ変更
                                            </button>
                                        )}
                                        {user.plan === 'light' && (
                                            <button onClick={() => handleSubscriptionUpgrade('standard')} className="py-2 px-3 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                                                Standardへ変更
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Downgrade/Cancel Section */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                        <span className="bg-slate-100 p-1 rounded">⬇️</span> ダウングレード・解約
                                    </h4>

                                    {/* Logic Check */}
                                    {(() => {
                                        const monthsElapsed = Math.floor((new Date().getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
                                        const requiredMonths = 6;
                                        const monthlyTarget = user.plan === 'premium' ? 30000 : 60000; // Standard/Premium logic
                                        const requiredTotal = monthlyTarget * requiredMonths;
                                        const deficit = requiredTotal - lifetimePurchaseTotal;
                                        const isEligibleTime = monthsElapsed >= requiredMonths;
                                        const isEligiblePayment = lifetimePurchaseTotal >= requiredTotal;

                                        if (isEligibleTime && isEligiblePayment) {
                                            return (
                                                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                                    <p className="text-xs text-green-700 font-bold mb-2">条件を満たしているため、手続きが可能です。</p>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => alert("ダウングレード申請フォームへ（Mock）")} className="flex-1 py-2 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded hover:bg-slate-50">
                                                            ダウングレード
                                                        </button>
                                                        <button onClick={() => alert("解約申請フォームへ（Mock）")} className="flex-1 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded hover:bg-red-50">
                                                            解約する
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                                    <p className="text-xs text-red-600 font-bold mb-2">🔒 現在の手続きには条件が不足しています</p>
                                                    <ul className="text-[11px] text-red-500 space-y-1 mb-3 list-disc list-inside">
                                                        <li>契約期間: 最低6ヶ月（現在: {monthsElapsed}ヶ月）</li>
                                                        <li>おまかせ仕入れ総額: {requiredMonths}ヶ月分の目標額</li>
                                                    </ul>

                                                    {!isEligiblePayment && (
                                                        <div className="bg-white p-2 rounded border border-red-200 mb-2">
                                                            <p className="text-[10px] text-slate-500 text-center">不足金額の明細</p>
                                                            <p className="text-center font-bold text-red-600 text-sm">あと ¥{deficit.toLocaleString()}</p>
                                                            <p className="text-[9px] text-slate-400 text-center mt-1">※この金額をお支払いいただくことで即日手続き可能です。</p>
                                                        </div>
                                                    )}

                                                    <button onClick={() => setIsPurchaseModalOpen(true)} className="w-full py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700">
                                                        不足分を支払って手続きへ進む
                                                    </button>
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>

                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                                <button
                                    onClick={() => setIsPlanChangeModalOpen(false)}
                                    className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
