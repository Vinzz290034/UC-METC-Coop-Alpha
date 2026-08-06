// Notification Dropdown Component
// Displays recent notifications in a dropdown panel

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShoppingCart, UserCheck, CheckCircle, XCircle, Users, Bell, MessageSquare } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuth } from '../store/authContext';
import type { Notification, NotificationType } from '../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // If clicking the bell button, let the bell's own toggle click handler close it
        const isBellClick = (event.target as HTMLElement).closest('[aria-label="Notifications"]');
        if (isBellClick) {
          return;
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'feedback_submitted':
        return <MessageSquare size={20} className="text-purple-600" />;
      case 'feedback_replied':
        return <MessageSquare size={20} className="text-emerald-600" />;
      case 'new_message':
        return <Mail size={20} className="text-blue-600" />;
      case 'pending_order':
        return <ShoppingCart size={20} className="text-orange-600" />;
      case 'pending_membership':
        return <Users size={20} className="text-purple-600" />;
      case 'order_completed':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'order_cancelled':
        return <XCircle size={20} className="text-red-600" />;
      case 'membership_approved':
        return <UserCheck size={20} className="text-green-600" />;
      case 'membership_rejected':
        return <XCircle size={20} className="text-red-600" />;
      default:
        return <Bell size={20} className="text-slate-600" />;
    }
  };

  // Format timestamp as relative time
  const formatTimestamp = (timestamp: string): string => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return notificationTime.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to link
    if (notification.link) {
      navigate(notification.link);
    }

    // Close dropdown
    onClose();
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Filter notifications for current user
  const userNotifications = notifications.filter(n => {
    const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';
    if (isAdminOrStaff) {
      return n.user_id === 'admin' || n.type === 'feedback_submitted' || n.user_id === user?.id || n.type === 'pending_order';
    }
    return n.user_id === user?.id || n.user_id === 'guest' || (n.type === 'feedback_replied' && (n.user_id === user?.id || !n.user_id));
  });

  // Get recent notifications (max 10)
  const recentNotifications = userNotifications.slice(0, 10);

  return (
    <div
      ref={dropdownRef}
      className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 top-[132px] md:top-auto md:mt-2 w-auto md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 animate-slide-in-top"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell size={48} className="text-slate-300 mb-3" />
            <p className="text-slate-500 text-center">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-4 transition-colors hover:bg-slate-50 ${
                  !notification.is_read ? 'bg-purple-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        !notification.is_read
                          ? 'font-semibold text-slate-900'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      {notification.title}
                    </p>
                    {notification.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {notification.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {formatTimestamp(notification.created_at)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};
