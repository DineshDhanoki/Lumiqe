'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, TrendingDown, Newspaper, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { timeAgo } from '@/lib/timeAgo';

interface Notification {
    id: string;
    user_id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'price_alert' | 'digest';
    is_read: boolean;
    created_at: string;
}

interface NotificationsResponse {
    notifications: Notification[];
    unread_count: number;
}

function getTypeIcon(type: Notification['type']) {
    switch (type) {
        case 'success':
            return <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />;
        case 'warning':
            return <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />;
        case 'price_alert':
            return <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />;
        case 'digest':
            return <Newspaper className="w-4 h-4 text-blue-400 shrink-0" />;
        case 'info':
        default:
            return <Info className="w-4 h-4 text-white/60 shrink-0" />;
    }
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await apiFetch('/api/notifications');
            if (res.ok) {
                const data: NotificationsResponse = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            }
        } catch {
            // Silently fail — notifications are non-critical
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await apiFetch('/api/notifications/unread-count');
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unread_count);
            }
        } catch {
            // Silently fail
        }
    }, []);

    const markAllAsRead = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/api/notifications/read-all', { method: 'POST' });
            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch {
            // Silently fail
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const res = await apiFetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
            });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch {
            // Silently fail
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Poll every 60 seconds for unread count
    useEffect(() => {
        const interval = setInterval(fetchUnreadCount, 60_000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Refetch when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-80 max-h-[420px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                            <h3 className="text-sm font-semibold text-white">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={isLoading}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-white/40 hover:text-white/70 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto max-h-[350px]">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 px-4">
                                    <Bell className="w-8 h-8 text-white/20 mb-2" />
                                    <p className="text-sm text-white/40">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => {
                                            if (!notification.is_read) {
                                                markAsRead(notification.id);
                                            }
                                        }}
                                        className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                                            !notification.is_read ? 'bg-white/[0.03]' : ''
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-0.5">
                                                {getTypeIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-white truncate">
                                                        {notification.title}
                                                    </span>
                                                    {!notification.is_read && (
                                                        <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-white/30 mt-1">
                                                    {timeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
