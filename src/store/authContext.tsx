// @refresh reset
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { apiClient } from '../services/api';
import { AppDataSync } from './appDataSync';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string | null, password: string, id_number?: string | null) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('[AUTH CONTEXT] Restoring session from localStorage:', {
      hasToken: !!storedToken,
      tokenLength: storedToken?.length || 0,
      tokenPrefix: storedToken ? storedToken.substring(0, 30) + '...' : 'NO_TOKEN',
      hasUser: !!storedUser,
      timestamp: new Date().toISOString()
    });
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        console.log('[AUTH CONTEXT] Session restored successfully');
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = useCallback(async (email: string | null, password: string, id_number?: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.login(email, password, id_number) as any;
      const { token, user } = response;

      console.log('[AUTH CONTEXT] Login successful, storing token:', {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 30) + '...',
        timestamp: new Date().toISOString()
      });

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      // Initialize app data from backend
      await AppDataSync.initializeAppData(user.id);
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.register(data) as any;
      const { token, user } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      // Initialize app data from backend
      await AppDataSync.initializeAppData(user.id);
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const updatedUser = await apiClient.getCurrentUser() as any;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('[AUTH CONTEXT] User data refreshed:', {
        userId: updatedUser.id,
        membershipStatus: updatedUser.membership_status,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    token,
    isLoading,
    error,
    login,
    register,
    refreshUser,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
