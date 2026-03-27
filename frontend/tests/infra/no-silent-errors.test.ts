/**
 * Lumiqe — No Silent Error Swallowing Tests (Phase 3 TDD).
 *
 * Catch blocks must not silently discard errors.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Dashboard — no silent error swallowing', () => {
    const dashboardPath = path.resolve(
        __dirname, '../../src/app/dashboard/page.tsx'
    );
    const source = fs.readFileSync(dashboardPath, 'utf-8');

    it('must not have empty catch blocks with "ignore" comments', () => {
        // Match: .catch(() => { /* ignore */ }) or .catch(() => {})
        const silentCatches = source.match(/\.catch\(\s*\(\)\s*=>\s*\{\s*(\/\*.*?\*\/)?\s*\}\s*\)/g) || [];
        expect(silentCatches.length).toBe(0);
    });
});

describe('useHydrateStore — no silent error swallowing', () => {
    const storePath = path.resolve(
        __dirname, '../../src/lib/useHydrateStore.ts'
    );
    const source = fs.readFileSync(storePath, 'utf-8');

    it('must log or report errors, not silently return', () => {
        // The catch block should have console.error, Sentry, or similar
        // It must NOT just have "return;" with no logging
        const catchBlocks = source.match(/catch\s*\([^)]*\)\s*\{[^}]*\}/g) || [];
        for (const block of catchBlocks) {
            // Skip AbortError handling — that's intentional
            if (block.includes('AbortError')) continue;
            // Empty catch or just "return" is bad
            const stripped = block.replace(/catch\s*\([^)]*\)\s*\{/, '').replace(/}$/, '').trim();
            if (stripped === '' || stripped === 'return;') {
                expect.fail(
                    `useHydrateStore has a silent catch block: ${block.slice(0, 80)}...`
                );
            }
        }
    });
});
