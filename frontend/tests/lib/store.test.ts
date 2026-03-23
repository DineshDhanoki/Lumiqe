import { describe, it, expect, beforeEach } from 'vitest';
import { useLumiqeStore } from '../../src/lib/store';
import type { AnalysisResult } from '../../src/lib/store';

function makeAnalysis(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
    return {
        season: 'Winter',
        hex_color: '#FAEBD7',
        undertone: 'cool',
        confidence: 0.92,
        palette: ['#000000', '#FFFFFF'],
        ...overrides,
    };
}

describe('useLumiqeStore', () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        useLumiqeStore.setState({
            user: null,
            currentAnalysis: null,
            history: [],
            quiz: {},
            lang: 'en',
            hydrated: false,
        });
    });

    /* ─── User state ──────────────────────────────────────────────── */

    describe('user state', () => {
        it('defaults to null', () => {
            expect(useLumiqeStore.getState().user).toBeNull();
        });

        it('setUser sets the user', () => {
            const user = { id: 1, name: 'Alice', email: 'a@b.com' };
            useLumiqeStore.getState().setUser(user);
            expect(useLumiqeStore.getState().user).toEqual(user);
        });

        it('setUser(null) clears the user', () => {
            useLumiqeStore.getState().setUser({ id: 1, name: 'Alice' });
            useLumiqeStore.getState().setUser(null);
            expect(useLumiqeStore.getState().user).toBeNull();
        });

        it('updateUser merges partial into existing user', () => {
            useLumiqeStore.getState().setUser({ id: 1, name: 'Alice', email: 'a@b.com' });
            useLumiqeStore.getState().updateUser({ name: 'Bob' });
            const user = useLumiqeStore.getState().user;
            expect(user?.name).toBe('Bob');
            expect(user?.email).toBe('a@b.com');
        });

        it('updateUser creates user from partial when user is null', () => {
            useLumiqeStore.getState().updateUser({ name: 'Charlie' });
            expect(useLumiqeStore.getState().user).toEqual({ name: 'Charlie' });
        });
    });

    /* ─── Analysis history ────────────────────────────────────────── */

    describe('analysis history', () => {
        it('starts with empty history', () => {
            expect(useLumiqeStore.getState().history).toEqual([]);
        });

        it('addToHistory adds an item', () => {
            const analysis = makeAnalysis();
            useLumiqeStore.getState().addToHistory(analysis);
            expect(useLumiqeStore.getState().history).toHaveLength(1);
            expect(useLumiqeStore.getState().history[0]).toEqual(analysis);
        });

        it('addToHistory puts newest first', () => {
            const first = makeAnalysis({ season: 'Spring' });
            const second = makeAnalysis({ season: 'Autumn' });
            useLumiqeStore.getState().addToHistory(first);
            useLumiqeStore.getState().addToHistory(second);
            expect(useLumiqeStore.getState().history[0].season).toBe('Autumn');
            expect(useLumiqeStore.getState().history[1].season).toBe('Spring');
        });

        it('caps history at 10 items', () => {
            for (let i = 0; i < 12; i++) {
                useLumiqeStore.getState().addToHistory(makeAnalysis({ season: `Season-${i}` }));
            }
            expect(useLumiqeStore.getState().history).toHaveLength(10);
            // Most recent should be last added
            expect(useLumiqeStore.getState().history[0].season).toBe('Season-11');
        });
    });

    /* ─── Quiz ────────────────────────────────────────────────────── */

    describe('quiz', () => {
        it('defaults to empty object', () => {
            expect(useLumiqeStore.getState().quiz).toEqual({});
        });

        it('setQuiz merges with existing quiz data', () => {
            useLumiqeStore.getState().setQuiz({ body_shape: 'hourglass' });
            useLumiqeStore.getState().setQuiz({ style_personality: 'classic' });
            const quiz = useLumiqeStore.getState().quiz;
            expect(quiz.body_shape).toBe('hourglass');
            expect(quiz.style_personality).toBe('classic');
        });
    });

    /* ─── Language ────────────────────────────────────────────────── */

    describe('language', () => {
        it('defaults to en', () => {
            expect(useLumiqeStore.getState().lang).toBe('en');
        });

        it('setLang updates the language', () => {
            useLumiqeStore.getState().setLang('fr');
            expect(useLumiqeStore.getState().lang).toBe('fr');
        });
    });

    /* ─── Reset ───────────────────────────────────────────────────── */

    describe('reset', () => {
        it('clears user, analysis, history, quiz, and hydrated', () => {
            useLumiqeStore.getState().setUser({ id: 1, name: 'Alice' });
            useLumiqeStore.getState().addToHistory(makeAnalysis());
            useLumiqeStore.getState().setQuiz({ body_shape: 'hourglass' });
            useLumiqeStore.getState().setHydrated(true);
            useLumiqeStore.getState().setCurrentAnalysis(makeAnalysis());

            useLumiqeStore.getState().reset();

            const state = useLumiqeStore.getState();
            expect(state.user).toBeNull();
            expect(state.currentAnalysis).toBeNull();
            expect(state.history).toEqual([]);
            expect(state.quiz).toEqual({});
            expect(state.hydrated).toBe(false);
        });

        it('preserves lang after reset', () => {
            useLumiqeStore.getState().setLang('de');
            useLumiqeStore.getState().reset();
            expect(useLumiqeStore.getState().lang).toBe('de');
        });
    });

    /* ─── Hydration ───────────────────────────────────────────────── */

    describe('hydration', () => {
        it('defaults to false', () => {
            expect(useLumiqeStore.getState().hydrated).toBe(false);
        });

        it('setHydrated sets hydrated to true', () => {
            useLumiqeStore.getState().setHydrated(true);
            expect(useLumiqeStore.getState().hydrated).toBe(true);
        });
    });
});
