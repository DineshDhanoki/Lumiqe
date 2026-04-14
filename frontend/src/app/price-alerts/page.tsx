'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Trash2, ExternalLink, TrendingDown,
    AlertCircle, X, Loader2, ShoppingBag,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Skeleton } from '@/components/ui/Skeleton';
import AppLayout from '@/components/layout/AppLayout';

interface PriceAlert {
    id: number;
    product_id: string;
    product_name: string;
    product_url: string;
    original_price_cents: number;
    target_drop_percent: number;
    is_triggered: boolean;
    created_at: string | null;
}

function formatCents(cents: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

function formatDate(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function PriceAlertsPage() {
    const { status } = useSession();
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchAlerts = useCallback(async () => {
        try {
            const response = await fetch('/api/proxy/price-alerts');
            if (!response.ok) throw new Error('Failed to load price alerts');
            const data = await response.json();
            setAlerts(data);
        } catch {
            setError('Failed to load your price alerts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status !== 'authenticated') return;
        fetchAlerts();
    }, [status, fetchAlerts]);

    async function handleDelete(alertId: number) {
        setDeletingId(alertId);
        try {
            const response = await fetch(`/api/proxy/price-alerts/${alertId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setAlerts((prev) => prev.filter((a) => a.id !== alertId));
            }
        } catch {
            setError('Failed to delete alert. Please try again.');
        } finally {
            setDeletingId(null);
        }
    }

    const activeAlerts = alerts.filter((a) => !a.is_triggered);
    const triggeredAlerts = alerts.filter((a) => a.is_triggered);

    return (
        <AppLayout>
            <main className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-primary text-3xl">notifications_active</span>
                    <h1 className="font-display text-3xl font-bold text-on-surface">Price Alerts</h1>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center gap-2 text-primary bg-primary/5 border border-primary/20 px-4 py-3 rounded-2xl text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto text-on-surface-variant hover:text-on-surface">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-surface-container/50 border border-primary/10 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : alerts.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                        <TrendingDown className="w-16 h-16 text-on-surface-variant/30" />
                        <h2 className="text-xl font-semibold text-on-surface">No price alerts yet</h2>
                        <p className="text-on-surface-variant max-w-sm">
                            When you find products you love, set a price alert and we&apos;ll notify you when the price drops.
                        </p>
                        <Link
                            href="/shopping-agent"
                            className="mt-2 px-6 py-3 bg-primary-container rounded-full text-on-primary-container font-medium hover:bg-primary transition-colors"
                        >
                            Browse Shopping Agent
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Triggered Alerts */}
                        {triggeredAlerts.length > 0 && (
                            <section>
                                <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4" />
                                    Price Dropped ({triggeredAlerts.length})
                                </h2>
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {triggeredAlerts.map((alert) => (
                                            <PriceAlertCard
                                                key={alert.id}
                                                alert={alert}
                                                isDeleting={deletingId === alert.id}
                                                onDelete={() => handleDelete(alert.id)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>
                        )}

                        {/* Active Alerts */}
                        {activeAlerts.length > 0 && (
                            <section>
                                <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    Watching ({activeAlerts.length})
                                </h2>
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {activeAlerts.map((alert) => (
                                            <PriceAlertCard
                                                key={alert.id}
                                                alert={alert}
                                                isDeleting={deletingId === alert.id}
                                                onDelete={() => handleDelete(alert.id)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>
        </AppLayout>
    );
}


interface PriceAlertCardProps {
    alert: PriceAlert;
    isDeleting: boolean;
    onDelete: () => void;
}

function PriceAlertCard({ alert, isDeleting, onDelete }: PriceAlertCardProps) {
    const targetPrice = Math.round(
        alert.original_price_cents * (1 - alert.target_drop_percent / 100)
    );

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`border rounded-2xl p-5 transition-colors ${
                alert.is_triggered
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-surface-container/50 border-primary/10 hover:border-primary/20'
            }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {alert.is_triggered && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                                Dropped
                            </span>
                        )}
                        <h3 className="text-sm font-semibold text-on-surface truncate">
                            {alert.product_name}
                        </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        <div>
                            <span className="text-xs text-on-surface-variant">Original: </span>
                            <span className="text-sm text-on-surface-variant">{formatCents(alert.original_price_cents)}</span>
                        </div>
                        <div>
                            <span className="text-xs text-on-surface-variant">Alert at: </span>
                            <span className="text-sm font-semibold text-primary">
                                {formatCents(targetPrice)} (-{alert.target_drop_percent}%)
                            </span>
                        </div>
                    </div>

                    {alert.created_at && (
                        <p className="text-xs text-on-surface-variant/30 mt-2">
                            Set on {formatDate(alert.created_at)}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                        href={alert.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30 rounded-lg transition-colors"
                        aria-label={`View ${alert.product_name}`}
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="p-2 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        aria-label={`Delete alert for ${alert.product_name}`}
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
