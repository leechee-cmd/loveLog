<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLogStore } from '../stores/logStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useDialog } from '../composables/useDialog';
import PinLock from '../components/business/PinLock.vue';

const logStore = useLogStore();
const settingsStore = useSettingsStore();
const { t } = useI18n();
const { showConfirm, showAlert } = useDialog();
const fileInput = ref<HTMLInputElement | null>(null);
const newTagInput = ref('');
const showPinSetup = ref(false);

const currentLangLabel = computed(() => {
  return settingsStore.settings.language === 'zh' ? '简体中文' : 'English';
});

const toggleLanguage = () => {
  const newLang = settingsStore.settings.language === 'zh' ? 'en' : 'zh';
  settingsStore.setLanguage(newLang);
};

const handleAddTag = () => {
  const tag = newTagInput.value.trim();
  if (tag) {
    settingsStore.addTag(tag);
    newTagInput.value = '';
  }
};

const handleRemoveTag = async (tag: string) => {
  const ok = await showConfirm({ message: t('settings.confirm.remove_tag', { tag }) });
  if (ok) settingsStore.removeTag(tag);
};

// PIN 相关
const handleTogglePin = async () => {
  if (settingsStore.settings.security.pinEnabled) {
    // 关闭 PIN
    const ok = await showConfirm({ message: t('settings.confirm.disable_pin') });
    if (ok) settingsStore.clearPin();
  } else {
    // 开启 PIN，显示设置界面
    showPinSetup.value = true;
  }
};

const handlePinSetupSuccess = () => {
  showPinSetup.value = false;
};

const handlePinSetupCancel = () => {
  showPinSetup.value = false;
};

const handleExport = async () => {
  const data = await logStore.exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lovelog-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const triggerImport = () => {
  fileInput.value?.click();
};

const handleImportFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const text = e.target?.result as string;
    try {
      await logStore.importData(text, 'merge');
      await showAlert({ message: t('settings.confirm.import_success') });
    } catch (err) {
      await showAlert({ message: t('settings.confirm.import_fail') });
    }
  };
  reader.readAsText(file);
};

const handleClear = async () => {
  const ok = await showConfirm({ 
    message: t('settings.confirm.wipe_warning'), 
    danger: true 
  });
  if (!ok) return;
  await logStore.clearAllData();
};

const handleGenerateDemo = async () => {
  const ok = await showConfirm({ message: t('settings.confirm.generate_warning') });
  if (ok) {
    await logStore.generateDemoData();
    await showAlert({ message: t('settings.confirm.demo_success') });
  }
};
</script>

<template>
  <div class="h-full bg-surface-light dark:bg-surface-dark">
    <!-- PIN Setup Overlay -->
    <PinLock 
      v-if="showPinSetup"
      mode="setup"
      @success="handlePinSetupSuccess"
      @cancel="handlePinSetupCancel"
    />

    <div class="h-full flex flex-col pt-10 pb-6 safe-top safe-bottom overflow-hidden">
    <!-- Header -->
    <header class="px-6 mb-8 flex items-center gap-4 flex-none">
      <RouterLink to="/" class="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
        <span class="material-symbols-rounded text-2xl">arrow_back</span>
      </RouterLink>
      <h1 class="text-2xl font-bold">{{ t('settings.title') }}</h1>
    </header>

    <main class="flex-1 px-6 space-y-8 animate-fade-in overflow-y-auto no-scrollbar pb-10">
      
      <!-- General Section -->
      <section>
        <h2 class="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-4">{{ t('settings.general') }}</h2>
        <div class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-1">
          <button @click="toggleLanguage" class="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-left">
            <div class="flex items-center gap-4">
              <span class="material-symbols-rounded text-primary text-xl">language</span>
              <div>
                <div class="font-medium">{{ t('settings.language') }}</div>
                <div class="text-xs text-neutral-500">{{ t('settings.language_desc') }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 text-sm text-neutral-500 font-medium">
               <span>{{ currentLangLabel }}</span>
               <span class="material-symbols-rounded text-neutral-400">swap_horiz</span>
            </div>
          </button>
        </div>
        
        <div class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-1 mt-4">
          <div class="p-4 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <span class="material-symbols-rounded text-primary text-xl">dark_mode</span>
              <div class="font-medium">{{ t('settings.theme') }}</div>
            </div>
            <div class="flex bg-neutral-200 dark:bg-neutral-800 rounded-lg p-1">
              <button 
                @click="settingsStore.setTheme('light')"
                class="p-1.5 rounded-md transition-all flex items-center justify-center"
                :class="settingsStore.settings.theme === 'light' ? 'bg-white dark:bg-neutral-600 shadow-sm text-primary' : 'text-neutral-500'"
              >
                <span class="material-symbols-rounded text-lg">light_mode</span>
              </button>
              <button 
                @click="settingsStore.setTheme('system')"
                class="p-1.5 rounded-md transition-all flex items-center justify-center"
                :class="settingsStore.settings.theme === 'system' ? 'bg-white dark:bg-neutral-600 shadow-sm text-primary' : 'text-neutral-500'"
              >
                <span class="material-symbols-rounded text-lg">contrast</span>
              </button>
              <button 
                @click="settingsStore.setTheme('dark')"
                class="p-1.5 rounded-md transition-all flex items-center justify-center"
                :class="settingsStore.settings.theme === 'dark' ? 'bg-white dark:bg-neutral-600 shadow-sm text-primary' : 'text-neutral-500'"
              >
                <span class="material-symbols-rounded text-lg">dark_mode</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Security Section -->
      <section>
        <h2 class="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-4">{{ t('settings.security') }}</h2>
        <div class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-1">
          <button @click="handleTogglePin" class="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-left">
            <div class="flex items-center gap-4">
              <span class="material-symbols-rounded text-primary text-xl" style="font-variation-settings: 'FILL' 1;">lock</span>
              <div>
                <div class="font-medium">{{ t('settings.pin_lock') }}</div>
                <div class="text-xs text-neutral-500">{{ settingsStore.settings.security.pinEnabled ? t('settings.pin_enabled') : t('settings.pin_desc') }}</div>
              </div>
            </div>
            <div 
              class="w-12 h-7 rounded-full transition-all duration-200 flex items-center px-1"
              :class="settingsStore.settings.security.pinEnabled ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-600'"
            >
              <div 
                class="w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                :class="settingsStore.settings.security.pinEnabled ? 'translate-x-5' : 'translate-x-0'"
              ></div>
            </div>
          </button>
        </div>
      </section>

      <!-- Custom Tags Section -->
      <section>
        <h2 class="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-4">{{ t('settings.custom_tags') }}</h2>
        <div class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-4 space-y-4">
           <!-- Tag List -->
           <div class="flex flex-wrap gap-2">
              <div v-if="settingsStore.settings.customTags.length === 0" class="text-neutral-400 text-sm py-2">
                 No custom tags added.
              </div>
              <template v-for="tag in settingsStore.settings.customTags" :key="tag">
                 <div class="pl-3 pr-2 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow-sm border border-transparent flex items-center gap-1.5">
                    <span class="leading-none pb-0.5">{{ tag }}</span>
                    <button @click="handleRemoveTag(tag)" class="rounded-full w-4 h-4 flex items-center justify-center bg-black/5 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors">
                       <span class="material-symbols-rounded text-[10px] font-bold">close</span>
                    </button>
                 </div>
              </template>
           </div>
           
           <!-- Input form -->
           <div class="flex gap-2">
              <input 
                v-model="newTagInput"
                @keyup.enter="handleAddTag"
                type="text" 
                :placeholder="t('settings.add_tag_placeholder')" 
                class="flex-1 bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-neutral-400"
              />
              <button 
                @click="handleAddTag"
                class="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {{ t('settings.add') }}
              </button>
           </div>
        </div>
      </section>

      <!-- Backup Section -->
      <section>
        <h2 class="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-4">{{ t('settings.backup') }}</h2>
        <div class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-1 space-y-1">
          <button @click="handleExport" class="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-left group">
            <div class="flex items-center gap-4">
              <span class="material-symbols-rounded text-primary text-xl">download</span>
              <div>
                <div class="font-medium">{{ t('settings.export') }}</div>
                <div class="text-xs text-neutral-500">{{ t('settings.export_desc') }}</div>
              </div>
            </div>
            <span class="material-symbols-rounded text-neutral-400">chevron_right</span>
          </button>
          
          <button @click="triggerImport" class="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-left group">
            <div class="flex items-center gap-4">
               <span class="material-symbols-rounded text-primary text-xl">upload</span>
              <div>
                <div class="font-medium">{{ t('settings.import') }}</div>
                <div class="text-xs text-neutral-500">{{ t('settings.import_desc') }}</div>
              </div>
            </div>
             <span class="material-symbols-rounded text-neutral-400">chevron_right</span>
          </button>
          
           <!-- Hidden File Input -->
           <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleImportFile"
          />
        </div>
      </section>

      <!-- Developer Zone -->
      <section>
         <h2 class="text-sm font-medium text-primary uppercase tracking-widest mb-4">{{ t('settings.developer') }}</h2>
         <div class="bg-primary/5 rounded-2xl p-1">
            <button @click="handleGenerateDemo" class="w-full p-4 flex items-center gap-4 hover:bg-primary/10 rounded-xl transition-colors text-left text-primary">
               <span class="material-symbols-rounded text-xl">science</span>
               <div class="flex-1">
                 <div class="font-medium">{{ t('settings.generate_demo') }}</div>
                 <div class="text-xs opacity-70">{{ t('settings.demo_desc') }}</div>
               </div>
            </button>
         </div>
      </section>

      <!-- Danger Zone -->
      <section>
         <h2 class="text-sm font-medium text-red-500 uppercase tracking-widest mb-4">Danger Zone</h2>
         <div class="bg-red-50 dark:bg-red-900/10 rounded-2xl p-1">
            <button @click="handleClear" class="w-full p-4 flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left text-red-600 dark:text-red-400">
              <div class="flex items-center gap-4">
                <span class="material-symbols-rounded text-xl">delete_forever</span>
                <span class="font-medium">Wipe All Data</span>
              </div>
            </button>
         </div>
      </section>
    </main>
    </div>
  </div>
</template>
