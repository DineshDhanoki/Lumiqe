'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shirt, Plus, Trash2, Palette, Edit2, X, Loader2,
    CheckCircle, AlertCircle, ChevronDown,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Skeleton } from '@/components/ui/Skeleton';

interface WardrobeItem {
    id: number;
    name: string;
    category: string;
    color_hex: string | null;
    image_url: string | null;
    brand: string | null;
    notes: string | null;
    match_score: number;
    created_at: string | null;
}

interface WardrobeStats {
    count: number;
    avg_match_score: number;
}

const CATEGORIES = [
    'tops', 'bottoms', 'dresses', 'outerwear', 'shoes',
    'accessories', 'bags', 'activewear', 'formal', 'other',
];

const CATEGORY_LABELS: Record<string, string> = {
    tops: 'Tops',
    bottoms: 'Bottoms',
    dresses: 'Dresses',
    outerwear: 'Outerwear',
    shoes: 'Shoes',
    accessories: 'Accessories',
    bags: 'Bags',
    activewear: 'Activewear',
    formal: 'Formal',
    other: 'Other',
};

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
}

function getScoreBg(score: number): string {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score >= 40) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
}

export default function WardrobePage() {
    const { status } = useSession();
    const [items, setItems] = useState<WardrobeItem[]>([]);
    const [stats, setStats] = useState<WardrobeStats>({ count: 0, avg_match_score: 0 });
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState<WardrobeItem | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);

    const fetchWardrobe = useCallback(async () => {
        try {
            const response = await fetch('/api/proxy/wardrobe');
            if (!response.ok) throw new Error('Failed to load wardrobe');
            const data = await response.json();
            setItems(data.items || []);
            setStats(data.stats || { count: 0, avg_match_score: 0 });
        } catch {
            setError('Failed to load your wardrobe. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status !== 'authenticated') return;
        fetchWardrobe();
    }, [status, fetchWardrobe]);

    async function handleDelete(itemId: number) {
        setDeletingId(itemId);
        try {
            const response = await fetch(`/api/proxy/wardrobe/${itemId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setItems((prev) => prev.filter((item) => item.id !== itemId));
                setStats((prev) => ({
                    ...prev,
                    count: Math.max(0, prev.count - 1),
                }));
            }
        } catch {
            setError('Failed to delete item. Please try again.');
        } finally {
            setDeletingId(null);
        }
    }

    function handleItemAdded(newItem: WardrobeItem) {
        setItems((prev) => [newItem, ...prev]);
        setStats((prev) => ({
            count: prev.count + 1,
            avg_match_score: Math.round(
                (prev.avg_match_score * prev.count + newItem.match_score) / (prev.count + 1)
            ),
        }));
        setShowAddForm(false);
    }

    function handleItemUpdated(updated: WardrobeItem) {
        setItems((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setEditingItem(null);
    }

    const filteredItems = filterCategory === 'all'
        ? items
        : items.filter((item) => item.category === filterCategory);

    const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-stone-950">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 pt-24 pb-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <Shirt className="w-7 h-7 text-red-500" />
                        <h1 className="text-3xl font-bold text-white">Your Wardrobe</h1>
                    </div>
                    <button
                        onClick={() => { setShowAddForm(true); setEditingItem(null); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 rounded-full text-white font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Item
                    </button>
                </div>

                {/* Stats Bar */}
                {!loading && items.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4">
                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Items</p>
                            <p className="text-2xl font-bold text-white">{stats.count}</p>
                        </div>
                        <div className={`rounded-2xl p-4 border ${getScoreBg(stats.avg_match_score)}`}>
                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Avg Match</p>
                            <p className={`text-2xl font-bold ${getScoreColor(stats.avg_match_score)}`}>
                                {stats.avg_match_score}%
                            </p>
                        </div>
                        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 col-span-2 sm:col-span-1">
                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Categories</p>
                            <p className="text-2xl font-bold text-white">{Object.keys(categoryCounts).length}</p>
                        </div>
                    </div>
                )}

                {/* Category Filter */}
                {!loading && items.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                filterCategory === 'all'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                        >
                            All ({items.length})
                        </button>
                        {CATEGORIES.filter((cat) => categoryCounts[cat]).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    filterCategory === cat
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                            >
                                {CATEGORY_LABELS[cat]} ({categoryCounts[cat]})
                            </button>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center gap-2 text-red-200 bg-red-900/60 border border-red-500/30 px-4 py-3 rounded-2xl text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto text-white/50 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Add / Edit Form Modal */}
                <AnimatePresence>
                    {(showAddForm || editingItem) && (
                        <WardrobeItemForm
                            editItem={editingItem}
                            onClose={() => { setShowAddForm(false); setEditingItem(null); }}
                            onAdded={handleItemAdded}
                            onUpdated={handleItemUpdated}
                        />
                    )}
                </AnimatePresence>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/3" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="w-8 h-8 rounded-lg" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                        <Shirt className="w-16 h-16 text-white/20" />
                        <h2 className="text-xl font-semibold text-white">
                            {items.length === 0 ? 'Your wardrobe is empty' : 'No items in this category'}
                        </h2>
                        <p className="text-white/50 max-w-sm">
                            {items.length === 0
                                ? 'Add your clothing items to see how well they match your color palette.'
                                : 'Try a different category filter.'}
                        </p>
                        {items.length === 0 && (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="mt-2 px-6 py-3 bg-red-600 rounded-full text-white font-medium hover:bg-red-500 transition-colors"
                            >
                                Add Your First Item
                            </button>
                        )}
                    </div>
                ) : (
                    /* Items Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 group hover:border-white/20 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
                                        <p className="text-xs text-white/40 mt-0.5">
                                            {CATEGORY_LABELS[item.category] || item.category}
                                            {item.brand && ` · ${item.brand}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingItem(item)}
                                            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            aria-label={`Edit ${item.name}`}
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deletingId === item.id}
                                            className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                            aria-label={`Delete ${item.name}`}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mb-3">
                                    {item.color_hex ? (
                                        <div
                                            className="w-10 h-10 rounded-xl border border-white/10 flex-shrink-0"
                                            style={{ backgroundColor: item.color_hex }}
                                            title={item.color_hex}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                                            <Palette className="w-4 h-4 text-white/20" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-white/40">Color</p>
                                        <p className="text-sm text-white font-mono">
                                            {item.color_hex || 'Not set'}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${getScoreBg(item.match_score)}`}>
                                    <span className="text-xs text-white/50">Palette Match</span>
                                    <span className={`text-sm font-bold ${getScoreColor(item.match_score)}`}>
                                        {item.match_score}%
                                    </span>
                                </div>

                                {item.notes && (
                                    <p className="text-xs text-white/30 mt-2 line-clamp-2">{item.notes}</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Compatibility Link */}
                {!loading && items.length > 0 && (
                    <div className="mt-8 text-center">
                        <Link
                            href="/analyze"
                            className="text-sm text-white/40 hover:text-red-400 transition-colors"
                        >
                            Run a color analysis to improve your match scores →
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}


// ─── Add / Edit Form ─────────────────────────────────────

interface WardrobeItemFormProps {
    editItem: WardrobeItem | null;
    onClose: () => void;
    onAdded: (item: WardrobeItem) => void;
    onUpdated: (item: WardrobeItem) => void;
}

function WardrobeItemForm({ editItem, onClose, onAdded, onUpdated }: WardrobeItemFormProps) {
    const [name, setName] = useState(editItem?.name || '');
    const [category, setCategory] = useState(editItem?.category || '');
    const [brand, setBrand] = useState(editItem?.brand || '');
    const [notes, setNotes] = useState(editItem?.notes || '');
    const [colorHex, setColorHex] = useState(editItem?.color_hex || '');
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const isEditing = editItem !== null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('Name is required.');
            return;
        }
        if (!isEditing && !category) {
            setError('Please select a category.');
            return;
        }

        setSubmitting(true);

        try {
            if (isEditing) {
                const formData = new FormData();
                if (name.trim()) formData.append('name', name.trim());
                if (category) formData.append('category', category);
                if (brand) formData.append('brand', brand);
                if (notes) formData.append('notes', notes);
                if (colorHex) formData.append('color_hex', colorHex);

                const response = await fetch(`/api/proxy/wardrobe/${editItem.id}`, {
                    method: 'PUT',
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json().catch(() => null);
                    throw new Error(data?.detail?.detail || 'Failed to update item.');
                }

                const data = await response.json();
                onUpdated(data.item);
            } else {
                const formData = new FormData();
                formData.append('name', name.trim());
                formData.append('category', category);
                if (brand) formData.append('brand', brand);
                if (notes) formData.append('notes', notes);
                if (colorHex && !file) formData.append('color_hex', colorHex);
                if (file) formData.append('file', file);

                const response = await fetch('/api/proxy/wardrobe', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const data = await response.json().catch(() => null);
                    throw new Error(data?.detail?.detail || 'Failed to add item.');
                }

                const data = await response.json();
                onAdded(data.item);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">
                        {isEditing ? 'Edit Item' : 'Add Wardrobe Item'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Navy Oxford Shirt"
                            maxLength={255}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>

                    {/* Category */}
                    <div className="relative">
                        <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
                            Category *
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-left flex items-center justify-between focus:outline-none focus:border-red-500/50 transition-colors"
                        >
                            <span className={category ? 'text-white' : 'text-white/30'}>
                                {category ? CATEGORY_LABELS[category] : 'Select category'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-white/40" />
                        </button>
                        {showCategoryDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-white/10 rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => { setCategory(cat); setShowCategoryDropdown(false); }}
                                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-white/10 transition-colors ${
                                            category === cat ? 'text-red-400 bg-red-500/5' : 'text-white/70'
                                        }`}
                                    >
                                        {CATEGORY_LABELS[cat]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
                            Brand
                        </label>
                        <input
                            type="text"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="e.g., Zara"
                            maxLength={255}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
                            Color {!isEditing && '(auto-detected if you upload a photo)'}
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={colorHex || '#000000'}
                                onChange={(e) => setColorHex(e.target.value)}
                                className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                            />
                            <input
                                type="text"
                                value={colorHex}
                                onChange={(e) => setColorHex(e.target.value)}
                                placeholder="#A0522D"
                                maxLength={7}
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Photo Upload (add mode only) */}
                    {!isEditing && (
                        <div>
                            <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
                                Photo (optional — for auto color detection)
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-red-600 file:text-white file:text-xs file:font-medium file:cursor-pointer"
                                />
                            </div>
                            {file && (
                                <p className="text-xs text-white/40 mt-1">
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                </p>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any notes about this item..."
                            maxLength={500}
                            rows={2}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-colors resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-200 bg-red-900/40 px-3 py-2 rounded-xl text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {isEditing ? 'Updating...' : 'Adding...'}
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                {isEditing ? 'Update Item' : 'Add to Wardrobe'}
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}
