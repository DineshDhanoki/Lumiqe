'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface BeforeAfterComparisonProps {
    beforeLabel?: string;
    afterLabel?: string;
    beforeContent: React.ReactNode;
    afterContent: React.ReactNode;
    height?: number;
}

export default function BeforeAfterComparison({
    beforeLabel = 'Before',
    afterLabel = 'After',
    beforeContent,
    afterContent,
    height = 400,
}: BeforeAfterComparisonProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current || !isDragging.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percent);
    }, []);

    const handleMouseDown = () => { isDragging.current = true; };
    const handleMouseUp = () => { isDragging.current = false; };
    const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50"
        >
            <div
                ref={containerRef}
                className="relative select-none cursor-col-resize"
                style={{ height }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseMove={handleMouseMove}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                onTouchMove={handleTouchMove}
                role="slider"
                aria-label="Before and after comparison slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(sliderPosition)}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') setSliderPosition(p => Math.max(0, p - 2));
                    if (e.key === 'ArrowRight') setSliderPosition(p => Math.min(100, p + 2));
                }}
            >
                {/* After (full width, behind) */}
                <div className="absolute inset-0">
                    {afterContent}
                </div>

                {/* Before (clipped by slider) */}
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                >
                    {beforeContent}
                </div>

                {/* Slider line */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                    style={{ left: `${sliderPosition}%` }}
                >
                    {/* Drag handle */}
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-zinc-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" />
                        </svg>
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-semibold text-white/80 z-10">
                    {beforeLabel}
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs font-semibold text-white/80 z-10">
                    {afterLabel}
                </div>
            </div>
        </motion.div>
    );
}
