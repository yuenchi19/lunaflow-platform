import styles from './MotivationStats.module.css';

export default function MotivationStats() {
    const stats = [
        { label: "素晴らしい", count: 1, style: styles.excellent, icon: "🌟" },
        { label: "順調", count: 1, style: styles.good, icon: "😊" },
        { label: "停滞気味", count: 1, style: styles.stagnant, icon: "🤔" },
        { label: "停滞中", count: 1, style: styles.stalled, icon: "😰" },
        { label: "離脱", count: 1, style: styles.dropped, icon: "👋" },
    ];

    return (
        <div>
            <h3 className="text-lg font-bold mb-4 text-gray-700">受講生のモチベーション</h3>
            <div className={styles.grid}>
                {stats.map((stat) => (
                    <div key={stat.label} className={`${styles.card} ${stat.style}`}>
                        <div className={styles.label}>
                            <span>{stat.icon}</span>
                            {stat.label}
                            <span className="text-xs opacity-50">?</span>
                        </div>
                        <div className={styles.count}>{stat.count}人</div>
                        <button className={styles.button}>受講生を見る</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
