import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { dbService, type LogEntry } from '../services/db';
import { v4 as uuidv4 } from 'uuid';
import { useNow, useDateFormat } from '@vueuse/core';
import i18n from '../i18n';

export const useLogStore = defineStore('logs', () => {
  const logs = ref<LogEntry[]>([]);
  const loading = ref(false);
  const statsYear = ref(new Date().getFullYear());

  // Computed
  const todayLogs = computed(() => {
    const today = useDateFormat(useNow(), 'YYYY-MM-DD').value;
    return logs.value.filter(l => l.dateStr === today);
  });

  const totalCount = computed(() => logs.value.length);

  // 最近一条记录
  const lastLog = computed(() => {
    if (logs.value.length === 0) return null;
    return logs.value[0]; // logs 已按 timestamp desc 排序
  });

  // 本月记录次数
  const monthlyCount = computed(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return logs.value.filter(l => {
      const d = new Date(l.timestamp);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  });

  // Actions
  async function loadLogs() {
    loading.value = true;
    try {
      logs.value = await dbService.getAllLogs();
      // Sort by timestamp desc
      logs.value.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      loading.value = false;
    }
  }

  // Define Badge Types
  type BadgeType = 'count' | 'streak' | 'daily_max' | 'time' | 'time_night' | 'weekend' | 'duration_under' | 'duration_over' | 'tag' | 'date_match' | 'exact_count';

  interface BaseBadge {
    id: string;
    name: string;
    desc: string;
    icon: string;
    target: number;
    type: BadgeType;
    secret?: boolean;
    // Optional props for different types (or use discriminated union)
    start?: number;
    end?: number;
    minutes?: number;
    tag?: string;
    month?: number;
    day?: number;
  }

  // To make it strict, we could use a Discriminated Union, but for simplicity in this file, we can make props optional in interface
  // or use `as` casting when safely accessing.
  // A cleaner approach for TS is fully specified union:
  

  
  // Actually simpler: Just use BaseBadge with all optional props is often easiest if we check type. 
  // But let's stick to the generated code style but fix the access.

  async function addQuickLog(date?: Date) {
    // 1. Snapshot currently unlocked badges
    const prevUnlocked = new Set(achievements.value.filter(b => b.unlocked).map(b => b.id));

    const targetDate = date || new Date();
    
    // If date is provided, ensures it has a timestamp.
    
    const newLog: LogEntry = {
      id: uuidv4(),
      timestamp: targetDate.getTime(),
      dateStr: useDateFormat(targetDate, 'YYYY-MM-DD').value,
      tags: [i18n.global.t('default_tag')], // Default tag
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    };

    // Optimistic Update: Insert in correct order
    logs.value.push(newLog);
    logs.value.sort((a, b) => b.timestamp - a.timestamp);

    try {
      await dbService.addLog(newLog);
      
      // 2. Diff unlocked badges
      // We must wait for reactivity? Computed updates should be relatively sync effectively or nextTick.
      // But since we modified logs.value, the computed achievements should re-evaluate.
      
      const newUnlocked = achievements.value.filter(b => b.unlocked);
      newUnlocked.forEach(b => {
         if (!prevUnlocked.has(b.id)) {
             // 🎯 Achievement Unlocked!
             const event = new CustomEvent('show-toast', {
                detail: {
                    title: i18n.global.t('achievements.unlocked_title'),
                    message: i18n.global.t(b.name),
                    icon: b.icon,
                    type: 'achievement'
                }
             });
             window.dispatchEvent(event);
         }
      });

      return newLog; // Success
    } catch (e) {
      // Rollback on failure
      logs.value = logs.value.filter(l => l.id !== newLog.id);
      console.error('Failed to save log', e);
      throw e;
    }
  }

  async function updateEntry(log: LogEntry) {
    const index = logs.value.findIndex(l => l.id === log.id);
    if (index !== -1) {
      logs.value[index] = log; // Optimistic update
    }
    // 将 Proxy 转换为普通对象再保存到 IndexedDB
    const plainLog = JSON.parse(JSON.stringify(log)) as LogEntry;
    await dbService.updateLog(plainLog);
  }

  async function removeLog(id: string) {
    const startIdx = logs.value.findIndex(l => l.id === id);
    if (startIdx === -1) return;

    const [removed] = logs.value.splice(startIdx, 1);
    
    try {
      await dbService.deleteLog(id);
    } catch (e) {
      // Rollback
      if (removed) {
        logs.value.splice(startIdx, 0, removed);
      }
      console.error('Failed to delete log', e);
    }
  }

  async function exportData() {
    // Return JSON string
    return JSON.stringify(logs.value, null, 2);
  }

  async function importData(jsonContent: string, mode: 'merge' | 'overwrite' = 'merge') {
    try {
      const parsed: LogEntry[] = JSON.parse(jsonContent);
      if (!Array.isArray(parsed)) throw new Error('Invalid Data');

      if (mode === 'overwrite') {
        await dbService.clearAllLogs();
        logs.value = [];
      }

      await dbService.bulkAddLogs(parsed as LogEntry[]);
      await loadLogs(); // Reload logic
      return true;
    } catch (e) {
      console.error('Import failed', e);
      throw e;
    }
  }

  async function clearAllData() {
    await dbService.clearAllLogs();
    logs.value = [];
  }

  async function generateDemoData() {
    loading.value = true;
    try {
      const prevUnlocked = new Set(achievements.value.filter(b => b.unlocked).map(b => b.id));

      const generated: LogEntry[] = [];
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      
      // Iterate day by day
      for (let d = new Date(oneYearAgo); d <= now; d.setDate(d.getDate() + 1)) {
         // Random frequency: 0 to 4 times a day
         // Skew towards 0 or 1.
         const chance = Math.random();
         let count = 0;
         if (chance > 0.7) count = 1;
         if (chance > 0.9) count = 2;
         if (chance > 0.98) count = 3;
         
         // Specific patterns
         // Weekend boost
         const day = d.getDay();
         if ((day === 0 || day === 6) && Math.random() > 0.5) count += 1;
         
         for (let i = 0; i < count; i++) {
            const time = new Date(d);
            time.setHours(8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60));
            
            const tags = [i18n.global.t('default_tag')];
            if (time.getHours() < 10) tags.push(i18n.global.t('tags.morning'));
            if (Math.random() > 0.9) tags.push(i18n.global.t('tags.vacation'));
            
            generated.push({
               id: uuidv4(),
               timestamp: time.getTime(),
               dateStr: useDateFormat(time, 'YYYY-MM-DD').value,
               tags: tags,
               durationMinutes: Math.random() > 0.5 ? 15 + Math.floor(Math.random() * 45) : undefined,
               createdAt: new Date().getTime(),
               updatedAt: new Date().getTime()
            });
         }
      }
      
      await dbService.bulkAddLogs(generated);
      await loadLogs();

      // Check for mass unlocks
      const newUnlocked = achievements.value.filter(b => b.unlocked);
      let unlockCount = 0;
      newUnlocked.forEach(b => {
         if (!prevUnlocked.has(b.id)) unlockCount++;
      });
      
      if (unlockCount > 0) {
          const event = new CustomEvent('show-toast', {
            detail: {
                title: i18n.global.t('achievements.demo_title'),
                message: i18n.global.t('achievements.demo_message', { count: unlockCount }),
                icon: 'auto_awesome',
                type: 'achievement'
            }
         });
         window.dispatchEvent(event);
      }

    } catch (e) {
      console.error('Demo generation failed', e);
    } finally {
      loading.value = false;
    }
  }

  // Stats Computed
  const uniqueDates = computed(() => {
    const dates = new Set(logs.value.map(l => l.dateStr));
    return Array.from(dates).sort((a, b) => b.localeCompare(a)); // Descending
  });

  const currentStreak = computed(() => {
    if (uniqueDates.value.length === 0) return 0;
    

    const sorted = uniqueDates.value;
    let streak = 0;
    
    let currentCheck = new Date(); // Start today
    // Check today
    let checkStr = useDateFormat(currentCheck, 'YYYY-MM-DD').value;
    
    // If today has no log, check yesterday. If yesterday also no log, streak = 0.
    if (!sorted.includes(checkStr)) {
        // Try yesterday
        currentCheck.setDate(currentCheck.getDate() - 1);
        checkStr = useDateFormat(currentCheck, 'YYYY-MM-DD').value;
        if (!sorted.includes(checkStr)) return 0;
    }
    
    // Now count backwards
    streak = 0;
    // Simple loop
    while (true) {
       const str = useDateFormat(currentCheck, 'YYYY-MM-DD').value;
       if (sorted.includes(str)) {
          streak++;
          currentCheck.setDate(currentCheck.getDate() - 1);
       } else {
          break;
       }
    }
    return streak;
  });

  const longestStreak = computed(() => {
    if (uniqueDates.value.length === 0) return 0;
    
    let maxStreak = 0;
    let current = 0;
    let prevDate: Date | null = null;
    
    const sorted = uniqueDates.value;
    
    for (const dateStr of sorted) {
       const d = new Date(dateStr);
       if (!prevDate) {
          current = 1;
       } else {
          const diff = (prevDate.getTime() - d.getTime()) / (1000 * 3600 * 24);
          if (Math.round(diff) === 1) {
             current++;
          } else {
             maxStreak = Math.max(maxStreak, current);
             current = 1;
          }
       }
       prevDate = d;
    }
    maxStreak = Math.max(maxStreak, current);
    return maxStreak;
  });
  
  const tagStats = computed(() => {
     const counts: Record<string, number> = {};
     logs.value.forEach(l => {
        if (l.tags && l.tags.length) {
            l.tags.forEach(t => {
                counts[t] = (counts[t] || 0) + 1;
            });
        }
     });
     return counts;
  });
  

  const availableYears = computed(() => {
    const years = new Set(logs.value.map(l => new Date(l.timestamp).getFullYear()));
    if (logs.value.length === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  });

  const monthlyStats = computed(() => {
     const year = statsYear.value;
     const counts: Record<string, number> = {};
     
     // Initialize all 12 months for the selected year
     for (let m = 0; m < 12; m++) {
        const d = new Date(year, m, 1);
        const key = useDateFormat(d, 'YYYY-MM').value;
        counts[key] = 0;
     }
     
     logs.value.forEach(l => {
        const d = new Date(l.timestamp);
        if (d.getFullYear() === year) {
            const key = useDateFormat(d, 'YYYY-MM').value;
            if (counts[key] !== undefined) {
                counts[key]++;
            }
        }
     });
     return counts;
  });

  const achievements = computed(() => {
    // Define Badges Config
    const badges: BaseBadge[] = [
       // 🏆 Milestones (Total Count)
       { id: 'first_step', name: 'achievements.first_step.name', desc: 'achievements.first_step.desc', icon: 'footprint', target: 1, type: 'count' },
       { id: 'getting_started', name: 'achievements.getting_started.name', desc: 'achievements.getting_started.desc', icon: 'filter_1', target: 10, type: 'count' },
       { id: 'enthusiast', name: 'achievements.enthusiast.name', desc: 'achievements.enthusiast.desc', icon: 'favorite', target: 50, type: 'count' },
       { id: 'centurion', name: 'achievements.centurion.name', desc: 'achievements.centurion.desc', icon: 'military_tech', target: 100, type: 'count' },
       { id: 'legend', name: 'achievements.legend.name', desc: 'achievements.legend.desc', icon: 'diamond', target: 500, type: 'count' },

       // 🔥 Streaks (Consistency)
       { id: 'warming_up', name: 'achievements.warming_up.name', desc: 'achievements.warming_up.desc', icon: 'local_fire_department', target: 3, type: 'streak' },
       { id: 'on_fire', name: 'achievements.on_fire.name', desc: 'achievements.on_fire.desc', icon: 'whatshot', target: 7, type: 'streak' },
       { id: 'unstoppable', name: 'achievements.unstoppable.name', desc: 'achievements.unstoppable.desc', icon: 'bolt', target: 14, type: 'streak' },
       { id: 'month_master', name: 'achievements.month_master.name', desc: 'achievements.month_master.desc', icon: 'calendar_month', target: 30, type: 'streak' },

       // ⚡ Intensity (Daily Max)
       { id: 'double_trouble', name: 'achievements.double_trouble.name', desc: 'achievements.double_trouble.desc', icon: 'looks_two', target: 2, type: 'daily_max' },
       { id: 'hat_trick', name: 'achievements.hat_trick.name', desc: 'achievements.hat_trick.desc', icon: 'looks_3', target: 3, type: 'daily_max' },
       { id: 'insatiable', name: 'achievements.insatiable.name', desc: 'achievements.insatiable.desc', icon: 'all_inclusive', target: 5, type: 'daily_max' },

       // 🕰️ Timing & Context
       { id: 'early_bird', name: 'achievements.early_bird.name', desc: 'achievements.early_bird.desc', icon: 'wb_twilight', target: 5, type: 'time', start: 5, end: 9 },
       { id: 'night_owl', name: 'achievements.night_owl.name', desc: 'achievements.night_owl.desc', icon: 'bedtime', target: 10, type: 'time_night' }, 
       { id: 'weekend_warrior', name: 'achievements.weekend_warrior.name', desc: 'achievements.weekend_warrior.desc', icon: 'weekend', target: 10, type: 'weekend' },
       
       // ⏳ Duration
       { id: 'quickie', name: 'achievements.quickie.name', desc: 'achievements.quickie.desc', icon: 'timer', target: 10, type: 'duration_under', minutes: 15 },
       { id: 'marathon', name: 'achievements.marathon.name', desc: 'achievements.marathon.desc', icon: 'timelapse', target: 5, type: 'duration_over', minutes: 45 },

       // 🌍 Tags
       { id: 'adventurer', name: 'achievements.adventurer.name', desc: 'achievements.adventurer.desc', icon: 'flight', target: 1, type: 'tag', tag: i18n.global.t('tags.vacation') },

       // 🕵️ Hidden / Special (Secret)
       { id: 'cupid', name: 'achievements.cupid.name', desc: 'achievements.cupid.desc', icon: 'favorite', target: 1, type: 'date_match', month: 1, day: 14, secret: true },
       { id: 'new_year', name: 'achievements.new_year.name', desc: 'achievements.new_year.desc', icon: 'celebration', target: 1, type: 'date_match', month: 0, day: 1, secret: true },
       { id: 'the_answer', name: 'achievements.the_answer.name', desc: 'achievements.the_answer.desc', icon: 'psychology', target: 42, type: 'exact_count', secret: true },
    ];
    
    // Pre-calculate Statistics
    const total = totalCount.value;
    const streak = longestStreak.value; // Use all-time best streak
    
    // Daily Max
    const dailyCounts: Record<string, number> = {};
    logs.value.forEach(l => dailyCounts[l.dateStr] = (dailyCounts[l.dateStr] || 0) + 1);
    const maxDaily = Math.max(0, ...Object.values(dailyCounts));

    // Complex Stats Counters
    let weekendCount = 0;
    let nightOwlCount = 0; // 22:00 - 04:00
    let earlyBirdCount = 0; // 05:00 - 09:00
    let marathonCount = 0; // > 45m
    let quickieCount = 0; // < 15m
    const tagCounts = tagStats.value;
    
    // Date Match Checks
    const presentDates = new Set<string>();

    logs.value.forEach(l => {
       const d = new Date(l.timestamp);
       const h = d.getHours();
       const day = d.getDay(); // 0=Sun, 6=Sat
       const m = d.getMonth(); // 0-11
       const date = d.getDate(); // 1-31
       
       presentDates.add(`${m}-${date}`);

       // Weekend
       if (day === 0 || day === 6) weekendCount++;

       // Night Owl (22, 23, 0, 1, 2, 3)
       if (h >= 22 || h < 4) nightOwlCount++;

       // Early Bird (5, 6, 7, 8)
       if (h >= 5 && h < 9) earlyBirdCount++;

       // Duration
       if (l.durationMinutes) {
          if (l.durationMinutes > 45) marathonCount++;
          if (l.durationMinutes < 15) quickieCount++;
       }
    });

    return badges.map(b => {
       let progress = 0;
       if (b.type === 'count') progress = total;
       if (b.type === 'exact_count') progress = total;
       
       if (b.type === 'streak') progress = streak;
       if (b.type === 'daily_max') progress = maxDaily;
       if (b.type === 'tag' && b.tag) progress = tagCounts[b.tag] || 0;
       
       // New Logic
       if (b.type === 'weekend') progress = weekendCount;
       if (b.type === 'time' && b.start !== undefined && b.end !== undefined) {
           if (b.id === 'early_bird') progress = earlyBirdCount; 
       }
       if (b.type === 'time_night') progress = nightOwlCount;
       if (b.type === 'duration_over') progress = marathonCount;
       if (b.type === 'duration_under') progress = quickieCount;
       
       if (b.type === 'date_match' && b.month !== undefined && b.day !== undefined) {
          if (presentDates.has(`${b.month}-${b.day}`)) {
              progress = 1;
          } else {
              progress = 0;
          }
       }
       
       return {
          ...b,
          progress,
          unlocked: progress >= b.target
       };
    });
  });

  return {
    logs,
    loading,
    todayLogs,
    totalCount,
    lastLog,
    monthlyCount,
    uniqueDates,
    currentStreak,
    longestStreak,
    tagStats,
    monthlyStats,
    statsYear,
    availableYears,
    achievements,
    loadLogs,
    addQuickLog,
    removeLog,
    exportData,
    importData,
    clearAllData,
    generateDemoData,
    updateEntry
  };
});
