import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { dbService, type LogEntry } from '../services/db';
import { v4 as uuidv4 } from 'uuid';
import { useNow, useDateFormat } from '@vueuse/core';

export const useLogStore = defineStore('logs', () => {
  const logs = ref<LogEntry[]>([]);
  const loading = ref(false);

  // Computed
  const todayLogs = computed(() => {
    const today = useDateFormat(useNow(), 'YYYY-MM-DD').value;
    return logs.value.filter(l => l.dateStr === today);
  });

  const totalCount = computed(() => logs.value.length);

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

  async function addQuickLog(date?: Date) {
    // 1. Snapshot currently unlocked badges
    const prevUnlocked = new Set(achievements.value.filter(b => b.unlocked).map(b => b.id));

    const targetDate = date || new Date();
    
    // If date is provided, ensures it has a timestamp.
    
    const newLog: LogEntry = {
      id: uuidv4(),
      timestamp: targetDate.getTime(),
      dateStr: useDateFormat(targetDate, 'YYYY-MM-DD').value,
      tags: ['Make Love'], // Default tag
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
      // Let's assume sync reactivity for simpler ref updates or check in nextTick if needed.
      // Actually standard pinia computed is sync if based on store state Refs.
      
      const newUnlocked = achievements.value.filter(b => b.unlocked);
      newUnlocked.forEach(b => {
         if (!prevUnlocked.has(b.id)) {
             // 🎯 Achievement Unlocked!
             const event = new CustomEvent('show-toast', {
                detail: {
                    title: 'Achievement Unlocked!',
                    message: b.name,
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
            
            const tags = ['Make Love'];
            if (time.getHours() < 10) tags.push('Morning');
            if (Math.random() > 0.9) tags.push('Vacation');
            
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
                title: 'Demo Data Generated',
                message: `Unlocked ${unlockCount} achievements!`,
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
    
    const today = useDateFormat(useNow(), 'YYYY-MM-DD').value;
    const sorted = uniqueDates.value;
    let streak = 0;
    
    // Check if today or yesterday exists to start the streak
    // If last log was 2 days ago, streak is broken, but we display 0.
    // However, if today is logged, count 1.
    // If yesterday logged, count +1.
    
    // Logic: Look for continuous sequence from today/yesterday.
    // We iterate backwards from today.
    
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
    // We already established the start of the chain (today or yesterday)
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
    
    // Iterate from oldest to newest to count simpler? Or newest to oldest?
    // Let's go newest to oldest (sorted desc).
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
        } else {
            // No tag? Count as 'Uncategorized' or ignore?
            // counts['Other'] = (counts['Other'] || 0) + 1;
        }
     });
     return counts;
  });
  
  const statsYear = ref(new Date().getFullYear());

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
        // Construct date: Year, Month, 1st
        // Note: Months are 0-indexed in JS Date
        // We want YYYY-MM format
        // useDateFormat handles 0-indexed months correctly if passed a Date object
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
    const badges = [
       // 🏆 Milestones (Total Count)
       { id: 'first_step', name: 'First Step', desc: 'Recorded your first moment.', icon: 'footprint', target: 1, type: 'count' },
       { id: 'getting_started', name: 'Getting Started', desc: 'Recorded 10 times.', icon: 'filter_1', target: 10, type: 'count' },
       { id: 'enthusiast', name: 'Enthusiast', desc: 'Recorded 50 times.', icon: 'favorite', target: 50, type: 'count' },
       { id: 'centurion', name: 'Centurion', desc: 'Recorded 100 times.', icon: 'military_tech', target: 100, type: 'count' },
       { id: 'legend', name: 'Legend', desc: 'Recorded 500 times.', icon: 'diamond', target: 500, type: 'count' },

       // 🔥 Streaks (Consistency)
       { id: 'warming_up', name: 'Warming Up', desc: '3-day streak.', icon: 'local_fire_department', target: 3, type: 'streak' },
       { id: 'on_fire', name: 'On Fire', desc: '7-day streak.', icon: 'whatshot', target: 7, type: 'streak' },
       { id: 'unstoppable', name: 'Unstoppable', desc: '14-day streak.', icon: 'bolt', target: 14, type: 'streak' },
       { id: 'month_master', name: 'Month Master', desc: '30-day streak.', icon: 'calendar_month', target: 30, type: 'streak' },

       // ⚡ Intensity (Daily Max)
       { id: 'double_trouble', name: 'Double Trouble', desc: '2 times in one day.', icon: 'looks_two', target: 2, type: 'daily_max' },
       { id: 'hat_trick', name: 'Hat Trick', desc: '3 times in one day.', icon: 'looks_3', target: 3, type: 'daily_max' },
       { id: 'insatiable', name: 'Insatiable', desc: '5 times in one day.', icon: 'all_inclusive', target: 5, type: 'daily_max' },

       // 🕰️ Timing & Context
       { id: 'early_bird', name: 'Early Bird', desc: '5 Morning sessions (5AM-9AM).', icon: 'wb_twilight', target: 5, type: 'time', start: 5, end: 9 },
       { id: 'night_owl', name: 'Night Owl', desc: '10 Late night sessions (10PM-4AM).', icon: 'bedtime', target: 10, type: 'time_night' }, // Special logic for cross-midnight
       { id: 'weekend_warrior', name: 'Weekend Warrior', desc: '10 sessions on Weekends.', icon: 'weekend', target: 10, type: 'weekend' },
       
       // ⏳ Duration
       { id: 'quickie', name: 'Quickie', desc: '10 Quick sessions (<15m).', icon: 'timer', target: 10, type: 'duration_under', minutes: 15 },
       { id: 'marathon', name: 'Marathon', desc: '5 Long sessions (>45m).', icon: 'timelapse', target: 5, type: 'duration_over', minutes: 45 },

       // 🌍 Tags
       { id: 'adventurer', name: 'Adventurer', desc: 'Logged on Vacation.', icon: 'flight', target: 1, type: 'tag', tag: 'Vacation' },

       // 🕵️ Hidden / Special (Secret)
       { id: 'cupid', name: "Cupid's Arrow", desc: 'Logged on Valentine\'s Day (Feb 14).', icon: 'favorite', target: 1, type: 'date_match', month: 1, day: 14, secret: true },
       { id: 'new_year', name: 'New Year Spark', desc: 'Logged on Jan 1st.', icon: 'celebration', target: 1, type: 'date_match', month: 0, day: 1, secret: true },
       { id: 'the_answer', name: 'The Answer', desc: 'Recorded exactly 42 times.', icon: 'psychology', target: 42, type: 'exact_count', secret: true },
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
    const dateMatches: Record<string, boolean> = {}; // key: "M-D" e.g. "1-14" (Feb 14, month is 0-indexed in JS Date? Wait, useDateFormat or Date methods.)
    // JS Date: Month is 0-11, Date is 1-31.
    // Let's store set of "M-D" strings present in logs.
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
       if (b.type === 'exact_count') progress = total; // Trigger only on exact match? Or >=? Commonly Achievements are >= but "The Answer" implies exact. Let's do >= for simplicity or strictly exact? Let's do >= 42 to keep it unlocked.
       
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
    uniqueDates,
    currentStreak,
    longestStreak,
    tagStats,
    monthlyStats,
    statsYear,
    availableYears,
    achievements, // Export achievements
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
