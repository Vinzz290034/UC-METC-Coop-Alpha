import React, { useEffect, useState } from 'react';
import {
  Users,
  Box,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/uiStore';
import { apiClient } from '../services/api';
import { useAuth } from '../store/authContext';
import { StudentDashboard } from './StudentDashboard';
import { NotificationBell } from '../components/NotificationBell';


export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { setSidebarOpen } = useUIStore();
  const {
    lockers,
    products,
    lockerRentals,
    keyDuplications,
  } = useAppStore();

  // Fetch data directly from database
  const [sales, setSales] = useState<any[]>([]);
  const [approvedMembers, setApprovedMembers] = useState<any[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch orders directly from API on mount and set up polling
  useEffect(() => {
    // Don't fetch if user is not authenticated
    if (!user?.id) return;

    const fetchOrders = async () => {
      try {
        // Use getAllTransactions which checks user role on backend
        const orders = await apiClient.getAllTransactions(user?.id || '');
        
        if (Array.isArray(orders)) {
          setSales(orders);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
      }
    };

    fetchOrders();

    // Poll for updates every 5 seconds to reflect real-time changes
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  // Fetch approved members from API (only for admins/staff)
  useEffect(() => {
    // Don't fetch if user is not authenticated or not admin/staff
    if (!user || user.role === 'user') return;

    const fetchMembers = async () => {
      try {
        const response = await apiClient.getUsers() as any;
        const users = Array.isArray(response) ? response : (response.users || response);
        const approved = users.filter((user: any) => user.membership_status === 'approved');
        setApprovedMembers(approved);
      } catch (error) {
        console.error('Failed to load members:', error);
      }
    };

    fetchMembers();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchMembers, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Calculate monthly transactions and revenue (current month only, exclude insurance)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const completedTransactions = sales
    .filter(s => {
      if (s.status !== 'completed' && s.status !== 'released') return false;
      if (s.order_type === 'insurance') return false; // Exclude insurance
      // Use completedAt for completed orders, fallback to createdAt for legacy data
      const saleDate = new Date(s.completedAt || s.completed_at || s.created_at || s.createdAt);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    }).length;
  
  const monthlyRevenue = sales
    .filter(s => {
      if (s.status !== 'completed' && s.status !== 'released') return false;
      if (s.order_type === 'insurance') return false; // Exclude insurance
      // Use completedAt for completed orders, fallback to createdAt for legacy data
      const saleDate = new Date(s.completedAt || s.completed_at || s.created_at || s.createdAt);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    })
    .reduce((sum, s) => {
      const amount = parseFloat(String(s.total_amount || s.totalAmount || 0));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  
  const totalRevenue = monthlyRevenue;

  // Get recent completed/paid orders sorted by date (most recent first, exclude insurance)
  const recentCompletedOrders = sales
    .filter(s => (s.status === 'completed' || s.status === 'released') && s.order_type !== 'insurance')
    .sort((a, b) => {
      // Use completedAt for completed orders, fallback to createdAt for legacy data
      const dateA = new Date(a.completedAt || a.completed_at || a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.completedAt || b.completed_at || b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA; // Most recent first
    })
    .slice(0, 5);

  const stats = [
    {
      title: 'Total Members',
      value: approvedMembers.length,
      icon: <Users className="text-white" />,
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      glow: 'shadow-lg shadow-purple-500/30',
    },
    {
      title: 'Available Lockers',
      value: lockers.filter((l) => l.status === 'available').length,
      icon: <Box className="text-white" />,
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      glow: 'shadow-lg shadow-green-500/30',
    },
    {
      title: 'Total Transactions',
      subtitle: 'for this month',
      value: completedTransactions,
      icon: <CheckCircle2 className="text-white" />,
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      glow: 'shadow-lg shadow-purple-500/30',
    },
    {
      title: 'Total Revenue',
      subtitle: 'for this month',
      value: `₱${totalRevenue.toLocaleString()}`,
      icon: <DollarSign className="text-white" />,
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      glow: 'shadow-lg shadow-green-500/30',
    },
  ];

  const expiredRentals = lockerRentals.filter(
    (r) => r.status === 'expired'
  ).length;

  const pendingApprovals = keyDuplications.filter(
    (k) => k.approvalStatus === 'pending'
  ).length;

  // Show StudentDashboard for users with 'user' role
  if (user?.role === 'user') {
    return <StudentDashboard />;
  }



  return (
    <div className="min-h-screen animate-slide-in-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header with Notification Bell */}
        <div className="mb-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between">
            <h1 className="text-4xl font-bold text-black">DASHBOARD</h1>
            <NotificationBell />
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-purple-100 rounded-xl shadow-sm hover:bg-purple-50 hover:shadow-md transition-all duration-200 active:scale-95"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-black tracking-wide">DASHBOARD</h1>
            </div>
            <div className="flex justify-end">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`${stat.bg} ${stat.glow} rounded-xl p-6 border border-white/40 backdrop-blur-sm hover:shadow-xl hover:border-white/60 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-white/90">
                    {stat.title}
                  </div>
                  {stat.subtitle && (
                    <div className="text-xs text-white/70 mt-1">
                      {stat.subtitle}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white/20 rounded-lg">{stat.icon}</div>
              </div>
              <div className="text-3xl font-bold text-white">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Alerts & Notices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Expired Rentals Alert */}
          {expiredRentals > 0 && (
            <div className="bg-gradient-to-br from-red-500/30 to-red-600/20 border-l-4 border-red-400 rounded-lg p-6 backdrop-blur-sm border border-red-400/30">
              <div className="flex items-start space-x-4">
                <AlertCircle className="text-red-400 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-red-300 mb-1">
                    Expired Locker Rentals
                  </h3>
                  <p className="text-red-200 text-sm">
                    {expiredRentals} rental(s) have expired and need renewal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Approvals Alert */}
          {pendingApprovals > 0 && (
            <div className="bg-gradient-to-br from-yellow-500/30 to-amber-600/20 border-l-4 border-yellow-400 rounded-lg p-6 backdrop-blur-sm border border-yellow-400/30">
              <div className="flex items-start space-x-4">
                <AlertCircle className="text-yellow-400 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-yellow-300 mb-1">
                    Pending Key Duplications
                  </h3>
                  <p className="text-yellow-200 text-sm">
                    {pendingApprovals} key duplication request(s) awaiting
                    approval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sales */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 border border-white/50 shadow-lg hover:shadow-xl hover:border-green-400/30 transition-all duration-300 animate-fade-in-long" style={{ animationDelay: '1.1s' }}>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
              Recent Sales
            </h3>
            {recentCompletedOrders.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentCompletedOrders.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 hover:bg-white/50 rounded-lg transition-colors border border-slate-100 hover:border-green-300"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 font-semibold">
                        {sale.first_name} {sale.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{sale.receipt_no || sale.receiptNo}</span>
                        <span>•</span>
                        <span>{new Date(sale.completedAt || sale.completed_at || sale.created_at || sale.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="font-bold text-green-600 ml-2 whitespace-nowrap">
                      ₱{parseFloat(String(sale.total_amount || sale.totalAmount || 0)).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No paid sales yet</p>
            )}
          </div>

          {/* Low Stock Items */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 border border-white/50 shadow-lg hover:shadow-xl hover:border-yellow-400/30 transition-all duration-300 animate-fade-in-long" style={{ animationDelay: '1.2s' }}>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
              Low Stock Items
            </h3>
            {(() => {
              const LOW_STOCK_THRESHOLD = 20;
              const lowStockItems = products
                .filter((p) => {
                  const isServiceItem = p.madeToOrder === true || ['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(p.name);
                  if (isServiceItem) return false;
                  
                  if (p.variants && Object.keys(p.variants).length > 0) {
                    return Object.values(p.variants).some((v: any) => (v.stock || 0) <= LOW_STOCK_THRESHOLD);
                  }
                  
                  return p.stock <= LOW_STOCK_THRESHOLD;
                })
                .map((p) => {
                  let displayStock = p.stock;
                  
                  if (p.variants && Object.keys(p.variants).length > 0) {
                    const variantStocks = Object.values(p.variants).map((v: any) => v.stock || 0);
                    displayStock = Math.min(...variantStocks);
                  }
                  
                  return { ...p, displayStock };
                })
                .sort((a, b) => a.displayStock - b.displayStock)
                .slice(0, 5);
              
              return lowStockItems.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {lowStockItems.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 hover:border-orange-300"
                    >
                      <span className="text-sm text-slate-700 font-medium">
                        {product.name}
                      </span>
                      <span className={`text-sm font-semibold ${
                        product.displayStock === 0 ? 'text-red-600' : 
                        product.displayStock <= 5 ? 'text-red-500' :
                        'text-orange-600'
                      }`}>
                        {product.displayStock} units
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">All items well stocked</p>
              );
            })()}
          </div>

          {/* System Stats */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-6 border border-white/50 shadow-lg hover:shadow-xl hover:border-purple-400/30 transition-all duration-300">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent mb-4">
              System Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Products</span>
                <span className="font-semibold text-slate-900">
                  {products.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Lockers</span>
                <span className="font-semibold text-slate-900">
                  {lockers.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">
                  Maintenance Needed
                </span>
                <span className="font-semibold text-orange-600">
                  {lockers.filter((l) => l.status === 'under_maintenance')
                    .length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
