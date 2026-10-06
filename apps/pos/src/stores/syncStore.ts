import { create } from 'zustand';
import type { SyncQueue } from '../types';

export type NetworkStatus = 'online' | 'offline' | 'syncing' | 'sync-error';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

interface SyncState {
  networkStatus: NetworkStatus;
  queue: SyncQueue[];
  retryCount: number;
  lastSyncAt: string | null;
  lastError: string | null;

  setNetworkStatus: (status: NetworkStatus) => void;
  addToQueue: (entityType: string, entityId: string, operation: 'CREATE' | 'UPDATE' | 'DELETE', payload: unknown) => void;
  markSynced: (id: string) => void;
  markFailed: (id: string, error: string) => void;
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

  addToQueue: (entityType, entityId, operation, payload) => {
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
    set((state) => ({ queue: [...state.queue, newEntry] }));
  },

  markSynced: (id) => {
    set((state) => ({
      queue: state.queue.map((q) =>
        q.id === id ? { ...q, status: 'SYNCED' as const, synced_at: new Date().toISOString() } : q
      ),
      lastSyncAt: new Date().toISOString(),
    }));
  },

  markFailed: (id, error) => {
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

    // group queue entries by entity type → sync batch shape (PRD §16.2)
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
      pending.forEach((item) => get().markSynced(item.id));
      set({ networkStatus: 'online', lastError: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      // backoff: increment retry, mark FAILED (retried on next sync tick)
      pending.forEach((item) => get().markFailed(item.id, msg));
      set({ retryCount: get().retryCount + 1 });
    }
  },
}));

// Auto-detect network + periodic sync tick
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setNetworkStatus('online');
    useSyncStore.getState().simulateSync();
  });
  window.addEventListener('offline', () => useSyncStore.getState().setNetworkStatus('offline'));
  if (!navigator.onLine) useSyncStore.getState().setNetworkStatus('offline');

  // retry pending queue every 15s while online (PRD §16 offline sync)
  setInterval(() => {
    const s = useSyncStore.getState();
    if (s.networkStatus !== 'offline' && s.getPendingCount() > 0) s.simulateSync();
  }, 15_000);
}
