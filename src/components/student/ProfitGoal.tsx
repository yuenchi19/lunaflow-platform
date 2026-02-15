"use client";

import { useState, useEffect } from "react";
import { Target, Edit2, Check } from "lucide-react";

export default function ProfitGoal() {
    const [goal, setGoal] = useState<number>(0);
    const [currentProfit, setCurrentProfit] = useState<number>(0);
    const [isEditing, setIsEditing] = useState(false);
    const [tempGoal, setTempGoal] = useState("");

    useEffect(() => {
        fetch('/api/student/goals')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setGoal(data.goal || 0);
                    setCurrentProfit(data.currentProfit || 0);
                    setTempGoal(String(data.goal || 0));
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleSave = async () => {
        const newGoal = parseInt(tempGoal.replace(/[^0-9]/g, ''), 10);
        if (isNaN(newGoal)) return;

        try {
            const res = await fetch('/api/student/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal: newGoal })
            });
            if (res.ok) {
                setGoal(newGoal);
                setIsEditing(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const progress = goal > 0 ? Math.min(100, Math.round((currentProfit / goal) * 100)) : 0;

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-700">今月の目標</h3>
                </div>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-600">
                        <Edit2 className="w-4 h-4" />
                    </button>
                ) : (
                    <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-600">
                        <Check className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-sm text-slate-500">現在</span>
                        <div className="text-lg font-bold text-slate-800">¥{currentProfit.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-slate-500">目標</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={tempGoal}
                                onChange={(e) => setTempGoal(e.target.value)}
                                className="block w-24 text-right border-b border-indigo-300 focus:outline-none font-bold text-lg"
                                autoFocus
                            />
                        ) : (
                            <div className="text-lg font-bold text-slate-800">¥{goal.toLocaleString()}</div>
                        )}
                    </div>
                </div>

                <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="text-right text-xs text-slate-500 font-bold">
                    達成率 {progress}%
                </div>
            </div>
        </div>
    );
}
