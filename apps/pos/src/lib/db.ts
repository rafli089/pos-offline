import Dexie, { Table } from 'dexie';
import type { 
  Menu, BusinessDay, Shift, ShiftLog, Transaction, 
  Payment, Order, SyncQueue, Stock, AuditLog, 
  MenuCategory, MenuModifier, MenuExtra 
} from '../types';

export class POSDatabase extends Dexie {
  menus!: Table<Menu>;
  categories!: Table<MenuCategory>;
  modifiers!: Table<MenuModifier>;
  extras!: Table<MenuExtra>;
  businessDays!: Table<BusinessDay>;
  shifts!: Table<Shift>;
  shiftLogs!: Table<ShiftLog>;
  transactions!: Table<Transaction>;
  payments!: Table<Payment>;
  orders!: Table<Order>;
  syncQueue!: Table<SyncQueue>;
  stock!: Table<Stock>;
  auditLogs!: Table<AuditLog>;

  constructor() {
    super('POSDatabase');
    this.version(1).stores({
      menus: 'id, branch_id, category_id, name',
      categories: 'id, branch_id, display_order',
      modifiers: 'id, menu_id',
      extras: 'id, modifier_id',
      businessDays: 'id, branch_id, business_date, status',
      shifts: 'id, business_day_id, status',
      shiftLogs: 'id, shift_id, action, created_at',
      transactions: 'id, business_day_id, shift_id, sync_status',
      payments: 'id, transaction_id',
      orders: 'id, business_day_id, shift_id, status',
      syncQueue: 'id, status, entity_type',
      stock: 'id, branch_id, menu_id',
      auditLogs: 'id, user_id, shift_id, created_at'
    });
  }
}

export const db = new POSDatabase();
