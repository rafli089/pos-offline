import { create } from 'zustand';
import type { BusinessDay, Shift, ShiftLog } from '../types';

interface DayShiftState {
  businessDay: BusinessDay | null;
  activeShift: Shift | null;
  shiftLogs: ShiftLog[];
  posStatus: 'LOCKED' | 'READY' | 'BUSINESS_DAY_NOT_STARTED' | 'SHIFT_NOT_STARTED' | 'SHIFT_ACTIVE' | 'OFFLINE' | 'SYNCING' | 'SYNC_ERROR';

  // Business Day
  setBusinessDay: (day: BusinessDay) => void;
  startDay: (branchId: string, startedBy: string, businessDate: string) => void;
  endDay: (endedBy: string) => void;
  isBusinessDayOpen: () => boolean;
  canEndDay: () => boolean;

  // Shift
  startShift: (shift: Shift) => void;
  closeShift: (shiftId: string, actualCash: number) => void;
  recordSale: (amountCents: number) => void;
  setShiftLog: (log: ShiftLog) => void;

  setStatus: (status: DayShiftState['posStatus']) => void;
  reset: () => void;
}

export const useDayShiftStore = create<DayShiftState>((set, get) => ({
  businessDay: null,
  activeShift: null,
  shiftLogs: [],
  posStatus: 'LOCKED',

  setBusinessDay: (day) => set({ businessDay: day }),

  startDay: (branchId, startedBy, businessDate) => {
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
    set({ businessDay: day, posStatus: 'READY' });
  },

  endDay: (endedBy) => {
    const { businessDay, activeShift, shiftLogs } = get();
    if (!businessDay || businessDay.status !== 'OPEN') return;

    if (activeShift && activeShift.status === 'OPEN') return; // cannot end day with open shift

    // all shifts must be CLOSED (shiftLogs balance check)
    const starts = shiftLogs.filter(l => l.action === 'SHIFT_STARTED').length;
    const closes = shiftLogs.filter(l => l.action === 'SHIFT_CLOSED').length;
    if (starts !== closes) return;

    set((state) => ({
      businessDay: state.businessDay
        ? {
          ...state.businessDay,
          ended_by: endedBy,
          ended_at: new Date().toISOString(),
          status: 'ENDED',
        }
        : null,
      posStatus: 'BUSINESS_DAY_NOT_STARTED',
    }));
  },

  isBusinessDayOpen: () => {
    return get().businessDay?.status === 'OPEN' || get().businessDay?.status === 'ENDING';
  },

  // PRD End Day validation: no ACTIVE shift, no PENDING transaction, no pending payment.
  // ponytail: track all shifts + open transactions in store when scaling beyond single-shift per day.
  canEndDay: () => {
    const { businessDay, activeShift, shiftLogs } = get();
    if (!businessDay || businessDay.status !== 'OPEN') return false;
    // every STARTED shift must be CLOSED
    const starts = shiftLogs.filter(l => l.action === 'SHIFT_STARTED').length;
    const closes = shiftLogs.filter(l => l.action === 'SHIFT_CLOSED').length;
    if (starts !== closes) return false;                       // unresolved open shift
    if (activeShift && activeShift.status === 'OPEN') return false; // active open shift
    return true;                                                 // all shifts closed
  },

  startShift: (shift) => {
    set((state) => ({
      activeShift: { ...shift },
      shiftLogs: [...state.shiftLogs, {
        id: crypto.randomUUID(),
        shift_id: shift.id,
        user_id: shift.user_id,
        action: 'SHIFT_STARTED',
        created_at: new Date().toISOString(),
      }],
      posStatus: 'SHIFT_ACTIVE',
    }));
  },

  closeShift: (shiftId, actualCash) => {
    const shift = get().activeShift;
    if (!shift || shift.id !== shiftId) return;

    const variance = actualCash - shift.expected_cash;
    const varianceStatus = variance === 0 ? 'BALANCED' : variance < 0 ? 'SHORT' : 'OVER';

    const closedShift: Shift = {
      ...shift,
      status: 'CLOSED',
      actual_cash: actualCash,
      variance,
      variance_status: varianceStatus,
      closed_at: new Date().toISOString(),
    };

    set((state) => ({
      activeShift: closedShift,
      shiftLogs: [...state.shiftLogs, {
        id: crypto.randomUUID(),
        shift_id: shiftId,
        user_id: shift.user_id,
        action: 'SHIFT_CLOSED',
        amount: actualCash,
        created_at: new Date().toISOString(),
      }],
      posStatus: 'READY',
    }));
  },

  recordSale: (amountCents) => {
    const shift = get().activeShift;
    if (!shift || shift.status !== 'OPEN') return;
    const cash_sales = shift.cash_sales + amountCents;
    const expected_cash = shift.starting_cash + cash_sales + shift.cash_in - shift.cash_out - shift.cash_refund;
    set({
      activeShift: {
        ...shift,
        cash_sales,
        expected_cash,
      },
    });
  },

  setShiftLog: (log) => {
    set((state) => ({
      shiftLogs: [...state.shiftLogs, log],
    }));
  },

  setStatus: (status) => set({ posStatus: status }),

  reset: () => set({
    businessDay: null,
    activeShift: null,
    shiftLogs: [],
    posStatus: 'LOCKED',
  }),
}));

// Calculate expected cash for shift close
export const calculateExpectedCash = (shift: Shift): number => {
  return shift.starting_cash + shift.cash_sales + shift.cash_in - shift.cash_out - shift.cash_refund;
};