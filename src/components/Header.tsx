"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import styles from './Header.module.css';
import { MOCK_USERS, getUnreadMessageCount } from '@/lib/data';
import { useRouter } from 'next/navigation';

export default function Header() {
    // Simulate logged-in user (student)
    const user = MOCK_USERS[0];
    const [unreadCount, setUnreadCount] = useState(0);
    const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    useEffect(() => {
        const updateCount = () => {
            setUnreadCount(getUnreadMessageCount(user.id));
        };
        updateCount();
        const interval = setInterval(updateCount, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [user.id]);

    const handleInstructorClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsInstructorModalOpen(true);
    };

    const handleLogin = () => {
        if (email === "instructor@example.com" && password === "LunaFlowSecure2025!") {
            localStorage.setItem("admin_token", "valid_token");
            setIsInstructorModalOpen(false);
            router.push("/admin/dashboard");
        } else {
            alert("メールアドレスまたはパスワードが違います");
        }
    };

    return (
        <>
            <header className={styles.header}>
                <Link href="/" className={styles.logo}>
                    <img src="/logo.png" alt="LunaFlow" style={{ height: '24px' }} />
                </Link>

                <nav className={styles.nav}>
                    <Link href="/" className={styles.navLink}>
                        コース一覧
                    </Link>
                    <Link href="/student/dashboard" className={styles.navLink}>
                        マイページ
                    </Link>
                    <Link href="/community" className={styles.navLink} style={{ position: "relative" }}>
                        コミュニティ
                        {unreadCount > 0 && (
                            <span className={styles.badge}>
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </Link>
                    <Link href="/student/manuals" className={styles.navLink}>
                        マニュアル
                    </Link>
                    <a href="#" onClick={handleInstructorClick} className={styles.navLink}>
                        講師用
                    </a>
                </nav>
            </header>

            {/* Instructor Login Modal */}
            {isInstructorModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-8 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">講師用ログイン</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-blue-500"
                                    placeholder="instructor@example.com"
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
                                    placeholder="LunaFlowSecure2025!"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsInstructorModalOpen(false)}
                                className="flex-1 py-2 bg-slate-100 text-slate-600 rounded font-bold hover:bg-slate-200"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleLogin}
                                className="flex-1 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                            >
                                ログイン
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
