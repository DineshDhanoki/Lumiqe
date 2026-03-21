'use client';

import { Lock } from 'lucide-react';

interface VibeSelectorProps {
    currentVibe: string;
    onSelectVibe: (vibe: string) => void;
    isPremiumUser?: boolean;
}

const VIBES = [
    { id: 'Casual', label: 'Casual', isPremium: false },
    { id: 'Gym', label: 'Gym', isPremium: true },
    { id: 'Party', label: 'Party', isPremium: true },
    { id: 'Formal', label: 'Formal', isPremium: true },
];

export default function VibeSelector({ currentVibe, onSelectVibe, isPremiumUser = false }: VibeSelectorProps) {
    return (
        <div className="w-full overflow-x-auto no-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 min-w-max">
                {VIBES.map((vibe) => {
                    const isActive = currentVibe === vibe.id;
                    return (
                        <button
                            key={vibe.id}
                            onClick={() => onSelectVibe(vibe.id)}
                            className={`
                                relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                                border
                                ${isActive
                                    ? 'bg-red-500/20 text-red-100 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-white/10'
                                }
                            `}
                        >
                            {vibe.label}
                            {vibe.isPremium && !isPremiumUser && (
                                <Lock className={`w-3.5 h-3.5 ${isActive ? 'text-red-300' : 'text-white/40'}`} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
