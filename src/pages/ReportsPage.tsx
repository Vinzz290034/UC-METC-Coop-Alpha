import React, { useState, useEffect } from 'react';
import { Download, Filter, BarChart3 } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export const ReportsPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const {
    sales,
    lockerRentals,
    lockers,
    keyDuplications,
    products,
    members,
  } = useAppStore();

  const [reportType, setReportType] = useState<
    'sales' | 'inventory' | 'lockers' | 'keys' | 'income'
  >('sales');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const generateSalesReport = () => {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const avgTransaction = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      title: 'Sales Report',
      data: [
        { label: 'Total Transactions', value: totalSales },
        { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString()}` },
        {
          label: 'Average Transaction',
          value: `₱${avgTransaction.toLocaleString()}`,
        },
        {
          label: 'Cash Payments',
          value: sales.filter((s) => s.paymentMethod === 'cash').length,
        },
        {
          label: 'E-Wallet Payments',
          value: sales.filter((s) => s.paymentMethod === 'ewallet').length,
        },
      ],
    };
  };

  const generateInventoryReport = () => {
    const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockItems = products.filter((p) => p.stock <= 5).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;

    return {
      title: 'Inventory Report',
      data: [
        { label: 'Total Products', value: products.length },
        { label: 'Total Units in Stock', value: totalItems },
        { label: 'Low Stock Items (≤5)', value: lowStockItems },
        { label: 'Out of Stock Items', value: outOfStock },
        {
          label: 'Inventory Value',
          value: `₱${products.reduce((sum, p) => sum + p.price * p.stock, 0).toLocaleString()}`,
        },
      ],
    };
  };

  const generateLockerReport = () => {
    const available = lockers.filter((l) => l.status === 'available').length;
    const occupied = lockers.filter((l) => l.status === 'occupied').length;
    const maintenance = lockers.filter((l) => l.status === 'under_maintenance')
      .length;
    const occupancyRate =
      lockers.length > 0 ? ((occupied / lockers.length) * 100).toFixed(1) : 0;

    return {
      title: 'Locker Occupancy Report',
      data: [
        { label: 'Total Lockers', value: lockers.length },
        { label: 'Available Lockers', value: available },
        { label: 'Occupied Lockers', value: occupied },
        { label: 'Under Maintenance', value: maintenance },
        { label: 'Occupancy Rate', value: `${occupancyRate}%` },
        {
          label: 'Active Rentals',
          value: lockerRentals.filter((r) => r.status === 'active').length,
        },
        {
          label: 'Expired Rentals',
          value: lockerRentals.filter((r) => r.status === 'expired').length,
        },
      ],
    };
  };

  const generateKeyReport = () => {
    const totalRequests = keyDuplications.length;
    const pending = keyDuplications.filter(
      (k) => k.approvalStatus === 'pending'
    ).length;
    const approved = keyDuplications.filter(
      (k) => k.approvalStatus === 'approved'
    ).length;
    const totalRevenue = keyDuplications.reduce((sum, k) => sum + k.fee, 0);

    return {
      title: 'Key Duplication Report',
      data: [
        { label: 'Total Requests', value: totalRequests },
        { label: 'Pending Approval', value: pending },
        { label: 'Approved', value: approved },
        {
          label: 'Released Keys',
          value: keyDuplications.filter((k) => k.releaseStatus === 'released')
            .length,
        },
        { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString()}` },
        {
          label: 'Average Fee',
          value: totalRequests > 0 ? `₱${(totalRevenue / totalRequests).toLocaleString()}` : '₱0',
        },
      ],
    };
  };

  const generateIncomeReport = () => {
    const salesIncome = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const rentalIncome = lockerRentals.reduce((sum, r) => sum + r.rentalFee, 0);
    const keyIncome = keyDuplications.reduce((sum, k) => sum + k.fee, 0);
    const totalIncome = salesIncome + rentalIncome + keyIncome;

    return {
      title: 'Income Breakdown Report',
      data: [
        { label: 'Total Income', value: `₱${totalIncome.toLocaleString()}` },
        {
          label: 'Uniform Sales',
          value: `₱${salesIncome.toLocaleString()} (${totalIncome > 0 ? ((salesIncome / totalIncome) * 100).toFixed(1) : 0}%)`,
        },
        {
          label: 'Locker Services',
          value: `₱${rentalIncome.toLocaleString()} (${totalIncome > 0 ? ((rentalIncome / totalIncome) * 100).toFixed(1) : 0}%)`,
        },
        {
          label: 'Key Services',
          value: `₱${keyIncome.toLocaleString()} (${totalIncome > 0 ? ((keyIncome / totalIncome) * 100).toFixed(1) : 0}%)`,
        },
      ],
    };
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

  return (
    <div className="min-h-screen bg-white p-6">
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
                          key={sale.id}
                          className="border-b border-slate-200 hover:bg-slate-50"
                        >
                          <td className="py-2 px-4 font-mono">{sale.receiptNo}</td>
                          <td className="py-2 px-4">
                            ₱{sale.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-2 px-4">
                            {sale.paymentMethod.toUpperCase()}
                          </td>
                          <td className="py-2 px-4">
                            {new Date(sale.createdAt).toLocaleDateString()}
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
