// Notification Bell Component
// Displays notification icon with unread count badge

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuth } from '../store/authContext';
import { NotificationDropdown } from './NotificationDropdown';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { notifications } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';
  const filteredNotifs = notifications.filter(n => {
    if (isAdminOrStaff) {
      return n.user_id === 'admin' || n.type === 'feedback_submitted' || n.user_id === user?.id || n.type === 'pending_order';
    }
    return n.user_id === user?.id || n.user_id === 'guest' || n.type === 'feedback_replied';
  });

  const unreadCount = filteredNotifs.filter(n => !n.is_read).length;

  // Show pulse animation when new notification arrives
  useEffect(() => {
    if (unreadCount > 0) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Format badge count (show 99+ if > 99)
  const formatCount = (count: number): string => {
    return count > 99 ? '99+' : count.toString();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
          showPulse
            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 animate-pulse'
            : unreadCount > 0
            ? 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 hover:from-purple-200 hover:to-purple-300 shadow-md hover:shadow-lg'
            : 'bg-white text-slate-600 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 hover:text-purple-600 shadow-md hover:shadow-lg border border-slate-200'
        }`}
        aria-label="Notifications"
      >
        <Bell 
          size={24} 
          className={`${showPulse ? 'animate-bounce' : ''} transition-transform duration-200`}
          strokeWidth={2.5}
        />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold text-white bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg shadow-red-500/50 animate-notification-badge border-2 border-white">
            {formatCount(unreadCount)}
          </span>
        )}
        
        {/* Glow effect when there are notifications */}
        {unreadCount > 0 && !showPulse && (
          <span className="absolute inset-0 rounded-xl bg-purple-400 opacity-20 blur-md animate-pulse"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <NotificationDropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
