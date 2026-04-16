import React, { useState, useEffect } from 'react';
import { Download, Filter, BarChart3 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../services/api';
import { useAuth } from '../store/authContext';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    lockerRentals,
    lockers,
    keyDuplications,
    products,
  } = useAppStore();

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
        let orders: any[] = [];
        orders = await apiClient.getAllTransactions(user?.id || '');
        
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

  const [reportType, setReportType] = useState<
    'sales' | 'inventory' | 'lockers' | 'keys' | 'income'
  >('sales');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const generateSalesReport = () => {
    try {
      const completedSales = sales.filter(s => s && s.status === 'completed');
      const totalSales = completedSales.length;
      const totalRevenue = completedSales.length > 0 ? completedSales.reduce((sum, s) => {
        const amount = parseFloat(String(s?.total_amount || s?.totalAmount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0) : 0;
      const avgTransaction = totalSales > 0 ? totalRevenue / totalSales : 0;

      return {
        title: 'Sales Report',
        data: [
          { label: 'Total Transactions', value: String(totalSales) },
          { label: 'Total Revenue', value: `₱${String(Number(totalRevenue || 0).toFixed(2))}` },
          {
            label: 'Average Transaction',
            value: `₱${String(Number(avgTransaction || 0).toFixed(2))}`,
          },
          {
            label: 'Cash Payments',
            value: String(completedSales.filter((s) => (s?.payment_method || s?.paymentMethod) === 'cash').length),
          },
          {
            label: 'E-Wallet Payments',
            value: String(completedSales.filter((s) => (s?.payment_method || s?.paymentMethod) === 'ewallet').length),
          },
        ],
      };
    } catch (error) {
      console.error('Sales Report Error:', error);
      return { title: 'Sales Report', data: [] };
    }
  };

  const generateInventoryReport = () => {
    try {
      const totalItems = products.reduce((sum, p) => sum + (p?.stock || 0), 0);
      const lowStockItems = products.filter((p) => (p?.stock || 0) <= 5).length;
      const outOfStock = products.filter((p) => (p?.stock || 0) === 0).length;
      const inventoryValue = products.reduce((sum, p) => sum + ((p?.price || 0) * (p?.stock || 0)), 0);

      return {
        title: 'Inventory Report',
        data: [
          { label: 'Total Products', value: String(products.length) },
          { label: 'Total Units in Stock', value: String(totalItems) },
          { label: 'Low Stock Items (≤5)', value: String(lowStockItems) },
          { label: 'Out of Stock Items', value: String(outOfStock) },
          {
            label: 'Inventory Value',
            value: `₱${String(Number(inventoryValue || 0).toFixed(2))}`,
          },
        ],
      };
    } catch (error) {
      console.error('Inventory Report Error:', error);
      return { title: 'Inventory Report', data: [] };
    }
  };

  const generateLockerReport = () => {
    try {
      const available = lockers.filter((l) => l?.status === 'available').length;
      const occupied = lockers.filter((l) => l?.status === 'occupied').length;
      const maintenance = lockers.filter((l) => l?.status === 'under_maintenance').length;
      const occupancyRate = lockers.length > 0 ? String(((occupied / lockers.length) * 100).toFixed(1)) : '0';

      return {
        title: 'Locker Occupancy Report',
        data: [
          { label: 'Total Lockers', value: String(lockers.length) },
          { label: 'Available Lockers', value: String(available) },
          { label: 'Occupied Lockers', value: String(occupied) },
          { label: 'Under Maintenance', value: String(maintenance) },
          { label: 'Occupancy Rate', value: `${occupancyRate}%` },
          {
            label: 'Active Rentals',
            value: String(lockerRentals.filter((r) => r?.status === 'active').length),
          },
          {
            label: 'Expired Rentals',
            value: String(lockerRentals.filter((r) => r?.status === 'expired').length),
          },
        ],
      };
    } catch (error) {
      console.error('Locker Report Error:', error);
      return { title: 'Locker Occupancy Report', data: [] };
    }
  };

  const generateKeyReport = () => {
    try {
      const totalRequests = keyDuplications.length;
      const pending = keyDuplications.filter((k) => k?.approvalStatus === 'pending').length;
      const approved = keyDuplications.filter((k) => k?.approvalStatus === 'approved').length;
      const released = keyDuplications.filter((k) => k?.releaseStatus === 'released').length;
      const totalRevenue = keyDuplications.reduce((sum, k) => sum + (k?.fee || 0), 0);
      const avgFee = totalRequests > 0 ? totalRevenue / totalRequests : 0;

      return {
        title: 'Key Duplication Report',
        data: [
          { label: 'Total Requests', value: String(totalRequests) },
          { label: 'Pending Approval', value: String(pending) },
          { label: 'Approved', value: String(approved) },
          { label: 'Released Keys', value: String(released) },
          { label: 'Total Revenue', value: `₱${String(Number(totalRevenue || 0).toFixed(2))}` },
          {
            label: 'Average Fee',
            value: totalRequests > 0 ? `₱${String(Number(avgFee || 0).toFixed(2))}` : '₱0',
          },
        ],
      };
    } catch (error) {
      console.error('Key Report Error:', error);
      return { title: 'Key Duplication Report', data: [] };
    }
  };

  const generateIncomeReport = () => {
    try {
      const salesIncome = sales.reduce((sum, s) => {
        const amount = parseFloat(String(s?.total_amount || s?.totalAmount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      const rentalIncome = lockerRentals.reduce((sum, r) => sum + (r?.rentalFee || 0), 0);
      const keyIncome = keyDuplications.reduce((sum, k) => sum + (k?.fee || 0), 0);
      const totalIncome = salesIncome + rentalIncome + keyIncome;
      const saleSalesPercent = totalIncome > 0 ? String(((salesIncome / totalIncome) * 100).toFixed(1)) : '0';
      const rentalPercent = totalIncome > 0 ? String(((rentalIncome / totalIncome) * 100).toFixed(1)) : '0';
      const keyPercent = totalIncome > 0 ? String(((keyIncome / totalIncome) * 100).toFixed(1)) : '0';

      return {
        title: 'Income Breakdown Report',
        data: [
          { label: 'Total Income', value: `₱${String(Number(totalIncome || 0).toFixed(2))}` },
          {
            label: 'Uniform Sales',
            value: `₱${String(Number(salesIncome || 0).toFixed(2))} (${saleSalesPercent}%)`,
          },
          {
            label: 'Locker Services',
            value: `₱${String(Number(rentalIncome || 0).toFixed(2))} (${rentalPercent}%)`,
          },
          {
            label: 'Key Services',
            value: `₱${String(Number(keyIncome || 0).toFixed(2))} (${keyPercent}%)`,
          },
        ],
      };
    } catch (error) {
      console.error('Income Report Error:', error);
      return { title: 'Income Breakdown Report', data: [] };
    }
  };

  const getReport = () => {
    switch (reportType) {
      case 'sales':
        return generateSalesReport();
      case 'inventory':
        return generateInventoryReport();
      case 'lockers':
        return generateLockerReport();
      case 'keys':
        return generateKeyReport();
      case 'income':
        return generateIncomeReport();
      default:
        return { title: '', data: [] };
    }
  };

  const report = getReport();

  // Add guard to prevent rendering errors before data loads
  if (!report || !report.data) {
    return (
      <div className="min-h-screen p-6 animate-slide-in-right">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Reports & Analytics</h1>
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-600 mt-2">Comprehensive system reports and insights</p>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            { id: 'sales', label: 'Sales' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'lockers', label: 'Locker Occupancy' },
            { id: 'keys', label: 'Key Duplication' },
            { id: 'income', label: 'Income Breakdown' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() =>
                setReportType(
                  option.id as
                    | 'sales'
                    | 'inventory'
                    | 'lockers'
                    | 'keys'
                    | 'income'
                )
              }
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                reportType === option.id
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                  : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8 shadow-sm">
          <div className="flex items-center space-x-4">
            <Filter size={20} className="text-slate-600" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
              className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="From"
            />
            <span className="text-slate-600">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
              className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="To"
            />
            <button className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all ml-auto">
              <Download size={18} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold text-slate-900">{report.title}</h2>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {report.data.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-lg p-6"
                >
                  <p className="text-slate-600 text-sm font-semibold mb-2">
                    {item.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Detailed Table */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Detailed Records</h3>

              {reportType === 'sales' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-300">
                        <th className="text-left py-2 px-4 font-semibold">
                          Receipt
                        </th>
                        <th className="text-left py-2 px-4 font-semibold">
                          Amount
                        </th>
                        <th className="text-left py-2 px-4 font-semibold">
                          Payment
                        </th>
                        <th className="text-left py-2 px-4 font-semibold">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <tr
                          key={sale?.id || Math.random()}
                          className="border-b border-slate-200 hover:bg-slate-50"
                        >
                          <td className="py-2 px-4 font-mono">{sale?.receipt_no || sale?.receiptNo || 'N/A'}</td>
                          <td className="py-2 px-4">
                            ₱{String(Number(sale?.total_amount || sale?.totalAmount || 0).toFixed(2))}
                          </td>
                          <td className="py-2 px-4">
                            {(sale?.payment_method || sale?.paymentMethod || 'UNKNOWN').toUpperCase()}
                          </td>
                          <td className="py-2 px-4">
                            {sale?.created_at || sale?.createdAt ? new Date(sale?.created_at || sale?.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {reportType === 'inventory' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-300">
                        <th className="text-left py-2 px-4 font-semibold">
                          Product
                        </th>
                        <th className="text-left py-2 px-4 font-semibold">
                          SKU
                        </th>
                        <th className="text-left py-2 px-4 font-semibold">
                          Stock
                        </th>
                        <th className="text-left py-2 px-4 font-semibold">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b border-slate-200 hover:bg-slate-50"
                        >
                          <td className="py-2 px-4 font-medium">
                            {product.name}
                          </td>
                          <td className="py-2 px-4 font-mono">{product.sku}</td>
                          <td className="py-2 px-4">{product.stock}</td>
                          <td className="py-2 px-4">
                            ₱{(product.stock * product.price).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
