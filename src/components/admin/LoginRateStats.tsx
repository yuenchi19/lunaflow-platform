import styles from './LoginRateStats.module.css';

export default function LoginRateStats() {
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>受講生のログイン率</h3>

            <div className={styles.chartRow}>
                <div className={styles.chartWrapper}>
                    <div className={`${styles.pie} ${styles.pie7Days}`}></div>
                    <div className={styles.labelGroup}>
                        <span className={styles.labelText}>直近の7日間</span>
                        <span className={styles.percentage}>8.6%</span>
                    </div>
                </div>

                <div className={styles.chartWrapper}>
                    <div className={`${styles.pie} ${styles.pie30Days}`}></div>
                    <div className={styles.labelGroup}>
                        <span className={styles.labelText}>直近の30日間</span>
                        <span className={styles.percentage}>2%</span>
                    </div>
                </div>

                <div className={styles.chartWrapper}>
                    <div className={`${styles.pie} ${styles.pieCustom}`}></div>
                    <div className={styles.labelGroup}>
                        <span className={styles.labelText}>指定期間</span>
                        <span className={styles.percentageSmall}>%</span>
                    </div>
                </div>
            </div>

            <div className={styles.dateRangePicker}>
                <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                    <button style={{ padding: '0.5rem 1rem', background: '#f9fafb', borderRight: '1px solid #ddd' }}>期間を選択</button>
                    <span style={{ padding: '0.5rem' }}>~</span>
                    <button style={{ padding: '0.5rem 1rem', background: '#f9fafb' }}>期間を選択</button>
                </div>
            </div>
        </div>
    );
}
