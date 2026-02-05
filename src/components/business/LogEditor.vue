<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { type LogEntry } from '../../services/db';
import { useSettingsStore } from '../../stores/settingsStore';

const props = defineProps<{
  modelValue: boolean; // Is open?
  initialData?: Partial<LogEntry>;
}>();

const emit = defineEmits(['update:modelValue', 'save']);

// Stores
const settingsStore = useSettingsStore();

const duration = ref(0);
const selectedTags = ref<string[]>([]);
const startTime = ref('');
const note = ref('');

// Tags
const defaultTags = ['Make Love'];
const availableTags = computed(() => {
   // Merge default tags with user custom tags
   return [...defaultTags, ...settingsStore.settings.customTags];
});

const initForm = () => {
    duration.value = props.initialData?.durationMinutes || 0;
    
    // If editing existing log with tags, ensure they are selected.
    // Also, if the existing log has a custom tag that is NOT in availableTags list (e.g. from an old backup or deleted tag),
    // strictly speaking we might want to show it or auto-add it? 
    // For now, let's just respect the data.
    if (props.initialData?.tags && props.initialData.tags.length > 0) {
        selectedTags.value = [...props.initialData.tags];
        // Optional: Auto-add to available tags if missing? 
        // props.initialData.tags.forEach(t => {
        //    if (!defaultTags.includes(t)) settingsStore.addTag(t);
        // });
         selectedTags.value.forEach(t => {
            if (!defaultTags.includes(t)) settingsStore.addTag(t);
         });
    } else {
        selectedTags.value = ['Make Love'];
    }
    
    note.value = props.initialData?.note || '';
    
    // timestamp to datetime-local string
    const ts = props.initialData?.timestamp || Date.now();
    const date = new Date(ts);
    // Format: YYYY-MM-DDTHH:mm
    const pad = (n: number) => n.toString().padStart(2, '0');
    startTime.value = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initForm();
  }
});

const toggleTag = (tag: string) => {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter(t => t !== tag);
  } else {
    selectedTags.value.push(tag);
  }
};

const handleSave = () => {
  const newTimestamp = new Date(startTime.value).getTime();
  
  emit('save', {
    timestamp: newTimestamp,
    durationMinutes: duration.value,
    tags: selectedTags.value,
    note: note.value
  });
  close();
};

const close = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="close"></div>

    <!-- Sheet -->
    <div class="bg-surface-light dark:bg-surface-dark w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 animate-slide-up">
      <header class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">Details</h2>
        <button @click="close" class="p-2 -mr-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          <span class="material-symbols-rounded">close</span>
        </button>
      </header>
      
      <div class="space-y-6">
        <!-- Duration Slider -->
        <div class="space-y-2">
           <div class="flex justify-between">
             <label class="text-sm font-medium text-neutral-500 uppercase tracking-widest">Duration</label>
             <span class="font-medium text-primary">{{ duration }} min</span>
           </div>
           <input 
             type="range" 
             min="0" 
             max="120" 
             step="5" 
             v-model.number="duration"
             class="w-full accent-primary h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
           />
           <div class="flex justify-between text-xs text-neutral-400">
             <span>Quick</span>
             <span>Long</span>
           </div>
        </div>

        <!-- Start Time -->
        <div class="space-y-2">
           <label class="text-sm font-medium text-neutral-500 uppercase tracking-widest">Started At</label>
           <input 
             type="datetime-local" 
             v-model="startTime"
             class="w-full bg-surface-variant dark:bg-surface-variant-dark rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
           />
        </div>

        <!-- Tags -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-neutral-500 uppercase tracking-widest">Tags</label>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="tag in availableTags" 
              :key="tag"
              @click="toggleTag(tag)"
              class="px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 select-none"
              :class="selectedTags.includes(tag) 
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                : 'bg-transparent text-neutral-600 dark:text-neutral-300 border-outline-light dark:border-outline-dark hover:bg-neutral-100 dark:hover:bg-neutral-800'"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- Note -->
        <div class="space-y-2">
           <label class="text-sm font-medium text-neutral-500 uppercase tracking-widest">Note</label>
           <textarea 
             v-model="note"
             rows="3"
             placeholder="Add a private note..."
             class="w-full bg-surface-variant dark:bg-surface-variant-dark rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
           ></textarea>
        </div>

        <!-- Save Button -->
        <button 
          @click="handleSave"
          class="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/30 active:scale-95 transition-all"
        >
          Save Log
        </button>
      </div>
    </div>
  </div>
</template>
