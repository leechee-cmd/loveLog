<script setup lang="ts">
import { ref } from 'vue';

export interface Toast {
  id: number;
  title: string;
  message: string;
  icon?: string;
  type?: 'success' | 'info' | 'achievement';
}

const toasts = ref<Toast[]>([]);
let idCounter = 0;

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = idCounter++;
  toasts.value.push({ ...toast, id });
  
  if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

  setTimeout(() => {
    removeToast(id);
  }, 4000);
};

const removeToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
};

defineExpose({ addToast });
</script>

<template>
  <div class="fixed top-6 left-0 right-0 z-[100] pointer-events-none flex flex-col items-center gap-3 px-4">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto bg-white/95 dark:bg-neutral-800/95 backdrop-blur text-neutral-900 dark:text-neutral-100 px-4 py-3 rounded-2xl shadow-lg shadow-neutral-500/10 flex items-center gap-3 min-w-[280px] max-w-sm border border-neutral-100 dark:border-neutral-700"
        :class="toast.type === 'achievement' ? 'border-primary/20' : ''"
      >
        <div 
           class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
           :class="toast.type === 'achievement' ? 'bg-primary text-white' : 'bg-green-500 text-white'"
        >
           <span class="material-symbols-rounded text-xl">{{ toast.icon || 'check' }}</span>
        </div>
        
        <div class="flex-1 min-w-0 text-left">
           <h4 class="font-bold text-sm leading-tight">{{ toast.title }}</h4>
           <p class="text-xs opacity-90 truncate">{{ toast.message }}</p>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}
</style>
