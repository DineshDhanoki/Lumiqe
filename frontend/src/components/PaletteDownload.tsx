'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface PaletteDownloadProps {
    season: string;
    backendToken?: string;
}

export default function PaletteDownload({ season, backendToken }: PaletteDownloadProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleDownload = async () => {
        setIsDownloading(true);
        setError('');

        try {
            const sessionObj = backendToken ? { backendToken } as any : null;
            const res = await apiFetch('/api/palette-card', {
                method: 'POST',
                body: JSON.stringify({ season }),
            }, sessionObj);

            if (!res.ok) {
                throw new Error('Failed to generate card');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `Lumiqe-${season.replace(/\s+/g, '-')}-Palette.png`;
            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError('Could not download palette. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex flex-col items-center mt-12 mb-8">
            <button
                onClick={handleDownload}
                disabled={isDownloading || isSuccess}
                className={`relative group flex items-center justify-center gap-3 w-full sm:w-auto font-bold text-lg py-4 px-10 rounded-full transition-all duration-300 ${isSuccess
                    ? 'bg-green-500 text-white cursor-default'
                    : isDownloading
                        ? 'bg-white/10 text-white/50 cursor-not-allowed'
                        : 'bg-white text-stone-900 hover:bg-stone-200 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transform hover:scale-105'
                    }`}
            >
                {isSuccess ? (
                    <>
                        <CheckCircle2 className="w-5 h-5" />
                        Saved to Device!
                    </>
                ) : isDownloading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Beautiful Card...
                    </>
                ) : (
                    <>
                        <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                        Save My Palette
                    </>
                )}
            </button>

            {error && (
                <p className="mt-4 text-red-400 text-sm font-medium">{error}</p>
            )}

            <p className="mt-4 text-white/40 text-sm">
                Downloads a high-res card to share on Instagram or keep for shopping.
            </p>
        </div>
    );
}
