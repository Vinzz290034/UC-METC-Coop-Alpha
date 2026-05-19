import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useAuth } from '../store/authContext';
// @ts-ignore
import coopLogo from '../assets/Coop.jpeg';
import { Bell, Search, Settings, LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { showNotification } = useUIStore();
  const { user, logout } = useAuth();
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, message: 'Time in successful', time: '2 hours ago', read: false },
    { id: 2, message: 'System maintenance scheduled', time: '1 day ago', read: true },
    { id: 3, message: 'New announcement available', time: '2 days ago', read: true },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearNotifications = () => {
    showNotification('All notifications cleared', 'success');
    setShowNotificationDropdown(false);
  };

  const handleSettings = () => {
    showNotification('Settings page will open soon', 'success');
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    logout();
    showNotification('Logged out successfully', 'success');
    // No need to navigate manually - App.tsx will automatically redirect
    // to landing page when isAuthenticated becomes false
  };

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="bg-gradient-to-r from-purple-600 via-purple-500 to-green-500 sticky top-0 z-30 backdrop-blur-md shadow-lg shadow-purple-500/20 border-b border-green-400/20">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src={coopLogo}
            alt="UC METC Logo" 
            className="w-10 h-10 rounded-full"
          />
          <h2 className="text-xl font-semibold text-white">
            University of Cebu - METC Multipurpose Cooperative (UC-METC MPC)
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="hidden md:flex items-center bg-white/20 rounded-lg px-4 py-2">
            <Search size={18} className="text-white/70" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent ml-2 text-sm text-white placeholder-white/50 focus:outline-none w-40"
            />
          </div>

          {/* Notification bell - Accessible to all users */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              className="relative p-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Notifications Dropdown */}
            {showNotificationDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-purple-200 z-50">
                <div className="px-4 py-3 border-b border-purple-100 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  <button
                    onClick={handleClearNotifications}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                          !notif.read ? 'bg-purple-50' : ''
                        }`}
                      >
                        <p className="text-sm text-slate-900 font-medium">{notif.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-slate-500 text-sm">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu - Accessible to all users */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-shadow"
              title="Profile"
            >
              {getInitials()}
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-purple-200 z-50">
                {/* User Info */}
                <div className="px-4 py-4 border-b border-purple-100">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>

                {/* Menu Items */}
                <button
                  onClick={() => {
                    showNotification('Profile page will open soon', 'success');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 hover:bg-purple-50 border-b border-purple-100 text-left text-slate-700 transition-colors"
                >
                  <User size={16} className="text-purple-600" />
                  <span className="text-sm">My Profile</span>
                </button>

                <button
                  onClick={handleSettings}
                  className="w-full flex items-center space-x-2 px-4 py-3 hover:bg-purple-50 border-b border-purple-100 text-left text-slate-700 transition-colors"
                >
                  <Settings size={16} className="text-purple-600" />
                  <span className="text-sm">Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-3 hover:bg-red-50 text-left text-red-600 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
