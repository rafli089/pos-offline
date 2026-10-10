import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useMenuStore, formatPrice } from '../../stores/menuStore';
import { useSyncStore } from '../../stores/syncStore';
import { useDayShiftStore } from '../../stores/dayShiftStore';
import { useAuditStore } from '../../stores/auditStore';
import { useTransactionStore } from '../../stores/transactionStore';
import type { Transaction, Payment } from '../../types';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { ArrowLeft, CheckCircle, QrCode, CreditCard, Banknote, Smartphone } from 'lucide-react';

type PaymentMethod = {
  id: string;
  name: string;
  type: 'cash' | 'qr' | 'ewallet' | 'card';
  icon: React.ReactNode;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm-cash', name: 'Cash', type: 'cash', icon: <Banknote className="h-4 w-4" /> },
  { id: 'pm-qr', name: 'QRIS', type: 'qr', icon: <QrCode className="h-4 w-4" /> },
  { id: 'pm-gopay', name: 'GoPay', type: 'ewallet', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'pm-ovo', name: 'OVO', type: 'ewallet', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'pm-card', name: 'Card', type: 'card', icon: <CreditCard className="h-4 w-4" /> },
];

interface PaymentState {
  totalCents: number;
  amounts: Record<string, number>;
  paidCents: number;
  changeCents: number;
  selectedMethod: string | null;
}

export default function PaymentScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, getCartTotal, clearCart, deductStock } = useMenuStore();
  const { addToQueue, networkStatus } = useSyncStore();
  const { activeShift, recordSale } = useDayShiftStore();
  const { user, terminal, branch } = useAuthStore();
  const { log } = useAuditStore();
  const { addTransaction } = useTransactionStore();

  const [payment, setPayment] = useState<PaymentState>({
    totalCents: getCartTotal(),
    amounts: { 'pm-cash': 0 },
    paidCents: 0,
    changeCents: 0,
    selectedMethod: 'pm-cash',
  });

  // ponytail: sync transaction to server + queue; receipt printing; cash change animation

  const handleAmountChange = (methodId: string, value: string) => {
    const amount = value === '' ? 0 : Math.max(0, Math.min(Number(value) * 100, payment.totalCents));
    const newAmounts = { ...payment.amounts, [methodId]: amount };
    const newPaid = Object.values(newAmounts).reduce((s, a) => s + a, 0);
    const change = Math.max(0, newPaid - payment.totalCents);

    setPayment({
      ...payment,
      amounts: newAmounts,
      paidCents: newPaid,
      changeCents: change,
    });
  };

  const handleMethodSelect = (methodId: string) => {
    const newAmounts = { ...payment.amounts, [methodId]: 0 };
    const otherPaid = Object.entries(newAmounts)
      .filter(([k]) => k !== methodId)
      .reduce((s, [, v]) => s + v, 0);
    setPayment({
      ...payment,
      selectedMethod: methodId,
      amounts: newAmounts,
      paidCents: otherPaid,
      changeCents: Math.max(0, otherPaid - payment.totalCents),
    });
  };

  const handleComplete = async () => {
    if (payment.paidCents < payment.totalCents || !payment.selectedMethod) return;

    const txId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${terminal?.terminal_id || 'POS01'}-${Date.now().toString().slice(-6)}`;
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === payment.selectedMethod)!;
    const now = new Date().toISOString();

    // 1. Shift sales ledger (cash only) + shift log
    const isCash = selectedMethod.type === 'cash';
    if (isCash && activeShift) recordSale(payment.paidCents);

    // 2. Local stock deduction (PRD §12)
    cart.forEach(item => deductStock(item.menu.id, item.quantity));

    // 3. Build & persist Transaction + Payment (PRD §20.4, §20.5)
    const transaction: Transaction = {
      id: txId,
      business_day_id: '', // ponytail: wire from dayShiftStore
      shift_id: activeShift?.id || 'shift-demo',
      order_id: txId,
      branch_id: branch?.id || 'branch-main',
      terminal_id: terminal?.terminal_id || 'POS-TNG-001',
      user_id: user?.id || 'user-cashier-01',
      station_id: 'station-001',
      transaction_number: txId,
      subtotal_cents: payment.totalCents,
      discount_cents: 0,
      tax_cents: 0,
      service_charge_cents: 0,
      total_cents: payment.totalCents,
      status: 'COMPLETED',
      sync_status: 'PENDING',
      created_at: now,
      updated_at: now,
    };
    const paymentRecord: Payment = {
      id: crypto.randomUUID(),
      transaction_id: txId,
      payment_method_id: selectedMethod.id,
      amount_cents: payment.paidCents,
      status: 'PAID',
      confirmed_at: now,
      created_at: now,
    };
    await addTransaction(transaction, [paymentRecord]);

    // 4. Sync queue
    addToQueue('transactions', txId, 'CREATE', transaction);
    addToQueue('payments', paymentRecord.id, 'CREATE', paymentRecord);

    // 5. Audit log
    await log('PAYMENT_COMPLETED', 'transaction', txId, {
      new_data: { total_cents: payment.totalCents, method: selectedMethod.name },
    });

    // 6. Clear cart, then receipt
    clearCart();
    navigate(`/receipt/${txId}`, {
      state: {
        totalCents: payment.totalCents,
        payments: [{ method: selectedMethod.name, amount: payment.paidCents, change: payment.changeCents }],
        cashier: user?.full_name,
        branch: branch?.name,
        terminal: terminal?.terminal_id,
        date: now,
        shift: activeShift?.id,
      },
    });
  };

  const handleCancel = () => {
    clearCart();
    navigate('/');
  };

  const totalDisplay = `Rp${new Intl.NumberFormat('id-ID').format(payment.totalCents / 100)}`;
  const paidDisplay = `Rp${new Intl.NumberFormat('id-ID').format(payment.paidCents / 100)}`;

  return (
    <div className="flex min-h-screen flex-col bg-void">
      <header className="flex h-12 items-center justify-between border-b border-iron bg-obsidian px-4">
        <button onClick={handleCancel} className="flex items-center gap-1.5 text-fog hover:text-paper-white">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Kembali</span>
        </button>
        <div className="text-sm text-fog">
          {user?.full_name} · {terminal?.terminal_id}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <Card className="mb-4">
          <div className="border-b border-iron p-4">
            <div className="flex justify-between text-sm text-fog">
              <span>Total Items</span>
              <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>
            <div className="mt-2 flex justify-between text-xl font-bold text-paper-white">
              <span>Total</span>
              <span>{totalDisplay}</span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-sm font-medium text-paper-white mb-3">Payment Methods</h3>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleMethodSelect(m.id)}
                  className={`flex items-center gap-2 rounded-md border p-2 text-sm transition-colors ${
                    payment.selectedMethod === m.id
                      ? 'border-ice-signal bg-slate'
                      : 'border-iron text-paper-white hover:bg-void'
                  }`}
                >
                  <span className={payment.selectedMethod === m.id ? 'text-ice-signal' : 'text-paper-white'}>
                    {m.icon}
                  </span>
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-iron p-4">
            <h3 className="text-sm font-medium text-paper-white mb-3">{PAYMENT_METHODS.find(m => m.id === payment.selectedMethod)?.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-fog">Rp</span>
              <Input
                type="number"
                value={payment.amounts[payment.selectedMethod!] ? payment.amounts[payment.selectedMethod!] / 100 : ''}
                onChange={e => handleAmountChange(payment.selectedMethod!, e.target.value)}
                className="font-gtamericamono text-xl font-bold flex-1"
                placeholder="0"
              />
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-fog">Paid</span>
              <span className={`font-medium ${paidDisplay.split('Rp')[1].trim() && Number(paidDisplay.replace(/[^\d]/g, '')) >= payment.totalCents ? 'text-green-400' : 'text-paper-white'}`}>
                {paidDisplay}
              </span>
            </div>
            {payment.changeCents > 0 && (
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-green-300">Change</span>
                <span className="text-green-400 font-medium">{formatPrice(payment.changeCents)}</span>
              </div>
            )}
          </div>
        </Card>
      </main>

      <footer className="border-t border-iron bg-obsidian p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-fog">Total</span>
          <span className="text-lg font-bold text-paper-white">{totalDisplay}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={payment.paidCents < payment.totalCents}
            onClick={handleComplete}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Bayar
          </Button>
        </div>
      </footer>
    </div>
  );
}