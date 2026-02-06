<script setup lang="ts">
import { ref } from 'vue';
import { useLogStore } from '../stores/logStore';
import { useSettingsStore } from '../stores/settingsStore';
import PinLock from '../components/business/PinLock.vue';

const logStore = useLogStore();
const settingsStore = useSettingsStore();
const fileInput = ref<HTMLInputElement | null>(null);
const newTagInput = ref('');
const showPinSetup = ref(false);

const handleAddTag = () => {
  const tag = newTagInput.value.trim();
  if (tag) {
    settingsStore.addTag(tag);
    newTagInput.value = '';
  }
};

const handleRemoveTag = (tag: string) => {
  if (confirm(`Remove tag "${tag}"?`)) {
    settingsStore.removeTag(tag);
  }
};

// PIN 相关
const handleTogglePin = () => {
  if (settingsStore.settings.security.pinEnabled) {
    // 关闭 PIN
    if (confirm('Disable PIN lock?')) {
      settingsStore.clearPin();
    }
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
      alert('Import Successful!');
    } catch (err) {
      alert('Failed to import: Invalid file format.');
    }
  };
  reader.readAsText(file);
};

const handleClear = async () => {
  if (!confirm('Are you certain? This will wipe all data permanently.')) return;
  await logStore.clearAllData();
};

const handleGenerateDemo = async () => {
  if (confirm('Generate 1 year of demo data? This will add to existing data.')) {
     await logStore.generateDemoData();
     alert('Demo data generated!');
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

    <div class="h-full flex flex-col py-6 safe-top safe-bottom overflow-hidden">
    <!-- Header -->
    <header class="px-6 mb-8 flex items-center gap-4 flex-none">
      <RouterLink to="/" class="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
        <span class="material-symbols-rounded text-2xl">arrow_back</span>
      </RouterLink>
      <h1 class="text-2xl font-bold">Settings</h1>
    </header>

    <main class="flex-1 px-6 space-y-8 animate-fade-in overflow-y-auto no-scrollbar pb-10">
      
      <!-- Security Section -->
      <section>
        <h2 class="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-4">Security</h2>
        <div class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-1">
          <button @click="handleTogglePin" class="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-left">
            <div class="flex items-center gap-4">
              <span class="material-symbols-rounded text-primary text-xl" style="font-variation-settings: 'FILL' 1;">lock</span>
              <div>
                <div class="font-medium">PIN Lock</div>
                <div class="text-xs text-neutral-500">{{ settingsStore.settings.security.pinEnabled ? 'Enabled' : 'Protect app with 4-digit PIN' }}</div>
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
        <h2 class="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-4">Custom Tags</h2>
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
                placeholder="Add new tag..." 
                class="flex-1 bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-neutral-400"
              />
              <button 
                @click="handleAddTag"
                class="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Add
              </button>
           </div>
        </div>
      </section>

      <!-- Backup Section -->
      <section>
        <h2 class="text-sm font-medium text-neutral-500 uppercase tracking-widest mb-4">Backup & Restore</h2>
        <div class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-1 space-y-1">
          <button @click="handleExport" class="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-left group">
            <div class="flex items-center gap-4">
              <span class="material-symbols-rounded text-primary text-xl">download</span>
              <div>
                <div class="font-medium">Export Data</div>
                <div class="text-xs text-neutral-500">Save detailed JSON backup</div>
              </div>
            </div>
            <span class="material-symbols-rounded text-neutral-400">chevron_right</span>
          </button>
          
          <button @click="triggerImport" class="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-left group">
            <div class="flex items-center gap-4">
               <span class="material-symbols-rounded text-primary text-xl">upload</span>
              <div>
                <div class="font-medium">Import Data</div>
                <div class="text-xs text-neutral-500">Restore from JSON file</div>
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
         <h2 class="text-sm font-medium text-primary uppercase tracking-widest mb-4">Developer</h2>
         <div class="bg-primary/5 rounded-2xl p-1">
            <button @click="handleGenerateDemo" class="w-full p-4 flex items-center gap-4 hover:bg-primary/10 rounded-xl transition-colors text-left text-primary">
               <span class="material-symbols-rounded text-xl">science</span>
               <div class="flex-1">
                 <div class="font-medium">Generate Demo Data</div>
                 <div class="text-xs opacity-70">Simulate 1 year of activity</div>
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
