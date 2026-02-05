import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  security: {
    pinEnabled: boolean;
    pinHash: string;
  };
  customTags: string[];
}

export const useSettingsStore = defineStore('settings', () => {
  // Persist to localStorage
  const settings = useStorage<AppSettings>('lovelog-settings', {
    theme: 'system',
    security: {
      pinEnabled: false,
      pinHash: ''
    },
    customTags: []
  });

  function addTag(tag: string) {
    if (!tag) return;
    if (!settings.value.customTags.includes(tag)) {
      settings.value.customTags.push(tag);
    }
  }

  function removeTag(tag: string) {
    settings.value.customTags = settings.value.customTags.filter(t => t !== tag);
  }

  return {
    settings,
    addTag,
    removeTag
  };
});
