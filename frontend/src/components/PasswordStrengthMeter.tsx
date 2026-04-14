'use client';

interface PasswordStrengthMeterProps {
    password: string;
    label: string;
    color: string;
    score: number;
    passwordLabel: string;
}

export default function PasswordStrengthMeter({ password, label, color, score, passwordLabel }: PasswordStrengthMeterProps) {
    if (!password) return null;
    return (
        <div className="mt-2 px-1">
            <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? color : 'bg-outline-variant/20'}`}
                    />
                ))}
            </div>
            {label && (
                <p className="text-xs text-on-surface-variant">{label} {passwordLabel}</p>
            )}
        </div>
    );
}

export function getPasswordStrength(password: string, t: (key: string) => string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) score++;
    if (score <= 2) return { score, label: t('authPasswordWeak'), color: 'bg-red-500' };
    if (score <= 3) return { score, label: t('authPasswordFair'), color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: t('authPasswordGood'), color: 'bg-blue-500' };
    return { score, label: t('authPasswordStrong'), color: 'bg-green-500' };
}
