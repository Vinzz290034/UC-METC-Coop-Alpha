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
  Truck,
  MessageSquare,
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

  @keyframes emerald-glow-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .nav-active-animated {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 50%, #22c55e 100%);
    background-size: 200% 200%;
    animation: emerald-glow-flow 4s ease infinite;
    box-shadow: 0 4px 18px rgba(22, 163, 74, 0.45);
    border: 1px solid rgba(74, 222, 128, 0.3);
  }

  .nav-hover-animated {
    position: relative;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-hover-animated:hover {
    background: linear-gradient(90deg, rgba(22, 163, 74, 0.25) 0%, rgba(34, 197, 94, 0.15) 100%);
    border-color: rgba(34, 197, 94, 0.5);
    box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);
    transform: translateX(4px);
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
      icon: <MessageSquare size={20} />,
      label: 'Feedback',
      id: 'feedback',
      roles: ['admin', 'user'],
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
      icon: <Truck size={20} />,
      label: 'Suppliers',
      id: 'suppliers',
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
      label: 'Content Management',
      id: 'announcements-management',
      roles: ['admin'],
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
    setSidebarOpen(false);
    navigate(`/${id}`);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    showNotification('Signed out successfully', 'logout');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <style>{sidebarStyles}</style>

      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#3b1d6e] text-white transition-all duration-300 z-40 w-64 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:relative lg:translate-x-0 border-r border-purple-600/40 shadow-xl`}
      >
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="px-5 py-6 border-b border-purple-600/40 flex items-center justify-between bg-[#3b1d6e]">
            <div className="flex items-center space-x-3.5 cursor-pointer group" onClick={() => navigate('/dashboard')}>
              <img 
                src={COOP_LOGO_URL}
                alt="UC METC Logo" 
                className="w-12 h-12 rounded-full border-2 border-emerald-500/80 shadow-md group-hover:scale-105 transition-transform duration-300"
              />
              <div className="flex flex-col justify-center">
                <h1 className="text-lg font-black leading-tight text-emerald-400 tracking-wide group-hover:text-emerald-300 transition-colors">
                  UC METC
                </h1>
                <span className="text-xs text-purple-200 font-extrabold leading-none tracking-widest mt-1">SILMS</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-full hover:bg-purple-800/60 active:scale-95 transition-all text-purple-100 flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Profile Info */}
          {user && (
            <button
              onClick={() => navigate('/account-settings')}
              className="w-full p-4 border-b border-purple-600/40 bg-[#3b1d6e] hover:bg-purple-800/50 transition-all duration-300 text-left group"
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-white border-2 border-[#16a34a] group-hover:border-emerald-400 transition-colors duration-300 flex items-center justify-center shadow-sm">
                    <User size={26} className="text-[#16a34a] group-hover:text-emerald-600 transition-colors duration-300" />
                  </div>
                </div>
                {/* User details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors duration-300">{formatFullName(user.first_name, user.last_name)}</p>
                  <p className="text-xs text-emerald-300 truncate font-semibold group-hover:text-emerald-200 transition-colors duration-300">
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
          <nav className="flex-1 p-3.5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-1.5">
              {filteredItems.map((item, idx) => {
                const isActive = location.pathname === `/${item.id}` || (location.pathname === '/' && item.id === 'dashboard');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`group relative w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer text-sm font-semibold border border-transparent ${
                      isActive
                        ? 'nav-active-animated text-white'
                        : 'nav-hover-animated text-purple-100 hover:text-white'
                    }`}
                    style={{ animationDelay: `${0.05 + idx * 0.03}s` }}
                  >
                    <span className={`transition-all duration-300 ${
                      isActive 
                        ? 'text-white scale-110' 
                        : 'text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 group-hover:rotate-6'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="relative z-10 transition-colors duration-200">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_#ffffff]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom-anchored Settings Navigation Item */}
            <div className="pt-2">
              <button
                onClick={() => handleNavigation('settings')}
                className={`group relative w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer text-sm font-semibold border border-transparent ${
                  location.pathname === '/settings'
                    ? 'nav-active-animated text-white'
                    : 'nav-hover-animated text-purple-100 hover:text-white'
                }`}
              >
                <span className={`transition-all duration-300 ${
                  location.pathname === '/settings'
                    ? 'text-white scale-110' 
                    : 'text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 group-hover:rotate-6'
                }`}>
                  <Settings size={20} />
                </span>
                <span className="relative z-10 transition-colors duration-200">Settings</span>
                {location.pathname === '/settings' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_#ffffff]" />
                )}
              </button>
            </div>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-purple-600/40">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all duration-300 border border-red-500/30 hover:scale-[1.02] cursor-pointer font-semibold"
            >
              <LogOut size={18} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10001] backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm mx-4 animate-scale-in">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Logout</h2>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
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
