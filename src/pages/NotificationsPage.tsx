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
        return <Mail size={24} className="text-blue-600" />;
      case 'pending_order':
        return <ShoppingCart size={24} className="text-orange-600" />;
      case 'pending_membership':
        return <Users size={24} className="text-purple-600" />;
      case 'order_completed':
        return <CheckCircle size={24} className="text-green-600" />;
      case 'order_cancelled':
        return <XCircle size={24} className="text-red-600" />;
      case 'membership_approved':
        return <UserCheck size={24} className="text-green-600" />;
      case 'membership_rejected':
        return <XCircle size={24} className="text-red-600" />;
      case 'insurance_approved':
        return <CheckCircle size={24} className="text-purple-600" />;
      default:
        return <Bell size={24} className="text-slate-600" />;
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
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 py-8 px-4 animate-slide-in-right">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-wide uppercase">NOTIFICATIONS</h1>
            <p className="text-slate-700 text-sm font-medium mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === 'unread'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Bell size={64} className="text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
              <p className="text-slate-400 text-sm">
                {filter === 'unread' ? 'All caught up!' : 'You\'ll see notifications here when you receive them'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-6 cursor-pointer transition-colors hover:bg-slate-50 ${
                    !notification.is_read ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3
                          className={`text-lg ${
                            !notification.is_read
                              ? 'font-bold text-slate-900'
                              : 'font-semibold text-slate-700'
                          }`}
                        >
                          {notification.title}
                        </h3>
                        
                        {/* Unread indicator */}
                        {!notification.is_read && (
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                          </div>
                        )}
                      </div>

                      {notification.description && (
                        <p className="text-slate-600 mb-2">
                          {notification.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                          {formatTimestamp(notification.created_at)}
                        </p>

                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 size={18} />
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
