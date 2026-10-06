import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenuStore, formatPrice } from '../../stores/menuStore';
import { useDayShiftStore } from '../../stores/dayShiftStore';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ArrowLeft, Printer, Share2, Mail, RefreshCw } from 'lucide-react';

// ponytail: integrate with print API (Tauri) when Rust ready; email via SendGrid/Brevo

export default function ReceiptScreen() {
  const { txId } = useParams<{ txId: string }>();
  const navigate = useNavigate();
  const { cart, getCartTotal } = useMenuStore();
  const { activeShift } = useDayShiftStore();

  const [printing, setPrinting] = useState(false);
  const [reprints, setReprints] = useState(0); // track reprint count for audit

  const transaction = {
    id: txId || 'TRX-20241006-POS01-000001',
    date: new Date().toISOString(),
    cashier: 'Budi Kasir',
    items: cart,
    total_cents: getCartTotal(),
    payments: [{ method: 'Cash', amount: getCartTotal() }],
    branch: 'Main Cafe',
    terminal: 'POS-TNG-001',
    shift: activeShift?.id,
  };

  const handlePrint = async () => {
    setPrinting(true);
    if (window.print) window.print();
    setPrinting(false);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Terima kasih!\nTotal: ${formatPrice(transaction.total_cents)}\n${transaction.items.map(i => `${i.menu.name} x${i.quantity}`).join('\n')}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=Receipt ${transaction.id}&body=Total: ${formatPrice(transaction.total_cents)}`;
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="flex h-12 items-center justify-between border-b border-iron bg-obsidian px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-fog hover:text-paper-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-sm text-fog">Receipt</span>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <Card className="mx-auto max-w-md">
          <div className="border-b border-iron p-4">
            <h2 className="text-lg font-bold text-paper-white">Main Cafe</h2>
            <p className="text-sm text-fog">Jl. Contoh No.1, Jakarta • 021-555-0001</p>
          </div>

          <div className="border-b border-iron p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-fog">Receipt #{transaction.id}</span>
              <span className="text-paper-white font-gtamericamono">{new Date(transaction.date).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fog">Kasir</span>
              <span className="text-paper-white text-sm">{transaction.cashier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fog">Terminal</span>
              <span className="text-paper-white text-sm font-gtamericamono">{transaction.terminal}</span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-xs font-medium text-fog mb-2">Pesanan</h3>
            <div className="space-y-1">
              {transaction.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-sm">{item.menu.name} x{item.quantity}</span>
                  <span className="text-sm text-paper-white">{formatPrice(item.menu.price_cents * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-iron pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-fog">Subtotal</span>
                <span className="text-paper-white">{formatPrice(transaction.total_cents)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-1">
                <span className="text-paper-white">Total</span>
                <span className="text-ice-signal">{formatPrice(transaction.total_cents)}</span>
              </div>
            </div>

            <div className="border-t border-iron pt-2 mt-2">
              <h3 className="text-xs font-medium text-fog mb-2">Pembayaran</h3>
              <div className="space-y-1">
                {transaction.payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-fog">{p.method}</span>
                    <span className="text-paper-white">{formatPrice(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-iron p-4 flex justify-around">
            <Button variant="ghost" size="sm" onClick={handlePrint} disabled={printing}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button variant="ghost" size="sm" onClick={handleWhatsApp}>
              <Share2 className="h-4 w-4 mr-1" />
              WA
            </Button>
            <Button variant="ghost" size="sm" onClick={handleEmail}>
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}