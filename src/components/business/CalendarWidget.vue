<script setup lang="ts">
import { computed, ref } from 'vue';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  subMonths, 
  addMonths, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay,
  isFuture
} from 'date-fns';
import { useLogStore } from '../../stores/logStore';

const props = defineProps<{
  modelValue?: Date
}>();

const emit = defineEmits(['update:modelValue', 'select']);

const logStore = useLogStore();
const currentMonth = ref(new Date());

const days = computed(() => {
  const start = startOfWeek(startOfMonth(currentMonth.value));
  const end = endOfWeek(endOfMonth(currentMonth.value));
  return eachDayOfInterval({ start, end });
});

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Navigation
const prevMonth = () => currentMonth.value = subMonths(currentMonth.value, 1);
const nextMonth = () => currentMonth.value = addMonths(currentMonth.value, 1);

// Helpers
const getLogCount = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return logStore.logs.filter(l => l.dateStr === dateStr).length;
};

const handleSelect = (date: Date) => {
  if (isFuture(date)) return; // Prevent future logging? Or allow? PRD didn't specify, but typically future is locked.
  emit('update:modelValue', date);
  emit('select', date);
};

const isSelected = (date: Date) => props.modelValue && isSameDay(date, props.modelValue);
</script>

<template>
  <div class="w-full select-none">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4 px-2">
      <button @click="prevMonth" class="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
        <span class="material-symbols-rounded">chevron_left</span>
      </button>
      <h2 class="font-bold text-lg">{{ format(currentMonth, 'MMMM yyyy') }}</h2>
      <button @click="nextMonth" class="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full" :disabled="isFuture(addMonths(currentMonth, 1))">
         <!-- Disable going too far future? Just simple logic for now -->
        <span class="material-symbols-rounded">chevron_right</span>
      </button>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-7 text-center text-sm mb-2">
      <div v-for="day in weekDays" :key="day" class="text-neutral-400 text-xs font-medium uppercase tracking-wider py-2">
        {{ day }}
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1">
      <div 
        v-for="date in days" 
        :key="date.toISOString()"
        @click="handleSelect(date)"
        class="aspect-square relative flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200"
        :class="[
          !isSameMonth(date, currentMonth) ? 'text-neutral-300 dark:text-neutral-700' : 'text-neutral-700 dark:text-neutral-200',
          isSelected(date) ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark bg-primary/10' : 'hover:bg-black/5 dark:hover:bg-white/5',
          isFuture(date) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
        ]"
      >
        <span>{{ format(date, 'd') }}</span>
        
        <!-- Indicator Dot for Logs -->
        <div 
          v-if="getLogCount(date) > 0"
          class="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary"
        ></div>
      </div>
    </div>
  </div>
</template>
