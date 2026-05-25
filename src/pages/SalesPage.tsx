import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, TrendingUp, Package, DollarSign, Calendar, Download, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../store/authContext';
import { apiClient } from '../services/api';
import { AppDataSync } from '../store/appDataSync';
import { useUIStore } from '../store/uiStore';
import { formatProductName, parseAndFormatLegacyProductName } from '../utils/productNameFormatter';

export const SalesPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Helper function to format payment method display
  const formatPaymentMethod = (method: string | undefined): string => {
    if (!method) return 'UNKNOWN';
    return method.toLowerCase() === 'ewallet' ? 'GCASH' : method.toUpperCase();
  };

  // Helper function to format product name with variants
  const formatProductNameWithVariants = (item: any): string => {
    // Get the full product name from database
    let fullName = item?.product_name || item?.productName || 'Unknown Product';
    
    // Clean up any extra spaces
    fullName = fullName.replace(/\s+/g, ' ').trim();
    
    // If the name already appears to be formatted (contains " - " pattern multiple times),
    // check for duplicates and clean up
    const dashCount = (fullName.match(/ - /g) || []).length;
    if (dashCount >= 2) {
      // Check for duplicate variant values (e.g., "Gala - Bundle G - Bundle G (BSMARE)")
      const parts = fullName.split(' - ');
      if (parts.length >= 3) {
        // Check if the second and third parts are the same (before any parenthesis)
        const secondPart = parts[1].trim();
        const thirdPartBeforeParen = parts[2].split('(')[0].trim();
        
        // Compare after trimming both parts
        if (secondPart === thirdPartBeforeParen) {
          // Remove the duplicate - keep base name, variant name, and everything after (including course code)
          const baseName = parts[0].trim();
          const variantName = parts[1].trim();
          // Get everything after the duplicate, including the course code in parentheses
          const afterDuplicate = parts[2].substring(thirdPartBeforeParen.length).trim();
          return `${baseName} - ${variantName} ${afterDuplicate}`.trim();
        }
      }
      
      return fullName;
    }
    
    // Get unit price to determine if member discount was applied
    const unitPrice = item?.unitPrice || item?.unit_price;
    
    // Parse selected options - handle both string and object formats
    let options: Record<string, string> = {};
    if (item?.selectedOptions || item?.selected_options) {
      const selectedOpts = item?.selectedOptions || item?.selected_options;
      try {
        if (typeof selectedOpts === 'string') {
          options = JSON.parse(selectedOpts);
        } else if (typeof selectedOpts === 'object' && selectedOpts !== null) {
          options = selectedOpts;
        }
      } catch (e) {
        console.warn('Failed to parse selectedOptions:', selectedOpts);
      }
    }
    
    // If we have selectedOptions, use the standard formatter
    if (options && Object.keys(options).length > 0) {
      // Extract base name from full name (remove everything after first parenthesis)
      const baseNameMatch = fullName.match(/^([^(]+)/);
      const baseName = baseNameMatch ? baseNameMatch[1].trim() : fullName;
      return formatProductName(baseName, options, unitPrice);
    }
    
    // Fallback: Parse the legacy format from the product name itself
    // This handles old orders where the full format was stored in product_name
    return parseAndFormatLegacyProductName(fullName, unitPrice);
  };

  const { user } = useAuth();
  const { showNotification } = useUIStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'daily' | 'history' | 'monthly' | 'tailored' | 'fulfillment' | 'insurance'>('pending');
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [dailyOrders, setDailyOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 1))); // Default to yesterday
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date()); // Default to current month
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [preOrderOrders, setPreOrderOrders] = useState<any[]>([]);
  const [downpaymentOrders, setDownpaymentOrders] = useState<any[]>([]);
  const [fullPaymentOrders, setFullPaymentOrders] = useState<any[]>([]);
  const [insuranceOrders, setInsuranceOrders] = useState<any[]>([]);
  const [insuranceRevenue, setInsuranceRevenue] = useState<number>(0);
  const [tailoredFilter, setTailoredFilter] = useState<'all' | 'preorder' | 'downpayment' | 'fullpayment' | 'released'>('all');
  const [tailoredSearchQuery, setTailoredSearchQuery] = useState<string>('');
  const [fulfillmentSearchQuery, setFulfillmentSearchQuery] = useState<string>('');
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<any | null>(null);

  // Load pending orders
  useEffect(() => {
    if (user?.id && activeTab === 'pending') {
      loadPendingOrders();
      
      // Set up polling for real-time updates (every 5 seconds)
      const interval = setInterval(() => {
        loadPendingOrders();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab]);

  // Load daily summary
  useEffect(() => {
    if (user?.id && activeTab === 'daily') {
      loadDailySummary();
      
      // Set up polling for real-time updates (every 10 seconds)
      const interval = setInterval(() => {
        loadDailySummary();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab]);

  // Load monthly report
  useEffect(() => {
    if (user?.id && activeTab === 'monthly') {
      loadMonthlyReport();
      
      // Set up polling for real-time updates (every 10 seconds)
      const interval = setInterval(() => {
        loadMonthlyReport();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab, selectedMonth]);

  // Load history for selected date
  useEffect(() => {
    if (user?.id && activeTab === 'history') {
      loadHistorySummary();
    }
  }, [user?.id, activeTab, selectedDate]);

  // Load pre-order orders on mount
  useEffect(() => {
    if (user?.id) {
      loadPreOrderOrders();
    }
  }, [user?.id]);

  // Load downpayment orders on mount
  useEffect(() => {
    if (user?.id) {
      loadDownpaymentOrders();
    }
  }, [user?.id]);

  // Load full payment orders on mount
  useEffect(() => {
    if (user?.id) {
      loadFullPaymentOrders();
    }
  }, [user?.id]);

  // Load pre-order, downpayment, and full payment orders when tailored tab is active
  useEffect(() => {
    if (user?.id && activeTab === 'tailored') {
      loadPreOrderOrders();
      loadDownpaymentOrders();
      loadFullPaymentOrders();
      
      // Set up polling for real-time updates (every 10 seconds)
      const interval = setInterval(() => {
        loadPreOrderOrders();
        loadDownpaymentOrders();
        loadFullPaymentOrders();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab]);

  // Load orders for fulfillment tab
  useEffect(() => {
    if (user?.id && activeTab === 'fulfillment') {
      loadPreOrderOrders();
      loadDownpaymentOrders();
      
      // Set up polling for real-time updates (every 10 seconds)
      const interval = setInterval(() => {
        loadPreOrderOrders();
        loadDownpaymentOrders();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab]);

  // Load insurance orders when insurance tab is active
  useEffect(() => {
    if (user?.id && activeTab === 'insurance') {
      loadInsuranceOrders();
      
      // Set up polling for real-time updates (every 10 seconds)
      const interval = setInterval(() => {
        loadInsuranceOrders();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab]);

  const loadPendingOrders = async () => {
    try {
      const orders = await apiClient.getPendingOrders(user?.id || '');
      if (Array.isArray(orders)) {
        setPendingOrders(orders);
      }
    } catch (err) {
      console.error('Failed to load pending orders:', err);
    }
  };

  const loadDailySummary = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      // Filter orders for today (exclude insurance orders)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = allOrders.filter((order: any) => {
        // Use completed_at for completed orders (payment date), created_at for cancelled orders
        const orderDate = new Date(order.status === 'completed' && order.completed_at ? order.completed_at : order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        const isToday = orderDate.getTime() === today.getTime();
        const isCompletedOrCancelled = order.status === 'completed' || order.status === 'cancelled';
        const isNotInsurance = order.order_type !== 'insurance';
        
        console.log('[Daily Summary Filter]', {
          receipt: order.receipt_no,
          order_type: order.order_type,
          status: order.status,
          isToday,
          isCompletedOrCancelled,
          isNotInsurance,
          included: isToday && isCompletedOrCancelled && isNotInsurance
        });
        
        return isToday && isCompletedOrCancelled && isNotInsurance;
      });
      
      console.log('[Daily Summary] Filtered orders:', todayOrders.length, 'out of', allOrders.length);
      setDailyOrders(todayOrders);
    } catch (err) {
      console.error('Failed to load daily summary:', err);
    }
  };

  const loadMonthlyReport = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      // Filter orders for selected month (exclude insurance orders)
      const selectedMonthValue = selectedMonth.getMonth();
      const selectedYear = selectedMonth.getFullYear();
      
      const monthlyOrders = allOrders.filter((order: any) => {
        // Use completed_at for completed orders (payment date)
        const orderDate = new Date(order.completed_at || order.created_at);
        return orderDate.getMonth() === selectedMonthValue && 
               orderDate.getFullYear() === selectedYear &&
               order.status === 'completed' &&
               order.order_type !== 'insurance'; // Exclude insurance orders
      });
      
      // Calculate total sales
      const totalSales = monthlyOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.total_amount), 0
      );
      
      // Calculate product units sold
      const productsSold: Record<string, { quantity: number; revenue: number }> = {};
      
      monthlyOrders.forEach((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productName = item.productName || item.product_name || 'Unknown';
            if (!productsSold[productName]) {
              productsSold[productName] = { quantity: 0, revenue: 0 };
            }
            productsSold[productName].quantity += item.quantity;
            productsSold[productName].revenue += parseFloat(item.subtotal);
          });
        }
      });
      
      setMonthlyData({
        totalSales,
        orderCount: monthlyOrders.length,
        productsSold,
        orders: monthlyOrders
      });
    } catch (err) {
      console.error('Failed to load monthly report:', err);
    }
  };

  const loadHistorySummary = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      // Filter orders for selected date (exclude insurance orders)
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);
      
      const historyOrdersFiltered = allOrders.filter((order: any) => {
        // Use completed_at for completed orders (payment date), created_at for cancelled orders
        const orderDate = new Date(order.status === 'completed' && order.completed_at ? order.completed_at : order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === targetDate.getTime() && 
               (order.status === 'completed' || order.status === 'cancelled') &&
               order.order_type !== 'insurance'; // Exclude insurance orders
      });
      
      setHistoryOrders(historyOrdersFiltered);
    } catch (err) {
      console.error('Failed to load history summary:', err);
    }
  };

  const loadPreOrderOrders = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      // Filter for pre-order items
      const preOrders = allOrders.filter((order: any) => {
        if (!order.items || !Array.isArray(order.items)) return false;
        return order.items.some((item: any) => item.orderType === 'preorder' || item.order_type === 'preorder');
      });
      
      setPreOrderOrders(preOrders);
    } catch (err) {
      console.error('Failed to load pre-order orders:', err);
    }
  };

  const loadDownpaymentOrders = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      // Filter for downpayment items AND balance payment orders
      const downpaymentOrdersFiltered = allOrders.filter((order: any) => {
        // Include balance payment orders (receipt starts with BAL-)
        if (order.receipt_no && order.receipt_no.startsWith('BAL-')) return true;
        
        if (!order.items || !Array.isArray(order.items)) return false;
        return order.items.some((item: any) => {
          const paymentType = item.paymentType || item.payment_type;
          
          // If payment_type is explicitly set to 'downpayment', include it
          if (paymentType === 'downpayment') return true;
          
          // For legacy orders without payment_type, check if it's a downpayment based on price
          const productName = item.productName || item.product_name || '';
          const subtotal = parseFloat(item.subtotal || 0);
          
          // Gala downpayment is ₱500
          if (productName.includes('Gala') && subtotal === 500) return true;
          
          // Type A & B Uniform or BSNAME Uniform downpayment is ₱1,500
          if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return true;
          
          return false;
        });
      });
      
      setDownpaymentOrders(downpaymentOrdersFiltered);
    } catch (err) {
      console.error('Failed to load downpayment orders:', err);
    }
  };

  const loadFullPaymentOrders = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      // Filter for orders where ALL items have payment_type = 'full' (or are non-tailored products)
      const fullPaymentOrdersFiltered = allOrders.filter((order: any) => {
        if (!order.items || !Array.isArray(order.items)) return false;
        
        // Check if order has at least one tailored product with full payment
        const hasTailoredFullPayment = order.items.some((item: any) => {
          const productName = item.productName || item.product_name || '';
          const isTailoredProduct = ['Gala', 'Type A & B Uniform', 'BSNAME Uniform'].some(name => productName.includes(name));
          
          if (!isTailoredProduct) return false;
          
          const paymentType = item.paymentType || item.payment_type;
          const subtotal = parseFloat(item.subtotal || 0);
          
          // If payment_type is explicitly set to 'full', include it
          if (paymentType === 'full') return true;
          
          // If payment_type is explicitly set to 'downpayment', exclude it
          if (paymentType === 'downpayment') return false;
          
          // For legacy orders without payment_type, check if it's NOT a downpayment based on price
          // Gala downpayment is ₱500, so anything else is full payment
          if (productName.includes('Gala') && subtotal === 500) return false;
          
          // Type A & B Uniform or BSNAME Uniform downpayment is ₱1,500
          if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return false;
          
          // If it's a tailored product and not a downpayment amount, it's full payment
          return true;
        });
        
        // Only include orders that have at least one tailored full payment item
        // AND no downpayment items
        if (!hasTailoredFullPayment) return false;
        
        // Check that NO items have downpayment
        const hasDownpayment = order.items.some((item: any) => {
          const paymentType = item.paymentType || item.payment_type;
          return paymentType === 'downpayment';
        });
        
        return !hasDownpayment;
      });
      
      setFullPaymentOrders(fullPaymentOrdersFiltered);
    } catch (err) {
      console.error('Failed to load full payment orders:', err);
    }
  };

  const loadInsuranceOrders = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      // Filter for insurance orders (order_type = 'insurance' and status = 'completed')
      const insuranceOrdersFiltered = allOrders.filter((order: any) => 
        order.order_type === 'insurance' && order.status === 'completed'
      );
      
      // Calculate total insurance revenue
      const totalRevenue = insuranceOrdersFiltered.reduce((sum: number, order: any) => 
        sum + parseFloat(order.total_amount || 0), 0
      );
      
      setInsuranceOrders(insuranceOrdersFiltered);
      setInsuranceRevenue(totalRevenue);
    } catch (err) {
      console.error('Failed to load insurance orders:', err);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    
    // Don't allow future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate.getTime() < today.getTime()) {
      setSelectedDate(newDate);
    }
  };

  const exportToExcel = () => {
    const isHistory = activeTab === 'history';
    const isMonthly = activeTab === 'monthly';
    
    if (isMonthly) {
      // Export monthly products sold data
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Product Name,Units Sold,Revenue\n";
      
      Object.entries(monthlyData.productsSold)
        .sort((a: any, b: any) => b[1].quantity - a[1].quantity)
        .forEach(([productName, data]: [string, any]) => {
          const row = [
            productName,
            data.quantity,
            data.revenue.toFixed(2)
          ].map(cell => `"${cell}"`).join(',');
          csvContent += row + "\n";
        });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const monthStr = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(/\s/g, '_');
      link.setAttribute("download", `monthly_sales_${monthStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('Monthly report exported successfully!', 'success');
      return;
    }
    
    const ordersToExport = isHistory ? historyOrders : dailyOrders;
    const filterToUse = isHistory ? historyStatusFilter : statusFilter;
    const filteredOrders = ordersToExport.filter(order => filterToUse === 'all' || order.status === filterToUse);
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Receipt,Customer Name,Course & Year,Product,Quantity,Amount,Payment,Status,Time\n";
    
    // Add data rows
    filteredOrders.forEach(order => {
      const items = order?.items || [];
      const courseYear = order?.course && order?.year 
        ? `${order.course} - ${order.year}` 
        : order?.course || order?.year || 'N/A';
      const time = order?.created_at ? new Date(order?.created_at).toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : 'N/A';
      
      if (items.length > 0) {
        items.forEach((item: any) => {
          const row = [
            order?.receipt_no || 'N/A',
            order?.first_name ? `${order?.first_name} ${order?.last_name || ''}`.trim() : 'N/A',
            courseYear,
            formatProductNameWithVariants(item),
            item?.quantity || 0,
            Number(item?.subtotal || 0).toFixed(2),
            formatPaymentMethod(order?.payment_method),
            order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED',
            time
          ].map(cell => `"${cell}"`).join(',');
          csvContent += row + "\n";
        });
      } else {
        const row = [
          order?.receipt_no || 'N/A',
          order?.first_name ? `${order?.first_name} ${order?.last_name || ''}`.trim() : 'N/A',
          courseYear,
          'Multiple Items',
          '-',
          Number(order?.total_amount || 0).toFixed(2),
          formatPaymentMethod(order?.payment_method),
          order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED',
          time
        ].map(cell => `"${cell}"`).join(',');
        csvContent += row + "\n";
      }
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateToUse = isHistory ? selectedDate : new Date();
    const dateStr = dateToUse.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    link.setAttribute("download", `daily_sales_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Report exported successfully!', 'success');
  };

  return (
    <div className="min-h-screen p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header with Export Button */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sales Management</h1>
            <p className="text-slate-600 mt-2">Process orders and view sales reports</p>
          </div>
          
          {/* Export Button - Only show on Daily Summary, History, Monthly Sales, and Tailored Orders tabs */}
          {(activeTab === 'daily' || activeTab === 'history' || activeTab === 'monthly' || activeTab === 'tailored') && (
            <button
              onClick={exportToExcel}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg hover:scale-105 text-base"
            >
              <Download size={20} />
              <span>Export</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center mb-6 border-b border-slate-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Orders ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'daily'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Summary
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'monthly'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Sales
            </button>
            <button
              onClick={() => setActiveTab('tailored')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'tailored'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tailored Orders ({preOrderOrders.length + downpaymentOrders.filter(o => !o.receipt_no || !o.receipt_no.startsWith('BAL-')).length + fullPaymentOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('fulfillment')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'fulfillment'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Order Fulfillment
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'insurance'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Insurance
            </button>
          </div>
        </div>

        {/* Pending Orders Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6">
                {/* Search Bar */}
                <div className="mb-5 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or ID number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-medium"
                    >
                      ✕ Clear
                    </button>
                  )}
                </div>

                {pendingOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600 text-lg">No pending orders at the moment</p>
                  </div>
                ) : (() => {
                  const filteredPending = pendingOrders.filter((order) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    const fullName = `${order.first_name || ''} ${order.last_name || ''}`.toLowerCase();
                    const email = (order.email || '').toLowerCase();
                    const idNumber = (order.id_number || '').toLowerCase();
                    return fullName.includes(q) || email.includes(q) || idNumber.includes(q);
                  });

                  return filteredPending.length === 0 ? (
                    <div className="text-center py-12">
                      <Search size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-600 text-lg">No orders match your search</p>
                      <p className="text-slate-400 text-sm mt-1">Try a different name, email, or ID number</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredPending.map((order) => {
                        const initials = `${order.first_name?.[0] || ''}${order.last_name?.[0] || ''}`.toUpperCase();
                        return (
                          <div
                            key={order.id}
                            onClick={() => setSelectedPendingOrder(order)}
                            className="flex items-center gap-4 py-4 px-2 cursor-pointer hover:bg-purple-50 rounded-lg transition-colors group"
                          >
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-purple-600">{initials}</span>
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                                  {order.first_name} {order.last_name}
                                </p>
                                {order.receipt_no && order.receipt_no.startsWith('BAL-') && (
                                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">BALANCE</span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 truncate">{order.email}</p>
                            </div>
                            {/* Amount */}
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-purple-600">₱{parseFloat(order.total_amount).toLocaleString()}</p>
                              <p className="text-xs text-slate-400">{order.payment_method === 'cash' ? 'Cash' : 'GCash'}</p>
                            </div>
                            {/* Chevron */}
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Pending Order Detail Modal */}
        {selectedPendingOrder && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setSelectedPendingOrder(null)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">
                      {`${selectedPendingOrder.first_name?.[0] || ''}${selectedPendingOrder.last_name?.[0] || ''}`.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {selectedPendingOrder.first_name} {selectedPendingOrder.last_name}
                    </h3>
                    <p className="text-sm text-slate-500">{selectedPendingOrder.email} • ID: {selectedPendingOrder.id_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPendingOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                {/* Amount & Payment */}
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-purple-600">₱{parseFloat(selectedPendingOrder.total_amount).toLocaleString()}</p>
                  <div className="text-right">
                    <p className="font-semibold text-slate-700">{selectedPendingOrder.payment_method === 'cash' ? 'Cash' : 'GCash'}</p>
                    {selectedPendingOrder.payment_method === 'ewallet' && selectedPendingOrder.reference_number && (
                      <p className="text-xs text-slate-500">Ref: {selectedPendingOrder.reference_number}</p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Items:</p>
                  <div className="space-y-2">
                    {selectedPendingOrder.items && selectedPendingOrder.items.map((item: any, idx: number) => {
                      const paymentType = item.paymentType || item.payment_type;
                      const isDownpayment = paymentType === 'downpayment' ||
                        (item.productName?.includes('Gala') && parseFloat(item.subtotal) === 500) ||
                        (item.product_name?.includes('Gala') && parseFloat(item.subtotal) === 500) ||
                        ((item.productName?.includes('Type A & B Uniform') || item.productName?.includes('BSNAME Uniform')) && parseFloat(item.subtotal) === 1500) ||
                        ((item.product_name?.includes('Type A & B Uniform') || item.product_name?.includes('BSNAME Uniform')) && parseFloat(item.subtotal) === 1500);
                      const orderType = item.orderType || item.order_type;
                      const isPreorder = orderType === 'preorder';
                      const isBalance = selectedPendingOrder.receipt_no?.startsWith('BAL-') || selectedPendingOrder.receiptNo?.startsWith('BAL-');
                      return (
                        <div key={idx} className="flex items-start gap-2 flex-wrap text-sm text-slate-600">
                          <span>• {formatProductNameWithVariants(item)} (Qty: {item.quantity}) — ₱{parseFloat(item.subtotal).toLocaleString()}</span>
                          {isDownpayment && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">DOWNPAYMENT</span>}
                          {isPreorder && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">PRE-ORDER</span>}
                          {isBalance && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">BALANCE</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Receipt: {selectedPendingOrder.receipt_no}</span>
                  <span>{new Date(selectedPendingOrder.created_at).toLocaleDateString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={async () => {
                      try {
                        await AppDataSync.updateOrderStatus(selectedPendingOrder.id, 'completed', user?.id || '');
                        await AppDataSync.loadProductsFromAPI();
                        await loadPendingOrders();
                        await loadDownpaymentOrders();
                        setSelectedPendingOrder(null);
                        showNotification('Order marked as paid! Stock updated.', 'success');
                      } catch (err) {
                        showNotification('Failed to mark order as paid. Please try again.', 'error');
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Paid
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await AppDataSync.updateOrderStatus(selectedPendingOrder.id, 'cancelled', user?.id || '');
                        await loadPendingOrders();
                        setSelectedPendingOrder(null);
                        showNotification('Order cancelled successfully!', 'success');
                      } catch (err) {
                        showNotification('Failed to cancel order. Please try again.', 'error');
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Summary Tab */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Completed Today</h3>
                  <CheckCircle size={24} />
                </div>
                <p className="text-3xl font-bold">
                  {dailyOrders.filter(o => o.status === 'completed').length}
                </p>
                <p className="text-sm opacity-75 mt-1">orders</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Cancelled Today</h3>
                  <Clock size={24} />
                </div>
                <p className="text-3xl font-bold">
                  {dailyOrders.filter(o => o.status === 'cancelled').length}
                </p>
                <p className="text-sm opacity-75 mt-1">orders</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Total Revenue</h3>
                  <DollarSign size={24} />
                </div>
                <p className="text-3xl font-bold">
                  ₱{dailyOrders
                    .filter(o => o.status === 'completed' && o.order_type !== 'insurance')
                    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm opacity-75 mt-1">today</p>
              </div>
            </div>

            {/* Detailed Records Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Detailed Records</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-slate-600">
                      Filter by status:
                    </div>
                    
                    {/* Filter Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          statusFilter === 'all'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setStatusFilter('completed')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          statusFilter === 'completed'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => setStatusFilter('cancelled')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          statusFilter === 'cancelled'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Cancelled
                      </button>
                    </div>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search by customer name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                    />
                  </div>
                </div>
              </div>
              
              {dailyOrders.filter(order => {
                const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
                const customerName = `${order?.first_name || ''} ${order?.last_name || ''}`.trim().toLowerCase();
                const matchesSearch = searchQuery === '' || customerName.includes(searchQuery.toLowerCase());
                return matchesStatus && matchesSearch;
              }).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600">
                    {searchQuery 
                      ? `No orders found for "${searchQuery}"` 
                      : statusFilter === 'all' 
                        ? 'No orders processed today' 
                        : `No ${statusFilter} orders today`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-50">
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Receipt</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Customer Name</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Course & Year</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Product</th>
                        <th className="text-center py-4 px-6 font-semibold text-slate-900">Quantity</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Amount</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Payment</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyOrders.filter(order => {
                        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
                        const customerName = `${order?.first_name || ''} ${order?.last_name || ''}`.trim().toLowerCase();
                        const matchesSearch = searchQuery === '' || customerName.includes(searchQuery.toLowerCase());
                        return matchesStatus && matchesSearch;
                      }).map((order) => {
                        const items = order?.items || [];
                        const courseYear = order?.course && order?.year 
                          ? `${order.course} - ${order.year}` 
                          : order?.course || order?.year || 'N/A';
                        
                        if (items.length > 0) {
                          return items.map((item: any, itemIdx: number) => (
                            <tr
                              key={`${order?.id}-${itemIdx}`}
                              className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-4 px-6 font-mono text-slate-900 text-xs">
                                {itemIdx === 0 ? (order?.receipt_no || 'N/A') : ''}
                              </td>
                              <td className="py-4 px-6 text-slate-900">
                                {order?.first_name ? `${order?.first_name} ${order?.last_name || ''}`.trim() : 'N/A'}
                              </td>
                              <td className="py-4 px-6 text-slate-900">
                                {courseYear}
                              </td>
                              <td className="py-4 px-6 text-slate-900">
                                {formatProductNameWithVariants(item)}
                              </td>
                              <td className="py-4 px-6 text-center text-slate-900">
                                {item?.quantity || 0}
                              </td>
                              <td className="py-4 px-6 font-semibold text-green-700">
                                ₱{Number(item?.subtotal || 0).toFixed(2)}
                              </td>
                              <td className="py-4 px-6">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {formatPaymentMethod(order?.payment_method)}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order?.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-700 text-xs">
                                {order?.created_at ? new Date(order?.created_at).toLocaleString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                }) : 'N/A'}
                              </td>
                            </tr>
                          ));
                        }
                        
                        return (
                          <tr
                            key={order?.id || Math.random()}
                            className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-4 px-6 font-mono text-slate-900 text-xs">{order?.receipt_no || 'N/A'}</td>
                            <td className="py-4 px-6 text-slate-900">
                              {order?.first_name ? `${order?.first_name} ${order?.last_name || ''}`.trim() : 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-slate-900">
                              {courseYear}
                            </td>
                            <td className="py-4 px-6 text-slate-500">Multiple Items</td>
                            <td className="py-4 px-6 text-center text-slate-500">-</td>
                            <td className="py-4 px-6 font-semibold text-green-700">
                              ₱{Number(order?.total_amount || 0).toFixed(2)}
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                {formatPaymentMethod(order?.payment_method)}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order?.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-700 text-xs">
                              {order?.created_at ? new Date(order?.created_at).toLocaleString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              }) : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Date Navigation */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => changeDate(-1)}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                  <span className="font-semibold">Previous Day</span>
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Viewing sales for:</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                <button
                  onClick={() => changeDate(1)}
                  disabled={selectedDate.toDateString() === new Date(new Date().setDate(new Date().getDate() - 1)).toDateString()}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedDate.toDateString() === new Date(new Date().setDate(new Date().getDate() - 1)).toDateString()
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <span className="font-semibold">Next Day</span>
                  <ChevronRight size={20} />
                </button>
              </div>
              
              {/* Date Picker */}
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-3">
                  <label htmlFor="date-picker" className="text-sm font-semibold text-slate-700">
                    Jump to date:
                  </label>
                  <input
                    id="date-picker"
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    max={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      newDate.setHours(0, 0, 0, 0);
                      setSelectedDate(newDate);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Completed</h3>
                  <CheckCircle size={24} />
                </div>
                <p className="text-3xl font-bold">
                  {historyOrders.filter(o => o.status === 'completed').length}
                </p>
                <p className="text-sm opacity-75 mt-1">orders</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Cancelled</h3>
                  <Clock size={24} />
                </div>
                <p className="text-3xl font-bold">
                  {historyOrders.filter(o => o.status === 'cancelled').length}
                </p>
                <p className="text-sm opacity-75 mt-1">orders</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Total Revenue</h3>
                  <DollarSign size={24} />
                </div>
                <p className="text-3xl font-bold">
                  ₱{historyOrders
                    .filter(o => o.status === 'completed' && o.order_type !== 'insurance')
                    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm opacity-75 mt-1">that day</p>
              </div>
            </div>

            {/* Detailed Records Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Detailed Records</h3>
                  
                  <div className="flex items-center space-x-4">
                    {/* Filter Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setHistoryStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          historyStatusFilter === 'all'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setHistoryStatusFilter('completed')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          historyStatusFilter === 'completed'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => setHistoryStatusFilter('cancelled')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          historyStatusFilter === 'cancelled'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Cancelled
                      </button>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search by customer name..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {historyOrders.filter(order => {
                const matchesStatus = historyStatusFilter === 'all' || order.status === historyStatusFilter;
                const customerName = `${order?.first_name || ''} ${order?.last_name || ''}`.trim().toLowerCase();
                const matchesSearch = historySearchQuery === '' || customerName.includes(historySearchQuery.toLowerCase());
                return matchesStatus && matchesSearch;
              }).length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600">
                    {historySearchQuery 
                      ? `No orders found for "${historySearchQuery}"` 
                      : historyStatusFilter === 'all' 
                        ? 'No orders found for this date' 
                        : `No ${historyStatusFilter} orders for this date`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-50">
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Receipt</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Customer Name</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Course & Year</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Product</th>
                        <th className="text-center py-4 px-6 font-semibold text-slate-900">Quantity</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Amount</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Payment</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyOrders.filter(order => {
                        const matchesStatus = historyStatusFilter === 'all' || order.status === historyStatusFilter;
                        const customerName = `${order?.first_name || ''} ${order?.last_name || ''}`.trim().toLowerCase();
                        const matchesSearch = historySearchQuery === '' || customerName.includes(historySearchQuery.toLowerCase());
                        return matchesStatus && matchesSearch;
                      }).map((order) => {
                        const items = order?.items || [];
                        const courseYear = order?.course && order?.year 
                          ? `${order.course} - ${order.year}` 
                          : order?.course || order?.year || 'N/A';
                        
                        if (items.length > 0) {
                          return items.map((item: any, itemIdx: number) => (
                            <tr
                              key={`${order?.id}-${itemIdx}`}
                              className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-4 px-6 font-mono text-slate-900 text-xs">{order?.receipt_no || 'N/A'}</td>
                              <td className="py-4 px-6 text-slate-900">
                                {order?.first_name ? `${order?.first_name} ${order?.last_name || ''}`.trim() : 'N/A'}
                              </td>
                              <td className="py-4 px-6 text-slate-900">
                                {courseYear}
                              </td>
                              <td className="py-4 px-6 text-slate-900">
                                {formatProductNameWithVariants(item)}
                              </td>
                              <td className="py-4 px-6 text-center text-slate-900">
                                {item?.quantity || 0}
                              </td>
                              <td className="py-4 px-6 font-semibold text-green-700">
                                ₱{Number(item?.subtotal || 0).toFixed(2)}
                              </td>
                              <td className="py-4 px-6">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {formatPaymentMethod(order?.payment_method)}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order?.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-700 text-xs">
                                {order?.created_at ? new Date(order?.created_at).toLocaleString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                }) : 'N/A'}
                              </td>
                            </tr>
                          ));
                        }
                        
                        return (
                          <tr
                            key={order?.id || Math.random()}
                            className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-4 px-6 font-mono text-slate-900 text-xs">{order?.receipt_no || 'N/A'}</td>
                            <td className="py-4 px-6 text-slate-900">
                              {order?.first_name ? `${order?.first_name} ${order?.last_name || ''}`.trim() : 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-slate-900">
                              {courseYear}
                            </td>
                            <td className="py-4 px-6 text-slate-500">Multiple Items</td>
                            <td className="py-4 px-6 text-center text-slate-500">-</td>
                            <td className="py-4 px-6 font-semibold text-green-700">
                              ₱{Number(order?.total_amount || 0).toFixed(2)}
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                {formatPaymentMethod(order?.payment_method)}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order?.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-700 text-xs">
                              {order?.created_at ? new Date(order?.created_at).toLocaleString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              }) : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monthly Sales Tab */}
        {activeTab === 'monthly' && monthlyData && (
          <div className="space-y-6">
            {/* Month Navigation */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const newMonth = new Date(selectedMonth);
                    newMonth.setMonth(newMonth.getMonth() - 1);
                    setSelectedMonth(newMonth);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                  <span className="font-semibold">Previous Month</span>
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Viewing sales for:</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedMonth.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long'
                    })}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    const newMonth = new Date(selectedMonth);
                    newMonth.setMonth(newMonth.getMonth() + 1);
                    const now = new Date();
                    if (newMonth.getMonth() <= now.getMonth() && newMonth.getFullYear() <= now.getFullYear()) {
                      setSelectedMonth(newMonth);
                    }
                  }}
                  disabled={selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear()}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear()
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <span className="font-semibold">Next Month</span>
                  <ChevronRight size={20} />
                </button>
              </div>
              
              {/* Month Picker */}
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-3">
                  <label htmlFor="month-picker" className="text-sm font-semibold text-slate-700">
                    Jump to month:
                  </label>
                  <input
                    id="month-picker"
                    type="month"
                    value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                    max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-');
                      const newMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
                      setSelectedMonth(newMonth);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Total Sales</h3>
                  <TrendingUp size={24} />
                </div>
                <p className="text-3xl font-bold">
                  ₱{monthlyData.totalSales.toLocaleString()}
                </p>
                <p className="text-sm opacity-75 mt-1">
                  {selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear() 
                    ? 'this month' 
                    : 'that month'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Orders Completed</h3>
                  <CheckCircle size={24} />
                </div>
                <p className="text-3xl font-bold">{monthlyData.orderCount}</p>
                <p className="text-sm opacity-75 mt-1">orders</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Products Sold</h3>
                  <Package size={24} />
                </div>
                <p className="text-3xl font-bold">
                  {Object.values(monthlyData.productsSold).reduce((sum: number, p: any) => sum + p.quantity, 0)}
                </p>
                <p className="text-sm opacity-75 mt-1">units</p>
              </div>
            </div>

            {/* Products Sold Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Products Sold This Month</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Product Name</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Units Sold</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(monthlyData.productsSold)
                      .sort((a: any, b: any) => b[1].quantity - a[1].quantity)
                      .map(([productName, data]: [string, any]) => (
                        <tr key={productName} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{productName}</td>
                          <td className="px-6 py-4 text-sm text-right text-slate-600">{data.quantity} units</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-slate-900">
                            ₱{data.revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tailored Orders Tab */}
        {activeTab === 'tailored' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Tailored Orders</h3>
                  <p className="text-sm text-slate-600">Orders with special payment options for tailored items.</p>
                </div>
                
                {/* Search Bar */}
                <div className="w-80">
                  <input
                    type="text"
                    placeholder="Search by customer name"
                    value={tailoredSearchQuery}
                    onChange={(e) => setTailoredSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setTailoredFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    tailoredFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({preOrderOrders.length + downpaymentOrders.filter(o => !o.receipt_no || !o.receipt_no.startsWith('BAL-')).length + fullPaymentOrders.length})
                </button>
                <button
                  onClick={() => setTailoredFilter('preorder')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    tailoredFilter === 'preorder'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Pre-Order ({preOrderOrders.filter(o => o.status !== 'released').length})
                </button>
                <button
                  onClick={() => setTailoredFilter('downpayment')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    tailoredFilter === 'downpayment'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Downpayment ({downpaymentOrders.filter(o => !o.receipt_no || !o.receipt_no.startsWith('BAL-')).length})
                </button>
                <button
                  onClick={() => setTailoredFilter('fullpayment')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    tailoredFilter === 'fullpayment'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Full Payment ({fullPaymentOrders.length})
                </button>
                <button
                  onClick={() => setTailoredFilter('released')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    tailoredFilter === 'released'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Released ({preOrderOrders.filter(o => o.status === 'released').length})
                </button>
              </div>

              {/* Orders Display */}
              {(() => {
                // Combine and filter orders based on selected filter
                let displayOrders: any[] = [];
                
                if (tailoredFilter === 'all') {
                  displayOrders = [
                    ...preOrderOrders.map(o => ({ ...o, type: 'preorder' })),
                    ...downpaymentOrders.filter(o => !o.receipt_no || !o.receipt_no.startsWith('BAL-')).map(o => ({ ...o, type: 'downpayment' })),
                    ...fullPaymentOrders.map(o => ({ ...o, type: 'fullpayment' }))
                  ];
                } else if (tailoredFilter === 'preorder') {
                  displayOrders = preOrderOrders.filter(o => o.status !== 'released').map(o => ({ ...o, type: 'preorder' }));
                } else if (tailoredFilter === 'downpayment') {
                  displayOrders = downpaymentOrders.filter(o => !o.receipt_no || !o.receipt_no.startsWith('BAL-')).map(o => ({ ...o, type: 'downpayment' }));
                } else if (tailoredFilter === 'fullpayment') {
                  displayOrders = fullPaymentOrders.map(o => ({ ...o, type: 'fullpayment' }));
                } else if (tailoredFilter === 'released') {
                  displayOrders = preOrderOrders.filter(o => o.status === 'released').map(o => ({ ...o, type: 'preorder' }));
                }

                // Apply search filter
                if (tailoredSearchQuery) {
                  displayOrders = displayOrders.filter(order => {
                    const customerName = `${order?.first_name || ''} ${order?.last_name || ''}`.trim().toLowerCase();
                    return customerName.includes(tailoredSearchQuery.toLowerCase());
                  });
                }

                // Sort by date (most recent first)
                displayOrders.sort((a, b) => {
                  const dateA = new Date(a.completed_at || a.created_at).getTime();
                  const dateB = new Date(b.completed_at || b.created_at).getTime();
                  return dateB - dateA;
                });

                if (displayOrders.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-600">
                        {tailoredSearchQuery 
                          ? `No orders found for "${tailoredSearchQuery}"` 
                          : 'No tailored orders at the moment'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {displayOrders.map((order) => {
                      const bgColor = order.type === 'preorder' ? 'bg-purple-50 border-purple-200' 
                                    : order.type === 'downpayment' ? 'bg-orange-50 border-orange-200'
                                    : 'bg-green-50 border-green-200';
                      
                      const badgeColor = order.type === 'preorder' ? 'bg-purple-100 text-purple-700'
                                       : order.type === 'downpayment' ? 'bg-orange-100 text-orange-700'
                                       : 'bg-green-100 text-green-700';
                      
                      const badgeLabel = order.type === 'preorder' ? 'PRE-ORDER'
                                       : order.type === 'downpayment' ? 'DOWNPAYMENT'
                                       : 'FULL PAYMENT';

                      return (
                        <div key={order.id} className={`border rounded-lg p-4 ${bgColor}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {order.first_name} {order.last_name}
                              </p>
                              <p className="text-sm text-slate-600">
                                {order.email} • ID: {order.id_number}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Receipt: {order.receipt_no} • {new Date(order.completed_at || order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-slate-900">
                                ₱{parseFloat(order.total_amount).toLocaleString()}
                              </p>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                                order.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : order.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : order.status === 'released'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order.status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white rounded p-3">
                            <p className="text-sm font-semibold text-slate-700 mb-2">Items:</p>
                            <div className="space-y-1">
                              {order.items && order.items.filter((item: any) => {
                                if (order.type === 'preorder') {
                                  return item.orderType === 'preorder' || item.order_type === 'preorder';
                                } else if (order.type === 'downpayment') {
                                  const paymentType = item.paymentType || item.payment_type;
                                  if (paymentType === 'downpayment') return true;
                                  
                                  // For legacy orders without payment_type, check if it's a downpayment based on price
                                  const productName = item.productName || item.product_name || '';
                                  const subtotal = parseFloat(item.subtotal || 0);
                                  
                                  if (productName.includes('Gala') && subtotal === 500) return true;
                                  if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return true;
                                  
                                  return false;
                                } else {
                                  // Full payment
                                  const paymentType = item.paymentType || item.payment_type;
                                  const productName = item.productName || item.product_name || '';
                                  const isTailoredProduct = ['Gala', 'Type A & B Uniform', 'BSNAME Uniform'].some(name => productName.includes(name));
                                  
                                  if (!isTailoredProduct) return false;
                                  if (paymentType === 'full') return true;
                                  if (paymentType === 'downpayment') return false;
                                  
                                  // For legacy orders, check if it's NOT a downpayment price
                                  const subtotal = parseFloat(item.subtotal || 0);
                                  if (productName.includes('Gala') && subtotal === 500) return false;
                                  if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return false;
                                  
                                  return true;
                                }
                              }).map((item: any, idx: number) => (
                                <div key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${badgeColor}`}>
                                    {badgeLabel}
                                  </span>
                                  <p>• {formatProductNameWithVariants(item)} (Qty: {item.quantity}) - ₱{parseFloat(item.subtotal).toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Order Fulfillment Tab */}
        {activeTab === 'fulfillment' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Order Fulfillment</h3>
                <p className="text-sm text-slate-600">Manage pre-orders awaiting fulfillment and downpayment balance collections.</p>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by customer name..."
                    value={fulfillmentSearchQuery}
                    onChange={(e) => setFulfillmentSearchQuery(e.target.value)}
                    onFocus={(e) => {
                      e.currentTarget.style.animation = 'inputBounce 0.3s ease-out';
                      setTimeout(() => {
                        e.currentTarget.style.animation = '';
                      }, 300);
                    }}
                    className="w-full pl-10 pr-4 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Pre-Orders Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={20} className="text-purple-600" />
                  <h4 className="text-md font-semibold text-slate-900">Pre-Orders Awaiting Fulfillment</h4>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">
                    {preOrderOrders.filter(o => {
                      // Only show completed orders that haven't been released yet
                      if (o.status === 'released') return false;
                      if (o.status !== 'completed') return false;
                      if (!fulfillmentSearchQuery) return true;
                      const customerName = `${o.first_name || ''} ${o.last_name || ''}`.toLowerCase();
                      return customerName.includes(fulfillmentSearchQuery.toLowerCase());
                    }).length}
                  </span>
                </div>
                
                {preOrderOrders.filter(o => {
                  // Only show completed orders that haven't been released yet
                  if (o.status === 'released') return false;
                  if (o.status !== 'completed') return false;
                  if (!fulfillmentSearchQuery) return true;
                  const customerName = `${o.first_name || ''} ${o.last_name || ''}`.toLowerCase();
                  return customerName.includes(fulfillmentSearchQuery.toLowerCase());
                }).length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg">
                    <p className="text-slate-500 text-sm">
                      {fulfillmentSearchQuery ? 'No pre-orders found matching your search' : 'No pre-orders awaiting fulfillment'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {preOrderOrders.filter(o => {
                      // Only show completed orders that haven't been released yet
                      if (o.status === 'released') return false;
                      if (o.status !== 'completed') return false;
                      if (!fulfillmentSearchQuery) return true;
                      const customerName = `${o.first_name || ''} ${o.last_name || ''}`.toLowerCase();
                      return customerName.includes(fulfillmentSearchQuery.toLowerCase());
                    }).map((order) => (
                      <div key={order.id} className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-slate-900">
                                {order.first_name} {order.last_name}
                              </p>
                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                                PRE-ORDER
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">
                              {order.email} • ID: {order.id_number}
                            </p>
                            <p className="text-xs text-slate-500">
                              Receipt: {order.receipt_no} • Ordered: {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            
                            {/* Pre-order items */}
                            <div className="mt-3 bg-white rounded p-2">
                              <p className="text-xs font-semibold text-slate-700 mb-1">Items:</p>
                              {order.items && order.items.filter((item: any) => 
                                item.orderType === 'preorder' || item.order_type === 'preorder'
                              ).map((item: any, idx: number) => (
                                <p key={idx} className="text-xs text-slate-600">
                                  • {formatProductNameWithVariants(item)} (Qty: {item.quantity})
                                </p>
                              ))}
                            </div>
                          </div>
                          
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-purple-600 mb-2">
                              ₱{parseFloat(order.total_amount).toLocaleString()}
                            </p>
                            <button
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                              onClick={async () => {
                                try {
                                  await AppDataSync.updateOrderStatus(order.id, 'released', user?.id || '');
                                  showNotification('Order marked as released!', 'success');
                                  // Reload all orders from API to get updated status
                                  await AppDataSync.loadOrdersFromAPI(user?.id || '');
                                  // Then reload pre-orders to update the list
                                  await loadPreOrderOrders();
                                } catch (err) {
                                  console.error('Failed to mark order as released:', err);
                                  showNotification('Failed to mark order as released', 'error');
                                }
                              }}
                            >
                              Mark as Released
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Downpayment Balance Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={20} className="text-orange-600" />
                  <h4 className="text-md font-semibold text-slate-900">Downpayment - Balance Due</h4>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">
                    {downpaymentOrders.filter(o => {
                      if (o.status !== 'completed') return false;
                      if (o.receipt_no && o.receipt_no.startsWith('BAL-')) return false; // Exclude balance payment orders from count
                      
                      // Apply search filter
                      if (fulfillmentSearchQuery) {
                        const customerName = `${o.first_name || ''} ${o.last_name || ''}`.toLowerCase();
                        if (!customerName.includes(fulfillmentSearchQuery.toLowerCase())) return false;
                      }
                      
                      // Check if this order has a completed balance payment
                      const hasCompletedBalancePayment = downpaymentOrders.some(balanceOrder => {
                        if (!balanceOrder.receipt_no || !balanceOrder.receipt_no.startsWith('BAL-')) return false;
                        if (balanceOrder.status !== 'completed') return false;
                        if (balanceOrder.email !== o.email) return false;
                        
                        const downpaymentItems = o.items?.filter((item: any) => {
                          const paymentType = item.paymentType || item.payment_type;
                          if (paymentType === 'downpayment') return true;
                          const productName = item.productName || item.product_name || '';
                          const subtotal = parseFloat(item.subtotal || 0);
                          if (productName.includes('Gala') && subtotal === 500) return true;
                          if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return true;
                          return false;
                        }) || [];
                        
                        return balanceOrder.items?.some((balItem: any) => 
                          downpaymentItems.some((origItem: any) => {
                            const balProductName = balItem.productName || balItem.product_name || '';
                            const origProductName = origItem.productName || origItem.product_name || '';
                            const balBaseName = balProductName.split('(')[0].trim();
                            const origBaseName = origProductName.split('(')[0].trim();
                            return balBaseName.includes(origBaseName) || origBaseName.includes(balBaseName);
                          })
                        );
                      });
                      
                      return !hasCompletedBalancePayment; // Only count orders with remaining balance
                    }).length}
                  </span>
                </div>
                
                {downpaymentOrders.filter(o => {
                  if (o.status !== 'completed') return false;
                  if (!fulfillmentSearchQuery) return true;
                  const customerName = `${o.first_name || ''} ${o.last_name || ''}`.toLowerCase();
                  return customerName.includes(fulfillmentSearchQuery.toLowerCase());
                }).length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg">
                    <p className="text-slate-500 text-sm">
                      {fulfillmentSearchQuery ? 'No downpayment orders found matching your search' : 'No downpayment balances pending'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {downpaymentOrders
                      .filter(o => {
                        if (o.status !== 'completed') return false;
                        if (!fulfillmentSearchQuery) return true;
                        const customerName = `${o.first_name || ''} ${o.last_name || ''}`.toLowerCase();
                        return customerName.includes(fulfillmentSearchQuery.toLowerCase());
                      })
                      .filter(o => {
                        // Exclude balance payment orders (BAL-) from display
                        // They're used for detection but shouldn't be shown as separate cards
                        return !o.receipt_no || !o.receipt_no.startsWith('BAL-');
                      })
                      .map((order) => {
                      // Calculate balance due - handle both explicit payment_type and legacy orders
                      const downpaymentItems = order.items?.filter((item: any) => {
                        const paymentType = item.paymentType || item.payment_type;
                        if (paymentType === 'downpayment') return true;
                        
                        // For legacy orders without payment_type, check if it's a downpayment based on price
                        const productName = item.productName || item.product_name || '';
                        const subtotal = parseFloat(item.subtotal || 0);
                        
                        if (productName.includes('Gala') && subtotal === 500) return true;
                        if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return true;
                        
                        return false;
                      }) || [];
                      
                      // Check if there's a completed balance payment for this order
                      const hasCompletedBalancePayment = downpaymentOrders.some(balanceOrder => {
                        if (!balanceOrder.receipt_no || !balanceOrder.receipt_no.startsWith('BAL-')) return false;
                        if (balanceOrder.status !== 'completed') return false;
                        
                        // Match by user ID/email to ensure it's the same customer
                        if (balanceOrder.email !== order.email) return false;
                        
                        // Check if this balance order is for the same downpayment items
                        return balanceOrder.items?.some((balItem: any) => 
                          downpaymentItems.some((origItem: any) => {
                            const balProductName = balItem.productName || balItem.product_name || '';
                            const origProductName = origItem.productName || origItem.product_name || '';
                            // Match by base product name (before parenthesis)
                            const balBaseName = balProductName.split('(')[0].trim();
                            const origBaseName = origProductName.split('(')[0].trim();
                            return balBaseName.includes(origBaseName) || origBaseName.includes(balBaseName);
                          })
                        );
                      });
                      
                      const totalBalance = downpaymentItems.reduce((sum: number, item: any) => {
                        const paidAmount = parseFloat(item.subtotal || 0);
                        let fullPrice = item.fullPrice || item.full_price;
                        
                        // If no full_price in database, estimate based on product name (for legacy orders)
                        if (!fullPrice) {
                          const productName = item.productName || item.product_name || '';
                          
                          if (productName.includes('Gala')) {
                            const isMember = productName.includes('Member');
                            fullPrice = isMember ? 1150 : 1200;
                          } else if (productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) {
                            fullPrice = 3000;
                          }
                        }
                        
                        const balance = (fullPrice || 0) - paidAmount;
                        return sum + (balance * item.quantity);
                      }, 0);

                      // Check if balance is fully paid (balance is 0 or negative, or has completed balance payment)
                      const isFullyPaid = totalBalance <= 0 || hasCompletedBalancePayment;

                      return (
                        <div key={order.id} className={`border rounded-lg p-4 ${
                          isFullyPaid ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold text-slate-900">
                                  {order.first_name} {order.last_name}
                                </p>
                                {isFullyPaid ? (
                                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">
                                    FULLY PAID
                                  </span>
                                ) : (
                                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">
                                    DOWNPAYMENT
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 mb-1">
                                {order.email} • ID: {order.id_number}
                              </p>
                              <p className="text-xs text-slate-500">
                                Receipt: {order.receipt_no} • Paid: {new Date(order.completed_at || order.created_at).toLocaleDateString()}
                              </p>
                              
                              {/* Show balance payment receipt if fully paid */}
                              {isFullyPaid && hasCompletedBalancePayment && (() => {
                                const balancePaymentOrder = downpaymentOrders.find(balanceOrder => {
                                  if (!balanceOrder.receipt_no || !balanceOrder.receipt_no.startsWith('BAL-')) return false;
                                  if (balanceOrder.status !== 'completed') return false;
                                  if (balanceOrder.email !== order.email) return false;
                                  
                                  return balanceOrder.items?.some((balItem: any) => 
                                    downpaymentItems.some((origItem: any) => {
                                      const balProductName = balItem.productName || balItem.product_name || '';
                                      const origProductName = origItem.productName || origItem.product_name || '';
                                      const balBaseName = balProductName.split('(')[0].trim();
                                      const origBaseName = origProductName.split('(')[0].trim();
                                      return balBaseName.includes(origBaseName) || origBaseName.includes(balBaseName);
                                    })
                                  );
                                });
                                
                                return balancePaymentOrder ? (
                                  <p className="text-xs text-green-600 font-semibold mt-1">
                                    Balance Receipt: {balancePaymentOrder.receipt_no} • Paid: {new Date(balancePaymentOrder.completed_at || balancePaymentOrder.created_at).toLocaleDateString()}
                                  </p>
                                ) : null;
                              })()}
                              
                              {/* Downpayment items with balance */}
                              <div className="mt-3 bg-white rounded p-2">
                                <p className="text-xs font-semibold text-slate-700 mb-1">Items & Balance:</p>
                                {downpaymentItems.map((item: any, idx: number) => {
                                  const paidAmount = parseFloat(item.subtotal || 0);
                                  let fullPrice = item.fullPrice || item.full_price;
                                  
                                  // If no full_price in database, estimate based on product name (for legacy orders)
                                  if (!fullPrice) {
                                    const productName = item.productName || item.product_name || '';
                                    
                                    if (productName.includes('Gala')) {
                                      const isMember = productName.includes('Member');
                                      fullPrice = isMember ? 1150 : 1200;
                                    } else if (productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) {
                                      fullPrice = 3000;
                                    }
                                  }
                                  
                                  const balance = (fullPrice || 0) - paidAmount;
                                  
                                  return (
                                    <div key={idx} className="text-xs text-slate-600 mb-1">
                                      <p>• {formatProductNameWithVariants(item)} (Qty: {item.quantity})</p>
                                      <p className={`ml-3 font-semibold ${isFullyPaid ? 'text-green-600' : 'text-orange-600'}`}>
                                        Paid: ₱{paidAmount.toLocaleString()} | Balance: {isFullyPaid ? '✓ ' : ''}₱{Math.max(0, balance * item.quantity).toLocaleString()}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              {isFullyPaid ? (
                                <>
                                  <p className="text-xs text-slate-600 mb-1">Total Paid:</p>
                                  <p className="text-lg font-bold text-green-600 mb-2">
                                    ₱{downpaymentItems.reduce((sum: number, item: any) => {
                                      let fullPrice = item.fullPrice || item.full_price;
                                      
                                      // If no full_price in database, estimate based on product name (for legacy orders)
                                      if (!fullPrice) {
                                        const productName = item.productName || item.product_name || '';
                                        
                                        if (productName.includes('Gala')) {
                                          const isMember = productName.includes('Member');
                                          fullPrice = isMember ? 1150 : 1200;
                                        } else if (productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) {
                                          fullPrice = 3000;
                                        }
                                      }
                                      
                                      return sum + ((fullPrice || 0) * item.quantity);
                                    }, 0).toLocaleString()}
                                  </p>
                                  <div className="text-xs text-green-600 font-semibold">
                                    ✓ Paid in full
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs text-slate-600 mb-1">Total Balance:</p>
                                  <p className="text-lg font-bold text-orange-600 mb-2">
                                    ₱{Math.max(0, totalBalance).toLocaleString()}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Insurance Revenue Tab */}
        {activeTab === 'insurance' && (
          <div className="space-y-6">
            {/* Revenue Summary Card */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl p-8 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-2">Total Insurance Revenue</p>
                  <p className="text-4xl font-bold">₱{insuranceRevenue.toLocaleString()}</p>
                  <p className="text-purple-100 text-sm mt-2">{insuranceOrders.length} policies sold</p>
                </div>
                <div className="bg-white/20 p-4 rounded-full">
                  <DollarSign size={48} />
                </div>
              </div>
            </div>

            {/* Insurance Orders List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Insurance Payments</h3>
                <p className="text-sm text-slate-600 mt-1">All completed I-CARD insurance payments</p>
              </div>

              <div className="p-6">
                {insuranceOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600 text-lg">No insurance payments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insuranceOrders.map((order: any) => (
                      <div
                        key={order.id}
                        className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-slate-900">
                                {order.first_name} {order.last_name}
                              </h4>
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                Paid
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">
                              ID: {order.id_number}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-600">
                              ₱{parseFloat(order.total_amount).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatPaymentMethod(order.payment_method)}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600 mb-1">Receipt No:</p>
                              <p className="font-semibold text-slate-900">{order.receipt_no}</p>
                            </div>
                            <div>
                              <p className="text-slate-600 mb-1">Payment Date:</p>
                              <p className="font-semibold text-slate-900">
                                {new Date(order.completed_at || order.updated_at || order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
