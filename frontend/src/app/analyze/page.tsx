'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useLumiqeStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { compressImage, storeThumbnail } from '@/lib/imageUtils';
import CameraCapture from '@/components/CameraCapture';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AppLayout from '@/components/layout/AppLayout';
import AnalyzingSpinner from '@/components/analyze/AnalyzingSpinner';
import MultiPhotoUpload from '@/components/analyze/MultiPhotoUpload';
import ScanGuide from '@/components/ScanGuide';

type Mode = 'choose' | 'camera' | 'multi';

export default function AnalyzePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const user = useLumiqeStore((s) => s.user);
    const [mode, setMode] = useState<Mode>('choose');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const previewUrlRef = useRef<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [lang, setLang] = useState('en');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem('lumiqe-lang');
        if (saved) setLang(saved);
    }, []);

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        };
    }, []);

    const changeLang = (code: string) => {
        setLang(code);
        localStorage.setItem('lumiqe-lang', code);
    };

    function buildResultsParams(data: Record<string, unknown>): URLSearchParams {
        const params = new URLSearchParams();
        params.set('season', data.season as string);
        params.set('description', (data.description as string) || '');
        params.set('hexColor', (data.hex_color as string) || '');
        params.set('undertone', (data.undertone as string) || '');
        params.set('confidence', (data.confidence as number)?.toString() || '0');
        if (data.palette) params.set('palette', (data.palette as string[]).join(','));
        if (data.avoid_colors) params.set('avoidColors', (data.avoid_colors as string[]).join(','));
        if (data.metal) params.set('metal', data.metal as string);
        if (data.tips) params.set('tips', data.tips as string);
        if (data.contrast_level) params.set('contrastLevel', data.contrast_level as string);
        return params;
    }

    const handleMultiAnalyze = async (files: File[]) => {
        setError(null);
        setIsAnalyzing(true);
        if (files[0]) storeThumbnail(files[0]);

        const formData = new FormData();
        const compressed = await Promise.all(files.map((f) => compressImage(f)));
        compressed.forEach((file) => formData.append('images', file));
        if (user?.age) formData.append('age', user.age.toString());
        if (user?.sex) formData.append('sex', user.sex);

        try {
            const res = await apiFetch('/api/analyze/multi', { method: 'POST', body: formData }, session);
            if (!res.ok) {
                let errorMsg = 'Multi-photo analysis failed. Please try again.';
                try {
                    const errData = await res.json();
                    if (errData?.detail?.detail) errorMsg = errData.detail.detail;
                    else if (typeof errData?.detail === 'string') errorMsg = errData.detail;
                } catch { /* keep generic */ }
                throw new Error(errorMsg);
            }
            const data = await res.json();
            if (data.analysis_id) {
                router.push(`/results/${data.analysis_id}`);
            } else {
                const params = buildResultsParams(data);
                params.set('multi', 'true');
                params.set('imagesAnalyzed', data.images_analyzed?.toString() || '0');
                router.push(`/results?${params.toString()}`);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            setIsAnalyzing(false);
        }
    };

    const handleFile = async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please use a valid image (JPEG, PNG, WebP).');
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('File is too large. Max 5MB.');
            return;
        }

        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const objectUrl = URL.createObjectURL(selectedFile);
        previewUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);
        storeThumbnail(selectedFile);
        setError(null);
        setIsAnalyzing(true);

        const formData = new FormData();
        formData.append('image', selectedFile);
        if (user?.age) formData.append('age', user.age.toString());
        if (user?.sex) formData.append('sex', user.sex);

        try {
            const res = await apiFetch('/api/analyze', { method: 'POST', body: formData }, session);
            if (!res.ok) {
                let errorMsg = 'Analysis failed. Please try again.';
                try {
                    const errData = await res.json();
                    if (errData?.detail?.detail) errorMsg = errData.detail.detail;
                    else if (typeof errData?.detail === 'string') errorMsg = errData.detail;
                    else if (errData?.message) errorMsg = errData.message;
                } catch { /* keep generic */ }
                throw new Error(errorMsg);
            }
            const data = await res.json();
            if (data.analysis_id) {
                router.push(`/results/${data.analysis_id}`);
            } else {
                const params = buildResultsParams(data);
                if (data.celebrities) params.set('celebrities', encodeURIComponent(JSON.stringify(data.celebrities)));
                if (data.makeup) params.set('makeup', encodeURIComponent(JSON.stringify(data.makeup)));
                router.push(`/results?${params.toString()}`);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
            setIsAnalyzing(false);
            setPreviewUrl(null);
        }
    };

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <>
            <ScanGuide />

            {/* ── Full-screen overlays (camera / multi / analyzing) ── */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
                    >
                        <AnalyzingSpinner lang={lang} previewUrl={previewUrl} />
                    </motion.div>
                )}

                {!isAnalyzing && mode === 'camera' && (
                    <motion.div
                        key="camera"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-background flex flex-col"
                    >
                        <div className="flex-1 overflow-auto p-4 pt-16">
                            <CameraCapture
                                lang={lang}
                                onCapture={(file) => { setMode('choose'); handleFile(file); }}
                                onCancel={() => setMode('choose')}
                            />
                        </div>
                    </motion.div>
                )}

                {!isAnalyzing && mode === 'multi' && (
                    <motion.div
                        key="multi"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-background flex flex-col"
                    >
                        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-primary/10 px-4 py-4 flex items-center justify-between">
                            <button
                                onClick={() => { setMode('choose'); setError(null); }}
                                className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2 text-sm font-label font-medium"
                            >
                                ← Back
                            </button>
                            <span className="font-headline font-bold text-on-surface">Multi-Photo Analysis</span>
                            <div className="w-16" />
                        </nav>
                        <div className="flex-1 overflow-auto p-4 pt-24 max-w-md mx-auto w-full">
                            <MultiPhotoUpload
                                lang={lang}
                                apiError={error}
                                onAnalyze={handleMultiAnalyze}
                                onBack={() => { setMode('choose'); setError(null); }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main bento layout ── */}
            {!isAnalyzing && mode === 'choose' && (
                <AppLayout>
                    <div className="max-w-7xl mx-auto">
                        {/* Page header */}
                        <header className="mb-10">
                            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary mb-2">
                                Skin Intelligence
                            </p>
                            <h1 className="font-display text-5xl md:text-7xl font-bold text-on-surface leading-none mb-3">
                                Color Analysis
                            </h1>
                            <p className="text-on-surface-variant text-lg max-w-xl leading-relaxed">
                                Precision skin intelligence starts here. Upload or scan for a medical-grade aesthetic breakdown.
                            </p>
                        </header>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* ── Primary Zone (8 cols) ── */}
                            <section className="lg:col-span-8 flex flex-col gap-6">
                                {/* Drop Zone */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Upload Photo"
                                    className={`relative aspect-video bg-surface-container rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-all duration-500 overflow-hidden group cursor-pointer ghost-border ${
                                        isDragging
                                            ? 'border-primary/70 bg-primary/5 scale-[1.01]'
                                            : 'border-outline-variant/40 hover:border-primary/40'
                                    }`}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                                >
                                    {/* Scanner sweep on hover */}
                                    <div className="absolute left-0 w-full h-0.5 z-10 opacity-0 group-hover:opacity-100 scanner-animate scanner-line" />

                                    {/* Upload prompt */}
                                    <div className="relative z-10 flex flex-col items-center text-center p-8">
                                        <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform ghost-border">
                                            <span className="material-symbols-outlined text-5xl text-primary">upload</span>
                                        </div>
                                        <h3 className="font-headline text-2xl font-bold mb-2 text-on-surface">
                                            Upload Photo
                                        </h3>
                                        <p className="text-on-surface-variant mb-8 max-w-sm text-sm">
                                            Tap to upload or drag and drop a high-resolution portrait.
                                        </p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            className="bg-primary-container text-on-primary-container px-10 py-4 rounded-full font-headline font-bold text-sm tracking-widest uppercase shadow-lg hover:scale-105 active:scale-95 transition-all hover:bg-primary"
                                        >
                                            Choose Image
                                        </button>
                                        <p className="text-on-surface-variant/40 text-xs mt-3 font-mono">
                                            JPEG · PNG · WebP — max 5 MB · Natural lighting recommended
                                        </p>
                                    </div>

                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        aria-label="Choose a photo to upload"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                    />

                                    {/* Error banner */}
                                    {error && (
                                        <div className="absolute bottom-6 flex items-center gap-2 text-error-container bg-error/20 border border-error/30 px-4 py-2 rounded-full text-sm z-20">
                                            <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
                                            {error}
                                        </div>
                                    )}
                                </div>

                                {/* Secondary Action Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Live Camera */}
                                    <button
                                        onClick={() => setMode('camera')}
                                        className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between group hover:bg-surface-container transition-colors cursor-pointer text-left ghost-border"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-xl text-secondary">videocam</span>
                                            </div>
                                            <div>
                                                <h4 className="font-headline font-bold text-sm text-on-surface">
                                                    Start Live Camera
                                                </h4>
                                                <p className="text-on-surface-variant text-xs mt-0.5">Instant real-time analysis</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-base text-on-surface-variant/40 group-hover:text-secondary transition-colors flex-shrink-0 ml-2">arrow_forward</span>
                                    </button>

                                    {/* Past Scans */}
                                    <Link
                                        href="/results"
                                        className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between group hover:bg-surface-container transition-colors ghost-border"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-xl text-primary">schedule</span>
                                            </div>
                                            <div>
                                                <h4 className="font-headline font-bold text-sm text-on-surface">
                                                    Past Scans
                                                </h4>
                                                <p className="text-on-surface-variant text-xs mt-0.5">View skin evolution</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-base text-on-surface-variant/40 group-hover:text-primary transition-colors flex-shrink-0 ml-2">arrow_forward</span>
                                    </Link>

                                    {/* Multi-Photo */}
                                    <button
                                        onClick={() => setMode('multi')}
                                        className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between group hover:bg-surface-container transition-colors cursor-pointer text-left ghost-border"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 bg-tertiary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-xl text-tertiary">photo_library</span>
                                            </div>
                                            <div>
                                                <h4 className="font-headline font-bold text-sm text-on-surface">
                                                    Multi-Photo
                                                </h4>
                                                <p className="text-on-surface-variant text-xs mt-0.5">2–5 selfies, higher accuracy</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-label font-bold uppercase tracking-wider text-tertiary bg-tertiary/10 border border-tertiary/20 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                                            Pro
                                        </span>
                                    </button>
                                </div>
                            </section>

                            {/* ── Sidebar (4 cols) ── */}
                            <aside className="lg:col-span-4 flex flex-col gap-6">
                                {/* Precision Protocol */}
                                <div className="bg-surface-container rounded-2xl p-6 ghost-border">
                                    <h3 className="font-headline text-base font-bold mb-5 flex items-center gap-3 text-on-surface">
                                        <span className="material-symbols-outlined text-base text-primary flex-shrink-0">lightbulb</span>
                                        Precision Protocol
                                    </h3>
                                    <ul className="space-y-4">
                                        {[
                                            { n: 1, title: 'Natural Lighting.', body: 'Face a window during daylight for the most accurate texture capture.' },
                                            { n: 2, title: 'Clean Canvas.', body: 'Ensure your skin is free of makeup, SPF, and heavy moisturizers.' },
                                            { n: 3, title: 'Steady Frame.', body: 'Hold your phone at eye level, approximately 12 inches from your face.' },
                                        ].map(({ n, title, body }) => (
                                            <li key={n} className="flex gap-4">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary">
                                                    {n}
                                                </div>
                                                <p className="text-on-surface-variant text-sm leading-relaxed">
                                                    <span className="text-on-surface font-semibold">{title}</span> {body}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* System Status */}
                                <div className="bg-surface-container-lowest rounded-2xl p-6 ghost-border">
                                    <div className="flex items-center justify-between mb-5">
                                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-bold">System Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                                            <span className="font-mono text-[10px] text-[#4ade80] font-bold uppercase">Ready</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-on-surface-variant/60">Processing Engine</span>
                                            <span className="font-mono text-on-surface">Lumiqe-V4.2</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-on-surface-variant/60">Analysis Depth</span>
                                            <span className="font-mono text-on-surface">256-bit Spectral</span>
                                        </div>
                                        <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden mt-3">
                                            <div className="bg-primary w-2/3 h-full rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* Tips — For accurate results */}
                                <div className="bg-surface-container rounded-2xl p-6 ghost-border">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-base text-secondary flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                                            For accurate results
                                        </span>
                                    </div>
                                    <ul className="space-y-2">
                                        {[
                                            { icon: '☀️', text: 'Natural lighting — no dark rooms' },
                                            { icon: '👤', text: 'Face centered, no sunglasses' },
                                            { icon: '🚫', text: 'No heavy filters or beauty mode' },
                                            { icon: '📷', text: 'Well-lit selfie or portrait works best' },
                                        ].map(({ icon, text }) => (
                                            <li key={text} className="flex items-center gap-2 text-xs text-on-surface-variant/70">
                                                <span>{icon}</span> {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Language Switcher */}
                                <div className="flex justify-end">
                                    <LanguageSwitcher currentLang={lang} onChange={changeLang} />
                                </div>
                            </aside>
                        </div>
                    </div>
                </AppLayout>
            )}
        </>
    );
}
