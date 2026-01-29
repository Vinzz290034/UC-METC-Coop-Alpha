import React from 'react';
import {
  TrendingUp,
  Users,
  Box,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const DashboardPage: React.FC = () => {
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
      icon: <Users className="text-blue-500" />,
      bg: 'bg-blue-50',
    },
    {
      title: 'Available Lockers',
      value: lockers.filter((l) => l.status === 'available').length,
      icon: <Box className="text-green-500" />,
      bg: 'bg-green-50',
    },
    {
      title: 'Active Rentals',
      value: lockerRentals.filter((r) => r.status === 'active').length,
      icon: <CheckCircle2 className="text-cyan-500" />,
      bg: 'bg-cyan-50',
    },
    {
      title: 'Total Revenue',
      value: `₱${(sales.reduce((sum, s) => sum + s.totalAmount, 0) + lockerRentals.reduce((sum, r) => sum + r.rentalFee, 0)).toLocaleString()}`,
      icon: <DollarSign className="text-yellow-500" />,
      bg: 'bg-yellow-50',
    },
  ];

  const expiredRentals = lockerRentals.filter(
    (r) => r.status === 'expired'
  ).length;

  const pendingApprovals = keyDuplications.filter(
    (k) => k.approvalStatus === 'pending'
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">
            Welcome back! Here's an overview of your system.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`${stat.bg} rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm font-medium text-slate-600">
                  {stat.title}
                </div>
                <div className="p-2 bg-white rounded-lg">{stat.icon}</div>
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Alerts & Notices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Expired Rentals Alert */}
          {expiredRentals > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="text-red-500 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    Expired Locker Rentals
                  </h3>
                  <p className="text-red-700 text-sm">
                    {expiredRentals} rental(s) have expired and need renewal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Approvals Alert */}
          {pendingApprovals > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="text-yellow-600 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Pending Key Duplications
                  </h3>
                  <p className="text-yellow-700 text-sm">
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
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Recent Sales
            </h3>
            {sales.slice(-5).length > 0 ? (
              <div className="space-y-3">
                {sales.slice(-5).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors"
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
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
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
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
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
