'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Images, X, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

interface Props {
    lang: string;
    apiError: string | null;
    onAnalyze: (files: File[]) => void;
    onBack: () => void;
}

export default function MultiPhotoUpload({ lang, apiError, onAnalyze, onBack }: Props) {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [validationError, setValidationError] = useState<string | null>(null);

    const addFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setValidationError('Please use a valid image (JPEG, PNG, WebP).');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setValidationError('Each file must be under 5MB.');
            return;
        }
        if (files.length >= MAX_FILES) {
            setValidationError('Maximum 5 images allowed.');
            return;
        }
        setValidationError(null);
        setFiles((prev) => [...prev, file]);
        setPreviews((prev) => [...prev, URL.createObjectURL(file)]);
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleBack = () => {
        previews.forEach((url) => URL.revokeObjectURL(url));
        setFiles([]);
        setPreviews([]);
        onBack();
    };

    const displayError = validationError || apiError;

    return (
        <motion.div
            key="multi"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <div className="bg-surface-container/30 border border-outline-variant/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Images className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-semibold text-on-surface">Multi-Photo Analysis</h3>
                </div>
                <p className="text-xs text-on-surface-variant">
                    Upload 2-5 selfies in different lighting. We analyze each independently
                    and average the results for higher accuracy.
                </p>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-3 gap-3">
                {previews.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-outline-variant/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={() => removeFile(index)}
                            className="absolute top-1.5 right-1.5 p-1 bg-black/70 rounded-full text-on-surface-variant hover:text-primary transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 rounded-full px-2 py-0.5 text-[10px] font-medium text-on-surface">
                            {index + 1}
                        </div>
                    </div>
                ))}

                {files.length < MAX_FILES && (
                    <label className="relative aspect-square rounded-2xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-surface-container/30 transition-all">
                        <Plus className="w-6 h-6 text-on-surface-variant" />
                        <span className="text-[10px] text-on-surface-variant/50 mt-1">Add photo</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.files?.[0]) addFile(e.target.files[0]);
                                e.target.value = '';
                            }}
                        />
                    </label>
                )}
            </div>

            <p className="text-xs text-on-surface-variant/50 text-center">
                {files.length}/5 photos added · Minimum 2 required
            </p>

            {displayError && (
                <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-xl text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {displayError}
                </div>
            )}

            <button
                onClick={() => onAnalyze(files)}
                disabled={files.length < 2}
                className={cn(
                    'w-full py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                    files.length >= 2
                        ? 'bg-primary-container hover:bg-primary text-on-primary-container'
                        : 'bg-surface-container/30 text-on-surface-variant/30 cursor-not-allowed'
                )}
            >
                <Images className="w-4 h-4" />
                Analyze {files.length} {files.length === 1 ? 'Photo' : 'Photos'}
            </button>

            <button
                onClick={handleBack}
                className="w-full py-3 rounded-2xl border border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30 transition-all text-sm font-medium"
            >
                {t(lang, 'back')}
            </button>
        </motion.div>
    );
}
