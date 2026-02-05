<script setup lang="ts">
import { ref } from 'vue';
import { useLogStore } from '../stores/logStore';

const logStore = useLogStore();
const fileInput = ref<HTMLInputElement | null>(null);

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
</script>

<template>
  <div class="h-full flex flex-col py-6 safe-top safe-bottom bg-surface-light dark:bg-surface-dark">
    <!-- Header -->
    <header class="px-6 mb-8 flex items-center gap-4">
      <RouterLink to="/" class="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
        <span class="material-symbols-rounded text-2xl">arrow_back</span>
      </RouterLink>
      <h1 class="text-2xl font-bold">Data Management</h1>
    </header>

    <main class="flex-1 px-6 space-y-8 animate-fade-in">
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
</template>
