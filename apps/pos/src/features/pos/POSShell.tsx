import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useMenuStore, formatPrice, cartLineTotal } from '../../stores/menuStore';
import { useSyncStore } from '../../stores/syncStore';
import type { Menu, CartItem } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, ShoppingCart, ChevronLeft, ChevronRight, X, LayoutDashboard, LogOut, BarChart3, UtensilsCrossed, Package, ScrollText, ShieldAlert, Receipt } from 'lucide-react';

export default function POSShell() {
  const { user, terminal, branch } = useAuthStore();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { categories, menus, cart, addToCart, removeFromCart, updateQuantity, getCartTotal, bestSellers } = useMenuStore();
  const { networkStatus } = useSyncStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = menus.filter(m => {
    if (m.availability !== 'AVAILABLE') return false;
    if (search) return m.name.toLowerCase().includes(search.toLowerCase());
    if (category) return m.category_id === category;
    return true;
  });

  // 1px inset white-alpha ring on cards, no heavy shadow
  const cardClass =
    "rounded-md border border-iron bg-charcoal p-4 shadow-subtle";

  return (
    <div className="flex min-h-screen flex-col bg-void">
      <TopBar
        user={user?.full_name}
        terminal={terminal?.terminal_id}
        branch={branch?.name}
        network={networkStatus}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex min-w-0 flex-1 flex-col">
          <CategoryBar
            categories={categories}
            active={category}
            onSelect={setCategory}
          />
          <SearchBar value={search} onChange={setSearch} />
          <MenuGrid menus={filtered} bestSellers={bestSellers} onAdd={(m, qty = 1) => addToCart(m, qty)} />
        </main>
      </div>

      <CartBar
        itemCount={cart.reduce((s, i) => s + i.quantity, 0)}
        total={getCartTotal()}
        onOpen={() => setCartOpen(true)}
        onPay={() => navigate('/payment')}
      />

      <nav className="fixed left-0 top-12 z-20 flex flex-col gap-1 p-2">
        <RailButton label="POS" onClick={() => navigate('/')}>
          <ShoppingCart className="h-4 w-4" />
        </RailButton>
        <RailButton label="Dashboard" onClick={() => navigate('/dashboard')}>
          <LayoutDashboard className="h-4 w-4" />
        </RailButton>
        <RailButton label="Laporan" onClick={() => navigate('/reports')}>
          <BarChart3 className="h-4 w-4" />
        </RailButton>
        <RailButton label="Transaksi" onClick={() => navigate('/transactions')}>
          <Receipt className="h-4 w-4" />
        </RailButton>
        {isAdmin && (
          <>
            <RailButton label="Kelola Menu" onClick={() => navigate('/admin/menu')}>
              <UtensilsCrossed className="h-4 w-4" />
            </RailButton>
            <RailButton label="Kelola Stok" onClick={() => navigate('/admin/stock')}>
              <Package className="h-4 w-4" />
            </RailButton>
            <RailButton label="Audit Log" onClick={() => navigate('/admin/audit')}>
              <ScrollText className="h-4 w-4" />
            </RailButton>
            <RailButton label="Fraud Monitor" onClick={() => navigate('/admin/fraud')}>
              <ShieldAlert className="h-4 w-4" />
            </RailButton>
          </>
        )}
        <RailButton label="Tutup Shift" onClick={() => navigate('/close-shift')}>
          <LogOut className="h-4 w-4" />
        </RailButton>
      </nav>

      {cartOpen && (
        <CartDrawer
          items={cart}
          total={getCartTotal()}
          onClose={() => setCartOpen(false)}
          onUpdate={updateQuantity}
          onRemove={removeFromCart}
          onCheckout={() => { setCartOpen(false); navigate('/payment'); }}
        />
      )}
    </div>
  );
}

/* ---------- pieces ---------- */

function TopBar({ user, terminal, branch, network }: {
  user?: string; terminal?: string; branch?: string; network: string;
}) {
  const dot =
    network === 'online' ? 'bg-emerald-400'
    : network === 'offline' ? 'bg-red-500'
    : network === 'syncing' ? 'bg-ice-signal'
    : 'bg-amber-400';

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-iron bg-obsidian px-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium text-paper-white">{branch}</span>
        <span className="text-fog">·</span>
        <span className="text-fog">{user}</span>
        <span className="rounded-sm border border-iron bg-graphite px-1.5 py-0.5 font-gtamericamono text-xs text-fog">
          {terminal}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-fog">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="capitalize">{network === 'sync-error' ? 'Sync Error' : network}</span>
      </div>
    </header>
  );
}

function CategoryBar({ categories, active, onSelect }: {
  categories: Array<{ id: string; name: string }>;
  active: string | null;
  onSelect: (id: string | null) => void;
}) {
  const pill = (on: boolean) =>
    `h-7 shrink-0 rounded-sm border px-3 text-sm font-medium transition-colors ${
      on
        ? 'border-ice-signal text-paper-white'
        : 'border-iron text-fog hover:bg-slate hover:text-paper-white'
    }`;

  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-iron px-4 py-3">
      <button className={pill(active === null)} onClick={() => onSelect(null)}>Semua</button>
      {categories.map(c => (
        <button key={c.id} className={pill(active === c.id)} onClick={() => onSelect(c.id)}>
          {c.name}
        </button>
      ))}
    </div>
  );
}

function RailButton({ label, onClick, children }: {
  label: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded-sm bg-void p-2.5 text-paper-white transition-colors hover:bg-slate"
    >
      {children}
    </button>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative shrink-0 px-4 py-3">
      <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Cari menu..."
        className="h-10 pl-9"
      />
    </div>
  );
}

function MenuGrid({ menus, bestSellers, onAdd }: { menus: Menu[]; bestSellers: string[]; onAdd: (m: Menu, qty?: number) => void }) {
  if (menus.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-fog">Menu tidak ditemukan</p>
      </div>
    );
  }
  return (
    <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto px-4 pb-28 sm:grid-cols-3 lg:grid-cols-4">
      {menus.map(m => (
        <button
          key={m.id}
          onClick={() => onAdd(m, 1)}
          className="flex flex-col justify-between rounded-md border border-iron bg-charcoal p-3 text-left transition-colors hover:bg-graphite"
        >
          <div>
            <div className="flex items-start justify-between gap-1">
              <p className="line-clamp-2 text-sm font-medium text-paper-white">{m.name}</p>
              {bestSellers.includes(m.id) && (
                <span className="shrink-0 rounded-sm bg-ice-signal px-1 py-0.5 text-[9px] font-bold text-void">
                  BEST
                </span>
              )}
            </div>
            {m.stock_tracking && (
              <p className="mt-1 font-gtamericamono text-xs text-fog">stok {m.stock_quantity ?? 0}</p>
            )}
          </div>
          <p className="mt-2 font-gtamericamono text-sm text-ice-signal">{formatPrice(m.price_cents)}</p>
        </button>
      ))}
    </div>
  );
}

function CartBar({ itemCount, total, onOpen, onPay }: {
  itemCount: number; total: number; onOpen: () => void; onPay: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-4 border-t border-iron bg-obsidian px-4 py-3">
      <button onClick={onOpen} className="flex items-center gap-3 text-left">
        <span className="relative rounded-sm border border-iron bg-graphite p-2.5">
          <ShoppingCart className="h-5 w-5 text-paper-white" />
          {itemCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-obsidian bg-ice-signal px-1 font-gtamericamono text-xs font-medium text-void">
              {itemCount}
            </span>
          )}
        </span>
        <span>
          <span className="block text-xs text-fog">Total</span>
          <span className="block font-gtamericamono text-lg text-paper-white">{formatPrice(total)}</span>
        </span>
      </button>
      <Button size="lg" disabled={itemCount === 0} onClick={onPay}>
        Bayar
      </Button>
    </div>
  );
}

function CartDrawer({ items, total, onClose, onUpdate, onRemove, onCheckout }: {
  items: CartItem[];
  total: number;
  onClose: () => void;
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col border-l border-iron bg-charcoal"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-iron px-4 py-3">
          <h2 className="text-heading-sm text-paper-white">Pesanan</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Tutup">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="text-sm text-fog">Keranjang kosong.</p>
          ) : (
            <ul className="space-y-2">
              {items.map(i => (
                <li key={i.menu.id} className="rounded-md border border-iron p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-paper-white">{i.menu.name}</p>
                    <button
                      onClick={() => onRemove(i.menu.id)}
                      className="text-fog hover:text-red-400"
                      aria-label={`Hapus ${i.menu.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => onUpdate(i.menu.id, i.quantity - 1)} aria-label="Kurangi">
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-gtamericamono text-sm text-paper-white">{i.quantity}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => onUpdate(i.menu.id, i.quantity + 1)} aria-label="Tambah">
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-gtamericamono text-sm text-paper-white">
                      {formatPrice(cartLineTotal(i))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-iron p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fog">Total</span>
            <span className="font-gtamericamono text-xl text-paper-white">{formatPrice(total)}</span>
          </div>
          <Button size="lg" className="w-full" disabled={items.length === 0} onClick={onCheckout}>
            Lanjut ke Pembayaran
          </Button>
        </div>
      </aside>
    </div>
  );
}