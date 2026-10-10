import { create } from 'zustand';
import type { User, Branch, Terminal, Station, Permission } from '../types';

interface AuthState {
  // Session
  user: User | null;
  branch: Branch | null;
  terminal: Terminal | null;
  station: Station | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  // Auto-lock (PRD §6) — in-memory only, never persisted
  locked: boolean;
  sessionPin: string | null;

  // Actions
  login: (user: User, branch: Branch, terminal: Terminal, station: Station, permissions: Permission[], pin?: string) => void;
  logout: () => void;
  lock: () => void;
  unlock: (pin: string) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccess: (module: string, action: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  branch: null,
  terminal: null,
  station: null,
  permissions: [],
  isAuthenticated: false,
  locked: false,
  sessionPin: null,

  login: (user, branch, terminal, station, permissions, pin) => {
    set({
      user,
      branch,
      terminal,
      station,
      permissions,
      isAuthenticated: true,
      locked: false,
      sessionPin: pin ?? null,
    });
    // Cache session for offline (in production, use encrypted storage)
    localStorage.setItem('pos_session', JSON.stringify({
      user,
      branch,
      terminal,
      station,
      permissions,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8h
    }));
  },

  logout: () => {
    set({
      user: null,
      branch: null,
      terminal: null,
      station: null,
      permissions: [],
      isAuthenticated: false,
      locked: false,
      sessionPin: null,
    });
    localStorage.removeItem('pos_session');
  },

  lock: () => set({ locked: true }),

  unlock: (pin) => {
    // ponytail: sessionPin is in-memory; after reload it's null, so we can't
    // verify against the server offline. Accept any PIN then. Upgrade: verify
    // via /auth/verify-pin or biometrics when backend ready.
    const ok = get().sessionPin == null || get().sessionPin === pin;
    if (ok) set({ locked: false });
    return ok;
  },

  hasPermission: (permission) => {
    const { permissions } = get();
    return permissions.some(p => p.id === permission || `${p.module}.${p.action}` === permission);
  },

  canAccess: (module, action) => {
    const { permissions } = get();
    return permissions.some(p => p.module === module && p.action === action);
  },

  isAdmin: () => {
    const roleId = get().user?.role_id;
    return roleId === 'role-admin';
  },
}));

// Try restore cached session on module load
const cached = localStorage.getItem('pos_session');
if (cached) {
  try {
    const session = JSON.parse(cached);
    if (session.expiresAt > Date.now()) {
      useAuthStore.setState({
        user: session.user,
        branch: session.branch,
        terminal: session.terminal,
        station: session.station,
        permissions: session.permissions,
        isAuthenticated: true,
      });
    } else {
      localStorage.removeItem('pos_session');
    }
  } catch {
    localStorage.removeItem('pos_session');
  }
}