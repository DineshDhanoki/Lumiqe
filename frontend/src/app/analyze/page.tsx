'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Loader2, Upload, Video, Clock, Lightbulb, ArrowRight,
    UserCircle, AlertCircle, Images, Sparkles,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useLumiqeStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { compressImage, storeThumbnail } from '@/lib/imageUtils';
import CameraCapture from '@/components/CameraCapture';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AppMenu from '@/components/AppMenu';
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
            <div className="min-h-screen bg-[#131313] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#131313] text-[#e2e2e2]" style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
            <ScanGuide />

            {/* ── Overlays for camera / multi / analyzing ── */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        key="analyzing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-[#131313] flex items-center justify-center"
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
                        className="fixed inset-0 z-[100] bg-black flex flex-col"
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
                        className="fixed inset-0 z-[100] bg-[#131313] flex flex-col"
                    >
                        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex items-center justify-between">
                            <button
                                onClick={() => { setMode('choose'); setError(null); }}
                                className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                ← Back
                            </button>
                            <span className="text-white font-bold">Multi-Photo Analysis</span>
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
                <>
                    {/* Glass Nav */}
                    <nav
                        className="fixed top-0 w-full z-50 h-20 px-8 flex justify-between items-center shadow-2xl shadow-black/40"
                        style={{ background: 'rgba(19,19,19,0.75)', backdropFilter: 'blur(24px)' }}
                    >
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="text-neutral-400 hover:text-neutral-100 transition-colors text-sm font-medium flex items-center gap-1"
                            >
                                ← Back to Home
                            </Link>
                            <div
                                className="text-2xl font-extrabold tracking-tighter text-neutral-50"
                                style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                            >
                                Lumiqe
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <span
                                className="text-red-500 font-semibold border-b-2 border-red-500 pb-1 text-sm cursor-default"
                                style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                            >
                                Analysis
                            </span>
                            <Link
                                href="/dashboard"
                                className="text-neutral-400 font-medium hover:text-neutral-100 transition-colors text-sm"
                                style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                            >
                                Palette
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-neutral-400 font-medium hover:text-neutral-100 transition-colors text-sm"
                                style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                            >
                                Pro
                            </Link>
                            <Link
                                href="/#how-it-works"
                                className="text-neutral-400 font-medium hover:text-neutral-100 transition-colors text-sm"
                                style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                            >
                                Science
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <LanguageSwitcher currentLang={lang} onChange={changeLang} />
                            <AppMenu />
                            <Link
                                href={session ? '/account' : '#'}
                                className="text-neutral-400 hover:text-neutral-100 transition-colors"
                                aria-label="Account"
                            >
                                <UserCircle className="w-7 h-7" />
                            </Link>
                        </div>
                    </nav>

                    {/* Main Content */}
                    <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto min-h-screen">
                        {/* Header */}
                        <header className="mb-12 text-center md:text-left">
                            <h1
                                className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 text-[#e2e2e2]"
                                style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                            >
                                Analysis
                            </h1>
                            <p className="text-[#e6bdb8] text-lg md:text-xl max-w-2xl leading-relaxed">
                                Precision skin intelligence starts here. Upload or scan for a medical-grade aesthetic breakdown.
                            </p>
                        </header>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* ── Primary Zone (8 cols) ── */}
                            <section className="lg:col-span-8 flex flex-col gap-8">
                                {/* Drop Zone */}
                                <div
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Upload Photo"
                                    className={`relative aspect-video bg-[#1b1b1b] rounded-2xl flex flex-col items-center justify-center border-2 border-dashed transition-all duration-500 overflow-hidden group cursor-pointer ${
                                        isDragging
                                            ? 'border-red-500/70 bg-red-900/10 scale-[1.01]'
                                            : 'border-[#5c403c]/50 hover:border-red-500/40'
                                    }`}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                                >
                                    {/* Background portrait image */}
                                    <div className="absolute inset-0 z-0">
                                        <div className="w-full h-full bg-gradient-to-br from-[#1f1f1f] to-[#131313] opacity-80" />
                                    </div>

                                    {/* Scanner line — animates on hover */}
                                    <div
                                        className="absolute left-0 w-full h-0.5 z-10 opacity-0 group-hover:opacity-100 scanner-animate"
                                        style={{
                                            background: 'linear-gradient(to bottom, transparent 0%, #dc2626 50%, transparent 100%)',
                                            height: '2px',
                                        }}
                                    />

                                    {/* Upload prompt */}
                                    <div className="relative z-10 flex flex-col items-center text-center p-8">
                                        <div className="w-20 h-20 bg-[#2a2a2a] rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                                            <Upload className="w-9 h-9 text-red-400" />
                                        </div>
                                        <h3
                                            className="text-2xl font-bold mb-2 text-[#e2e2e2]"
                                            style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                                        >
                                            Upload Photo
                                        </h3>
                                        <p className="text-[#e6bdb8] mb-8 max-w-sm text-sm">
                                            Tap to upload or drag and drop a high-resolution portrait.
                                        </p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            className="bg-red-600 text-white px-10 py-4 rounded-full font-bold text-base shadow-lg shadow-red-900/30 hover:scale-105 active:scale-95 transition-all hover:bg-red-500"
                                            style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                                        >
                                            Choose Image
                                        </button>
                                        <p className="text-[#e6bdb8]/40 text-xs mt-3">JPEG, PNG, WebP — max 5 MB · For accurate results use natural lighting</p>
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
                                        <div className="absolute bottom-6 flex items-center gap-2 text-red-200 bg-red-900/80 px-4 py-2 rounded-full text-sm z-20">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            {error}
                                        </div>
                                    )}
                                </div>

                                {/* Secondary Action Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* Live Camera */}
                                    <button
                                        onClick={() => setMode('camera')}
                                        className="bg-[#2a2a2a] p-6 rounded-2xl flex items-center justify-between group hover:bg-[#393939] transition-colors cursor-pointer col-span-1 text-left"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-red-600/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Video className="w-6 h-6 text-red-400" />
                                            </div>
                                            <div>
                                                <h4
                                                    className="font-bold text-base text-[#e2e2e2]"
                                                    style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                                                >
                                                    Start Live Camera
                                                </h4>
                                                <p className="text-[#e6bdb8]/60 text-xs mt-0.5">Instant real-time analysis</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-[#e6bdb8]/40 group-hover:text-red-400 transition-colors flex-shrink-0 ml-2" />
                                    </button>

                                    {/* Past Scans */}
                                    <Link
                                        href="/results"
                                        className="bg-[#2a2a2a] p-6 rounded-2xl flex items-center justify-between group hover:bg-[#393939] transition-colors cursor-pointer col-span-1"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Clock className="w-6 h-6 text-amber-400" />
                                            </div>
                                            <div>
                                                <h4
                                                    className="font-bold text-base text-[#e2e2e2]"
                                                    style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                                                >
                                                    Past Scans
                                                </h4>
                                                <p className="text-[#e6bdb8]/60 text-xs mt-0.5">View skin evolution</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-[#e6bdb8]/40 group-hover:text-amber-400 transition-colors flex-shrink-0 ml-2" />
                                    </Link>

                                    {/* Multi-Photo */}
                                    <button
                                        onClick={() => setMode('multi')}
                                        className="bg-[#2a2a2a] p-6 rounded-2xl flex items-center justify-between group hover:bg-[#393939] transition-colors cursor-pointer col-span-1 text-left"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Images className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h4
                                                    className="font-bold text-base text-[#e2e2e2]"
                                                    style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                                                >
                                                    Multi-Photo
                                                </h4>
                                                <p className="text-[#e6bdb8]/60 text-xs mt-0.5">2–5 selfies, higher accuracy</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                                            Pro
                                        </span>
                                    </button>
                                </div>
                            </section>

                            {/* ── Sidebar (4 cols) ── */}
                            <aside className="lg:col-span-4 flex flex-col gap-6">
                                {/* Precision Protocol */}
                                <div className="bg-[#1f1f1f] rounded-2xl p-7 shadow-sm">
                                    <h3
                                        className="text-lg font-bold mb-5 flex items-center gap-3 text-[#e2e2e2]"
                                        style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                                    >
                                        <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                        Precision Protocol
                                    </h3>
                                    <ul className="space-y-5">
                                        {[
                                            { n: 1, title: 'Natural Lighting.', body: 'Face a window during daylight for the most accurate texture capture.' },
                                            { n: 2, title: 'Clean Canvas.', body: 'Ensure your skin is free of makeup, SPF, and heavy moisturizers.' },
                                            { n: 3, title: 'Steady Frame.', body: 'Hold your phone at eye level, approximately 12 inches from your face.' },
                                        ].map(({ n, title, body }) => (
                                            <li key={n} className="flex gap-4">
                                                <div className="w-6 h-6 rounded-full bg-[#353535] flex-shrink-0 flex items-center justify-center text-xs font-bold text-red-400">
                                                    {n}
                                                </div>
                                                <p className="text-[#e6bdb8]/70 text-sm leading-relaxed">
                                                    <span className="text-[#e2e2e2] font-semibold">{title}</span> {body}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* System Status */}
                                <div className="bg-[#0e0e0e] rounded-2xl p-7 border border-[#5c403c]/10">
                                    <div className="flex items-center justify-between mb-5">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">System Status</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] text-green-500 font-bold uppercase">Ready</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-neutral-500">Processing Engine</span>
                                            <span className="text-neutral-300 font-mono">Lumiqe-V4.2</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-neutral-500">Analysis Depth</span>
                                            <span className="text-neutral-300 font-mono">256-bit Spectral</span>
                                        </div>
                                        <div className="w-full bg-[#2a2a2a] h-1 rounded-full overflow-hidden mt-3">
                                            <div className="bg-red-600 w-2/3 h-full rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* Tips Banner */}
                                <div className="bg-[#1f1f1f] rounded-2xl p-6 border border-[#5c403c]/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Sparkles className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Pro Tips</span>
                                    </div>
                                    <ul className="space-y-2">
                                        {[
                                            { icon: '☀️', text: 'Natural lighting — no dark rooms' },
                                            { icon: '👤', text: 'Face centered, no sunglasses' },
                                            { icon: '🚫', text: 'No heavy filters or beauty mode' },
                                            { icon: '📷', text: 'Well-lit selfie or portrait works best' },
                                        ].map(({ icon, text }) => (
                                            <li key={text} className="flex items-center gap-2 text-xs text-[#e6bdb8]/60">
                                                <span>{icon}</span> {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </aside>
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="w-full py-10 px-8 flex flex-col md:flex-row justify-between items-center bg-[#0e0e0e] border-t border-neutral-800/30 text-xs uppercase tracking-widest">
                        <div
                            className="text-base font-bold text-neutral-200 mb-4 md:mb-0"
                            style={{ fontFamily: 'var(--font-jakarta, Plus Jakarta Sans, sans-serif)' }}
                        >
                            LUMIQE
                        </div>
                        <div className="flex gap-8 mb-4 md:mb-0">
                            {['Terms', 'Privacy', 'Press', 'Contact'].map((item) => (
                                <a key={item} href="#" className="text-neutral-600 hover:text-red-400 transition-colors">
                                    {item}
                                </a>
                            ))}
                        </div>
                        <div className="text-neutral-600">© 2024 Lumiqe AI. The Digital Aesthetician.</div>
                    </footer>
                </>
            )}
        </div>
    );
}
