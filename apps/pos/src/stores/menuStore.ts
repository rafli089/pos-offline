import { create } from 'zustand';
import type { Menu, MenuCategory, MenuModifier, MenuExtra, CartItem } from '../types';

interface MenuState {
  categories: MenuCategory[];
  menus: Menu[];
  modifiers: MenuModifier[];
  extras: MenuExtra[];
  cart: CartItem[];

  // Menu actions
  setCategories: (categories: MenuCategory[]) => void;
  setMenus: (menus: Menu[]) => void;
  setModifiers: (modifiers: MenuModifier[]) => void;
  setExtras: (extras: MenuExtra[]) => void;
  getCategoryMenus: (categoryId: string) => Menu[];

  // Cart actions
  addToCart: (menu: Menu, quantity: number, modifiers?: Array<{ modifier: MenuModifier; extras: MenuExtra[] }>, notes?: string) => void;
  removeFromCart: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  clearCart: () => void;
  deductStock: (menuId: string, quantity: number) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: [],
  menus: [],
  modifiers: [],
  extras: [],
  cart: [],

  setCategories: (categories) => set({ categories }),
  setMenus: (menus) => set({ menus }),
  setModifiers: (modifiers) => set({ modifiers }),
  setExtras: (extras) => set({ extras }),

  getCategoryMenus: (categoryId) => {
    const { menus } = get();
    return menus.filter(m => m.category_id === categoryId && m.availability === 'AVAILABLE');
  },

  addToCart: (menu, qty, modifiers = [], notes) => {
    const quantity = qty ?? 1;
    const { cart } = get();

    const newCartItem: CartItem = {
      menu,
      quantity,
      modifiers,
      notes,
    };

    set({ cart: [...cart, newCartItem] });
  },

  removeFromCart: (menuId) => {
    set((state) => ({
      cart: state.cart.filter(item => item.menu.id !== menuId),
    }));
  },

  updateQuantity: (menuId, quantity) => {
    if (quantity <= 0) {
      set((state) => ({
        cart: state.cart.filter(item => item.menu.id !== menuId),
      }));
      return;
    }
    set((state) => ({
      cart: state.cart.map(item =>
        item.menu.id === menuId ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => set({ cart: [] }),

  deductStock: (menuId, qty) => {
    set((state) => ({
      menus: state.menus.map((m) =>
        m.id === menuId && m.stock_tracking
          ? { ...m, stock_quantity: Math.max(0, (m.stock_quantity ?? 0) - qty) }
          : m
      ),
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

// Format price helper — input dalam SEN, output Rp
export const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(cents / 100);
};

// Total satu baris cart (menu + modifier + extra), dalam SEN
export const cartLineTotal = (item: CartItem): number =>
  item.menu.price_cents * item.quantity +
  item.modifiers.reduce(
    (mSum, m) => mSum + m.modifier.price_cents + m.extras.reduce((eSum, e) => eSum + e.price_cents, 0),
    0,
  );