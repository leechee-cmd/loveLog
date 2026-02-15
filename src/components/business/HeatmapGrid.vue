<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { eachDayOfInterval, startOfYear, endOfYear, getDay, differenceInCalendarWeeks } from 'date-fns';
import { useI18n } from 'vue-i18n';
import { useLogStore } from '../../stores/logStore';

const props = defineProps<{
  year?: Date
}>();

const logStore = useLogStore();
const { locale } = useI18n();

const currentYearStart = computed(() => {
   const y = logStore.statsYear || new Date().getFullYear();
   return startOfYear(new Date(y, 0, 1));
});

const currentYearEnd = computed(() => {
   const y = logStore.statsYear || new Date().getFullYear();
   return endOfYear(new Date(y, 0, 1));
});

const days = computed(() => {
  return eachDayOfInterval({
    start: currentYearStart.value,
    end: currentYearEnd.value
  });
});

// 计算总周数（列数）
const totalWeeks = computed(() => {
  return differenceInCalendarWeeks(currentYearEnd.value, currentYearStart.value, { weekStartsOn: 0 }) + 1;
});

// 将每个日期映射为 { date, col, row }
// 今天的日期字符串，用于判断未来日期
const todayStr = computed(() => new Date().toISOString().slice(0, 10));

const cellData = computed(() => {
  const start = currentYearStart.value;
  return days.value.map(day => {
    const col = differenceInCalendarWeeks(day, start, { weekStartsOn: 0 });
    const row = getDay(day); // 0=Sunday ... 6=Saturday
    const dateStr = day.toISOString().slice(0, 10);
    const isFuture = dateStr > todayStr.value;
    return { date: day, col, row, isFuture };
  });
});

// 月份标签：计算每月第一天所在的列索引
const months = computed(() => {
  const start = currentYearStart.value;
  const ms = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), i, 1);
    const col = differenceInCalendarWeeks(d, start, { weekStartsOn: 0 });
    ms.push({
      name: d.toLocaleDateString(locale.value, { month: 'short' }),
      col: col + 1 // CSS grid-column 是 1-based
    });
  }
  return ms;
});

// 辅助函数：获取活动等级 (0-4)
const getLevel = (date: Date) => {
  const dateStr = date.toISOString().slice(0, 10);
  const count = logStore.logs.filter(l => l.dateStr === dateStr).length;
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 2) return 2;
  if (count <= 3) return 3;
  return 4;
};

// 提示文本
const getTooltip = (date: Date) => {
  const dateStr = date.toISOString().slice(0, 10);
  const count = logStore.logs.filter(l => l.dateStr === dateStr).length;
  return `${count} logs on ${date.toLocaleDateString(locale.value)}`;
};

// 热力图格子颜色
const EMPTY_CELL = 'bg-neutral-200 dark:bg-neutral-700';
const getIntensityClass = (level: number) => {
  switch (level) {
    case 0: return EMPTY_CELL;
    case 1: return 'bg-rose-200 dark:bg-rose-800';
    case 2: return 'bg-rose-300 dark:bg-rose-600';
    case 3: return 'bg-rose-400 dark:bg-rose-500';
    case 4: return 'bg-primary dark:bg-primary';
    default: return EMPTY_CELL;
  }
};

const router = useRouter();

const handleCellClick = (date: Date) => {
  router.push({
    name: 'history',
    query: { date: date.toISOString().slice(0, 10) }
  });
};
</script>

<template>
  <div class="w-full overflow-x-auto no-scrollbar pb-4 scroll-smooth">
    <div class="min-w-max p-1">
      
      <!-- 使用同一个 CSS Grid 来放月份标签和日期格子 -->
      <!-- 第1行放月份标签，第2~8行放7天（周日~周六） -->
      <div 
        class="heatmap-grid"
        :style="{
          display: 'grid',
          gridTemplateRows: `auto repeat(7, 1fr)`,
          gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`,
          gap: '3px'
        }"
      >
        <!-- 月份标签：放在第1行，使用 grid-column 精准定位 -->
        <span 
          v-for="(m, i) in months" 
          :key="'month-' + i"
          class="text-[10px] text-neutral-400 font-medium whitespace-nowrap select-none pointer-events-none leading-none pb-1"
          :style="{ 
            gridRow: '1', 
            gridColumn: String(m.col) 
          }"
        >
          {{ m.name }}
        </span>

        <!-- 日期格子：放在第2~8行（row+2），使用 grid-column 精准定位 -->
        <div 
          v-for="cell in cellData" 
          :key="cell.date.toISOString()"
          class="rounded-sm transition-colors cursor-pointer hover:border hover:border-black/20 dark:hover:border-white/40"
          :class="getIntensityClass(getLevel(cell.date))"
          style="aspect-ratio: 1;"
          :title="getTooltip(cell.date)"
          :style="{
            gridRow: String(cell.row + 2),
            gridColumn: String(cell.col + 1)
          }"
          @click="handleCellClick(cell.date)"
        ></div>
      </div>
    </div>
  </div>
</template>
