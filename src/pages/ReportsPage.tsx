import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Filter,
  BarChart3,
  Search,
  Package,
  Layers,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  Tag,
  X,
  Calendar,
  AlertTriangle,
  XCircle,
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../services/api';
import { useAuth } from '../store/authContext';
import { formatProductName, parseAndFormatLegacyProductName } from '../utils/productNameFormatter';

// Default physical lockers fallback
const defaultPhysicalLockers = [
  { id: 'l-1', locker_number: 'MS-13', location: 'Machine Shop', floor: 'Ground Floor', size: 'Medium', status: 'available' },
  { id: 'l-2', locker_number: 'MS-14', location: 'Machine Shop', floor: 'Ground Floor', size: 'Medium', status: 'available' },
  { id: 'l-3', locker_number: 'SL-109', location: 'Seamanship Lab', floor: 'Ground Floor', size: 'Large', status: 'available' },
  { id: 'l-4', locker_number: 'SL-110', location: 'Seamanship Lab', floor: 'Ground Floor', size: 'Large', status: 'available' },
  { id: 'l-5', locker_number: 'BE-201', location: 'Basic Ed', floor: 'Ground Floor', size: 'Small', status: 'available' },
  { id: 'l-6', locker_number: 'BE-202', location: 'Basic Ed', floor: 'Ground Floor', size: 'Small', status: 'available' },
  { id: 'l-7', locker_number: 'AVR-301', location: 'AVR Building', floor: 'Ground Floor', size: 'Medium', status: 'available' },
  { id: 'l-8', locker_number: 'AVR-302', location: 'AVR Building', floor: 'Ground Floor', size: 'Medium', status: 'available' },
];

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    lockerRentals,
    lockers,
    products,
    setLockerRentals,
    setProducts,
  } = useAppStore();

  // Fetch data directly from database
  const [sales, setSales] = useState<any[]>([]);
  const [lockersList, setLockersList] = useState<any[]>(defaultPhysicalLockers);

  // States for Sales report tab filters
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<'all' | 'cash' | 'ewallet'>('all');
  const [salesOrderTypeFilter, setSalesOrderTypeFilter] = useState<'all' | 'regular' | 'preorder' | 'insurance'>('all');
  const [selectedSalesMonth, setSelectedSalesMonth] = useState<string>('all');
  const [monthlySearchQuery, setMonthlySearchQuery] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Product lookup Map for O(1) instant catalog lookup
  const productMapByName = useMemo(() => {
    const map = new Map<string, any>();
    products.forEach(p => {
      if (p.name) {
        const norm = p.name.toLowerCase().trim();
        map.set(norm, p);
        const base = norm.split(' - ')[0].split('(')[0].trim();
        if (base && !map.has(base)) map.set(base, p);
      }
      if (p.id) map.set(p.id, p);
    });
    return map;
  }, [products]);

  // Fetch orders, locker rentals, lockers, and products from API on mount with polling
  useEffect(() => {
    let isSubscribed = true;
    const fetchAllData = async () => {
      try {
        const [orders, rentalsRes, catalog, lockersRes] = await Promise.all([
          apiClient.getAllTransactions(user?.id || '').catch(() => []),
          apiClient.getLockerRentals().catch(() => []),
          apiClient.getProducts().catch(() => []),
          apiClient.getLockers().catch(() => ({ lockers: [] })),
        ]);

        // Merge API rentals with localStorage pending rentals
        const apiRentalsList = Array.isArray(rentalsRes) 
          ? rentalsRes 
          : (Array.isArray(rentalsRes?.rentals) ? rentalsRes.rentals : []);

        let localPendingList: any[] = [];
        try {
          const savedGlobal = localStorage.getItem('coop_global_pending_lockers');
          if (savedGlobal) {
            localPendingList = JSON.parse(savedGlobal);
          }
          // Also scan all localStorage keys for user locker rentals
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('locker_rental_') || key.startsWith('coop_user_rental_'))) {
              try {
                const item = JSON.parse(localStorage.getItem(key) || '{}');
                if (item && (item.rental_id || item.id || item.locker_number || item.lockerId)) {
                  localPendingList.push(item);
                }
              } catch (e) {}
            }
          }
        } catch (e) {}

        const mergedRentals = [...apiRentalsList, ...localPendingList];

        // Deduplicate rentals by rental_id / id or locker_number
        const rentalMap = new Map<string, any>();
        mergedRentals.forEach(r => {
          const key = r.rental_id || r.id || `${r.first_name}_${r.locker_number}`;
          if (key) rentalMap.set(key, r);
        });
        const finalRentals = Array.from(rentalMap.values());

        // Merge physical lockers
        const fetchedLockers = Array.isArray(lockersRes?.lockers) && lockersRes.lockers.length > 0
          ? lockersRes.lockers
          : (Array.isArray(lockersRes) && lockersRes.length > 0 ? lockersRes : defaultPhysicalLockers);

        if (isSubscribed) {
          if (Array.isArray(orders)) {
            setSales(prev => {
              if (prev.length === orders.length && JSON.stringify(prev[0] || {}) === JSON.stringify(orders[0] || {})) {
                return prev;
              }
              return orders;
            });
          }
          setLockerRentals(finalRentals);
          setLockersList(fetchedLockers);
          if (Array.isArray(catalog) && catalog.length > 0) {
            setProducts(catalog);
          }
        }
      } catch (error) {
        // Silent catch
      }
    };

    fetchAllData();

    const interval = setInterval(fetchAllData, 15000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [user?.id, user?.role, setLockerRentals, setProducts, setLockersList]);

  const [reportType, setReportType] = useState<
    'sales' | 'inventory' | 'lockers' | 'income' | 'insurance' | 'classring'
  >('sales');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState<string>('all');
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>('');
  const [insuranceSearchQuery, setInsuranceSearchQuery] = useState<string>('');
  const [insuranceStatusFilter, setInsuranceStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [classRingSearchQuery, setClassRingSearchQuery] = useState<string>('');
  const [classRingStatusFilter, setClassRingStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [showVariantDetails, setShowVariantDetails] = useState<boolean>(true);
  const [salesPaymentTypeFilter, setSalesPaymentTypeFilter] = useState<'all' | 'full' | 'downpayment' | 'balance'>('all');
  const [monthlyLedgerPage, setMonthlyLedgerPage] = useState<number>(1);
  const [monthlyLedgerRowsPerPage, setMonthlyLedgerRowsPerPage] = useState<number>(10);

  useEffect(() => {
    setMonthlyLedgerPage(1);
  }, [selectedSalesMonth, salesPaymentTypeFilter, monthlySearchQuery, showVariantDetails]);

  const isClassRingOrder = (order: any): boolean => {
    if (!order) return false;
    if (order.order_type === 'class_ring') return true;
    if (order.items && Array.isArray(order.items)) {
      return order.items.some((item: any) => {
        const name = (item.product_name || item.productName || item.name || '').toLowerCase();
        return name.includes('class ring') || (name.includes('ring') && !name.includes('pershing'));
      });
    }
    const mainName = (order.product_name || order.productName || order.name || '').toLowerCase();
    return mainName.includes('class ring') || (mainName.includes('ring') && !mainName.includes('pershing'));
  };

  // Memoized completed sales list (excluding Class Rings so Coop revenue is strictly separated)
  const completedSales = useMemo(() => {
    return sales.filter(s => s && (s.status === 'completed' || s.status === 'released') && !isClassRingOrder(s));
  }, [sales]);

  const classRingSales = useMemo(() => {
    return sales.filter(s => s && isClassRingOrder(s));
  }, [sales]);

  const generateSalesReport = () => {
    try {
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

  // Calculate monthly sales data for current year
  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const mData = Array(12).fill(0);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    completedSales.forEach(sale => {
      const raw = sale.completed_at || sale.completedAt || sale.created_at || sale.createdAt || sale.date;
      if (!raw) return;
      const saleDate = new Date(raw);
      if (!isNaN(saleDate.getTime()) && saleDate.getFullYear() === currentYear) {
        const month = saleDate.getMonth();
        const amount = parseFloat(String(sale?.total_amount || sale?.totalAmount || 0));
        mData[month] += isNaN(amount) ? 0 : amount;
      }
    });
    
    return mData.map((revenue, index) => ({
      month: monthNames[index],
      revenue: revenue
    }));
  }, [completedSales]);

  // Memoized Monthly Top-Selling Ledger data calculation
  const {
    availableMonthsMap,
    sortedMonthKeys,
    monthlyTopLedger,
    selectedMonthTotalRev,
    selectedMonthTotalUnits,
    maxMonthlyUnits,
  } = useMemo(() => {
    const monthsMap: { [key: string]: string } = {};
    completedSales.forEach(s => {
      const dateVal = s.completed_at || s.completedAt || s.created_at || s.createdAt || s.date;
      if (dateVal) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          monthsMap[yearMonth] = monthLabel;
        }
      }
    });
    const sortedKeys = Object.keys(monthsMap).sort((a, b) => b.localeCompare(a));

    const selectedSales = completedSales.filter(s => {
      if (selectedSalesMonth === 'all') return true;
      const dateVal = s.completed_at || s.completedAt || s.created_at || s.createdAt || s.date;
      if (!dateVal) return false;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return false;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym === selectedSalesMonth;
    });

    const pMap: { [key: string]: { name: string; category: string; unitsSold: number; revenue: number; price: number; sku?: string; paymentType: 'full' | 'downpayment' | 'balance'; fullPrice?: number } } = {};

    const getGeneralProductName = (item: any, matchedProduct: any): string => {
      if (matchedProduct?.name) return matchedProduct.name;
      const rawName = String(item.productName || item.product_name || item.name || 'General Merchandise').trim();
      let baseName = rawName.split(' - ')[0].split('(')[0].split(':')[0].trim();
      const found = productMapByName.get(baseName.toLowerCase());
      return found?.name || baseName || 'General Merchandise';
    };

    const getItemVariantName = (item: any, matchedProduct: any): string => {
      const rawName = item.productName || item.product_name || item.name || matchedProduct?.name || 'General Merchandise';
      const options = item.selectedOptions || item.options || {};
      const unitPrice = parseFloat(String(item.price || item.unit_price || item.unitPrice || item.cost || matchedProduct?.price || 0)) || (matchedProduct?.price || 0);

      if (rawName.includes('(') && rawName.includes(':')) {
        return parseAndFormatLegacyProductName(rawName, unitPrice);
      }

      return formatProductName(rawName, options, unitPrice);
    };

    const resolveVariantFullPrice = (item: any, matchedProduct: any, variantName: string, unitPrice: number): number => {
      const normVariant = (variantName || '').toLowerCase();
      const rawItemName = String(item?.productName || item?.product_name || item?.name || '').toLowerCase();
      const combined = `${normVariant} ${rawItemName}`;

      // 1. Check if price is explicitly in the variant name or item string e.g. "(₱2,950)" or "(₱2,700)"
      const priceMatch = combined.match(/\(₱\s*([0-9,]+(?:\.\d+)?)\)/i) || combined.match(/₱\s*([0-9,]+(?:\.\d+)?)/i);
      if (priceMatch) {
        const parsed = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (!isNaN(parsed) && parsed > 500) {
          return parsed;
        }
      }

      // 2. Specific Course rules for Type A & B Uniform
      if (combined.includes('type a') || combined.includes('type b') || combined.includes('uniform')) {
        if (combined.includes('bsmt') || combined.includes('bsmare') || combined.includes('maritime')) {
          return 2950;
        }
        if (combined.includes('shs') || combined.includes('stem')) {
          return 2700;
        }
        if (combined.includes('bsname')) {
          return 3150;
        }
      }

      // 3. Gala Bundles
      if (combined.includes('gala')) {
        if (combined.includes('bundle a')) return 1200;
        if (combined.includes('bundle b')) return 1700;
        if (combined.includes('bundle c')) return 2030;
        if (combined.includes('bundle d')) return 2180;
        if (combined.includes('bundle e')) return 2710;
        if (combined.includes('bundle f')) return 2230;
        if (combined.includes('bundle g')) return 2550;
        if (combined.includes('bundle h')) return 1980;
        if (combined.includes('bundle i')) return 1450;
      }

      // 4. Check matched product options choices if available
      if (matchedProduct?.options && Array.isArray(matchedProduct.options)) {
        for (const opt of matchedProduct.options) {
          if (opt.choices && Array.isArray(opt.choices)) {
            for (const choice of opt.choices) {
              const choiceStr = String(choice).toLowerCase();
              const choiceLabel = choiceStr.split('(')[0].trim();
              if (choiceLabel && (combined.includes(choiceLabel))) {
                const optPriceMatch = choiceStr.match(/₱\s*([0-9,]+(?:\.\d+)?)/i);
                if (optPriceMatch) {
                  const p = parseFloat(optPriceMatch[1].replace(/,/g, ''));
                  if (!isNaN(p) && p > 0) return p;
                }
              }
            }
          }
        }
      }

      // 5. Fallback to matched product price or unitPrice
      return matchedProduct?.price || unitPrice;
    };

    selectedSales.forEach(s => {
      const isBalanceOrder = (s.receipt_no && s.receipt_no.startsWith('BAL-')) ||
                             (s.receiptNo && s.receiptNo.startsWith('BAL-')) ||
                             (s.receiptNumber && s.receiptNumber.startsWith('BAL-')) ||
                             s.order_type === 'balance_payment' || s.orderType === 'balance_payment';

      if (s.items && Array.isArray(s.items)) {
        s.items.forEach((item: any) => {
          const rawName = item.productName || item.product_name || item.name || 'General Merchandise';
          const normName = rawName.toLowerCase().trim();
          const baseNormName = rawName.split(' - ')[0].split('(')[0].toLowerCase().trim();
          const matchedProduct = productMapByName.get(normName) || productMapByName.get(baseNormName) || (item.productId ? productMapByName.get(item.productId) : null) || (item.product_id ? productMapByName.get(item.product_id) : null);

          const qty = parseInt(String(item.quantity || item.qty || 1), 10) || 1;
          const unitPrice = parseFloat(String(item.price || item.unit_price || item.unitPrice || item.cost || matchedProduct?.price || 0)) || (matchedProduct?.price || 0);
          const itemSubtotal = parseFloat(String(item.subtotal || item.total_amount || item.totalAmount || (qty * unitPrice))) || (qty * unitPrice);
          const category = matchedProduct?.category || 'general';
          const sku = matchedProduct?.sku || item.sku || '';

          const rawPaymentType = item.paymentType || item.payment_type || s.paymentType || s.payment_type;
          const isTailored = rawName.toLowerCase().includes('uniform') || rawName.toLowerCase().includes('gala');
          const catalogPrice = matchedProduct?.price || 0;

          let paymentType: 'full' | 'downpayment' | 'balance' = 'full';
          if (isBalanceOrder) {
            paymentType = 'balance';
          } else if (rawPaymentType === 'downpayment' || (isTailored && ((unitPrice === 1500 && catalogPrice > 1500) || (unitPrice === 500 && catalogPrice > 500)))) {
            paymentType = 'downpayment';
          }

          if (showVariantDetails) {
            // Detailed Variant Mode: Group by specific variant name & payment type & price point
            const variantName = getItemVariantName(item, matchedProduct);
            const mapKey = `${variantName.toLowerCase().trim()}::${paymentType}::${unitPrice}`;
            const fullPrice = resolveVariantFullPrice(item, matchedProduct, variantName, unitPrice);

            if (!pMap[mapKey]) {
              pMap[mapKey] = { name: variantName, category, unitsSold: 0, revenue: 0, price: unitPrice, sku, paymentType, fullPrice };
            }
            pMap[mapKey].unitsSold += qty;
            pMap[mapKey].revenue += itemSubtotal;
          } else {
            // General Mode: Group strictly by base product name and payment type
            const generalName = getGeneralProductName(item, matchedProduct);
            const mapKey = `${generalName.toLowerCase().trim()}::${paymentType}`;
            const fullPrice = resolveVariantFullPrice(item, matchedProduct, generalName, unitPrice);

            if (!pMap[mapKey]) {
              pMap[mapKey] = { name: generalName, category, unitsSold: 0, revenue: 0, price: matchedProduct?.price || unitPrice, sku, paymentType, fullPrice };
            }
            pMap[mapKey].unitsSold += qty;
            pMap[mapKey].revenue += itemSubtotal;
            if (matchedProduct?.price && paymentType === 'full') {
              pMap[mapKey].price = matchedProduct.price;
            } else if (pMap[mapKey].unitsSold > 0) {
              pMap[mapKey].price = pMap[mapKey].revenue / pMap[mapKey].unitsSold;
            }
          }
        });
      }
    });

    let topLedger = Object.values(pMap).sort((a, b) => {
      if (b.unitsSold !== a.unitsSold) {
        return b.unitsSold - a.unitsSold;
      }
      return b.revenue - a.revenue;
    });

    if (salesPaymentTypeFilter !== 'all') {
      topLedger = topLedger.filter(p => p.paymentType === salesPaymentTypeFilter);
    }

    if (monthlySearchQuery.trim()) {
      const q = monthlySearchQuery.toLowerCase().trim();
      topLedger = topLedger.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }

    const totalRev = topLedger.reduce((sum, p) => sum + p.revenue, 0);
    const totalUnits = topLedger.reduce((sum, p) => sum + p.unitsSold, 0);
    const maxUnits = Math.max(...topLedger.map(p => p.unitsSold), 1);

    return {
      availableMonthsMap: monthsMap,
      sortedMonthKeys: sortedKeys,
      monthlyTopLedger: topLedger,
      selectedMonthTotalRev: totalRev,
      selectedMonthTotalUnits: totalUnits,
      maxMonthlyUnits: maxUnits,
    };
  }, [completedSales, selectedSalesMonth, monthlySearchQuery, productMapByName, showVariantDetails, products, salesPaymentTypeFilter]);

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
      const activeOrPendingRentals = lockerRentals.filter(r => (r.status || r.rental_status) === 'active' || r.payment_status === 'paid' || r.status === 'pending');
      const occupiedLockerCodes = new Set(activeOrPendingRentals.map(r => r.locker_number || r.locker_code || r.lockerId).filter(Boolean));
      
      const totalLockersCount = Math.max((lockersList || lockers || []).length, occupiedLockerCodes.size, 8);
      const occupiedCount = occupiedLockerCodes.size;
      const availableCount = Math.max(0, totalLockersCount - occupiedCount);
      const occupancyRate = totalLockersCount > 0 ? ((occupiedCount / totalLockersCount) * 100).toFixed(1) : '0.0';

      const pendingApps = lockerRentals.filter(r => (r.status === 'pending' || r.rental_status === 'pending') && r.payment_status !== 'paid');
      const activePaid = lockerRentals.filter(r => r.payment_status === 'paid' || r.status === 'active');

      return {
        title: 'Locker Occupancy Report',
        data: [
          { label: 'Total Lockers', value: String(totalLockersCount) },
          { label: 'Available Lockers', value: String(availableCount) },
          { label: 'Occupied Lockers', value: String(occupiedCount) },
          { label: 'Under Maintenance', value: '0' },
          { label: 'Occupancy Rate', value: `${occupancyRate}%` },
          { label: 'Active Rentals', value: String(activePaid.length) },
          { label: 'Pending Applications', value: String(pendingApps.length) },
        ],
      };
    } catch (error) {
      return { title: 'Locker Occupancy Report', data: [] };
    }
  };

  const generateIncomeReport = () => {
    try {
      const completedSales = sales.filter(s => s && (s.status === 'completed' || s.status === 'released'));
      const insuranceOrders = completedSales.filter(s => (s.order_type || s.orderType) === 'insurance');
      const insuranceRev = insuranceOrders.reduce((sum, s) => sum + (parseFloat(String(s.total_amount || s.totalAmount || 0)) || 0), 0);

      const productSalesOrders = completedSales.filter(s => (s.order_type || s.orderType) !== 'insurance');
      const productSalesRev = productSalesOrders.reduce((sum, s) => sum + (parseFloat(String(s.total_amount || s.totalAmount || 0)) || 0), 0);

      const rentalIncome = lockerRentals.reduce((sum, r) => {
        const val = parseFloat(String(r.rental_fee ?? r.rentalFee ?? r.total_amount ?? r.totalAmount ?? r.rental_amount ?? r.amount ?? r.price ?? 250));
        return sum + (isNaN(val) ? 250 : val);
      }, 0);
      const totalIncome = productSalesRev + rentalIncome + insuranceRev;

      return {
        title: 'Income Breakdown Report',
        data: [
          { label: 'Total Gross Income', value: `₱${Number(totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          {
            label: 'Product Sales',
            value: `₱${Number(productSalesRev || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          {
            label: 'Locker Services',
            value: `₱${Number(rentalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          {
            label: 'Student Insurance',
            value: `₱${Number(insuranceRev || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
        ],
      };
    } catch (error) {
      return { title: 'Income Breakdown Report', data: [] };
    }
  };

  const generateInsuranceReport = () => {
    try {
      const insuranceSales = sales.filter((s) => {
        if (!s) return false;
        if (s.order_type === 'insurance' || s.orderType === 'insurance') return true;
        if (s.items && Array.isArray(s.items)) {
          return s.items.some((item: any) => 
            item.productId === 'insurance' || 
            item.product_id === 'insurance' || 
            (item.productName || '').toLowerCase().includes('insurance')
          );
        }
        return false;
      });

      const completedInsurance = insuranceSales.filter(s => s.status === 'completed' || s.status === 'released');
      const pendingInsurance = insuranceSales.filter(s => s.status === 'pending');
      const totalRevenue = completedInsurance.reduce((sum, s) => {
        const amt = parseFloat(String(s.total_amount || s.totalAmount || 100));
        return sum + (isNaN(amt) ? 100 : amt);
      }, 0);

      return {
        title: 'I-CARD Insurance Report',
        data: [
          { label: 'Total Registrations', value: String(insuranceSales.length) },
          { label: 'Approved & Covered', value: String(completedInsurance.length) },
          { label: 'Pending Payment', value: String(pendingInsurance.length) },
          { label: 'Total Insurance Revenue', value: `₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Cash Payments', value: String(completedInsurance.filter(s => (s.payment_method || s.paymentMethod) === 'cash').length) },
          { label: 'GCash Payments', value: String(completedInsurance.filter(s => (s.payment_method || s.paymentMethod) === 'ewallet').length) },
        ],
      };
    } catch (error) {
      return { title: 'I-CARD Insurance Report', data: [] };
    }
  };

  const generateClassRingReport = () => {
    try {
      const totalOrders = classRingSales.length;
      const totalRevenue = classRingSales.reduce((sum, s) => {
        const amount = parseFloat(String(s?.total_amount || s?.totalAmount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      const completedOrders = classRingSales.filter(s => s.status === 'completed' || s.status === 'released').length;
      const pendingOrders = classRingSales.filter(s => s.status === 'pending').length;

      return {
        title: 'Class Ring Orders & Trust Analytics',
        data: [
          { label: 'Total Ring Orders', value: String(totalOrders) },
          { label: 'Total Trust Revenue', value: `₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: 'Completed Orders', value: String(completedOrders) },
          { label: 'Pending Payment', value: String(pendingOrders) },
          { label: 'Segregated Account', value: 'Royal Gem MPC' },
        ],
      };
    } catch (error) {
      return { title: 'Class Ring Orders & Trust Analytics', data: [] };
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
      case 'insurance':
        return generateInsuranceReport();
      case 'classring':
        return generateClassRingReport();
      default:
        return { title: '', data: [] };
    }
  };

  const report = getReport();

  // Add guard to prevent rendering errors before data loads
  if (!report || !report.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] p-4 sm:p-6 animate-slide-in-right">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] p-4 sm:p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">Comprehensive system reports and insights</p>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { id: 'sales', label: 'Sales' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'lockers', label: 'Locker Occupancy' },
            { id: 'income', label: 'Income Breakdown' },
            { id: 'insurance', label: 'Insurance' },
            { id: 'classring', label: 'Class Ring' },
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
                    | 'insurance'
                    | 'classring'
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
                const reportData = getReport();
                let csvRows: string[][] = [
                  [reportData.title],
                  [`Generated On: ${new Date().toLocaleDateString()}`],
                  [''],
                  ['SUMMARY METRICS'],
                  ['Metric', 'Value'],
                  ...reportData.data.map(item => [item.label, `"${String(item.value).replace(/"/g, '""')}"`])
                ];

                if (reportType === 'sales') {
                  const completedSales = sales.filter(s => s && (s.status === 'completed' || s.status === 'released'));
                  const selectedMonthSales = completedSales.filter(s => {
                    if (selectedSalesMonth === 'all') return true;
                    const dateVal = s.created_at || s.createdAt;
                    if (!dateVal) return false;
                    const d = new Date(dateVal);
                    if (isNaN(d.getTime())) return false;
                    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    return ym === selectedSalesMonth;
                  });

                  const monthlyMap: { [key: string]: { name: string; category: string; unitsSold: number; revenue: number; price: number; paymentType: string } } = {};
                  selectedMonthSales.forEach(s => {
                    const isBalanceOrder = (s.receipt_no && s.receipt_no.startsWith('BAL-')) ||
                                           (s.receiptNo && s.receiptNo.startsWith('BAL-')) ||
                                           (s.receiptNumber && s.receiptNumber.startsWith('BAL-')) ||
                                           s.order_type === 'balance_payment' || s.orderType === 'balance_payment';

                    if (s.items && Array.isArray(s.items)) {
                      s.items.forEach((item: any) => {
                        const rawName = item.productName || item.product_name || item.name || 'General Merchandise';
                        const matchedProduct = products.find(p => (p.name || '').toLowerCase().trim() === (rawName || '').toLowerCase().trim() || (item.productId && p.id === item.productId) || (item.product_id && p.id === item.product_id));
                        
                        const options = item.selectedOptions || item.options || {};
                        const unitPrice = parseFloat(String(item.price || item.unit_price || item.unitPrice || item.cost || matchedProduct?.price || 0)) || (matchedProduct?.price || 0);

                        const qty = parseInt(String(item.quantity || item.qty || 1), 10) || 1;
                        const subtotal = parseFloat(String(item.subtotal || item.total_amount || item.totalAmount || 0)) || (qty * unitPrice);
                        const category = matchedProduct?.category || 'general';

                        const rawPaymentType = item.paymentType || item.payment_type || s.paymentType || s.payment_type;
                        const isTailored = rawName.toLowerCase().includes('uniform') || rawName.toLowerCase().includes('gala');
                        const catalogPrice = matchedProduct?.price || 0;

                        let pTypeStr = 'Full Payment';
                        if (isBalanceOrder) {
                          pTypeStr = 'Balance Settlement';
                        } else if (rawPaymentType === 'downpayment' || (isTailored && ((unitPrice === 1500 && catalogPrice > 1500) || (unitPrice === 500 && catalogPrice > 500)))) {
                          pTypeStr = 'Downpayment';
                        }

                        if (showVariantDetails) {
                          let variantName = formatProductName(rawName, options, unitPrice);
                          if (rawName.includes('(') && rawName.includes(':')) {
                            variantName = parseAndFormatLegacyProductName(rawName, unitPrice);
                          }
                          const mapKey = `${variantName.toLowerCase().trim()}::${pTypeStr}::${unitPrice}`;

                          if (!monthlyMap[mapKey]) {
                            monthlyMap[mapKey] = { name: variantName, category, unitsSold: 0, revenue: 0, price: unitPrice, paymentType: pTypeStr };
                          }
                          if (!isBalanceOrder) {
                            monthlyMap[mapKey].unitsSold += qty;
                          }
                          monthlyMap[mapKey].revenue += subtotal > 0 ? subtotal : (unitPrice * qty);
                        } else {
                          const generalName = matchedProduct?.name || (rawName.includes('(') ? rawName.split('(')[0] : rawName.split(' - ')[0]).trim();
                          const mapKey = `${generalName.toLowerCase().trim()}::${pTypeStr}`;

                          if (!monthlyMap[mapKey]) {
                            monthlyMap[mapKey] = { name: generalName, category, unitsSold: 0, revenue: 0, price: matchedProduct?.price || unitPrice, paymentType: pTypeStr };
                          }
                          if (!isBalanceOrder) {
                            monthlyMap[mapKey].unitsSold += qty;
                          }
                          monthlyMap[mapKey].revenue += subtotal > 0 ? subtotal : (unitPrice * qty);
                          if (matchedProduct?.price && pTypeStr === 'Full Payment') {
                            monthlyMap[mapKey].price = matchedProduct.price;
                          } else if (monthlyMap[mapKey].unitsSold > 0) {
                            monthlyMap[mapKey].price = monthlyMap[mapKey].revenue / monthlyMap[mapKey].unitsSold;
                          }
                        }
                      });
                    }
                  });

                  const topLedger = Object.values(monthlyMap).sort((a, b) => {
                    if (b.unitsSold !== a.unitsSold) {
                      return b.unitsSold - a.unitsSold;
                    }
                    return b.revenue - a.revenue;
                  });

                  csvRows.push(
                    [''],
                    [`MONTHLY TOP-SELLING PRODUCTS LEDGER (${selectedSalesMonth.toUpperCase()})`],
                    ['Rank', 'Product Name', 'Payment Type', 'Category', 'Units Sold', 'Unit Price (PHP)', 'Total Revenue (PHP)'],
                    ...topLedger.map((prod, idx) => [
                      `#${idx + 1}`,
                      `"${prod.name.replace(/"/g, '""')}"`,
                      prod.paymentType.toUpperCase(),
                      prod.category.toUpperCase(),
                      String(prod.unitsSold),
                      prod.price.toFixed(2),
                      prod.revenue.toFixed(2)
                    ])
                  );
                }

                if (reportType === 'classring') {
                  csvRows.push(
                    [''],
                    ['CLASS RING PURCHASES LEDGER (ROYAL GEM TRUST ACCOUNT)'],
                    ['Receipt No', 'Cadet Name', 'Contact Number', 'Contact Address', 'Program', 'Grad Year', 'Model', 'Ring Size', 'Material', 'Finish', 'Birthstone', 'Inside Engraving', 'Total Price', 'Method', 'Status', 'Date'],
                    ...classRingSales.map((s) => {
                      const item = s.items?.[0] || {};
                      const opts = item.selectedOptions || s.selectedOptions || {};
                      const cadetName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.walk_in_name || 'N/A';
                      return [
                        s.receipt_no || 'N/A',
                        `"${cadetName.replace(/"/g, '""')}"`,
                        `"${(opts['Contact Number'] || s.contact_number || 'N/A').replace(/"/g, '""')}"`,
                        `"${(opts['Contact Address'] || s.address || 'N/A').replace(/"/g, '""')}"`,
                        opts['Degree/Program'] || s.course || 'BSMT',
                        opts['Graduation Year'] || '2026',
                        opts['Model'] || 'Medium',
                        opts['Ring Size'] || 'Size 8',
                        opts['Material'] || 'Stainless Steel',
                        opts['Finish'] || 'Natural Gold',
                        opts['Birthstone'] || 'September',
                        `"${(opts['Inside Engraving'] || 'None').replace(/"/g, '""')}"`,
                        parseFloat(s.total_amount || 0).toFixed(2),
                        s.payment_method === 'cash' ? 'Cash' : 'GCash',
                        s.status,
                        new Date(s.created_at || s.createdAt).toLocaleDateString()
                      ];
                    })
                  );
                }

                const csvContent = csvRows.map(row => row.join(',')).join('\n');
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

          <div className="p-8 space-y-8">
            {/* Enhanced KPI Summary Cards Grid for Inventory and Lockers tabs at TOP */}
            {(reportType === 'inventory' || reportType === 'lockers') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in mb-6">
                {report.data.map((item, idx) => {
                  let icon = <Package size={18} />;
                  let borderStyle = "border-purple-200 hover:border-purple-400";
                  let textStyle = "text-purple-700";
                  let iconBg = "bg-purple-100 text-purple-700";

                  const labelLower = item.label.toLowerCase();

                  if (labelLower.includes('total products') || labelLower.includes('occupancy rate')) {
                    icon = <Package size={18} />;
                    borderStyle = "border-purple-200 hover:border-purple-400";
                    textStyle = "text-purple-700";
                    iconBg = "bg-purple-100 text-purple-700";
                  } else if (labelLower.includes('units in stock') || labelLower.includes('total lockers')) {
                    icon = <Layers size={18} />;
                    borderStyle = "border-emerald-200 hover:border-emerald-400";
                    textStyle = "text-emerald-700";
                    iconBg = "bg-emerald-100 text-emerald-700";
                  } else if (labelLower.includes('low stock')) {
                    icon = <AlertTriangle size={18} />;
                    borderStyle = "border-amber-200 hover:border-amber-400";
                    textStyle = "text-amber-700";
                    iconBg = "bg-amber-100 text-amber-700";
                  } else if (labelLower.includes('out of stock') || labelLower.includes('available')) {
                    icon = <XCircle size={18} />;
                    borderStyle = "border-rose-200 hover:border-rose-400";
                    textStyle = "text-rose-700";
                    iconBg = "bg-rose-100 text-rose-700";
                  } else if (labelLower.includes('value') || labelLower.includes('revenue') || labelLower.includes('rented')) {
                    icon = <TrendingUp size={18} />;
                    borderStyle = "border-blue-200 hover:border-blue-400";
                    textStyle = "text-blue-700";
                    iconBg = "bg-blue-100 text-blue-700";
                  }

                  return (
                    <div
                      key={idx}
                      className={`bg-white border-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${borderStyle}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                          {item.label}
                        </span>
                        <div className={`p-2 rounded-xl ${iconBg}`}>
                          {icon}
                        </div>
                      </div>
                      <div className="mt-3 min-w-0">
                        <h4 
                          className={`font-black tracking-tight truncate max-w-full ${textStyle} ${
                            String(item.value).length > 12
                              ? 'text-base sm:text-lg'
                              : String(item.value).length > 9
                              ? 'text-lg sm:text-xl'
                              : 'text-xl sm:text-2xl'
                          }`}
                          title={String(item.value)}
                        >
                          {item.value}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sales Analytics & Detailed Breakdown Dashboard */}
            {reportType === 'sales' && (() => {
              // Filter sales list based on selected sales month
              const periodSalesList = completedSales.filter(s => {
                if (selectedSalesMonth === 'all') return true;
                const dateVal = s.created_at || s.createdAt || s.date;
                if (!dateVal) return false;
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return false;
                const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return ym === selectedSalesMonth;
              });

              const totalSalesCount = periodSalesList.length;
              const totalRevenue = periodSalesList.reduce((sum, s) => {
                const amount = parseFloat(String(s?.total_amount || s?.totalAmount || 0));
                return sum + (isNaN(amount) ? 0 : amount);
              }, 0);
              const avgTransaction = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

              const cashOrders = periodSalesList.filter(s => (s?.payment_method || s?.paymentMethod) === 'cash');
              const cashRevenue = cashOrders.reduce((sum, s) => sum + (parseFloat(String(s?.total_amount || s?.totalAmount || 0)) || 0), 0);

              const gcashOrders = periodSalesList.filter(s => (s?.payment_method || s?.paymentMethod) === 'ewallet' || (s?.payment_method || s?.paymentMethod) === 'gcash');
              const gcashRevenue = gcashOrders.reduce((sum, s) => sum + (parseFloat(String(s?.total_amount || s?.totalAmount || 0)) || 0), 0);

              const preorderOrders = periodSalesList.filter(s => s?.order_type === 'preorder' || s?.orderType === 'preorder');
              const preorderRevenue = preorderOrders.reduce((sum, s) => sum + (parseFloat(String(s?.total_amount || s?.totalAmount || 0)) || 0), 0);

              const rawCashPct = totalRevenue > 0 ? (cashRevenue / totalRevenue) * 100 : 0;
              const rawGcashPct = totalRevenue > 0 ? (gcashRevenue / totalRevenue) * 100 : 0;

              const formatPercent = (val: number) => {
                if (val === 0) return '0%';
                if (val > 0 && val < 1) return `${val.toFixed(1)}%`;
                return `${Math.round(val)}%`;
              };

              const cashPercentStr = formatPercent(rawCashPct);
              const gcashPercentStr = formatPercent(rawGcashPct);

              // Monthly Data Graph Coordinates
              const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);
              const chartHeight = 360;
              const chartWidth = 980;
              const padding = { top: 35, right: 50, bottom: 50, left: 85 };
              const graphHeight = chartHeight - padding.top - padding.bottom;
              const graphWidth = chartWidth - padding.left - padding.right;

              const points = monthlyData.map((data, index) => {
                const x = padding.left + (index / (monthlyData.length - 1)) * graphWidth;
                const y = padding.top + graphHeight - (data.revenue / maxRevenue) * graphHeight;
                return { x, y, ...data };
              });

              const smoothPath = points.map((point, index) => {
                if (index === 0) return `M ${point.x} ${point.y}`;
                const prevPoint = points[index - 1];
                const cpX = (prevPoint.x + point.x) / 2;
                return `Q ${cpX} ${prevPoint.y}, ${point.x} ${point.y}`;
              }).join(' ');

              const areaPath = `${smoothPath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

              return (
                <div className="space-y-8 animate-fade-in mb-8">
                  {/* Enhanced Dynamic KPI Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Card 1: Total Revenue */}
                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-transform" onClick={() => setSalesPaymentFilter('all')}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                          {selectedSalesMonth === 'all' ? 'Total Revenue (YTD)' : `${availableMonthsMap[selectedSalesMonth]} Revenue`}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                          <TrendingUp size={22} className="text-emerald-300" />
                        </div>
                      </div>
                      <div className="mt-4 min-w-0">
                        <h3 
                          className={`font-black tracking-tight truncate max-w-full ${
                            (`₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).length > 13
                              ? 'text-base sm:text-lg lg:text-xl'
                              : (`₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).length > 10
                              ? 'text-lg sm:text-xl lg:text-2xl'
                              : 'text-2xl sm:text-3xl'
                          }`}
                          title={`₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        >
                          ₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs text-purple-200 mt-1 font-medium truncate">Gross sales across all channels</p>
                      </div>
                    </div>

                    {/* Card 2: Total Transactions */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer hover:border-purple-300" onClick={() => setSalesPaymentFilter('all')}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Transactions</span>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                          <ShoppingBag size={20} />
                        </div>
                      </div>
                      <div className="mt-4 min-w-0">
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 truncate max-w-full">
                          {totalSalesCount.toLocaleString()}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium truncate">Fulfilled completed orders</p>
                      </div>
                    </div>

                    {/* Card 3: Average Order Value */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Order</span>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <CreditCard size={20} />
                        </div>
                      </div>
                      <div className="mt-4 min-w-0">
                        <h3 
                          className={`font-black text-slate-900 tracking-tight truncate max-w-full ${
                            (`₱${avgTransaction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).length > 13
                              ? 'text-base sm:text-lg lg:text-xl'
                              : (`₱${avgTransaction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).length > 10
                              ? 'text-lg sm:text-xl lg:text-2xl'
                              : 'text-2xl sm:text-3xl'
                          }`}
                          title={`₱${avgTransaction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        >
                          ₱{avgTransaction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium truncate">Average sales amount per receipt</p>
                      </div>
                    </div>

                    {/* Card 4: Pre-Orders & Custom Orders */}
                    <div className={`bg-white border-2 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer ${
                      salesOrderTypeFilter === 'preorder' ? 'border-amber-500 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-amber-300'
                    }`} onClick={() => setSalesOrderTypeFilter(prev => prev === 'preorder' ? 'all' : 'preorder')}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pre-Order Sales</span>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Tag size={20} />
                        </div>
                      </div>
                      <div className="mt-4 min-w-0">
                        <h3 
                          className={`font-black text-slate-900 tracking-tight truncate max-w-full ${
                            (`₱${preorderRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).length > 13
                              ? 'text-base sm:text-lg lg:text-xl'
                              : (`₱${preorderRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).length > 10
                              ? 'text-lg sm:text-xl lg:text-2xl'
                              : 'text-2xl sm:text-3xl'
                          }`}
                          title={`₱${preorderRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        >
                          ₱{preorderRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 font-medium truncate">{preorderOrders.length} pre-ordered items fulfilled</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Breakdown Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cash Breakdown Card */}
                    <div className={`bg-white border-2 rounded-2xl p-6 shadow-md flex items-center space-x-5 transition-all cursor-pointer ${
                      salesPaymentFilter === 'cash' ? 'border-emerald-500 ring-2 ring-emerald-400/30' : 'border-emerald-100 hover:border-emerald-300'
                    }`} onClick={() => setSalesPaymentFilter(prev => prev === 'cash' ? 'all' : 'cash')}>
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <Banknote size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Cash Payment Channel</span>
                          <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">{cashPercentStr} of Sales</span>
                        </div>
                        <h4 
                          className={`font-black text-slate-900 mt-1 truncate max-w-full ${
                            (`₱${cashRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).length > 13
                              ? 'text-base sm:text-lg'
                              : (`₱${cashRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).length > 10
                              ? 'text-lg sm:text-xl'
                              : 'text-xl sm:text-2xl'
                          }`}
                          title={`₱${cashRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        >
                          ₱{cashRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                          {cashOrders.length.toLocaleString()} total cash payments processed
                        </p>
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, rawCashPct))}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* GCash / E-Wallet Breakdown Card */}
                    <div className={`bg-white border-2 rounded-2xl p-6 shadow-md flex items-center space-x-5 transition-all cursor-pointer ${
                      salesPaymentFilter === 'ewallet' ? 'border-blue-500 ring-2 ring-blue-400/30' : 'border-blue-100 hover:border-blue-300'
                    }`} onClick={() => setSalesPaymentFilter(prev => prev === 'ewallet' ? 'all' : 'ewallet')}>
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                        <Smartphone size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">GCash / E-Wallet Channel</span>
                          <span className="text-xs font-black bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">{gcashPercentStr} of Sales</span>
                        </div>
                        <h4 
                          className={`font-black text-slate-900 mt-1 truncate max-w-full ${
                            (`₱${gcashRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).length > 13
                              ? 'text-base sm:text-lg'
                              : (`₱${gcashRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).length > 10
                              ? 'text-lg sm:text-xl'
                              : 'text-xl sm:text-2xl'
                          }`}
                          title={`₱${gcashRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        >
                          ₱{gcashRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {gcashOrders.length.toLocaleString()} total digital payments processed
                        </p>
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, rawGcashPct))}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Sales Line Chart */}
                  <div className="bg-gradient-to-br from-green-50 via-white to-purple-50 border-2 border-purple-200 rounded-2xl p-8 shadow-xl overflow-x-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">Monthly Sales Trend</h3>
                        <p className="text-slate-600 text-sm mt-1">Year {new Date().getFullYear()} Revenue Performance & Growth</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                          <span className="text-sm text-slate-600 font-semibold">Revenue</span>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl border border-purple-200 shadow-xs">
                          <span className="text-xs text-slate-500 font-medium block">Total YTD</span>
                          <p className="text-lg font-extrabold text-purple-700">
                            ₱{monthlyData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <svg width={chartWidth} height={chartHeight} className="mx-auto" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))' }}>
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
                      </defs>

                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padding.top + graphHeight * (1 - ratio);
                        return (
                          <g key={ratio}>
                            <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e0e7ff" strokeWidth="1" strokeDasharray="4 4" />
                            <text x={padding.left - 15} y={y + 5} textAnchor="end" className="text-xs fill-slate-500 font-semibold">
                              ₱{(maxRevenue * ratio).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </text>
                          </g>
                        );
                      })}

                      <path d={areaPath} fill="url(#areaGradient)" className="animate-fade-in" />
                      <path d={smoothPath} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                      {points.map((point, index) => (
                        <g key={`point-${index}`} className="cursor-pointer group">
                          <circle cx={point.x} cy={point.y} r="12" fill="#8b5cf6" opacity="0" className="group-hover:opacity-20 transition-all duration-300" />
                          <circle cx={point.x} cy={point.y} r="6" fill="white" stroke="#8b5cf6" strokeWidth="3" className="group-hover:r-8 transition-all duration-300" />
                          <text x={point.x} y={chartHeight - padding.bottom + 25} textAnchor="middle" className="text-sm fill-slate-700 font-bold">
                            {point.month}
                          </text>
                        </g>
                      ))}

                      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                      <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Monthly Top-Selling Products Ledger */}
                  <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900">
                          Monthly Top-Selling Products Ledger
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Performance breakdown of best-selling merchandise for each selected billing period.
                        </p>
                      </div>

                      {/* Controls: Search Input & Month Dropdown */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative flex-1 sm:w-64">
                          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filter by product name..."
                            value={monthlySearchQuery}
                            onChange={e => setMonthlySearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                          />
                          {monthlySearchQuery && (
                            <button onClick={() => setMonthlySearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        {/* View Mode Toggle: General vs Detailed Variants */}
                        <div className="flex items-center gap-1 bg-purple-50/80 border border-purple-200 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setShowVariantDetails(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              !showVariantDetails
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-purple-700 hover:text-purple-900'
                            }`}
                          >
                            General View
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowVariantDetails(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              showVariantDetails
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-purple-700 hover:text-purple-900'
                            }`}
                          >
                            Detailed Variants
                          </button>
                        </div>

                        {/* Month Dropdown / Selector */}
                        <select
                          value={selectedSalesMonth}
                          onChange={e => setSelectedSalesMonth(e.target.value)}
                          className="px-4 py-2 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 bg-purple-50/80 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                        >
                          <option value="all">All Months (Year-to-Date)</option>
                          {sortedMonthKeys.map(ym => (
                            <option key={ym} value={ym}>
                              {availableMonthsMap[ym]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Month Selector & Payment Type Quick Pills */}
                    <div className="space-y-3 mb-6 border-b border-slate-100 pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                          <Calendar size={14} /> Filter Month:
                        </span>
                        <button
                          onClick={() => setSelectedSalesMonth('all')}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                            selectedSalesMonth === 'all'
                              ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-600/30'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          All Months (YTD)
                        </button>
                        {sortedMonthKeys.map(ym => (
                          <button
                            key={ym}
                            onClick={() => setSelectedSalesMonth(ym)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                              selectedSalesMonth === ym
                                ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-600/30'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {availableMonthsMap[ym]}
                          </button>
                        ))}
                      </div>

                      {/* Payment Type Quick Filter */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                          <Filter size={14} /> Payment Type:
                        </span>
                        <button
                          onClick={() => setSalesPaymentTypeFilter('all')}
                          className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                            salesPaymentTypeFilter === 'all'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          All Transactions
                        </button>
                        <button
                          onClick={() => setSalesPaymentTypeFilter('full')}
                          className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                            salesPaymentTypeFilter === 'full'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Full Payments
                        </button>
                        <button
                          onClick={() => setSalesPaymentTypeFilter('downpayment')}
                          className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                            salesPaymentTypeFilter === 'downpayment'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          Downpayments
                        </button>
                        <button
                          onClick={() => setSalesPaymentTypeFilter('balance')}
                          className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                            salesPaymentTypeFilter === 'balance'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          Balance Settlements
                        </button>
                      </div>
                    </div>

                    {/* Period Summary Stats Banner */}
                    <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 border border-purple-100 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                          <BarChart3 size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">
                            {selectedSalesMonth === 'all' ? 'All Months (YTD) Performance' : `${availableMonthsMap[selectedSalesMonth]} Ranking`}
                          </h4>
                          <span className="text-xs text-slate-500 font-medium">
                            {monthlyTopLedger.length} product entry line{monthlyTopLedger.length === 1 ? '' : 's'} in this view
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                        <div className="bg-white px-3.5 py-1.5 rounded-lg border border-purple-200 shadow-2xs">
                          <span className="text-slate-500 font-medium">Period Sales: </span>
                          <strong className="text-purple-700 text-sm font-black">
                            ₱{selectedMonthTotalRev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <div className="bg-white px-3.5 py-1.5 rounded-lg border border-purple-200 shadow-2xs">
                          <span className="text-slate-500 font-medium">Units Sold: </span>
                          <strong className="text-slate-900 text-sm font-black">
                            {selectedMonthTotalUnits.toLocaleString()} units
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Top-Selling Products Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-bold text-xs">
                            <th className="py-3.5 px-4 text-center w-16">Rank</th>
                            <th className="py-3.5 px-4">Product Name</th>
                            <th className="py-3.5 px-4 text-center">Payment Stage</th>
                            <th className="py-3.5 px-4 text-center">Category</th>
                            <th className="py-3.5 px-4 text-center">Units Sold (Monthly)</th>
                            <th className="py-3.5 px-4 text-right">Unit Price</th>
                            <th className="py-3.5 px-4 text-right">Monthly Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(() => {
                            const totalLedgerItems = monthlyTopLedger.length;
                            const totalLedgerPages = Math.max(1, Math.ceil(totalLedgerItems / monthlyLedgerRowsPerPage));
                            const effectiveLedgerPage = Math.min(monthlyLedgerPage, totalLedgerPages);
                            const paginatedLedger = monthlyTopLedger.slice(
                              (effectiveLedgerPage - 1) * monthlyLedgerRowsPerPage,
                              effectiveLedgerPage * monthlyLedgerRowsPerPage
                            );

                            if (totalLedgerItems === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} className="py-10 text-center text-slate-500 font-medium">
                                    <Package size={40} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-base font-semibold text-slate-700">No sales recorded for this filter</p>
                                    <p className="text-xs text-slate-400 mt-1">Select another month or payment type from the options above</p>
                                  </td>
                                </tr>
                              );
                            }

                            return paginatedLedger.map((prod, idx) => {
                              const overallRank = (effectiveLedgerPage - 1) * monthlyLedgerRowsPerPage + idx;
                              const unitPercent = Math.min(100, Math.round((prod.unitsSold / maxMonthlyUnits) * 100));

                              let rankBadge = <span className="font-bold text-slate-500">#{overallRank + 1}</span>;
                              if (overallRank === 0) rankBadge = <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs">🥇 #1</span>;
                              else if (overallRank === 1) rankBadge = <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-200 text-slate-900 border border-slate-300 font-black text-xs">🥈 #2</span>;
                              else if (overallRank === 2) rankBadge = <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-800 text-amber-100 font-black text-xs">🥉 #3</span>;

                              return (
                                <tr key={`${prod.name}-${prod.paymentType}-${prod.price}-${prod.unitsSold}-${showVariantDetails}-${overallRank}`} className="hover:bg-purple-50/40 transition-colors">
                                  <td className="py-3.5 px-4 text-center">
                                    {rankBadge}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-900">{prod.name}</div>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                      {prod.sku && <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">{prod.sku}</span>}
                                      {prod.paymentType === 'downpayment' && prod.fullPrice && prod.fullPrice > prod.price && (
                                        <span className="text-[11px] text-amber-700 font-bold">
                                          (Downpayment Deposit • Full: ₱{prod.fullPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                                        </span>
                                      )}
                                      {prod.paymentType === 'balance' && (
                                        <span className="text-[11px] text-emerald-700 font-bold">
                                          (Remaining Balance Settlement)
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                    {prod.paymentType === 'downpayment' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                        DOWNPAYMENT
                                      </span>
                                    ) : prod.paymentType === 'balance' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                        BALANCE SETTLEMENT
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                        Full Payment
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 uppercase">
                                      {prod.category}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-center max-w-[180px]">
                                    <div className="font-extrabold text-slate-900 text-sm">
                                      {prod.unitsSold.toLocaleString()} {prod.paymentType === 'balance' ? 'settlements' : 'units'}
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                      <div className={`h-full rounded-full transition-all duration-500 ${prod.paymentType === 'downpayment' ? 'bg-amber-500' : prod.paymentType === 'balance' ? 'bg-emerald-500' : 'bg-purple-600'}`} style={{ width: `${unitPercent}%` }} />
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-medium text-slate-700 whitespace-nowrap">
                                    ₱{prod.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-black text-purple-700 whitespace-nowrap text-base">
                                    ₱{prod.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>

                      {/* Pagination Controls Footer Bar */}
                      {monthlyTopLedger.length > 0 && (() => {
                        const totalLedgerItems = monthlyTopLedger.length;
                        const totalLedgerPages = Math.max(1, Math.ceil(totalLedgerItems / monthlyLedgerRowsPerPage));
                        const effectiveLedgerPage = Math.min(monthlyLedgerPage, totalLedgerPages);

                        return (
                          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                              <span>
                                Showing <strong className="text-slate-900 font-bold">{(effectiveLedgerPage - 1) * monthlyLedgerRowsPerPage + 1}</strong> to <strong className="text-slate-900 font-bold">{Math.min(effectiveLedgerPage * monthlyLedgerRowsPerPage, totalLedgerItems)}</strong> of <strong className="text-slate-900 font-bold">{totalLedgerItems}</strong> product entries
                              </span>

                              <div className="flex items-center gap-1.5 sm:border-l sm:border-slate-200 sm:pl-3">
                                <span className="text-slate-500">Rows:</span>
                                <select
                                  value={monthlyLedgerRowsPerPage}
                                  onChange={(e) => {
                                    setMonthlyLedgerRowsPerPage(Number(e.target.value));
                                    setMonthlyLedgerPage(1);
                                  }}
                                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                                >
                                  <option value={10}>10</option>
                                  <option value={20}>20</option>
                                  <option value={50}>50</option>
                                  <option value={100}>100</option>
                                </select>
                              </div>
                            </div>

                            {/* Page Nav */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setMonthlyLedgerPage(prev => Math.max(1, prev - 1))}
                                disabled={effectiveLedgerPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Previous Page"
                              >
                                <ChevronLeft size={15} />
                                <span className="hidden sm:inline">Prev</span>
                              </button>

                              <div className="flex items-center gap-1">
                                {Array.from({ length: totalLedgerPages }, (_, i) => i + 1)
                                  .filter(pageNum => {
                                    if (totalLedgerPages <= 7) return true;
                                    if (pageNum === 1 || pageNum === totalLedgerPages) return true;
                                    return Math.abs(pageNum - effectiveLedgerPage) <= 1;
                                  })
                                  .map((pageNum, i, arr) => {
                                    const prev = arr[i - 1];
                                    const showEllipsis = prev && pageNum - prev > 1;
                                    return (
                                      <React.Fragment key={pageNum}>
                                        {showEllipsis && <span className="px-1 text-xs text-slate-400 font-bold">...</span>}
                                        <button
                                          onClick={() => setMonthlyLedgerPage(pageNum)}
                                          className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            effectiveLedgerPage === pageNum
                                              ? 'bg-purple-600 text-white shadow-xs'
                                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                          }`}
                                        >
                                          {pageNum}
                                        </button>
                                      </React.Fragment>
                                    );
                                  })}
                              </div>

                              <button
                                onClick={() => setMonthlyLedgerPage(prev => Math.min(totalLedgerPages, prev + 1))}
                                disabled={effectiveLedgerPage === totalLedgerPages}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Next Page"
                              >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight size={15} />
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Inventory Breakdown & Detailed Table */}
            {reportType === 'inventory' && (() => {
              const categories = ['uniform', 'accessory', 'equipment', 'service', 'essentials'];

              // Helper for category label
              const getCatLabel = (cat: string) => (cat === 'equipment' || cat === 'ppe') ? 'PPE' : (cat === 'grocery' || cat === 'essentials' || cat === 'groceries') ? 'Essentials' : (cat.charAt(0).toUpperCase() + cat.slice(1));

              // Helper for category match
              const isCategoryMatch = (pCat: string = '', tCat: string = '') => {
                const p = (pCat || '').toLowerCase().trim();
                const t = (tCat || '').toLowerCase().trim();
                if (t === 'all') return true;
                if (p === t) return true;
                if ((t === 'equipment' || t === 'ppe') && (p === 'equipment' || p === 'ppe')) return true;
                if ((t === 'essentials' || t === 'grocery' || t === 'groceries') && (p === 'essentials' || p === 'grocery' || p === 'groceries')) return true;
                return false;
              };

              // Filter products based on category tab & search query
              const filteredProducts = products.filter(p => {
                const matchesCat = isCategoryMatch(p.category, selectedInventoryCategory);
                
                if (!matchesCat) return false;
                if (!inventorySearchQuery.trim()) return true;

                const q = inventorySearchQuery.toLowerCase().trim();
                return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
              });

              // Group products by category
              const groupedProducts: { [key: string]: typeof products } = {};
              categories.forEach(cat => {
                const label = getCatLabel(cat);
                const itemsInCat = filteredProducts.filter(p => isCategoryMatch(p.category, cat));
                if (itemsInCat.length > 0) {
                  groupedProducts[label] = itemsInCat;
                }
              });

              return (
                <div className="mb-8 animate-fade-in space-y-8">
                  {/* Category & Product Search Controls */}
                  <div className="bg-gradient-to-br from-green-50 via-white to-purple-50 border-2 border-green-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900">
                          Product Stock Breakdown per Category
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Remaining unit counts for each individual product under every category.
                        </p>
                      </div>

                      {/* Search Bar */}
                      <div className="relative w-full lg:w-72">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search product name or SKU..."
                          value={inventorySearchQuery}
                          onChange={(e) => setInventorySearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white shadow-sm"
                        />
                        {inventorySearchQuery && (
                          <button
                            onClick={() => setInventorySearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
                      <button
                        onClick={() => setSelectedInventoryCategory('all')}
                        className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all shadow-sm ${
                          selectedInventoryCategory === 'all'
                            ? 'bg-purple-600 text-white ring-2 ring-purple-600/30'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        All Categories ({products.reduce((s, p) => s + (p.stock || 0), 0).toLocaleString()} units)
                      </button>
                      {categories.map((catKey) => {
                        const label = getCatLabel(catKey);
                        const catStock = products
                          .filter(p => isCategoryMatch(p.category, catKey))
                          .reduce((s, p) => s + (p.stock || 0), 0);
                        return (
                          <button
                            key={catKey}
                            onClick={() => setSelectedInventoryCategory(catKey)}
                            className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all shadow-sm ${
                              selectedInventoryCategory === catKey
                                ? 'bg-purple-600 text-white ring-2 ring-purple-600/30'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {label} ({catStock.toLocaleString()} units)
                          </button>
                        );
                      })}
                    </div>

                    {/* Category Group Cards */}
                    <div className="grid grid-cols-1 gap-6">
                      {Object.keys(groupedProducts).length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                          <Package size={40} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-slate-600 font-semibold">No products found matching filters</p>
                        </div>
                      ) : (
                        Object.entries(groupedProducts).map(([catLabel, catProducts]) => {
                          const catTotalStock = catProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
                          const maxProductStock = Math.max(...catProducts.map(p => p.stock || 0), 1);

                          return (
                            <div key={catLabel} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                              {/* Category Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                  <span className="p-2 bg-purple-100 text-purple-700 rounded-xl font-bold">
                                    <Layers size={18} />
                                  </span>
                                  <div>
                                    <h4 className="text-lg font-black text-slate-900">{catLabel}</h4>
                                    <span className="text-xs text-slate-500 font-medium">
                                      {catProducts.length} product{catProducts.length === 1 ? '' : 's'} in category
                                    </span>
                                  </div>
                                </div>
                                <div className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full text-xs font-black">
                                  Category Total: {catTotalStock.toLocaleString()} units
                                </div>
                              </div>

                              {/* Products List inside Category */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {catProducts.map((p) => {
                                  const stock = p.stock || 0;
                                  const price = p.price || 0;
                                  const stockPercent = Math.min(100, Math.round((stock / maxProductStock) * 100));

                                  const isOutOfStock = stock === 0;
                                  const isLowStock = stock > 0 && stock <= 10;

                                  const badgeClass = isOutOfStock
                                    ? 'bg-red-100 text-red-700 border-red-200'
                                    : isLowStock
                                    ? 'bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-green-100 text-green-700 border-green-200';

                                  const barColor = isOutOfStock
                                    ? 'bg-red-500'
                                    : isLowStock
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500';

                                  return (
                                    <div key={p.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                                      <div className="flex items-start justify-between gap-3 mb-2">
                                        <div>
                                          <h5 className="font-bold text-slate-900 text-sm leading-snug">{p.name}</h5>
                                          <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase">{(p.sku || 'NO-SKU').replace(/^EQUIP-/i, 'PPE-').replace(/^GROC\s*-\s*/i, 'ESS-').replace(/^GROC-/i, 'ESS-')}</span>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-xs font-black border ${badgeClass} whitespace-nowrap flex-shrink-0`}>
                                          {stock.toLocaleString()} units remaining
                                        </div>
                                      </div>

                                      {/* Stock Bar */}
                                      <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                          style={{ width: `${stockPercent}%` }}
                                        />
                                      </div>

                                      {/* Meta details */}
                                      <div className="flex items-center justify-between text-xs pt-1 text-slate-600 font-medium">
                                        <span>Unit Price: <strong className="text-slate-900">₱{price.toLocaleString()}</strong></span>
                                        <span>Total Value: <strong className="text-purple-700">₱{(stock * price).toLocaleString()}</strong></span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Detailed Unit Breakdown Table per Item & Category */}
                  <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900">
                          Detailed Unit Breakdown Ledger Table
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Itemized inventory ledger with unit stock counts, prices, and stock statuses.
                        </p>
                      </div>
                    </div>

                      {/* Category Pills Filter */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedInventoryCategory('all')}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            selectedInventoryCategory === 'all'
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          All ({products.reduce((s, p) => s + (p.stock || 0), 0).toLocaleString()} units)
                        </button>
                        {categories.map((catKey) => {
                          const label = getCatLabel(catKey);
                          const catStock = products
                            .filter(p => isCategoryMatch(p.category, catKey))
                            .reduce((s, p) => s + (p.stock || 0), 0);
                          return (
                            <button
                              key={catKey}
                              onClick={() => setSelectedInventoryCategory(catKey)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                selectedInventoryCategory === catKey
                                  ? 'bg-purple-600 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {label} ({catStock.toLocaleString()})
                            </button>
                          );
                        })}
                      </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                            <th className="py-3.5 px-4 font-bold">Category</th>
                            <th className="py-3.5 px-4 font-bold">SKU</th>
                            <th className="py-3.5 px-4 font-bold">Product Name</th>
                            <th className="py-3.5 px-4 font-bold text-center">Unit Stock Count</th>
                            <th className="py-3.5 px-4 font-bold text-right">Unit Price</th>
                            <th className="py-3.5 px-4 font-bold text-right">Total Valuation</th>
                            <th className="py-3.5 px-4 font-bold text-center">Stock Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                                No products found for this category.
                              </td>
                            </tr>
                          ) : (
                            filteredProducts.map((product) => {
                              const catDisplay = getCatLabel(product.category);
                              const stock = product.stock || 0;
                              const price = product.price || 0;
                              const totalValue = stock * price;

                              let statusBadge = (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                  In Stock
                                </span>
                              );
                              if (stock === 0) {
                                statusBadge = (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                    Out of Stock
                                  </span>
                                );
                              } else if (stock <= 10) {
                                statusBadge = (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                    Low Stock (≤10)
                                  </span>
                                );
                              }

                              return (
                                <tr key={product.id} className="hover:bg-purple-50/40 transition-colors">
                                  <td className="py-3.5 px-4">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                      {catDisplay}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                                    {(product.sku || 'N/A').replace(/^EQUIP-/i, 'PPE-')}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    {product.name}
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span className="text-base font-extrabold text-slate-900">
                                      {stock.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-slate-500 ml-1 font-medium">units</span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                                    ₱{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-bold text-purple-700">
                                    ₱{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    {statusBadge}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Locker Occupancy Donut Chart & Detailed Ledger Table */}
            {reportType === 'lockers' && (() => {
              const activeOrPending = lockerRentals.filter(r => (r.status || r.rental_status) === 'active' || r.payment_status === 'paid' || r.status === 'pending');
              const occupiedLockerCodes = new Set(activeOrPending.map(r => r.locker_number || r.locker_code || r.lockerId).filter(Boolean));
              
              const total = Math.max((lockersList || lockers || []).length, occupiedLockerCodes.size, 8);
              const occupied = occupiedLockerCodes.size;
              const available = Math.max(0, total - occupied);
              const pendingCount = lockerRentals.filter(r => (r.status === 'pending' || r.rental_status === 'pending') && r.payment_status !== 'paid').length;
              
              const chartSize = 320;
              const centerX = chartSize / 2;
              const centerY = chartSize / 2;
              const radius = 100;
              const innerRadius = 60;
              
              const availableAngle = total > 0 ? (available / total) * 360 : 360;
              const occupiedAngle = total > 0 ? (occupied / total) * 360 : 0;
              
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
                <div className="space-y-8 animate-fade-in">
                  {/* Status Distribution Card */}
                  <div className="bg-gradient-to-br from-purple-50/80 via-white to-emerald-50/80 border-2 border-purple-200 rounded-2xl p-6 sm:p-8 shadow-md">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                      <Lock size={24} className="text-purple-600" /> Locker Status & Occupancy Distribution
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 lg:gap-16">
                      <svg width={chartSize} height={chartSize} className="flex-shrink-0">
                        {/* Occupied - Emerald */}
                        <path
                          d={createArc(0, occupiedAngle, radius, innerRadius)}
                          fill="#10b981"
                          className="animate-fade-in"
                        />
                        
                        {/* Available - Purple */}
                        <path
                          d={createArc(occupiedAngle, 360, radius, innerRadius)}
                          fill="#8b5cf6"
                          className="animate-fade-in"
                        />
                        
                        {/* Center text */}
                        <text
                          x={centerX}
                          y={centerY - 8}
                          textAnchor="middle"
                          className="text-3xl font-black fill-slate-900"
                        >
                          {total}
                        </text>
                        <text
                          x={centerX}
                          y={centerY + 16}
                          textAnchor="middle"
                          className="text-xs font-bold fill-slate-500 uppercase tracking-wider"
                        >
                          Total Lockers
                        </text>
                      </svg>
                      
                      {/* Legend Stats */}
                      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Occupied</p>
                            <p className="text-xl font-black text-emerald-950">{occupied}</p>
                          </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-purple-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-purple-800 uppercase tracking-wide">Available</p>
                            <p className="text-xl font-black text-purple-950">{available}</p>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-amber-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Pending</p>
                            <p className="text-xl font-black text-amber-950">{pendingCount}</p>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Occupancy Rate</p>
                            <p className="text-xl font-black text-blue-950">{total > 0 ? ((occupied / total) * 100).toFixed(1) : 0}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Locker Applications & Rentals Table */}
                  <div className="bg-white border-2 border-purple-200 rounded-2xl overflow-hidden shadow-md">
                    <div className="bg-slate-50 p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                        <FileText size={20} className="text-purple-600" /> Locker Applications & Rental Registry
                      </h4>
                      <span className="text-xs font-bold bg-purple-100 text-purple-800 px-3 py-1 rounded-full border border-purple-200">
                        {lockerRentals.length} Total Records
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-purple-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Student Renter</th>
                            <th className="py-3 px-4">Locker Code</th>
                            <th className="py-3 px-4">Location</th>
                            <th className="py-3 px-4">Duration</th>
                            <th className="py-3 px-4 text-right">Rental Fee</th>
                            <th className="py-3 px-4 text-right">Key Deposit</th>
                            <th className="py-3 px-4 text-center">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                          {lockerRentals.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400 font-bold">
                                No locker rental applications registered yet.
                              </td>
                            </tr>
                          ) : (
                            lockerRentals.map((r, idx) => {
                              const isPaid = r.payment_status === 'paid';
                              const renterName = r.renter_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Student Renter';
                              const studentId = r.id_number || r.idNumber || 'N/A';
                              const course = r.course || 'METC';
                              const lockerCode = r.locker_number || r.locker_code || r.lockerId || 'SL-109';
                              const location = r.location || 'Seamanship Lab';
                              const semCount = r.semester_count || r.semesterCount || 1;
                              const rentalFee = parseFloat(r.rental_fee || 250);
                              const depositFee = parseFloat(r.deposit_fee || 200);

                              return (
                                <tr key={r.id || r.rental_id || idx} className="hover:bg-purple-50/50 transition-colors">
                                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                                    {new Date(r.created_at || r.createdAt || Date.now()).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="font-bold text-slate-900">{renterName}</div>
                                    <div className="text-[11px] text-slate-400 font-mono">{studentId} ({course})</div>
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-purple-700 whitespace-nowrap">
                                    {lockerCode}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600">
                                    {location}
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-700">
                                    {semCount} Sem
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                                    ₱{rentalFee.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-right font-mono font-bold text-purple-700 whitespace-nowrap">
                                    ₱{depositFee.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 text-center whitespace-nowrap">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                                      isPaid ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}>
                                      {isPaid ? 'PAID' : 'PENDING'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Income Breakdown & Detailed Financial Overview */}
            {reportType === 'income' && (() => {
              const completedSales = sales.filter(s => s && (s.status === 'completed' || s.status === 'released'));

              // 1. Insurance / Student Services
              const insuranceOrders = completedSales.filter(s => (s.order_type || s.orderType) === 'insurance');
              const insuranceRev = insuranceOrders.reduce((sum, s) => sum + (parseFloat(String(s.total_amount || s.totalAmount || 0)) || 0), 0);
              const insuranceCashRev = insuranceOrders.filter(s => (s.payment_method || s.paymentMethod) === 'cash').reduce((sum, s) => sum + (parseFloat(String(s.total_amount || s.totalAmount || 0)) || 0), 0);
              const insuranceGcashRev = insuranceRev - insuranceCashRev;

              // 2. Product Sales (All completed sales excluding insurance)
              const productSalesOrders = completedSales.filter(s => (s.order_type || s.orderType) !== 'insurance');
              const productSalesRev = productSalesOrders.reduce((sum, s) => sum + (parseFloat(String(s.total_amount || s.totalAmount || 0)) || 0), 0);
              const productCashRev = productSalesOrders.filter(s => (s.payment_method || s.paymentMethod) === 'cash').reduce((sum, s) => sum + (parseFloat(String(s.total_amount || s.totalAmount || 0)) || 0), 0);
              const productGcashRev = productSalesRev - productCashRev;

              // 3. Locker Rentals Income (Fetched from lockerRentals store / API)
              const lockerRev = lockerRentals.reduce((sum, r) => {
                const val = parseFloat(String(r.rental_fee ?? r.rentalFee ?? r.total_amount ?? r.totalAmount ?? r.rental_amount ?? r.amount ?? r.price ?? 250));
                return sum + (isNaN(val) ? 250 : val);
              }, 0);

              const totalGrossIncome = productSalesRev + lockerRev + insuranceRev;

              const incomeStreams = [
                {
                  id: 'products',
                  label: 'Product Sales',
                  description: 'Merchandise, uniforms, PPE, POS purchases & accessories',
                  value: productSalesRev,
                  count: productSalesOrders.length,
                  cash: productCashRev,
                  gcash: productGcashRev,
                  color: '#10b981',
                },
                {
                  id: 'lockers',
                  label: 'Locker Services',
                  description: 'Student locker rental fees & deposits',
                  value: lockerRev,
                  count: lockerRentals.length,
                  cash: lockerRev,
                  gcash: 0,
                  color: '#8b5cf6',
                },
                {
                  id: 'insurance',
                  label: 'Student Insurance',
                  description: 'Mandatory student policy & processing',
                  value: insuranceRev,
                  count: insuranceOrders.length,
                  cash: insuranceCashRev,
                  gcash: insuranceGcashRev,
                  color: '#3b82f6',
                },
              ];

              const maxIncome = Math.max(...incomeStreams.map(d => d.value), 1);
              const chartHeight = 360;
              const chartWidth = 840;
              const padding = { top: 40, right: 40, bottom: 80, left: 90 };
              const graphHeight = chartHeight - padding.top - padding.bottom;
              const graphWidth = chartWidth - padding.left - padding.right;
              const barWidth = Math.min(80, (graphWidth / incomeStreams.length) * 0.55);
              const barSpacing = graphWidth / incomeStreams.length;

              return (
                <div className="space-y-8 animate-fade-in mb-8">
                  {/* Dynamic Income Source Comparison Chart */}
                  <div className="bg-gradient-to-br from-green-50 via-white to-purple-50 border-2 border-purple-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900">Income Sources Comparison</h3>
                        <p className="text-sm text-slate-600 mt-1">Multi-stream financial breakdown across all revenue channels</p>
                      </div>
                      <div className="bg-white px-4 py-2 rounded-xl border border-purple-200 shadow-xs">
                        <span className="text-xs text-slate-500 font-medium block">Total Gross Income</span>
                        <p className="text-xl font-black text-purple-700">
                          ₱{totalGrossIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <svg width={chartWidth} height={chartHeight} className="mx-auto">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                          const y = padding.top + graphHeight * (1 - ratio);
                          return (
                            <g key={ratio}>
                              <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                              <text x={padding.left - 15} y={y + 5} textAnchor="end" className="text-xs fill-slate-500 font-bold">
                                ₱{(maxIncome * ratio).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                              </text>
                            </g>
                          );
                        })}

                        {/* Bars */}
                        {incomeStreams.map((stream, index) => {
                          const barHeight = (stream.value / maxIncome) * graphHeight;
                          const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;
                          const y = padding.top + graphHeight - barHeight;

                          return (
                            <g key={stream.id} className="cursor-pointer group">
                              <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={Math.max(barHeight, 4)}
                                fill={stream.color}
                                rx="8"
                                className="transition-all duration-300 group-hover:opacity-100 opacity-90"
                              />

                              {/* Amount on top */}
                              <text x={x + barWidth / 2} y={y - 12} textAnchor="middle" className="text-xs fill-slate-900 font-black">
                                ₱{stream.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                              </text>

                              {/* X Axis Label */}
                              <text x={x + barWidth / 2} y={chartHeight - padding.bottom + 25} textAnchor="middle" className="text-xs fill-slate-800 font-bold">
                                {stream.label}
                              </text>
                            </g>
                          );
                        })}

                        {/* Axes */}
                        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Detailed Revenue Stream Breakdown Table */}
                  <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900">Detailed Revenue Stream Ledger</h3>
                        <p className="text-sm text-slate-600 mt-1">Transaction counts, cash vs digital payment channel breakdown per income source</p>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200">
                        {incomeStreams.length} Revenue Streams
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 uppercase tracking-wider font-bold text-xs">
                            <th className="py-3.5 px-4">Income Stream</th>
                            <th className="py-3.5 px-4 text-center">Orders / Volume</th>
                            <th className="py-3.5 px-4 text-right">Cash Revenue</th>
                            <th className="py-3.5 px-4 text-right">GCash Revenue</th>
                            <th className="py-3.5 px-4 text-right">Total Generated Income</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {incomeStreams.map((stream) => (
                            <tr key={stream.id} className="hover:bg-purple-50/40 transition-colors">
                              <td className="py-4 px-4">
                                <div className="font-extrabold text-slate-900 text-base">{stream.label}</div>
                                <div className="text-xs text-slate-500 font-medium">{stream.description}</div>
                              </td>
                              <td className="py-4 px-4 text-center font-bold text-slate-700 whitespace-nowrap">
                                {stream.count.toLocaleString()} orders
                              </td>
                              <td className="py-4 px-4 text-right font-medium text-emerald-700 whitespace-nowrap">
                                ₱{stream.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-right font-medium text-blue-700 whitespace-nowrap">
                                ₱{stream.gcash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-right font-black text-purple-700 whitespace-nowrap text-base">
                                ₱{stream.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Insurance Report Section */}
            {reportType === 'insurance' && (() => {
              const insuranceSales = sales.filter((s) => {
                if (!s) return false;
                if (s.order_type === 'insurance' || s.orderType === 'insurance') return true;
                if (s.items && Array.isArray(s.items)) {
                  return s.items.some((item: any) => 
                    item.productId === 'insurance' || 
                    item.product_id === 'insurance' || 
                    (item.productName || '').toLowerCase().includes('insurance')
                  );
                }
                return false;
              });

              // Apply search & status filters for table view
              const filteredInsurance = insuranceSales.filter((s) => {
                if (insuranceStatusFilter === 'completed' && s.status !== 'completed' && s.status !== 'released') return false;
                if (insuranceStatusFilter === 'pending' && s.status !== 'pending') return false;

                if (!insuranceSearchQuery.trim()) return true;
                const q = insuranceSearchQuery.toLowerCase().trim();
                const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
                const receipt = (s.receipt_no || '').toLowerCase();
                const idNum = (s.id_number || '').toLowerCase();
                const email = (s.email || '').toLowerCase();

                return fullName.includes(q) || receipt.includes(q) || idNum.includes(q) || email.includes(q);
              });

              const completedCount = insuranceSales.filter(s => s.status === 'completed' || s.status === 'released').length;
              const pendingCount = insuranceSales.filter(s => s.status === 'pending').length;
              const totalRev = completedCount * 100;

              return (
                <div className="mb-8 animate-fade-in space-y-8">
                  {/* Overview Banner Card */}
                  <div className="bg-purple-600 rounded-2xl p-8 text-white shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div>
                        <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                          I-CARD Micro-Insurance Analytics
                        </span>
                        <h3 className="text-3xl font-extrabold mt-2">Insurance Registration Overview</h3>
                        <p className="text-purple-100 text-sm mt-1">
                          Track student micro-insurance applications, fee collections (₱100/student), and coverage approvals.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[140px]">
                          <span className="text-xs text-purple-200 font-medium block">Total Registrations</span>
                          <span className="text-2xl font-black">{insuranceSales.length}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[140px]">
                          <span className="text-xs text-emerald-300 font-medium block">Approved & Covered</span>
                          <span className="text-2xl font-black text-emerald-300">{completedCount}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[140px]">
                          <span className="text-xs text-amber-300 font-medium block">Pending Payment</span>
                          <span className="text-2xl font-black text-amber-300">{pendingCount}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[160px]">
                          <span className="text-xs text-purple-200 font-medium block">Collected Revenue</span>
                          <span className="text-2xl font-black text-white">₱{totalRev.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student Registrations Ledger Table */}
                  <div className="bg-white border-2 border-purple-200 rounded-2xl p-6 sm:p-8 shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900">
                          Student Insurance Applicants Ledger
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          List of all registered students with receipt reference numbers, payment methods, and approval statuses.
                        </p>
                      </div>

                      {/* Controls: Search & Status Filters */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Status Filter Buttons */}
                        <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl">
                          <button
                            onClick={() => setInsuranceStatusFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              insuranceStatusFilter === 'all'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            All ({insuranceSales.length})
                          </button>
                          <button
                            onClick={() => setInsuranceStatusFilter('completed')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              insuranceStatusFilter === 'completed'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Approved ({completedCount})
                          </button>
                          <button
                            onClick={() => setInsuranceStatusFilter('pending')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              insuranceStatusFilter === 'pending'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Pending ({pendingCount})
                          </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search applicant or receipt..."
                            value={insuranceSearchQuery}
                            onChange={(e) => setInsuranceSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                            <th className="py-3.5 px-4 font-bold">Receipt No</th>
                            <th className="py-3.5 px-4 font-bold">Applicant Name</th>
                            <th className="py-3.5 px-4 font-bold">Student ID & Email</th>
                            <th className="py-3.5 px-4 font-bold text-center">Coverage Fee</th>
                            <th className="py-3.5 px-4 font-bold text-center">Payment Method</th>
                            <th className="py-3.5 px-4 font-bold text-center">Coverage Status</th>
                            <th className="py-3.5 px-4 font-bold text-center">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredInsurance.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                                No insurance registrations found matching the filters.
                              </td>
                            </tr>
                          ) : (
                            filteredInsurance.map((order: any) => {
                              const isApproved = order.status === 'completed' || order.status === 'released';
                              const isPending = order.status === 'pending';

                              const statusBadge = isApproved ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                  Approved & Covered
                                </span>
                              ) : isPending ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                  Pending Office Payment
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                  Cancelled
                                </span>
                              );

                              const name = `${order.first_name || ''} ${order.last_name || ''}`.trim() || order.walk_in_name || 'N/A';

                              return (
                                <tr key={order.id} className="hover:bg-purple-50/40 transition-colors">
                                  <td className="py-3.5 px-4 font-mono font-semibold text-purple-700">
                                    {order.receipt_no || order.receiptNo || 'N/A'}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    {name}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-600">
                                    <div className="font-semibold text-slate-800">ID: {order.id_number || order.walkInIdNumber || 'N/A'}</div>
                                    <div className="text-xs text-slate-500">{order.email}</div>
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                                    ₱100.00
                                  </td>
                                  <td className="py-3.5 px-4 text-center font-semibold text-slate-700 uppercase text-xs">
                                    {order.payment_method === 'ewallet' ? 'GCASH' : (order.payment_method || 'CASH')}
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    {statusBadge}
                                  </td>
                                  <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-medium">
                                    {new Date(order.created_at || order.createdAt).toLocaleDateString()}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Class Ring Report Section */}
            {reportType === 'classring' && (() => {
              const filteredRings = classRingSales.filter((s) => {
                if (classRingStatusFilter === 'completed' && s.status !== 'completed' && s.status !== 'released') return false;
                if (classRingStatusFilter === 'pending' && s.status !== 'pending') return false;
                if (classRingStatusFilter === 'cancelled' && s.status !== 'cancelled') return false;

                if (!classRingSearchQuery.trim()) return true;
                const q = classRingSearchQuery.toLowerCase().trim();
                const item = s.items?.[0] || {};
                const opts = item.selectedOptions || s.selectedOptions || {};
                const cadetName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
                const receipt = (s.receipt_no || '').toLowerCase();
                const engraving = (opts['Inside Engraving'] || '').toLowerCase();
                const model = (opts['Model'] || '').toLowerCase();

                return cadetName.includes(q) || receipt.includes(q) || engraving.includes(q) || model.includes(q);
              });

              const completedCount = classRingSales.filter(s => s.status === 'completed' || s.status === 'released').length;
              const pendingCount = classRingSales.filter(s => s.status === 'pending').length;
              const totalRev = classRingSales.reduce((sum, s) => sum + parseFloat(String(s.total_amount || s.totalAmount || 0)), 0);

              // Calculate Model breakdown
              const modelCounts: { [model: string]: number } = {};
              // Calculate Program breakdown
              const programCounts: { [program: string]: number } = { BSMT: 0, BSMARE: 0 };
              // Calculate Material breakdown
              const materialCounts: { [mat: string]: number } = {};

              classRingSales.forEach(s => {
                const item = s.items?.[0] || {};
                const opts = item.selectedOptions || s.selectedOptions || {};
                const model = opts['Model'] || 'Medium';
                const program = opts['Degree/Program'] || s.course || 'BSMT';
                const material = opts['Material'] || 'Stainless Steel';

                modelCounts[model] = (modelCounts[model] || 0) + 1;
                materialCounts[material] = (materialCounts[material] || 0) + 1;

                if (program.toUpperCase().includes('BSMARE')) {
                  programCounts['BSMARE'] += 1;
                } else {
                  programCounts['BSMT'] += 1;
                }
              });

              return (
                <div className="mb-8 animate-fade-in space-y-8">
                  {/* Overview Banner Card */}
                  <div className="bg-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
                          Segregated Royal Gem Trust Account
                        </span>
                        <h3 className="text-3xl font-black mt-2">Class Ring Orders & Detailed Analytics</h3>
                        <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
                          Comprehensive report of all maritime graduation class ring submissions, gemstone specifications, cadet details, and segregated trust funds.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[130px] text-center">
                          <span className="text-xs text-blue-200 font-bold block uppercase tracking-wider">Total Submissions</span>
                          <span className="text-2xl font-black">{classRingSales.length}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[130px] text-center">
                          <span className="text-xs text-emerald-300 font-bold block uppercase tracking-wider">Completed</span>
                          <span className="text-2xl font-black text-emerald-300">{completedCount}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[130px] text-center">
                          <span className="text-xs text-amber-300 font-bold block uppercase tracking-wider">Pending</span>
                          <span className="text-2xl font-black text-amber-300">{pendingCount}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[160px] text-center">
                          <span className="text-xs text-blue-200 font-bold block uppercase tracking-wider">Total Trust Funds</span>
                          <span className="text-2xl font-black text-white">₱{totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Program Distribution */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span>Program Distribution</span>
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>BSMT (Marine Transportation)</span>
                            <span>{programCounts['BSMT']} orders</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${classRingSales.length > 0 ? (programCounts['BSMT'] / classRingSales.length) * 100 : 0}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>BSMARE (Marine Engineering)</span>
                            <span>{programCounts['BSMARE']} orders</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${classRingSales.length > 0 ? (programCounts['BSMARE'] / classRingSales.length) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ring Model Preference */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span>Top Ring Models</span>
                      </h4>
                      <div className="space-y-2 text-xs">
                        {Object.keys(modelCounts).length === 0 ? (
                          <p className="text-slate-400 font-medium">No order model data available</p>
                        ) : (
                          Object.entries(modelCounts).map(([modelName, count]) => (
                            <div key={modelName} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                              <span className="font-semibold text-slate-800">{modelName}</span>
                              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">{count} orders</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Material & Finish Distribution */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span>Material & Finish Options</span>
                      </h4>
                      <div className="space-y-2 text-xs">
                        {Object.keys(materialCounts).length === 0 ? (
                          <p className="text-slate-400 font-medium">No material data available</p>
                        ) : (
                          Object.entries(materialCounts).map(([matName, count]) => (
                            <div key={matName} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                              <span className="font-semibold text-slate-800">{matName}</span>
                              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">{count} orders</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Class Ring Purchases Table Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Detailed Class Ring Purchases Ledger</h3>
                        <p className="text-xs text-slate-500 mt-1">Complete cadet details, ring specs, contact info, and inside engravings</p>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-64">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search cadet, receipt, engraving..."
                            value={classRingSearchQuery}
                            onChange={(e) => setClassRingSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <select
                          value={classRingStatusFilter}
                          onChange={(e: any) => setClassRingStatusFilter(e.target.value)}
                          className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="all">All Statuses ({classRingSales.length})</option>
                          <option value="completed">Completed / Paid ({completedCount})</option>
                          <option value="pending">Pending Cashier ({pendingCount})</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-blue-600 text-white font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3.5 px-4 min-w-[140px]">Receipt #</th>
                            <th className="py-3.5 px-4 min-w-[140px]">Cadet Name</th>
                            <th className="py-3.5 px-4 min-w-[130px]">Program & Year</th>
                            <th className="py-3.5 px-4 min-w-[280px]">Ring Specifications</th>
                            <th className="py-3.5 px-4 min-w-[140px]">Inside Engraving</th>
                            <th className="py-3.5 px-4 min-w-[220px]">Contact & Address</th>
                            <th className="py-3.5 px-4 text-right min-w-[110px]">Price</th>
                            <th className="py-3.5 px-4 text-center min-w-[110px]">Status</th>
                            <th className="py-3.5 px-4 text-center min-w-[100px]">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                          {filteredRings.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-slate-500 font-semibold">
                                No Class Ring purchases match your search filters.
                              </td>
                            </tr>
                          ) : (
                            filteredRings.map((s) => {
                              const item = s.items?.[0] || {};
                              const opts = item.selectedOptions || s.selectedOptions || {};
                              const cadetName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.walk_in_name || 'Cadet Member';

                              return (
                                <tr key={s.id || s.receipt_no} className="hover:bg-blue-50/40 transition-colors">
                                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                                    #{s.receipt_no}
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    {cadetName}
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="font-bold text-slate-900">{opts['Degree/Program'] || s.course || 'BSMT'}</span>
                                    <span className="text-slate-500 block text-[11px]">Class of {opts['Graduation Year'] || '2026'}</span>
                                  </td>
                                  <td className="py-3.5 px-4 min-w-[280px] space-y-1 leading-relaxed">
                                    <div><strong>Model:</strong> {opts['Model'] || 'Medium'} ({opts['Ring Size'] || 'Size 8'})</div>
                                    <div><strong>Finish:</strong> {opts['Material'] || 'Stainless Steel'} - {opts['Finish'] || 'Gold'}</div>
                                    <div className="text-slate-500"><strong>Stone:</strong> {opts['Birthstone'] || 'September'}</div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-900 rounded-lg border border-blue-200 font-mono font-bold inline-block">
                                      "{opts['Inside Engraving'] || 'None'}"
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 space-y-0.5 max-w-[200px] truncate">
                                    <div>📞 {opts['Contact Number'] || s.contact_number || 'N/A'}</div>
                                    <div className="text-slate-500 truncate" title={opts['Contact Address'] || s.address}>📍 {opts['Contact Address'] || s.address || 'N/A'}</div>
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-bold text-blue-700 text-sm">
                                    ₱{parseFloat(s.total_amount || 0).toLocaleString()}
                                  </td>
                                  <td className="py-3.5 px-4 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      s.status === 'completed' || s.status === 'released'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : s.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800 border border-red-300'
                                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    }`}>
                                      {s.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-center text-slate-500 text-xs">
                                    {new Date(s.created_at || s.createdAt).toLocaleDateString()}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}


          </div>
        </div>
      </div>
    </div>
  );
};
