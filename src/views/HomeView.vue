<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLogStore } from '../stores/logStore';
import BaseBtn from '../components/base/BaseBtn.vue';
import LogEditor from '../components/business/LogEditor.vue';
import { type LogEntry } from '../services/db';

const { t, locale } = useI18n();
const logStore = useLogStore();
const showEditor = ref(false);
const editingLog = ref<Partial<LogEntry> | undefined>(undefined);

// 创意问候语 - 基于时间和数据
const greeting = computed(() => {
  const hour = new Date().getHours();
  const streak = logStore.currentStreak;
  const total = logStore.totalCount;
  
  // 根据连胜和总数给出特别提示
  if (streak >= 7) return t('home.greeting.on_fire');
  if (streak >= 3) return t('home.greeting.keep_it_up');
  if (total === 0) return t('home.greeting.start');
  
  // 基于时间的浪漫提示
  if (hour < 6) return t('home.greeting.late_night');
  if (hour < 9) return t('home.greeting.morning');
  if (hour < 12) return t('home.greeting.morning_glow');
  if (hour < 14) return t('home.greeting.midday');
  if (hour < 18) return t('home.greeting.afternoon');
  if (hour < 21) return t('home.greeting.golden');
  return t('home.greeting.night');
});

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

// Particle System
interface Particle {
  id: number;
  tx: number;
  ty: number;
}
const particles = ref<Particle[]>([]);
let particleId = 0;

const spawnParticles = () => {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const velocity = 80 + Math.random() * 40; // distance
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;
    
    const id = particleId++;
    particles.value.push({ id, tx, ty });
    
    // Cleanup
    setTimeout(() => {
      particles.value = particles.value.filter(p => p.id !== id);
    }, 800);
  }
};

const handleClick = async () => {
  // If it was a long press, do nothing (editor is already opening)
  if (isLongPress) return;

  // Visual Feedback
  spawnParticles();

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
        <h1 class="text-2xl font-light text-neutral-400 whitespace-nowrap">{{ greeting }}</h1>
        <div class="flex items-baseline gap-2 mt-2">
          <span class="text-5xl font-bold text-primary">{{ logStore.totalCount }}</span>
          <span class="text-sm font-medium text-neutral-500">{{ t('home.total_love') }}</span>
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

    <!-- Main Action - Hero Zone -->
    <main class="flex-1 flex flex-col items-center justify-center w-full animate-slide-up">
      <!-- Hero Button Container -->
      <div class="relative flex items-center justify-center">
        
        <!-- Outer Glow Ring (slowest) -->
        <div class="absolute w-80 h-80 rounded-full bg-gradient-to-br from-primary/10 to-transparent animate-ping-slow opacity-30"></div>
        
        <!-- Middle Pulse Ring -->
        <div class="absolute w-72 h-72 rounded-full border-2 border-primary/20 animate-pulse"></div>
        
        <!-- Inner Breathing Glow -->
        <div class="absolute w-56 h-56 rounded-full bg-gradient-radial from-primary/30 via-primary/10 to-transparent animate-breathe"></div>
        
        <!-- Particles Container -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div 
            v-for="p in particles" 
            :key="p.id"
            class="absolute w-3 h-3 rounded-full bg-primary"
            :style="{
              '--tx': p.tx + 'px',
              '--ty': p.ty + 'px',
              animation: 'particle-out 0.8s ease-out forwards'
            }"
          ></div>
        </div>

        <!-- Core Button -->
        <BaseBtn 
          size="hero" 
          class="relative z-10"
          @mousedown="handlePressStart"
          @touchstart="handlePressStart"
          @mouseup="handlePressEnd"
          @touchend="handlePressEnd"
          @mouseleave="handlePressEnd"
          @click="handleClick"
        >
          <!-- Filled Heart Icon -->
          <span class="material-symbols-rounded text-7xl" style="font-variation-settings: 'FILL' 1, 'wght' 400;">favorite</span>
        </BaseBtn>
      </div>
      
      <!-- Hint Text -->
      <div class="mt-10 text-center">
        <p class="text-neutral-400 font-light tracking-widest text-xs uppercase mb-1">
          {{ t('home.tap_record') }}
        </p>
        <p class="text-neutral-300 dark:text-neutral-600 text-[10px] tracking-wider">
          {{ t('home.hold_details') }}
        </p>
      </div>
    </main>

    <!-- Recent History -->
    <footer class="w-full px-6 flex flex-col flex-none h-[35vh] border-t border-neutral-100 dark:border-neutral-800 pt-4 pb-6">
      <!-- Fixed Header -->
      <div class="flex justify-between items-center py-2 flex-none">
        <h3 class="text-sm font-medium text-neutral-500 uppercase tracking-wider">{{ t('home.recent') }}</h3>
        <RouterLink to="/history" class="text-primary text-sm font-medium hover:text-primary-dark transition-colors">{{ t('home.view_all') }}</RouterLink>
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
                {{ new Date(log.timestamp).toLocaleTimeString(locale, {hour: '2-digit', minute:'2-digit'}) }}
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
          {{ t('home.no_records') }}
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

<style scoped>
@keyframes particle-out {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0);
    opacity: 0;
  }
}
</style>
