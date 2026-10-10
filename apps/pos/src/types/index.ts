/**
 * Core Types for Offline POS
 * Adapted from PRD.md table definitions
 */

export type UUID = string;

// --- Entities ---
export interface User {
  id: UUID;
  username: string;
  full_name: string;
  email: string;
  pin_hash?: string;
  role_id: UUID;
  branch_id: UUID;
  terminal_id: UUID;
  status: 'active' | 'inactive' | 'locked';
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Role {
  id: UUID;
  name: string;
  level: number;
  description?: string;
}

export interface Permission {
  id: UUID;
  module: string;
  action: string;
  description?: string;
}

export interface RolePermission {
  role_id: UUID;
  permission: string;
}

export interface Branch {
  id: UUID;
  name: string;
  code: string;
  address?: string;
  phone?: string;
}

export interface Station {
  id: UUID;
  branch_id: UUID;
  name: string;
  type: 'cashier' | 'bar' | 'kitchen' | 'admin';
  position?: number;
}

export interface Terminal {
  id: UUID;
  branch_id: UUID;
  station_id: UUID;
  terminal_id: string; // e.g., POS-TNG-001
  name: string;
  mac_address?: string;
  status: 'active' | 'offline' | 'maintenance';
}

// --- Business Day & Shift ---
export type BusinessDayStatus = 'CLOSED' | 'OPEN' | 'ENDING' | 'ENDED';

export interface BusinessDay {
  id: UUID;
  branch_id: UUID;
  business_date: string; // YYYY-MM-DD
  started_by: UUID;
  started_at?: string;
  ended_by?: UUID;
  ended_at?: string;
  status: BusinessDayStatus;
  created_at: string;
  updated_at: string;
}

export type ShiftStatus = 'NOT_STARTED' | 'OPEN' | 'CLOSING' | 'CLOSED' | 'CANCELLED';

export interface Shift {
  id: UUID;
  business_day_id: UUID;
  branch_id: UUID;
  user_id: UUID;
  station_id: UUID;
  terminal_id: UUID;
  status: ShiftStatus;
  starting_cash: number; // in cents
  expected_cash: number;
  actual_cash: number;
  variance: number;
  variance_status: 'BALANCED' | 'SHORT' | 'OVER';
  cash_sales: number;
  cash_in: number;
  cash_out: number;
  cash_refund: number;
  started_at?: string;
  closed_at?: string;
  started_by: UUID;
  closed_by?: UUID;
  created_at: string;
  updated_at: string;
}

export type ShiftLogAction =
  | 'SHIFT_CREATED'
  | 'STARTING_CASH_ENTERED'
  | 'SHIFT_STARTED'
  | 'ORDER_CREATED'
  | 'TRANSACTION_CREATED'
  | 'PAYMENT_COMPLETED'
  | 'ITEM_CANCELLED'
  | 'BILL_CANCELLED'
  | 'REFUND_CREATED'
  | 'SHIFT_CLOSING'
  | 'CASH_COUNTED'
  | 'SHIFT_CLOSED';

export interface ShiftLog {
  id: UUID;
  shift_id: UUID;
  user_id: UUID;
  action: ShiftLogAction;
  notes?: string;
  amount?: number;
  ip_address?: string;
  created_at: string;
}

// --- Menu System ---
export type MenuAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'HIDDEN';

export interface MenuCategory {
  id: UUID;
  branch_id: UUID;
  name: string;
  display_order: number;
  icon?: string;
}

export interface Menu {
  id: UUID;
  branch_id: UUID;
  name: string;
  sku?: string;
  category_id: UUID;
  price_cents: number; // base price in IDR cents
  special_price_cents?: number;
  cost_cents?: number; // COGS for P&L report
  open_price: boolean;
  availability: MenuAvailability;
  stock_quantity?: number;
  minimum_stock?: number;
  stock_tracking: boolean;
  description?: string;
  image_url?: string;
  tags?: string[];
  // PRD §9 — package & multi-price
  is_package?: boolean;
  package_items?: Array<{ menu_id: UUID; quantity: number; note?: string }>;
  prices?: Array<{ label: string; price_cents: number }>;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// PRD §9 — menu template (reusable combo)
export interface MenuTemplate {
  id: UUID;
  branch_id: UUID;
  name: string;
  items: Array<{ menu_id: UUID; quantity: number }>;
}

export interface MenuModifier {
  id: UUID;
  menu_id: UUID;
  name: string;
  price_cents: number;
  min_select?: number;
  max_select?: number;
}

export interface MenuExtra {
  id: UUID;
  modifier_id: UUID;
  name: string;
  price_cents: number;
}

export interface MenuPackage {
  id: UUID;
  branch_id: UUID;
  name: string;
  items: Array<{ menu_id: UUID; quantity: number }>;
}

// --- Order Metadata (PRD §8) ---
export interface SalesMode {
  id: UUID;
  branch_id: UUID;
  name: string;
  group?: string;
}

export interface VisitorType {
  id: UUID;
  name: string;
}

export interface VisitPurpose {
  id: UUID;
  name: string;
}

// --- Ordering & Transaction ---
export type OrderStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'CANCELLED' | 'COMPLETED';

export interface Order {
  id: UUID;
  order_number: string; // ORD-0001
  branch_id: UUID;
  business_day_id: UUID;
  terminal_id: UUID;
  station_id: UUID;
  user_id: UUID;
  shift_id: UUID;
  sales_mode_id?: UUID;
  visitor_type_id?: UUID;
  visit_purpose_id?: UUID;
  status: OrderStatus;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  service_charge_cents: number;
  total_cents: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: UUID;
  order_id: UUID;
  menu_id: UUID;
  quantity: number; // supports decimal
  price_cents: number;
  discount_cents: number;
  total_cents: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItemModifier {
  id: UUID;
  order_item_id: UUID;
  modifier_id: UUID;
  name: string;
  price_cents: number;
}

export type TransactionStatus = 'DRAFT' | 'OPEN' | 'PAYMENT_PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export interface Transaction {
  id: UUID;
  business_day_id: UUID;
  shift_id: UUID;
  order_id: UUID;
  branch_id: UUID;
  terminal_id: UUID;
  user_id: UUID;
  station_id: UUID;
  transaction_number: string; // TRX-20261005-POS01-000001
  sales_mode_id?: UUID;
  visitor_type_id?: UUID;
  visit_purpose_id?: UUID;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  service_charge_cents: number;
  total_cents: number;
  status: TransactionStatus;
  sync_status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  sync_error?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: UUID;
  transaction_id: UUID;
  payment_method_id: UUID;
  amount_cents: number;
  reference_number?: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  confirmed_at?: string;
  created_at: string;
}

export type PaymentMethodType = 'cash' | 'qr' | 'ewallet' | 'card' | 'other';

export interface PaymentMethod {
  id: UUID;
  name: string;
  type: PaymentMethodType;
  is_active: boolean;
}

// --- Stock & Inventory ---
export type StockMovementType = 'SALE' | 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'WASTE' | 'REFUND' | 'VOID';

export interface Stock {
  id: UUID;
  branch_id: UUID;
  menu_id: UUID;
  quantity: number;
  minimum_quantity: number;
  updated_at: string;
}

export interface StockMovement {
  id: UUID;
  branch_id: UUID;
  menu_id: UUID;
  type: StockMovementType;
  quantity: number;
  reference_id: UUID; // transaction/order id
  user_id: UUID;
  created_at: string;
}

// --- Sync Engine ---
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncQueue {
  id: UUID;
  entity_type: string;
  entity_id: UUID;
  operation: SyncOperation;
  payload: unknown;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  retry_count: number;
  last_error?: string;
  created_at: string;
  synced_at?: string;
}

// --- Audit Log ---
export interface AuditLog {
  id: UUID;
  user_id: UUID;
  branch_id: UUID;
  terminal_id: UUID;
  shift_id?: UUID;
  action: string;
  entity_type: string;
  entity_id: UUID;
  reason?: string;
  old_data?: unknown;
  new_data?: unknown;
  ip_address?: string;
  created_at: string;
}

// --- POS Status ---
export type PosStatus =
  | 'LOCKED'
  | 'READY'
  | 'BUSINESS_DAY_NOT_STARTED'
  | 'SHIFT_NOT_STARTED'
  | 'SHIFT_ACTIVE'
  | 'PAYMENT_PROCESSING'
  | 'OFFLINE'
  | 'SYNCING'
  | 'SYNC_ERROR';

// --- Cart Item ---
export interface CartItem {
  menu: Menu;
  quantity: number;
  modifiers: Array<{ modifier: MenuModifier; extras: Array<MenuExtra> }>;
  notes?: string;
}