/**
 * Mock data for offline POS - seeded on first load
 * Simulates cached data from server when online
 * ponytail: replace with real sync engine when server ready
 */
import type { MenuCategory, Menu, MenuModifier, MenuExtra, User, Branch, Terminal, Station, PaymentMethod, Permission, SalesMode, VisitorType, VisitPurpose } from '../types';

export const permissions: Permission[] = [
  { id: 'menu.view', module: 'menu', action: 'view' },
  { id: 'menu.create', module: 'menu', action: 'create' },
  { id: 'menu.update', module: 'menu', action: 'update' },
  { id: 'menu.delete', module: 'menu', action: 'delete' },
  { id: 'menu.price', module: 'menu', action: 'price' },
  { id: 'menu.stock', module: 'menu', action: 'stock' },
  { id: 'order.create', module: 'order', action: 'create' },
  { id: 'order.view', module: 'order', action: 'view' },
  { id: 'order.cancel', module: 'order', action: 'cancel' },
  { id: 'transaction.view', module: 'transaction', action: 'view' },
  { id: 'transaction.cancel', module: 'transaction', action: 'cancel' },
  { id: 'transaction.refund', module: 'transaction', action: 'refund' },
  { id: 'transaction.reprint', module: 'transaction', action: 'reprint' },
  { id: 'payment.create', module: 'payment', action: 'create' },
  { id: 'shift.start', module: 'shift', action: 'start' },
  { id: 'shift.close', module: 'shift', action: 'close' },
  { id: 'report.sales', module: 'report', action: 'sales' },
  { id: 'report.transaction', module: 'report', action: 'transaction' },
  { id: 'audit.view', module: 'audit', action: 'view' },
  { id: 'sync.manage', module: 'sync', action: 'manage' },
];

// PRD §4/§5 — role → permission set
export const rolePermissions: Record<string, string[]> = {
  'role-admin': permissions.map((p) => p.id),
  'role-cashier': [
    'menu.view',
    'order.create',
    'order.view',
    'order.cancel',
    'transaction.view',
    'transaction.reprint',
    'payment.create',
    'shift.start',
    'shift.close',
    'report.transaction',
  ],
};

export const branches: Branch[] = [
  {
    id: 'branch-001',
    name: 'Main Cafe',
    code: 'MC-001',
    address: 'Jl. Contoh No.1, Jakarta',
    phone: '021-555-0001',
  },
];

export const stations: Station[] = [
  { id: 'station-001', branch_id: 'branch-001', name: 'Cashier Station', type: 'cashier' },
  { id: 'station-002', branch_id: 'branch-001', name: 'Bar Station', type: 'bar' },
];

export const terminals: Terminal[] = [
  {
    id: 'terminal-001',
    branch_id: 'branch-001',
    station_id: 'station-001',
    terminal_id: 'POS-TNG-001',
    name: 'POS 1',
    status: 'active',
  },
];

export const users: User[] = [
  {
    id: 'user-cashier-01',
    username: 'kasir1',
    full_name: 'Budi Kasir',
    email: 'kasir1@cafe.id',
    pin_hash: 'encrypted-pin-mock', // ponytail: use bcrypt/hashlib when Rust backend ready
    role_id: 'role-cashier',
    branch_id: 'branch-001',
    terminal_id: 'terminal-001',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-admin-01',
    username: 'admin',
    full_name: 'Admin POS',
    email: 'admin@cafe.id',
    pin_hash: 'encrypted-pin-mock',
    role_id: 'role-admin',
    branch_id: 'branch-001',
    terminal_id: 'terminal-001',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const paymentMethods: PaymentMethod[] = [
  { id: 'pm-cash', name: 'Cash', type: 'cash', is_active: true },
  { id: 'pm-qris', name: 'QRIS', type: 'qr', is_active: true },
  { id: 'pm-gopay', name: 'GoPay', type: 'ewallet', is_active: true },
  { id: 'pm-ovo', name: 'OVO', type: 'ewallet', is_active: true },
];

// PRD §8 — order metadata
export const salesModes: SalesMode[] = [
  { id: 'sm-dinein', branch_id: 'branch-001', name: 'Dine In', group: 'Dine In' },
  { id: 'sm-takeaway', branch_id: 'branch-001', name: 'Take Away', group: 'Take Away' },
  { id: 'sm-delivery', branch_id: 'branch-001', name: 'Delivery', group: 'Delivery' },
];

export const visitorTypes: VisitorType[] = [
  { id: 'vt-regular', name: 'Regular' },
  { id: 'vt-member', name: 'Member' },
  { id: 'vt-vip', name: 'VIP' },
];

export const visitPurposes: VisitPurpose[] = [
  { id: 'vp-meal', name: 'Makan' },
  { id: 'vp-coffee', name: 'Ngopi' },
  { id: 'vp-meeting', name: 'Meeting' },
];

export const categories: MenuCategory[] = [
  { id: 'cat-001', branch_id: 'branch-001', name: 'Coffee', icon: 'coffee', display_order: 1 },
  { id: 'cat-002', branch_id: 'branch-001', name: 'Non Coffee', icon: 'cup', display_order: 2 },
  { id: 'cat-003', branch_id: 'branch-001', name: 'Food', icon: 'food', display_order: 3 },
];

export const menus: Menu[] = [
  { id: 'menu-001', branch_id: 'branch-001', name: 'Espresso', sku: 'ESP-001', category_id: 'cat-001', price_cents: 1500000, open_price: false, availability: 'AVAILABLE', stock_tracking: false, tags: ['Best Seller'], display_order: 1, created_at: '', updated_at: '' },
  { id: 'menu-002', branch_id: 'branch-001', name: 'Latte', sku: 'LAT-001', category_id: 'cat-001', price_cents: 1800000, special_price_cents: 1500000, open_price: false, availability: 'AVAILABLE', stock_tracking: false, tags: ['Best Seller', 'Promo'], display_order: 2, created_at: '', updated_at: '' },
  { id: 'menu-003', branch_id: 'branch-001', name: 'Americano', sku: 'AME-001', category_id: 'cat-001', price_cents: 1200000, open_price: false, availability: 'AVAILABLE', stock_tracking: false, display_order: 3, created_at: '', updated_at: '' },
  { id: 'menu-004', branch_id: 'branch-001', name: 'Mocha', sku: 'MOC-001', category_id: 'cat-001', price_cents: 2200000, open_price: false, availability: 'AVAILABLE', stock_tracking: false, display_order: 4, created_at: '', updated_at: '' },
  { id: 'menu-005', branch_id: 'branch-001', name: 'Matcha Latte', sku: 'MAT-001', category_id: 'cat-002', price_cents: 2000000, open_price: false, availability: 'AVAILABLE', stock_tracking: false, display_order: 1, created_at: '', updated_at: '' },
  { id: 'menu-006', branch_id: 'branch-001', name: 'Croissant', sku: 'CRO-001', category_id: 'cat-003', price_cents: 1800000, open_price: false, availability: 'AVAILABLE', stock_tracking: true, minimum_stock: 10, stock_quantity: 25, display_order: 1, created_at: '', updated_at: '' },
  { id: 'menu-007', branch_id: 'branch-001', name: 'Sandwich', sku: 'SAN-001', category_id: 'cat-003', price_cents: 2500000, open_price: false, availability: 'AVAILABLE', stock_tracking: true, minimum_stock: 5, stock_quantity: 12, display_order: 2, created_at: '', updated_at: '' },
];

export const modifiers: MenuModifier[] = [
  { id: 'mod-001', menu_id: 'menu-001', name: 'Ice', price_cents: 0 },
  { id: 'mod-002', menu_id: 'menu-001', name: 'Hot', price_cents: 0 },
  { id: 'mod-003', menu_id: 'menu-001', name: 'Sugar', price_cents: 0 },
  { id: 'mod-004', menu_id: 'menu-001', name: 'Less Sugar', price_cents: 0 },
];

export const extras: MenuExtra[] = [];

export default {
  categories,
  menus,
  modifiers,
  extras,
  users,
  branches,
  stations,
  terminals,
  paymentMethods,
  permissions,
  salesModes,
  visitorTypes,
  visitPurposes,
};