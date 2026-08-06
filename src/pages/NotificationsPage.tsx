import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShoppingCart, UserCheck, CheckCircle, XCircle, Users, Bell, Trash2, ChevronLeft } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import type { Notification, NotificationType } from '../types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
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
      case 'insurance_approved':
        return <CheckCircle size={20} className="text-purple-600" />;
      default:
        return <Bell size={20} className="text-slate-600" />;
    }
  };

  // Format timestamp
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
    return notificationTime.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: notificationTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
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
  };

  // Handle delete
  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  // Filter notifications
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] py-8 px-4 animate-slide-in-right">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/40 active:bg-white/60 active:scale-95 rounded-xl transition-all duration-200 flex items-center justify-center text-slate-800"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight uppercase leading-none">
              NOTIFICATIONS
            </h1>
            <p className="text-slate-700 text-xs sm:text-sm font-medium mt-1 sm:mt-1.5 leading-none">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {/* Filter Tabs (iOS Style Segmented Control) */}
          <div className="bg-purple-950/15 backdrop-blur-md p-1 rounded-xl flex gap-1 shadow-inner w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none text-center px-4 py-2 text-xs sm:text-sm rounded-lg font-bold transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 sm:flex-none text-center px-4 py-2 text-xs sm:text-sm rounded-lg font-bold transition-all duration-200 ${
                filter === 'unread'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="w-full sm:w-auto px-4 py-2 text-center text-xs sm:text-sm bg-white hover:bg-slate-50 active:scale-95 text-purple-700 rounded-xl font-bold transition-all shadow-sm border border-slate-200/50"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Bell size={64} className="text-slate-300 mb-4" />
              <p className="text-slate-500 text-base sm:text-lg mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
              <p className="text-slate-400 text-xs sm:text-sm text-center">
                {filter === 'unread' ? 'All caught up!' : 'You\'ll see notifications here when you receive them'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 sm:p-6 cursor-pointer transition-all duration-200 border-l-4 flex flex-col ${
                    !notification.is_read 
                      ? 'bg-purple-50/60 border-l-purple-600' 
                      : 'border-l-transparent hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5 sm:mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          className={`text-sm sm:text-base leading-snug ${
                            !notification.is_read
                              ? 'font-bold text-slate-900'
                              : 'font-semibold text-slate-700'
                          }`}
                        >
                          {notification.title}
                        </h3>
                        
                        {/* Unread dot */}
                        {!notification.is_read && (
                          <div className="flex-shrink-0 mt-1">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                            </span>
                          </div>
                        )}
                      </div>

                      {notification.description && (
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                          {notification.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3 sm:mt-4">
                        <p className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider">
                          {formatTimestamp(notification.created_at)}
                        </p>

                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-90 rounded-lg transition-all duration-200"
                          title="Delete notification"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
