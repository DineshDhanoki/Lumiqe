import { describe, it, expect, vi, afterEach } from 'vitest';
import { compressImage } from '../../src/lib/imageUtils';

afterEach(() => vi.restoreAllMocks());

describe('compressImage', () => {
    it('returns the same file when under the default size limit', async () => {
        const small = new File(['small content'], 'photo.jpg', { type: 'image/jpeg' });
        expect(await compressImage(small)).toBe(small);
    });

    it('returns the same file when exactly at the size limit', async () => {
        const content = new Uint8Array(1.5 * 1024 * 1024);
        const file = new File([content], 'photo.jpg', { type: 'image/jpeg' });
        expect(await compressImage(file)).toBe(file);
    });

    it('respects a custom maxBytes parameter — small file stays the same', async () => {
        const file = new File(['hello'], 'photo.jpg', { type: 'image/jpeg' });
        expect(await compressImage(file, 10)).toBe(file);
    });

    it('falls back to original file when Image fires onerror', async () => {
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

        const mockImg = {
            onload: null as (() => void) | null,
            onerror: null as (() => void) | null,
            set src(_: string) { this.onerror?.(); },
            width: 0, height: 0,
        };
        vi.stubGlobal('Image', function() { return mockImg; });

        const content = new Uint8Array(2 * 1024 * 1024);
        const large = new File([content], 'large.jpg', { type: 'image/jpeg' });
        const result = await compressImage(large);

        expect(result).toBe(large); // onerror path returns original
    });

    it('returns a compressed File when canvas compression succeeds', async () => {
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');

        const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' });
        const mockCanvas = {
            width: 0, height: 0,
            getContext: vi.fn(() => ({ drawImage: vi.fn() })),
            toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(mockBlob)),
        };
        vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
            if (tag === 'canvas') return mockCanvas as unknown as HTMLElement;
            return document.createElement.call(document, tag);
        });

        const mockImg = {
            onload: null as (() => void) | null,
            onerror: null as (() => void) | null,
            set src(_: string) { setTimeout(() => this.onload?.(), 0); },
            width: 100, height: 100,
        };
        vi.stubGlobal('Image', function() { return mockImg; });

        const content = new Uint8Array(2 * 1024 * 1024);
        const large = new File([content], 'large.png', { type: 'image/png' });
        const result = await compressImage(large);

        expect(result).toBeInstanceOf(File);
        expect(result.name).toMatch(/\.jpg$/);
    });
});
