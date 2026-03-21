'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Loader2, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { t } from '@/lib/i18n';
import CameraCapture from '@/components/CameraCapture';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type Mode = 'choose' | 'upload' | 'camera';

export default function AnalyzePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [mode, setMode] = useState<Mode>('choose');
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lang, setLang] = useState('en');

    // Persist language choice
    useEffect(() => {
        const saved = localStorage.getItem('lumiqe-lang');
        if (saved) setLang(saved);
    }, []);

    const changeLang = (code: string) => {
        setLang(code);
        localStorage.setItem('lumiqe-lang', code);
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

        setPreviewUrl(URL.createObjectURL(selectedFile));
        setError(null);
        setIsAnalyzing(true);

        const formData = new FormData();
        formData.append('image', selectedFile);

        try {
            const res = await apiFetch('/api/analyze', {
                method: 'POST',
                body: formData,
            }, session);

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

            // Redirect to persisted result page if we got an analysis_id (logged-in user)
            if (data.analysis_id) {
                router.push(`/results/${data.analysis_id}`);
            } else {
                // Fallback for anonymous users: pass data via URL params
                const params = new URLSearchParams();
                params.set('season', data.season);
                params.set('description', data.description || '');
                params.set('hexColor', data.hex_color || '');
                params.set('undertone', data.undertone || '');
                params.set('confidence', data.confidence?.toString() || '0');
                if (data.palette) params.set('palette', data.palette.join(','));
                if (data.avoid_colors) params.set('avoidColors', data.avoid_colors.join(','));
                if (data.metal) params.set('metal', data.metal);
                if (data.celebrities) params.set('celebrities', encodeURIComponent(JSON.stringify(data.celebrities)));
                if (data.makeup) params.set('makeup', encodeURIComponent(JSON.stringify(data.makeup)));
                if (data.tips) params.set('tips', data.tips);
                if (data.contrast_level) params.set('contrastLevel', data.contrast_level);
                router.push(`/results?${params.toString()}`);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
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
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* ── Navbar ── */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t(lang, 'backHome')}
                </Link>

                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-400" />
                    <span className="text-xl font-bold tracking-widest text-white">LUMIQE</span>
                </div>

                <LanguageSwitcher currentLang={lang} onChange={changeLang} />
            </nav>

            {/* ── Content ── */}
            <div className="flex flex-1 flex-col items-center justify-center p-6 pt-28 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md z-10"
                >
                    {/* Welcome */}
                    {session?.user?.name && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-center mb-6"
                        >
                            <p className="text-lg text-white/80">
                                {t(lang, 'welcomeBack')} <span className="text-white font-semibold">{session.user.name.split(' ')[0]}</span>
                            </p>
                            <p className="text-sm text-white/40 mt-1">{t(lang, 'discoverPalette')}</p>
                        </motion.div>
                    )}

                    <h2 className="text-3xl font-bold text-white text-center mb-2">{t(lang, 'scanTitle')}</h2>
                    <p className="text-white/60 text-center mb-8">{t(lang, 'scanSubtitle')}</p>

                    <AnimatePresence mode="wait">

                        {/* ── ANALYZING ── */}
                        {isAnalyzing && (
                            <motion.div
                                key="analyzing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-6 py-16"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-full border-t-4 border-red-500 animate-spin" />
                                    {previewUrl && (
                                        <img
                                            src={previewUrl}
                                            alt="Scanning"
                                            className="w-32 h-32 rounded-full object-cover opacity-50 blur-sm"
                                        />
                                    )}
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-white animate-pulse">{t(lang, 'analyzing')}</h3>
                                    <p className="text-sm text-white/50 mt-1">{t(lang, 'analyzingSubtitle')}</p>
                                </div>
                            </motion.div>
                        )}

                        {/* ── MODE CHOOSER ── */}
                        {!isAnalyzing && mode === 'choose' && (
                            <motion.div
                                key="choose"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setMode('camera')}
                                    className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-red-500/50 transition-all group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                                        <Camera className="w-8 h-8 text-red-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-semibold text-sm">{t(lang, 'liveCamera')}</p>
                                        <p className="text-white/40 text-xs mt-1">{t(lang, 'mostAccurate')}</p>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
                                        {t(lang, 'recommended')}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setMode('upload')}
                                    className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                                        <Upload className="w-8 h-8 text-white/60" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-semibold text-sm">{t(lang, 'uploadPhoto')}</p>
                                        <p className="text-white/40 text-xs mt-1">{t(lang, 'fromDevice')}</p>
                                    </div>
                                </button>
                                </div>

                                {/* Image quality guidance */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3">For accurate results</p>
                                    <ul className="space-y-1.5">
                                        <li className="text-xs text-white/60 flex items-center gap-2"><span>☀️</span> Natural or bright indoor lighting — no dark rooms</li>
                                        <li className="text-xs text-white/60 flex items-center gap-2"><span>👤</span> Face clearly visible, centered, no sunglasses</li>
                                        <li className="text-xs text-white/60 flex items-center gap-2"><span>🚫</span> No heavy filters, edits, or beauty mode</li>
                                        <li className="text-xs text-white/60 flex items-center gap-2"><span>📷</span> A well-lit selfie or portrait works best</li>
                                    </ul>
                                </div>
                            </motion.div>
                        )}

                        {/* ── LIVE CAMERA ── */}
                        {!isAnalyzing && mode === 'camera' && (
                            <motion.div
                                key="camera"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <CameraCapture
                                    lang={lang}
                                    onCapture={(file) => { setMode('choose'); handleFile(file); }}
                                    onCancel={() => setMode('choose')}
                                />
                            </motion.div>
                        )}

                        {/* ── UPLOAD ── */}
                        {!isAnalyzing && mode === 'upload' && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div
                                    className={cn(
                                        'relative flex flex-col items-center justify-center w-full min-h-[340px] rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden',
                                        isDragging
                                            ? 'border-white bg-white/20 scale-[1.02]'
                                            : 'border-white/20 bg-white/10 backdrop-blur-md'
                                    )}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop}
                                >
                                    <div className="flex flex-col items-center gap-6 p-8 w-full justify-center">
                                        <div className="p-4 rounded-full bg-white/10">
                                            <Upload className="w-10 h-10 text-white" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-lg font-medium text-white">{t(lang, 'tapToUpload')}</h3>
                                            <p className="text-sm text-white/50">{t(lang, 'dragDrop')}</p>
                                            <p className="text-xs text-white/30">{t(lang, 'maxSize')}</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                        />
                                    </div>

                                    {error && (
                                        <div className="absolute bottom-6 flex items-center gap-2 text-red-200 bg-red-900/80 px-4 py-2 rounded-full text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => { setMode('choose'); setError(null); }}
                                    className="w-full py-3 rounded-2xl border border-white/15 text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                                >
                                    {t(lang, 'back')}
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {error && mode !== 'upload' && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex items-center gap-2 text-red-200 bg-red-900/60 border border-red-500/30 px-4 py-3 rounded-2xl text-sm"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </main>
    );
}
