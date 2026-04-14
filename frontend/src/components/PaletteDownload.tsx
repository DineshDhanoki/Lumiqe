'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface PaletteDownloadProps {
    season: string;
    palette?: string[];
    hexColor?: string;
    undertone?: string;
    metal?: string;
    confidence?: number;
}

export default function PaletteDownload({ season, palette = [], hexColor = '', undertone = '', metal = '', confidence = 0 }: PaletteDownloadProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleDownload = async () => {
        setIsDownloading(true);
        setError('');

        try {
            const res = await apiFetch('/api/palette-card', {
                method: 'POST',
                body: JSON.stringify({ season, palette, hex_color: hexColor, undertone, metal, confidence }),
            });

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
                className={`relative group flex items-center justify-center gap-3 w-full sm:w-auto font-label font-bold text-lg py-4 px-10 rounded-full transition-all duration-300 ${isSuccess
                    ? 'bg-tertiary text-on-surface cursor-default'
                    : isDownloading
                        ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                        : 'bg-primary-container text-on-primary-container hover:bg-primary shadow-[0_0_40px_-10px_rgba(240,191,98,0.3)] hover:shadow-[0_0_60px_-15px_rgba(240,191,98,0.4)] transform hover:scale-105'
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
                <p className="mt-4 text-primary text-sm font-label font-medium">{error}</p>
            )}

            <p className="mt-4 text-on-surface-variant text-sm">
                Downloads a high-res card to share on Instagram or keep for shopping.
            </p>
        </div>
    );
}
