import { useEffect, useRef } from 'react';
import { useAuth } from '../store/authContext';
import { useUIStore } from '../store/uiStore';

export const useSessionTimeout = () => {
  const { user, logout } = useAuth();
  const { showNotification } = useUIStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) return;

    const checkAndResetTimer = () => {
      const now = Date.now();
      lastActivityRef.current = now;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Check per-user preference key first, fallback to global key
      const userKey = `silms_session_timeout_enabled_${user.id}`;
      const savedUser = localStorage.getItem(userKey);
      const enabledStr = savedUser !== null ? savedUser : localStorage.getItem('silms_session_timeout_enabled');
      const isEnabled = enabledStr === null ? true : enabledStr === 'true';

      if (!isEnabled) return;

      const durationUserKey = `silms_session_timeout_duration_${user.id}`;
      const durationMins = parseInt(
        localStorage.getItem(durationUserKey) ||
        localStorage.getItem('silms_session_timeout_duration') ||
        '30',
        10
      );
      const durationMs = durationMins * 60 * 1000;

      timeoutRef.current = setTimeout(() => {
        logout();
        showNotification(`Session timed out after ${durationMins} minutes of inactivity.`, 'info');
      }, durationMs);
    };

    // Production Hardening: Handle background tabs and laptop wake-up
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const userKey = `silms_session_timeout_enabled_${user.id}`;
        const savedUser = localStorage.getItem(userKey);
        const enabledStr = savedUser !== null ? savedUser : localStorage.getItem('silms_session_timeout_enabled');
        const isEnabled = enabledStr === null ? true : enabledStr === 'true';

        if (isEnabled) {
          const durationUserKey = `silms_session_timeout_duration_${user.id}`;
          const durationMins = parseInt(
            localStorage.getItem(durationUserKey) ||
            localStorage.getItem('silms_session_timeout_duration') ||
            '30',
            10
          );
          const durationMs = durationMins * 60 * 1000;
          const elapsed = Date.now() - lastActivityRef.current;

          if (elapsed >= durationMs) {
            logout();
            showNotification(`Session timed out after ${durationMins} minutes of inactivity.`, 'info');
            return;
          }
        }
        checkAndResetTimer();
      }
    };

    // Throttle user activity event processing (once every 3 seconds)
    let lastEventTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastEventTime > 3000) {
        lastEventTime = now;
        checkAndResetTimer();
      }
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));
    window.addEventListener('silms_settings_updated', checkAndResetTimer);
    window.addEventListener('storage', checkAndResetTimer);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    checkAndResetTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      window.removeEventListener('silms_settings_updated', checkAndResetTimer);
      window.removeEventListener('storage', checkAndResetTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, logout, showNotification]);
};
