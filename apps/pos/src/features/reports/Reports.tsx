import { useState } from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useDayShiftStore } from '../../stores/dayShiftStore';
import { useMenuStore, formatPrice } from '../../stores/menuStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft } from 'lucide-react';

type ReportTab = 'sales' | 'transaction' | 'payment' | 'cashier' | 'shift';

export default function Reports() {
  const { transactions, payments } = useTransactionStore();
  const { activeShift, businessDay, shiftLogs } = useDayShiftStore();
  const { menus } = useMenuStore();
  const [tab, setTab] = useState<ReportTab>('sales');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const dayTx = transactions.filter((t) => t.created_at.startsWith(date));
  const gross = dayTx.reduce((s, t) => s + t.total_cents, 0);
  const count = dayTx.length;
  const avg = count > 0 ? Math.round(gross / count) : 0;

  const byCashier = new Map<string, { count: number; total: number }>();
  for (const t of dayTx) {
    const cur = byCashier.get(t.user_id) || { count: 0, total: 0 };
    byCashier.set(t.user_id, { count: cur.count + 1, total: cur.total + t.total_cents });
  }

  const byMethod = new Map<string, { count: number; total: number }>();
  for (const p of payments.filter((p) => dayTx.some((t) => t.id === p.transaction_id))) {
    const cur = byMethod.get(p.payment_method_id) || { count: 0, total: 0 };
    byMethod.set(p.payment_method_id, { count: cur.count + 1, total: cur.total + p.amount_cents });
  }

  const tabs: Array<{ id: ReportTab; label: string }> = [
    { id: 'sales', label: 'Sales' },
    { id: 'transaction', label: 'Transaksi' },
    { id: 'payment', label: 'Payment' },
    { id: 'cashier', label: 'Cashier' },
    { id: 'shift', label: 'Shift' },
  ];

  return (
    <div className="min-h-screen bg-void p-4">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-fog hover:text-paper-white">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-paper-white">Laporan</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="ml-auto bg-graphite border border-iron rounded px-2 py-1 text-sm text-paper-white"
        />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded text-sm border ${
              tab === t.id ? 'border-ice-signal text-paper-white' : 'border-iron text-fog'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sales' && (
        <div className="grid grid-cols-2 gap-3">
          <Stat title="Gross Sales" value={formatPrice(gross)} />
          <Stat title="Transaksi" value={String(count)} />
          <Stat title="Rata-rata" value={formatPrice(avg)} />
          <Stat title="Business Day" value={businessDay?.business_date || '-'} />
        </div>
      )}

      {tab === 'transaction' && (
        <Card className="bg-charcoal border-iron">
          <CardHeader><CardTitle className="text-base">Transaksi {date}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dayTx.length === 0 ? (
              <p className="text-sm text-fog">Belum ada transaksi.</p>
            ) : (
              dayTx.map((t) => (
                <div key={t.id} className="flex justify-between text-sm border-b border-iron py-1.5 last:border-0">
                  <span className="text-fog font-gtamericamono text-xs">{t.transaction_number}</span>
                  <span className="text-paper-white">{formatPrice(t.total_cents)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'payment' && (
        <Card className="bg-charcoal border-iron">
          <CardHeader><CardTitle className="text-base">Payment Recap</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[...byMethod.entries()].length === 0 ? (
              <p className="text-sm text-fog">Belum ada pembayaran.</p>
            ) : (
              [...byMethod.entries()].map(([method, v]) => (
                <div key={method} className="flex justify-between text-sm border-b border-iron py-1.5 last:border-0">
                  <span className="text-fog">{method} ({v.count}x)</span>
                  <span className="text-paper-white">{formatPrice(v.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'cashier' && (
        <Card className="bg-charcoal border-iron">
          <CardHeader><CardTitle className="text-base">Cashier Report</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[...byCashier.entries()].length === 0 ? (
              <p className="text-sm text-fog">Belum ada data kasir.</p>
            ) : (
              [...byCashier.entries()].map(([userId, v]) => (
                <div key={userId} className="flex justify-between text-sm border-b border-iron py-1.5 last:border-0">
                  <span className="text-fog font-gtamericamono text-xs">{userId} ({v.count}x)</span>
                  <span className="text-paper-white">{formatPrice(v.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'shift' && (
        <Card className="bg-charcoal border-iron">
          <CardHeader><CardTitle className="text-base">Shift Report</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Shift ID" value={activeShift?.id.slice(0, 8) || '-'} />
            <Row label="Status" value={activeShift?.status || '-'} />
            <Row label="Starting Cash" value={formatPrice(activeShift?.starting_cash || 0)} />
            <Row label="Cash Sales" value={formatPrice(activeShift?.cash_sales || 0)} />
            <Row label="Expected Cash" value={formatPrice(activeShift?.expected_cash || 0)} />
            <div className="pt-2">
              <p className="text-xs text-fog mb-1">Shift Logs ({shiftLogs.length})</p>
              {shiftLogs.slice(-5).reverse().map((l) => (
                <div key={l.id} className="flex justify-between text-xs text-fog py-1 border-b border-iron last:border-0">
                  <span>{l.action}</span>
                  <span>{new Date(l.created_at).toLocaleTimeString('id-ID')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ponytail: export CSV/Excel/PDF when reporting lib ready; product/menu & outlet breakdown */}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card className="bg-charcoal border-iron">
      <CardContent className="p-4">
        <p className="text-xs text-fog">{title}</p>
        <p className="text-lg font-bold text-paper-white mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-iron py-1.5 last:border-0">
      <span className="text-fog">{label}</span>
      <span className="text-paper-white">{value}</span>
    </div>
  );
}
