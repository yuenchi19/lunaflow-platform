"use client";

import Link from 'next/link';
import styles from './page.module.css';
import ParticipationChart from '@/components/admin/ParticipationChart';
import MotivationStats from '@/components/admin/MotivationStats';
import LoginRateStats from '@/components/admin/LoginRateStats';

export default function AdminDashboard() {
    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>管理者ダッシュボード</h1>
            </header>

            <section className={styles.statsGrid}>
                <Link href="/admin/students" className={styles.navCard}>
                    <div className={styles.navIcon}>🎓</div>
                    <div className={styles.navLabel}>受講生管理</div>
                </Link>
                <Link href="/admin/courses" className={styles.navCard}>
                    <div className={styles.navIcon}>📚</div>
                    <div className={styles.navLabel}>コース管理</div>
                </Link>
                <Link href="/admin/emails" className={styles.navCard}>
                    <div className={styles.navIcon}>✉️</div>
                    <div className={styles.navLabel}>メール履歴</div>
                </Link>
            </section>

            <div className={styles.dashboardGrid}>
                <section className={styles.mainStats}>
                    <ParticipationChart />
                </section>
                
                <section className={styles.sideStats}>
                    <LoginRateStats />
                    <div className={styles.spacer} />
                    <MotivationStats />
                </section>
            </div>

            <section className={styles.quickLinks}>
                <h2 className={styles.sectionTitle}>📚 作成済みのレッスン (確認用)</h2>
                <div className={styles.linkGroup}>
                    <Link href="/lessons/l1" className={styles.buttonPrimary}>レッスン1 (React入門)</Link>
                    <Link href="/lessons/l2" className={styles.buttonPrimary}>レッスン2 (状態管理)</Link>
                    <Link href="/" className={styles.buttonSecondary}>学生用トップページへ</Link>
                </div>
            </section>
        </main>
    );
}

