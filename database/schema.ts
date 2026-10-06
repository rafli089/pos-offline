/**
 * Drizzle schema — SQLite (local) + PostgreSQL (server).
 * PRD §§20.x, 28. Use `sqliteTable` for local, `pgTable` for server.
 *
 * Each table `id` is TEXT (UUIDv7/UUIDv4) to avoid AUTOINCREMENT sync issues.
 * Late oct 2026: SQLite on-device via Tauri `sql` or `op-sqlite`; PG on server.
 * Drizzle generates identical column shapes between targets — copy per table.
 *
 * ponytail: add `vector` / `pgvector for menu recommendation when needed
 */
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Users, roles, permissions (PRD 5)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  pinHash: text('pin_hash'),
  roleId: text('role_id').notNull(),
  branchId: text('branch_id').notNull(),
  terminalId: text('terminal_id').notNull(),
  status: text('status', { enum: ['active','inactive','locked'] }).default('active').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const branches = sqliteTable('branches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
});

export const stations = sqliteTable('stations', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull(),
  name: text('name').notNull(),
  type: text('type', { enum: ['cashier','bar','kitchen','admin'] }).notNull(),
});

export const terminals = sqliteTable('terminals', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull(),
  stationId: text('station_id').notNull(),
  terminalId: text('terminal_id').notNull().unique(),
  name: text('name').notNull(),
});

// Business days, shifts, shift logs (PRD 7)
export const businessDays = sqliteTable('business_days', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull(),
  businessDate: text('business_date').notNull(),
  startedBy: text('started_by').notNull(),
  startedAt: text('started_at'),
  endedBy: text('ended_by'),
  endedAt: text('ended_at'),
  status: text('status', { enum: ['CLOSED','OPEN','ENDING','ENDED'] }).default('CLOSED').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  businessDayId: text('business_day_id').notNull(),
  branchId: text('branch_id').notNull(),
  userId: text('user_id').notNull(),
  stationId: text('station_id').notNull(),
  terminalId: text('terminal_id').notNull(),
  status: text('status', { enum: ['NOT_STARTED','OPEN','CLOSING','CLOSED','CANCELLED'] }).default('NOT_STARTED').notNull(),
  startingCash: integer('starting_cash').notNull(),
  expectedCash: integer('expected_cash').notNull(),
  actualCash: integer('actual_cash').default(0).notNull(),
  variance: integer('variance').default(0).notNull(),
  varianceStatus: text('variance_status', { enum: ['BALANCED','SHORT','OVER'] }).default('BALANCED').notNull(),
  cashSales: integer('cash_sales').default(0).notNull(),
  cashIn: integer('cash_in').default(0).notNull(),
  cashOut: integer('cash_out').default(0).notNull(),
  cashRefund: integer('cash_refund').default(0).notNull(),
  startedAt: text('started_at'),
  closedAt: text('closed_at'),
  startedBy: text('started_by').notNull(),
  closedBy: text('closed_by'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const shiftLogs = sqliteTable('shift_logs', {
  id: text('id').primaryKey(),
  shiftId: text('shift_id').notNull(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  reason: text('reason'),
  amount: integer('amount'),
  ip: text('ip'),
  createdAt: text('created_at').notNull(),
});

// Menu (PRD 9)
export const menuCategories = sqliteTable('menu_categories', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon'),
  displayOrder: integer('display_order').default(0).notNull(),
});

export const menus = sqliteTable('menus', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull(),
  name: text('name').notNull(),
  sku: text('sku').unique(),
  categoryId: text('category_id').notNull(),
  // cents — never float money
  priceCents: integer('price_cents').notNull(),
  specialPriceCents: integer('special_price_cents'),
  openPrice: integer('open_price', { mode: 'boolean' }).default(false).notNull(),
  availability: text('availability', { enum: ['AVAILABLE','UNAVAILABLE','OUT_OF_STOCK','HIDDEN'] }).default('AVAILABLE').notNull(),
  stockTracking: integer('stock_tracking', { mode: 'boolean' }).default(false).notNull(),
  minimumStock: integer('minimum_stock'),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const menuModifiers = sqliteTable('menu_modifiers', {
  id: text('id').primaryKey(),
  menuId: text('menu_id').notNull(),
  name: text('name').notNull(),
  priceCents: integer('price_cents').default(0).notNull(),
});

export const menuExtras = sqliteTable('menu_extras', {
  id: text('id').primaryKey(),
  modifierId: text('modifier_id').notNull(),
  name: text('name').notNull(),
  priceCents: integer('price_cents').default(0).notNull(),
});

// Orders, order items (PRD 8)
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  branchId: text('branch_id').notNull(),
  businessDayId: text('business_day_id').notNull(),
  terminalId: text('terminal_id').notNull(),
  stationId: text('station_id').notNull(),
  userId: text('user_id').notNull(),
  shiftId: text('shift_id').notNull(),
  status: text('status', { enum: ['DRAFT','OPEN','PAID','CANCELLED','COMPLETED'] }).default('DRAFT').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  discountCents: integer('discount_cents').default(0).notNull(),
  taxCents: integer('tax_cents').default(0).notNull(),
  serviceChargeCents: integer('service_charge_cents').default(0).notNull(),
  totalCents: integer('total_cents').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  menuId: text('menu_id').notNull(),
  quantity: real('quantity').notNull(),
  priceCents: integer('price_cents').notNull(),
  discountCents: integer('discount_cents').default(0).notNull(),
  totalCents: integer('total_cents').notNull(),
  notes: text('notes'),
});

export const orderItemModifiers = sqliteTable('order_item_modifiers', {
  id: text('id').primaryKey(),
  orderItemId: text('order_item_id').notNull(),
  modifierId: text('modifier_id').notNull(),
  name: text('name').notNull(),
  priceCents: integer('price_cents').default(0).notNull(),
});

// Transactions, payments (PRD 10, 20.4/20.5)
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  branchId: text('branch_id').notNull(),
  businessDayId: text('business_day_id').notNull(),
  terminalId: text('terminal_id').notNull(),
  stationId: text('station_id').notNull(),
  userId: text('user_id').notNull(),
  shiftId: text('shift_id').notNull(),
  transactionNumber: text('transaction_number').notNull().unique(), // TRX-YYYYMMDD-POS01-SEQ with idempotencyKey
  subtotalCents: integer('subtotal_cents').notNull(),
  discountCents: integer('discount_cents').default(0).notNull(),
  taxCents: integer('tax_cents').default(0).notNull(),
  serviceChargeCents: integer('service_charge_cents').default(0).notNull(),
  totalCents: integer('total_cents').notNull(),
  status: text('status', { enum: ['DRAFT','OPEN','PAYMENT_PENDING','PAID','COMPLETED','CANCELLED'] }).default('DRAFT').notNull(),
  syncStatus: text('sync_status', { enum: ['PENDING','SYNCING','SYNCED','FAILED','CONFLICT'] }).default('PENDING').notNull(),
  syncError: text('sync_error'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const paymentMethods = sqliteTable('payment_methods', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['cash','qr','ewallet','card','other'] }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
});

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  paymentMethodId: text('payment_method_id').notNull(),
  amountCents: integer('amount_cents').notNull(),
  referenceNumber: text('reference_number'),
  status: text('status', { enum: ['UNPAID','PARTIAL','PAID','FAILED','CANCELLED','REFUNDED'] }).default('UNPAID').notNull(),
  confirmedAt: text('confirmed_at'),
  createdAt: text('created_at').notNull(),
});

// Stock (PRD 12)
export const stocks = sqliteTable('stocks', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull(),
  menuId: text('menu_id').notNull(),
  quantity: real('quantity').notNull(),
  minimumQuantity: real('minimum_quantity').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const stockMovements = sqliteTable('stock_movements', {
  id: text('id').primaryKey(),
  branchId: text('branch_id').notNull(),
  menuId: text('menu_id').notNull(),
  type: text('type', { enum: ['SALE','STOCK_IN','STOCK_OUT','ADJUSTMENT','WASTE','REFUND','VOID'] }).notNull(),
  quantity: real('quantity').notNull(),
  referenceId: text('reference_id').notNull(),
  userId: text('user_id').notNull(),
  createdAt: text('created_at').notNull(),
});

// Sync queue (PRD 16)
export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  operation: text('operation', { enum: ['CREATE','UPDATE','DELETE'] }).notNull(),
  payload: text('payload', { mode: 'json' }),
  status: text('status', { enum: ['PENDING','SYNCING','SYNCED','FAILED','CONFLICT'] }).default('PENDING').notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  lastError: text('last_error'),
  createdAt: text('created_at').notNull(),
  syncedAt: text('synced_at'),
});

// Audit (PRD 33)
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  branchId: text('branch_id').notNull(),
  terminalId: text('terminal_id').notNull(),
  shiftId: text('shift_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  reason: text('reason'),
  oldData: text('old_data', { mode: 'json' }),
  newData: text('new_data', { mode: 'json' }),
  ip: text('ip'),
  createdAt: text('created_at').notNull(),
});