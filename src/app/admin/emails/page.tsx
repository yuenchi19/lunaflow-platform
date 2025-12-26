"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { SentEmail } from '@/types';

export default function EmailHistoryPage() {
    const [activeTab, setActiveTab] = useState<'waiting' | 'sent' | 'failed'>('waiting');
    const [emails, setEmails] = useState<SentEmail[]>([]);

    useEffect(() => {
        const savedEmails = localStorage.getItem('luna_emails');
        if (savedEmails) {
            try {
                setEmails(JSON.parse(savedEmails));
            } catch (e) {
                console.error("Failed to parse emails from localStorage", e);
                setEmails([]);
            }
        } else {
            setEmails([]);
        }
    }, []);

    const filteredEmails = emails.filter(email => email.status === activeTab);

    return (
        <div className={styles.container}>
            <div className={styles.breadcrumb}>
                <Link href="/admin/students">受講生</Link>
                <span>/</span>
                <span>送信履歴</span>
            </div>

            <div className={styles.tabs}>
                <div
                    className={`${styles.tab} ${activeTab === 'waiting' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('waiting')}
                >
                    送信待ち
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'sent' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('sent')}
                >
                    送信済み
                </div>
                <div
                    className={`${styles.tab} ${activeTab === 'failed' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('failed')}
                >
                    送信失敗
                </div>
            </div>

            {filteredEmails.length > 0 ? (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>宛先</th>
                                <th className={styles.th}>件名</th>
                                <th className={styles.th}>送信日時</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmails.map(email => (
                                <tr key={email.id}>
                                    <td className={styles.td}>
                                        {email.recipientName} ({email.recipientEmail})
                                    </td>
                                    <td className={`${styles.td} ${styles.subject}`}>
                                        {email.subject}
                                    </td>
                                    <td className={styles.td}>{email.sentAt}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    メールは存在しません
                </div>
            )}
        </div>
    );
}
