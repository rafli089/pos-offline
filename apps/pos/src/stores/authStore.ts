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

  // Actions
  login: (user: User, branch: Branch, terminal: Terminal, station: Station, permissions: Permission[]) => void;
  logout: () => void;
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

  login: (user, branch, terminal, station, permissions) => {
    set({
      user,
      branch,
      terminal,
      station,
      permissions,
      isAuthenticated: true,
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
    });
    localStorage.removeItem('pos_session');
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