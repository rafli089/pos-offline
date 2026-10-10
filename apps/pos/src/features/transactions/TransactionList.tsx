import { useState } from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useDayShiftStore } from '../../stores/dayShiftStore';
import { useAuthStore } from '../../stores/authStore';
import { useAuditStore } from '../../stores/auditStore';
import { useMenuStore, formatPrice } from '../../stores/menuStore';
import { useSyncStore } from '../../stores/syncStore';
import { db } from '../../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Transaction } from '../../types';

// PRD §31: paid transaction tidak boleh diedit langsung;
// gunakan void/refund sesuai permission. Cancel wajib reason.
export default function TransactionList() {
  const { transactions } = useTransactionStore();
  const { setShiftLog } = useDayShiftStore();
  const { canAccess } = useAuthStore();
  const { log } = useAuditStore();
  const { addToQueue } = useSyncStore();

  const [reason, setReason] = useState('');
  const [target, setTarget] = useState<Transaction | null>(null);

  const cancelTx = async (tx: Transaction) => {
    if (!reason.trim()) return;
    if (!canAccess('transaction', 'cancel')) return;

    const updated: Transaction = { ...tx, status: 'CANCELLED', updated_at: new Date().toISOString() };
    await db.transactions.put(updated);
    useTransactionStore.setState((s) => ({
      transactions: s.transactions.map((t) => (t.id === tx.id ? updated : t)),
    }));

    await setShiftLog({
      id: crypto.randomUUID(),
      shift_id: tx.shift_id,
      user_id: tx.user_id,
      action: 'BILL_CANCELLED',
      notes: reason,
      created_at: new Date().toISOString(),
    });
    await log('BILL_CANCELLED', 'transaction', tx.id, { reason, old_data: { status: tx.status }, new_data: { status: 'CANCELLED' } });
    addToQueue('transactions', tx.id, 'UPDATE', updated);

    setTarget(null);
    setReason('');
  };

  const refundTx = async (tx: Transaction) => {
    if (!reason.trim()) return;
    if (!canAccess('transaction', 'refund')) return;

    await setShiftLog({
      id: crypto.randomUUID(),
      shift_id: tx.shift_id,
      user_id: tx.user_id,
      action: 'REFUND_CREATED',
      amount: tx.total_cents,
      notes: reason,
      created_at: new Date().toISOString(),
    });
    await log('REFUND_CREATED', 'transaction', tx.id, { reason, new_data: { total_cents: tx.total_cents } });

    setTarget(null);
    setReason('');
  };

  return (
    <div className="min-h-screen bg-void p-4">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-fog hover:text-paper-white">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-paper-white">Transaksi</h1>
      </div>

      <Card className="bg-charcoal border-iron">
        <CardHeader><CardTitle className="text-base">Semua Transaksi</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-sm text-fog">Belum ada transaksi.</p>
          ) : (
            [...transactions].reverse().map((t) => (
              <div key={t.id} className="rounded border border-iron p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-gtamericamono text-xs text-fog">{t.transaction_number}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {t.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-lg font-bold text-paper-white">{formatPrice(t.total_cents)}</span>
                  <div className="flex gap-2">
                    {t.status !== 'CANCELLED' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setTarget(t)}>
                          Batal / Refund
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {target?.id === t.id && (
                  <div className="mt-2 space-y-2 border-t border-iron pt-2">
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Alasan batal/refund (wajib)"
                      className="w-full rounded border border-iron bg-graphite px-2 py-1.5 text-sm text-paper-white"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={!reason.trim()} onClick={() => cancelTx(t)}>
                        Batalkan
                      </Button>
                      <Button size="sm" variant="outline" disabled={!reason.trim()} onClick={() => refundTx(t)}>
                        Refund
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setTarget(null); setReason(''); }}>
                        Tutup
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
