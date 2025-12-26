"use client";

import { useState } from 'react';
import { Quiz } from '@/types';
import styles from './QuizComponent.module.css';

interface QuizComponentProps {
    quiz: Quiz;
    onComplete: (score: number) => void;
}

export default function QuizComponent({ quiz, onComplete }: QuizComponentProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleOptionChange = (questionId: string, optionId: string) => {
        if (submitted) return;
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmit = () => {
        let correctCount = 0;
        quiz.questions.forEach(q => {
            if (answers[q.id] === q.correctOptionId) {
                correctCount++;
            }
        });

        const calculatedScore = Math.round((correctCount / quiz.questions.length) * 100);
        setScore(calculatedScore);
        setSubmitted(true);
        onComplete(calculatedScore);
    };

    const allAnswered = quiz.questions.every(q => answers[q.id]);
    const passed = score >= (quiz.passingScore || 70);

    return (
        <div className={styles.quizContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>レッスンクイズ</h2>
                <p>合格ライン: {quiz.passingScore}%</p>
            </div>

            <div className={styles.questionList}>
                {quiz.questions.map((q) => (
                    <div key={q.id} className={styles.questionItem}>
                        <p className={styles.questionText}>{q.text}</p>
                        <div className={styles.optionsList}>
                            {q.options.map((option: any) => {
                                const isSelected = answers[q.id] === option.id;
                                const isCorrect = q.correctOptionId === option.id;
                                // Highlight logic after submission
                                let itemStyle = {};
                                if (submitted) {
                                    if (isCorrect) itemStyle = { backgroundColor: 'hsl(145, 60%, 90%)', borderColor: 'hsl(145, 40%, 60%)' };
                                    else if (isSelected && !isCorrect) itemStyle = { backgroundColor: 'hsl(0, 60%, 90%)', borderColor: 'hsl(0, 40%, 60%)' };
                                }

                                return (
                                    <label
                                        key={option.id}
                                        className={styles.optionLabel}
                                        style={itemStyle}
                                    >
                                        <input
                                            type="radio"
                                            name={q.id}
                                            value={option.id}
                                            checked={isSelected}
                                            onChange={() => handleOptionChange(q.id, option.id)}
                                            className={styles.optionInput}
                                            disabled={submitted}
                                        />
                                        <span>{option.text}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {!submitted && (
                <button
                    className={styles.submitButton}
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                >
                    回答を送信
                </button>
            )}

            {submitted && (
                <div className={`${styles.resultContainer} ${passed ? styles.success : styles.failure}`}>
                    <h3>{passed ? "おめでとうございます！合格です！" : "もう少し頑張りましょう"}</h3>
                    <p>あなたのスコア: {score}%</p>
                </div>
            )}
        </div>
    );
}
