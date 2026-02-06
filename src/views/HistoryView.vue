<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useDateFormat } from '@vueuse/core';
import { useRoute } from 'vue-router';
import { useLogStore } from '../stores/logStore';
import CalendarWidget from '../components/business/CalendarWidget.vue';
import LogEditor from '../components/business/LogEditor.vue';
import { type LogEntry } from '../services/db';

const logStore = useLogStore();
const route = useRoute();
const selectedDate = ref(new Date());

onMounted(() => {
  if (route.query.date) {
    const d = new Date(route.query.date as string);
    if (!isNaN(d.getTime())) {
      selectedDate.value = d;
    }
  }
});

// Watch for route changes (e.g. if component is kept alive or navigating from another tab)
watch(() => route.query.date, (newDate) => {
  if (newDate) {
    const d = new Date(newDate as string);
    if (!isNaN(d.getTime())) {
      selectedDate.value = d;
    }
  }
});

const showEditor = ref(false);
const editingLog = ref<Partial<LogEntry> | undefined>(undefined);

const selectedDateStr = computed(() => useDateFormat(selectedDate, 'YYYY-MM-DD').value);
const selectedLogs = computed(() => logStore.logs.filter(l => l.dateStr === selectedDateStr.value));

const handleAddBackfill = async () => {
  if (navigator.vibrate) navigator.vibrate(50);
  
  // Create a log for selected date
  // Set time to current time for variety, or fixed? Let's use current time overlaid on selected date
  const now = new Date();
  const target = new Date(selectedDate.value);
  target.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
  
  const newLog = await logStore.addQuickLog(target);
  if (newLog) {
     // Open editor immediately for backfilled entry
     handleEditLog(newLog);
  }
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
       updatedAt: Date.now(),
       // Ensure if user changed time, we update dateStr if needed?
       // We rely on logStore/db to keep it consistent usually, but here we might need to be careful if user changes date in editor.
       // For now, assume editor maintains timestamp.
       timestamp: data.timestamp || editingLog.value.timestamp,
       dateStr: data.timestamp ? useDateFormat(data.timestamp, 'YYYY-MM-DD').value : editingLog.value.dateStr
    } as LogEntry;
    await logStore.updateEntry(updated);
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
  <div class="h-full flex flex-col py-6 safe-top safe-bottom bg-surface-light dark:bg-surface-dark">
    <!-- Header -->
    <header class="px-6 mb-4 flex items-center gap-4 animate-fade-in">
      <RouterLink to="/" class="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
        <span class="material-symbols-rounded text-2xl">arrow_back</span>
      </RouterLink>
      <h1 class="text-2xl font-bold">History</h1>
    </header>

    <main class="flex-1 px-6 space-y-6 overflow-y-auto no-scrollbar animate-slide-up pb-10">
      <!-- Calendar -->
      <section class="bg-surface-variant dark:bg-surface-variant-dark rounded-2xl p-4 flex-none">
        <CalendarWidget v-model="selectedDate" />
      </section>

      <!-- Day Actions -->
      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-bold text-lg">
             {{ useDateFormat(selectedDate, 'MMMM D, YYYY').value }}
          </h2>
          <span class="text-neutral-500 text-sm">{{ selectedLogs.length }} Records</span>
        </div>
        
        <!-- Add Button for this day -->
        <button 
          @click="handleAddBackfill"
          class="w-full py-3 rounded-xl bg-primary/10 text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors mb-4 active:scale-95"
        >
          <span class="material-symbols-rounded">add_circle</span>
          Add Record for this Day
        </button>

        <!-- List -->
        <div class="space-y-3">
          <div 
            v-for="log in selectedLogs" 
            :key="log.id"
            @click="handleEditLog(log)"
            class="bg-white dark:bg-neutral-800 border border-outline-light dark:border-outline-dark p-4 rounded-2xl flex justify-between items-center transition-all animate-fade-in cursor-pointer active:scale-98 hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            <div class="flex items-center gap-3">
               <!-- Icon -->
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-none">
                 <span class="material-symbols-rounded text-xl" v-if="log.durationMinutes">timer</span>
                 <span class="material-symbols-rounded text-xl" v-else>favorite</span>
              </div>
              <div>
                <div class="font-medium flex items-center gap-2">
                  {{ new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
                  <span v-if="log.durationMinutes" class="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">{{ log.durationMinutes }}m</span>
                </div>
                <div class="text-xs text-neutral-500 mt-0.5 flex gap-1 overflow-hidden" v-if="log.tags && log.tags.length">
                  <span v-for="tag in log.tags" :key="tag" class="truncate">#{{ tag }}</span>
                </div>
              </div>
            </div>
            <button 
              @click.stop="logStore.removeLog(log.id)"
              class="text-neutral-400 hover:text-red-500 p-2 z-10"
            >
              <span class="material-symbols-rounded">delete</span>
            </button>
          </div>
          
          <div v-if="selectedLogs.length === 0" class="text-center py-8 text-neutral-400 italic">
            No records for this date.
          </div>
        </div>
      </section>
    </main>

    <!-- Log Editor Modal -->
    <LogEditor 
      v-model="showEditor"
      :initial-data="editingLog"
      @save="handleEditorSave"
    />
  </div>
</template>
