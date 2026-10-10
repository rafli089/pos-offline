import { create } from 'zustand';
import type { Menu, MenuCategory, MenuModifier, MenuExtra, CartItem } from '../types';
import { db } from '../lib/db';

interface MenuState {
  categories: MenuCategory[];
  menus: Menu[];
  modifiers: MenuModifier[];
  extras: MenuExtra[];
  cart: CartItem[];

  setCategories: (categories: MenuCategory[]) => Promise<void>;
  setMenus: (menus: Menu[]) => Promise<void>;
  setModifiers: (modifiers: MenuModifier[]) => Promise<void>;
  setExtras: (extras: MenuExtra[]) => Promise<void>;
  getCategoryMenus: (categoryId: string) => Menu[];

  addToCart: (menu: Menu, quantity: number, modifiers?: Array<{ modifier: MenuModifier; extras: MenuExtra[] }>, notes?: string) => Promise<void>;
  removeFromCart: (menuId: string) => Promise<void>;
  updateQuantity: (menuId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  deductStock: (menuId: string, quantity: number) => Promise<void>;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: [],
  menus: [],
  modifiers: [],
  extras: [],
  cart: [],

  setCategories: async (categories) => {
    await db.transaction('rw', db.categories, async () => {
      await db.categories.clear();
      for (const c of categories) await db.categories.put(c);
    });
    set({ categories });
  },

  setMenus: async (menus) => {
    await db.transaction('rw', db.menus, async () => {
      await db.menus.clear();
      for (const m of menus) await db.menus.put(m);
    });
    set({ menus });
  },

  setModifiers: async (modifiers) => {
    await db.transaction('rw', db.modifiers, async () => {
      await db.modifiers.clear();
      for (const m of modifiers) await db.modifiers.put(m);
    });
    set({ modifiers });
  },

  setExtras: async (extras) => {
    await db.transaction('rw', db.extras, async () => {
      await db.extras.clear();
      for (const e of extras) await db.extras.put(e);
    });
    set({ extras });
  },

  getCategoryMenus: (categoryId) => {
    const { menus } = get();
    return menus.filter((m) => m.category_id === categoryId && m.availability === 'AVAILABLE');
  },

  addToCart: async (menu, qty, modifiers = [], notes) => {
    const quantity = qty ?? 1;
    set((state) => ({
      cart: [...state.cart, { menu, quantity, modifiers, notes }],
    }));
  },

  removeFromCart: async (menuId) => {
    set((state) => ({ cart: state.cart.filter((item) => item.menu.id !== menuId) }));
  },

  updateQuantity: async (menuId, quantity) => {
    if (quantity <= 0) {
      set((state) => ({ cart: state.cart.filter((item) => item.menu.id !== menuId) }));
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.menu.id === menuId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: async () => set({ cart: [] }),

  deductStock: async (menuId, qty) => {
    const { menus } = get();
    const menu = menus.find((m) => m.id === menuId);
    if (!menu || !menu.stock_tracking) return;
    const updated = { ...menu, stock_quantity: Math.max(0, (menu.stock_quantity ?? 0) - qty) };
    await db.menus.put(updated);
    set((state) => ({
      menus: state.menus.map((m) => (m.id === menuId ? updated : m)),
    }));
  },

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => {
      const itemTotal = item.menu.price_cents * item.quantity;
      const modifierTotal = item.modifiers.reduce((mSum, m) => {
        return mSum + m.modifier.price_cents + m.extras.reduce((eSum, e) => eSum + e.price_cents, 0);
      }, 0);
      return sum + itemTotal + modifierTotal;
    }, 0);
  },

  getCartItemCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),
}));

export const formatPrice = (cents: number): string =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(cents / 100);

export const cartLineTotal = (item: CartItem): number =>
  item.menu.price_cents * item.quantity +
  item.modifiers.reduce((mSum, m) => mSum + m.modifier.price_cents + m.extras.reduce((eSum, e) => eSum + e.price_cents, 0), 0);

// Rehydrate from IndexedDB on module load
(async () => {
  try {
    const categories = await db.categories.toArray();
    const menus = await db.menus.toArray();
    const modifiers = await db.modifiers.toArray();
    const extras = await db.extras.toArray();
    if (categories.length || menus.length || modifiers.length || extras.length) {
      useMenuStore.setState({
        categories,
        menus,
        modifiers,
        extras,
      });
    }
  } catch (e) {
    console.error('Failed to rehydrate menuStore', e);
  }
})();