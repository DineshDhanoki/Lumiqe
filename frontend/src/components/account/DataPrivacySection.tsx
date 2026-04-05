'use client';

import { Download, Trash2, Loader2 } from 'lucide-react';

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
        <div className="mt-10 p-8 rounded-3xl bg-white/[0.02] border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Data & Privacy</h3>
            <p className="text-white/50 text-sm mb-6">Download all your data or permanently delete your account.</p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onExport}
                    disabled={exporting}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                    {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {exporting ? 'Exporting...' : 'Export My Data'}
                </button>

                {!deleteConfirm ? (
                    <button
                        onClick={onDeleteRequest}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 text-red-400 text-sm font-semibold transition"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-red-400 text-sm">Are you sure? This cannot be undone.</span>
                        <button
                            onClick={onDeleteConfirm}
                            disabled={deleting}
                            className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition disabled:opacity-50"
                        >
                            {deleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                            onClick={onDeleteCancel}
                            className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 text-sm transition"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
