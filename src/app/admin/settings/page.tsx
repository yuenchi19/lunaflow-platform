"use client";

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.breadcrumb}>
                    <Link href="/admin/dashboard">ダッシュボード</Link> / 設定
                </div>
                <h1 className={styles.title}>設定</h1>
            </div>

            <div className={styles.settingsLayout}>
                <aside className={styles.settingsSidebar}>
                    <button className={activeTab === 'general' ? styles.activeTab : ''} onClick={() => setActiveTab('general')}>全般設定</button>
                    <button className={activeTab === 'account' ? styles.activeTab : ''} onClick={() => setActiveTab('account')}>アカウント・セキュリティ</button>
                    <button className={activeTab === 'notifications' ? styles.activeTab : ''} onClick={() => setActiveTab('notifications')}>通知設定</button>
                    <button className={activeTab === 'notifications' ? styles.activeTab : ''} onClick={() => setActiveTab('notifications')}>通知設定</button>
                    {/* Billing Tab Removed as per request */}
                </aside>

                <main className={styles.settingsMain}>
                    {activeTab === 'general' && (
                        <div className={styles.settingsSection}>
                            <h2 className={styles.sectionTitle}>全般設定</h2>
                            <div className={styles.formGroup}>
                                <label>スクール名</label>
                                <input type="text" defaultValue="オンクラス オンラインスクール" className={styles.input} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>スクールID (URL等に使用)</label>
                                <input type="text" defaultValue="onclass-school" className={styles.input} />
                                <p className={styles.helpText}>https://onclass.jp/s/<b>onclass-school</b></p>
                            </div>
                            <div className={styles.formGroup}>
                                <label>サイトの言語</label>
                                <input type="text" value="日本語 (固定)" disabled className={`${styles.input} bg-slate-100 text-slate-500 cursor-not-allowed`} />
                                <p className="text-xs text-slate-400 mt-1">※言語設定は変更できません。</p>
                            </div>
                            <button className={styles.saveBtn}>変更を保存</button>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className={styles.settingsSection}>
                            <h2 className={styles.sectionTitle}>アカウント・セキュリティ</h2>
                            <div className={styles.formGroup}>
                                <label>メールアドレス</label>
                                <input type="email" defaultValue="admin@example.com" className={styles.input} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>新しいパスワード</label>
                                <input type="password" placeholder="変更する場合のみ入力" className={styles.input} />
                            </div>
                            <button className={styles.saveBtn}>更新する</button>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className={styles.settingsSection}>
                            <h2 className={styles.sectionTitle}>通知設定</h2>
                            <div className={styles.formGroup}>
                                <h3 className="font-bold text-slate-700 mb-4">メール通知</h3>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="w-5 h-5 accent-slate-800" />
                                        <span>新規生徒の登録があった時</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="w-5 h-5 accent-slate-800" />
                                        <span>仕入れリクエスト受信時</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="w-5 h-5 accent-slate-800" />
                                        <span>コミュニティへの新しい投稿・返信</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 accent-slate-800" />
                                        <span>アフィリエイト申請があった時</span>
                                    </label>
                                </div>
                            </div>
                            <div className="border-t border-slate-100 my-6"></div>
                            <div className={styles.formGroup}>
                                <h3 className="font-bold text-slate-700 mb-4">システム通知</h3>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="w-5 h-5 accent-slate-800" />
                                        <span>日次サマリーレポートを受け取る</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" defaultChecked className="w-5 h-5 accent-slate-800" />
                                        <span>重要なお知らせ・メンテナンス情報</span>
                                    </label>
                                </div>
                            </div>
                            <button className={styles.saveBtn} onClick={() => alert("通知設定を保存しました（Mock）")}>設定を保存</button>
                        </div>
                    )}


                </main>
            </div>
        </div>
    );
}
