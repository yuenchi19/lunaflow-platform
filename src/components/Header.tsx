"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import styles from './Header.module.css';
import { getUnreadMessageCount, getStudentProgressDetail } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Menu, X, PlayCircle } from 'lucide-react';

export default function Header() {
    const router = useRouter();
    const supabase = createClient();

    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Mobile Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // App State
    const [unreadCount, setUnreadCount] = useState(0);
    const [feedbackCount, setFeedbackCount] = useState(0);

    // Check Login Status on Mount
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setIsLoading(false);
        };
        checkUser();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    // Polling for unread messages and feedbacks
    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            setFeedbackCount(0);
            return;
        }

        const fetchCounts = () => {
            const mockCount = getUnreadMessageCount(user.id) || 0;
            setUnreadCount(mockCount);

            // Feedback Count (Simple: count completed feedbacks that user hasn't "cleared" - simplified to just total completed for now or check diff)
            // Ideally we track "last_checked_feedback" timestamp.
            const progress = getStudentProgressDetail(user.id);
            const feedbacks = progress.filter(p => p.feedbackStatus === 'completed');

            // Check against last seen count
            const lastSeen = parseInt(localStorage.getItem(`luna_seen_feedback_count_${user.id}`) || "0");
            if (feedbacks.length > lastSeen) {
                setFeedbackCount(feedbacks.length - lastSeen);
            } else {
                setFeedbackCount(0);
            }
        };

        fetchCounts();

        const interval = setInterval(fetchCounts, 5000); // 5 sec poll
        return () => clearInterval(interval);
    }, [user]);

    const handleAuthAction = async () => {
        setErrorMsg("");
        try {
            if (authMode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                setIsAuthModalOpen(false);
                router.refresh(); // Refresh to update middleware/server components
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: email.split('@')[0], // Default name
                        }
                    }
                });
                if (error) throw error;
                alert("登録確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。");
                setIsAuthModalOpen(false);
            }
        } catch (err: any) {
            setErrorMsg(err.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const handleOpenLogin = (e: React.MouseEvent) => {
        e.preventDefault();
        setAuthMode('login');
        setIsAuthModalOpen(true);
    };

    return (
        <>
            <header className={styles.header}>
                <Link href="/" className={styles.logo}>
                    <img src="/logo.png" alt="LunaFlow" style={{ height: '24px' }} />
                </Link>

                {/* Desktop Nav */}
                <nav className={styles.nav}>
                    <Link href="/student/dashboard" className={styles.learningButton}>
                        <PlayCircle size={16} />
                        学習
                    </Link>

                    <Link href="/" className={styles.navLink}>
                        コース一覧
                    </Link>

                    {user ? (
                        <>
                            <Link href="/student/dashboard" className={styles.navLink} style={{ position: "relative" }}>
                                マイページ
                                {feedbackCount > 0 && (
                                    <span className={styles.badge} style={{ backgroundColor: '#F59E0B' }}>
                                        {feedbackCount}
                                    </span>
                                )}
                            </Link>
                            <Link href="/community" className={styles.navLink} style={{ position: "relative" }}>
                                コミュニティ
                                {unreadCount > 0 && (
                                    <span className={styles.badge}>
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link href="/manual" className={styles.navLink}>
                                マニュアル
                            </Link>
                            <button onClick={handleLogout} className={styles.navLink}>
                                ログアウト
                            </button>
                        </>
                    ) : (
                        <>
                            {!isLoading && (
                                <a href="#" onClick={handleOpenLogin} className={styles.navLink}>
                                    ログイン / 登録
                                </a>
                            )}
                        </>
                    )}
                </nav>

                {/* Mobile Controls */}
                <div className={styles.mobileControls}>
                    <Link href="/student/dashboard" className={styles.learningButton}>
                        <PlayCircle size={16} />
                        学習
                    </Link>
                    <button className={styles.menuButton} onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu size={24} />
                    </button>
                </div>

                {/* Mobile Drawer */}
                {isMobileMenuOpen && (
                    <>
                        <div className={styles.drawerOverlay} onClick={() => setIsMobileMenuOpen(false)} />
                        <div className={styles.drawer}>
                            <div className={styles.drawerHeader}>
                                <button onClick={() => setIsMobileMenuOpen(false)} className={styles.menuButton}>
                                    <X size={24} />
                                </button>
                            </div>
                            <nav className={styles.drawerNav}>
                                <Link href="/" className={styles.drawerNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                                    コース一覧
                                </Link>
                                {user ? (
                                    <>
                                        <Link href="/student/dashboard" className={styles.drawerNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                                            マイページ
                                        </Link>
                                        <Link href="/community" className={styles.drawerNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                                            コミュニティ
                                            {unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </Link>
                                        <Link href="/manual" className={styles.drawerNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                                            マニュアル
                                        </Link>
                                        <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className={`${styles.drawerNavLink} text-red-500`}>
                                            ログアウト
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={(e) => { handleOpenLogin(e); setIsMobileMenuOpen(false); }} className={styles.drawerNavLink}>
                                        ログイン / 登録
                                    </button>
                                )}
                            </nav>
                        </div>
                    </>
                )}
            </header>

            {/* Auth Modal */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">
                            {authMode === 'login' ? 'ログイン' : '新規登録'}
                        </h3>

                        {errorMsg && (
                            <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
                                {errorMsg}
                            </div>
                        )}

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">パスワード</label>
                                <input
                                    type="password"
                                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleAuthAction}
                                className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                            >
                                {authMode === 'login' ? 'ログイン' : '登録メールを送信'}
                            </button>
                            <button
                                onClick={() => setIsAuthModalOpen(false)}
                                className="w-full py-2 bg-slate-100 text-slate-600 rounded font-bold hover:bg-slate-200"
                            >
                                キャンセル
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <button
                                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                                className="text-xs text-blue-500 hover:underline"
                            >
                                {authMode === 'login' ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
