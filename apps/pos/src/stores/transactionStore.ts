import { create } from 'zustand';
import type { Transaction, Payment } from '../types';
import { db } from '../lib/db';

interface TransactionState {
  transactions: Transaction[];
  payments: Payment[];

  addTransaction: (tx: Transaction, payments: Payment[]) => Promise<void>;
  getById: (id: string) => Transaction | undefined;
  getByShift: (shiftId: string) => Transaction[];
  getByDate: (date: string) => Transaction[];
  getPayments: (txId: string) => Payment[];
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  payments: [],

  addTransaction: async (tx, payments) => {
    await db.transaction('rw', db.transactions, db.payments, async () => {
      await db.transactions.put(tx);
      for (const p of payments) await db.payments.put(p);
    });
    set((state) => ({
      transactions: [...state.transactions, tx],
      payments: [...state.payments, ...payments],
    }));
  },

  getById: (id) => get().transactions.find((t) => t.id === id),

  getByShift: (shiftId) => get().transactions.filter((t) => t.shift_id === shiftId),

  getByDate: (date) =>
    get().transactions.filter((t) => t.created_at.startsWith(date)),

  getPayments: (txId) => get().payments.filter((p) => p.transaction_id === txId),
}));

// Rehydrate from IndexedDB
(async () => {
  try {
    const transactions = await db.transactions.toArray();
    const payments = await db.payments.toArray();
    if (transactions.length || payments.length) {
      useTransactionStore.setState({ transactions, payments });
    }
  } catch (e) {
    console.error('Failed to rehydrate transactionStore', e);
  }
})();
