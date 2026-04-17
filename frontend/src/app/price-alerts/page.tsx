'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
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
                <header className="mb-12">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase block mb-3">Market Intelligence</span>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="font-display text-5xl md:text-7xl text-on-surface tracking-tighter leading-none mb-3">Price Alerts</h1>
                            <p className="text-on-surface-variant max-w-md text-sm leading-relaxed">Automated monitoring for your curated wishlists. Real-time insights into valuation shifts.</p>
                        </div>
                    </div>
                </header>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center gap-2 text-primary bg-primary/5 border border-primary/20 px-4 py-3 rounded-2xl text-sm">
                        <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto text-on-surface-variant hover:text-on-surface">
                            <span className="material-symbols-outlined text-base">close</span>
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
                        <span className="material-symbols-outlined text-7xl text-on-surface-variant/30">trending_down</span>
                        <h2 className="text-xl font-semibold text-on-surface">No price alerts yet</h2>
                        <p className="text-on-surface-variant max-w-sm">
                            When you find products you love, set a price alert and we&apos;ll notify you when the price drops.
                        </p>
                        <Link
                            href="/shopping-agent"
                            className="mt-2 px-6 py-3 bg-primary-container rounded-[10px] text-on-primary font-headline font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                            Browse Shopping Agent
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Triggered Alerts */}
                        {triggeredAlerts.length > 0 && (
                            <section>
                                <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">trending_down</span>
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
                                    <span className="material-symbols-outlined text-base">notifications</span>
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
            className="flex flex-col md:flex-row items-center gap-8 group rounded-2xl p-6 transition-all duration-500 hover:bg-surface-container-high/60"
            style={{ background: 'rgba(32,31,34,0.4)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(196,151,62,0.2)' }}
        >
            {/* Product icon placeholder */}
            <div className="w-16 h-16 shrink-0 rounded-xl bg-surface-container flex items-center justify-center"
                style={{ border: '0.5px solid rgba(196,151,62,0.15)' }}>
                <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">shopping_bag</span>
            </div>

            {/* Product info */}
            <div className="flex-1 space-y-1 min-w-0">
                <h3 className="font-headline font-semibold text-lg text-on-surface truncate">
                    {alert.product_name}
                </h3>
                <div className="flex items-center gap-4 text-xs font-mono text-on-surface-variant">
                    <span>Original: {formatCents(alert.original_price_cents)}</span>
                    {alert.created_at && (
                        <>
                            <span className="text-primary/40">•</span>
                            <span>Set {formatDate(alert.created_at)}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Target price */}
            <div className="flex flex-col items-center md:items-end gap-1 px-8 border-x border-primary/10">
                <span className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">Target Price</span>
                <div className="font-mono text-2xl text-primary font-medium tracking-tighter">
                    {formatCents(targetPrice)}
                </div>
                <span className="font-mono text-[10px] text-on-surface-variant">-{alert.target_drop_percent}%</span>
            </div>

            {/* Status + actions */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                    alert.is_triggered
                        ? 'bg-tertiary/10 text-tertiary border border-tertiary/20'
                        : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                    {alert.is_triggered ? 'Triggered' : 'Active'}
                </span>
                <div className="flex items-center gap-2">
                    <a
                        href={alert.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                        aria-label={`View ${alert.product_name}`}
                    >
                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                    </a>
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="p-2 text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
                        aria-label={`Delete alert for ${alert.product_name}`}
                    >
                        {isDeleting ? (
                            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-lg">delete</span>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
