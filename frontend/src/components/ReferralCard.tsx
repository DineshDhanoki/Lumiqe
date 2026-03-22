'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';

export default function ReferralCard() {
    const { data: session } = useSession();
    const [referralData, setReferralData] = useState<{
        referral_code: string;
        referral_url: string;
        referral_count: number;
    } | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;

        apiFetch('/api/referral/code')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setReferralData(data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [session]);

    const handleCopy = () => {
        if (!referralData) return;
        navigator.clipboard.writeText(referralData.referral_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading || !referralData) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-red-950/40 to-zinc-900/60 border border-red-500/20 rounded-2xl p-6"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-red-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold">Invite Friends</h3>
                    <p className="text-white/50 text-sm">You both earn +1 free scan</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 font-mono text-sm text-white/80 truncate">
                    {referralData.referral_url}
                </div>
                <button
                    onClick={handleCopy}
                    className="shrink-0 p-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/40">
                <Users className="w-4 h-4" />
                <span>{referralData.referral_count} friend{referralData.referral_count !== 1 ? 's' : ''} referred</span>
            </div>
        </motion.div>
    );
}
