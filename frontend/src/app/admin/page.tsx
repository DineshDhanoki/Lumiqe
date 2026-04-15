'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { apiFetch } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';

// ─── Types ──────────────────────────────────────────────────

type AdminTab = 'overview' | 'users' | 'catalog' | 'b2b' | 'system';

interface DashboardStats {
    users: { total: number; premium: number; verified: number; with_palette: number; recent_7d: number };
    analyses: number;
    catalog: { total_products: number; active_products: number };
    engagement: { total_wishlisted: number; total_outfits_generated: number; affiliate_clicks: number };
    funnel: { signup_to_analysis: number; analysis_to_wishlist: number; wishlist_to_premium: number };
    top_seasons: Array<{ season: string; count: number }>;
}

interface AdminUser {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    is_premium: boolean;
    free_scans_left: number;
    credits: number;
    season: string | null;
    age: number | null;
    created_at: string | null;
}

interface AdminProduct {
    id: string;
    name: string;
    brand: string;
    price: string;
    gender: string;
    vibe: string;
    season: string;
    is_active: boolean;
    color_hex: string | null;
    match_score: number;
}

interface B2BKey {
    id: number;
    name: string;
    key_hash_preview: string;
    is_active: boolean;
    total_calls: number;
    created_at: string | null;
}

interface SystemHealth {
    database: { status: string; detail?: string };
    redis: { status: string; detail?: string };
}

interface Toast { id: number; message: string; type: 'success' | 'error' }

// ─── Utility Components ─────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="bg-surface-container/50 border border-primary/10 rounded-2xl p-6 animate-pulse">
            <div className="h-4 w-20 bg-surface-container/30 rounded mb-3" />
            <div className="h-8 w-16 bg-surface-container/30 rounded" />
        </div>
    );
}

function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 px-4 py-3 animate-pulse border-b border-primary/5">
            <div className="h-4 w-8 bg-surface-container/30 rounded" />
            <div className="h-4 w-32 bg-surface-container/30 rounded" />
            <div className="h-4 w-48 bg-surface-container/30 rounded" />
            <div className="h-4 w-16 bg-surface-container/30 rounded ml-auto" />
        </div>
    );
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {toasts.map((t) => (
                <div key={t.id} className={`px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${t.type === 'success' ? 'bg-green-600/90 text-on-surface border border-green-500/30' : 'bg-red-600/90 text-on-surface border border-red-500/30'}`}>
                    {t.message}
                </div>
            ))}
        </div>
    );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
    return (
        <div className="bg-surface-container/50 border border-primary/10 rounded-2xl p-5 hover:border-primary/20 transition-colors">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-extrabold text-on-surface tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            {sub && <p className="text-on-surface-variant/50 text-xs mt-1">{sub}</p>}
        </div>
    );
}

function Badge({ active, labels = ['Active', 'Inactive'] }: { active: boolean; labels?: [string, string] }) {
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-green-500/20 text-green-400' : 'bg-surface-container/30 text-on-surface-variant/50'}`}>
            {active ? labels[0] : labels[1]}
        </span>
    );
}

function HealthBadge({ status }: { status: string }) {
    if (status === 'ok') return <span className="flex items-center gap-1.5 text-green-400 text-sm font-semibold"><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> OK</span>;
    if (status === 'unavailable') return <span className="flex items-center gap-1.5 text-yellow-400 text-sm font-semibold"><span className="material-symbols-outlined text-base">error</span> Unavailable</span>;
    return <span className="flex items-center gap-1.5 text-primary text-sm font-semibold"><span className="material-symbols-outlined text-base">cancel</span> Error</span>;
}

// ─── Main Admin Page ────────────────────────────────────────

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Overview state
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [loadingDashboard, setLoadingDashboard] = useState(true);

    // Users state
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [userOffset, setUserOffset] = useState(0);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);
    const USER_LIMIT = 50;
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState({ is_premium: false, is_admin: false, free_scans_left: 0, credits: 0 });
    const [savingUser, setSavingUser] = useState(false);
    const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    // Catalog state
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [productGender, setProductGender] = useState('');
    const [productVibe, setProductVibe] = useState('');
    const [productOffset, setProductOffset] = useState(0);
    const PRODUCT_LIMIT = 50;
    const [hasMoreProducts, setHasMoreProducts] = useState(false);
    const [togglingProduct, setTogglingProduct] = useState<string | null>(null);
    // Scrape form
    const [scrapeGender, setScrapeGender] = useState('male');
    const [scrapeVibe, setScrapeVibe] = useState('Casual');
    const [loadingScrape, setLoadingScrape] = useState(false);
    const [loadingScrapeAll, setLoadingScrapeAll] = useState(false);

    // B2B state
    const [b2bKeys, setB2bKeys] = useState<B2BKey[]>([]);
    const [loadingB2b, setLoadingB2b] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [creatingKey, setCreatingKey] = useState(false);
    const [newRawKey, setNewRawKey] = useState<string | null>(null);
    const [togglingKey, setTogglingKey] = useState<number | null>(null);

    // System state
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loadingHealth, setLoadingHealth] = useState(false);
    const [healthCheckedAt, setHealthCheckedAt] = useState<Date | null>(null);
    const [loadingDigest, setLoadingDigest] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const addToast = useCallback((message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setToasts((p) => [...p, { id, message, type }]);
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
    }, []);

    // ── Auth Guard ───────────────────────────────────────────
    useEffect(() => {
        if (status === 'loading') return;
        if (!session) { router.replace('/'); return; }
        if (!session.isAdmin) router.replace('/dashboard');
    }, [session, status, router]);

    // ── Load dashboard on mount ──────────────────────────────
    useEffect(() => {
        if (status === 'loading' || !session?.isAdmin) return;
        setLoadingDashboard(true);
        apiFetch('/api/admin/dashboard')
            .then((r) => r.ok ? r.json() : Promise.reject())
            .then((data: DashboardStats) => setDashboardStats(data))
            .catch(() => addToast('Failed to load dashboard stats', 'error'))
            .finally(() => setLoadingDashboard(false));
    }, [session, status, addToast]);

    // ── Load data when tab switches ──────────────────────────
    useEffect(() => {
        if (!session?.isAdmin) return;
        if (activeTab === 'users' && users.length === 0) fetchUsers(0, '');
        if (activeTab === 'catalog' && products.length === 0) fetchProducts(0, '', '', '');
        if (activeTab === 'b2b' && b2bKeys.length === 0) fetchB2bKeys();
        if (activeTab === 'system') fetchHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, session]);

    // ── Users ────────────────────────────────────────────────
    const fetchUsers = useCallback(async (offset: number, search: string) => {
        setLoadingUsers(true);
        try {
            const params = new URLSearchParams({ limit: String(USER_LIMIT), offset: String(offset) });
            if (search.trim()) params.set('search', search.trim());
            const res = await apiFetch(`/api/admin/users?${params}`);
            if (!res.ok) throw new Error();
            const data: AdminUser[] = await res.json();
            setUsers(offset === 0 ? data : (prev) => [...prev, ...data]);
            setHasMoreUsers(data.length === USER_LIMIT);
            setUserOffset(offset);
        } catch {
            addToast('Failed to load users', 'error');
        } finally {
            setLoadingUsers(false);
        }
    }, [addToast]);

    const handleUserSearch = (q: string) => {
        setUserSearch(q);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchUsers(0, q), 300);
    };

    const startEditUser = (user: AdminUser) => {
        setEditingUser(user);
        setEditForm({ is_premium: user.is_premium, is_admin: user.is_admin, free_scans_left: user.free_scans_left, credits: user.credits });
    };

    const saveUser = async () => {
        if (!editingUser) return;
        setSavingUser(true);
        try {
            const res = await apiFetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PATCH',
                body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error();
            addToast(`${editingUser.name} updated`, 'success');
            setEditingUser(null);
            fetchUsers(0, userSearch);
        } catch {
            addToast('Failed to update user', 'error');
        } finally {
            setSavingUser(false);
        }
    };

    const deleteUser = async () => {
        if (!deletingUser) return;
        setConfirmingDelete(true);
        try {
            const res = await apiFetch(`/api/admin/users/${deletingUser.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            addToast(`${deletingUser.name} deleted`, 'success');
            setDeletingUser(null);
            fetchUsers(0, userSearch);
        } catch {
            addToast('Failed to delete user', 'error');
        } finally {
            setConfirmingDelete(false);
        }
    };

    // ── Catalog ──────────────────────────────────────────────
    const fetchProducts = useCallback(async (offset: number, search: string, gender: string, vibe: string) => {
        setLoadingProducts(true);
        try {
            const params = new URLSearchParams({ limit: String(PRODUCT_LIMIT), offset: String(offset) });
            if (search.trim()) params.set('search', search.trim());
            if (gender) params.set('gender', gender);
            if (vibe) params.set('vibe', vibe);
            const res = await apiFetch(`/api/admin/products?${params}`);
            if (!res.ok) throw new Error();
            const data: AdminProduct[] = await res.json();
            setProducts(offset === 0 ? data : (prev) => [...prev, ...data]);
            setHasMoreProducts(data.length === PRODUCT_LIMIT);
            setProductOffset(offset);
        } catch {
            addToast('Failed to load products', 'error');
        } finally {
            setLoadingProducts(false);
        }
    }, [addToast]);

    const handleProductSearch = (q: string) => {
        setProductSearch(q);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchProducts(0, q, productGender, productVibe), 300);
    };

    const applyProductFilters = (gender: string, vibe: string) => {
        setProductGender(gender);
        setProductVibe(vibe);
        fetchProducts(0, productSearch, gender, vibe);
    };

    const toggleProduct = async (productId: string) => {
        setTogglingProduct(productId);
        try {
            const res = await apiFetch(`/api/admin/products/${productId}/toggle`, { method: 'PATCH' });
            if (!res.ok) throw new Error();
            const data: { id: string; is_active: boolean } = await res.json();
            setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, is_active: data.is_active } : p));
            addToast(`Product ${data.is_active ? 'activated' : 'deactivated'}`, 'success');
        } catch {
            addToast('Failed to toggle product', 'error');
        } finally {
            setTogglingProduct(null);
        }
    };

    const handleScrape = async () => {
        setLoadingScrape(true);
        try {
            const res = await apiFetch(`/api/admin/products/refresh?gender=${scrapeGender}&vibe=${scrapeVibe}`, { method: 'POST' });
            if (!res.ok) throw new Error();
            addToast(`Scrape started for ${scrapeGender}/${scrapeVibe}`, 'success');
        } catch {
            addToast('Failed to start scrape', 'error');
        } finally {
            setLoadingScrape(false);
        }
    };

    const handleScrapeAll = async () => {
        setLoadingScrapeAll(true);
        try {
            const res = await apiFetch('/api/admin/products/refresh-all', { method: 'POST' });
            if (!res.ok) throw new Error();
            addToast('Full catalog refresh started', 'success');
        } catch {
            addToast('Failed to start full refresh', 'error');
        } finally {
            setLoadingScrapeAll(false);
        }
    };

    // ── B2B Keys ─────────────────────────────────────────────
    const fetchB2bKeys = useCallback(async () => {
        setLoadingB2b(true);
        try {
            const res = await apiFetch('/api/b2b/keys');
            if (!res.ok) throw new Error();
            const data: B2BKey[] = await res.json();
            setB2bKeys(data);
        } catch {
            addToast('Failed to load B2B keys', 'error');
        } finally {
            setLoadingB2b(false);
        }
    }, [addToast]);

    const createB2bKey = async () => {
        if (!newKeyName.trim()) return;
        setCreatingKey(true);
        try {
            const res = await apiFetch('/api/b2b/keys', {
                method: 'POST',
                body: JSON.stringify({ name: newKeyName.trim() }),
            });
            if (!res.ok) throw new Error();
            const data: { raw_key: string } = await res.json();
            setNewRawKey(data.raw_key);
            setNewKeyName('');
            fetchB2bKeys();
        } catch {
            addToast('Failed to create API key', 'error');
        } finally {
            setCreatingKey(false);
        }
    };

    const deactivateB2bKey = async (keyId: number) => {
        setTogglingKey(keyId);
        try {
            const res = await apiFetch(`/api/b2b/keys/${keyId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            addToast('API key deactivated', 'success');
            fetchB2bKeys();
        } catch {
            addToast('Failed to deactivate key', 'error');
        } finally {
            setTogglingKey(null);
        }
    };

    // ── System Health ────────────────────────────────────────
    const fetchHealth = useCallback(async () => {
        setLoadingHealth(true);
        try {
            const res = await apiFetch('/api/admin/system-health');
            if (!res.ok) throw new Error();
            const data: SystemHealth = await res.json();
            setHealth(data);
            setHealthCheckedAt(new Date());
        } catch {
            addToast('Failed to fetch system health', 'error');
        } finally {
            setLoadingHealth(false);
        }
    }, [addToast]);

    const handleTriggerDigest = async () => {
        setLoadingDigest(true);
        try {
            const res = await apiFetch('/api/admin/send-weekly-digest', { method: 'POST' });
            if (!res.ok) throw new Error();
            addToast('Weekly digest triggered', 'success');
        } catch {
            addToast('Failed to trigger digest', 'error');
        } finally {
            setLoadingDigest(false);
        }
    };

    // ── Early returns ────────────────────────────────────────
    if (status === 'loading') return (
        <AppLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse text-on-surface-variant text-sm font-label">Loading...</div>
            </div>
        </AppLayout>
    );
    if (!session?.isAdmin) return null;

    const funnelSteps = dashboardStats ? [
        { step: 'Signup', count: dashboardStats.users.total, pct: 100 },
        { step: 'Analyzed', count: Math.round(dashboardStats.users.total * dashboardStats.funnel.signup_to_analysis / 100), pct: dashboardStats.funnel.signup_to_analysis },
        { step: 'Wishlisted', count: dashboardStats.engagement.total_wishlisted, pct: dashboardStats.funnel.analysis_to_wishlist },
        { step: 'Premium', count: dashboardStats.users.premium, pct: dashboardStats.funnel.wishlist_to_premium },
    ] : [];
    const funnelMax = funnelSteps.length > 0 ? Math.max(...funnelSteps.map((s) => s.count)) : 1;

    const TABS: { key: AdminTab; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'users', label: 'Users' },
        { key: 'catalog', label: 'Catalog' },
        { key: 'b2b', label: 'B2B Keys' },
        { key: 'system', label: 'System' },
    ];

    return (
        <AppLayout>
            {/* ── Header breadcrumb ── */}
            <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
                <div>
                    <h1 className="font-display text-3xl font-bold text-on-surface">Admin Panel</h1>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/50">
                        Super Admin · {session.user?.name?.split(' ')[0]}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-24">
                {/* ── Tab Bar ──────────────────────────────────── */}
                <div className="flex gap-1 bg-surface-container/50 border border-primary/10 rounded-2xl p-1 mb-8 overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 min-w-fit px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-primary text-on-primary-container shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════
                    TAB: OVERVIEW
                ══════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats grid */}
                        <section>
                            <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">Platform Overview</h2>
                            {loadingDashboard ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            ) : dashboardStats ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    <StatCard label="Total Users" value={dashboardStats.users.total} />
                                    <StatCard label="Premium" value={dashboardStats.users.premium} sub={`${dashboardStats.users.total > 0 ? ((dashboardStats.users.premium / dashboardStats.users.total) * 100).toFixed(1) : 0}% conversion`} />
                                    <StatCard label="New (7d)" value={dashboardStats.users.recent_7d} />
                                    <StatCard label="Analyses" value={dashboardStats.analyses} />
                                    <StatCard label="Products" value={dashboardStats.catalog.active_products} sub={`${dashboardStats.catalog.total_products} total`} />
                                    <StatCard label="Affiliate Clicks" value={dashboardStats.engagement.affiliate_clicks} />
                                </div>
                            ) : <p className="text-on-surface-variant/50 text-sm">Failed to load stats.</p>}
                        </section>

                        {/* Funnel */}
                        <section>
                            <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">Conversion Funnel</h2>
                            <div className="bg-surface-container/50 border border-primary/10 rounded-2xl p-6 space-y-4">
                                {funnelSteps.map((s) => {
                                    const w = funnelMax > 0 ? Math.max((s.count / funnelMax) * 100, 4) : 4;
                                    return (
                                        <div key={s.step} className="flex items-center gap-4">
                                            <p className="text-on-surface-variant text-sm font-medium w-20 shrink-0 text-right">{s.step}</p>
                                            <div className="flex-1">
                                                <div className="h-9 rounded-lg bg-gradient-to-r from-red-600/80 to-red-400/60 flex items-center px-3 transition-all duration-500" style={{ width: `${w}%` }}>
                                                    <span className="text-white text-xs font-bold">{s.count.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <p className="text-on-surface-variant text-xs font-mono w-12 shrink-0 text-right">{s.pct.toFixed(1)}%</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Top seasons + engagement */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section>
                                <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">Top Seasons</h2>
                                <div className="bg-surface-container/50 border border-primary/10 rounded-2xl p-6 space-y-3">
                                    {dashboardStats?.top_seasons?.map((s) => {
                                        const max = dashboardStats.top_seasons[0]?.count || 1;
                                        const w = Math.max((s.count / max) * 100, 6);
                                        return (
                                            <div key={s.season} className="flex items-center gap-3">
                                                <p className="text-on-surface-variant text-xs font-medium w-32 shrink-0 truncate">{s.season}</p>
                                                <div className="flex-1">
                                                    <div className="h-6 rounded bg-gradient-to-r from-rose-600/60 to-rose-400/40 flex items-center px-2" style={{ width: `${w}%` }}>
                                                        <span className="text-white text-xs font-bold">{s.count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">Engagement</h2>
                                <div className="bg-surface-container/50 border border-primary/10 rounded-2xl p-6 space-y-3">
                                    {dashboardStats && [
                                        { label: 'Wishlisted items', val: dashboardStats.engagement.total_wishlisted },
                                        { label: 'Outfits generated', val: dashboardStats.engagement.total_outfits_generated },
                                        { label: 'Affiliate clicks', val: dashboardStats.engagement.affiliate_clicks },
                                        { label: 'Users with palette', val: dashboardStats.users.with_palette },
                                        { label: 'Email verified', val: dashboardStats.users.verified },
                                    ].map(({ label, val }) => (
                                        <div key={label} className="flex items-center justify-between border-b border-primary/5 pb-2 last:border-0 last:pb-0">
                                            <span className="text-on-surface-variant text-sm">{label}</span>
                                            <span className="text-on-surface font-bold tabular-nums">{val.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Quick actions */}
                        <section>
                            <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">Quick Actions</h2>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={handleTriggerDigest} disabled={loadingDigest} className="flex items-center gap-2 bg-surface-container/50 border border-primary/10 rounded-xl px-5 py-3 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-all disabled:opacity-50">
                                    {loadingDigest && <span className="material-symbols-outlined text-base animate-spin">refresh</span>} Trigger Weekly Digest
                                </button>
                                <button onClick={() => { setActiveTab('catalog'); }} className="flex items-center gap-2 bg-surface-container/50 border border-primary/10 rounded-xl px-5 py-3 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-all">
                                    Manage Catalog →
                                </button>
                                <button onClick={() => setActiveTab('system')} className="flex items-center gap-2 bg-surface-container/50 border border-primary/10 rounded-xl px-5 py-3 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-all">
                                    System Health →
                                </button>
                            </div>
                        </section>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: USERS
                ══════════════════════════════════════════════ */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                            <input
                                type="text"
                                value={userSearch}
                                onChange={(e) => handleUserSearch(e.target.value)}
                                placeholder="Search by name or email…"
                                className="w-full sm:w-80 px-4 py-2.5 rounded-xl bg-surface-container/50 border border-primary/10 text-on-surface text-sm placeholder-on-surface-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <span className="text-on-surface-variant text-xs">{users.length} user{users.length !== 1 ? 's' : ''} shown</span>
                        </div>

                        <div className="bg-surface-container/50 border border-primary/10 rounded-2xl overflow-hidden">
                            {loadingUsers && users.length === 0 ? (
                                <div className="divide-y divide-white/5">
                                    {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
                                </div>
                            ) : users.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-primary/10 text-on-surface-variant text-xs uppercase tracking-wider">
                                                <th className="text-left px-4 py-3">ID</th>
                                                <th className="text-left px-4 py-3">Name</th>
                                                <th className="text-left px-4 py-3">Email</th>
                                                <th className="text-left px-4 py-3">Season</th>
                                                <th className="text-center px-4 py-3">Scans</th>
                                                <th className="text-center px-4 py-3">Credits</th>
                                                <th className="text-center px-4 py-3">Premium</th>
                                                <th className="text-center px-4 py-3">Admin</th>
                                                <th className="text-left px-4 py-3">Joined</th>
                                                <th className="text-center px-4 py-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id} className="border-b border-primary/5 hover:bg-surface-container/30 transition-colors">
                                                    <td className="px-4 py-3 text-on-surface-variant font-mono text-xs">{user.id}</td>
                                                    <td className="px-4 py-3 text-on-surface font-medium">{user.name}</td>
                                                    <td className="px-4 py-3 text-on-surface-variant">{user.email}</td>
                                                    <td className="px-4 py-3 text-on-surface-variant text-xs">{user.season || '—'}</td>
                                                    <td className="px-4 py-3 text-center text-on-surface-variant">{user.free_scans_left}</td>
                                                    <td className="px-4 py-3 text-center text-on-surface-variant">{user.credits}</td>
                                                    <td className="px-4 py-3 text-center"><Badge active={user.is_premium} /></td>
                                                    <td className="px-4 py-3 text-center"><Badge active={user.is_admin} labels={['Yes', 'No']} /></td>
                                                    <td className="px-4 py-3 text-on-surface-variant text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => startEditUser(user)} className="p-1.5 rounded-lg hover:bg-surface-container/30 text-on-surface-variant hover:text-on-surface transition-colors" title="Edit">
                                                                <span className="material-symbols-outlined text-sm">edit</span>
                                                            </button>
                                                            <button onClick={() => setDeletingUser(user)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-on-surface-variant hover:text-red-400 transition-colors" title="Delete">
                                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-on-surface-variant/50 text-sm p-6">No users found.</p>
                            )}
                        </div>

                        {hasMoreUsers && (
                            <button onClick={() => fetchUsers(userOffset + USER_LIMIT, userSearch)} disabled={loadingUsers} className="w-full py-3 rounded-xl border border-primary/10 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30 text-sm font-medium transition-all disabled:opacity-50">
                                {loadingUsers ? 'Loading…' : 'Load more'}
                            </button>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: CATALOG
                ══════════════════════════════════════════════ */}
                {activeTab === 'catalog' && (
                    <div className="space-y-6">
                        {/* Scrape controls */}
                        <section className="bg-surface-container/50 border border-primary/10 rounded-2xl p-5">
                            <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">Scrape Catalog</h2>
                            <div className="flex flex-wrap gap-3 items-end">
                                <div>
                                    <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider block mb-1">Gender</label>
                                    <select value={scrapeGender} onChange={(e) => setScrapeGender(e.target.value)} className="px-3 py-2 rounded-xl bg-surface-container/30 border border-primary/10 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider block mb-1">Vibe</label>
                                    <select value={scrapeVibe} onChange={(e) => setScrapeVibe(e.target.value)} className="px-3 py-2 rounded-xl bg-surface-container/30 border border-primary/10 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                        {['Casual', 'Gym', 'Party', 'Formal'].map((v) => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleScrape} disabled={loadingScrape} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-sm transition-colors disabled:opacity-50">
                                    {loadingScrape && <span className="material-symbols-outlined text-base animate-spin">refresh</span>} Scrape {scrapeGender}/{scrapeVibe}
                                </button>
                                <button onClick={handleScrapeAll} disabled={loadingScrapeAll} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-surface-container hover:bg-surface-container/80 border border-primary/10 text-on-surface font-semibold text-sm transition-colors disabled:opacity-50">
                                    {loadingScrapeAll && <span className="material-symbols-outlined text-base animate-spin">refresh</span>} Refresh All
                                </button>
                            </div>
                        </section>

                        {/* Product filters */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => handleProductSearch(e.target.value)}
                                placeholder="Search name or brand…"
                                className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-surface-container/50 border border-primary/10 text-on-surface text-sm placeholder-on-surface-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <select value={productGender} onChange={(e) => applyProductFilters(e.target.value, productVibe)} className="px-3 py-2.5 rounded-xl bg-surface-container/50 border border-primary/10 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                <option value="">All genders</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                            <select value={productVibe} onChange={(e) => applyProductFilters(productGender, e.target.value)} className="px-3 py-2.5 rounded-xl bg-surface-container/50 border border-primary/10 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                                <option value="">All vibes</option>
                                {['Casual', 'Gym', 'Party', 'Formal'].map((v) => <option key={v} value={v}>{v}</option>)}
                            </select>
                            <span className="text-on-surface-variant text-xs">{products.length} shown</span>
                        </div>

                        <div className="bg-surface-container/50 border border-primary/10 rounded-2xl overflow-hidden">
                            {loadingProducts && products.length === 0 ? (
                                <div className="divide-y divide-white/5">
                                    {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                                </div>
                            ) : products.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-primary/10 text-on-surface-variant text-xs uppercase tracking-wider">
                                                <th className="text-left px-4 py-3">Product</th>
                                                <th className="text-left px-4 py-3">Brand</th>
                                                <th className="text-center px-4 py-3">Gender</th>
                                                <th className="text-center px-4 py-3">Vibe</th>
                                                <th className="text-left px-4 py-3">Price</th>
                                                <th className="text-center px-4 py-3">Color</th>
                                                <th className="text-center px-4 py-3">Status</th>
                                                <th className="text-center px-4 py-3">Toggle</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((p) => (
                                                <tr key={p.id} className="border-b border-primary/5 hover:bg-surface-container/30 transition-colors">
                                                    <td className="px-4 py-3 text-on-surface font-medium max-w-[200px] truncate">{p.name}</td>
                                                    <td className="px-4 py-3 text-on-surface-variant">{p.brand}</td>
                                                    <td className="px-4 py-3 text-center text-on-surface-variant text-xs capitalize">{p.gender}</td>
                                                    <td className="px-4 py-3 text-center text-on-surface-variant text-xs">{p.vibe}</td>
                                                    <td className="px-4 py-3 text-on-surface-variant">{p.price}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {p.color_hex ? (
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <span className="w-4 h-4 rounded-full border border-primary/20 inline-block" style={{ background: p.color_hex }} />
                                                                <span className="text-on-surface-variant text-xs font-mono">{p.color_hex}</span>
                                                            </span>
                                                        ) : <span className="text-on-surface-variant/30 text-xs">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-center"><Badge active={p.is_active} /></td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => toggleProduct(p.id)}
                                                            disabled={togglingProduct === p.id}
                                                            className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${p.is_active ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                                                        >
                                                            {togglingProduct === p.id ? '…' : p.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-on-surface-variant/50 text-sm p-6">No products found.</p>
                            )}
                        </div>

                        {hasMoreProducts && (
                            <button onClick={() => fetchProducts(productOffset + PRODUCT_LIMIT, productSearch, productGender, productVibe)} disabled={loadingProducts} className="w-full py-3 rounded-xl border border-primary/10 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30 text-sm font-medium transition-all disabled:opacity-50">
                                {loadingProducts ? 'Loading…' : 'Load more'}
                            </button>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: B2B KEYS
                ══════════════════════════════════════════════ */}
                {activeTab === 'b2b' && (
                    <div className="space-y-6">
                        {/* Create key */}
                        <section className="bg-surface-container/50 border border-primary/10 rounded-2xl p-5">
                            <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">Create New API Key</h2>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && createB2bKey()}
                                    placeholder="Key name (e.g. Partner ABC)"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container/30 border border-primary/10 text-on-surface text-sm placeholder-on-surface-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button onClick={createB2bKey} disabled={creatingKey || !newKeyName.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-sm transition-colors disabled:opacity-50">
                                    {creatingKey ? <span className="material-symbols-outlined text-base animate-spin">refresh</span> : <span className="material-symbols-outlined text-base">add</span>} Create
                                </button>
                            </div>
                        </section>

                        {/* Raw key display */}
                        {newRawKey && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-yellow-400 font-bold text-sm mb-1">⚠️ Save this key — it will not be shown again</p>
                                        <code className="text-on-surface font-mono text-xs break-all">{newRawKey}</code>
                                    </div>
                                    <button onClick={() => setNewRawKey(null)} className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0">
                                    <span className="material-symbols-outlined text-xl">close</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Keys table */}
                        <div className="bg-surface-container/50 border border-primary/10 rounded-2xl overflow-hidden">
                            {loadingB2b ? (
                                <div className="divide-y divide-white/5">
                                    {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
                                </div>
                            ) : b2bKeys.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-primary/10 text-on-surface-variant text-xs uppercase tracking-wider">
                                            <th className="text-left px-4 py-3">ID</th>
                                            <th className="text-left px-4 py-3">Name</th>
                                            <th className="text-left px-4 py-3">Key Preview</th>
                                            <th className="text-center px-4 py-3">Calls</th>
                                            <th className="text-center px-4 py-3">Status</th>
                                            <th className="text-left px-4 py-3">Created</th>
                                            <th className="text-center px-4 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {b2bKeys.map((key) => (
                                            <tr key={key.id} className="border-b border-primary/5 hover:bg-surface-container/30 transition-colors">
                                                <td className="px-4 py-3 text-on-surface-variant font-mono text-xs">{key.id}</td>
                                                <td className="px-4 py-3 text-on-surface font-medium">{key.name}</td>
                                                <td className="px-4 py-3 text-on-surface-variant font-mono text-xs">{key.key_hash_preview}</td>
                                                <td className="px-4 py-3 text-center text-on-surface-variant">{key.total_calls.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center"><Badge active={key.is_active} /></td>
                                                <td className="px-4 py-3 text-on-surface-variant text-xs">{key.created_at ? new Date(key.created_at).toLocaleDateString() : '—'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {key.is_active && (
                                                        <button onClick={() => deactivateB2bKey(key.id)} disabled={togglingKey === key.id} className="text-xs font-semibold px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50">
                                                            {togglingKey === key.id ? '…' : 'Deactivate'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-on-surface-variant/50 text-sm p-6">No API keys created yet.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: SYSTEM
                ══════════════════════════════════════════════ */}
                {activeTab === 'system' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">System Health</h2>
                            <div className="flex items-center gap-3">
                                {healthCheckedAt && <span className="text-on-surface-variant/50 text-xs">Last checked {healthCheckedAt.toLocaleTimeString()}</span>}
                                <button onClick={fetchHealth} disabled={loadingHealth} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container/50 border border-primary/10 text-on-surface-variant hover:text-on-surface text-sm font-medium transition-all disabled:opacity-50">
                                    <span className={`material-symbols-outlined text-base ${loadingHealth ? 'animate-spin' : ''}`}>refresh</span> Refresh
                                </button>
                            </div>
                        </div>

                        {loadingHealth && !health ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : health ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {([
                                    { key: 'database', label: 'PostgreSQL Database', icon: '🗄️' },
                                    { key: 'redis', label: 'Redis Cache', icon: '⚡' },
                                ] as const).map(({ key, label, icon }) => (
                                    <div key={key} className="bg-surface-container/50 border border-primary/10 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{icon}</span>
                                                <p className="text-on-surface font-semibold text-sm">{label}</p>
                                            </div>
                                            <HealthBadge status={health[key].status} />
                                        </div>
                                        {health[key].detail && (
                                            <p className="text-primary text-xs font-mono mt-2 bg-primary/5 rounded-lg px-3 py-2">{health[key].detail}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <section className="bg-surface-container/50 border border-primary/10 rounded-2xl p-5">
                            <h2 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-4">Maintenance Actions</h2>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={handleTriggerDigest} disabled={loadingDigest} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container/60 border border-primary/10 text-on-surface-variant hover:text-on-surface hover:border-primary/20 text-sm font-semibold transition-all disabled:opacity-50">
                                    {loadingDigest && <span className="material-symbols-outlined text-base animate-spin">refresh</span>} Trigger Weekly Digest
                                </button>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* ── Edit User Modal ──────────────────────────────── */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
                    <div className="relative w-full max-w-md bg-surface-container border border-primary/10 rounded-2xl p-6 space-y-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-on-surface">Edit User</h3>
                                <p className="text-on-surface-variant text-sm">{editingUser.name} · {editingUser.email}</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-2 rounded-full hover:bg-surface-container/30 text-on-surface-variant hover:text-on-surface transition-colors">
                            <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {([['Free Scans', 'free_scans_left'], ['Credits', 'credits']] as const).map(([label, field]) => (
                                <div key={field}>
                                    <label className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{label}</label>
                                    <input
                                        type="number"
                                        value={editForm[field]}
                                        onChange={(e) => setEditForm({ ...editForm, [field]: parseInt(e.target.value) || 0 })}
                                        className="w-full mt-1 px-3 py-2 rounded-xl bg-surface-container/30 border border-primary/10 text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-6">
                            {([['Premium', 'is_premium'], ['Admin', 'is_admin']] as const).map(([label, field]) => (
                                <label key={field} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={editForm[field]} onChange={(e) => setEditForm({ ...editForm, [field]: e.target.checked })} className="accent-red-500" />
                                    <span className="text-sm text-on-surface-variant">{label}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button onClick={saveUser} disabled={savingUser} className="flex-1 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-sm transition-colors disabled:opacity-50">
                                {savingUser ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 rounded-xl border border-primary/10 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30 font-semibold text-sm transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete User Confirmation ─────────────────────── */}
            {deletingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeletingUser(null)} />
                    <div className="relative w-full max-w-sm bg-surface-container border border-red-500/20 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl text-red-400">delete</span>
                            </div>
                            <div>
                                <h3 className="text-on-surface font-bold text-on-surface">Delete User</h3>
                                <p className="text-on-surface-variant text-sm">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-on-surface-variant text-sm">
                            Delete <span className="text-on-surface font-semibold">{deletingUser.name}</span> ({deletingUser.email})?
                            All their analyses, wardrobe items, and data will be permanently removed.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={deleteUser} disabled={confirmingDelete} className="flex-1 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-sm transition-colors disabled:opacity-50">
                                {confirmingDelete ? 'Deleting…' : 'Delete'}
                            </button>
                            <button onClick={() => setDeletingUser(null)} className="flex-1 py-2.5 rounded-xl border border-primary/10 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30 font-semibold text-sm transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer toasts={toasts} />
        </AppLayout>
    );
}
