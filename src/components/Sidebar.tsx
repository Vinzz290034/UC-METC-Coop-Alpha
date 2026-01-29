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
} from 'lucide-react';
import coopLogo from '../assets/Coop.jpeg';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  id: string;
  roles?: string[];
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen, setCurrentPage } = useUIStore();
  const { user, logout } = useAuthStore();

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
    navigate('/login');
  };

  return (
    <>
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
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white transition-all duration-300 z-40 w-64 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:relative lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-slate-700 flex items-center space-x-3">
            <img 
              src={coopLogo}
              alt="UC METC Logo" 
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                UC METC
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">SLIMS</p>
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="p-4 border-b border-slate-700 bg-slate-700/50">
              <p className="text-sm font-semibold text-slate-200">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          )}

          {/* Navigation items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-200 hover:bg-slate-700 transition-colors duration-200 group"
              >
                <span className="group-hover:text-blue-400 transition-colors">
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors duration-200"
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
