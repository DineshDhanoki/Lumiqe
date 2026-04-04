'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useLumiqeStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { compressImage, storeThumbnail } from '@/lib/imageUtils';
import CameraCapture from '@/components/CameraCapture';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ScanGuide from '@/components/ScanGuide';
import AppMenu from '@/components/AppMenu';
import AnalyzingSpinner from '@/components/analyze/AnalyzingSpinner';
import ModeChooser from '@/components/analyze/ModeChooser';
import UploadDropzone from '@/components/analyze/UploadDropzone';
import MultiPhotoUpload from '@/components/analyze/MultiPhotoUpload';

type Mode = 'choose' | 'upload' | 'camera' | 'multi';

export default function AnalyzePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const user = useLumiqeStore((s) => s.user);
    const [mode, setMode] = useState<Mode>('choose');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lang, setLang] = useState('en');

    useEffect(() => {
        const saved = localStorage.getItem('lumiqe-lang');
        if (saved) setLang(saved);
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

        setPreviewUrl(URL.createObjectURL(selectedFile));
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
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between safe-top">
                <Link
                    href={session ? '/dashboard' : '/'}
                    className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {session ? t(lang, 'backToDashboard') : t(lang, 'backHome')}
                </Link>

                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-400" />
                    <span className="text-xl font-bold tracking-widest text-white">LUMIQE</span>
                </div>

                <div className="flex items-center gap-2">
                    <LanguageSwitcher currentLang={lang} onChange={changeLang} />
                    <AppMenu />
                </div>
            </nav>

            {/* ── Content ── */}
            <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 pt-24 sm:pt-28 pb-12">
                <ScanGuide />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md z-10"
                >
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
                        {isAnalyzing && (
                            <AnalyzingSpinner lang={lang} previewUrl={previewUrl} />
                        )}

                        {!isAnalyzing && mode === 'choose' && (
                            <ModeChooser
                                lang={lang}
                                onSelectCamera={() => setMode('camera')}
                                onSelectUpload={() => setMode('upload')}
                                onSelectMulti={() => setMode('multi')}
                            />
                        )}

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

                        {!isAnalyzing && mode === 'upload' && (
                            <UploadDropzone
                                lang={lang}
                                error={error}
                                onFile={handleFile}
                                onBack={() => { setMode('choose'); setError(null); }}
                            />
                        )}

                        {!isAnalyzing && mode === 'multi' && (
                            <MultiPhotoUpload
                                lang={lang}
                                apiError={error}
                                onAnalyze={handleMultiAnalyze}
                                onBack={() => { setMode('choose'); setError(null); }}
                            />
                        )}
                    </AnimatePresence>

                    {error && mode !== 'upload' && mode !== 'multi' && (
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
