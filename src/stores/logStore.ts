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
    const targetDate = date || new Date();
    // Reset time to current time if quick log, or noon if backfill? 
    // If backfill, we usually want "now" time but on that date, or just default to 12:00?
    // Let's preserve current time if 'date' is today, otherwise default to 12:00 PM for backfills to avoid timezone weirdness? 
    // Or just simple: Timestamp of that date object.
    
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
    // Since we sort by timestamp desc, unshift might not be right if backfilling.
    // Insert and sort.
    logs.value.push(newLog);
    logs.value.sort((a, b) => b.timestamp - a.timestamp);

    try {
      await dbService.addLog(newLog);
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
  
  const monthlyStats = computed(() => {
     // Last 6 months?
     const counts: Record<string, number> = {};
     const now = new Date();
     for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = useDateFormat(d, 'YYYY-MM').value;
        counts[key] = 0;
     }
     
     logs.value.forEach(l => {
        const key = l.dateStr.substring(0, 7); // YYYY-MM
        if (counts[key] !== undefined) {
           counts[key]++;
        }
     });
     return counts;
  });

  const achievements = computed(() => {
    // Define Badges Config
    const badges = [
       { id: 'first_love', name: 'First Love', desc: 'Recorded your first moment.', icon: 'favorite', target: 1, type: 'count' },
       { id: 'centurion', name: 'Centurion', desc: 'Recorded 100 times.', icon: 'military_tech', target: 100, type: 'count' },
       { id: 'warming_up', name: 'Warming Up', desc: '3-day streak.', icon: 'local_fire_department', target: 3, type: 'streak' },
       { id: 'on_fire', name: 'On Fire', desc: '7-day streak.', icon: 'whatshot', target: 7, type: 'streak' },
       { id: 'passionate', name: 'Passionate', desc: 'Recorded 3 times in one day.', icon: 'bolt', target: 3, type: 'daily_max' },
       { id: 'morning_glory', name: 'Morning Glory', desc: '5 Morning sessions.', icon: 'wb_sunny', target: 5, type: 'tag', tag: 'Morning' },
       { id: 'adventurer', name: 'Adventurer', desc: 'Logged on Vacation.', icon: 'flight', target: 1, type: 'tag', tag: 'Vacation' },
       { id: 'make_love_master', name: 'True Lover', desc: '50 "Make Love" tags.', icon: 'favorite_border', target: 50, type: 'tag', tag: 'Make Love' },
    ];
    
    const stats = tagStats.value;
    const total = totalCount.value;
    const streak = longestStreak.value;
    
    // Calculate max daily
    const dailyCounts: Record<string, number> = {};
    logs.value.forEach(l => dailyCounts[l.dateStr] = (dailyCounts[l.dateStr] || 0) + 1);
    const maxDaily = Math.max(0, ...Object.values(dailyCounts));

    return badges.map(b => {
       let progress = 0;
       if (b.type === 'count') progress = total;
       if (b.type === 'streak') progress = streak; // Use longest streak for achievements
       if (b.type === 'daily_max') progress = maxDaily;
       if (b.type === 'tag' && b.tag) progress = stats[b.tag] || 0;
       
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
    achievements, // Export achievements
    loadLogs,
    addQuickLog,
    removeLog,
    exportData,
    importData,
    clearAllData,
    updateEntry
  };
});
