import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
    id?: number;
    name?: string;
    email?: string;
    season?: string;
    palette?: string[];
    is_premium?: boolean;
    free_scans_left?: number;
    credits?: number;
    age?: number;
    sex?: string;
    body_shape?: string;
    style_personality?: string;
}

interface AnalysisResult {
    id?: string;
    season: string;
    hex_color: string;
    undertone: string;
    confidence: number;
    palette: string[];
    avoid_colors?: string[];
    metal?: string;
    created_at?: string;
}

interface QuizData {
    body_shape?: string;
    style_personality?: string;
    completed_at?: string;
}

interface LumiqeStore {
    user: UserProfile | null;
    setUser: (user: UserProfile | null) => void;
    updateUser: (partial: Partial<UserProfile>) => void;
    currentAnalysis: AnalysisResult | null;
    setCurrentAnalysis: (result: AnalysisResult | null) => void;
    history: AnalysisResult[];
    addToHistory: (result: AnalysisResult) => void;
    quiz: QuizData;
    setQuiz: (data: Partial<QuizData>) => void;
    lang: string;
    setLang: (lang: string) => void;
    hydrated: boolean;
    setHydrated: (v: boolean) => void;
    reset: () => void;
}

const MAX_HISTORY = 10;

const initialState = {
    user: null as UserProfile | null,
    currentAnalysis: null as AnalysisResult | null,
    history: [] as AnalysisResult[],
    quiz: {} as QuizData,
    lang: 'en',
    hydrated: false,
};

export const useLumiqeStore = create<LumiqeStore>()(
    persist(
        (set) => ({
            ...initialState,

            setUser: (user) => set({ user }),

            updateUser: (partial) =>
                set((state) => ({
                    user: state.user
                        ? { ...state.user, ...partial }
                        : partial as UserProfile,
                })),

            setCurrentAnalysis: (result) =>
                set({ currentAnalysis: result }),

            addToHistory: (result) =>
                set((state) => ({
                    history: [result, ...state.history].slice(0, MAX_HISTORY),
                })),

            setQuiz: (data) =>
                set((state) => ({
                    quiz: { ...state.quiz, ...data },
                })),

            setLang: (lang) => set({ lang }),

            setHydrated: (v) => set({ hydrated: v }),

            reset: () =>
                set((state) => ({
                    user: null,
                    currentAnalysis: null,
                    history: [],
                    quiz: {},
                    hydrated: false,
                    lang: state.lang,
                })),
        }),
        {
            name: 'lumiqe-store',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHydrated(true);
                }
            },
        },
    ),
);

export type { UserProfile, AnalysisResult, QuizData, LumiqeStore };
