import type { AuditLog, ShiftLog, Transaction, Shift } from '../types';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FraudAlert {
  id: string;
  rule: string;
  level: RiskLevel;
  detail: string;
  entity_id: string;
  created_at: string;
}

const rank: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

/** Rule-based fraud scoring (PRD §14). Foundation for AI-based later. */
export function detectFraud(input: {
  auditLogs: AuditLog[];
  shiftLogs: ShiftLog[];
  transactions: Transaction[];
  shifts: Shift[];
}): FraudAlert[] {
  const alerts: FraudAlert[] = [];
  const { auditLogs, shiftLogs, transactions, shifts } = input;

  // Rule 1: manual stock adjustment without reason
  for (const l of auditLogs) {
    if (l.action === 'STOCK_ADJUSTED' && !l.reason) {
      alerts.push(mk('ADJUSTMENT_NO_REASON', 'MEDIUM', `Penyesuaian stok tanpa alasan pada ${l.entity_id}`, l.entity_id, l.created_at));
    }
  }

  // Rule 2: refund / void / cancel frequency per shift
  const cancelActions = shiftLogs.filter((l) => ['REFUND_CREATED', 'BILL_CANCELLED', 'ITEM_CANCELLED'].includes(l.action));
  const byShift = new Map<string, number>();
  for (const l of cancelActions) byShift.set(l.shift_id, (byShift.get(l.shift_id) || 0) + 1);
  for (const [shiftId, n] of byShift) {
    if (n >= 5) alerts.push(mk('HIGH_CANCEL_RATE', 'CRITICAL', `${n} cancel/refund dalam satu shift`, shiftId, new Date().toISOString()));
    else if (n >= 3) alerts.push(mk('CANCEL_RATE', 'HIGH', `${n} cancel/refund dalam satu shift`, shiftId, new Date().toISOString()));
  }

  // Rule 3: cash variance monitoring
  for (const s of shifts) {
    if (s.status !== 'CLOSED') continue;
    const pct = s.expected_cash > 0 ? Math.abs(s.variance) / s.expected_cash : 0;
    if (pct >= 0.1) alerts.push(mk('CASH_VARIANCE_HIGH', 'CRITICAL', `Selisih kas ${Math.round(pct * 100)}% pada shift ${s.id.slice(0, 8)}`, s.id, s.closed_at || s.updated_at));
    else if (pct >= 0.05) alerts.push(mk('CASH_VARIANCE', 'HIGH', `Selisih kas ${Math.round(pct * 100)}% pada shift ${s.id.slice(0, 8)}`, s.id, s.closed_at || s.updated_at));
  }

  // Rule 4: reprint monitoring
  const reprints = auditLogs.filter((l) => l.action === 'RECEIPT_REPRINTED');
  const reprintByTx = new Map<string, number>();
  for (const l of reprints) reprintByTx.set(l.entity_id, (reprintByTx.get(l.entity_id) || 0) + 1);
  for (const [tx, n] of reprintByTx) {
    if (n >= 3) alerts.push(mk('EXCESSIVE_REPRINT', 'HIGH', `Struk dicetak ulang ${n}x`, tx, new Date().toISOString()));
  }

  // Rule 5: discount / open price monitoring
  const discounted = transactions.filter((t) => t.discount_cents > 0);
  for (const t of discounted) {
    const pct = t.subtotal_cents > 0 ? t.discount_cents / t.subtotal_cents : 0;
    if (pct >= 0.5) alerts.push(mk('EXCESSIVE_DISCOUNT', 'HIGH', `Diskon ${Math.round(pct * 100)}%`, t.id, t.created_at));
  }

  // Rule 6: unusual transaction value (>= 3x average)
  if (transactions.length >= 5) {
    const avg = transactions.reduce((s, t) => s + t.total_cents, 0) / transactions.length;
    for (const t of transactions) {
      if (avg > 0 && t.total_cents >= avg * 3) {
        alerts.push(mk('UNUSUAL_VALUE', 'MEDIUM', `Nilai transaksi ${(t.total_cents / avg).toFixed(1)}x rata-rata`, t.id, t.created_at));
      }
    }
  }

  return alerts.sort((a, b) => rank[b.level] - rank[a.level] || b.created_at.localeCompare(a.created_at));
}

function mk(rule: string, level: RiskLevel, detail: string, entity_id: string, created_at: string): FraudAlert {
  return { id: `${rule}-${entity_id}-${created_at}`, rule, level, detail, entity_id, created_at };
}

export const riskColor: Record<RiskLevel, string> = {
  LOW: 'text-blue-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-500',
};
