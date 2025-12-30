"use client";

import { useState, useEffect } from 'react';
import styles from '../../components/admin/AdminLayout.module.css';
import AdminSidebar from '../../components/admin/AdminSidebar';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();

    // Legacy token check removed. Access is protected by Middleware and AccessControl component.
    // useEffect(() => {
    //     const token = localStorage.getItem("admin_token");
    //     if (!token) {
    //         router.push("/");
    //     }
    // }, [router]);

    return (
        <div className={styles.container}>
            <div className={`${styles.sidebarWrapper} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <AdminSidebar />
                <button
                    className={styles.closeBtn}
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />}

            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <div className={styles.headerTitle}>
                        <button
                            className={styles.menuBtn}
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className={styles.logo}>
                            <img src="/logo.png" alt="LunaFlow" style={{ height: '24px' }} />
                        </div>
                        <nav className={styles.topNav}>
                            <Link href="/admin/dashboard" className={styles.navTab}>ダッシュボード</Link>
                            <Link href="/community" className={styles.navTab}>コミュニティ</Link>
                        </nav>
                    </div>
                    <div className={styles.headerActions}>

                        <Link href="/admin/settings" className={styles.userProfile} style={{ cursor: 'pointer' }}>
                            <div className={styles.userIcon}>👤</div>
                        </Link>
                    </div>
                </header>
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}


