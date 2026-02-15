<script setup lang="ts">
import { onMounted, ref, watch, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLogStore } from '../stores/logStore';
import LogEditor from '../components/business/LogEditor.vue';
import { type LogEntry } from '../services/db';

const { t, locale } = useI18n();
const logStore = useLogStore();
const showEditor = ref(false);
const editingLog = ref<Partial<LogEntry> | undefined>(undefined);

// 点击脉冲动画状态
const isPulsing = ref(false);

// 创意问候语
const greeting = computed(() => {
  const hour = new Date().getHours();
  const streak = logStore.currentStreak;
  const total = logStore.totalCount;
  
  if (streak >= 7) return t('home.greeting.on_fire');
  if (streak >= 3) return t('home.greeting.keep_it_up');
  if (total === 0) return t('home.greeting.start');
  
  if (hour < 6) return t('home.greeting.late_night');
  if (hour < 9) return t('home.greeting.morning');
  if (hour < 12) return t('home.greeting.morning_glow');
  if (hour < 14) return t('home.greeting.midday');
  if (hour < 18) return t('home.greeting.afternoon');
  if (hour < 21) return t('home.greeting.golden');
  return t('home.greeting.night');
});

// 距上次的时间差
const timeSinceLast = computed(() => {
  const last = logStore.lastLog;
  if (!last) return null;
  
  const now = Date.now();
  const diffMs = now - last.timestamp;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffHours / 24);
  const hours = diffHours % 24;
  
  return { days, hours, totalHours: diffHours };
});

// 圆环进度（7天为一个周期）
const ringProgress = computed(() => {
  if (!timeSinceLast.value) return 0;
  const { totalHours } = timeSinceLast.value;
  return Math.min(totalHours / 168, 1);
});

// 渐变色端点 — 基于间隔天数
const ringGradientColors = computed(() => {
  if (!timeSinceLast.value) return { start: '#e5e5e5', end: '#d4d4d4' };
  const { days } = timeSinceLast.value;
  if (days < 1) return { start: '#f43f5e', end: '#fb7185' };  // 热情粉红
  if (days < 3) return { start: '#f43f5e', end: '#f97316' };  // 粉红→橙色
  if (days < 5) return { start: '#f97316', end: '#fbbf24' };  // 橙色→琥珀
  if (days < 7) return { start: '#f97316', end: '#ef4444' };  // 橙红警告
  return { start: '#a3a3a3', end: '#737373' };                // 冷灰
});

// SVG 圆环参数
const RING_RADIUS = 85;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ringStrokeDashoffset = computed(() => {
  return RING_CIRCUMFERENCE * (1 - ringProgress.value);
});

onMounted(() => {
  logStore.loadLogs();
});

// 长按逻辑
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

// 💗 升级版粒子系统 — 多种形状、颜色、轨迹
interface Particle {
  id: number;
  tx: number;
  ty: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  isHeart: boolean;
}
const particles = ref<Particle[]>([]);
let particleId = 0;

const HEART_COLORS = ['#f43f5e', '#fb7185', '#fda4af', '#ff6b81', '#e11d48', '#fbbf24'];

const spawnParticles = () => {
  // 第一波：大心形，快速
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.4;
    const velocity = 80 + Math.random() * 60;
    particles.value.push({
      id: particleId++,
      tx: Math.cos(angle) * velocity,
      ty: Math.sin(angle) * velocity,
      size: 16 + Math.random() * 10,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)] ?? '#f43f5e',
      delay: Math.random() * 60,
      duration: 700 + Math.random() * 300,
      isHeart: true
    });
  }
  // 第二波：小圆点，稍慢扩散
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.6;
    const velocity = 40 + Math.random() * 100;
    particles.value.push({
      id: particleId++,
      tx: Math.cos(angle) * velocity,
      ty: Math.sin(angle) * velocity,
      size: 4 + Math.random() * 6,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)] ?? '#f43f5e',
      delay: 50 + Math.random() * 100,
      duration: 600 + Math.random() * 400,
      isHeart: false
    });
  }
  
  // 自动清理
  setTimeout(() => {
    particles.value = [];
  }, 1200);
};

const handleClick = async () => {
  if (isLongPress) return;
  
  // 触发脉冲动画
  isPulsing.value = false;
  await nextTick();
  isPulsing.value = true;
  setTimeout(() => isPulsing.value = false, 600);

  spawnParticles();
  if (navigator.vibrate) navigator.vibrate(50);
  await logStore.addQuickLog();
};

const handleEditLog = (log: LogEntry) => {
  editingLog.value = { ...log };
  showEditor.value = true;
};

const handleEditorSave = async (data: Partial<LogEntry>) => {
  if (editingLog.value && editingLog.value.id) {
    const updated = {
       ...editingLog.value,
       ...data,
       updatedAt: Date.now()
    } as LogEntry;
    await logStore.updateEntry(updated);
  } else {
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

watch(showEditor, (val) => {
  if (!val) {
     setTimeout(() => editingLog.value = undefined, 300);
  }
});

// 最近3条记录
const recentLogs = computed(() => {
  return logStore.logs.slice(0, 3);
});

// 格式化任意记录的时间
const formatLogTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return d.toLocaleDateString(locale.value, { 
    month: 'short', 
    day: 'numeric',
    weekday: 'short'
  }) + ' ' + d.toLocaleTimeString(locale.value, {
    hour: '2-digit', 
    minute: '2-digit'
  });
};
</script>

<template>
  <div class="h-full flex flex-col items-center py-8 safe-top safe-bottom relative bg-surface-light dark:bg-surface-dark">
    
    <!-- Header -->
    <header class="w-full px-6 flex justify-between items-start animate-fade-in flex-none">
      <div>
        <h1 class="text-xl font-light text-neutral-400 whitespace-nowrap">{{ greeting }}</h1>
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

    <!-- 核心区域：亲密时钟 -->
    <main class="flex-1 flex flex-col items-center justify-center w-full animate-slide-up px-6">
      
      <!-- 圆环时钟容器 -->
      <div class="ring-container relative flex items-center justify-center mb-6"
           @mousedown="handlePressStart"
           @touchstart.passive="handlePressStart"
           @mouseup="handlePressEnd"
           @touchend="handlePressEnd"
           @mouseleave="handlePressEnd"
           @click="handleClick"
      >
        <!-- 外层辉光（呼吸动画） -->
        <div class="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full ring-glow"
             :style="{ 
               background: `radial-gradient(circle, ${ringGradientColors.start}15 0%, transparent 70%)` 
             }"
        ></div>

        <!-- 点击脉冲波纹 -->
        <div v-if="isPulsing" class="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full pulse-wave"
             :style="{ borderColor: ringGradientColors.start }"
        ></div>

        <!-- 粒子容器 -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <template v-for="p in particles" :key="p.id">
            <!-- 心形粒子 -->
            <div v-if="p.isHeart"
              class="absolute particle-heart"
              :style="{
                '--tx': p.tx + 'px',
                '--ty': p.ty + 'px',
                fontSize: p.size + 'px',
                color: p.color,
                'animation-delay': p.delay + 'ms',
                'animation-duration': p.duration + 'ms',
              }"
            >♥</div>
            <!-- 圆点粒子 -->
            <div v-else
              class="absolute rounded-full particle-dot"
              :style="{
                '--tx': p.tx + 'px',
                '--ty': p.ty + 'px',
                width: p.size + 'px',
                height: p.size + 'px',
                backgroundColor: p.color,
                'animation-delay': p.delay + 'ms',
                'animation-duration': p.duration + 'ms',
              }"
            ></div>
          </template>
        </div>

        <!-- SVG 圆环 -->
        <svg viewBox="0 0 200 200" class="w-56 h-56 sm:w-64 sm:h-64 relative z-10">
          <defs>
            <!-- 渐变色 -->
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" :stop-color="ringGradientColors.start" />
              <stop offset="100%" :stop-color="ringGradientColors.end" />
            </linearGradient>
            <!-- 辉光滤镜 -->
            <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- 背景环 - 虚线装饰 -->
          <circle
            cx="100" cy="100" :r="RING_RADIUS + 8"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            stroke-dasharray="2 6"
            class="text-neutral-200 dark:text-neutral-700"
            style="transform: rotate(-90deg); transform-origin: center;"
          />

          <!-- 背景环 - 主体 -->
          <circle
            cx="100" cy="100" :r="RING_RADIUS"
            fill="none"
            stroke="currentColor"
            stroke-width="10"
            class="text-neutral-100 dark:text-neutral-800"
          />
          
          <!-- 进度环 — 带渐变和辉光 -->
          <circle
            cx="100" cy="100" :r="RING_RADIUS"
            fill="none"
            stroke="url(#ringGradient)"
            stroke-width="10"
            stroke-linecap="round"
            filter="url(#ringGlow)"
            class="ring-progress"
            :stroke-dasharray="RING_CIRCUMFERENCE"
            :stroke-dashoffset="ringStrokeDashoffset"
            style="transform: rotate(-90deg); transform-origin: center;"
          />

          <!-- 进度端点装饰圆点 -->
          <circle
            v-if="ringProgress > 0.02"
            cx="100" :cy="100 - RING_RADIUS"
            r="6"
            :fill="ringGradientColors.start"
            filter="url(#ringGlow)"
            style="transform: rotate(-90deg); transform-origin: 100px 100px;"
          />
        </svg>

        <!-- 圆环内部内容 -->
        <div class="absolute inset-0 flex flex-col items-center justify-center z-20">
          <template v-if="timeSinceLast">
            <span class="text-[10px] text-neutral-400 uppercase tracking-[0.2em] font-semibold mb-2">
              {{ t('home.since_last') }}
            </span>
            <div class="flex items-baseline gap-1">
              <span v-if="timeSinceLast.days > 0" class="text-5xl font-black text-neutral-800 dark:text-neutral-100 tabular-nums">
                {{ timeSinceLast.days }}
              </span>
              <span v-if="timeSinceLast.days > 0" class="text-sm text-neutral-400 font-semibold mr-1">
                {{ t('home.days') }}
              </span>
              <span class="text-5xl font-black text-neutral-800 dark:text-neutral-100 tabular-nums">
                {{ timeSinceLast.hours }}
              </span>
              <span class="text-sm text-neutral-400 font-semibold">
                {{ t('home.hours') }}
              </span>
            </div>
            <!-- 心跳按钮提示 -->
            <div class="mt-4">
              <span class="material-symbols-rounded text-3xl text-primary heartbeat-icon" 
                    style="font-variation-settings: 'FILL' 1;">favorite</span>
            </div>
          </template>
          <template v-else>
            <span class="material-symbols-rounded text-6xl text-primary heartbeat-icon mb-2" 
                  style="font-variation-settings: 'FILL' 1;">favorite</span>
            <span class="text-xs text-neutral-400 font-medium">{{ t('home.tap_record') }}</span>
          </template>
        </div>
      </div>

      <!-- 提示文字 -->
      <p class="text-neutral-300 dark:text-neutral-600 text-[10px] tracking-wider text-center mb-8">
        {{ t('home.tap_record') }} · {{ t('home.hold_details') }}
      </p>

      <!-- 三个统计卡片 -->
      <div class="grid grid-cols-3 gap-3 w-full max-w-sm">
        <div class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-4 text-center">
          <div class="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-1">{{ t('home.this_month') }}</div>
          <div class="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{{ logStore.monthlyCount }}</div>
          <div class="text-[10px] text-neutral-400">{{ t('home.times') }}</div>
        </div>
        <div class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-4 text-center">
          <div class="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-1">{{ t('home.streak') }}</div>
          <div class="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{{ logStore.currentStreak }}</div>
          <div class="text-[10px] text-neutral-400">{{ t('home.days') }}</div>
        </div>
        <div class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-4 text-center">
          <div class="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-1">{{ t('home.total') }}</div>
          <div class="text-2xl font-bold text-primary">{{ logStore.totalCount }}</div>
          <div class="text-[10px] text-neutral-400">{{ t('home.total_love') }}</div>
        </div>
      </div>
    </main>

    <!-- 底部：最近记录 -->
    <footer class="w-full px-6 flex-none pt-4 pb-2 animate-fade-in">
      <!-- 标题栏 + 查看全部 -->
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-xs font-bold text-neutral-400 uppercase tracking-widest">{{ t('home.recent') }}</h3>
        <RouterLink to="/history" class="text-primary text-xs font-medium hover:text-primary-dark transition-colors flex items-center gap-0.5">
          {{ t('home.view_all') }}
          <span class="material-symbols-rounded text-sm">chevron_right</span>
        </RouterLink>
      </div>

      <!-- 最近3条记录 -->
      <div v-if="recentLogs.length" class="space-y-2">
        <div 
          v-for="log in recentLogs" 
          :key="log.id"
          @click="handleEditLog(log)"
          class="bg-surface-variant dark:bg-surface-variant-dark p-3 rounded-xl flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-none">
            <span class="material-symbols-rounded text-base" style="font-variation-settings: 'FILL' 1;">favorite</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate">{{ formatLogTime(log.timestamp) }}</div>
            <div class="text-[11px] text-neutral-500 flex gap-1 mt-0.5" v-if="log.tags && log.tags.length">
              <span v-for="tag in log.tags" :key="tag">#{{ tag }}</span>
            </div>
          </div>
          <span v-if="log.durationMinutes" class="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium flex-none">
            {{ log.durationMinutes }}{{ t('home.min') }}
          </span>
        </div>
      </div>
      <!-- 无记录 -->
      <div v-else class="text-center py-4 text-neutral-400 text-sm italic">
        {{ t('home.no_records') }}
      </div>
    </footer>

    <!-- LogEditor -->
    <LogEditor 
      v-model="showEditor"
      :initial-data="editingLog"
      @save="handleEditorSave"
    />
  </div>
</template>

<style scoped>
/* 圆环容器 */
.ring-container {
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* 外层辉光呼吸动画 */
.ring-glow {
  animation: glowBreath 4s ease-in-out infinite;
}
@keyframes glowBreath {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 0.3; }
}

/* 进度环过渡 */
.ring-progress {
  transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 心跳图标动画 */
.heartbeat-icon {
  animation: heartbeat 2s ease-in-out infinite;
}
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.15); }
  30% { transform: scale(1); }
  45% { transform: scale(1.1); }
  60% { transform: scale(1); }
}

/* 点击脉冲波纹 */
.pulse-wave {
  border: 3px solid;
  animation: pulseWave 0.6s ease-out forwards;
}
@keyframes pulseWave {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* 心形粒子 */
.particle-heart {
  animation: heartParticleOut var(--duration, 800ms) ease-out forwards;
  animation-delay: var(--delay, 0ms);
  opacity: 0;
  pointer-events: none;
  font-style: normal;
  line-height: 1;
}
@keyframes heartParticleOut {
  0% {
    transform: translate(0, 0) scale(0.3) rotate(0deg);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(1.2) rotate(45deg);
    opacity: 0;
  }
}

/* 圆点粒子 */
.particle-dot {
  animation: dotParticleOut var(--duration, 600ms) ease-out forwards;
  animation-delay: var(--delay, 0ms);
  opacity: 0;
  pointer-events: none;
}
@keyframes dotParticleOut {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.9;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0);
    opacity: 0;
  }
}
</style>
