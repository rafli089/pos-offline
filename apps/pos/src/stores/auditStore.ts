import { create } from 'zustand';
import type { AuditLog } from '../types';
import { db } from '../lib/db';

interface AuditState {
  logs: AuditLog[];
  log: (action: string, entityType: string, entityId: string, data?: { old_data?: unknown; new_data?: unknown; reason?: string }) => Promise<void>;
  getLogs: (shift_id?: string) => AuditLog[];
}

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: [],

  log: async (action, entityType, entityId, data) => {
    const entry: AuditLog = {
      id: crypto.randomUUID(),
      user_id: 'system',
      branch_id: 'branch-001',
      terminal_id: 'terminal-001',
      shift_id: undefined,
      action,
      entity_type: entityType,
      entity_id: entityId,
      reason: data?.reason,
      old_data: data?.old_data,
      new_data: data?.new_data,
      created_at: new Date().toISOString(),
    };
    await db.auditLogs.put(entry);
    set((state) => ({ logs: [...state.logs, entry] }));
  },

  getLogs: (shift_id) =>
    shift_id ? get().logs.filter((l) => l.shift_id === shift_id) : get().logs,
}));

// Rehydrate from IndexedDB
(async () => {
  try {
    const logs = await db.auditLogs.toArray();
    useAuditStore.setState({ logs });
  } catch (e) {
    console.error('Failed to rehydrate auditStore', e);
  }
})();
