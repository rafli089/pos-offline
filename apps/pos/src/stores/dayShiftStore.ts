import { create } from 'zustand';
import type { BusinessDay, Shift, ShiftLog } from '../types';
import { db } from '../lib/db';

interface DayShiftState {
  businessDay: BusinessDay | null;
  activeShift: Shift | null;
  shiftLogs: ShiftLog[];
  posStatus: 'LOCKED' | 'READY' | 'BUSINESS_DAY_NOT_STARTED' | 'SHIFT_NOT_STARTED' | 'SHIFT_ACTIVE' | 'OFFLINE' | 'SYNCING' | 'SYNC_ERROR';

  setBusinessDay: (day: BusinessDay) => Promise<void>;
  startDay: (branchId: string, startedBy: string, businessDate: string) => Promise<void>;
  endDay: (endedBy: string) => Promise<void>;
  isBusinessDayOpen: () => boolean;
  canEndDay: () => boolean;

  startShift: (shift: Shift) => Promise<void>;
  closeShift: (shiftId: string, actualCash: number) => Promise<void>;
  recordSale: (amountCents: number) => Promise<void>;
  setShiftLog: (log: ShiftLog) => Promise<void>;

  setStatus: (status: DayShiftState['posStatus']) => void;
  reset: () => Promise<void>;
}

export const useDayShiftStore = create<DayShiftState>((set, get) => ({
  businessDay: null,
  activeShift: null,
  shiftLogs: [],
  posStatus: 'LOCKED',

  setBusinessDay: async (day) => {
    await db.businessDays.put(day);
    set({ businessDay: day });
  },

  startDay: async (branchId, startedBy, businessDate) => {
    const day: BusinessDay = {
      id: crypto.randomUUID(),
      branch_id: branchId,
      business_date: businessDate,
      started_by: startedBy,
      started_at: new Date().toISOString(),
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.businessDays.put(day);
    set({ businessDay: day, posStatus: 'READY' });
  },

  endDay: async (endedBy) => {
    const { businessDay, activeShift, shiftLogs } = get();
    if (!businessDay || businessDay.status !== 'OPEN') return;

    if (activeShift && activeShift.status === 'OPEN') return;

    const starts = shiftLogs.filter(l => l.action === 'SHIFT_STARTED').length;
    const closes = shiftLogs.filter(l => l.action === 'SHIFT_CLOSED').length;
    if (starts !== closes) return;

    if (businessDay) {
      const updated = {
        ...businessDay,
        ended_by: endedBy,
        ended_at: new Date().toISOString(),
        status: 'ENDED' as const,
      };
      await db.businessDays.put(updated);
      set({
        businessDay: updated,
        posStatus: 'BUSINESS_DAY_NOT_STARTED' as const,
      });
    }
  },

  isBusinessDayOpen: () => {
    return get().businessDay?.status === 'OPEN' || get().businessDay?.status === 'ENDING';
  },

  canEndDay: () => {
    const { businessDay, activeShift, shiftLogs } = get();
    if (!businessDay || businessDay.status !== 'OPEN') return false;
    const starts = shiftLogs.filter(l => l.action === 'SHIFT_STARTED').length;
    const closes = shiftLogs.filter(l => l.action === 'SHIFT_CLOSED').length;
    if (starts !== closes) return false;
    if (activeShift && activeShift.status === 'OPEN') return false;
    return true;
  },

  startShift: async (shift) => {
    const newShift: Shift = { ...shift };
    await db.shifts.put(newShift);
    const log: ShiftLog = {
      id: crypto.randomUUID() as ShiftLog['id'],
      shift_id: shift.id,
      user_id: shift.user_id,
      action: 'SHIFT_STARTED',
      created_at: new Date().toISOString(),
    };
    await db.shiftLogs.put(log);
    set((state) => ({
      activeShift: newShift,
      shiftLogs: [...state.shiftLogs, log],
      posStatus: 'SHIFT_ACTIVE',
    }));
  },

  closeShift: async (shiftId, actualCash) => {
    const shift = get().activeShift;
    if (!shift || shift.id !== shiftId) return;

    const variance = actualCash - shift.expected_cash;
    const varianceStatus = variance === 0 ? 'BALANCED' : variance < 0 ? 'SHORT' : 'OVER';

    const closedShift: Shift = {
      ...shift,
      status: 'CLOSED',
      actual_cash: actualCash,
      variance,
      variance_status: varianceStatus as 'BALANCED' | 'SHORT' | 'OVER',
      closed_at: new Date().toISOString(),
    };
    await db.shifts.put(closedShift);
    const log: ShiftLog = {
      id: crypto.randomUUID() as ShiftLog['id'],
      shift_id: shiftId as ShiftLog['shift_id'],
      user_id: shift.user_id,
      action: 'SHIFT_CLOSED',
      created_at: new Date().toISOString(),
    };
    await db.shiftLogs.put(log);
    set((state) => ({
      activeShift: closedShift,
      shiftLogs: [...state.shiftLogs, log],
      posStatus: 'READY',
    }));
  },

  recordSale: async (amountCents) => {
    const shift = get().activeShift;
    if (!shift || shift.status !== 'OPEN') return;
    const cash_sales = shift.cash_sales + amountCents;
    const expected_cash = shift.starting_cash + cash_sales + shift.cash_in - shift.cash_out - shift.cash_refund;
    const updated = {
      ...shift,
      cash_sales,
      expected_cash,
    };
    await db.shifts.put(updated);
    set({ activeShift: updated });
  },

  setShiftLog: async (log) => {
    await db.shiftLogs.put(log);
    set((state) => ({ shiftLogs: [...state.shiftLogs, log] }));
  },

  setStatus: (status) => set({ posStatus: status }),

  reset: async () => {
    await db.businessDays.clear();
    await db.shifts.clear();
    await db.shiftLogs.clear();
    set({
      businessDay: null,
      activeShift: null,
      shiftLogs: [],
      posStatus: 'LOCKED',
    });
  },
}));

// Rehydrate from IndexedDB
(async () => {
  try {
    const [businessDay, activeShift, shiftLogs] = await Promise.all([
      db.businessDays.reverse().first(),
      db.shifts.reverse().first(),
      db.shiftLogs.toArray(),
    ]);
    useDayShiftStore.setState({
      businessDay: businessDay ?? null,
      activeShift: activeShift ?? null,
      shiftLogs: shiftLogs ?? [],
    });
  } catch (e) {
    console.error('Failed to rehydrate dayShiftStore', e);
  }
})();