'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
    title: string;
    description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        title: 'Your Color Season',
        description:
            'We analyzed your skin tone and determined your seasonal color palette.',
    },
    {
        title: 'Browse Your Palette',
        description:
            'Explore colors that complement your natural tones and find your best shades.',
    },
    {
        title: 'Save Favorites',
        description:
            'Tap the heart icon on any product to save it to your wishlist for later.',
    },
    {
        title: 'Try AI Stylist',
        description:
            'Chat with our AI stylist for personalized outfit and color recommendations.',
    },
];

const STORAGE_KEY = 'lumiqe-onboarding-done';

export default function OnboardingToast() {
    const [currentStep, setCurrentStep] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const alreadyDone = localStorage.getItem(STORAGE_KEY);
        if (!alreadyDone) {
            setVisible(true);
        }
    }, []);

    const dismiss = useCallback(() => {
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    }, []);

    const handleNext = useCallback(() => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            // Auto-dismiss after the last step
            dismiss();
        }
    }, [currentStep, dismiss]);

    if (!visible) return null;

    const step = ONBOARDING_STEPS[currentStep];

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-6 right-6 z-50 w-80 rounded-xl bg-white p-5 shadow-xl border border-gray-100"
                    role="dialog"
                    aria-label="Onboarding guide"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-xs font-medium text-violet-600 uppercase tracking-wide mb-1">
                                Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                            </p>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                {step.title}
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Progress dots */}
                    <div className="flex items-center gap-1.5 mt-4">
                        {ONBOARDING_STEPS.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 rounded-full transition-all ${
                                    index === currentStep
                                        ? 'w-4 bg-violet-600'
                                        : index < currentStep
                                          ? 'w-1.5 bg-violet-300'
                                          : 'w-1.5 bg-gray-200'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4">
                        <button
                            type="button"
                            onClick={dismiss}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Dismiss
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition-colors"
                        >
                            {currentStep < ONBOARDING_STEPS.length - 1
                                ? 'Next'
                                : 'Get Started'}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
