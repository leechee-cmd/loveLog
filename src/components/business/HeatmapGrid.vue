<script setup lang="ts">
import { computed } from 'vue';
import { eachDayOfInterval, subYears, format, isSameDay, startOfYear, endOfYear, getDay } from 'date-fns';
import { useLogStore } from '../../stores/logStore';

const props = defineProps<{
  year?: Date // Defaults to current year view logic if needed, or rolling window
}>();

const logStore = useLogStore();

// Configuration
const TODAY = new Date();
const START_DATE = subYears(TODAY, 1); // Show last 365 days or just this year? PRD says "Year View"
// Let's do a "Rolling Year" for now, or maybe fixed Calendar Year? 
// GitHub uses rolling year. Let's do fixed Calendar Year (Jan 1 - Dec 31) to be cleaner for "2026".
// Actually, usually users want to see "Today" at the end. Let's do "Last 52 Weeks" approach roughly.
// Let's stick to: Start of current year to Today (or End of Year).
// Let's do: Jan 1 of Current Year to Dec 31 of Current Year.
const currentYearStart = startOfYear(TODAY);
const currentYearEnd = endOfYear(TODAY);

const days = computed(() => {
  return eachDayOfInterval({
    start: currentYearStart,
    end: currentYearEnd
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

const handleCellClick = (date: Date) => {
  // TODO: Open bottom sheet for this date
  console.log('Clicked', date);
};

const padDays = computed(() => {
  const startDay = getDay(currentYearStart); // 0 = Sunday
  return Array(startDay).fill(null);
});
</script>

<template>
  <div class="w-full overflow-x-auto no-scrollbar pb-4 scroll-smooth">
    <div class="flex gap-1 min-w-max p-1">
      <!-- Grid with 7 rows (Sunday to Saturday) -->
      <div 
        class="grid grid-rows-7 gap-1"
        style="grid-auto-flow: column;"
      >
        <!-- Padding for start of year alignment -->
        <div 
          v-for="(n, index) in padDays" 
          :key="'pad-' + index"
          class="w-3 h-3"
        ></div>

        <!-- Render Days -->
        <div 
          v-for="day in days" 
          :key="day.toISOString()"
          class="w-3 h-3 rounded-sm transition-colors cursor-pointer"
          :class="getIntensityClass(getLevel(day))"
          :title="getTooltip(day)"
          @click="handleCellClick(day)"
        ></div>
      </div>
    </div>
  </div>
</template>
