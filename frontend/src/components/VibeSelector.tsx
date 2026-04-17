'use client';



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
                            style={!isActive ? { border: '0.5px solid rgba(196,151,62,0.2)' } : undefined}
                            className={`
                                relative flex items-center gap-2 px-8 py-3 rounded-full text-xs font-headline font-bold uppercase tracking-widest transition-all duration-300
                                ${isActive
                                    ? 'bg-primary-container text-on-primary shadow-[0_0_15px_rgba(240,191,98,0.2)]'
                                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                }
                            `}
                        >
                            {vibe.label}
                            {vibe.isPremium && !isPremiumUser && (
                                <span className={`material-symbols-outlined text-sm ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>lock</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
