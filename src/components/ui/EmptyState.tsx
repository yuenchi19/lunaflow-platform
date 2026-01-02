import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    action?: ReactNode;
    className?: string; // Container class
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon: Icon,
    action,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 ${className}`}>
            {Icon && (
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-slate-400" />
                </div>
            )}
            <h3 className="text-lg font-bold text-slate-700 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                {description}
            </p>
            {action && (
                <div>{action}</div>
            )}
        </div>
    );
};
