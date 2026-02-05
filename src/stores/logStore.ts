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
      logs.value[index] = log; // Optimistic
    }
    await dbService.updateLog(log);
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

  return {
    logs,
    loading,
    todayLogs,
    totalCount,
    loadLogs,
    addQuickLog,
    removeLog,
    exportData,
    importData,
    clearAllData,
    updateEntry
  };
});
