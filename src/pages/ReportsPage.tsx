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
    products,
  } = useAppStore();

  // Fetch data directly from database
  const [sales, setSales] = useState<any[]>([]);
  
  // State for active tooltip in graph
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch orders directly from API on mount and set up polling
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Use getAllTransactions which checks user role on backend
        const orders = (await apiClient.getAllTransactions(user?.id || '')) as any[];
        
        if (Array.isArray(orders)) {
          setSales(orders);
        }
      } catch (error) {
        // Failed to load orders
      }
    };

    fetchOrders();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  const [reportType, setReportType] = useState<
    'sales' | 'inventory' | 'lockers' | 'income'
  >('sales');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const generateSalesReport = () => {
    try {
      const completedSales = sales.filter(s => s && (s.status === 'completed' || s.status === 'released'));
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
          { label: 'Total Revenue', value: `₱${Number(totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          {
            label: 'Average Transaction',
            value: `₱${Number(avgTransaction || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          {
            label: 'Cash Payments',
            value: String(completedSales.filter((s) => (s?.payment_method || s?.paymentMethod) === 'cash').length),
          },
          {
            label: 'GCash Payments',
            value: String(completedSales.filter((s) => (s?.payment_method || s?.paymentMethod) === 'ewallet').length),
          },
        ],
      };
    } catch (error) {
      return { title: 'Sales Report', data: [] };
    }
  };

  // Calculate monthly sales data for the current year
  const getMonthlySalesData = () => {
    const currentYear = new Date().getFullYear();
    const monthlyData = Array(12).fill(0);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    sales.filter(s => s && (s.status === 'completed' || s.status === 'released')).forEach(sale => {
      const saleDate = new Date(sale.created_at);
      if (saleDate.getFullYear() === currentYear) {
        const month = saleDate.getMonth();
        const amount = parseFloat(String(sale?.total_amount || sale?.totalAmount || 0));
        monthlyData[month] += isNaN(amount) ? 0 : amount;
      }
    });
    
    return monthlyData.map((revenue, index) => ({
      month: monthNames[index],
      revenue: revenue
    }));
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
          { label: 'Total Units in Stock', value: String(totalItems.toLocaleString('en-US')) },
          { label: 'Low Stock Items (≤5)', value: String(lowStockItems) },
          { label: 'Out of Stock Items', value: String(outOfStock) },
          {
            label: 'Inventory Value',
            value: `₱${Number(inventoryValue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
        ],
      };
    } catch (error) {
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
      return { title: 'Locker Occupancy Report', data: [] };
    }
  };

  const generateIncomeReport = () => {
    try {
      const salesIncome = sales
        .filter(s => s && (s.status === 'completed' || s.status === 'released'))
        .reduce((sum, s) => {
          const amount = parseFloat(String(s?.total_amount || s?.totalAmount || 0));
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
      const rentalIncome = lockerRentals.reduce((sum, r) => sum + (r?.rentalFee || 0), 0);
      const totalIncome = salesIncome + rentalIncome;
      const saleSalesPercent = totalIncome > 0 ? String(((salesIncome / totalIncome) * 100).toFixed(1)) : '0';
      const rentalPercent = totalIncome > 0 ? String(((rentalIncome / totalIncome) * 100).toFixed(1)) : '0';

      return {
        title: 'Income Breakdown Report',
        data: [
          { label: 'Total Income', value: `₱${Number(totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          {
            label: 'Product Sales',
            value: `₱${Number(salesIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${saleSalesPercent}%)`,
          },
          {
            label: 'Locker Services',
            value: `₱${Number(rentalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${rentalPercent}%)`,
          },
        ],
      };
    } catch (error) {
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
      <div className="min-h-screen p-4 sm:p-6 animate-slide-in-right">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">Comprehensive system reports and insights</p>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { id: 'sales', label: 'Sales' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'lockers', label: 'Locker Occupancy' },
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
            <button className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all ml-auto"
              onClick={() => {
                // Export current report to Excel
                const reportData = getReport();
                const csvContent = [
                  [reportData.title],
                  [''],
                  ['Metric', 'Value'],
                  ...reportData.data.map(item => [item.label, item.value])
                ].map(row => row.join(',')).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download size={18} />
              <span>Export Excel</span>
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
            {/* Monthly Sales Line Chart - Only show for sales report - MOVED TO TOP */}
            {reportType === 'sales' && (() => {
              const monthlyData = getMonthlySalesData();
              const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);
              const chartHeight = 400;
              const chartWidth = 1000;
              const padding = { top: 40, right: 60, bottom: 60, left: 80 };
              const graphHeight = chartHeight - padding.top - padding.bottom;
              const graphWidth = chartWidth - padding.left - padding.right;
              
              // Calculate points for the line
              const points = monthlyData.map((data, index) => {
                const x = padding.left + (index / (monthlyData.length - 1)) * graphWidth;
                const y = padding.top + graphHeight - (data.revenue / maxRevenue) * graphHeight;
                return { x, y, ...data };
              });
              
              // Create smooth curve path
              const smoothPath = points.map((point, index) => {
                if (index === 0) return `M ${point.x} ${point.y}`;
                const prevPoint = points[index - 1];
                const cpX = (prevPoint.x + point.x) / 2;
                return `Q ${cpX} ${prevPoint.y}, ${point.x} ${point.y}`;
              }).join(' ');
              
              // Create path for the area under the line
              const areaPath = `${smoothPath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;
              
              return (
                <div className="mb-8 animate-fade-in">
                  <div className="bg-gradient-to-br from-green-50 via-white to-purple-50 border-2 border-green-200 rounded-2xl p-8 shadow-xl overflow-x-auto">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">
                          Monthly Sales Trend
                        </h3>
                        <p className="text-slate-600 text-sm mt-1">Year {new Date().getFullYear()} Performance Overview</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                          <span className="text-sm text-slate-600 font-medium">Revenue</span>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-lg border border-purple-200 shadow-sm">
                          <span className="text-xs text-slate-500">Total</span>
                          <p className="text-lg font-bold text-purple-600">
                            ₱{monthlyData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <svg width={chartWidth} height={chartHeight} className="mx-auto" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))' }}>
                      {/* Gradient definitions */}
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#059669" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="50%" stopColor="#059669" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* Grid lines with labels */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padding.top + graphHeight * (1 - ratio);
                        return (
                          <g key={ratio}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={chartWidth - padding.right}
                              y2={y}
                              stroke="#e0e7ff"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={padding.left - 15}
                              y={y + 5}
                              textAnchor="end"
                              className="text-xs fill-slate-500 font-semibold"
                            >
                              ₱{(maxRevenue * ratio).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Grid lines with labels */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padding.top + graphHeight * (1 - ratio);
                        return (
                          <g key={ratio}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={chartWidth - padding.right}
                              y2={y}
                              stroke="#e0e7ff"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={padding.left - 15}
                              y={y + 5}
                              textAnchor="end"
                              className="text-xs fill-slate-500 font-semibold"
                            >
                              ₱{(maxRevenue * ratio).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Area under the line with gradient */}
                      <path
                        d={areaPath}
                        fill="url(#areaGradient)"
                        className="animate-fade-in"
                        style={{ animationDelay: '0.2s' }}
                      />
                      
                      {/* Smooth line with gradient */}
                      <path
                        d={smoothPath}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        className="animate-fade-in"
                        style={{ 
                          animationDelay: '0.3s',
                          strokeDasharray: '2000',
                          strokeDashoffset: '2000',
                          animation: 'drawLine 2s ease-out forwards, fadeIn 0.5s ease-out 0.3s forwards'
                        }}
                      />
                      
                      <style>{`
                        @keyframes drawLine {
                          to {
                            stroke-dashoffset: 0;
                          }
                        }
                        @keyframes fadeIn {
                          from { opacity: 0; }
                          to { opacity: 1; }
                        }
                      `}</style>
                      
                      {/* Data points - circles only */}
                      {points.map((point, index) => (
                        <g key={`point-${index}`} className="cursor-pointer group">
                          {/* Outer glow circle */}
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="12"
                            fill="#8b5cf6"
                            opacity="0"
                            className="group-hover:opacity-20 transition-all duration-300"
                          />
                          {/* Main point */}
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="6"
                            fill="white"
                            stroke="#8b5cf6"
                            strokeWidth="3"
                            className="group-hover:r-8 transition-all duration-300 animate-fade-in"
                            style={{ 
                              animationDelay: `${0.5 + index * 0.05}s`,
                              filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))'
                            }}
                          />
                          {/* Month labels */}
                          <text
                            x={point.x}
                            y={chartHeight - padding.bottom + 25}
                            textAnchor="middle"
                            className="text-sm fill-slate-700 font-bold"
                          >
                            {point.month}
                          </text>
                        </g>
                      ))}
                      
                      {/* Axes with enhanced styling */}
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={chartHeight - padding.bottom}
                        stroke="#94a3b8"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line
                        x1={padding.left}
                        y1={chartHeight - padding.bottom}
                        x2={chartWidth - padding.right}
                        y2={chartHeight - padding.bottom}
                        stroke="#94a3b8"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      
                      {/* Axis labels */}
                      <text
                        x={padding.left - 50}
                        y={padding.top - 10}
                        className="text-sm fill-slate-600 font-semibold"
                      >
                        Revenue (₱)
                      </text>
                      <text
                        x={chartWidth / 2}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        className="text-sm fill-slate-600 font-semibold"
                      >
                        Month
                      </text>
                      
                      {/* Tooltips - rendered last so they appear on top */}
                      {points.map((point, index) => {
                        // Determine if point is near the right edge (last 2 points)
                        const isNearRightEdge = index >= points.length - 2;
                        const tooltipX = isNearRightEdge ? point.x - 115 : point.x + 15;
                        const textX = isNearRightEdge ? point.x - 65 : point.x + 65;
                        
                        return (
                        <g 
                          key={`tooltip-${index}`} 
                          className={`transition-all duration-300 pointer-events-none ${activeTooltip === index ? 'opacity-100' : 'opacity-0'}`}
                        >
                          <rect
                            x={tooltipX}
                            y={point.y - 18}
                            width="100"
                            height="36"
                            rx="8"
                            fill="white"
                            stroke="#8b5cf6"
                            strokeWidth="2"
                            filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
                          />
                          <text
                            x={textX}
                            y={point.y + 5}
                            textAnchor="middle"
                            className="text-sm font-bold fill-purple-600"
                          >
                            ₱{point.revenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </text>
                        </g>
                        );
                      })}
                      
                      {/* Invisible hover areas to trigger tooltips */}
                      {points.map((point, index) => (
                        <circle
                          key={`hover-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r="20"
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setActiveTooltip(index)}
                          onMouseLeave={() => setActiveTooltip(null)}
                        />
                      ))}
                    </svg>
                  </div>
                </div>
              );
            })()}

            {/* Inventory Bar Chart - Horizontal bars showing stock by category */}
            {reportType === 'inventory' && (() => {
              const categories = ['uniform', 'accessory', 'equipment', 'service'];
              const categoryData = categories.map(cat => ({
                category: cat.charAt(0).toUpperCase() + cat.slice(1),
                stock: products.filter(p => p.category === cat).reduce((sum, p) => sum + (p.stock || 0), 0)
              }));
              
              const maxStock = Math.max(...categoryData.map(d => d.stock), 1);
              const chartHeight = 300;
              const chartWidth = 900;
              const padding = { top: 40, right: 100, bottom: 60, left: 120 };
              const graphHeight = chartHeight - padding.top - padding.bottom;
              const graphWidth = chartWidth - padding.left - padding.right;
              const barHeight = graphHeight / categoryData.length * 0.6;
              const barSpacing = graphHeight / categoryData.length;
              
              return (
                <div className="mb-8 animate-fade-in">
                  <div className="bg-gradient-to-br from-green-50 via-white to-purple-50 border-2 border-green-200 rounded-2xl p-8 shadow-xl">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Stock Distribution by Category</h3>
                    
                    <svg width={chartWidth} height={chartHeight} className="mx-auto">
                      {/* Bars */}
                      {categoryData.map((data, index) => {
                        const barWidth = (data.stock / maxStock) * graphWidth;
                        const y = padding.top + index * barSpacing + (barSpacing - barHeight) / 2;
                        const color = index % 2 === 0 ? '#10b981' : '#8b5cf6';
                        
                        return (
                          <g key={index}>
                            {/* Category label */}
                            <text
                              x={padding.left - 10}
                              y={y + barHeight / 2 + 5}
                              textAnchor="end"
                              className="text-sm fill-slate-700 font-bold"
                            >
                              {data.category}
                            </text>
                            
                            {/* Bar */}
                            <rect
                              x={padding.left}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              fill={color}
                              rx="4"
                              className="animate-fade-in"
                              style={{ 
                                animationDelay: `${index * 0.1}s`,
                                opacity: 0.8
                              }}
                            />
                            
                            {/* Value label */}
                            <text
                              x={padding.left + barWidth + 10}
                              y={y + barHeight / 2 + 5}
                              className="text-sm fill-slate-700 font-bold"
                            >
                              {data.stock.toLocaleString()} units
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* X-axis */}
                      <line
                        x1={padding.left}
                        y1={chartHeight - padding.bottom}
                        x2={chartWidth - padding.right}
                        y2={chartHeight - padding.bottom}
                        stroke="#94a3b8"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>
              );
            })()}

            {/* Locker Occupancy Donut Chart */}
            {reportType === 'lockers' && (() => {
              const available = lockers.filter((l) => l?.status === 'available').length;
              const occupied = lockers.filter((l) => l?.status === 'occupied').length;
              const maintenance = lockers.filter((l) => l?.status === 'under_maintenance').length;
              const total = lockers.length || 1;
              
              const chartSize = 400;
              const centerX = chartSize / 2;
              const centerY = chartSize / 2;
              const radius = 120;
              const innerRadius = 70;
              
              // Calculate angles
              const availableAngle = (available / total) * 360;
              const occupiedAngle = (occupied / total) * 360;
              
              // Helper to create arc path
              const createArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
                const start = (startAngle - 90) * Math.PI / 180;
                const end = (endAngle - 90) * Math.PI / 180;
                
                const x1 = centerX + outerR * Math.cos(start);
                const y1 = centerY + outerR * Math.sin(start);
                const x2 = centerX + outerR * Math.cos(end);
                const y2 = centerY + outerR * Math.sin(end);
                const x3 = centerX + innerR * Math.cos(end);
                const y3 = centerY + innerR * Math.sin(end);
                const x4 = centerX + innerR * Math.cos(start);
                const y4 = centerY + innerR * Math.sin(start);
                
                const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                
                return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
              };
              
              return (
                <div className="mb-8 animate-fade-in">
                  <div className="bg-gradient-to-br from-purple-50 via-white to-green-50 border-2 border-purple-200 rounded-2xl p-8 shadow-xl">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Locker Status Distribution</h3>
                    
                    <div className="flex items-center justify-center gap-12">
                      <svg width={chartSize} height={chartSize}>
                        {/* Occupied - Green */}
                        <path
                          d={createArc(0, occupiedAngle, radius, innerRadius)}
                          fill="#10b981"
                          className="animate-fade-in"
                          style={{ animationDelay: '0.1s' }}
                        />
                        
                        {/* Available - Purple */}
                        <path
                          d={createArc(occupiedAngle, occupiedAngle + availableAngle, radius, innerRadius)}
                          fill="#8b5cf6"
                          className="animate-fade-in"
                          style={{ animationDelay: '0.2s' }}
                        />
                        
                        {/* Maintenance - Gray */}
                        <path
                          d={createArc(occupiedAngle + availableAngle, 360, radius, innerRadius)}
                          fill="#94a3b8"
                          className="animate-fade-in"
                          style={{ animationDelay: '0.3s' }}
                        />
                        
                        {/* Center text */}
                        <text
                          x={centerX}
                          y={centerY - 10}
                          textAnchor="middle"
                          className="text-3xl font-bold fill-slate-900"
                        >
                          {total}
                        </text>
                        <text
                          x={centerX}
                          y={centerY + 15}
                          textAnchor="middle"
                          className="text-sm fill-slate-600"
                        >
                          Total Lockers
                        </text>
                      </svg>
                      
                      {/* Legend */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded bg-green-500"></div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Occupied</p>
                            <p className="text-2xl font-bold text-green-600">{occupied}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded bg-purple-500"></div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Available</p>
                            <p className="text-2xl font-bold text-purple-600">{available}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded bg-slate-400"></div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">Maintenance</p>
                            <p className="text-2xl font-bold text-slate-600">{maintenance}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Income Breakdown Vertical Bar Chart */}
            {reportType === 'income' && (() => {
              const salesIncome = sales
                .filter(s => s && (s.status === 'completed' || s.status === 'released'))
                .reduce((sum, s) => {
                  const amount = parseFloat(String(s?.total_amount || s?.totalAmount || 0));
                  return sum + (isNaN(amount) ? 0 : amount);
                }, 0);
              const rentalIncome = lockerRentals.reduce((sum, r) => sum + (r?.rentalFee || 0), 0);
              
              const incomeData = [
                { label: 'Product Sales', value: salesIncome, color: '#10b981' },
                { label: 'Locker Services', value: rentalIncome, color: '#8b5cf6' }
              ];
              
              const maxIncome = Math.max(...incomeData.map(d => d.value), 1);
              const chartHeight = 400;
              const chartWidth = 600;
              const padding = { top: 40, right: 60, bottom: 100, left: 80 };
              const graphHeight = chartHeight - padding.top - padding.bottom;
              const graphWidth = chartWidth - padding.left - padding.right;
              const barWidth = graphWidth / incomeData.length * 0.5;
              const barSpacing = graphWidth / incomeData.length;
              
              return (
                <div className="mb-8 animate-fade-in">
                  <div className="bg-gradient-to-br from-green-50 via-white to-purple-50 border-2 border-green-200 rounded-2xl p-8 shadow-xl">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Income Sources Comparison</h3>
                    
                    <svg width={chartWidth} height={chartHeight} className="mx-auto">
                      {/* Y-axis labels */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padding.top + graphHeight * (1 - ratio);
                        return (
                          <g key={ratio}>
                            <line
                              x1={padding.left}
                              y1={y}
                              x2={chartWidth - padding.right}
                              y2={y}
                              stroke="#e0e7ff"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={padding.left - 15}
                              y={y + 5}
                              textAnchor="end"
                              className="text-xs fill-slate-500 font-semibold"
                            >
                              ₱{(maxIncome * ratio).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Bars */}
                      {incomeData.map((data, index) => {
                        const barHeight = (data.value / maxIncome) * graphHeight;
                        const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;
                        const y = padding.top + graphHeight - barHeight;
                        
                        return (
                          <g key={index}>
                            {/* Bar */}
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              fill={data.color}
                              rx="8"
                              className="animate-fade-in"
                              style={{ 
                                animationDelay: `${index * 0.1}s`,
                                opacity: 0.9
                              }}
                            />
                            
                            {/* Value on top */}
                            <text
                              x={x + barWidth / 2}
                              y={y - 10}
                              textAnchor="middle"
                              className="text-sm fill-slate-700 font-bold"
                            >
                              ₱{data.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </text>
                            
                            {/* Label */}
                            <text
                              x={x + barWidth / 2}
                              y={chartHeight - padding.bottom + 25}
                              textAnchor="middle"
                              className="text-sm fill-slate-700 font-bold"
                            >
                              {data.label.split(' ')[0]}
                            </text>
                            <text
                              x={x + barWidth / 2}
                              y={chartHeight - padding.bottom + 45}
                              textAnchor="middle"
                              className="text-sm fill-slate-700 font-bold"
                            >
                              {data.label.split(' ').slice(1).join(' ')}
                            </text>
                          </g>
                        );
                      })}
                      
                      {/* Axes */}
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={chartHeight - padding.bottom}
                        stroke="#94a3b8"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line
                        x1={padding.left}
                        y1={chartHeight - padding.bottom}
                        x2={chartWidth - padding.right}
                        y2={chartHeight - padding.bottom}
                        stroke="#94a3b8"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              );
            })()}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {report.data.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
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
          </div>
        </div>
      </div>
    </div>
  );
};
