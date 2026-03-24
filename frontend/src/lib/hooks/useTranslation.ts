import { useLumiqeStore } from '@/lib/store';
import { translations } from '@/lib/i18n';

export function useTranslation() {
    const lang = useLumiqeStore(s => s.lang);

    function t(key: string): string {
        return translations[lang]?.[key] || translations['en']?.[key] || key;
    }

    return { t, lang };
}
