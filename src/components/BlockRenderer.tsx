import React from 'react';
import styles from './BlockRenderer.module.css';
import VideoPlayer from '@/components/VideoPlayer';

interface Block {
    id: string;
    type: string;
    title: string;
    content?: any;
    url?: string; // Legacy support
}

interface BlockRendererProps {
    block: Block | null;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
    // Interactive State
    const [quizSelected, setQuizSelected] = React.useState<number | null>(null);
    const [quizSubmitted, setQuizSubmitted] = React.useState(false);
    const [assignmentText, setAssignmentText] = React.useState('');
    const [assignmentUrl, setAssignmentUrl] = React.useState('');
    const [assignmentSubmitted, setAssignmentSubmitted] = React.useState(false);

    // Reset state when block changes
    React.useEffect(() => {
        setQuizSelected(null);
        setQuizSubmitted(false);
        setAssignmentText('');
        setAssignmentUrl('');
        setAssignmentSubmitted(false);
    }, [block?.id]);

    if (!block) return null;

    switch (block.type) {
        case 'video':
            return (
                <div className={styles.videoPlayer}>
                    <VideoPlayer videoUrl={block.url || block.content?.url || ''} />
                </div>
            );
        case 'text':
        case 'article':
            return (
                <div className={styles.textContent}>
                    <h2>{block.title}</h2>
                    <div className={styles.textBody}>
                        {block.type === 'article'
                            ? (block.content?.body || '記事の本文がここに表示されます。管理画面で入力した内容が反映されます。')
                            : (block.content?.body || '短いテキストがここに表示されます。')}
                    </div>
                </div>
            );
        case 'quiz':
            const options = block.content?.options || ['選択肢 1', '選択肢 2', '選択肢 3'];
            const correctIndex = block.content?.correctIndex ?? 0; // Mock correct index if missing

            return (
                <div className={styles.quizContent}>
                    <h2>{block.title}</h2>
                    <div className={styles.quizQuestion}>
                        {block.content?.body || '問題の本文がここに表示されます。'}
                    </div>
                    <div className={styles.quizOptions}>
                        {options.map((opt: string, i: number) => (
                            <button
                                key={i}
                                onClick={() => !quizSubmitted && setQuizSelected(i)}
                                className={`${styles.quizOptionBtn} ${quizSelected === i ? styles.selected : ''} ${quizSubmitted && i === correctIndex ? styles.correct : ''} ${quizSubmitted && quizSelected === i && quizSelected !== correctIndex ? styles.incorrect : ''}`}
                                disabled={quizSubmitted}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                    {!quizSubmitted ? (
                        <button
                            className={styles.submitAssignmentBtn}
                            disabled={quizSelected === null}
                            onClick={() => setQuizSubmitted(true)}
                        >
                            回答する
                        </button>
                    ) : (
                        <div className={`mt-4 p-4 rounded-lg font-bold text-center ${quizSelected === correctIndex ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {quizSelected === correctIndex ? '正解です！🎉' : '不正解です...'}
                            <div className="mt-2 text-xs opacity-75">
                                (テストモード: 回答結果の表示を確認できます)
                            </div>
                        </div>
                    )}
                </div>
            );
        case 'survey':
            return (
                <div className={styles.surveyContent}>
                    <h2>{block.title}</h2>
                    <p>アンケートへのご協力をお願いします。</p>
                    <div className={styles.surveyQuestions}>
                        {block.content?.questions?.map((q: any, i: number) => (
                            <div key={i} className={styles.surveyQuestionItem}>
                                <p className={styles.qTitle}>{i + 1}. {q.title || '無題の質問'}</p>
                                {q.type === 'text' ? (
                                    <textarea className={styles.surveyTextarea} placeholder="回答を入力"></textarea>
                                ) : (
                                    <div className={styles.qOptions}>
                                        {q.options?.map((opt: string, oi: number) => (
                                            <label key={oi} className={styles.qOptionLabel}>
                                                <input type={q.type} name={`q${i}`} /> {opt || `選択肢 ${oi + 1}`}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )) || <p>質問が設定されていません。</p>}
                    </div>
                    <button className={styles.submitAssignmentBtn} onClick={() => alert('アンケートを送信しました（テスト）')}>回答を送信</button>
                </div>
            );
        case 'assignment':
            return (
                <div className={styles.assignmentContent}>
                    <h2>{block.title}</h2>
                    <div className={styles.assignmentDescription}>
                        {block.content?.body || '課題の説明がここに表示されます。'}
                    </div>

                    {!assignmentSubmitted ? (
                        <div className={styles.assignmentSubmissionArea}>
                            <h4 className={styles.submissionTitle}>課題の提出</h4>
                            {(!block.content?.formats || block.content.formats.includes('text')) && (
                                <div className={styles.submissionGroup}>
                                    <label>テキスト回答</label>
                                    <textarea
                                        className={styles.submissionTextarea}
                                        placeholder="回答を入力してください"
                                        rows={4}
                                        value={assignmentText}
                                        onChange={(e) => setAssignmentText(e.target.value)}
                                    />
                                </div>
                            )}
                            {block.content?.formats?.includes('url') && (
                                <div className={styles.submissionGroup}>
                                    <label>URL提出</label>
                                    <input
                                        type="url"
                                        className={styles.submissionInput}
                                        placeholder="https://..."
                                        value={assignmentUrl}
                                        onChange={(e) => setAssignmentUrl(e.target.value)}
                                    />
                                </div>
                            )}
                            {block.content?.formats?.includes('image') && (
                                <div className={styles.submissionGroup}>
                                    <label>画像アップロード</label>
                                    <div className={styles.fileDropZone}>
                                        <span className={styles.dropIcon}>📷</span>
                                        <span>画像をドラッグ＆ドロップ (テスト中は無効)</span>
                                    </div>
                                </div>
                            )}
                            <button
                                className={styles.submitAssignmentBtn}
                                onClick={() => {
                                    if (!assignmentText && !assignmentUrl) return alert('回答を入力してください');
                                    setAssignmentSubmitted(true);
                                }}
                            >
                                課題を提出する
                            </button>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-lg text-center">
                            <div className="text-3xl mb-2">✅</div>
                            <h3 className="font-bold text-emerald-800">提出完了</h3>
                            <p className="text-sm text-emerald-600 mt-1">課題が提出されました。</p>
                            <button
                                onClick={() => setAssignmentSubmitted(false)}
                                className="mt-4 text-xs text-emerald-600 underline"
                            >
                                再提出する (テスト)
                            </button>
                        </div>
                    )}
                </div>
            );
        default:
            return (
                <div className={styles.otherContent}>
                    <div className={styles.otherIcon}>{block.type === 'pdf' ? '📂' : block.type === 'audio' ? '🔊' : '🔗'}</div>
                    <h3>{block.title}</h3>
                    <p>{block.type.toUpperCase()} コンテンツ</p>
                    <button className={styles.downloadBtn}>
                        {block.type === 'link' ? 'リンクを開く' : 'ファイルをダウンロード'}
                    </button>
                    {block.content?.feedbackRequired && (
                        <div className={styles.feedbackNotice}>
                            <span className={styles.feedbackBadge}>必須</span>
                            このカリキュラム完了には感想の提出が必要です
                        </div>
                    )}
                </div>
            );
    }
};

export default BlockRenderer;
