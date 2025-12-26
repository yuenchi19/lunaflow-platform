import Link from 'next/link';
import Image from 'next/image';
import { Lesson } from '@/types';
import styles from './CourseCard.module.css';

interface CourseCardProps {
    lesson: Lesson;
}

export default function CourseCard({ lesson }: CourseCardProps) {
    // Helper to format seconds to MM:SS
    const formatDuration = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <Link href={`/lessons/${lesson.id}`} className={styles.card}>
            <div className={styles.thumbnailContainer}>
                {lesson.thumbnailUrl && (
                    <img
                        src={lesson.thumbnailUrl}
                        alt={lesson.title}
                        className={styles.thumbnail}
                    />
                )}
                <div className={styles.durationBadge}>
                    {formatDuration(lesson.duration || 0)}
                </div>
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{lesson.title}</h3>
                <p className={styles.description}>{lesson.description}</p>

                <div className={styles.footer}>
                    <span className={styles.startLink}>レッスンを開始 &rarr;</span>
                </div>
            </div>
        </Link>
    );
}
