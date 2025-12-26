"use client";

import { useEffect, useState } from 'react';
import styles from './ParticipationChart.module.css';
import { MOCK_CATEGORIES, MOCK_STUDENTS, getUserProgress } from '@/lib/data';

export default function ParticipationChart() {
    const [chartData, setChartData] = useState<{ label: string, val: number }[]>([]);
    const [totalStudents, setTotalStudents] = useState(5);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Get all students to get the total count
        const localStudents = JSON.parse(localStorage.getItem('luna_students') || '[]');
        const allStudents = [...MOCK_STUDENTS, ...localStudents];
        setTotalStudents(allStudents.length);

        // Map categories to completion counts
        const newData = MOCK_CATEGORIES.map(category => {
            let count = 0;
            allStudents.forEach(student => {
                const progress = getUserProgress(student.id);
                // Simple logic: if any block in this category is 'completed' (legacy) or exists in progress record
                // For now, let's just mock it or use the keys
                if (Object.keys(progress).some(key => key.includes(category.id))) {
                    count++;
                }
            });
            return { label: category.title, val: count };
        });

        setChartData(newData);
    }, []);

    const maxVal = Math.max(totalStudents, 10);

    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <div className={styles.title}>コース受講生数</div>
                <div className={styles.bigNumber}>
                    {totalStudents}<span className={styles.unit}>人</span>
                </div>
            </div>

            <div className={styles.tabs}>
                <div className={`${styles.tab} ${styles.activeTab}`}>カテゴリー毎の完了人数</div>
                <div className={styles.tab}>カテゴリー毎の未完了人数</div>
            </div>

            <div className={styles.chartContainer}>
                {chartData.map((item, index) => (
                    <div key={index} className={styles.barRow}>
                        <div className={styles.label}>{item.label}</div>
                        <div className={styles.barArea}>
                            <div
                                className={styles.barFill}
                                style={{ width: `${(item.val / maxVal) * 100}%` }}
                            >
                                <span className={styles.barVal}>{item.val}人</span>
                            </div>
                        </div>
                    </div>
                ))}
                {/* X Axis */}
                <div className={styles.xAxis}>
                    <span>0人</span>
                    <span>2人</span>
                    <span>4人</span>
                    <span>6人</span>
                    <span>8人</span>
                    <span>10人</span>
                </div>
            </div>

            {/* Date Pickers Placeholder */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', alignItems: 'center' }}>
                <input type="date" className="border p-2 rounded" />
                <span>〜</span>
                <input type="date" className="border p-2 rounded" />
            </div>
        </div>
    );
}
