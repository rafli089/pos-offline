/**
 * Mock data for offline POS - seeded on first load
 * Simulates cached data from server when online
 * ponytail: replace with real sync engine when server ready
 */
import type { MenuCategory, Menu, MenuModifier, MenuExtra, User, Branch, Terminal, Station, PaymentMethod, Permission } from '../types';

export const permissions: Permission[] = [
  { id: 'perm-001', module: 'menu', action: 'view' },
  { id: 'perm-002', module: 'menu', action: 'create' },
  { id: 'perm-003', module: 'order', action: 'create' },
  { id: 'perm-004', module: 'transaction', action: 'view' },
  { id: 'perm-005', module: 'payment', action: 'create' },
];

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

export const categories: MenuCategory[] = [
  { id: 'cat-001', branch_id: 'branch-001', name: 'Coffee', icon: 'coffee', display_order: 1 },
  { id: 'cat-002', branch_id: 'branch-001', name: 'Non Coffee', icon: 'cup', display_order: 2 },
  { id: 'cat-003', branch_id: 'branch-001', name: 'Food', icon: 'food', display_order: 3 },
];

export const menus: Menu[] = [
  { id: 'menu-001', branch_id: 'branch-001', name: 'Espresso', sku: 'ESP-001', category_id: 'cat-001', price_cents: 1500000, open_price: false, availability: 'AVAILABLE', stock_tracking: false, display_order: 1, created_at: '', updated_at: '' },
  { id: 'menu-002', branch_id: 'branch-001', name: 'Latte', sku: 'LAT-001', category_id: 'cat-001', price_cents: 1800000, open_price: false, availability: 'AVAILABLE', stock_tracking: false, display_order: 2, created_at: '', updated_at: '' },
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
};