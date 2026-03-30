import React, { useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Box,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../store/authContext';
import { StaffTimeCard } from '../components/StaffTimeCard';
import { StudentDashboard } from './StudentDashboard';

export const DashboardPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const { user } = useAuth();
  
  // Show StudentDashboard for users with 'user' role
  if (user?.role === 'user') {
    return <StudentDashboard />;
  }

  const {
    lockers,
    members,
    products,
    lockerRentals,
    sales,
    keyDuplications,
  } = useAppStore();

  const stats = [
    {
      title: 'Total Members',
      value: members.length,
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
      title: 'Active Rentals',
      value: lockerRentals.filter((r) => r.status === 'active').length,
      icon: <CheckCircle2 className="text-white" />,
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      glow: 'shadow-lg shadow-purple-500/30',
    },
    {
      title: 'Total Revenue',
      value: `₱${(sales.reduce((sum, s) => sum + s.totalAmount, 0) + lockerRentals.reduce((sum, r) => sum + r.rentalFee, 0)).toLocaleString()}`,
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

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">Dashboard</h1>
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
            <StaffTimeCard />"
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
            {sales.slice(-5).length > 0 ? (
              <div className="space-y-3">
                {sales.slice(-5).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-2 hover:bg-white/50 rounded transition-colors"
                  >
                    <span className="text-sm text-slate-600">
                      Receipt: {sale.receiptNo}
                    </span>
                    <span className="font-semibold text-slate-900">
                      ₱{sale.totalAmount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No sales yet</p>
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
