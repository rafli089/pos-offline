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
            </div>

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
                <h3 className="font-semibold text-paper-white">{menu.name}</h3>
                <p className="text-sm text-fog">{categories.find((c) => c.id === menu.category_id)?.name}</p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-accent">{formatPrice(menu.price_cents)}</span>
                  {menu.stock_tracking && (
                    <span className={menu.stock_quantity! <= menu.minimum_stock! ? 'text-red-500' : 'text-fog'}>
                      Stok: {menu.stock_quantity}
                    </span>
                  )}
                </div>
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
