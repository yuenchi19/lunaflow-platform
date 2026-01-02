"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { storage } from '@/app/lib/storage';
import { ProgressBar } from '@/components/ui/ProgressBar';

export default function StudentCoursePage({ params }: { params: { id: string } }) {
    const [course, setCourse] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        const courses = storage.getCourses();
        const found = courses.find((c: any) => c.id === params.id);
        setCourse(found);

        // Only show public categories for students
        const allCats = storage.getCategories(params.id);
        setCategories(allCats.filter((cat: any) => cat.isPublic));
    }, [params.id]);

    if (!course) return <div className={styles.loading}>読み込み中...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.courseLabel}>{course.label || 'コース'}</div>
                <h1 className={styles.courseTitle}>{course.title}</h1>
            </div>

            <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                    <span className={styles.progressLabel}>学習の進捗</span>
                </div>
                <ProgressBar
                    value={0}
                    max={categories.reduce((acc, cat) => acc + cat.blockCount, 0) || 100}
                    color="bg-indigo-600"
                    height="h-3"
                    showLabel
                    label="0%" // Or calculate real %
                />
            </div>

            <div className={styles.categoryList}>
                {categories.length === 0 ? (
                    <div className={styles.empty}>公開されているカテゴリがありません。</div>
                ) : (
                    categories.map((category, index) => (
                        <div key={category.id} className={styles.categoryCard}>
                            <div className={styles.categoryTop}>
                                <div className={styles.categoryIndex}>Chapter {index + 1}</div>
                                <h2 className={styles.categoryTitle}>{category.title}</h2>
                            </div>
                            <div className={styles.blockCount}>
                                全 {category.blockCount} ブロック
                            </div>
                            <Link
                                href={`/student/courses/${params.id}/categories/${category.id}`}
                                className={styles.startBtn}
                            >
                                学習を開始する
                            </Link>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.footer}>
                <Link href="/admin/courses" className={styles.backLink}>← 管理画面に戻る</Link>
            </div>
        </div>
    );
}
