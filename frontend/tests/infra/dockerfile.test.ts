/**
 * Lumiqe — Frontend Dockerfile Existence Test (Phase 2 TDD).
 *
 * Verifies that the frontend has a Dockerfile for containerized builds.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Frontend Dockerfile', () => {
    const dockerfilePath = path.resolve(__dirname, '../../Dockerfile');

    it('must exist for K8s deployment', () => {
        expect(fs.existsSync(dockerfilePath)).toBe(true);
    });

    it('must use multi-stage build for smaller image', () => {
        const content = fs.readFileSync(dockerfilePath, 'utf-8');
        // Multi-stage builds have multiple FROM instructions
        const fromCount = (content.match(/^FROM /gm) || []).length;
        expect(fromCount).toBeGreaterThanOrEqual(2);
    });

    it('must not run as root (has USER directive)', () => {
        const content = fs.readFileSync(dockerfilePath, 'utf-8');
        expect(content).toMatch(/^USER\s+/m);
    });

    it('must expose port 3000', () => {
        const content = fs.readFileSync(dockerfilePath, 'utf-8');
        expect(content).toContain('EXPOSE 3000');
    });
});
