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
                        <header className="mb-16">
                            <h1 className="font-display italic text-6xl md:text-8xl text-on-surface leading-none mb-6">
                                Analysis
                            </h1>
                            <p className="max-w-2xl text-on-surface-variant font-headline font-light text-lg md:text-xl leading-relaxed">
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
                                    className={`relative aspect-video bg-surface-container rounded-[24px] flex flex-col items-center justify-center border-2 border-dashed transition-all duration-500 overflow-hidden group cursor-pointer ${
                                        isDragging
                                            ? 'border-primary/70 bg-primary/5 scale-[1.01]'
                                            : 'border-primary/20 hover:border-primary/50'
                                    }`}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                                >
                                    {/* Background gradient */}
                                    <div className="absolute inset-0 opacity-50 group-hover:opacity-30 transition-opacity" style={{ background: 'radial-gradient(circle at top right, #18181F, #09090B)' }} />

                                    {/* Scanner sweep on hover */}
                                    <div className="absolute left-0 w-full h-0.5 z-10 opacity-0 group-hover:opacity-100 scanner-animate scanner-line" />

                                    {/* Upload prompt */}
                                    <div className="relative z-10 flex flex-col items-center animate-pulse">
                                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 ghost-border">
                                            <span className="material-symbols-outlined text-primary text-4xl">camera</span>
                                        </div>
                                        <p className="font-headline text-primary font-bold tracking-widest uppercase text-sm">Drop scan or click to upload</p>
                                        <p className="font-label text-on-surface-variant/40 text-xs mt-2">JPG, PNG or WebP up to 5MB</p>
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Live Camera */}
                                    <button
                                        onClick={() => setMode('camera')}
                                        className="bg-surface-container-high rounded-[20px] p-6 hover:bg-surface-container-highest transition-all group cursor-pointer text-left relative overflow-hidden"
                                    >
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-error/5 rounded-full blur-2xl group-hover:bg-error/10 transition-all" />
                                        <span className="material-symbols-outlined text-error text-3xl mb-4 block">videocam</span>
                                        <h4 className="font-headline text-on-surface font-bold text-base mb-1">Start Live Camera</h4>
                                        <p className="text-on-surface-variant text-xs font-label leading-tight">Instant AI analysis via your HD webcam.</p>
                                    </button>

                                    {/* Past Scans */}
                                    <Link
                                        href="/results"
                                        className="bg-surface-container-high rounded-[20px] p-6 hover:bg-surface-container-highest transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
                                        <span className="material-symbols-outlined text-primary text-3xl mb-4 block">schedule</span>
                                        <h4 className="font-headline text-on-surface font-bold text-base mb-1">Past Scans</h4>
                                        <p className="text-on-surface-variant text-xs font-label leading-tight">Review your journey and progress metrics.</p>
                                    </Link>

                                    {/* Multi-Photo */}
                                    <button
                                        onClick={() => setMode('multi')}
                                        className="bg-surface-container-high rounded-[20px] p-6 hover:bg-surface-container-highest transition-all group cursor-pointer text-left relative overflow-hidden"
                                    >
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-all" />
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="material-symbols-outlined text-secondary text-3xl">collections</span>
                                            <span className="bg-secondary/20 text-secondary text-[10px] font-mono px-2 py-0.5 rounded-full tracking-tighter">PRO</span>
                                        </div>
                                        <h4 className="font-headline text-on-surface font-bold text-base mb-1">Multi-Photo</h4>
                                        <p className="text-on-surface-variant text-xs font-label leading-tight">Upload 360° angles for complete mapping.</p>
                                    </button>
                                </div>
                            </section>

                            {/* ── Sidebar (4 cols) ── */}
                            <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-32">
                                {/* System Status */}
                                <div className="bg-surface-container rounded-[20px] p-8 ghost-border">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="font-headline text-xs tracking-widest uppercase text-on-surface-variant/50">System Status</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                                            <span className="font-mono text-[10px] text-[#4ade80] font-bold uppercase">Ready</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-label text-on-surface-variant/60">Engine Intensity</span>
                                            <span className="text-xs font-mono text-primary">v4.2.0-LUM</span>
                                        </div>
                                        <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                                            <div className="w-[88%] h-full bg-primary/60 rounded-full" />
                                        </div>
                                        <p className="text-[10px] font-mono text-on-surface-variant/60 leading-relaxed uppercase">
                                            Neural network synced with biometric data clusters. Awaiting input.
                                        </p>
                                    </div>
                                </div>

                                {/* Precision Protocol */}
                                <div className="bg-surface-container-low rounded-[20px] overflow-hidden">
                                    <div className="p-8">
                                        <h4 className="font-headline text-xs tracking-widest uppercase text-primary mb-8">Precision Protocol</h4>
                                        <ul className="space-y-8">
                                            {[
                                                { n: '01', title: 'Natural Lighting', body: 'Avoid harsh shadows. Indirect sunlight provides the most accurate skin-texture mapping.' },
                                                { n: '02', title: 'Clean Canvas', body: 'Ensure face is free of products or accessories for a deep-pore intelligence scan.' },
                                                { n: '03', title: 'Steady Frame', body: 'Use a tripod or steady surface. Motion blur reduces analysis confidence scores.' },
                                            ].map(({ n, title, body }) => (
                                                <li key={n} className="flex gap-4">
                                                    <span className="font-mono text-primary/40 text-sm flex-shrink-0">{n}</span>
                                                    <div>
                                                        <h5 className="text-sm font-bold font-headline text-on-surface mb-1">{title}</h5>
                                                        <p className="text-xs text-on-surface-variant font-label leading-relaxed">{body}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
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
