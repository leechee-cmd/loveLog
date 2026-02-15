import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';
import { ref } from 'vue';

export interface AppSettings {
  language: 'zh' | 'en';
  theme: 'system' | 'light' | 'dark';
  security: {
    pinEnabled: boolean;
    pinHash: string;
  };
  customTags: string[];
}

// 简单哈希函数 (生产环境可用更安全的算法)
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export const useSettingsStore = defineStore('settings', () => {
  // 持久化设置
  const settings = useStorage<AppSettings>('lovelog-settings', {
    language: 'zh',
    theme: 'system',
    security: {
      pinEnabled: false,
      pinHash: ''
    },
    customTags: []
  });

  // 应用解锁状态 (非持久化，每次启动都需重新验证)
  const isUnlocked = ref(false);

  // Language management
  function setLanguage(lang: 'zh' | 'en') {
    settings.value.language = lang;
  }

  // Theme management
  function setTheme(theme: 'light' | 'dark' | 'system') {
    settings.value.theme = theme;
  }

  // 标签管理
  function addTag(tag: string) {
    if (!tag) return;
    if (!settings.value.customTags.includes(tag)) {
      settings.value.customTags.push(tag);
    }
  }

  function removeTag(tag: string) {
    settings.value.customTags = settings.value.customTags.filter(t => t !== tag);
  }

  function resetTags() {
    settings.value.customTags = [];
  }

  // PIN 锁管理
  function setPin(pin: string) {
    if (pin.length !== 4) return false;
    settings.value.security.pinHash = hashPin(pin);
    settings.value.security.pinEnabled = true;
    isUnlocked.value = true; // 设置 PIN 后自动解锁
    return true;
  }

  function verifyPin(pin: string): boolean {
    if (!settings.value.security.pinEnabled) {
      isUnlocked.value = true;
      return true;
    }
    const valid = hashPin(pin) === settings.value.security.pinHash;
    if (valid) {
      isUnlocked.value = true;
    }
    return valid;
  }

  function clearPin() {
    settings.value.security.pinEnabled = false;
    settings.value.security.pinHash = '';
    isUnlocked.value = true;
  }

  // 检查是否需要显示锁屏
  function checkLockStatus() {
    if (!settings.value.security.pinEnabled) {
      isUnlocked.value = true;
    }
    // 如果启用了 PIN 且未解锁，保持锁定状态
  }

  return {
    settings,
    isUnlocked,
    setLanguage,
    setTheme,
    addTag,
    removeTag,
    resetTags,
    setPin,
    verifyPin,
    clearPin,
    checkLockStatus
  };
});
