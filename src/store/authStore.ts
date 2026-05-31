import create from 'zustand';
import type { User, UserRole } from '../types';
import { apiClient } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.login(email, password) as any;
      const { token, user } = response;

      // Store token
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.register(data) as any;
      const { token, user } = response;

      // Store token
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw err;
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, token: null });
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
  },

  hasRole: (role: UserRole | UserRole[]) => {
    const state = get();
    if (!state.user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(state.user.role);
  },
}));
