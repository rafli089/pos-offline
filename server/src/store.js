export const store = {
  users: new Map(),
  transactions: new Map(),
  payments: new Map(),
  shifts: new Map(),
  businessDays: new Map(),
  locations: new Map(),
  menuCategories: new Map(),
  menus: new Map(),
  menuModifiers: new Map(),
  menuExtras: new Map(),
  stockMovements: [],
  auditLogs: [],
  _seq: {},
};

export function nextSeq(branch, date, terminal) {
  const key = `${branch}:${date}:${terminal}`;
  store._seq[key] = (store._seq[key] ?? 0) + 1;
  const seq = String(store._seq[key]).padStart(6, '0');
  return `TRX-${date.replace(/-/g, '')}-${terminal}-${seq}`;
}