import { useState } from 'react';
import { useMenuStore, formatPrice } from '../../stores/menuStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Plus, Edit2, Trash2, X } from 'lucide-react';
import type { Menu } from '../../types';

export default function MenuManagement() {
  const { menus, categories, setMenus } = useMenuStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Menu>>({
    name: '',
    price_cents: 0,
    stock_quantity: 0,
    minimum_stock: 0,
    availability: 'AVAILABLE',
    stock_tracking: false,
    open_price: false,
    description: '',
    image_url: '',
    tags: [],
  });

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      price_cents: 0,
      stock_quantity: 0,
      minimum_stock: 0,
      availability: 'AVAILABLE',
      stock_tracking: false,
      open_price: false,
      description: '',
      image_url: '',
      tags: [],
    });
    setShowForm(true);
  };

  const handleEdit = (menu: Menu) => {
    setEditingId(menu.id);
    setFormData(menu);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category_id) {
      alert('Nama dan kategori harus diisi');
      return;
    }

    const now = new Date().toISOString();
    if (editingId) {
      const updated: Menu = {
        ...(menus.find((m) => m.id === editingId) as Menu),
        ...formData,
        updated_at: now,
      };
      await setMenus(menus.map((m) => (m.id === editingId ? updated : m)));
    } else {
      const newMenu: Menu = {
        id: crypto.randomUUID(),
        branch_id: 'branch-001',
        category_id: formData.category_id || categories[0]?.id || '',
        sku: formData.sku || `SKU-${Date.now()}`,
        name: formData.name,
        price_cents: formData.price_cents || 0,
        special_price_cents: formData.special_price_cents,
        open_price: formData.open_price || false,
        availability: 'AVAILABLE',
        stock_quantity: formData.stock_quantity || 0,
        minimum_stock: formData.minimum_stock || 0,
        stock_tracking: formData.stock_tracking || false,
        description: formData.description,
        image_url: formData.image_url,
        tags: formData.tags,
        is_package: formData.is_package,
        package_items: formData.package_items,
        prices: formData.prices,
        display_order: menus.length,
        created_at: now,
        updated_at: now,
      };
      await setMenus([...menus, newMenu]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus menu ini?')) {
      await setMenus(menus.filter((m) => m.id !== id));
    }
  };

  const currentCategory = editingId
    ? categories.find((c) => c.id === menus.find((m) => m.id === editingId)?.category_id)
    : categories[0];

  return (
    <div className="min-h-screen bg-charcoal p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-fog hover:text-paper-white">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-paper-white">Manajemen Menu</h1>
        </div>
        <Button onClick={handleAdd} className="gap-2 bg-accent hover:bg-accent-dark">
          <Plus className="h-4 w-4" /> Tambah Menu
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 bg-charcoal border-iron">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-paper-white">{editingId ? 'Edit' : 'Tambah'} Menu</CardTitle>
              <button onClick={() => setShowForm(false)} className="text-fog hover:text-paper-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-fog">Nama Menu</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Latte"
                  className="bg-iron border-iron text-paper-white"
                />
              </div>
              <div>
                <Label className="text-fog">Kategori</Label>
                <select
                  value={formData.category_id || categories[0]?.id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 bg-iron border border-iron rounded text-paper-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-fog">Harga (Rp)</Label>
                <Input
                  type="number"
                  value={Math.round((formData.price_cents || 0) / 100)}
                  onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) * 100 })}
                  placeholder="18000"
                  className="bg-iron border-iron text-paper-white"
                />
              </div>
              <div>
                <Label className="text-fog">Stok</Label>
                <Input
                  type="number"
                  value={formData.stock_quantity || 0}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                  placeholder="0"
                  className="bg-iron border-iron text-paper-white"
                />
              </div>
              <div>
                <Label className="text-fog">Minimal Stok</Label>
                <Input
                  type="number"
                  value={formData.minimum_stock || 0}
                  onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) })}
                  placeholder="5"
                  className="bg-iron border-iron text-paper-white"
                />
              </div>
              <div>
                <Label className="text-fog">Harga Spesial (Rp)</Label>
                <Input
                  type="number"
                  value={formData.special_price_cents ? Math.round(formData.special_price_cents / 100) : ''}
                  onChange={(e) =>
                    setFormData({ ...formData, special_price_cents: e.target.value ? parseInt(e.target.value) * 100 : undefined })
                  }
                  placeholder="Opsional"
                  className="bg-iron border-iron text-paper-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-fog">Deskripsi</Label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Opsional"
                  className="bg-iron border-iron text-paper-white"
                />
              </div>
              <div>
                <Label className="text-fog">URL Gambar</Label>
                <Input
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://…"
                  className="bg-iron border-iron text-paper-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-fog">Tags (pisahkan koma)</Label>
              <Input
                value={(formData.tags || []).join(', ')}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })
                }
                placeholder="Best Seller, Promo"
                className="bg-iron border-iron text-paper-white"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="stock_tracking"
                  checked={formData.stock_tracking || false}
                  onChange={(e) => setFormData({ ...formData, stock_tracking: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="stock_tracking" className="text-fog">
                  Tracking Stok
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="open_price"
                  checked={formData.open_price || false}
                  onChange={(e) => setFormData({ ...formData, open_price: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="open_price" className="text-fog">
                  Open Price
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_package"
                  checked={formData.is_package || false}
                  onChange={(e) => setFormData({ ...formData, is_package: e.target.checked, package_items: e.target.checked ? formData.package_items : undefined })}
                  className="h-4 w-4"
                />
                <label htmlFor="is_package" className="text-fog">
                  Package
                </label>
              </div>
            </div>

            {formData.is_package && (
              <PackageBuilder menus={menus} value={formData.package_items || []}
                onChange={(items) => setFormData({ ...formData, package_items: items })} />
            )}

            <PriceTierBuilder value={formData.prices || []} onChange={(prices) => setFormData({ ...formData, prices })} />

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1 bg-accent hover:bg-accent-dark">
                Simpan
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {menus.map((menu) => (
          <Card key={menu.id} className="bg-charcoal border-iron">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-paper-white">{menu.name}</h3>
                  {menu.open_price && (
                    <span className="rounded-sm bg-ice-signal/20 px-1.5 py-0.5 text-[10px] font-medium text-ice-signal">Open Price</span>
                  )}
                </div>
                <p className="text-sm text-fog">{categories.find((c) => c.id === menu.category_id)?.name}</p>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  {menu.special_price_cents ? (
                    <>
                      <span className="text-accent">{formatPrice(menu.special_price_cents)}</span>
                      <span className="text-fog line-through">{formatPrice(menu.price_cents)}</span>
                    </>
                  ) : (
                    <span className="text-accent">{formatPrice(menu.price_cents)}</span>
                  )}
                  {menu.stock_tracking && (
                    <span className={menu.stock_quantity! <= menu.minimum_stock! ? 'text-red-500' : 'text-fog'}>
                      Stok: {menu.stock_quantity}
                    </span>
                  )}
                </div>
                {menu.tags && menu.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {menu.tags.map((t) => (
                      <span key={t} className="rounded-sm bg-graphite border border-iron px-1.5 py-0.5 text-[10px] text-fog">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(menu)}
                  className="p-2 text-fog hover:text-accent transition"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(menu.id)}
                  className="p-2 text-fog hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

type PackageItem = { menu_id: string; quantity: number; note?: string };

function PackageBuilder({ menus, value, onChange }: {
  menus: Menu[];
  value: PackageItem[];
  onChange: (items: PackageItem[]) => void;
}) {
  return (
    <div className="rounded border border-iron p-3">
      <Label className="text-fog">Isi Package</Label>
      {value.map((item, idx) => (
        <div key={idx} className="mt-2 flex items-center gap-2">
          <select
            className="flex-1 px-2 py-1.5 bg-iron border border-iron rounded text-sm text-paper-white"
            value={item.menu_id}
            onChange={(e) => {
              const next = [...value];
              next[idx] = { ...item, menu_id: e.target.value };
              onChange(next);
            }}
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => {
              const next = [...value];
              next[idx] = { ...item, quantity: parseInt(e.target.value) || 1 };
              onChange(next);
            }}
            className="w-16 px-2 py-1.5 bg-iron border border-iron rounded text-sm text-paper-white"
          />
          <button onClick={() => onChange(value.filter((_, i) => i !== idx))} className="text-fog hover:text-red-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...value, { menu_id: menus[0]?.id || '', quantity: 1 }])}
        className="mt-2 text-sm text-ice-signal hover:underline"
      >
        + Tambah item
      </button>
    </div>
  );
}

function PriceTierBuilder({ value, onChange }: {
  value: Array<{ label: string; price_cents: number }>;
  onChange: (v: Array<{ label: string; price_cents: number }>) => void;
}) {
  return (
    <div className="rounded border border-iron p-3">
      <Label className="text-fog">Harga Tambahan (Multi-price)</Label>
      {value.map((tier, idx) => (
        <div key={idx} className="mt-2 flex items-center gap-2">
          <input
            value={tier.label}
            placeholder="Label (mis. Large)"
            onChange={(e) => {
              const next = [...value];
              next[idx] = { ...tier, label: e.target.value };
              onChange(next);
            }}
            className="flex-1 px-2 py-1.5 bg-iron border border-iron rounded text-sm text-paper-white"
          />
          <input
            type="number"
            value={Math.round(tier.price_cents / 100)}
            onChange={(e) => {
              const next = [...value];
              next[idx] = { ...tier, price_cents: (parseInt(e.target.value) || 0) * 100 };
              onChange(next);
            }}
            className="w-24 px-2 py-1.5 bg-iron border border-iron rounded text-sm text-paper-white"
          />
          <button onClick={() => onChange(value.filter((_, i) => i !== idx))} className="text-fog hover:text-red-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...value, { label: '', price_cents: 0 }])} className="mt-2 text-sm text-ice-signal hover:underline">
        + Tambah harga
      </button>
    </div>
  );
}
