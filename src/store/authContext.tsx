// @refresh reset
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import type { User, UserRole } from '../types';
import { apiClient } from '../services/api';
import { AppDataSync } from './appDataSync';
import { useNotificationStore } from './notificationStore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  isValidating: boolean;
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
  const [isValidating, setIsValidating] = useState(true); // Start as true to prevent flash
  const [error, setError] = useState<string | null>(null);

  // Validate token with backend on mount (production-ready approach)
  useEffect(() => {
    const validateSession = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (!storedToken || !storedUser) {
          console.log('[AUTH CONTEXT] No stored session found');
          setIsValidating(false);
          return;
        }

        console.log('[AUTH CONTEXT] Validating session with backend...');
        
        // Set token temporarily for the API request
        const headers = new Headers();
        headers.set('Authorization', `Bearer ${storedToken}`);
        
        // Verify token by calling getCurrentUser (requires valid token)
        const response = await apiClient.getCurrentUser() as any;
        
        // If backend confirms user is valid, restore session
        setToken(storedToken);
        setUser(response);
        console.log('[AUTH CONTEXT] Session validated successfully from backend');

        // Initialize notification system
        useNotificationStore.getState().initialize(storedToken, response.id);
      } catch (err: any) {
        // Token is invalid, expired, or backend rejected it
        console.warn('[AUTH CONTEXT] Session validation failed, clearing localStorage:', err?.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsValidating(false); // Session validation complete
      }
    };

    validateSession();
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

      // Initialize notification system
      useNotificationStore.getState().initialize(token, user.id);
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
      
      // Registration no longer returns a token - user must login separately
      // Just return the response message
      console.log('[AUTH CONTEXT] Registration successful:', response.message);
      
      return response;
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
    console.log('[AUTH CONTEXT] Logging out user');
    
    // Cleanup notification system
    useNotificationStore.getState().cleanup();
    
    // Clear localStorage first
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Use flushSync to force immediate state updates (not batched)
    flushSync(() => {
      setUser(null);
      setToken(null);
      setError(null);
    });
    
    console.log('[AUTH CONTEXT] Logout complete - state cleared');
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
    isValidating,
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
