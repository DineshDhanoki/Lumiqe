import { describe, it, expect } from 'vitest';
import { LANGUAGES, translations } from '../../src/lib/i18n';

describe('i18n — LANGUAGES', () => {
    it('LANGUAGES array has 10 entries', () => {
        expect(LANGUAGES).toHaveLength(10);
    });

    it('each language entry has code, label, and flag fields', () => {
        for (const lang of LANGUAGES) {
            expect(lang).toHaveProperty('code');
            expect(lang).toHaveProperty('label');
            expect(lang).toHaveProperty('flag');
            expect(typeof lang.code).toBe('string');
            expect(typeof lang.label).toBe('string');
            expect(typeof lang.flag).toBe('string');
        }
    });

    it('every language code in LANGUAGES has a translations entry', () => {
        for (const lang of LANGUAGES) {
            expect(translations).toHaveProperty(lang.code);
            expect(typeof translations[lang.code]).toBe('object');
        }
    });
});

describe('i18n — translations', () => {
    it('English translations exist', () => {
        expect(translations['en']).toBeDefined();
        expect(Object.keys(translations['en']).length).toBeGreaterThan(0);
    });

    it('Hindi translations exist', () => {
        expect(translations['hi']).toBeDefined();
        expect(Object.keys(translations['hi']).length).toBeGreaterThan(0);
    });

    const requiredKeys = [
        'backHome',
        'scanTitle',
        'uploadPhoto',
        'analyzing',
        'dashboardTitle',
        'yourSeason',
        'accountTitle',
        'productFeed',
        'howItWorksTitle',
        'howItWorksSubtitle',
        'howItWorksStep1Title',
        'howItWorksStep1Desc',
        'howItWorksStep2Title',
        'howItWorksStep2Desc',
        'howItWorksStep3Title',
        'howItWorksStep3Desc',
        'backToDashboard',
    ];

    it('"en" has all required keys', () => {
        for (const key of requiredKeys) {
            expect(translations['en']).toHaveProperty(key);
            expect(typeof translations['en'][key]).toBe('string');
        }
    });

    it('"hi" has all the same keys as "en"', () => {
        const enKeys = Object.keys(translations['en']);
        for (const key of enKeys) {
            expect(
                translations['hi'],
                `Hindi is missing key: "${key}"`,
            ).toHaveProperty(key);
        }
    });

    it('required keys in "en" have non-empty string values', () => {
        for (const key of requiredKeys) {
            expect(translations['en'][key].length).toBeGreaterThan(0);
        }
    });

    const howItWorksKeys = [
        'howItWorksTitle',
        'howItWorksSubtitle',
        'howItWorksStep1Title',
        'howItWorksStep1Desc',
        'howItWorksStep2Title',
        'howItWorksStep2Desc',
        'howItWorksStep3Title',
        'howItWorksStep3Desc',
        'backToDashboard',
    ];

    it('all 10 languages have howItWorks and backToDashboard keys', () => {
        for (const { code } of LANGUAGES) {
            for (const key of howItWorksKeys) {
                expect(
                    translations[code],
                    `Language "${code}" is missing key: "${key}"`,
                ).toHaveProperty(key);
                expect(
                    translations[code][key].length,
                    `Language "${code}" has empty value for: "${key}"`,
                ).toBeGreaterThan(0);
            }
        }
    });

    it('howItWorks translations differ across languages', () => {
        const enTitle = translations['en']['howItWorksTitle'];
        const esTitle = translations['es']['howItWorksTitle'];
        const hiTitle = translations['hi']['howItWorksTitle'];
        expect(esTitle).not.toBe(enTitle);
        expect(hiTitle).not.toBe(enTitle);
    });
});
