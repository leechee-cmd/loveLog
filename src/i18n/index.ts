import { createI18n } from 'vue-i18n';
import en from '../locales/en.json';
import zh from '../locales/zh.json';

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getSavedLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    zh
  }
});

function getSavedLocale(): string {
  try {
    const saved = localStorage.getItem('lovelog-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.language) return parsed.language;
    }
  } catch (e) {
    console.error('Failed to load locale setting', e);
  }
  // Default to zh or browser language if needed
  return 'zh';
}

export default i18n;
