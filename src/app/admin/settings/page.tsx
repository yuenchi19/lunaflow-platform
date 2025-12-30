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

                {activeTab === 'account' && (
                    <div className="mt-12 border-t pt-8">
                        <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
                        <div className="bg-red-50 border border-red-200 rounded p-6">
                            <h3 className="font-bold text-red-800 mb-2">データのクリーンアップ</h3>
                            <p className="text-sm text-red-700 mb-4">
                                本番環境からテスト用（ダミー）データを削除します。<br />
                                ※管理者（Admin/Staff）以外のユーザーデータ、および関連する購入履歴等が削除されます。
                            </p>
                            <CleanupButton />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function CleanupButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleCleanup = async () => {
        if (!confirm("本当に実行しますか？この操作は取り消せません。")) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/cleanup', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                alert(data.message);
            } else {
                setMessage("Error: " + data.error);
                alert("Error: " + data.error);
            }
        } catch (err: any) {
            setMessage("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleCleanup}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
                {loading ? '処理中...' : 'ダミーデータを削除する'}
            </button>
            {message && <p className="mt-2 text-sm font-bold">{message}</p>}
        </div>
    );
}
