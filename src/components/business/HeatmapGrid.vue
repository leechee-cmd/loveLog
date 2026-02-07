<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { eachDayOfInterval, format, startOfYear, endOfYear, getDay } from 'date-fns';
import { useLogStore } from '../../stores/logStore';

const props = defineProps<{
  year?: Date // Defaults to current year view logic if needed, or rolling window
}>();

const logStore = useLogStore();

const currentYearStart = computed(() => startOfYear(new Date(logStore.statsYear, 0, 1)));
const currentYearEnd = computed(() => endOfYear(new Date(logStore.statsYear, 0, 1)));

const days = computed(() => {
  return eachDayOfInterval({
    start: currentYearStart.value,
    end: currentYearEnd.value
  });
});

// Helper to get logic level (0-4)
const getLevel = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  // Inefficient O(N) lookup for every cell? 
  // We should probably optimize this in the store or a map, but for <365 items it's fine for MVP.
  // Actually store has `todayLogs` which is specific. 
  // Let's make a Map in the component or store.
  // The store logs are an array.
  
  // Better: Create a Map of Date -> Count
  const count = logStore.logs.filter(l => l.dateStr === dateStr).length;
  
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 2) return 2;
  if (count <= 3) return 3;
  return 4;
};

// Tooltip text
const getTooltip = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const count = logStore.logs.filter(l => l.dateStr === dateStr).length;
  return `${count} logs on ${format(date, 'MMM d, yyyy')}`;
}

const getIntensityClass = (level: number) => {
  switch (level) {
    case 0: return 'bg-neutral-200 dark:bg-neutral-800';
    case 1: return 'bg-primary/30';
    case 2: return 'bg-primary/50';
    case 3: return 'bg-primary/75';
    case 4: return 'bg-primary';
    default: return 'bg-neutral-200 dark:bg-neutral-800';
  }
};

const router = useRouter();

const handleCellClick = (date: Date) => {
  router.push({
    name: 'history', // Assuming route name is 'history' or logic to path '/history'
    query: { date: format(date, 'yyyy-MM-dd') }
  });
};

const padDays = computed(() => {
  const startDay = getDay(currentYearStart.value); // 0 = Sunday
  return Array(startDay).fill(null);
});

// Month Labels Logic
const months = computed(() => {
  const ms = [];
  const start = currentYearStart.value;
  // Iterate 12 months
  for (let i = 0; i < 12; i++) {
     const d = new Date(start.getFullYear(), i, 1);
     // Calculate approximate week index
     // Difference in days from start of year
     const diffTime = Math.abs(d.getTime() - start.getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
     // Add padding days to get grid position
     const startDay = getDay(start);
     const weekIndex = Math.floor((diffDays + startDay) / 7);
     
     ms.push({
        name: format(d, 'MMM'),
        left: weekIndex // Just return the column index (week index)
     });
  }
  return ms;
});
</script>

<template>
  <div class="w-full overflow-x-auto no-scrollbar pb-4 scroll-smooth">
    <div class="min-w-max p-1 relative pt-6">
      
      <!-- Month Labels -->
      <div class="flex text-[10px] text-neutral-400 font-medium absolute top-0 left-1 h-6 select-none pointer-events-none w-full">
         <span 
           v-for="(m, i) in months" 
           :key="i"
           class="absolute top-0"
           :style="{ left: (m.left * 16) + 'px' }" 
         >
           {{ m.name }}
         </span>
      </div>

      <!-- Grid with 7 rows (Sunday to Saturday) -->
      <div 
        class="grid grid-rows-7 gap-1"
        style="grid-auto-flow: column;"
      >
        <!-- Padding for start of year alignment -->
        <div 
          v-for="i in padDays.length" 
          :key="'pad-' + i"
          class="w-3 h-3"
        ></div>

        <!-- Render Days -->
        <div 
          v-for="day in days" 
          :key="day.toISOString()"
          class="w-3 h-3 rounded-sm transition-colors cursor-pointer hover:border hover:border-black/20 dark:hover:border-white/40"
          :class="getIntensityClass(getLevel(day))"
          :title="getTooltip(day)"
          @click="handleCellClick(day)"
        ></div>
      </div>
    </div>
  </div>
</template>
