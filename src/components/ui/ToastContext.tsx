"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all animate-in slide-in-from-right-full
                            ${toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-700' : ''}
                            ${toast.type === 'error' ? 'bg-white border-rose-100 text-rose-700' : ''}
                            ${toast.type === 'info' ? 'bg-white border-blue-100 text-blue-700' : ''}
                            ${toast.type === 'warning' ? 'bg-white border-amber-100 text-amber-700' : ''}
                        `}
                        style={{ minWidth: '300px' }}
                    >
                        <span className="shrink-0">
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
                        </span>
                        <p className="flex-1">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
