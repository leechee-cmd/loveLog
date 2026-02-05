<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useLogStore } from '../stores/logStore';
import BaseBtn from '../components/base/BaseBtn.vue';
import HeatmapGrid from '../components/business/HeatmapGrid.vue';
import LogEditor from '../components/business/LogEditor.vue';
import { type LogEntry } from '../services/db';

const logStore = useLogStore();
const showEditor = ref(false);
const editingLog = ref<Partial<LogEntry> | undefined>(undefined);

onMounted(() => {
  logStore.loadLogs();
});

// Long Press Logic
let pressTimer: any = null;
const LONG_PRESS_DURATION = 600;
let isLongPress = false;

const handlePressStart = () => {
  isLongPress = false;
  pressTimer = setTimeout(() => {
    isLongPress = true;
    if (navigator.vibrate) navigator.vibrate(100);
    showEditor.value = true;
  }, LONG_PRESS_DURATION);
};

const handlePressEnd = () => {
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
};

const handleClick = async () => {
  // If it was a long press, do nothing (editor is already opening)
  if (isLongPress) return;

  // Simple Click
  if (navigator.vibrate) navigator.vibrate(50);
  await logStore.addQuickLog();
};

const handleEditLog = (log: LogEntry) => {
  editingLog.value = { ...log };
  showEditor.value = true;
};

const handleEditorSave = async (data: Partial<LogEntry>) => {
  if (editingLog.value && editingLog.value.id) {
    // 编辑已有日志
    const updated = {
       ...editingLog.value,
       ...data,
       updatedAt: Date.now()
    } as LogEntry;
    await logStore.updateEntry(updated);
  } else {
    // 长按创建新日志 (带详情)
    const log = await logStore.addQuickLog();
    if (log) {
       const updated = {
          ...log,
          ...data,
          updatedAt: Date.now(),
          timestamp: data.timestamp || log.timestamp,
          dateStr: data.timestamp ? new Date(data.timestamp).toISOString().slice(0, 10) : log.dateStr
       };
       await logStore.updateEntry(updated);
    }
  }
  
  editingLog.value = undefined;
};

// When sheet closes, clear editing state
watch(showEditor, (val) => {
  if (!val) {
     setTimeout(() => editingLog.value = undefined, 300);
  }
});
</script>

<template>
  <div class="h-full flex flex-col items-center justify-between py-12 safe-top safe-bottom relative">
    
    <!-- Greeting / Header -->
    <header class="w-full px-6 flex justify-between items-start animate-fade-in flex-none">
      <div>
        <h1 class="text-3xl font-light text-neutral-400">Good Evening</h1>
        <div class="flex items-baseline gap-2 mt-2">
          <span class="text-5xl font-bold text-primary">{{ logStore.totalCount }}</span>
          <span class="text-sm font-medium text-neutral-500">Total Love</span>
        </div>
      </div>
      <div class="flex items-center gap-1 -mr-2">
         <RouterLink to="/history" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-2">
           <span class="material-symbols-rounded text-2xl">calendar_month</span>
         </RouterLink>
         <RouterLink to="/stats" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-2">
           <span class="material-symbols-rounded text-2xl">bar_chart</span>
         </RouterLink>
         <RouterLink to="/settings" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-2">
           <span class="material-symbols-rounded text-2xl">settings</span>
         </RouterLink>
      </div>
    </header>

    <!-- Main Action -->
    <main class="flex-1 flex flex-col items-center justify-center w-full animate-slide-up min-h-[300px]">
      <div class="relative">
        <div class="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
        <BaseBtn 
          size="hero" 
          @mousedown="handlePressStart"
          @touchstart="handlePressStart"
          @mouseup="handlePressEnd"
          @touchend="handlePressEnd"
          @mouseleave="handlePressEnd"
          @click="handleClick"
        >
          <span class="material-symbols-rounded text-6xl">favorite</span>
        </BaseBtn>
      </div>
      
      <p class="mt-8 text-neutral-400 font-light tracking-widest text-sm uppercase">
        Tap to Record / Hold for Details
      </p>
    </main>

    <!-- Heatmap Section -->
    <section class="w-full px-6 mb-6 animate-fade-in flex-none">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Yearly Review</h3>
      </div>
      <HeatmapGrid />
    </section>

    <!-- Recent History -->
    <footer class="w-full px-6 flex flex-col flex-none h-[35vh] border-t border-neutral-100 dark:border-neutral-800 pt-4 pb-6">
      <!-- Fixed Header -->
      <div class="flex justify-between items-center py-2 flex-none">
        <h3 class="text-sm font-medium text-neutral-500 uppercase tracking-wider">Recent</h3>
        <RouterLink to="/history" class="text-primary text-sm font-medium hover:text-primary-dark transition-colors">View All</RouterLink>
      </div>
      
      <!-- Scrollable List -->
      <div class="flex-1 overflow-y-auto no-scrollbar mask-gradient space-y-3 pt-2">
        <div 
          v-for="log in logStore.todayLogs" 
          :key="log.id"
          @click="handleEditLog(log)"
          class="bg-surface-variant dark:bg-surface-variant-dark p-4 rounded-2xl flex justify-between items-center transition-all animate-fade-in hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer active:scale-98"
        >
          <div class="flex items-center gap-3">
             <!-- Icon -->
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-none">
               <span class="material-symbols-rounded text-xl" v-if="log.durationMinutes">timer</span>
               <span class="material-symbols-rounded text-xl" v-else>favorite</span>
            </div>
            <div class="min-w-0">
              <div class="font-medium flex items-center gap-2">
                {{ new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
                <span v-if="log.durationMinutes" class="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-md whitespace-nowrap">{{ log.durationMinutes }}m</span>
              </div>
              <div class="text-xs text-neutral-500 mt-0.5 flex gap-1 overflow-hidden" v-if="log.tags && log.tags.length">
                <span v-for="tag in log.tags" :key="tag" class="truncate">#{{ tag }}</span>
              </div>
            </div>
          </div>
          <button 
            @click.stop="logStore.removeLog(log.id)"
            class="text-neutral-400 hover:text-red-500 p-2 z-10 flex-none transition-colors"
          >
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
        
        <div v-if="logStore.todayLogs.length === 0" class="text-center py-8 text-neutral-400 text-sm italic">
          No records today yet.
        </div>
        
        <!-- Bottom padding for scroll -->
        <div class="h-8"></div>
      </div>
    </footer>

      <!-- LogEditor (Global) -->
      <LogEditor 
        v-model="showEditor"
        :initial-data="editingLog"
        @save="handleEditorSave"
      />
  </div>
</template>
