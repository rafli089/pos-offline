import { create } from 'zustand';
import type { SyncQueue } from '../types';
import { db } from '../lib/db';

export type NetworkStatus = 'online' | 'offline' | 'syncing' | 'sync-error';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

interface SyncState {
  networkStatus: NetworkStatus;
  queue: SyncQueue[];
  retryCount: number;
  lastSyncAt: string | null;
  lastError: string | null;

  setNetworkStatus: (status: NetworkStatus) => void;
  addToQueue: (entityType: string, entityId: string, operation: 'CREATE' | 'UPDATE' | 'DELETE', payload: unknown) => Promise<void>;
  markSynced: (id: string) => Promise<void>;
  markFailed: (id: string, error: string) => Promise<void>;
  getPendingCount: () => number;
  simulateSync: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  networkStatus: 'online',
  queue: [],
  retryCount: 0,
  lastSyncAt: null,
  lastError: null,

  setNetworkStatus: (status) => set({ networkStatus: status }),

  addToQueue: async (entityType, entityId, operation, payload) => {
    const newEntry: SyncQueue = {
      id: crypto.randomUUID(),
      entity_type: entityType,
      entity_id: entityId,
      operation,
      payload,
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString(),
    };
    await db.syncQueue.put(newEntry);
    set((state) => ({ queue: [...state.queue, newEntry] }));
  },

  markSynced: async (id) => {
    await db.syncQueue.update(id, {
      status: 'SYNCED',
      synced_at: new Date().toISOString(),
    });
    set((state) => ({
      queue: state.queue.map((q) =>
        q.id === id ? { ...q, status: 'SYNCED' as const, synced_at: new Date().toISOString() } : q
      ),
      lastSyncAt: new Date().toISOString(),
    }));
  },

  markFailed: async (id, error) => {
    await db.syncQueue.update(id, {
      status: 'FAILED',
      last_error: error,
      retry_count: (get().queue.find((q) => q.id === id)?.retry_count ?? 0) + 1,
    });
    set((state) => ({
      queue: state.queue.map((q) =>
        q.id === id
          ? { ...q, status: 'FAILED' as const, last_error: error, retry_count: q.retry_count + 1 }
          : q
      ),
      lastError: error,
      networkStatus: 'sync-error',
    }));
  },

  getPendingCount: () =>
    get().queue.filter((q) => q.status === 'PENDING' || q.status === 'FAILED').length,

  simulateSync: async () => {
    const { queue, networkStatus } = get();
    if (networkStatus === 'offline') return;
    const pending = queue.filter((q) => q.status === 'PENDING');
    if (pending.length === 0) return;
    set({ networkStatus: 'syncing' });

    const batch: Record<string, unknown[]> = { transactions: [], payments: [], shifts: [], stockMovements: [] };
    for (const q of pending) {
      const key = { transactions: 'transactions', payments: 'payments', shifts: 'shifts', stock_movements: 'stockMovements' }[q.entity_type] ?? 'transactions';
      (batch[key] as unknown[]).push(q.payload);
    }

    try {
      const res = await fetch(`${API_BASE}/api/sync/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
      if (!res.ok) throw new Error(`sync failed: ${res.status}`);
      for (const item of pending) await get().markSynced(item.id);
      set({ networkStatus: 'online', lastError: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      for (const item of pending) await get().markFailed(item.id, msg);
      set({ retryCount: get().retryCount + 1 });
    },
  },
}));

// Rehydrate queue from IndexedDB
(async () => {
  try {
    const queue = await db.syncQueue.toArray();
    useSyncStore.setState({ queue });
  } catch (e) {
    console.error('Failed to rehydrate syncStore', e);
  }
})();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setNetworkStatus('online');
    useSyncStore.getState().simulateSync();
  });
  window.addEventListener('offline', () => useSyncStore.getState().setNetworkStatus('offline'));
  if (!navigator.onLine) useSyncStore.getState().setNetworkStatus('offline');

  setInterval(() => {
    const s = useSyncStore.getState();
    if (s.networkStatus !== 'offline' && s.getPendingCount() > 0) s.simulateSync();
  }, 15_000);
}