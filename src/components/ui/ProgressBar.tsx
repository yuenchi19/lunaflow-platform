import React from 'react';

interface ProgressBarProps {
    value: number; // 0 to 100
    max?: number; // default 100
    color?: string; // Tailwind color class like 'bg-rose-500'
    height?: string; // height class, e.g. 'h-2'
    showLabel?: boolean;
    label?: string; // Custom label, e.g. "50%"
    className?: string; // Additional container classes
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max = 100,
    color = 'bg-rose-500',
    height = 'h-2',
    showLabel = false,
    label,
    className = ''
}) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    {label && <span className="text-xs font-bold text-slate-500">{label}</span>}
                    <span className="text-xs font-bold text-slate-700">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height}`}>
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
