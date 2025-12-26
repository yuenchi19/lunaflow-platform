"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Student {
    id: string;
    name: string;
    email: string;
    registrationDate: string;
}

export default function StudentDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);

    useEffect(() => {
        // Mock data for now, could fetch from storage
        setStudent({
            id: params.id,
            name: 'み',
            email: 'miduffy816@gmail.com',
            registrationDate: '2025/12/21'
        });
    }, [params.id]);

    if (!student) return <div className={styles.loading}>読み込み中...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>受講生情報</h1>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.headerBtn}>📥 受講生CSV出力</button>
                    <button className={styles.headerBtnPrimary}>📧 この受講生にメールを送る</button>
                    <div className={styles.betaTag}>ベータ</div>
                    <Link href="/admin/emails" className={styles.headerLink}>📧 メール送信履歴</Link>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.studentCard}>
                    <div className={styles.studentHeader}>
                        <div className={styles.avatarLarge}>{student.name[0]}</div>
                        <div className={styles.studentMainInfo}>
                            <div className={styles.nameRow}>
                                <h2 className={styles.studentName}>{student.name}</h2>
                                <div className={styles.editActions}>
                                    <button className={styles.textLink}>編集</button>
                                    <button className={`${styles.textLink} ${styles.deleteRed}`}>削除</button>
                                </div>
                            </div>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoLabel}>メールアドレス</div>
                                    <div className={styles.infoValue}>{student.email}</div>
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoLabel}>登録日時</div>
                                    <div className={styles.infoValue}>{student.registrationDate}</div>
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoLabel}>自由項目</div>
                                    <div className={styles.infoValue}>-</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>サービス利用情報</h3>
                <div className={styles.statsCard}>
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>ログイン率</div>
                        <div className={styles.statValue}>0%</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>最終ログイン日</div>
                        <div className={styles.statValue}>ログイン履歴なし</div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>コース学習状況</h3>
                <div className={styles.courseCard}>
                    <div className={styles.courseHeaderSmall}>
                        <span className={styles.courseBadge}>テスト</span>
                    </div>
                    <div className={styles.courseStats}>
                        <div className={styles.cStat}>
                            <div className={styles.cLabel}>入会日</div>
                            <div className={styles.cValue}>2025/12/21</div>
                        </div>
                        <div className={styles.cStat}>
                            <div className={styles.cLabel}>コースログイン率</div>
                            <div className={styles.cValue}>0%</div>
                        </div>
                        <div className={styles.cStat}>
                            <div className={styles.cLabel}>コース進捗率</div>
                            <div className={styles.cValue}>%</div>
                        </div>
                    </div>

                    <div className={styles.progressTableWrapper}>
                        <table className={styles.progressTable}>
                            <thead>
                                <tr>
                                    <th>カテゴリー名</th>
                                    <th>完了予定日</th>
                                    <th>進捗状況</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className={styles.emptyRow}>
                                    <td colSpan={3}></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <button onClick={() => router.back()} className={styles.backBtn}>← 戻る</button>
            </div>
        </div>
    );
}
