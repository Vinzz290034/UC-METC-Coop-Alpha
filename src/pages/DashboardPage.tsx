import React, { useEffect, useState } from 'react';
import {
  Users,
  Box,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../services/api';
import { useAuth } from '../store/authContext';
import { StaffTimeCard } from '../components/StaffTimeCard';
import { StudentDashboard } from './StudentDashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    lockers,
    members,
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

  // Fetch approved members from API
  useEffect(() => {
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
  }, []);

  const completedTransactions = sales.filter(s => s.status === 'completed').length;
  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, s) => {
    const amount = parseFloat(String(s.total_amount || s.totalAmount || 0));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0) + lockerRentals.reduce((sum, r) => sum + (r.rentalFee || 0), 0);

  // Get recent completed/paid orders sorted by date (most recent first)
  const recentCompletedOrders = sales
    .filter(s => s.status === 'completed')
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
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
      value: completedTransactions,
      icon: <CheckCircle2 className="text-white" />,
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      glow: 'shadow-lg shadow-purple-500/30',
    },
    {
      title: 'Total Revenue',
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
    <div className="min-h-screen p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-black mb-2">Dashboard</h1>
          <p className="text-slate-700 text-lg font-medium">
            Welcome back! Here's an overview of your system.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`${stat.bg} ${stat.glow} rounded-xl p-6 border border-white/40 backdrop-blur-sm hover:shadow-xl hover:border-white/60 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm font-semibold text-white/90">
                  {stat.title}
                </div>
                <div className="p-3 bg-white/20 rounded-lg">{stat.icon}</div>
              </div>
              <div className="text-3xl font-bold text-white">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Staff Time Card for Staff Members */}
        {user && user.role === 'staff' && (
          <div className="mb-8 animate-fade-in-long" style={{ animationDelay: '0.7s' }}>
            <StaffTimeCard />
          </div>
        )}

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
                        <span>{new Date(sale.created_at || sale.createdAt).toLocaleDateString()}</span>
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
            {products.filter((p) => p.stock <= 5).length > 0 ? (
              <div className="space-y-3">
                {products
                  .filter((p) => p.stock <= 5)
                  .slice(0, 5)
                  .map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors"
                    >
                      <span className="text-sm text-slate-600">
                        {product.name}
                      </span>
                      <span className="text-sm font-semibold text-orange-600">
                        {product.stock} units
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">All items well stocked</p>
            )}
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
