"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationInbox() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/student/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id?: string) => {
        try {
            await fetch('/api/student/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(id ? { id } : { readAll: true })
            });
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
                        <div className="p-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-sm text-slate-700">お知らせ</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); markAsRead(); }}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    すべて既読にする
                                </button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    お知らせはありません
                                </div>
                            ) : (
                                <div>
                                    {notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-indigo-50/30' : ''}`}
                                            onClick={() => !n.isRead && markAsRead(n.id)}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-indigo-500' : 'bg-transparent'}`}></div>
                                                <div>
                                                    <p className={`text-sm ${!n.isRead ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                        {n.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-2">
                                                        {new Date(n.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
