<script setup lang="ts">
import { ref, watch } from 'vue';
import { type LogEntry } from '../../services/db';

const props = defineProps<{
  modelValue: boolean; // Is open?
  initialData?: Partial<LogEntry>;
}>();

const emit = defineEmits(['update:modelValue', 'save']);

const duration = ref(0);
const selectedTags = ref<string[]>([]);
const startTime = ref('');
const customTagInput = ref('');
const note = ref('');

// Computed suggestion tags (could be moved to store getter later)
const defaultTags = ['Make Love'];
const availableTags = ref([...defaultTags]);

const initForm = () => {
    duration.value = props.initialData?.durationMinutes || 0;
    // Default to 'Make Love' if no tags present
    selectedTags.value = (props.initialData?.tags && props.initialData.tags.length > 0) 
      ? props.initialData.tags 
      : ['Make Love'];
    
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

const addCustomTag = () => {
  const val = customTagInput.value.trim();
  if (val && !selectedTags.value.includes(val)) {
    selectedTags.value.push(val);
    if (!availableTags.value.includes(val)) {
      availableTags.value.push(val);
    }
    customTagInput.value = '';
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
          <div class="flex flex-wrap gap-2 mb-2">
            <template v-for="tag in availableTags" :key="tag">
               <div class="relative group">
                  <button 
                    @click="toggleTag(tag)"
                    class="pl-3 pr-2 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 select-none flex items-center gap-1.5"
                    :class="selectedTags.includes(tag) 
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                      : 'bg-transparent text-neutral-600 dark:text-neutral-300 border-outline-light dark:border-outline-dark hover:bg-neutral-100 dark:hover:bg-neutral-800'"
                  >
                    <span class="leading-none pb-0.5">{{ tag }}</span>
                    <!-- Delete button for custom tags -->
                    <span 
                       v-if="!defaultTags.includes(tag)" 
                       @click.stop="availableTags = availableTags.filter(t => t !== tag); selectedTags = selectedTags.filter(t => t !== tag)"
                       class="rounded-full w-4 h-4 flex items-center justify-center bg-black/10 hover:bg-black/20 text-current transition-colors"
                    >
                       <span class="material-symbols-rounded text-[10px] font-bold">close</span>
                    </span>
                  </button>
               </div>
            </template>
          </div>
          
          <!-- Add Custom Tag -->
          <div class="flex gap-2">
            <input 
              v-model="customTagInput"
              @keydown.enter.prevent="addCustomTag"
              placeholder="Add custom tag..."
              class="flex-1 bg-surface-variant dark:bg-surface-variant-dark rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button 
              @click="addCustomTag"
              class="bg-neutral-200 dark:bg-neutral-700 hover:bg-primary hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add
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
