"use client";

import { useState, useEffect } from "react";
import { User, Course, Announcement } from "@/types";
import { createMockStripeSession } from "@/lib/stripe-integration";
import { MOCK_USERS, MOCK_COURSES, getAffiliateEarnings, getStudentProgressDetail } from "@/lib/data";
import { User as UserIcon, Bell, ExternalLink, Book, LogOut, Settings, PlayCircle, Clock, TrendingUp, Lock, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LockOverlay from "../LockOverlay";
import { ProgressBar } from "../ui/ProgressBar";
import { useCart } from "@/context/CartContext";
import { getShippingFee, PREFECTURES, Carrier } from "@/lib/shipping";
import { useSearchParams } from "next/navigation";

interface StudentDashboardProps {
    initialUser?: User | null;
}

export default function StudentDashboard({ initialUser }: StudentDashboardProps) {
    const supabase = createClient();
    const searchParams = useSearchParams();
    // STRICT: Unsafe to fallback to Mock User (which is Premium).
    // If no initialUser, we must assume loading or unauthenticated.
    // However, if called from Server Component, initialUser should be present if logged in.
    const [user, setUser] = useState<User | null>(initialUser || null);

    // Redirect if no user found (and not just loading)
    useEffect(() => {
        if (!initialUser) {
            // Optional: trigger client side fetch or redirect
            // For now, let's allow null and show Loading... to prevent "Premium" flash
        }
    }, [initialUser]);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Loading User Profile...</div>;
    }
    const [courses, setCourses] = useState<Course[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [affiliateEarnings, setAffiliateEarnings] = useState({ directReferrals: 0, indirectReferrals: 0, monthlyEarnings: 0 });

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [newName, setNewName] = useState(user.name);
    const [email, setEmail] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [address, setAddress] = useState("");
    const [communityNickname, setCommunityNickname] = useState("");
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Password Change State
    const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" });
    const [passwordMsg, setPasswordMsg] = useState("");

    // Purchase Form States
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);


    const [unlocks, setUnlocks] = useState({ affiliate: false, inventory: false });

    useEffect(() => {
        // Fetch Unlock Status
        fetch('/api/student/unlock-status')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setUnlocks(data);
                }
            })
            .catch(err => console.error("Failed to fetch unlock status", err));
    }, []);

    useEffect(() => {
        const isUnlocked = user.isLedgerEnabled || unlocks.inventory;
        if (searchParams.get('openPurchase') === 'true' && isUnlocked) {
            setIsPurchaseModalOpen(true);
        }
    }, [searchParams, user.isLedgerEnabled, unlocks.inventory]);

    // Plan Change States
    const [isPlanChangeModalOpen, setIsPlanChangeModalOpen] = useState(false);
    const [lifetimePurchaseTotal, setLifetimePurchaseTotal] = useState(0);
    const [registrationDate, setRegistrationDate] = useState<Date>(new Date());

    const [purchaseForm, setPurchaseForm] = useState({
        amount: "",
        scheduledDate: "",
        note: "",
        carrier: "",
        plan: user.plan || "standard",
        prefecture: "" // Added
    });

    const [currentMonthPurchaseTotal, setCurrentMonthPurchaseTotal] = useState(0);
    const [purchaseTarget, setPurchaseTarget] = useState(0);

    const [rewardsBalance, setRewardsBalance] = useState(0);
    const [useReward, setUseReward] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch('/api/courses');
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data);
                }
            } catch (e) {
                console.error("Failed to fetch courses", e);
            }
        };

        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (res.ok) {
                    const data = await res.json();
                    setAnnouncements(data);
                }
            } catch (e) {
                console.error("Failed to fetch news", e);
            }
        };

        fetchCourses();
        fetchNews();
    }, []);

    useEffect(() => {
        const fetchRewards = async () => {
            try {
                const res = await fetch('/api/user/rewards');
                if (res.ok) {
                    const data = await res.json();
                    setRewardsBalance(data.balance || 0);
                }
            } catch (e) {
                console.error("Failed to fetch rewards", e);
            }
        };
        fetchRewards();
    }, [user.id]);

    // Initialize State from User Prop or Storage
    useEffect(() => {
        if (user) {
            setNewName(user.name);
            setEmail(user.email);
            setZipCode(user.zipCode || "");
            setAddress(user.address || "");
            setCommunityNickname(user.communityNickname || "");
        }
    }, [user]);

    useEffect(() => {
        let target = 0;
        if (user.plan === 'light') target = 60000;
        else if (user.plan === 'standard') target = 60000;
        else if (user.plan === 'premium') target = 30000;
        setPurchaseTarget(target);

        // Fetch total from API instead of localStorage potentially? For now keep legacy local calc as backup or replace if API available
        // Ideally we should have an API to get this total. Assuming current legacy behavior is acceptable for display only.
        if (typeof window !== 'undefined') {
            const requests = JSON.parse(localStorage.getItem("mock_purchase_requests") || "[]");
            // ... (keep existing localStorage read for total calculation for now to minimize disruption, or fetch from server later)
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            const total = requests.reduce((sum: number, req: any) => {
                const reqDate = new Date(req.date);
                if (reqDate.getMonth() === currentMonth && reqDate.getFullYear() === currentYear) {
                    return sum + (parseInt(req.amount) || 0);
                }
                return sum;
            }, 0);
            setCurrentMonthPurchaseTotal(total);
        }
    }, [user.plan, isPurchaseModalOpen]);

    // Affiliate Code Auto-Generation
    useEffect(() => {
        if (!user.affiliateCode && (user.plan === 'standard' || user.plan === 'premium' || user.plan === 'partner')) {
            fetch('/api/student/affiliate/generate', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.affiliateCode) {
                        setUser(prev => {
                            if (!prev) return null;
                            return { ...prev, affiliateCode: data.affiliateCode };
                        });
                    }
                })
                .catch(err => console.error("Failed to generate affiliate code", err));
        }
    }, [user.affiliateCode, user.plan]);

    useEffect(() => {
        // ... (keep existing lifetime total logic or switch to API)
        if (typeof window !== 'undefined') {
            const requests = JSON.parse(localStorage.getItem("mock_purchase_requests") || "[]");
            const total = requests.reduce((sum: number, req: any) => sum + (parseInt(req.amount) || 0), 0);
            setLifetimePurchaseTotal(total);

            const mockDate = new Date();
            mockDate.setMonth(mockDate.getMonth() - 3);
            setRegistrationDate(mockDate);
        }

        const earnings = getAffiliateEarnings(user.id);
        setAffiliateEarnings(earnings);

        if (user.id) {
            fetch(`/api/admin/feedbacks?userId=${user.id}`).then(res => res.json()).then(data => {
                if (Array.isArray(data)) setFeedbacks(data);
            }).catch(e => console.error(e));

            // Fetch Purchase History
            fetch('/api/student/purchase-requests').then(res => res.json()).then(data => {
                if (Array.isArray(data)) setPurchaseRequests(data);
            }).catch(e => console.error(e));
        }
    }, [user.id]);

    // AI Feedback
    const [feedbacks, setFeedbacks] = useState<import("@/types").ProgressDetail[]>([]); // New Feedbacks
    const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]); // Purchase History
    const [showFeedbackToast, setShowFeedbackToast] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const allProgress = getStudentProgressDetail(user.id);
        const completedFeedbacks = allProgress.filter(p => p.feedbackStatus === 'completed');
        setFeedbacks(completedFeedbacks);

        const lastSeen = parseInt(localStorage.getItem(`luna_seen_feedback_count_${user.id}`) || "0");
        if (completedFeedbacks.length > lastSeen) {
            setShowFeedbackToast(true);
            localStorage.setItem(`luna_seen_feedback_count_${user.id}`, completedFeedbacks.length.toString());
        }
    }, [user.id]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [inventoryStats, setInventoryStats] = useState({ count: 0, profit: 0 });

    useEffect(() => {
        if (!user.isLedgerEnabled) return;
        const fetchInventory = async () => {
            try {
                const res = await fetch('/api/student/inventory');
                if (res.ok) {
                    const data = await res.json();
                    const count = (data.items || []).filter((i: any) => i.status !== 'SOLD').length;

                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();

                    const monthlyProfit = (data.ledger || []).filter((l: any) => {
                        const d = new Date(l.sellDate || l.createdAt);
                        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                    }).reduce((sum: number, l: any) => sum + (l.profit || 0), 0);

                    setInventoryStats({ count, profit: monthlyProfit });
                }
            } catch (e) {
                console.error("Failed to fetch inventory stats", e);
            }
        };
        fetchInventory();
    }, [user.isLedgerEnabled, user.id]);

    const { items: cartItems, clearCart, totalAmount: cartTotalAmount } = useCart();

    const handlePurchaseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const bodyData = {
                ...purchaseForm,
                useReward: useReward,
                items: cartItems
            };

            const response = await fetch('/api/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });
            const data = await response.json();
            if (response.ok) {
                // Keep local storage sync for client-side display consistency for now
                const requests = JSON.parse(localStorage.getItem("mock_purchase_requests") || "[]");
                requests.push({ ...purchaseForm, id: Date.now().toString(), status: "pending", date: new Date().toLocaleString() });
                localStorage.setItem("mock_purchase_requests", JSON.stringify(requests));

                if (cartItems.length > 0) {
                    clearCart();
                }

                alert("仕入れ希望を受け付けました。ご登録のメールアドレスに請求書を送付いたしました。");
                setIsPurchaseModalOpen(false);
                setUseReward(false); // Reset
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

    const handleProfileSave = async () => {
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    email: email, // Email update might be restricted by Supabase but sending anyway
                    address: address,
                    zipCode: zipCode,
                    communityNickname: communityNickname
                }),
            });

            if (res.ok) {
                const updatedUser = {
                    ...user,
                    name: newName,
                    email: email,
                    address: address,
                    zipCode: zipCode,
                    communityNickname: communityNickname
                };
                setUser(updatedUser);
                setIsProfileModalOpen(false);
                alert("プロフィール情報を更新しました。");
            } else {
                alert("プロフィールの更新に失敗しました。");
            }
        } catch (error) {
            console.error("Profile save error:", error);
            alert("通信エラーが発生しました。");
        }
    };

    const handlePasswordChange = async () => {
        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordMsg("確認用パスワードと一致しません");
            return;
        }
        try {
            const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
            if (error) throw error;
            alert("パスワードを変更しました。次回ログイン時から有効です。");
            setPasswordForm({ new: "", confirm: "" });
            setPasswordMsg("");
        } catch (e: any) {
            setPasswordMsg(e.message);
        }
    };

    const handleSubscriptionUpgrade = async (plan: 'standard' | 'premium') => {
        await createMockStripeSession(plan);
    };

    // --- Sub-components (Render Functions) ---

    const renderProfileCard = () => (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
            <div className="pt-4 pb-4 px-4 md:pt-6 md:pb-6 text-center">
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
    );



    const renderPurchaseTracker = () => {
        const isUnlocked = user.isLedgerEnabled || unlocks.inventory;
        const displayTotal = !isUnlocked ? 150000 : currentMonthPurchaseTotal;
        const displayTarget = !isUnlocked ? 300000 : (purchaseTarget || 1);
        const displayPercent = Math.round((displayTotal / displayTarget) * 100);

        return (
            <LockOverlay
                isLocked={!isUnlocked}
                title="仕入れ・在庫管理・ストア公開機能はロックされています"
                message="規定のカリキュラムを完了することで、利用可能になります。"
                actionLabel="コースを進める"
                actionLink={courses.length > 0 ? `/student/course/${courses[0].id}` : "/student/course/course_1"}
                blur="sm"
            >
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-sm p-4 md:p-6 relative overflow-hidden">
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
                                <span>{displayPercent}% 達成</span>
                            </div>
                            <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-indigo-100">
                                <div
                                    className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(displayPercent, 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                <span>現在: ¥{displayTotal.toLocaleString()}</span>
                                <span>目標: ¥{displayTarget.toLocaleString()}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            <ExternalLink className="w-4 h-4" />
                            仕入れ希望フォーム
                        </button>
                    </div>
                </div>
            </LockOverlay>
        );
    };

    const renderPurchaseHistory = () => {
        if (purchaseRequests.length === 0) return null;

        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 mt-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="bg-slate-100 p-1.5 rounded-lg text-slate-500">📄</span>
                    仕入れ・納品履歴
                </h3>
                <div className="space-y-4">
                    {purchaseRequests.map((req: any) => (
                        <div key={req.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(req.createdAt).toLocaleDateString('ja-JP')}</div>
                                    <div className="font-bold text-slate-700">おまかせ仕入れ</div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${req.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {req.status === 'completed' ? '発送済み' : '準備中'}
                                </span>
                            </div>

                            <div className="text-sm text-slate-600 mb-2">
                                <span className="text-xs text-slate-400 mr-2">金額:</span>
                                ¥{req.amount.toLocaleString()}
                            </div>

                            {req.status === 'completed' && req.trackingNumber && (
                                <div className="bg-white border border-emerald-100 rounded p-2 mb-2">
                                    <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">追跡番号</div>
                                    <div className="font-mono text-sm text-slate-700 tracking-wider">
                                        {req.trackingNumber}
                                    </div>
                                </div>
                            )}

                            {req.inventoryItems && req.inventoryItems.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-bold mb-2">納品明細</p>
                                    <ul className="space-y-1">
                                        {req.inventoryItems.map((item: any) => (
                                            <li key={item.id} className="text-xs text-slate-600 flex justify-between">
                                                <span>{item.brand} {item.name || item.brand}</span>
                                                {/* <span className="text-slate-400">¥{item.costPrice.toLocaleString()}</span> Cost should be hidden? Usually Delivery Note shows items. */}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAffiliateCard = () => {
        const hasPlan = ['standard', 'premium', 'partner'].includes(user.plan || '');
        const isUnlocked = hasPlan && unlocks.affiliate;

        // Determine Lock Message
        let lockTitle = "アフィリエイト機能はロックされています";
        let lockMessage = "規定のカリキュラムを完了することで、利用可能になります。";

        if (!hasPlan) {
            lockTitle = "スタンダードプラン以上で開放";
            lockMessage = "アフィリエイト機能を利用するにはプランのアップグレードが必要です。";
        }

        return (
            <LockOverlay
                isLocked={!isUnlocked}
                title={lockTitle}
                message={lockMessage}
                actionLabel={!hasPlan ? "プランを確認" : "コースを進める"}
                actionLink={!hasPlan ? "/pricing" : (courses.length > 0 ? `/student/course/${courses[0].id}` : "/student/course/course_1")}
                blur="sm"
            >
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 shadow-sm overflow-hidden p-4 md:p-6 relative">
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
                                        const url = typeof window !== 'undefined' ? window.location.origin : 'https://lunaflow.space';
                                        navigator.clipboard.writeText(`${url}?mode=register&ref=${user.affiliateCode}`);
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
                        </div>
                    </div>
                </div>
            </LockOverlay>
        );
    };

    const renderLedgerWidget = () => {
        const isUnlocked = user.isLedgerEnabled || unlocks.inventory;
        const displayCount = !isUnlocked ? 12 : inventoryStats.count;
        const displayProfit = !isUnlocked ? 85000 : inventoryStats.profit;

        return (
            <LockOverlay
                isLocked={!isUnlocked}
                title="まずはカリキュラムを進めましょう！"
                message="規定のカリキュラムを完了することで、利用可能になります。"
                actionLabel="コースを進める"
                actionLink={courses.length > 0 ? `/student/course/${courses[0].id}` : "/student/course/course_1"}
                blur="sm"
            >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 relative overflow-hidden group hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg"><Book className="w-4 h-4" /></span>
                            デジタル商品管理台帳 (在庫/売上)
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">在庫数</p>
                            <p className="text-lg font-bold text-slate-700">{displayCount} <span className="text-sm font-normal text-slate-400">点</span></p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">今月の利益</p>
                            <p className="text-lg font-bold text-emerald-600">¥{displayProfit.toLocaleString()}</p>
                        </div>
                    </div>

                    <Link href="/student/inventory" className="block w-full text-center py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                        台帳を開く
                    </Link>
                </div>
            </LockOverlay>
        );
    };

    const renderFeedbacks = () => {
        if (feedbacks.length === 0) return null;
        return (
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-serif font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        新着フィードバック
                    </h2>
                </div>
                <div className="space-y-4">
                    {feedbacks.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full">AI/講師からのコメント</span>
                                <span className="text-[10px] text-slate-400">{new Date(item.feedbackAt || item.completedAt).toLocaleString()}</span>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-2">{item.blockTitle}</h3>
                            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 leading-relaxed border border-slate-100">
                                {item.feedbackContent}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    };

    const renderCourses = () => (
        <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-serif font-bold text-slate-800 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-rose-600" />
                    受講中のコース
                </h2>
            </div>
            <div className="space-y-4 md:space-y-6">
                {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3 md:mb-4">
                                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-full">受講中</span>
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-slate-800 mb-2 leading-relaxed group-hover:text-rose-700 transition-colors">
                                <Link href={`/student/course/${course.id}`} className="before:absolute before:inset-0">
                                    {course.title}
                                </Link>
                            </h3>
                            <ProgressBar value={10} color="bg-rose-500" height="h-1.5" className="mb-4" />
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
                                <p className="text-xs text-slate-500 leading-tight md:flex-1">
                                    {course.title}へようこそ！まずは動画を確認して感想を記載して受講を開始してください。
                                </p>
                                <div className="flex justify-end md:justify-start">
                                    <span className="text-xs font-bold text-white bg-rose-600 px-3 py-2 rounded-lg shadow-sm group-hover:bg-rose-700 transition-colors">
                                        感想を送ってスタート &rarr;
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );

    const renderAnnouncements = () => (
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
                    <div key={item.id} className="p-4 md:p-5 flex items-start gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group">
                        <div className="text-xs font-bold text-slate-400 pt-1 w-24 flex-shrink-0">{item.date}</div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-700 mb-1 group-hover:text-rose-700 transition-colors">{item.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{item.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );

    const renderManual = () => (
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
    );

    const renderQuickMenu = () => (
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
    );

    const renderStoreWidget = () => {
        const isUnlocked = user.isLedgerEnabled || unlocks.inventory;

        return (
            <LockOverlay
                isLocked={!isUnlocked}
                title="ストア機能はロックされています"
                message="規定のカリキュラムを完了することで、利用可能になります。"
                actionLabel="コースを進める"
                actionLink={courses.length > 0 ? `/student/course/${courses[0].id}` : "/student/course/course_1"}
                blur="sm"
            >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 relative overflow-hidden group hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">👜</span>
                            リペアグッズストア
                        </h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                        転売実践に必要な道具を購入できます。
                    </p>
                    <Link href="/student/store" className="block w-full text-center py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                        ストアを見る
                    </Link>
                </div>
            </LockOverlay>
        );
    };

    // --- Main Render ---

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-slate-800 pb-32 relative">
            <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-20 shadow-sm hidden">
                {/* Header content moved to separate Header component, this block is just a placeholder if needed, but redundant with Layout */}
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-8 pt-6 md:pt-12">

                {/* Mobile Order Layout (Stack) */}
                <div className="lg:hidden space-y-6">
                    {renderProfileCard()}
                    {renderCourses()}
                    {renderAnnouncements()}
                    {renderAnnouncements()}
                    {renderPurchaseTracker()}
                    {renderPurchaseHistory()}
                    {renderAffiliateCard()}
                    {renderAffiliateCard()}
                    {renderStoreWidget()}

                    {renderManual()}
                    {/* renderQuickMenu() is mostly redundant with Manual/Logout, but user asked for Login things at bottom */}
                    {renderQuickMenu()}
                </div>

                {/* Desktop Order Layout (Grid) */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-12">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        {renderProfileCard()}
                        {renderLedgerWidget()}
                        {renderPurchaseTracker()}
                        {renderPurchaseHistory()}
                        {renderAffiliateCard()}
                        {renderStoreWidget()}
                        {renderQuickMenu()}
                    </div>

                    {/* Right Content */}
                    <div className="lg:col-span-8 space-y-10">
                        {renderFeedbacks()}
                        {renderCourses()}
                        {renderAnnouncements()}
                        {renderManual()}
                    </div>
                </div>

            </main>

            {/* Profile Edit Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">プロフィール・設定編集</h3>

                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">お名前</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors"
                                />
                            </div>

                            {/* LINE Integration */}
                            <div>
                                {/* GitHub Integration */}


                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">SNS連携</label>
                                <div className="flex items-center justify-between bg-[#06C755]/10 border border-[#06C755]/20 rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="w-5 h-5 text-[#06C755]" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">LINE連携</p>
                                            <p className="text-xs text-slate-500">
                                                {user.lineUserId ? '連携済みです' : '連携すると学習リマインドなどを受け取れます'}
                                            </p>
                                        </div>
                                    </div>
                                    {user.lineUserId ? (
                                        <span className="text-xs font-bold text-[#06C755] bg-white px-3 py-1.5 rounded border border-[#06C755]/30">
                                            連携中
                                        </span>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch('/api/student/line/link', { method: 'POST' });
                                                    const data = await res.json();
                                                    if (data.url) {
                                                        window.location.href = data.url;
                                                    } else {
                                                        alert('連携URLの発行に失敗しました');
                                                    }
                                                } catch (e) {
                                                    alert('エラーが発生しました');
                                                }
                                            }}
                                            className="text-xs font-bold text-white bg-[#06C755] px-4 py-2 rounded hover:bg-[#05b64d] transition-colors shadow-sm"
                                        >
                                            連携する
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Password Change */}
                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-slate-400" />
                                    パスワード変更
                                </h4>
                                <div className="space-y-3">
                                    <input
                                        type="password"
                                        placeholder="新しいパスワード"
                                        value={passwordForm.new}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors"
                                    />
                                    <input
                                        type="password"
                                        placeholder="新しいパスワード（確認）"
                                        value={passwordForm.confirm}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors"
                                    />
                                    {passwordMsg && <p className="text-xs text-red-500">{passwordMsg}</p>}
                                    <button
                                        onClick={handlePasswordChange}
                                        className="text-xs bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900"
                                    >
                                        パスワード更新
                                    </button>
                                </div>
                            </div>

                            {/* Email Section */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">メールアドレス</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-r-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors"
                                />
                            </div>

                            {/* Nickname */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">コミュニティ用ニックネーム</label>
                                <input
                                    type="text"
                                    value={communityNickname}
                                    onChange={(e) => setCommunityNickname(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors"
                                />
                            </div>

                            {/* Address & Zip */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">郵便番号</label>
                                <input
                                    type="text"
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors mb-4"
                                    placeholder="000-0000"
                                />
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">住所</label>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-800 outline-none focus:border-rose-500 transition-colors"
                                />
                                <p className="text-[11px] text-slate-400 mt-2">※この住所におまかせ仕入れの商品の発送がされます。</p>
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
                </div>
            )}

            {/* keeping other modals unchanged but included in logic - truncated for brevity but would be included in real overwrite */}
            {/* Purchase Modal */}
            {isPurchaseModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">仕入れ希望フォーム</h3>
                        <p className="text-xs text-slate-500 mb-6">
                            ご登録済みの会員情報（お名前、住所等）を使用して申請します。<br />
                            希望金額、決済予定日、備考を入力してください。
                        </p>
                        <form onSubmit={handlePurchaseSubmit} className="space-y-6">

                            {/* Cross-sell / Cart Info */}
                            {cartItems.length > 0 ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 flex items-center gap-2">
                                    <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded">おまとめ配送適用</span>
                                    <span>カート内の商品 ({cartItems.length}点) と同梱発送します。</span>
                                </div>
                            ) : (
                                <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
                                    <p className="font-bold mb-1">💡 リペアグッズも一緒にいかがですか？</p>
                                    <p className="text-xs">仕入れ商品と同梱なら、追加送料なしでお届けが可能です。</p>
                                    <Link href="/student/store" className="text-rose-600 font-bold hover:underline text-xs mt-1 block">
                                        ストアを見てみる &rarr;
                                    </Link>
                                </div>
                            )}

                            {/* Prefecture Selection */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-2">お住まいの地域 (都道府県)</label>
                                <select
                                    name="prefecture"
                                    value={purchaseForm.prefecture}
                                    onChange={handlePurchaseChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                                    required
                                >
                                    <option value="">選択してください</option>
                                    {PREFECTURES.map(pref => (
                                        <option key={pref} value={pref}>{pref}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Carrier Selection */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-2">配送業者 (Carrier)</label>
                                <select
                                    name="carrier"
                                    value={purchaseForm.carrier}
                                    onChange={handlePurchaseChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                                    required
                                >
                                    <option value="">選択してください</option>
                                    <option value="jp">日本郵便</option>
                                    <option value="ym">ヤマト運輸</option>
                                    <option value="sg">佐川急便</option>
                                </select>
                                <div className="mt-2 text-right">
                                    <Link href="/shipping-costs" target="_blank" className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center justify-end gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        送料はこちらで確認
                                    </Link>
                                </div>
                            </div>

                            {/* Summary Calculation */}
                            {(() => {
                                const omakase = parseInt(purchaseForm.amount) || 0;
                                const cart = cartTotalAmount;

                                let shipping = 0;
                                if ((omakase > 0 || cart > 0) && purchaseForm.prefecture && purchaseForm.carrier) {
                                    shipping = getShippingFee(purchaseForm.prefecture, purchaseForm.carrier as Carrier);
                                }

                                const subTotal = omakase + cart + shipping;

                                const available = Math.min(subTotal, rewardsBalance);
                                const offset = useReward ? available : 0;
                                const total = subTotal - offset;

                                return (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 space-y-2 text-sm">
                                        <h4 className="font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1">請求予定額内訳</h4>
                                        <div className="flex flex-col gap-1 mb-2">
                                            <div className="flex justify-between items-center text-slate-800">
                                                <span className="font-bold">仕入れ希望額</span>
                                                <span className="font-bold">¥{omakase.toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block self-start">
                                                ※今月の仕入れ実績に反映されます
                                            </p>
                                        </div>

                                        {cart > 0 && (
                                            <div className="flex flex-col gap-1 mb-2">
                                                <div className="flex justify-between items-center text-slate-800">
                                                    <span className="font-bold">リペアグッズ合計代金</span>
                                                    <span className="font-bold">¥{cart.toLocaleString()}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block self-start">
                                                    ※実績には反映されません
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-1 mb-2 border-t border-slate-100 pt-2">
                                            <div className="flex justify-between items-center text-slate-600">
                                                <span>同梱送料 ({purchaseForm.prefecture || '-'})</span>
                                                <span>¥{shipping.toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block self-start mt-1">
                                                ※送料は1件分のみ適用されています
                                            </p>

                                        </div>

                                        <div className="flex justify-between font-bold border-t border-slate-200 pt-2 mt-2">
                                            <span>小計</span>
                                            <span>¥{subTotal.toLocaleString()}</span>
                                        </div>

                                        {/* Reward Toggle */}
                                        {(user.plan === 'standard' || user.plan === 'premium') && rewardsBalance > 0 && (
                                            <div className="mt-4 pt-2 border-t border-dashed border-slate-300">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-amber-600">報酬残高: ¥{rewardsBalance.toLocaleString()}</span>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200">
                                                    <input
                                                        type="checkbox"
                                                        checked={useReward}
                                                        onChange={e => setUseReward(e.target.checked)}
                                                        className="text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700">報酬を支払いに充当する</span>
                                                </label>
                                                {useReward && (
                                                    <div className="flex justify-between text-rose-600 font-bold mt-2">
                                                        <span>充当額</span>
                                                        <span>-¥{offset.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 border-slate-800 pt-2 mt-2">
                                            <span>請求合計</span>
                                            <span>¥{total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Carrier Selection */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-2">配送業者 (Carrier)</label>
                                <select
                                    name="carrier"
                                    value={purchaseForm.carrier}
                                    onChange={handlePurchaseChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                                    required
                                >
                                    <option value="">選択してください</option>
                                    <option value="jp">日本郵便</option>
                                    <option value="ym">ヤマト運輸</option>
                                    <option value="sg">佐川急便</option>
                                </select>
                                <div className="mt-2 text-right">
                                    <Link href="/shipping-costs" target="_blank" className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center justify-end gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        送料はこちらで確認
                                    </Link>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-2">希望購入金額 (円)</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={purchaseForm.amount}
                                    onChange={handlePurchaseChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-lg font-bold"
                                    placeholder="例: 300000"
                                    required
                                />
                            </div>

                            {/* Scheduled Date */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-2">決済予定日</label>
                                <input
                                    type="date"
                                    name="scheduledDate"
                                    value={purchaseForm.scheduledDate}
                                    onChange={handlePurchaseChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                                    required
                                />
                            </div>

                            {/* Note */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-2">備考</label>
                                <textarea
                                    name="note"
                                    value={purchaseForm.note}
                                    onChange={handlePurchaseChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-h-[100px]"
                                    placeholder="管理者への連絡事項があればご記入ください"
                                />
                            </div>

                            <div className="flex gap-4 mt-8 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-lg hover:bg-slate-200 transition-colors">キャンセル</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50">
                                    {isSubmitting ? '送信中...' : '送信'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="text-center py-4 text-[10px] text-slate-300 opacity-50">
                System v.2025-12-30 01:16 (Build 757) - AI Feedback Enabled
            </div>

            {/* Feedback Toast */}
            {showFeedbackToast && (
                <div className="fixed bottom-4 right-4 bg-white border border-indigo-100 shadow-2xl rounded-xl p-4 z-50 animate-bounce flex items-center gap-4 max-w-sm">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">新しいフィードバックがあります！</h4>
                        <p className="text-xs text-slate-500">課題の添削が完了しました。</p>
                    </div>
                    <button onClick={() => setShowFeedbackToast(false)} className="text-slate-400 hover:text-slate-600">
                        <span className="sr-only">Close</span>
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
