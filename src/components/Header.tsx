import React from 'react';
import { useUIStore } from '../store/uiStore';
import coopLogo from '../assets/Coop.jpeg';
import { Bell, Search } from 'lucide-react';

export const Header: React.FC = () => {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src={coopLogo}
            alt="UC METC Logo" 
            className="w-10 h-10 rounded-full"
          />
          <h2 className="text-xl font-semibold text-slate-900">
            Seaman Cooperative Services
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-4 py-2">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent ml-2 text-sm text-slate-900 placeholder-slate-500 focus:outline-none w-40"
            />
          </div>

          {/* Notification bell */}
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-shadow">
            U
          </div>
        </div>
      </div>
    </header>
  );
};
