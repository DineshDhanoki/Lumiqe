'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
    const [rememberMe, setRememberMe] = useState(false);
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
        setRememberMe(false);
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
                if (isSignUp && age && sex) {
                    try {
                        await fetch('/api/proxy/profile/quiz', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ age: parseInt(age, 10), sex }),
                        });
                    } catch {
                        // Non-blocking
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
                        className="relative w-full max-w-md rounded-[24px] shadow-2xl overflow-y-auto max-h-[90vh]"
                        style={{ background: 'rgba(19, 19, 21, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '0.5px solid rgba(196, 151, 62, 0.2)' }}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors z-10"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>

                        <div className="px-8 md:px-12 pt-10 pb-10">
                            {/* Logo */}
                            <div className="flex justify-center mb-12">
                                <span className="font-display italic text-3xl tracking-tighter text-primary">Lumiqe</span>
                            </div>

                            {/* Header */}
                            <div className="mb-10 text-center">
                                <h3 className="font-display italic text-4xl text-on-surface mb-2">
                                    {isSignUp ? t('authCreateAccount') : t('authWelcomeBack')}
                                </h3>
                                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60">
                                    {isSignUp ? t('authJoinFree') : 'Enter your credentials to access the atelier'}
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div role="alert" aria-live="polite" className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-primary text-sm">
                                    <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
                                    <p>{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleAuth} className="space-y-8">
                                {/* Sign-up extra fields */}
                                <AnimatePresence>
                                    {isSignUp && (
                                        <motion.div
                                            key="signup-fields"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-8 overflow-hidden"
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
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email */}
                                <div>
                                    <div className="floating-label-group" style={{ borderBottomColor: fieldErrors.email ? '#f0bf62' : undefined }}>
                                        <input
                                            type="email"
                                            placeholder=" "
                                            id="modal-email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                                            onBlur={() => {
                                                if (email && !EMAIL_REGEX.test(email)) {
                                                    setFieldErrors(p => ({ ...p, email: t('authValidEmail') }));
                                                }
                                            }}
                                            style={{ borderBottomColor: fieldErrors.email ? '#f0bf62' : undefined }}
                                        />
                                        <label htmlFor="modal-email" className="uppercase tracking-widest text-xs">{t('authEmail')}</label>
                                    </div>
                                    {fieldErrors.email && <p className="mt-1 text-xs text-primary">{fieldErrors.email}</p>}
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="floating-label-group relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder=" "
                                            id="modal-password"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                                            style={{ borderBottomColor: fieldErrors.password ? '#f0bf62' : undefined, paddingRight: '2rem' }}
                                        />
                                        <label htmlFor="modal-password" className="uppercase tracking-widest text-xs">{t('authPassword')}</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-0 bottom-2 text-on-surface-variant/60 hover:text-primary transition-colors"
                                            aria-label={showPassword ? t('authHidePassword') : t('authShowPassword')}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    {fieldErrors.password && <p className="mt-1 text-xs text-primary">{fieldErrors.password}</p>}
                                    {isSignUp && (
                                        <div className="mt-3">
                                            <PasswordStrengthMeter
                                                password={password}
                                                label={passwordStrength.label}
                                                color={passwordStrength.color}
                                                score={passwordStrength.score}
                                                passwordLabel={t('authPasswordLabel')}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Remember me + Forgot password (sign-in only) */}
                                {!isSignUp && (
                                    <div className="flex items-center justify-between font-label text-[10px] uppercase tracking-widest">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="w-3 h-3 bg-transparent border-outline-variant/50 rounded-sm text-primary focus:ring-offset-0 focus:ring-0"
                                            />
                                            <span className="text-on-surface-variant/60 group-hover:text-on-surface-variant transition-colors">Remember me</span>
                                        </label>
                                        <Link
                                            href="/forgot-password"
                                            onClick={handleClose}
                                            className="text-primary/70 hover:text-primary transition-colors"
                                        >
                                            {t('authForgotPassword')}
                                        </Link>
                                    </div>
                                )}

                                {/* Terms (sign-up only) */}
                                {isSignUp && (
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            required
                                            className="w-4 h-4 mt-0.5 bg-transparent border-outline-variant/50 rounded-sm text-primary focus:ring-0 focus:ring-offset-0"
                                        />
                                        <label htmlFor="terms" className="text-[11px] text-on-surface-variant/60 font-label leading-relaxed uppercase tracking-wider">
                                            {t('authAgreeToTerms')}{' '}
                                            <Link href="/terms" onClick={handleClose} className="text-primary hover:text-primary-container transition-colors">{t('authTerms')}</Link>
                                            {' '}{t('authAnd')}{' '}
                                            <Link href="/privacy" onClick={handleClose} className="text-primary hover:text-primary-container transition-colors">{t('authPrivacyPolicy')}</Link>
                                        </label>
                                    </div>
                                )}

                                {/* Submit */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-container to-primary text-on-primary font-headline font-bold py-4 rounded-[10px] uppercase tracking-[0.15em] text-xs transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
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

                                {/* Divider + Google (sign-in only) */}
                                {!isSignUp && (
                                    <>
                                        <div className="relative flex items-center">
                                            <div className="flex-grow border-t border-outline-variant/30" />
                                            <span className="flex-shrink mx-4 font-label text-[9px] uppercase tracking-[0.3em] text-on-surface-variant/50">Or continue with</span>
                                            <div className="flex-grow border-t border-outline-variant/30" />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleGoogleSignIn}
                                            className="w-full flex items-center justify-center gap-3 bg-white/5 py-4 rounded-[10px] font-headline font-semibold uppercase tracking-[0.1em] text-xs text-on-surface hover:bg-white/10 transition-colors"
                                            style={{ border: '0.5px solid rgba(196,151,62,0.2)' }}
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            {t('authContinueWithGoogle')}
                                        </button>
                                    </>
                                )}
                            </form>

                            {/* Footer */}
                            <div className="mt-12 pt-6 border-t border-primary/10 text-center space-y-3">
                                <p className="font-label text-xs text-on-surface-variant/60">
                                    {isSignUp ? t('authAlreadyHaveAccount') : t('authDontHaveAccount')}{' '}
                                    <button
                                        onClick={() => { setIsSignUp(!isSignUp); setError(''); setFieldErrors({}); }}
                                        className="text-primary font-semibold ml-1 hover:underline underline-offset-4 decoration-primary/30 transition-all"
                                    >
                                        {isSignUp ? t('authSignInLink') : t('authSignUpLink')}
                                    </button>
                                </p>
                                <button
                                    onClick={() => { onClose(); router.push('/analyze'); }}
                                    className="text-on-surface-variant/40 hover:text-on-surface-variant text-xs transition-colors font-label uppercase tracking-wider"
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
