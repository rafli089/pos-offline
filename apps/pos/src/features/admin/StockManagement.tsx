import { useState } from 'react';
import { useMenuStore, formatPrice } from '../../stores/menuStore';
import { useSyncStore } from '../../stores/syncStore';
import { useAuditStore } from '../../stores/auditStore';
import { db } from '../../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft, Plus, Minus, AlertTriangle, History } from 'lucide-react';
import type { StockMovement, StockMovementType } from '../../types';

const MOVEMENT_TYPES: Array<{ type: StockMovementType; label: string; sign: 1 | -1 }> = [
  { type: 'STOCK_IN', label: 'Stok Masuk', sign: 1 },
  { type: 'STOCK_OUT', label: 'Stok Keluar', sign: -1 },
  { type: 'ADJUSTMENT', label: 'Koreksi Stok', sign: 1 },
  { type: 'WASTE', label: 'Rusak / Terbuang', sign: -1 },
  { type: 'REFUND', label: 'Retur', sign: 1 },
];

export default function StockManagement() {
  const { menus, setMenus } = useMenuStore();
  const { addToQueue } = useSyncStore();
  const { log } = useAuditStore();

  const [menuId, setMenuId] = useState<string>('');
  const [movementType, setMovementType] = useState<StockMovementType>('STOCK_IN');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const trackedMenus = menus.filter((m) => m.stock_tracking);
  const selected = menus.find((m) => m.id === menuId);
  const lowStock = trackedMenus.filter((m) => (m.stock_quantity ?? 0) <= (m.minimum_stock ?? 0));

  const loadMovements = async () => {
    const all = await db.stockMovements.toArray();
    setMovements(all.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    setShowHistory(true);
  };

  const handleAdjust = async () => {
    if (!selected || !quantity || Number(quantity) <= 0) return;

    const sign = MOVEMENT_TYPES.find((t) => t.type === movementType)?.sign ?? 1;
    const delta = sign * Number(quantity);
    const updated = { ...selected, stock_quantity: Math.max(0, (selected.stock_quantity ?? 0) + delta), updated_at: new Date().toISOString() };

    const movement: StockMovement = {
      id: crypto.randomUUID(),
      branch_id: selected.branch_id,
      menu_id: selected.id,
      type: movementType,
      quantity: delta,
      reference_id: 'manual-adjustment',
      user_id: 'system',
      created_at: new Date().toISOString(),
    };

    await db.stockMovements.put(movement);
    await setMenus(menus.map((m) => (m.id === selected.id ? updated : m)));
    addToQueue('stockMovements', movement.id, 'CREATE', movement);
    await log('STOCK_ADJUSTED', 'menu', selected.id, {
      reason: reason || undefined,
      new_data: { type: movementType, delta, stock: updated.stock_quantity },
    });

    setQuantity('');
    setReason('');
    if (showHistory) loadMovements();
  };

  return (
    <div className="min-h-screen bg-void p-4">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-fog hover:text-paper-white">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-paper-white">Manajemen Stok</h1>
        <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={loadMovements}>
          <History className="h-4 w-4" /> Riwayat
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4" />
          {lowStock.length} menu stoknya di bawah minimum: {lowStock.map((m) => m.name).join(', ')}
        </div>
      )}

      <Card className="mb-4 bg-charcoal border-iron">
        <CardHeader><CardTitle className="text-base">Penyesuaian Stok</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-fog">Menu</label>
            <select
              value={menuId}
              onChange={(e) => setMenuId(e.target.value)}
              className="mt-1 w-full rounded border border-iron bg-graphite px-2 py-2 text-sm text-paper-white"
            >
              <option value="">— pilih menu —</option>
              {trackedMenus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (stok {m.stock_quantity ?? 0})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-fog">Jenis</label>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {MOVEMENT_TYPES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => setMovementType(t.type)}
                  className={`flex items-center justify-center gap-1 rounded border px-2 py-1.5 text-xs ${
                    movementType === t.type ? 'border-ice-signal text-paper-white' : 'border-iron text-fog'
                  }`}
                >
                  {t.sign > 0 ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fog">Jumlah</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-fog">Alasan</label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="opsional"
                className="mt-1"
              />
            </div>
          </div>

          {selected && (
            <p className="text-xs text-fog">
              Stok saat ini: <span className="text-paper-white">{selected.stock_quantity ?? 0}</span> · Min: {selected.minimum_stock ?? 0} · Harga {formatPrice(selected.price_cents)}
            </p>
          )}

          <Button className="w-full" disabled={!selected || !quantity} onClick={handleAdjust}>
            Simpan Penyesuaian
          </Button>
        </CardContent>
      </Card>

      {showHistory && (
        <Card className="bg-charcoal border-iron">
          <CardHeader><CardTitle className="text-base">Riwayat Pergerakan Stok</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {movements.length === 0 ? (
              <p className="text-sm text-fog">Belum ada pergerakan stok.</p>
            ) : (
              movements.slice(0, 50).map((mv) => (
                <div key={mv.id} className="flex items-center justify-between border-b border-iron py-1.5 text-sm last:border-0">
                  <span className="text-fog">
                    {menus.find((m) => m.id === mv.menu_id)?.name || mv.menu_id}
                  </span>
                  <span className={`font-gtamericamono ${mv.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {mv.quantity > 0 ? '+' : ''}{mv.quantity}
                  </span>
                  <span className="text-xs text-fog">{mv.type}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}