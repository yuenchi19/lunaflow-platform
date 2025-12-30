"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('account');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.breadcrumb}>
                    <Link href="/admin/dashboard">ダッシュボード</Link> / 設定
                </div>
                <h1 className={styles.title}>設定</h1>
            </div>

            <aside className={styles.settingsSidebar}>
                {/* Restricted to Account Only as per request */}
                <button className={`${styles.activeTab} w-full text-left`} onClick={() => setActiveTab('account')}>アカウント設定</button>
            </aside>

            <main className={styles.settingsMain}>
                {activeTab === 'account' && (
                    <div className={styles.settingsSection}>
                        <h2 className={styles.sectionTitle}>アカウント情報</h2>
                        {/* <div className="bg-yellow-50 p-4 rounded mb-6 text-sm text-yellow-800">
                                ※現在、セキュリティ設定の変更は制限されています。メールアドレスの変更のみ可能です。
                            </div> */}
                        <div className={styles.formGroup}>
                            <label>メールアドレス</label>
                            <input type="email" defaultValue="admin@example.com" className={styles.input} />
                        </div>
                        {/* Password hidden as per "Email Only" request? Or keep? 
                                User said "Email Change Only". "Other unnecessary personal settings hidden".
                                Password IS personal. But maybe they want to disallow password change here?
                                I will comment it out to strictly follow "Email Change Only". */}
                        {/* 
                            <div className={styles.formGroup}>
                                <label>新しいパスワード</label>
                                <input type="password" placeholder="変更する場合のみ入力" className={styles.input} />
                            </div> 
                            <button className={styles.saveBtn}>更新する</button>
                            */}
                        <div className="mt-4">
                            <button className={styles.saveBtn}>メールアドレスを変更</button>
                        </div>
                    </div>
                )}
            </main>
        </div>

    );
}
