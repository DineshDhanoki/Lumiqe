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
                                    ? 'bg-primary/10 text-primary border-primary/40 shadow-[0_0_15px_rgba(240,191,98,0.2)]'
                                    : 'bg-surface-container/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 border-outline-variant/20'
                                }
                            `}
                        >
                            {vibe.label}
                            {vibe.isPremium && !isPremiumUser && (
                                <Lock className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
