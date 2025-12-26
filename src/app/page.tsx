import styles from "./page.module.css";
import CourseCard from "@/components/CourseCard";
import { MOCK_COURSES } from "@/lib/data";

export default function Home() {
  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>React開発をマスターしよう</h1>
        <p className={styles.subtitle}>
          プレミアムな動画レッスンとインタラクティブなクイズでスキルを向上させましょう。
        </p>
      </div>

      <div className={styles.grid}>
        {MOCK_COURSES.map((course) => (
          <CourseCard key={course.id} lesson={course as any} />
        ))}
      </div>
    </main>
  );
}
