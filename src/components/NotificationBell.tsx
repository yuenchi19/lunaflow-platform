
"use client";

import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function NotificationBell({ userId }: { userId?: string }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!userId) return;

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('Feedback')
                .select(`
                    id,
                    blockId,
                    staffComment,
                    updatedAt,
                    Block (title, categoryId, courseId)
                `)
                .eq('userId', userId)
                .eq('status', 'approved')
                .order('updatedAt', { ascending: false })
                .limit(10);

            if (data) {
                const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
                const unread = data.filter((n: any) => !readIds.includes(n.id));
                setUnreadCount(unread.length);
                setNotifications(data);
            }
        };

        fetchNotifications();

        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'Feedback',
                filter: `userId=eq.${userId}`
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase]);

    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState && unreadCount > 0) {
            const ids = notifications.map(n => n.id);
            const currentRead = JSON.parse(localStorage.getItem('read_notifications') || '[]');
            const newRead = [...new Set([...currentRead, ...ids])];
            localStorage.setItem('read_notifications', JSON.stringify(newRead));
            setUnreadCount(0);
        }
    };

    const handleNotificationClick = (n: any) => {
        if (n.Block?.courseId && n.Block?.categoryId) {
            router.push(`/student/course/${n.Block.courseId}/learn/${n.blockId}`);
        } else {
            router.push('/student/dashboard');
        }
        setIsOpen(false);
    }

    if (!userId) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1E1F24]" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1E1F24] border border-[#2B2D31] rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-3 border-b border-[#2B2D31] bg-[#1E1F24]">
                        <h3 className="font-semibold text-sm text-gray-200">Notifications</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto bg-[#1E1F24]">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className="p-3 hover:bg-[#2B2D31] cursor-pointer border-b border-[#2B2D31] last:border-0 transition-colors"
                                >
                                    <div className="text-sm font-medium text-white mb-1">
                                        New Feedback
                                    </div>
                                    <div className="text-xs text-gray-400 line-clamp-2">
                                        {n.staffComment || "Your assignment has been reviewed."}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1">
                                        {new Date(n.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
