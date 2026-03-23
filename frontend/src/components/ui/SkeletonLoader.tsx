'use client';

import React from 'react';

/* ─── SkeletonCard ────────────────────────────────────────────────── */

interface SkeletonCardProps {
    className?: string;
}

function SkeletonCardInner({ className = '' }: SkeletonCardProps) {
    return (
        <div
            className={`animate-pulse rounded-xl bg-gray-100 overflow-hidden ${className}`}
        >
            {/* Image placeholder */}
            <div className="aspect-[3/4] w-full bg-gray-200" />
            {/* Text placeholders */}
            <div className="p-4 space-y-2">
                <div className="h-3 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
                <div className="h-3 w-1/3 rounded bg-gray-200" />
            </div>
        </div>
    );
}

export const SkeletonCard = React.memo(SkeletonCardInner);

/* ─── SkeletonGrid ────────────────────────────────────────────────── */

interface SkeletonGridProps {
    count?: number;
}

function SkeletonGridInner({ count = 6 }: SkeletonGridProps) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: count }, (_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
}

export const SkeletonGrid = React.memo(SkeletonGridInner);

/* ─── SkeletonSpinner ─────────────────────────────────────────────── */

interface SkeletonSpinnerProps {
    text?: string;
}

function SkeletonSpinnerInner({ text }: SkeletonSpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-violet-600" />
            {text && (
                <p className="text-sm text-gray-500">{text}</p>
            )}
        </div>
    );
}

export const SkeletonSpinner = React.memo(SkeletonSpinnerInner);
