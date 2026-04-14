'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import PasswordStrengthMeter, { getPasswordStrength } from './PasswordStrengthMeter';
import SignUpFields from './SignUpFields';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    callbackUrl?: string;
    defaultSignUp?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s\-\+\(\)]{7,20}$/;

export default function SignInModal({ isOpen, onClose, callbackUrl = '/analyze', defaultSignUp = false }: SignInModalProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const [isSignUp, setIsSignUp] = useState(defaultSignUp);

    useEffect(() => {
        if (isOpen) setIsSignUp(defaultSignUp);
    }, [isOpen, defaultSignUp]);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [sex, setSex] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const passwordStrength = getPasswordStrength(password, t);

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setPhone('');
        setAge('');
        setSex('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setError('');
        setFieldErrors({});
        setIsSignUp(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const clearFieldError = (field: string) => setFieldErrors(p => ({ ...p, [field]: '' }));

    const validate = (): boolean => {
        const errors: Record<string, string> = {};
        if (isSignUp) {
            if (!firstName.trim()) errors.firstName = t('authFirstNameRequired');
            if (!lastName.trim()) errors.lastName = t('authLastNameRequired');
            if (phone && !PHONE_REGEX.test(phone)) errors.phone = t('authValidPhone');
            const ageNum = parseInt(age, 10);
            if (!age.trim()) {
                errors.age = t('authAgeRequired');
            } else if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
                errors.age = t('authAgeInvalid');
            }
            if (!sex) errors.sex = t('authSexRequired');
        }
        if (!email) {
            errors.email = t('authEmailRequired');
        } else if (!EMAIL_REGEX.test(email)) {
            errors.email = t('authValidEmail');
        }
        if (!password) {
            errors.password = t('authPasswordRequired');
        } else if (isSignUp && password.length < 8) {
            errors.password = t('authPasswordMinLength');
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setError('');
        setIsLoading(true);

        try {
            if (isSignUp) {
                const res = await fetch('/api/proxy/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: `${firstName.trim()} ${lastName.trim()}`,
                        email,
                        password,
                        phone: phone || undefined,
                    }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    let msg = t('authRegistrationFailed');
                    if (typeof data.detail === 'string') {
                        msg = data.detail;
                    } else if (Array.isArray(data.detail)) {
                        msg = data.detail.map((e: { msg: string }) => e.msg).join('. ');
                    } else if (typeof data.detail === 'object' && data.detail?.detail) {
                        msg = data.detail.detail;
                    }
                    throw new Error(msg);
                }
            }

            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                throw new Error(t('authInvalidCredentials'));
            } else {
                // Save age/sex after successful sign-up
                if (isSignUp && age && sex) {
                    try {
                        await fetch('/api/proxy/profile/quiz', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ age: parseInt(age, 10), sex }),
                        });
                    } catch {
                        // Non-blocking — profile data is supplementary
                    }
                }
                handleClose();
                router.push(isSignUp ? '/welcome' : callbackUrl);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t('authError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl });
    };

    const inputClass = (field: string) =>
        `w-full bg-surface-container/50 border rounded-2xl py-3 pl-10 pr-4 text-on-surface text-sm placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 transition-all ${
            fieldErrors[field]
                ? 'border-primary focus:ring-primary'
                : 'border-outline-variant/30 focus:border-primary focus:ring-primary'
        }`;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label={isSignUp ? t('authCreateAccount') : t('authWelcomeBack')}
                        className="relative w-full max-w-md bg-surface border border-primary/10 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-primary/10">
                            <div>
                                <h3 className="font-headline text-xl font-bold text-on-surface">
                                    {isSignUp ? t('authCreateAccount') : t('authWelcomeBack')}
                                </h3>
                                <p className="text-on-surface-variant text-sm mt-0.5">
                                    {isSignUp ? t('authJoinFree') : t('authSignInToAccount')}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {error && (
                                <div role="alert" aria-live="polite" className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-primary text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {/* Google */}
                            <button
                                onClick={handleGoogleSignIn}
                                className="w-full flex items-center justify-center gap-3 bg-white text-stone-900 font-semibold px-4 py-3 rounded-full hover:bg-stone-100 transition-colors mb-5 shadow-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {t('authContinueWithGoogle')}
                            </button>

                            <div className="relative flex items-center mb-5">
                                <div className="flex-grow border-t border-primary/10"></div>
                                <span className="flex-shrink-0 mx-4 text-on-surface-variant/50 text-xs uppercase tracking-wider">{t('authOr')}</span>
                                <div className="flex-grow border-t border-primary/10"></div>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-3.5">
                                <AnimatePresence>
                                    {isSignUp && (
                                        <motion.div
                                            key="signup-fields"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3.5 overflow-hidden"
                                        >
                                            <SignUpFields
                                                firstName={firstName}
                                                lastName={lastName}
                                                phone={phone}
                                                age={age}
                                                sex={sex}
                                                fieldErrors={fieldErrors}
                                                setFirstName={setFirstName}
                                                setLastName={setLastName}
                                                setPhone={setPhone}
                                                setAge={setAge}
                                                setSex={setSex}
                                                clearFieldError={clearFieldError}
                                                inputClass={inputClass}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email */}
                                <div>
                                    <div className="relative flex items-center">
                                        <Mail className="absolute left-3.5 w-4 h-4 text-on-surface-variant" />
                                        <input
                                            type="email"
                                            placeholder={t('authEmail')}
                                            aria-label={t('authEmail')}
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                                            onBlur={() => {
                                                if (email && !EMAIL_REGEX.test(email)) {
                                                    setFieldErrors(p => ({ ...p, email: t('authValidEmail') }));
                                                }
                                            }}
                                            className={inputClass('email')}
                                        />
                                    </div>
                                    {fieldErrors.email && <p className="mt-1 ml-2 text-xs text-primary">{fieldErrors.email}</p>}
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="relative flex items-center">
                                        <Lock className="absolute left-3.5 w-4 h-4 text-on-surface-variant" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder={t('authPassword')}
                                            aria-label={t('authPassword')}
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                                            className={`w-full bg-surface-container/50 border rounded-2xl py-3 pl-10 pr-10 text-on-surface text-sm placeholder-on-surface-variant/40 focus:outline-none focus:ring-1 transition-all ${
                                                fieldErrors.password
                                                    ? 'border-primary focus:ring-primary'
                                                    : 'border-outline-variant/30 focus:border-primary focus:ring-primary'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 text-on-surface-variant hover:text-on-surface transition-colors"
                                            aria-label={showPassword ? t('authHidePassword') : t('authShowPassword')}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {fieldErrors.password && <p className="mt-1 ml-2 text-xs text-primary">{fieldErrors.password}</p>}

                                    {isSignUp && (
                                        <PasswordStrengthMeter
                                            password={password}
                                            label={passwordStrength.label}
                                            color={passwordStrength.color}
                                            score={passwordStrength.score}
                                            passwordLabel={t('authPasswordLabel')}
                                        />
                                    )}
                                </div>

                                {!isSignUp && (
                                    <div className="text-right">
                                        <Link href="/forgot-password" onClick={handleClose} className="text-on-surface-variant hover:text-on-surface text-xs transition-colors">
                                            {t('authForgotPassword')}
                                        </Link>
                                    </div>
                                )}

                                <div className="pt-1">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 bg-primary-container hover:bg-primary text-on-primary-container font-label font-semibold py-3 rounded-full transition-colors shadow-[0_0_20px_-5px_rgba(240,191,98,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                {t('authProcessing')}
                                            </>
                                        ) : isSignUp ? t('authCreateAccount') : t('authSignInLink')}
                                    </button>
                                </div>

                                {isSignUp && (
                                    <p className="text-center text-on-surface-variant/50 text-xs">
                                        {t('authAgreeToTerms')}{' '}
                                        <Link href="/terms" onClick={handleClose} className="text-on-surface-variant hover:text-on-surface underline">{t('authTerms')}</Link>
                                        {' '}{t('authAnd')}{' '}
                                        <Link href="/privacy" onClick={handleClose} className="text-on-surface-variant hover:text-on-surface underline">{t('authPrivacyPolicy')}</Link>
                                    </p>
                                )}
                            </form>

                            <div className="mt-5 pt-4 border-t border-primary/10 flex flex-col items-center gap-3">
                                <button
                                    onClick={() => { setIsSignUp(!isSignUp); setError(''); setFieldErrors({}); }}
                                    className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
                                >
                                    {isSignUp ? t('authAlreadyHaveAccount') : t('authDontHaveAccount')}
                                    <span className="text-primary font-semibold">{isSignUp ? t('authSignInLink') : t('authSignUpLink')}</span>
                                </button>
                                <button
                                    onClick={() => { onClose(); router.push('/analyze'); }}
                                    className="text-on-surface-variant/50 hover:text-on-surface-variant text-xs transition-colors"
                                >
                                    {t('authContinueAsGuest')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
