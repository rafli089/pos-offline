import { useState } from 'react';
import { useOrderStore, type SavedOrder } from '../../stores/orderStore';
import { useMenuStore, formatPrice } from '../../stores/menuStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Bookmark, FolderOpen, Trash2, X } from 'lucide-react';

export default function OrderHoldRecall({ onRecall }: { onRecall: (order: SavedOrder) => void }) {
  const { savedOrders, deleteOrder, saveOrder } = useOrderStore();
  const { cart, clearCart } = useMenuStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleHold = async () => {
    if (cart.length === 0) return;
    await saveOrder(cart);
    clearCart();
    alert('Pesanan berhasil disimpan (Hold).');
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={cart.length === 0} onClick={handleHold} className="gap-1">
          <Bookmark className="h-4 w-4" /> Hold
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="gap-1">
          <FolderOpen className="h-4 w-4" /> Recall ({savedOrders.length})
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setIsOpen(false)}>
          <Card className="w-full max-w-lg bg-charcoal border-iron max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between border-b border-iron pb-3">
              <CardTitle className="text-base text-paper-white">Pesanan Tersimpan (Hold)</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2 pt-4">
              {savedOrders.length === 0 ? (
                <p className="text-sm text-fog">Tidak ada pesanan tersimpan.</p>
              ) : (
                savedOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded border border-iron p-3">
                    <div>
                      <p className="font-gtamericamono font-medium text-paper-white">{o.order_number}</p>
                      <p className="text-xs text-fog">{o.items.length} item · {formatPrice(o.total_cents)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { onRecall(o); deleteOrder(o.id); setIsOpen(false); }}>
                        Ambil
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteOrder(o.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
