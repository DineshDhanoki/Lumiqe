'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useFetch } from '@/lib/hooks/useFetch';

interface ReferralData {
    referral_code: string;
    referral_url: string;
    referral_count: number;
}

export default function ReferralCard() {
    const { data: session } = useSession();
    const [copied, setCopied] = useState(false);

    const { data: referralData, loading } = useFetch<ReferralData>(
        '/api/proxy/referral/code',
        { skip: !session },
    );

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
            className="bg-gradient-to-br from-primary/5 to-surface-container/60 border border-primary/20 rounded-2xl p-6"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-primary">card_giftcard</span>
                </div>
                <div>
                    <h3 className="text-on-surface font-bold">Invite Friends</h3>
                    <p className="text-on-surface-variant text-sm">You both earn +1 free scan</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-surface-container/30 border border-outline-variant/20 rounded-lg px-4 py-2.5 font-mono text-sm text-on-surface truncate">
                    {referralData.referral_url}
                </div>
                <button
                    onClick={handleCopy}
                    className="shrink-0 p-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container transition-colors"
                >
                    {copied ? <span className="material-symbols-outlined text-base">check</span> : <span className="material-symbols-outlined text-base">content_copy</span>}
                </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-base">group</span>
                <span>{referralData.referral_count} friend{referralData.referral_count !== 1 ? 's' : ''} referred</span>
            </div>
        </motion.div>
    );
}
