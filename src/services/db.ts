import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface LogEntry {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  durationMinutes?: number;
  tags?: string[];
  note?: string;
  createdAt: number;
  updatedAt: number;
}

interface LoveLogDB extends DBSchema {
  logs: {
    key: string;
    value: LogEntry;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'lovelog-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LoveLogDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<LoveLogDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create logs object store
        if (!db.objectStoreNames.contains('logs')) {
          const store = db.createObjectStore('logs', { keyPath: 'id' });
          store.createIndex('by-date', 'dateStr');
        }
      },
    });
  }
  return dbPromise;
};

export const dbService = {
  async addLog(log: LogEntry) {
    const db = await initDB();
    return db.add('logs', log);
  },

  async getAllLogs() {
    const db = await initDB();
    return db.getAll('logs');
  },

  async getLogsByDate(dateStr: string) {
    const db = await initDB();
    return db.getAllFromIndex('logs', 'by-date', dateStr);
  },

  async deleteLog(id: string) {
    const db = await initDB();
    return db.delete('logs', id);
  },
  
  async updateLog(log: LogEntry) {
    const db = await initDB();
    return db.put('logs', log);
  },

  async clearAllLogs() {
    const db = await initDB();
    return db.clear('logs');
  },

  async bulkAddLogs(logs: LogEntry[]) {
    const db = await initDB();
    const tx = db.transaction('logs', 'readwrite');
    const store = tx.objectStore('logs');
    for (const log of logs) {
      await store.put(log);
    }
    return tx.done;
  }
};
