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

  // Inactivity and Tab switching auto-logout logic
  const [showForbiddenModal, setShowForbiddenModal] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    const TAB_TIMEOUT = 5 * 60 * 1000;  // 5 minutes
    
    let lastActivity = Date.now();
    let hiddenTimestamp: number | null = null;

    const handleActivity = () => {
      lastActivity = Date.now();
    };

    // Listeners for idle detection
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check idle state every 10 seconds
    const idleCheckInterval = setInterval(() => {
      if (Date.now() - lastActivity > IDLE_TIMEOUT) {
        console.warn('[AUTH CONTEXT] User is idle. Triggering auto-logout...');
        logout();
        setShowForbiddenModal(true);
      }
    }, 10000);

    // Visibility change detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimestamp = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (hiddenTimestamp) {
          const durationAway = Date.now() - hiddenTimestamp;
          if (durationAway > TAB_TIMEOUT) {
            console.warn('[AUTH CONTEXT] Tab was hidden too long. Triggering auto-logout...');
            logout();
            setShowForbiddenModal(true);
          }
          hiddenTimestamp = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(idleCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, logout]);

  const handleModalClose = () => {
    setShowForbiddenModal(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showForbiddenModal && <ForbiddenModal onClose={handleModalClose} />}
    </AuthContext.Provider>
  );
};

// Premium Forbidden/Session Expired Modal Overlay
const ForbiddenModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[modalFadeIn_0.3s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-slate-100 text-center animate-[scaleIn_0.3s_ease-out]">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 animate-pulse">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-8V5m0 16a9 9 0 110-18 9 9 0 010 18z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Access Forbidden</h3>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          For your security, your session has been terminated because you were inactive or away from this tab for too long.
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-purple-500/20 transition-all duration-200"
        >
          Log Back In
        </button>
      </div>
    </div>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
