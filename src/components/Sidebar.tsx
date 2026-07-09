import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  DollarSign,
  BarChart3,
  Package,
  LogOut,
  User,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  Mail,
  Megaphone,
  Lock,
  Settings,
  Tablet,
} from 'lucide-react';
import { COOP_LOGO_URL } from '../constants/cloudinaryAssets';
import { useUIStore } from '../store/uiStore';
import { useAuth } from '../store/authContext';
import { formatFullName } from '../utils/nameFormatter';

const sidebarStyles = `
  @keyframes slide-in-left {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .sidebar-entrance {
    animation: slide-in-left 0.5s ease-out forwards;
  }

  .nav-item-entrance {
    animation: slide-in-left 0.5s ease-out forwards;
  }
`;

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  id: string;
  roles?: string[];
  requiresMembership?: boolean;
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { sidebarOpen, setSidebarOpen, setCurrentPage, showNotification } = useUIStore();
  const { user, logout } = useAuth();

  // Close sidebar on screen size or route navigation changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const sidebarItems: SidebarItem[] = [
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
      id: 'dashboard',
    },
    {
      icon: <Tablet size={20} />,
      label: 'Kiosk Mode',
      id: 'kiosk',
      roles: ['admin', 'staff'],
    },
    {
      icon: <ShoppingBag size={20} />,
      label: 'Merchandise',
      id: 'merchandise',
      roles: ['user'],
    },
    {
      icon: <ShoppingCart size={20} />,
      label: 'Cart',
      id: 'cart',
      roles: ['user'],
    },
    {
      icon: <Mail size={20} />,
      label: 'Inbox',
      id: 'inbox',
      roles: ['admin', 'staff', 'user'],
    },
    {
      icon: <Lock size={20} />,
      label: 'Locker',
      id: 'locker',
      roles: ['user'],
    },
    {
      icon: <Receipt size={20} />,
      label: 'Transaction',
      id: 'transaction',
      roles: ['user'],
    },
    {
      icon: <Lock size={20} />,
      label: 'Locker Management',
      id: 'lockers',
      roles: ['admin', 'staff'],
    },
    {
      icon: <Package size={20} />,
      label: 'Inventory',
      id: 'inventory',
      roles: ['admin', 'staff'],
    },
    {
      icon: <DollarSign size={20} />,
      label: 'Sales',
      id: 'sales',
      roles: ['admin', 'staff'],
    },
    {
      icon: <Users size={20} />,
      label: 'Members',
      id: 'members',
      roles: ['admin', 'staff'],
    },
    {
      icon: <Settings size={20} />,
      label: 'User Management',
      id: 'user-management',
      roles: ['admin'],
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Reports',
      id: 'reports',
      roles: ['admin', 'staff'],
    },
    {
      icon: <Megaphone size={20} />,
      label: 'Announcements',
      id: 'announcements-management',
      roles: ['admin', 'staff'],
    },
  ];

  const filteredItems = sidebarItems.filter(
    (item) => {
      // Check if user has the required role
      if (item.roles && user && !item.roles.includes(user.role)) {
        return false;
      }
      // Check if item requires membership and user is not an approved member
      if (item.requiresMembership && user?.membership_status !== 'approved') {
        return false;
      }
      return true;
    }
  );

  const handleNavigation = (id: string) => {
    setCurrentPage(id);
    navigate(`/${id}`);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    
    // Perform logout
    logout();
    
    // Show notification
    showNotification('Signed out successfully', 'logout');
    
    // No need to navigate manually - App.tsx will automatically redirect
    // to landing page when isAuthenticated becomes false
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      {/* Mobile toggle button - Hidden, pages handle their own hamburger menus */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 text-white transition-all duration-300 z-40 w-64 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:relative lg:translate-x-0 border-r border-purple-700/50`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-purple-600/50 flex items-center justify-between bg-gradient-to-r from-purple-800/50 to-purple-700/50">
            <div className="flex items-center space-x-3">
              <img 
                src={COOP_LOGO_URL}
                alt="UC METC Logo" 
                className="w-10 h-10 rounded-full"
              />
              <div className="flex flex-col justify-center">
                <h1 className="text-[15px] font-bold leading-none bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  UC METC
                </h1>
                <span className="text-[10px] text-slate-300 leading-none mt-1">SILMS</span>
              </div>
            </div>

            {/* Mobile Close Button - Visible only on mobile/tablet (< lg) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* User info */}
          {user && (
            <button
              onClick={() => navigate('/account-settings')}
              className="w-full p-4 border-b border-purple-600/50 bg-gradient-to-r from-purple-700/50 to-purple-600/50 hover:from-purple-600/50 hover:to-purple-500/50 transition-all duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-green-400 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                    <User size={30} className="text-slate-700" />
                  </div>
                </div>
                {/* User details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{formatFullName(user.first_name, user.last_name)}</p>
                  <p className="text-xs text-purple-200 truncate">
                    {user.role === 'user' && user.course && user.year 
                      ? `${user.course}-${user.year.replace(/[a-z]+/gi, '')}` 
                      : user.role === 'user' 
                        ? 'Student' 
                        : user.role.replace('_', ' ').charAt(0).toUpperCase() + user.role.replace('_', ' ').slice(1)}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Navigation items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-green-500/40 transition-colors duration-200 group nav-item-entrance"
                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
              >
                <span className="group-hover:text-green-300 transition-colors duration-200">
                  {item.icon}
                </span>
                <span className="text-sm font-medium group-hover:text-green-300 transition-colors duration-200">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-purple-600/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500/30 to-red-600/20 text-red-100 hover:from-red-500/50 hover:to-red-600/40 transition-all duration-200 border border-red-400/30 hover:border-red-400/60"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Confirm Logout</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to log out? 
            </p>
            <div className="flex space-x-4">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
