'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

interface Props {
    lang: string;
    error: string | null;
    onFile: (file: File) => void;
    onBack: () => void;
}

export default function UploadDropzone({ lang, error, onFile, onBack }: Props) {
    const [isDragging, setIsDragging] = useState(false);

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0]);
    };

    return (
        <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <div
                role="button"
                tabIndex={0}
                aria-label="Upload a selfie"
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
                        aria-label="Choose a photo to upload"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
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
                onClick={onBack}
                className="w-full py-3 rounded-2xl border border-white/15 text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >
                {t(lang, 'back')}
            </button>
        </motion.div>
    );
}
