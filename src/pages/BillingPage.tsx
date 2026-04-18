import React, { useEffect, useState } from 'react';
import { CreditCard, Download, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../services/api';
import { useAuth } from '../store/authContext';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const { lockerRentals } = useAppStore();

  // Fetch data directly from database
  const [sales, setSales] = useState<any[]>([]);

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

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  const calculateTotalRevenue = () => {
    const salesTotal = sales
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => {
        const amount = parseFloat(String(s.total_amount || s.totalAmount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    const rentalTotal = lockerRentals.reduce((sum, r) => sum + (r.rentalFee || 0), 0);
    return salesTotal + rentalTotal;
  };

  // Get recent completed/paid orders sorted by date (most recent first)
  const recentCompletedOrders = sales
    .filter(s => s.status === 'completed')
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA; // Most recent first
    })
    .slice(0, 10);

  const revenueBreakdown = [
    {
      name: 'Sales',
      amount: sales
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => {
          const amount = parseFloat(String(s.total_amount || s.totalAmount || 0));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0),
      color: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      name: 'Locker Rentals',
      amount: lockerRentals.reduce((sum, r) => sum + (r.rentalFee || 0), 0),
      color: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  return (
    <div className="min-h-screen p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Billing & Payments</h1>
          <p className="text-slate-600 mt-2">Financial overview and transaction history</p>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-8 text-white mb-8 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-100 mb-2">Total Revenue</p>
              <h2 className="text-4xl font-bold mb-4">
                ₱{calculateTotalRevenue().toLocaleString()}
              </h2>
              <p className="text-purple-100 text-sm">
                From {sales.filter(s => s.status === 'completed').length} completed sales, {lockerRentals.length} rentals
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp size={32} />
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {revenueBreakdown.map((item, idx) => (
            <div
              key={idx}
              className={`${item.color} border ${item.borderColor} rounded-xl p-6`}
            >
              <p className="text-slate-600 font-semibold text-sm mb-4">{item.name}</p>
              <p className="text-2xl font-bold text-slate-900">
                ₱{item.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <CreditCard size={20} />
              <span>Recent Sales</span>
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentCompletedOrders.length > 0 ? (
                recentCompletedOrders.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 hover:border-blue-300"
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
                ))
              ) : (
                <p className="text-sm text-slate-500">No paid sales yet</p>
              )}
            </div>
          </div>

          {/* Locker Rental Revenue */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <CreditCard size={20} />
              <span>Active Locker Rentals</span>
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {lockerRentals
                .filter((r) => r.status === 'active')
                .slice(-10)
                .map((rental) => (
                  <div
                    key={rental.id}
                    className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        Locker {rental.lockerId}
                      </p>
                      <p className="text-xs text-slate-500">
                        Expires: {rental.expiryDate}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900">
                      ₱{rental.rentalFee.toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="mt-8 flex justify-end">
          <button className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all">
            <Download size={20} />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
