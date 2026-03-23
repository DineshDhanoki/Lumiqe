'use client';

import React, { createContext, useContext } from 'react';

export interface ResultsContextType {
    season: string;
    palette: string[];
    hexColor: string;
    undertone: string;
    confidence: number;
    metal: string;
    contrastLevel: string;
    avoidColors: string[];
    analysisId: string;
}

const ResultsContext = createContext<ResultsContextType | null>(null);

interface ResultsProviderProps {
    value: ResultsContextType;
    children: React.ReactNode;
}

export function ResultsProvider({ value, children }: ResultsProviderProps) {
    return (
        <ResultsContext.Provider value={value}>
            {children}
        </ResultsContext.Provider>
    );
}

export function useResultsContext(): ResultsContextType {
    const context = useContext(ResultsContext);
    if (!context) {
        throw new Error(
            'useResultsContext must be used within a ResultsProvider'
        );
    }
    return context;
}
