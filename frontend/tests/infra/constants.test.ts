/**
 * Lumiqe — Hardcoded Values Tests (Phase 4 TDD).
 *
 * Pricing and critical thresholds must be in a constants file, not inline JSX.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Pricing constants must be extracted', () => {
    const constantsPath = path.resolve(__dirname, '../../src/lib/constants.ts');

    it('constants.ts must exist', () => {
        expect(fs.existsSync(constantsPath)).toBe(true);
    });

    it('must define PRICING config', () => {
        const content = fs.readFileSync(constantsPath, 'utf-8');
        expect(content).toContain('PRICING');
    });

    it('must define pricing amounts', () => {
        const content = fs.readFileSync(constantsPath, 'utf-8');
        // Must contain the actual price values
        expect(content).toMatch(/149/);
        expect(content).toMatch(/29/);
    });
});

describe('TypeScript API interfaces must exist', () => {
    const typesPath = path.resolve(__dirname, '../../src/types/api.ts');

    it('api.ts types file must exist', () => {
        expect(fs.existsSync(typesPath)).toBe(true);
    });

    it('must define UserProfile interface', () => {
        const content = fs.readFileSync(typesPath, 'utf-8');
        expect(content).toContain('UserProfile');
    });

    it('must define AnalysisResult interface', () => {
        const content = fs.readFileSync(typesPath, 'utf-8');
        expect(content).toContain('AnalysisResult');
    });

    it('must define Product interface', () => {
        const content = fs.readFileSync(typesPath, 'utf-8');
        expect(content).toContain('Product');
    });
});
