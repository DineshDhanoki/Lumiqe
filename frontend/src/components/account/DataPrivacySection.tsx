'use client';

import { Loader2 } from 'lucide-react';

interface DataPrivacySectionProps {
    exporting: boolean;
    deleting: boolean;
    deleteConfirm: boolean;
    onExport: () => void;
    onDeleteRequest: () => void;
    onDeleteConfirm: () => void;
    onDeleteCancel: () => void;
}

export default function DataPrivacySection({
    exporting,
    deleting,
    deleteConfirm,
    onExport,
    onDeleteRequest,
    onDeleteConfirm,
    onDeleteCancel,
}: DataPrivacySectionProps) {
    return (
        <section className="bg-surface-container rounded-3xl overflow-hidden">
            {/* Section header */}
            <div className="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-high/20">
                <h3 className="font-headline text-xl font-bold text-on-surface">Data &amp; Privacy</h3>
            </div>

            <div className="p-8 space-y-0 divide-y divide-outline-variant/10">
                {/* Export row */}
                <div className="flex items-start gap-6 pb-8">
                    <div className="p-3 bg-secondary/10 rounded-xl flex-shrink-0">
                        <span className="material-symbols-outlined text-secondary">database</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-headline font-semibold text-lg text-on-surface mb-1">Export Personal Data</h4>
                        <p className="text-on-surface-variant text-sm mb-4 leading-relaxed">
                            Request a comprehensive archive of your style profile, scan history, and preferences in JSON format.
                        </p>
                        <button
                            onClick={onExport}
                            disabled={exporting}
                            className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-[0.2em] hover:gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {exporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            )}
                            {exporting ? 'Exporting...' : 'Initiate Data Export'}
                        </button>
                    </div>
                </div>

                {/* Delete row */}
                <div className="flex items-start gap-6 pt-8">
                    <div className="p-3 bg-error/10 rounded-xl flex-shrink-0">
                        <span className="material-symbols-outlined text-error">delete_forever</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-headline font-semibold text-lg text-error mb-1">Delete Account</h4>
                        <p className="text-on-surface-variant text-sm mb-4 leading-relaxed">
                            Permanently remove your profile and all associated AI training data. This action is irreversible.
                        </p>

                        {!deleteConfirm ? (
                            <button
                                onClick={onDeleteRequest}
                                className="px-6 py-3 font-label text-[10px] uppercase tracking-widest text-error border border-error/20 rounded-full hover:bg-error/10 transition-colors"
                            >
                                Request Deletion
                            </button>
                        ) : (
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="text-error text-sm w-full">Are you sure? This cannot be undone.</p>
                                <button
                                    onClick={onDeleteConfirm}
                                    disabled={deleting}
                                    className="px-6 py-3 font-label text-[10px] uppercase tracking-widest bg-error text-on-error rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                                <button
                                    onClick={onDeleteCancel}
                                    className="px-6 py-3 font-label text-[10px] uppercase tracking-widest border border-outline-variant/30 text-on-surface-variant rounded-full hover:bg-surface-container-high/50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
