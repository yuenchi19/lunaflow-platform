"use client";

import Link from 'next/link';
import { MOCK_LESSONS, MOCK_QUIZZES, saveUserProgress } from '@/lib/data';
import VideoPlayer from '@/components/VideoPlayer';
import QuizComponent from '@/components/QuizComponent';
import styles from './page.module.css';

export default function LessonPage({ params }: { params: { id: string } }) {
    const lesson = MOCK_LESSONS.find(l => l.id === params.id);
    const quiz = (MOCK_QUIZZES as any)[params.id];

    if (!lesson) {
        return (
            <div className={styles.notFound}>
                レッスンが見つかりません。<Link href="/">ホームに戻る</Link>
            </div>
        );
    }

    const handleQuizComplete = (score: number) => {
        // In a real app, we would get the actual user ID
        const userId = "u1";

        saveUserProgress(userId, lesson.id, score >= (quiz?.passingScore || 70));

        console.log(`Quiz completed for lesson ${lesson.id} with score: ${score}`);
        alert(`クイズの結果が保存されました！ スコア: ${score}%`);
    };

    return (
        <main className={styles.layout}>
            <Link href="/" className={styles.backLink}>
                &larr; コース一覧に戻る
            </Link>

            <div className={styles.lessonHeader}>
                <h1 className={styles.title}>{lesson.title}</h1>
                <p className={styles.description}>{lesson.description}</p>
            </div>

            <section className={styles.videoSection}>
                <VideoPlayer
                    videoUrl={lesson.videoUrl}
                    poster={lesson.thumbnailUrl}
                />
            </section>

            {quiz && (
                <section className={styles.quizSection}>
                    <QuizComponent
                        quiz={quiz}
                        onComplete={handleQuizComplete}
                    />
                </section>
            )}
        </main>
    );
}
