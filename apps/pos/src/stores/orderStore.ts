import { create } from 'zustand';
import type { Order, CartItem, SalesMode, VisitorType, VisitPurpose } from '../types';
import { db } from '../lib/db';
import { useSyncStore } from './syncStore';

export interface SavedOrder extends Order {
  items: CartItem[];
}

interface OrderState {
  savedOrders: SavedOrder[];
  salesModes: SalesMode[];
  visitorTypes: VisitorType[];
  visitPurposes: VisitPurpose[];

  setMetadata: (modes: SalesMode[], visitors: VisitorType[], purposes: VisitPurpose[]) => void;
  saveOrder: (items: CartItem[], meta?: { sales_mode_id?: string; visitor_type_id?: string; visit_purpose_id?: string }) => Promise<SavedOrder>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  savedOrders: [],
  salesModes: [],
  visitorTypes: [],
  visitPurposes: [],

  setMetadata: (modes, visitors, purposes) =>
    set({ salesModes: modes, visitorTypes: visitors, visitPurposes: purposes }),

  saveOrder: async (items, meta = {}) => {
    const now = new Date().toISOString();
    const seq = String(get().savedOrders.length + 1).padStart(4, '0');
    const subtotal = items.reduce((s, i) => s + i.menu.price_cents * i.quantity, 0);

    const order: SavedOrder = {
      id: crypto.randomUUID(),
      order_number: `ORD-${seq}`,
      branch_id: 'branch-001',
      business_day_id: '',
      terminal_id: 'terminal-001',
      station_id: 'station-001',
      user_id: 'system',
      shift_id: '',
      sales_mode_id: meta.sales_mode_id,
      visitor_type_id: meta.visitor_type_id,
      visit_purpose_id: meta.visit_purpose_id,
      status: 'OPEN',
      subtotal_cents: subtotal,
      discount_cents: 0,
      tax_cents: 0,
      service_charge_cents: 0,
      total_cents: subtotal,
      created_at: now,
      updated_at: now,
      items,
    };

    await db.orders.put(order as unknown as Order);
    useSyncStore.getState().addToQueue('orders', order.id, 'CREATE', order);
    set((state) => ({ savedOrders: [...state.savedOrders, order] }));
    return order;
  },

  deleteOrder: async (id) => {
    await db.orders.delete(id);
    useSyncStore.getState().addToQueue('orders', id, 'DELETE', { id });
    set((state) => ({ savedOrders: state.savedOrders.filter((o) => o.id !== id) }));
  },
}));

// Rehydrate from IndexedDB
(async () => {
  try {
    const rows = await db.orders.toArray();
    const savedOrders = rows as unknown as SavedOrder[];
    if (savedOrders.length) useOrderStore.setState({ savedOrders });
  } catch (e) {
    console.error('Failed to rehydrate orderStore', e);
  }
})();
