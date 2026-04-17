'use client';

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
}

export default function SignUpFields({
    firstName, lastName, phone, age, sex,
    fieldErrors,
    setFirstName, setLastName, setPhone, setAge, setSex,
    clearFieldError,
}: SignUpFieldsProps) {
    const { t } = useTranslation();

    return (
        <>
            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <div className="floating-label-group" style={{ borderBottomColor: fieldErrors.firstName ? '#f0bf62' : undefined }}>
                        <input
                            type="text"
                            placeholder=" "
                            id="firstName"
                            value={firstName}
                            onChange={(e) => { setFirstName(e.target.value); clearFieldError('firstName'); }}
                            style={{ borderBottomColor: fieldErrors.firstName ? '#f0bf62' : undefined }}
                        />
                        <label htmlFor="firstName" className="uppercase tracking-widest text-xs">{t('authFirstName')}</label>
                    </div>
                    {fieldErrors.firstName && <p className="mt-1 text-xs text-primary">{fieldErrors.firstName}</p>}
                </div>
                <div>
                    <div className="floating-label-group">
                        <input
                            type="text"
                            placeholder=" "
                            id="lastName"
                            value={lastName}
                            onChange={(e) => { setLastName(e.target.value); clearFieldError('lastName'); }}
                            style={{ borderBottomColor: fieldErrors.lastName ? '#f0bf62' : undefined }}
                        />
                        <label htmlFor="lastName" className="uppercase tracking-widest text-xs">{t('authLastName')}</label>
                    </div>
                    {fieldErrors.lastName && <p className="mt-1 text-xs text-primary">{fieldErrors.lastName}</p>}
                </div>
            </div>

            {/* Phone */}
            <div>
                <div className="floating-label-group">
                    <input
                        type="tel"
                        placeholder=" "
                        id="phone"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); clearFieldError('phone'); }}
                        style={{ borderBottomColor: fieldErrors.phone ? '#f0bf62' : undefined }}
                    />
                    <label htmlFor="phone" className="uppercase tracking-widest text-xs">{t('authPhone')}</label>
                </div>
                {fieldErrors.phone && <p className="mt-1 text-xs text-primary">{fieldErrors.phone}</p>}
            </div>

            {/* Age */}
            <div>
                <div className="floating-label-group">
                    <input
                        type="number"
                        inputMode="numeric"
                        min={13}
                        max={100}
                        placeholder=" "
                        id="age"
                        value={age}
                        onChange={(e) => { setAge(e.target.value); clearFieldError('age'); }}
                        style={{ borderBottomColor: fieldErrors.age ? '#f0bf62' : undefined }}
                    />
                    <label htmlFor="age" className="uppercase tracking-widest text-xs">{t('authAge')}</label>
                </div>
                {fieldErrors.age && <p className="mt-1 text-xs text-primary">{fieldErrors.age}</p>}
            </div>

            {/* Sex */}
            <div>
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60 mb-3">{t('authSex')}</p>
                <div className="grid grid-cols-3 gap-2">
                    {['Male', 'Female', 'Other'].map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => { setSex(option); clearFieldError('sex'); }}
                            className={`py-2.5 rounded-[10px] text-xs font-label font-semibold uppercase tracking-wider transition-all border ${
                                sex === option
                                    ? 'bg-primary/10 border-primary/40 text-primary'
                                    : 'bg-transparent border-outline-variant/30 text-on-surface-variant hover:border-primary/30 hover:text-on-surface'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                {fieldErrors.sex && <p className="mt-1 text-xs text-primary">{fieldErrors.sex}</p>}
            </div>
        </>
    );
}
