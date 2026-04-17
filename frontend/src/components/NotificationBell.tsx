'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

const TYPE_ICON: Record<Notification['type'], string> = {
    success: 'check_circle',
    warning: 'warning',
    price_alert: 'trending_down',
    digest: 'newspaper',
    info: 'info',
};

const TYPE_COLOR: Record<Notification['type'], string> = {
    success: 'text-primary',
    warning: 'text-secondary',
    price_alert: 'text-primary',
    digest: 'text-secondary',
    info: 'text-on-surface-variant',
};

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
            const res = await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
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

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    useEffect(() => {
        const interval = setInterval(fetchUnreadCount, 60_000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) fetchNotifications();
    }, [isOpen, fetchNotifications]);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                className="relative p-2 text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-surface-container/50"
            >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: unreadCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>
                    notifications
                </span>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-mono font-bold text-on-primary bg-primary rounded-full leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-80 max-h-[420px] bg-surface/95 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
                            <div>
                                <span className="font-label text-[10px] tracking-[0.25em] uppercase text-on-surface-variant/60 block leading-none mb-0.5">Inbox</span>
                                <h3 className="font-headline text-sm font-bold text-on-surface">Notifications</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={isLoading}
                                        className="text-[10px] font-label uppercase tracking-widest text-primary hover:text-primary/70 transition-colors disabled:opacity-50"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-on-surface-variant hover:text-on-surface transition-colors"
                                    aria-label="Close notifications"
                                >
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto max-h-[352px]">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/15 block mb-2">notifications</span>
                                    <p className="text-sm text-on-surface-variant">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                                        className={`w-full text-left px-4 py-3 border-b border-outline-variant/8 hover:bg-surface-container/30 transition-colors ${
                                            !n.is_read ? 'bg-surface-container/20' : ''
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <span
                                                className={`material-symbols-outlined text-base mt-0.5 flex-shrink-0 ${TYPE_COLOR[n.type]}`}
                                                style={{ fontVariationSettings: "'FILL' 1" }}
                                            >
                                                {TYPE_ICON[n.type]}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-headline font-semibold text-on-surface truncate">
                                                        {n.title}
                                                    </span>
                                                    {!n.is_read && (
                                                        <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2 leading-relaxed">
                                                    {n.message}
                                                </p>
                                                <p className="text-[10px] text-on-surface-variant/40 font-mono mt-1">
                                                    {timeAgo(n.created_at)}
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
