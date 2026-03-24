'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────

interface DashboardStats {
    total_users: number;
    premium_users: number;
    total_analyses: number;
    wishlist_items: number;
    wardrobe_items: number;
    affiliate_clicks: number;
    top_seasons: Array<{ season: string; count: number }>;
}

interface FunnelStep {
    step: string;
    count: number;
    conversion_pct: number;
}

// ─── Skeleton Components ────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 animate-pulse">
            <div className="h-4 w-20 bg-white/10 rounded mb-3" />
            <div className="h-8 w-16 bg-white/10 rounded" />
        </div>
    );
}

function SkeletonBar() {
    return (
        <div className="flex items-center gap-4 animate-pulse">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="flex-1 h-8 bg-white/10 rounded-lg" />
            <div className="h-4 w-12 bg-white/10 rounded" />
        </div>
    );
}

// ─── Toast Component ────────────────────────────────────────

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
                        toast.type === 'success'
                            ? 'bg-green-600/90 text-white border border-green-500/30'
                            : 'bg-red-600/90 text-white border border-red-500/30'
                    }`}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}

// ─── Stat Card ──────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">
                {label}
            </p>
            <p className="text-3xl font-extrabold text-white tabular-nums">
                {value.toLocaleString()}
            </p>
        </div>
    );
}

// ─── Funnel Bar ─────────────────────────────────────────────

function FunnelBar({
    step,
    count,
    conversionPct,
    maxCount,
}: {
    step: string;
    count: number;
    conversionPct: number;
    maxCount: number;
}) {
    const widthPct = maxCount > 0 ? Math.max((count / maxCount) * 100, 4) : 4;

    return (
        <div className="flex items-center gap-4">
            <p className="text-white/60 text-sm font-medium w-24 shrink-0 text-right">
                {step}
            </p>
            <div className="flex-1 relative">
                <div
                    className="h-9 rounded-lg bg-gradient-to-r from-red-600/80 to-red-400/60 flex items-center px-3 transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                >
                    <span className="text-white text-xs font-bold whitespace-nowrap">
                        {count.toLocaleString()}
                    </span>
                </div>
            </div>
            <p className="text-white/40 text-xs font-mono w-14 shrink-0 text-right">
                {conversionPct.toFixed(1)}%
            </p>
        </div>
    );
}

// ─── Action Button ──────────────────────────────────────────

function ActionButton({
    label,
    onClick,
    loading,
}: {
    label: string;
    onClick: () => void;
    loading: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-zinc-900/60 border border-white/10 rounded-xl px-5 py-3 text-sm font-semibold text-white/80 hover:text-white hover:border-white/20 hover:bg-zinc-800/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading && (
                <svg
                    className="animate-spin h-4 w-4 text-white/60"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            )}
            {label}
        </button>
    );
}

// ─── Top Seasons List ───────────────────────────────────────

function TopSeasonsList({
    seasons,
}: {
    seasons: Array<{ season: string; count: number }>;
}) {
    const maxCount = seasons.length > 0 ? seasons[0].count : 1;

    return (
        <div className="space-y-3">
            {seasons.slice(0, 5).map((item) => {
                const widthPct =
                    maxCount > 0
                        ? Math.max((item.count / maxCount) * 100, 6)
                        : 6;
                return (
                    <div key={item.season} className="flex items-center gap-4">
                        <p className="text-white/60 text-sm font-medium w-36 shrink-0 truncate">
                            {item.season}
                        </p>
                        <div className="flex-1 relative">
                            <div
                                className="h-7 rounded-md bg-gradient-to-r from-rose-600/60 to-rose-400/40 flex items-center px-3 transition-all duration-500"
                                style={{ width: `${widthPct}%` }}
                            >
                                <span className="text-white text-xs font-bold whitespace-nowrap">
                                    {item.count.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Admin Page ────────────────────────────────────────

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [funnel, setFunnel] = useState<FunnelStep[] | null>(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);
    const [loadingFunnel, setLoadingFunnel] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const [loadingDigest, setLoadingDigest] = useState(false);
    const [loadingRefreshCasual, setLoadingRefreshCasual] = useState(false);
    const [loadingRefreshAll, setLoadingRefreshAll] = useState(false);

    // ── Toast Helper ────────────────────────────────────────
    const addToast = useCallback(
        (message: string, type: 'success' | 'error') => {
            const id = Date.now();
            setToasts((prev) => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 4000);
        },
        []
    );

    // ── Auth Guard ──────────────────────────────────────────
    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.replace('/');
            return;
        }
        if (!session.isAdmin) {
            router.replace('/dashboard');
        }
    }, [session, status, router]);

    // ── Fetch Dashboard Stats ───────────────────────────────
    useEffect(() => {
        if (status === 'loading' || !session?.isAdmin) return;

        setLoadingDashboard(true);
        apiFetch('/api/admin/dashboard')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch dashboard');
                return res.json();
            })
            .then((data: DashboardStats) => {
                setDashboardStats(data);
            })
            .catch(() => {
                addToast('Failed to load dashboard stats', 'error');
            })
            .finally(() => {
                setLoadingDashboard(false);
            });
    }, [session, status, addToast]);

    // ── Fetch Funnel ────────────────────────────────────────
    useEffect(() => {
        if (status === 'loading' || !session?.isAdmin) return;

        setLoadingFunnel(true);
        apiFetch('/api/admin/analytics/funnel')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch funnel');
                return res.json();
            })
            .then((data: FunnelStep[]) => {
                setFunnel(data);
            })
            .catch(() => {
                addToast('Failed to load funnel data', 'error');
            })
            .finally(() => {
                setLoadingFunnel(false);
            });
    }, [session, status, addToast]);

    // ── Action Handlers ─────────────────────────────────────
    async function handleTriggerDigest() {
        setLoadingDigest(true);
        try {
            const res = await apiFetch('/api/admin/send-weekly-digest', {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Request failed');
            addToast('Weekly digest triggered successfully', 'success');
        } catch {
            addToast('Failed to trigger weekly digest', 'error');
        } finally {
            setLoadingDigest(false);
        }
    }

    async function handleRefreshCasualMale() {
        setLoadingRefreshCasual(true);
        try {
            const res = await apiFetch(
                '/api/admin/products/refresh?gender=male&vibe=Casual',
                { method: 'POST' }
            );
            if (!res.ok) throw new Error('Request failed');
            addToast('Casual/Male catalog refreshed', 'success');
        } catch {
            addToast('Failed to refresh Casual/Male catalog', 'error');
        } finally {
            setLoadingRefreshCasual(false);
        }
    }

    async function handleRefreshAll() {
        setLoadingRefreshAll(true);
        try {
            const res = await apiFetch('/api/admin/products/refresh-all', {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Request failed');
            addToast('All products refreshed', 'success');
        } catch {
            addToast('Failed to refresh all products', 'error');
        } finally {
            setLoadingRefreshAll(false);
        }
    }

    // ── Loading / Unauthorized States ───────────────────────
    if (status === 'loading') {
        return (
            <main className="min-h-screen bg-transparent text-white font-sans flex items-center justify-center">
                <div className="animate-pulse text-white/40 text-sm">
                    Loading...
                </div>
            </main>
        );
    }

    if (!session?.isAdmin) {
        return null;
    }

    // ── Derived Values ──────────────────────────────────────
    const funnelMaxCount =
        funnel && funnel.length > 0
            ? Math.max(...funnel.map((s) => s.count))
            : 1;

    const userName = session.user?.name || 'Admin';

    return (
        <main className="min-h-screen bg-transparent text-white font-sans pb-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold tracking-widest text-white">
                        LUMIQE
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="text-red-400 text-sm font-bold tracking-wider uppercase">
                        Admin
                    </span>
                </div>
                <p className="text-white/50 text-sm">
                    Welcome, <span className="text-white font-medium">{userName}</span>
                </p>
            </header>

            <div className="max-w-6xl mx-auto px-4 pt-28 space-y-10">
                {/* Page Title */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                        Lumiqe Admin
                    </h1>
                    <p className="text-white/40 text-sm mt-1">
                        Platform overview and management tools
                    </p>
                </div>

                {/* ── Section 1: Overview Stats ──────────────── */}
                <section>
                    <h2 className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">
                        Overview
                    </h2>
                    {loadingDashboard ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : dashboardStats ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <StatCard label="Total Users" value={dashboardStats.total_users} />
                            <StatCard label="Premium Users" value={dashboardStats.premium_users} />
                            <StatCard label="Total Analyses" value={dashboardStats.total_analyses} />
                            <StatCard label="Wishlist Items" value={dashboardStats.wishlist_items} />
                            <StatCard label="Wardrobe Items" value={dashboardStats.wardrobe_items} />
                            <StatCard label="Affiliate Clicks" value={dashboardStats.affiliate_clicks} />
                        </div>
                    ) : (
                        <p className="text-white/30 text-sm">
                            Failed to load stats.
                        </p>
                    )}
                </section>

                {/* ── Section 2: Funnel ──────────────────────── */}
                <section>
                    <h2 className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">
                        Conversion Funnel
                    </h2>
                    <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6">
                        {loadingFunnel ? (
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <SkeletonBar key={i} />
                                ))}
                            </div>
                        ) : funnel && funnel.length > 0 ? (
                            <div className="space-y-4">
                                {funnel.map((step) => (
                                    <FunnelBar
                                        key={step.step}
                                        step={step.step}
                                        count={step.count}
                                        conversionPct={step.conversion_pct}
                                        maxCount={funnelMaxCount}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/30 text-sm">
                                No funnel data available.
                            </p>
                        )}
                    </div>
                </section>

                {/* ── Section 3: Quick Actions ───────────────── */}
                <section>
                    <h2 className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">
                        Quick Actions
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <ActionButton
                            label="Trigger Weekly Digest"
                            onClick={handleTriggerDigest}
                            loading={loadingDigest}
                        />
                        <ActionButton
                            label="Refresh Catalog (Casual/Male)"
                            onClick={handleRefreshCasualMale}
                            loading={loadingRefreshCasual}
                        />
                        <ActionButton
                            label="Refresh All Products"
                            onClick={handleRefreshAll}
                            loading={loadingRefreshAll}
                        />
                    </div>
                </section>

                {/* ── Section 4: Top Seasons ─────────────────── */}
                <section>
                    <h2 className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">
                        Top Seasons
                    </h2>
                    <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6">
                        {loadingDashboard ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <SkeletonBar key={i} />
                                ))}
                            </div>
                        ) : dashboardStats?.top_seasons &&
                          dashboardStats.top_seasons.length > 0 ? (
                            <TopSeasonsList seasons={dashboardStats.top_seasons} />
                        ) : (
                            <p className="text-white/30 text-sm">
                                No season data available.
                            </p>
                        )}
                    </div>
                </section>
            </div>

            <ToastContainer toasts={toasts} />
        </main>
    );
}
