<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useLogStore } from '../stores/logStore';
import TrendChart from '../components/business/TrendChart.vue';
import HeatmapGrid from '../components/business/HeatmapGrid.vue';

const logStore = useLogStore();
const activeTab = ref<'overview' | 'achievements'>('overview');

onMounted(() => {
  logStore.loadLogs();
});

// Computed Stats
const totalLove = computed(() => logStore.totalCount);
const currentStreak = computed(() => logStore.currentStreak);
const bestStreak = computed(() => logStore.longestStreak); 

</script>

<template>
  <div class="h-full flex flex-col py-6 safe-top safe-bottom bg-surface-light dark:bg-surface-dark overflow-hidden">
    <!-- Header -->
    <header class="px-6 mb-4 flex items-center justify-between animate-fade-in flex-none">
       <div class="flex items-center gap-4">
        <RouterLink to="/" class="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
            <span class="material-symbols-rounded text-2xl">arrow_back</span>
        </RouterLink>
        <h1 class="text-2xl font-bold">Insights</h1>
      </div>
      
      <!-- Tab Switcher -->
      <div class="flex bg-surface-variant dark:bg-surface-variant-dark p-1 rounded-xl">
        <button 
          @click="activeTab = 'overview'"
          class="px-3 py-1 text-sm font-medium rounded-lg transition-all"
          :class="activeTab === 'overview' ? 'bg-white dark:bg-neutral-800 shadow-sm text-primary' : 'text-neutral-500 hover:text-neutral-700'"
        >
          Stats
        </button>
        <button 
          @click="activeTab = 'achievements'"
          class="px-3 py-1 text-sm font-medium rounded-lg transition-all"
          :class="activeTab === 'achievements' ? 'bg-white dark:bg-neutral-800 shadow-sm text-primary' : 'text-neutral-500 hover:text-neutral-700'"
        >
          Badges
        </button>
      </div>
    </header>

    <!-- Global Year Switcher (Only visible in Stats tab) -->
    <div v-if="activeTab === 'overview' && logStore.availableYears.length > 1" class="px-6 mb-2 animate-fade-in flex-none">
       <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
             v-for="year in logStore.availableYears" 
             :key="year"
             @click="logStore.statsYear = year"
             class="px-3 py-1.5 text-xs font-bold rounded-full transition-all border shrink-0"
             :class="logStore.statsYear === year ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-surface-variant dark:bg-surface-variant-dark text-neutral-500 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700'"
           >
             {{ year }}
           </button>
       </div>
    </div>

    <main class="flex-1 px-6 overflow-y-auto no-scrollbar animate-slide-up space-y-6 pb-10">
      
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Key Metrics Cards -->
        <div class="grid grid-cols-2 gap-4">
           <div class="bg-surface-variant dark:bg-surface-variant-dark p-4 rounded-2xl relative overflow-hidden">
              <div class="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <span class="material-symbols-rounded text-9xl">favorite</span>
              </div>
              <div class="relative z-10">
                  <div class="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Total Love</div>
                  <div class="text-3xl font-bold text-primary">{{ totalLove }}</div>
              </div>
           </div>
           
           <div class="bg-surface-variant dark:bg-surface-variant-dark p-4 rounded-2xl relative overflow-hidden">
              <div class="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                  <span class="material-symbols-rounded text-9xl">local_fire_department</span>
              </div>
              <div class="relative z-10">
                  <div class="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Current Streak</div>
                  <div class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-baseline gap-1">
                     {{ currentStreak }} <span class="text-sm font-normal text-neutral-500">days</span>
                  </div>
                  <div class="text-[10px] text-neutral-400 mt-1">
                     Best: {{ bestStreak }} days
                  </div>
              </div>
           </div>
        </div>

        <!-- Charts -->
        <section class="bg-surface-variant dark:bg-surface-variant-dark p-5 rounded-3xl">
           <div class="mb-4 flex justify-between items-center">
             <h3 class="text-xs font-bold text-neutral-500 uppercase tracking-widest">Monthly Trend</h3>
           </div>
           <div class="h-[200px] w-full">
              <TrendChart type="trend" />
           </div>
        </section>

         <!-- Tag Breakdown -->
        <section class="bg-surface-variant dark:bg-surface-variant-dark p-5 rounded-3xl">
           <div class="mb-4">
             <h3 class="text-xs font-bold text-neutral-500 uppercase tracking-widest">Distribution</h3>
           </div>
           <div class="h-[200px] w-full">
              <TrendChart type="tags" />
           </div>
        </section>

        <!-- Yearly Review Heatmap -->
        <section class="bg-surface-variant dark:bg-surface-variant-dark p-5 rounded-3xl">
           <div class="mb-4">
             <h3 class="text-xs font-bold text-neutral-500 uppercase tracking-widest">Yearly Review</h3>
           </div>
           <HeatmapGrid />
        </section>
      </div>

      <!-- Achievements Tab -->
      <div v-else class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
           <div 
             v-for="badge in logStore.achievements" 
             :key="badge.id"
             class="relative rounded-2xl p-[2px] overflow-hidden transition-all animate-fade-in group"
             :class="[
                badge.unlocked ? '' : 'opacity-80',
                badge.secret && !badge.unlocked ? 'opacity-50' : ''
             ]"
           >
              <!-- Border Gradient Layer -->
              <div 
                v-if="!(badge.secret && !badge.unlocked)"
                class="absolute inset-0 transition-transform duration-1000 ease-out"
                :style="{ 
                   background: badge.secret && badge.unlocked 
                      ? `conic-gradient(#fbbf24 100%, transparent 0)` 
                      : `conic-gradient(var(--color-primary) ${badge.unlocked ? 100 : (badge.progress / badge.target * 100)}%, transparent 0)` 
                }"
                :class="badge.unlocked ? 'opacity-20' : 'opacity-100'"
              ></div>

              <!-- Inner Content -->
              <div class="relative bg-surface-variant dark:bg-surface-variant-dark rounded-xl p-4 flex flex-col items-center text-center h-full z-10">
                 
                  <!-- Icon Container -->
                 <div 
                   class="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors"
                   :class="[
                      badge.unlocked && badge.secret ? 'bg-amber-400 text-white shadow-lg shadow-amber-400/30' : '',
                      badge.unlocked && !badge.secret ? 'bg-primary text-white shadow-lg shadow-primary/30' : '',
                      !badge.unlocked ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 grayscale' : ''
                   ]"
                 >
                     <span class="material-symbols-rounded text-2xl">
                        {{ (badge.secret && !badge.unlocked) ? 'lock' : badge.icon }}
                     </span>
                 </div>
                 
                 <h3 class="font-bold text-sm mb-1 line-clamp-1">
                    {{ (badge.secret && !badge.unlocked) ? '???' : badge.name }}
                 </h3>
                 <p class="text-xs text-neutral-500 leading-tight mb-2 line-clamp-2 h-8">
                    {{ (badge.secret && !badge.unlocked) ? 'Keep exploring to reveal.' : badge.desc }}
                 </p>
                 
                 <div class="mt-auto text-[10px] font-bold uppercase tracking-wider" 
                    :class="[
                      badge.unlocked && badge.secret ? 'text-amber-500' : '',
                      badge.unlocked && !badge.secret ? 'text-primary' : '',
                      !badge.unlocked ? 'text-neutral-400' : ''
                    ]"
                 >
                    <span v-if="badge.secret && !badge.unlocked">SECRET</span>
                    <span v-else-if="badge.unlocked">Unlocked</span>
                    <span v-else>{{ badge.progress }} / {{ badge.target }}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
      
    </main>
  </div>
</template>
