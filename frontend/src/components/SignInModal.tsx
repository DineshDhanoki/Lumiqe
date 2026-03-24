'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    callbackUrl?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignInModal({ isOpen, onClose, callbackUrl = '/analyze' }: SignInModalProps) {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setError('');
        setFieldErrors({});
        setIsSignUp(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validateFields = (): boolean => {
        const errors: { email?: string; password?: string } = {};

        if (email && !EMAIL_REGEX.test(email)) {
            errors.email = 'Please enter a valid email address.';
        }

        if (isSignUp && password && password.length < MIN_PASSWORD_LENGTH) {
            errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || (isSignUp && !name)) {
            setError('Please fill in all required fields.');
            return;
        }

        if (!validateFields()) {
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            if (isSignUp) {
                // Register user via backend
                const res = await fetch('/api/proxy/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                if (!res.ok) {
                    const data = await res.json();
                    // Handle structured error: {detail: {error, detail}} or Pydantic {detail: [{msg}]}
                    let msg = 'Registration failed';
                    if (typeof data.detail === 'string') {
                        msg = data.detail;
                    } else if (Array.isArray(data.detail)) {
                        // Pydantic validation errors: [{loc, msg, type}]
                        msg = data.detail.map((e: { msg: string }) => e.msg).join('. ');
                    } else if (typeof data.detail === 'object' && data.detail?.detail) {
                        msg = data.detail.detail;
                    }
                    throw new Error(msg);
                }
            }

            // Log in user via NextAuth Credentials provider
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                throw new Error('Invalid email or password');
            } else {
                handleClose();
                router.push(callbackUrl);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred during authentication');
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
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Sign in to Lumiqe"
                        className="relative w-full max-w-md bg-stone-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h3 className="text-xl font-bold text-white">Welcome to Lumiqe</h3>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {error && (
                                <div role="alert" aria-live="polite" className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/20 flex items-start gap-3 text-red-200 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleGoogleSignIn}
                                className="w-full relative flex items-center justify-center gap-3 bg-white text-stone-900 font-bold px-4 py-3 rounded-full hover:bg-stone-200 transition-colors mb-6 shadow-sm"
                            >
                                {/* Minimalist Google 'G' using SVG */}
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </button>

                            <div className="relative flex items-center mb-6">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-white/40 text-sm">or sign in with email</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-4">
                                {isSignUp && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <div className="relative flex items-center">
                                            <svg className="absolute left-4 w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 4 0 00-7 7h14a7 4 0 00-7-7z" />
                                            </svg>
                                            <input
                                                type="text"
                                                placeholder="Full name"
                                                aria-label="Full name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                                <div>
                                    <div className="relative flex items-center">
                                        <Mail className="absolute left-4 w-5 h-5 text-white/40" />
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            aria-label="Email address"
                                            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (fieldErrors.email) {
                                                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                                                }
                                            }}
                                            onBlur={() => {
                                                if (email && !EMAIL_REGEX.test(email)) {
                                                    setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
                                                }
                                            }}
                                            className={`w-full bg-black/50 border rounded-full py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-1 transition-all ${
                                                fieldErrors.email
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                                    : 'border-white/10 focus:border-red-500 focus:ring-red-500'
                                            }`}
                                        />
                                    </div>
                                    {fieldErrors.email && (
                                        <p id="email-error" aria-live="polite" className="mt-1.5 ml-4 text-xs text-red-400">{fieldErrors.email}</p>
                                    )}
                                </div>
                                <div>
                                    <div className="relative flex items-center">
                                        <Lock className="absolute left-4 w-5 h-5 text-white/40" />
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            aria-label="Password"
                                            aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (fieldErrors.password) {
                                                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                                                }
                                            }}
                                            onBlur={() => {
                                                if (isSignUp && password && password.length < MIN_PASSWORD_LENGTH) {
                                                    setFieldErrors((prev) => ({
                                                        ...prev,
                                                        password: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
                                                    }));
                                                }
                                            }}
                                            className={`w-full bg-black/50 border rounded-full py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-1 transition-all ${
                                                fieldErrors.password
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                                    : 'border-white/10 focus:border-red-500 focus:ring-red-500'
                                            }`}
                                        />
                                    </div>
                                    {fieldErrors.password && (
                                        <p id="password-error" aria-live="polite" className="mt-1.5 ml-4 text-xs text-red-400">{fieldErrors.password}</p>
                                    )}
                                </div>

                                {!isSignUp && (
                                    <div className="text-right">
                                        <Link href="/reset-password" onClick={handleClose} className="text-white/50 hover:text-white text-sm transition-colors">
                                            Forgot your password?
                                        </Link>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full relative flex items-center justify-center bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-full transition-colors shadow-[0_0_20px_-5px_rgba(220,38,38,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <span className="animate-pulse">Processing...</span>
                                        ) : isSignUp ? (
                                            'Create Account'
                                        ) : (
                                            'Sign In'
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-4 text-center pb-2 border-b border-white/10">
                                <button
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-white/60 hover:text-white text-sm transition-colors mx-auto inline-block mb-4"
                                >
                                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                                </button>
                            </div>
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => {
                                        onClose();
                                        router.push('/analyze');
                                    }}
                                    className="text-white/60 hover:text-white text-sm font-medium transition-colors"
                                >
                                    Continue as Guest
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
