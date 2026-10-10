import { useMenuStore, formatPrice, cartLineTotal } from '../../stores/menuStore';
import { useSyncStore } from '../../stores/syncStore';

export default function CustomerDisplay() {
  const { cart, getCartTotal } = useMenuStore();
  const { networkStatus } = useSyncStore();

  return (
    <div className="flex min-h-screen flex-col bg-void text-paper-white">
      <header className="flex items-center justify-between border-b border-iron px-6 py-4">
        <div>
          <p className="text-sm text-fog">Pesanan Anda</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-fog">
          <span className={`h-2 w-2 rounded-full ${networkStatus === 'online' ? 'bg-emerald-400' : 'bg-red-500'}`} />
          <span className="capitalize">{networkStatus}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {cart.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-3xl text-fog">Menunggu pesanan...</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {cart.map((item) => (
              <li key={item.menu.id} className="flex items-start justify-between border-b border-iron pb-3">
                <div>
                  <p className="text-2xl font-medium">{item.menu.name}</p>
                  <p className="text-lg text-fog">
                    {item.quantity} × {formatPrice(item.menu.price_cents)}
                  </p>
                  {item.notes && <p className="text-sm italic text-fog">"{item.notes}"</p>}
                </div>
                <p className="text-2xl font-gtamericamono">{formatPrice(cartLineTotal(item))}</p>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="border-t border-iron px-6 py-5">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl text-fog">Total</span>
          <span className="text-5xl font-bold text-ice-signal">{formatPrice(getCartTotal())}</span>
        </div>
      </footer>
    </div>
  );
}
