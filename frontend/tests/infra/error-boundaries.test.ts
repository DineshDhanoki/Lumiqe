/**
 * Lumiqe — Error Boundary Coverage Tests (Phase 3 TDD).
 *
 * Every route that can throw must have an error.tsx boundary.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const appDir = path.resolve(__dirname, '../../src/app');

// Routes that MUST have error boundaries
const REQUIRED_ERROR_BOUNDARIES = [
    'pricing',
    'welcome',
    'wardrobe',
];

describe('Error boundaries — all routes covered', () => {
    REQUIRED_ERROR_BOUNDARIES.forEach((route) => {
        it(`${route}/ must have an error.tsx boundary`, () => {
            const routeDir = path.join(appDir, route);
            const errorFile = path.join(routeDir, 'error.tsx');

            // Route directory must exist
            expect(
                fs.existsSync(routeDir),
                `Route directory ${route}/ does not exist`
            ).toBe(true);

            // error.tsx must exist
            expect(
                fs.existsSync(errorFile),
                `${route}/error.tsx is missing — unhandled errors crash the app`
            ).toBe(true);
        });
    });

    it('share/[token]/ must have an error.tsx boundary', () => {
        const errorFile = path.join(appDir, 'share', '[token]', 'error.tsx');
        expect(
            fs.existsSync(errorFile),
            'share/[token]/error.tsx is missing'
        ).toBe(true);
    });

    it('all error.tsx files must export a default function', () => {
        const checkDir = (dir: string) => {
            const errorFile = path.join(dir, 'error.tsx');
            if (fs.existsSync(errorFile)) {
                const content = fs.readFileSync(errorFile, 'utf-8');
                expect(content).toContain('export default');
                expect(content).toContain("'use client'");
            }
        };

        REQUIRED_ERROR_BOUNDARIES.forEach((route) => {
            checkDir(path.join(appDir, route));
        });
    });
});
