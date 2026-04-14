'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'rectangle' | 'circle' | 'text';
    lines?: number;
}

export function Skeleton({ className, variant = 'rectangle', lines }: SkeletonProps) {
    const base = 'animate-pulse bg-surface-container/30 rounded';

    if (variant === 'circle') {
        return <div className={cn(base, 'rounded-full', className)} />;
    }

    if (variant === 'text' && lines) {
        return (
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div key={i} className={cn(base, 'h-4', i === lines - 1 ? 'w-3/4' : 'w-full', className)} />
                ))}
            </div>
        );
    }

    return <div className={cn(base, className)} />;
}

export function SkeletonCard() {
    return (
        <div className="bg-surface-container/50 border border-primary/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="w-10 h-10" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton variant="text" lines={3} />
        </div>
    );
}

export function SkeletonProductCard() {
    return (
        <div className="bg-surface-container/50 border border-primary/10 rounded-2xl overflow-hidden">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonResultsPage() {
    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-3">
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-5 w-64 mx-auto" />
                </div>
                <Skeleton variant="circle" className="w-24 h-24 mx-auto" />
                <div className="flex justify-center gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="w-14 h-14 rounded-xl" />
                    ))}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-surface-container/50 border border-primary/10 rounded-xl p-4 space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-6 w-12" />
                        </div>
                    ))}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        </div>
    );
}

export function SkeletonShoppingGrid() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonProductCard key={i} />
            ))}
        </div>
    );
}
