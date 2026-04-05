'use client';

import { User, Phone } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface SignUpFieldsProps {
    firstName: string;
    lastName: string;
    phone: string;
    age: string;
    sex: string;
    fieldErrors: Record<string, string>;
    setFirstName: (v: string) => void;
    setLastName: (v: string) => void;
    setPhone: (v: string) => void;
    setAge: (v: string) => void;
    setSex: (v: string) => void;
    clearFieldError: (field: string) => void;
    inputClass: (field: string) => string;
}

export default function SignUpFields({
    firstName, lastName, phone, age, sex,
    fieldErrors,
    setFirstName, setLastName, setPhone, setAge, setSex,
    clearFieldError,
    inputClass,
}: SignUpFieldsProps) {
    const { t } = useTranslation();

    return (
        <>
            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <div className="relative flex items-center">
                        <User className="absolute left-3.5 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder={t('authFirstName')}
                            aria-label={t('authFirstName')}
                            value={firstName}
                            onChange={(e) => { setFirstName(e.target.value); clearFieldError('firstName'); }}
                            className={inputClass('firstName')}
                        />
                    </div>
                    {fieldErrors.firstName && <p className="mt-1 ml-2 text-xs text-red-400">{fieldErrors.firstName}</p>}
                </div>
                <div>
                    <div className="relative flex items-center">
                        <User className="absolute left-3.5 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder={t('authLastName')}
                            aria-label={t('authLastName')}
                            value={lastName}
                            onChange={(e) => { setLastName(e.target.value); clearFieldError('lastName'); }}
                            className={inputClass('lastName')}
                        />
                    </div>
                    {fieldErrors.lastName && <p className="mt-1 ml-2 text-xs text-red-400">{fieldErrors.lastName}</p>}
                </div>
            </div>

            {/* Phone */}
            <div>
                <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 w-4 h-4 text-white/40" />
                    <input
                        type="tel"
                        placeholder={t('authPhone')}
                        aria-label={t('authPhone')}
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); clearFieldError('phone'); }}
                        className={inputClass('phone')}
                    />
                </div>
                {fieldErrors.phone && <p className="mt-1 ml-2 text-xs text-red-400">{fieldErrors.phone}</p>}
            </div>

            {/* Age */}
            <div>
                <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-white/40" />
                    <input
                        type="number"
                        inputMode="numeric"
                        min={13}
                        max={100}
                        placeholder={t('authAge')}
                        aria-label={t('authAge')}
                        value={age}
                        onChange={(e) => { setAge(e.target.value); clearFieldError('age'); }}
                        className={inputClass('age')}
                    />
                </div>
                {fieldErrors.age && <p className="mt-1 ml-2 text-xs text-red-400">{fieldErrors.age}</p>}
            </div>

            {/* Sex */}
            <div>
                <p className="text-xs text-white/40 mb-2 ml-1">{t('authSex')}</p>
                <div className="grid grid-cols-3 gap-2">
                    {['Male', 'Female', 'Other'].map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => { setSex(option); clearFieldError('sex'); }}
                            className={`py-2.5 rounded-2xl text-sm font-medium transition-all border ${
                                sex === option
                                    ? 'bg-red-600/20 border-red-500/50 text-red-300'
                                    : 'bg-black/50 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                {fieldErrors.sex && <p className="mt-1 ml-2 text-xs text-red-400">{fieldErrors.sex}</p>}
            </div>
        </>
    );
}
