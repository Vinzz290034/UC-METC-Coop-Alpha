import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  Box,
  Key,
  Users,
  DollarSign,
  BarChart3,
  Package,
  LogOut,
  Clock,
  User,
} from 'lucide-react';
// @ts-ignore
import coopLogo from '../assets/Coop.jpeg';
import { useUIStore } from '../store/uiStore';
import { useAuth } from '../store/authContext';

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
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen, setCurrentPage, showNotification } = useUIStore();
  const { user, logout } = useAuth();

  const sidebarItems: SidebarItem[] = [
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
      id: 'dashboard',
    },
    {
      icon: <Box size={20} />,
      label: 'Locker Management',
      id: 'lockers',
      roles: ['admin', 'staff'],
    },
    {
      icon: <Package size={20} />,
      label: 'Sales & Inventory',
      id: 'sales',
      roles: ['admin', 'staff'],
    },
    {
      icon: <Key size={20} />,
      label: 'Key Duplication',
      id: 'keys',
      roles: ['admin', 'staff'],
    },
    {
      icon: <Users size={20} />,
      label: 'Members',
      id: 'members',
      roles: ['admin', 'staff'],
    },
    {
      icon: <DollarSign size={20} />,
      label: 'Billing & Payments',
      id: 'billing',
      roles: ['admin', 'staff'],
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Reports',
      id: 'reports',
      roles: ['admin', 'staff'],
    },
    {
      icon: <Clock size={20} />,
      label: 'DTR Management',
      id: 'dtr',
      roles: ['admin'],
    },
  ];

  const filteredItems = sidebarItems.filter(
    (item) => !item.roles || !user || item.roles.includes(user.role)
  );

  const handleNavigation = (id: string) => {
    setCurrentPage(id);
    navigate(`/${id}`);
  };

  const handleLogout = () => {
    logout();
    showNotification('Signed out successfully', 'logout');
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-slate-800 text-white rounded-lg"
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
          <div className="p-6 border-b border-purple-600/50 flex items-center space-x-3 bg-gradient-to-r from-purple-800/50 to-purple-700/50">
            <img 
              src={coopLogo}
              alt="UC METC Logo" 
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                UC METC
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">SILMS</p>
            </div>
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
                  <p className="text-sm font-semibold text-white truncate">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-purple-200 truncate">
                    {user.role === 'user' && user.course && user.year 
                      ? `${user.course}, ${user.year}` 
                      : user.role === 'user' 
                        ? 'Student' 
                        : user.role.replace('_', ' ')}
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
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-green-400/10 hover:border-l-4 hover:border-green-400 transition-all duration-200 group nav-item-entrance"
                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
              >
                <span className="group-hover:text-green-400 transition-colors">
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
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
    </>
  );
};
