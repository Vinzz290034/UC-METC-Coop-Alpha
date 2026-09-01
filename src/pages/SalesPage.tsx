import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Clock, TrendingUp, Package, DollarSign, Calendar, Download, ChevronLeft, ChevronRight, Search, Trash2, BookOpen, User, Upload, FileSpreadsheet, ChevronDown, Award, Waves, Send, Filter, ArrowUp, ArrowDown, X, RotateCcw, Smartphone, CreditCard, Printer, Copy, FileText } from 'lucide-react';
import { useAuth } from '../store/authContext';
import { apiClient } from '../services/api';
import { AppDataSync } from '../store/appDataSync';
import { useUIStore } from '../store/uiStore';
import { formatProductName, parseAndFormatLegacyProductName } from '../utils/productNameFormatter';
import { useAppStore } from '../store/appStore';
import { formatFullName } from '../utils/nameFormatter';
import * as XLSX from 'xlsx';

interface SpreadsheetColumnHeaderProps {
  columnKey: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  allRows: any[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (columnKey: string, selectedValues: string[] | null) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
  onSortChange: (columnKey: string, direction: 'asc' | 'desc' | null) => void;
  activeDropdown: string | null;
  setActiveDropdown: (key: string | null) => void;
  alignRight?: boolean;
  type?: 'text' | 'number' | 'date';
}

const SpreadsheetColumnHeader: React.FC<SpreadsheetColumnHeaderProps> = ({
  columnKey,
  label,
  align = 'left',
  allRows,
  activeFilters,
  onFilterChange,
  sortColumn,
  sortDirection,
  onSortChange,
  activeDropdown,
  setActiveDropdown,
  alignRight = false,
  type = 'text',
}) => {
  const isOpen = activeDropdown === columnKey;
  const isSorted = sortColumn === columnKey;
  const isFiltered = Array.isArray(activeFilters[columnKey]) && activeFilters[columnKey].length > 0;
  const [searchTerm, setSearchTerm] = useState('');

  // Extract distinct values & counts from all rows
  const valueCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allRows.forEach((row) => {
      let val = row[columnKey];
      if (val === undefined || val === null || val === '') {
        val = '(Blanks)';
      } else {
        val = String(val);
      }
      counts.set(val, (counts.get(val) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => {
      if (a[0] === '(Blanks)') return 1;
      if (b[0] === '(Blanks)') return -1;
      return a[0].localeCompare(b[0], undefined, { numeric: true });
    });
  }, [allRows, columnKey]);

  // Filtered list of values based on search input inside dropdown
  const filteredValueList = useMemo(() => {
    if (!searchTerm.trim()) return valueCounts;
    const lower = searchTerm.toLowerCase();
    return valueCounts.filter(([val]) => val.toLowerCase().includes(lower));
  }, [valueCounts, searchTerm]);

  const currentlySelected = activeFilters[columnKey]; // undefined if all selected

  const isValueSelected = (val: string) => {
    if (!currentlySelected) return true; // all selected by default
    return currentlySelected.includes(val);
  };

  const toggleValue = (val: string) => {
    const allVals = valueCounts.map(([v]) => v);
    let nextSelected: string[];

    if (!currentlySelected) {
      // currently all are selected, so unchecking this one leaves all others
      nextSelected = allVals.filter((v) => v !== val);
    } else {
      if (currentlySelected.includes(val)) {
        nextSelected = currentlySelected.filter((v) => v !== val);
      } else {
        nextSelected = [...currentlySelected, val];
      }
    }

    if (nextSelected.length === allVals.length) {
      onFilterChange(columnKey, null); // reset to null (no filter)
    } else {
      onFilterChange(columnKey, nextSelected);
    }
  };

  const handleSelectAll = () => {
    onFilterChange(columnKey, null);
  };

  const handleClearAll = () => {
    onFilterChange(columnKey, []);
  };

  const alignClass =
    align === 'center'
      ? 'justify-center text-center'
      : align === 'right'
      ? 'justify-end text-right'
      : 'justify-start text-left';

  return (
    <th
      className={`relative py-3.5 px-4 font-semibold text-slate-900 select-none ${
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      <div className={`inline-flex items-center gap-1.5 ${alignClass} group`}>
        <span
          onClick={() => {
            if (isSorted) {
              if (sortDirection === 'asc') onSortChange(columnKey, 'desc');
              else if (sortDirection === 'desc') onSortChange(columnKey, null);
            } else {
              onSortChange(columnKey, 'asc');
            }
          }}
          className="cursor-pointer hover:text-purple-600 transition-colors font-semibold"
        >
          {label}
        </span>

        {/* Sort indicator if active */}
        {isSorted && (
          <span className="text-purple-600 text-xs font-bold">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}

        {/* Filter Trigger Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(isOpen ? null : columnKey);
            setSearchTerm('');
          }}
          className={`spreadsheet-filter-trigger p-1 rounded transition-all ${
            isFiltered
              ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300'
              : isOpen
              ? 'bg-purple-100 text-purple-700'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
          }`}
          title={`Filter / Sort ${label}`}
        >
          <Filter size={13} className={isFiltered ? 'fill-white stroke-white' : ''} />
        </button>
      </div>

      {/* Filter Popover Dropdown */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`spreadsheet-filter-popover absolute z-50 mt-2 w-64 rounded-xl bg-white p-3 shadow-2xl border border-slate-200 text-slate-800 text-xs font-normal normal-case text-left ${
            alignRight ? 'right-0' : 'left-0'
          }`}
          style={{ minWidth: '220px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
              <Filter size={12} className="text-purple-600" />
              Filter {label}
            </span>
            <button
              onClick={() => setActiveDropdown(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Sort Options */}
          <div className="flex items-center gap-1 mb-2.5">
            <button
              type="button"
              onClick={() => {
                onSortChange(columnKey, 'asc');
              }}
              className={`flex-1 py-1 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                isSorted && sortDirection === 'asc'
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowUp size={12} />
              {type === 'number' ? 'Low → High' : type === 'date' ? 'Oldest First' : 'A → Z'}
            </button>
            <button
              type="button"
              onClick={() => {
                onSortChange(columnKey, 'desc');
              }}
              className={`flex-1 py-1 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                isSorted && sortDirection === 'desc'
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowDown size={12} />
              {type === 'number' ? 'High → Low' : type === 'date' ? 'Newest First' : 'Z → A'}
            </button>
          </div>

          {/* Search Box inside dropdown */}
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Select All / Clear */}
          <div className="flex items-center justify-between text-[11px] px-1 py-1 mb-1 text-slate-500 border-b border-slate-100">
            <button
              type="button"
              onClick={handleSelectAll}
              className="hover:text-purple-600 font-medium hover:underline"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="hover:text-purple-600 font-medium hover:underline"
            >
              Clear
            </button>
          </div>

          {/* Values Checklist */}
          <div className="max-h-44 overflow-y-auto space-y-0.5 py-1 scrollbar-thin">
            {filteredValueList.length === 0 ? (
              <div className="text-center py-3 text-slate-400 text-[11px]">No matching values</div>
            ) : (
              filteredValueList.map(([val, count]) => {
                const checked = isValueSelected(val);
                return (
                  <label
                    key={val}
                    className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-slate-50 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleValue(val)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="truncate text-slate-700" title={val}>
                        {val}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.2 rounded-full flex-shrink-0">
                      {count}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer Reset button if filtered */}
          {isFiltered && (
            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] text-purple-600 font-semibold">
                {currentlySelected?.length || 0} of {valueCounts.length} selected
              </span>
              <button
                type="button"
                onClick={() => onFilterChange(columnKey, null)}
                className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
              >
                Reset filter
              </button>
            </div>
          )}
        </div>
      )}
    </th>
  );
};

// Helper function to check if an order contains a Class Ring
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
    
    // Get unit price to determine if member discount was applied or variant price tier
    const unitPrice = parseFloat(String(item?.unitPrice || item?.unit_price || item?.price || (item?.subtotal && item?.quantity ? (parseFloat(item.subtotal) / parseFloat(item.quantity)) : 0))) || undefined;
    
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
    
    // Extract base name from full name (remove everything after first parenthesis)
    const baseNameMatch = fullName.match(/^([^(]+)/);
    const baseName = baseNameMatch ? baseNameMatch[1].trim() : fullName;

    // If we have selectedOptions, use the standard formatter
    if (options && Object.keys(options).length > 0) {
      return cleanRepeatedSegments(formatProductName(baseName, options, unitPrice));
    }
    
    // Fallback: Parse the legacy format from the product name itself or reconcile from unitPrice
    return cleanRepeatedSegments(parseAndFormatLegacyProductName(fullName, unitPrice));
  };

  const { user } = useAuth();
  const { showNotification } = useUIStore();
  const { products } = useAppStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'daily' | 'history' | 'remittance' | 'monthly' | 'tailored' | 'fulfillment' | 'downpayment' | 'insurance' | 'hardbound' | 'swimming' | 'classring' | 'gcash' | 'printing'>('pending');
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [dailyOrders, setDailyOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [gcashOrders, setGcashOrders] = useState<any[]>([]);
  const [gcashSearchQuery, setGcashSearchQuery] = useState<string>('');
  const [gcashFilterDate, setGcashFilterDate] = useState<string>('');
  const [gcashStatusFilter, setGcashStatusFilter] = useState<string>('all');
  const [gcashCurrentPage, setGcashCurrentPage] = useState<number>(1);
  const [gcashRowsPerPage, setGcashRowsPerPage] = useState<number>(10);

  // Printing & Photocopy States
  const [printingOrders, setPrintingOrders] = useState<any[]>([]);
  const [printingSearchQuery, setPrintingSearchQuery] = useState<string>('');
  const [printingFilterDate, setPrintingFilterDate] = useState<string>('');
  const [printingStatusFilter, setPrintingStatusFilter] = useState<string>('all');
  const [printingServiceFilter, setPrintingServiceFilter] = useState<'all' | 'printing' | 'photocopy'>('all');
  const [printingCurrentPage, setPrintingCurrentPage] = useState<number>(1);
  const [printingRowsPerPage, setPrintingRowsPerPage] = useState<number>(15);

  useEffect(() => {
    setPrintingCurrentPage(1);
  }, [printingSearchQuery, printingFilterDate, printingStatusFilter, printingServiceFilter]);

  useEffect(() => {
    setGcashCurrentPage(1);
  }, [gcashSearchQuery, gcashFilterDate, gcashStatusFilter]);

  // Calculate GCash service charge based on standard tier ranges
  const calculateEWalletFee = (amount: number): number => {
    if (amount <= 0) return 0;
    if (amount >= 1 && amount <= 200) return 10;
    if (amount >= 201 && amount <= 500) return 15;
    if (amount >= 501 && amount <= 1000) return 20;
    if (amount >= 1001 && amount <= 1500) return 30;
    if (amount >= 1501 && amount <= 2000) return 40;
    if (amount >= 2001 && amount <= 2500) return 50;
    if (amount >= 2501 && amount <= 3000) return 60;
    if (amount >= 3001 && amount <= 3500) return 70;
    if (amount >= 3501 && amount <= 4000) return 80;
    if (amount >= 4001 && amount <= 4500) return 90;
    if (amount >= 4501 && amount <= 5000) return 100;
    if (amount >= 5001 && amount <= 5500) return 110;
    if (amount >= 5501 && amount <= 6000) return 120;
    if (amount >= 6001 && amount <= 6500) return 130;
    if (amount >= 6501 && amount <= 7000) return 140;
    if (amount >= 7001 && amount <= 7500) return 150;
    if (amount >= 7501 && amount <= 8000) return 160;
    if (amount >= 8001 && amount <= 8500) return 170;
    if (amount >= 8501 && amount <= 9000) return 180;
    if (amount >= 9001 && amount <= 9500) return 190;
    if (amount >= 9501 && amount <= 10000) return 200;
    if (amount >= 10001 && amount <= 10500) return 210;
    if (amount >= 10501 && amount <= 11000) return 215;
    if (amount >= 11001 && amount <= 11500) return 230;
    if (amount >= 11501 && amount <= 12000) return 240;
    if (amount >= 12001 && amount <= 12500) return 250;
    if (amount >= 12501 && amount <= 13000) return 260;
    if (amount >= 13001 && amount <= 13500) return 270;
    if (amount >= 13501 && amount <= 14000) return 280;
    if (amount >= 14001 && amount <= 14500) return 290;
    if (amount >= 14501 && amount <= 15000) return 300;
    return 300;
  };
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 1))); // Default to yesterday
   const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Spreadsheet Column Filters & Sort for Daily Sales
  const [dailyColumnFilters, setDailyColumnFilters] = useState<Record<string, string[]>>({});
  const [dailySortColumn, setDailySortColumn] = useState<string | null>(null);
  const [dailySortDirection, setDailySortDirection] = useState<'asc' | 'desc' | null>(null);
  const [dailyActiveDropdown, setDailyActiveDropdown] = useState<string | null>(null);

  // Spreadsheet Column Filters & Sort for History Sales
  const [historyColumnFilters, setHistoryColumnFilters] = useState<Record<string, string[]>>({});
  const [historySortColumn, setHistorySortColumn] = useState<string | null>(null);
  const [historySortDirection, setHistorySortDirection] = useState<'asc' | 'desc' | null>(null);
  const [historyActiveDropdown, setHistoryActiveDropdown] = useState<string | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.spreadsheet-filter-popover') && !target.closest('.spreadsheet-filter-trigger')) {
        setDailyActiveDropdown(null);
        setHistoryActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  const handleDailyFilterChange = (columnKey: string, selectedValues: string[] | null) => {
    setDailyColumnFilters((prev) => {
      const next = { ...prev };
      if (!selectedValues) {
        delete next[columnKey];
      } else {
        next[columnKey] = selectedValues;
      }
      return next;
    });
  };

  const handleDailySortChange = (columnKey: string, direction: 'asc' | 'desc' | null) => {
    setDailySortColumn(direction ? columnKey : null);
    setDailySortDirection(direction);
  };

  const handleHistoryFilterChange = (columnKey: string, selectedValues: string[] | null) => {
    setHistoryColumnFilters((prev) => {
      const next = { ...prev };
      if (!selectedValues) {
        delete next[columnKey];
      } else {
        next[columnKey] = selectedValues;
      }
      return next;
    });
  };

  const handleHistorySortChange = (columnKey: string, direction: 'asc' | 'desc' | null) => {
    setHistorySortColumn(direction ? columnKey : null);
    setHistorySortDirection(direction);
  };

  // Flatten orders into individual display rows with normalized keys
  const flattenOrdersToRows = (orders: any[]) => {
    const rows: any[] = [];
    orders.forEach((order) => {
      const items = order?.items || [];
      const courseYear = order?.course && order?.year 
        ? `${order.course} - ${order.year}` 
        : order?.course || order?.year || 'N/A';
      const customerName = order?.first_name 
        ? `${order?.first_name} ${order?.last_name || ''}`.trim() 
        : order?.walk_in_name || 'N/A';
      const displayDate = (order?.status === 'completed' || order?.status === 'released') && order?.completed_at ? order.completed_at : order?.created_at;
      const dateFormatted = displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A';
      const dateTimestamp = displayDate ? new Date(displayDate).getTime() : 0;
      const statusFormatted = order?.status === 'completed' ? 'COMPLETED' : order?.status === 'released' ? 'RELEASED' : 'CANCELLED';
      const paymentFormatted = formatPaymentMethod(order?.payment_method);
      const receiptNo = order?.receipt_no || order?.receiptNo || 'N/A';

      if (items.length > 0) {
        items.forEach((item: any, itemIdx: number) => {
          const productName = formatProductNameWithVariants(item);
          const qty = item?.quantity || 0;
          const amount = parseFloat(item?.subtotal || 0);

          rows.push({
            rowId: `${order?.id}-${itemIdx}`,
            orderId: order?.id,
            receipt: receiptNo,
            displayReceipt: itemIdx === 0 ? receiptNo : '',
            customerName,
            courseYear,
            product: productName,
            quantity: qty,
            amount,
            payment: paymentFormatted,
            rawPaymentMethod: order?.payment_method,
            referenceNumber: order?.reference_number || '',
            status: statusFormatted,
            rawStatus: order?.status,
            date: dateFormatted,
            rawDate: dateTimestamp,
            itemIdx,
            isFirstItem: itemIdx === 0,
            rawOrder: order,
            rawItem: item
          });
        });
      } else {
        rows.push({
          rowId: `${order?.id || Math.random()}-0`,
          orderId: order?.id,
          receipt: receiptNo,
          displayReceipt: receiptNo,
          customerName,
          courseYear,
          product: 'Multiple Items',
          quantity: 1,
          amount: parseFloat(order?.total_amount || 0),
          payment: paymentFormatted,
          rawPaymentMethod: order?.payment_method,
          referenceNumber: order?.reference_number || '',
          status: statusFormatted,
          rawStatus: order?.status,
          date: dateFormatted,
          rawDate: dateTimestamp,
          itemIdx: 0,
          isFirstItem: true,
          rawOrder: order,
          rawItem: null
        });
      }
    });
    return rows;
  };

  const getFilteredAndSortedRows = (
    rows: any[],
    columnFilters: Record<string, string[]>,
    sortCol: string | null,
    sortDir: 'asc' | 'desc' | null,
    search: string,
    statFilter: string
  ) => {
    const result = rows.filter((row) => {
      // Top status filter
      if (statFilter !== 'all' && row.rawStatus !== statFilter) {
        return false;
      }
      // Top search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          row.customerName.toLowerCase().includes(q) ||
          row.receipt.toLowerCase().includes(q) ||
          row.product.toLowerCase().includes(q) ||
          row.courseYear.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Column filters
      for (const [key, allowedVals] of Object.entries(columnFilters)) {
        if (!allowedVals) continue;
        let rowVal = row[key];
        if (rowVal === undefined || rowVal === null || rowVal === '') {
          rowVal = '(Blanks)';
        } else {
          rowVal = String(rowVal);
        }
        if (!allowedVals.includes(rowVal)) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    if (sortCol && sortDir) {
      result.sort((a, b) => {
        let valA: any = a[sortCol];
        let valB: any = b[sortCol];

        if (sortCol === 'amount' || sortCol === 'quantity') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (sortCol === 'date') {
          valA = a.rawDate || 0;
          valB = b.rawDate || 0;
        } else {
          valA = String(valA || '').toLowerCase();
          valB = String(valB || '').toLowerCase();
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  };

  const dailyRows = useMemo(() => flattenOrdersToRows(dailyOrders), [dailyOrders]);
  const filteredDailyRows = useMemo(
    () => getFilteredAndSortedRows(dailyRows, dailyColumnFilters, dailySortColumn, dailySortDirection, searchQuery, statusFilter),
    [dailyRows, dailyColumnFilters, dailySortColumn, dailySortDirection, searchQuery, statusFilter]
  );

  const historyRows = useMemo(() => flattenOrdersToRows(historyOrders), [historyOrders]);
  const filteredHistoryRows = useMemo(
    () => getFilteredAndSortedRows(historyRows, historyColumnFilters, historySortColumn, historySortDirection, historySearchQuery, historyStatusFilter),
    [historyRows, historyColumnFilters, historySortColumn, historySortDirection, historySearchQuery, historyStatusFilter]
  );
  const [preOrderOrders, setPreOrderOrders] = useState<any[]>([]);
  const [downpaymentOrders, setDownpaymentOrders] = useState<any[]>([]);
  const [fullPaymentOrders, setFullPaymentOrders] = useState<any[]>([]);
  const [insuranceOrders, setInsuranceOrders] = useState<any[]>([]);
  const [hardboundOrders, setHardboundOrders] = useState<any[]>([]);
  const [swimmingOrders, setSwimmingOrders] = useState<any[]>([]);
  const [classRingOrders, setClassRingOrders] = useState<any[]>([]);
  const [isClassRingAvailable, setIsClassRingAvailable] = useState<boolean>(() => {
    const saved = localStorage.getItem('silms_class_ring_available');
    return saved !== null ? saved === 'true' : true;
  });

  const handleClassRingAvailabilityToggle = () => {
    const nextVal = !isClassRingAvailable;
    setIsClassRingAvailable(nextVal);
    localStorage.setItem('silms_class_ring_available', String(nextVal));
    window.dispatchEvent(new Event('silms_settings_updated'));
  };
  const [hardboundSearchQuery, setHardboundSearchQuery] = useState<string>('');
  const [hardboundFilterDate, setHardboundFilterDate] = useState<string>('');
  const [hardboundStatusFilter, setHardboundStatusFilter] = useState<'all' | 'submitted' | 'pending_submission'>('all');
  const [hardboundCurrentPage, setHardboundCurrentPage] = useState<number>(1);
  const [hardboundRowsPerPage, setHardboundRowsPerPage] = useState<number>(15);
  const [notifiedHardboundOrders, setNotifiedHardboundOrders] = useState<Record<string, { submittedAt: string; notifiedBy?: string }>>(() => {
    try {
      const saved = localStorage.getItem('coop_notified_hardbound_submitted');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isNotifyingHardbound, setIsNotifyingHardbound] = useState<string | null>(null);

  // Reset pagination when search query or filter date changes
  useEffect(() => {
    setHardboundCurrentPage(1);
  }, [hardboundSearchQuery, hardboundFilterDate, hardboundStatusFilter]);

  const [swimmingSearchQuery, setSwimmingSearchQuery] = useState<string>('');
  const [swimmingFilterDate, setSwimmingFilterDate] = useState<string>('');
  const [swimmingCurrentPage, setSwimmingCurrentPage] = useState<number>(1);
  const [swimmingRowsPerPage, setSwimmingRowsPerPage] = useState<number>(15);

  useEffect(() => {
    setSwimmingCurrentPage(1);
  }, [swimmingSearchQuery, swimmingFilterDate]);
  const [insuranceRevenue, setInsuranceRevenue] = useState<number>(0);
  const [tailoredFilter, setTailoredFilter] = useState<'all' | 'preorder' | 'downpayment' | 'fullpayment' | 'released'>('all');
  const [tailoredSearchQuery, setTailoredSearchQuery] = useState<string>('');
  const [fulfillmentSearchQuery, setFulfillmentSearchQuery] = useState<string>('');
  const [downpaymentSearchQuery, setDownpaymentSearchQuery] = useState<string>('');
  const [notifiedOrders, setNotifiedOrders] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('coop_notified_preorders');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<any | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; receiptNo: string; isInsurance?: boolean } | null>(null);
  const [restoreInventoryStock, setRestoreInventoryStock] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<'history' | 'daily'>('history');
  const [bulkDeleteScope, setBulkDeleteScope] = useState<'imported_only' | 'filtered_only' | 'all'>('imported_only');
  const [bulkRestoreInventoryStock, setBulkRestoreInventoryStock] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [remittanceOrders, setRemittanceOrders] = useState<any[]>([]);
  const [remittanceDate, setRemittanceDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }); // Default to today local start of day

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

  // Load remittance summary
  useEffect(() => {
    if (user?.id && activeTab === 'remittance') {
      loadRemittanceSummary();
      
      // Set up polling for real-time updates (every 10 seconds)
      const interval = setInterval(() => {
        loadPreOrderOrders(); // Keep tailored data updated too
        loadRemittanceSummary();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab, remittanceDate]);


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

  // Load orders for fulfillment and downpayment tabs
  useEffect(() => {
    if (user?.id && (activeTab === 'fulfillment' || activeTab === 'downpayment')) {
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

  // Load orders for hardbound tab
  useEffect(() => {
    if (user?.id && activeTab === 'hardbound') {
      loadHardboundOrders();
      
      // Set up polling for real-time updates (every 10 seconds)
      const interval = setInterval(() => {
        loadHardboundOrders();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab]);

  // Load orders for swimming tab
  useEffect(() => {
    if (user?.id && activeTab === 'swimming') {
      loadSwimmingOrders();
      
      const interval = setInterval(() => {
        loadSwimmingOrders();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab]);

  // Load orders for class ring tab
  useEffect(() => {
    if (user?.id && activeTab === 'classring') {
      loadClassRingOrders();
      
      const interval = setInterval(() => {
        loadClassRingOrders();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab]);

  // Load orders for GCash service charges tab
  useEffect(() => {
    if (user?.id && activeTab === 'gcash') {
      loadGcashOrders();
      
      const interval = setInterval(() => {
        loadGcashOrders();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab]);

  // Load orders for Printing and Photocopy tab
  useEffect(() => {
    if (user?.id && activeTab === 'printing') {
      loadPrintingOrders();
      
      const interval = setInterval(() => {
        loadPrintingOrders();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id, activeTab]);

  const [allUsers, setAllUsers] = useState<any[]>([]);
  // Excel / CSV Importer States
  const [showImportExcelModal, setShowImportExcelModal] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importWorkbook, setImportWorkbook] = useState<any>(null);
  const [importSheets, setImportSheets] = useState<string[]>([]);
  const [importSheetMeta, setImportSheetMeta] = useState<{ name: string; valid: boolean; reason?: string }[]>([]);
  const [selectedImportSheet, setSelectedImportSheet] = useState<string>('All Sheets');
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSettings, setImportSettings] = useState({
    defaultPaymentMethod: 'cash',
    autoCreateUsers: true,
    skipDuplicates: true
  });
  const [isSheetDropdownOpen, setIsSheetDropdownOpen] = useState(false);
  const [previewSelectedDate, setPreviewSelectedDate] = useState<string>('all');
  const [previewSearchQuery, setPreviewSearchQuery] = useState<string>('');

  const uniquePreviewDates = useMemo(() => {
    const dateMap = new Map<string, { dateKey: string; label: string; count: number; total: number }>();
    parsedTransactions.forEach(t => {
      const d = new Date(t.createdAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${y}-${m}-${day}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const existing = dateMap.get(dateKey);
      if (existing) {
        existing.count += 1;
        existing.total += t.totalAmount;
      } else {
        dateMap.set(dateKey, { dateKey, label, count: 1, total: t.totalAmount });
      }
    });
    return Array.from(dateMap.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [parsedTransactions]);

  const keepOnlyDateInPreview = (targetDateKey: string) => {
    const countBefore = parsedTransactions.length;
    const target = uniquePreviewDates.find(d => d.dateKey === targetDateKey);
    setParsedTransactions(prev => prev.filter(t => {
      const d = new Date(t.createdAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const k = `${y}-${m}-${day}`;
      return k === targetDateKey;
    }));
    setPreviewSelectedDate('all');
    showNotification(`Kept only ${target?.label || targetDateKey} (${target?.count || 0} orders). Removed ${countBefore - (target?.count || 0)} orders from preview.`, 'success');
  };

  const removeDateFromPreview = (targetDateKey: string) => {
    const target = uniquePreviewDates.find(d => d.dateKey === targetDateKey);
    setParsedTransactions(prev => prev.filter(t => {
      const d = new Date(t.createdAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const k = `${y}-${m}-${day}`;
      return k !== targetDateKey;
    }));
    setPreviewSelectedDate('all');
    showNotification(`Removed all ${target?.count || 0} orders for ${target?.label || targetDateKey} from preview`, 'info');
  };

  const removeAllDuplicatesFromPreview = () => {
    const count = parsedTransactions.filter(t => t.isDuplicate && !t.overrideDuplicate).length;
    setParsedTransactions(prev => prev.filter(t => !t.isDuplicate || t.overrideDuplicate));
    showNotification(`Removed ${count} duplicate transactions from preview`, 'info');
  };

  const filteredPreviewTransactions = useMemo(() => {
    return parsedTransactions.filter(t => {
      if (previewSelectedDate !== 'all') {
        const d = new Date(t.createdAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const k = `${y}-${m}-${day}`;
        if (k !== previewSelectedDate) return false;
      }
      if (previewSearchQuery.trim()) {
        const q = previewSearchQuery.toLowerCase().trim();
        const matchName = String(t.walkInName || '').toLowerCase().includes(q);
        const matchTr = String(t.receiptNo || '').toLowerCase().includes(q);
        const matchCourse = String(t.walkInCourse || '').toLowerCase().includes(q);
        const matchItem = (t.items || []).some((it: any) => String(it.productName || '').toLowerCase().includes(q));
        if (!matchName && !matchTr && !matchCourse && !matchItem) return false;
      }
      return true;
    });
  }, [parsedTransactions, previewSelectedDate, previewSearchQuery]);


  // Load users for excel imports
  useEffect(() => {
    if (showImportExcelModal) {
      const loadUsers = async () => {
        try {
          const response = await apiClient.getUsers();
          const usersData = Array.isArray(response) ? response : (response.users || []);
          const studentUsers = usersData.filter((u: any) => u.role === 'user');
          setAllUsers(studentUsers);
        } catch (e) {
          console.error('Failed to load users:', e);
          showNotification('Failed to load students list', 'error');
        }
      };
      loadUsers();
    }
  }, [showImportExcelModal]);

  // Reset parsed transactions when sheet selection changes
  useEffect(() => {
    if (importFile) {
      setParsedTransactions([]);
      setImportLogs(['Sheet selection changed. Ready to analyze.']);
      setImportProgress(null);
    }
  }, [selectedImportSheet]);

  const refreshActiveTabData = async () => {
    if (activeTab === 'pending') await loadPendingOrders();
    else if (activeTab === 'daily') await loadDailySummary();
    else if (activeTab === 'history') await loadHistorySummary();
    else if (activeTab === 'remittance') await loadRemittanceSummary();
    else if (activeTab === 'tailored') {
      await loadPreOrderOrders();
      await loadDownpaymentOrders();
      await loadFullPaymentOrders();
    }
    else if (activeTab === 'insurance') await loadInsuranceOrders();
    else if (activeTab === 'hardbound') await loadHardboundOrders();
    else if (activeTab === 'swimming') await loadSwimmingOrders();
    else if (activeTab === 'classring') await loadClassRingOrders();
    else if (activeTab === 'gcash') await loadGcashOrders();
    else if (activeTab === 'printing') await loadPrintingOrders();
  };

  // Excel / CSV Importer Helper Functions
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setImportLogs(['Reading spreadsheet...']);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        setImportWorkbook(workbook);
        
        // Known non-sales sheet names to always exclude
        const alwaysExcluded = ['template', 'edp', 'readme', 'instructions', 'sheet1', 'sheet2', 'sheet3'];

        /**
         * Detect if a sheet matches the expected sales transaction format:
         * Columns: Date | TR no. | Client | Course | Instructor | Item | Qty | Size | Amount
         * We scan the first 10 rows looking for the header row or data rows that fit the pattern.
         */
        const detectSheetFormat = (sheetName: string): { valid: boolean; reason?: string } => {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) return { valid: false, reason: 'Sheet is empty or missing' };

          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          if (rows.length < 2) return { valid: false, reason: 'Too few rows' };

          // Look for a header row containing the key columns within the first 10 rows
          const salesHeaders = [
            'date', 'tr no', 'tr #', 'tr.', 'receipt', 'or no', 'or #', 'trans',
            'client', 'student', 'name', 'buyer', 'payor', 'payer', 'customer',
            'item', 'product', 'particular', 'amount', 'price', 'total'
          ];
          for (let i = 0; i < Math.min(10, rows.length); i++) {
            const row = rows[i];
            if (!row) continue;
            const cellValues = row.map(c => String(c || '').replace(/\s+/g, ' ').toLowerCase().trim());
            const matchCount = salesHeaders.filter(h => cellValues.some(c => c.includes(h))).length;
            if (matchCount >= 3) {
              return { valid: true };
            }
          }

          // No explicit header found — try heuristic: check if rows look like sales data
          // A valid data row has: a date-like value in col A, a number in col B (TR no), a name in col C, an item in col E, a number in col H (amount)
          let validDataRows = 0;
          for (let i = 0; i < Math.min(20, rows.length); i++) {
            const row = rows[i];
            if (!row || row.length < 6) continue;
            const colA = String(row[0] || '').replace(/\s+/g, ' ').trim();
            const colB = String(row[1] || '').replace(/\s+/g, ' ').trim();
            const colE = String(row[4] || '').replace(/\s+/g, ' ').trim() || String(row[5] || '').replace(/\s+/g, ' ').trim();
            const colH = String(row[7] || '').replace(/\s+/g, ' ').trim() || String(row[8] || '').replace(/\s+/g, ' ').trim();
            const isTotalRow = [colA, colB, colE].some(c => c.toLowerCase().includes('total') || c.toLowerCase().includes('summary'));
            if (isTotalRow) continue;
            const hasDate = colA && (colA.includes('-') || colA.includes('/') || !isNaN(Number(colA)));
            const hasTrNo = colB && !isNaN(Number(colB)) && Number(colB) > 100;
            const hasItem = colE && colE.length > 2;
            const hasAmount = colH && !isNaN(parseFloat(colH.replace(/,/g, ''))) && parseFloat(colH.replace(/,/g, '')) > 0;
            if (hasDate && hasTrNo && hasItem && hasAmount) validDataRows++;
          }

          if (validDataRows >= 2) return { valid: true };

          return { valid: false, reason: 'Does not match expected sales format (Date | TR no. | Client | Course | Item | Qty | Size | Amount)' };
        };

        const allSheetMeta = workbook.SheetNames
          .filter(name => !alwaysExcluded.includes(name.toLowerCase().trim()))
          .map(name => ({ name, ...detectSheetFormat(name) }));

        const validSheets = allSheetMeta.filter(s => s.valid).map(s => s.name);
        const invalidSheets = allSheetMeta.filter(s => !s.valid).map(s => s.name);

        setImportSheetMeta(allSheetMeta);
        setImportSheets(validSheets);

        const logs: string[] = ['Reading spreadsheet...'];
        logs.push(`Found ${validSheets.length} compatible sheet(s): ${validSheets.join(', ') || 'none'}`);
        if (invalidSheets.length > 0) {
          logs.push(`⚠ Skipped ${invalidSheets.length} incompatible sheet(s): ${invalidSheets.join(', ')}`);
          logs.push('Incompatible sheets have a different column layout and cannot be auto-imported.');
        }
        setImportLogs(logs);
      } catch (err: any) {
        console.error('Error reading excel file:', err);
        setImportLogs(prev => [...prev, `ERROR: Failed to parse spreadsheet: ${err.message || err}`]);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = (err) => {
      setImportLogs(prev => [...prev, `ERROR: FileReader error: ${err}`]);
      setIsParsing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const parseDateForImport = (dateStr: string, sheetName: string): Date => {
    const defaultYear = 2026;
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    const getMonthIndex = (name: string): number => {
      const lower = (name || '').toLowerCase();
      const idx = months.findIndex(m => lower.includes(m));
      return idx !== -1 ? idx : 0;
    };

    let targetMonth = getMonthIndex(sheetName);
    let targetDay = 1;
    let targetYear = defaultYear;

    const trimmed = (dateStr || '').replace(/\s+/g, ' ').trim();
    if (trimmed) {
      const num = Number(trimmed);
      if (!isNaN(num) && num > 40000) {
        // Excel serial date number
        const date = new Date((num - 25569) * 86400 * 1000);
        return new Date(defaultYear, date.getUTCMonth(), date.getUTCDate(), 12, 0, 0);
      }

      if (!isNaN(num) && num >= 1 && num <= 31) {
        targetDay = Math.floor(num);
      } else {
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
          const [y, m, d] = trimmed.split('-').map(Number);
          targetYear = y || defaultYear;
          targetMonth = (m || 1) - 1;
          targetDay = d || 1;
        } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(trimmed)) {
          const parts = trimmed.split(/[/-]/).map(Number);
          if (parts[2] > 31) {
            targetYear = parts[2] < 100 ? 2000 + parts[2] : parts[2];
            targetMonth = (parts[0] <= 12 && parts[1] > 12) ? parts[0] - 1 : (parts[1] <= 12 ? parts[1] - 1 : parts[0] - 1);
            targetDay = (parts[0] <= 12 && parts[1] > 12) ? parts[1] : (parts[1] <= 12 ? parts[0] : parts[1]);
          }
        } else {
          const monthMatchIdx = months.findIndex(m => trimmed.toLowerCase().includes(m));
          if (monthMatchIdx !== -1) {
            targetMonth = monthMatchIdx;
            const dayMatch = trimmed.match(/\b([1-9]|[12]\d|3[01])\b/);
            if (dayMatch) {
              targetDay = parseInt(dayMatch[1], 10);
            }
            const yearMatch = trimmed.match(/\b(20\d\d)\b/);
            if (yearMatch) {
              targetYear = parseInt(yearMatch[1], 10);
            }
          } else {
            const parts = trimmed.split(/[-/,\s]+/);
            if (parts.length >= 2) {
              const p0 = Number(parts[0]);
              const p1 = Number(parts[1]);
              if (!isNaN(p0) && p0 >= 1 && p0 <= 31) {
                targetDay = p0;
                if (!isNaN(p1) && p1 >= 1 && p1 <= 12) targetMonth = p1 - 1;
                else targetMonth = getMonthIndex(parts[1]);
              } else if (!isNaN(p1) && p1 >= 1 && p1 <= 31) {
                targetDay = p1;
                targetMonth = getMonthIndex(parts[0]);
              }
            }
          }
        }
      }
    }

    return new Date(targetYear, targetMonth, targetDay, 12, 0, 0);
  };

  const mapSpreadsheetItemToProductForImport = (
    itemName: string,
    amountVal: number,
    qnty: number,
    size: string,
    course: string
  ) => {
    const nameLower = itemName.toLowerCase().trim();
    
    // Normalize Item Name to match the standard products
    let standardName = '';
    
    if (nameLower.includes('lanyard')) standardName = 'Lanyard';
    else if (nameLower.includes('id case') || nameLower.includes('idcase') || nameLower.includes('id card') || nameLower.includes('id-card')) standardName = 'ID Case';
    else if (nameLower.includes('handbag')) standardName = 'Handbag';
    else if (nameLower.includes('hardbound') || nameLower.includes('hard bound') || nameLower.includes('hard-bound')) standardName = 'Hard Bound';
    else if (nameLower.includes('safety shoes') || nameLower.includes('safety shoe')) standardName = 'Safety Shoes';
    else if (nameLower.includes('goggles') || nameLower.includes('goggle')) standardName = 'Safety Goggles';
    else if (nameLower.includes('cover all') || nameLower.includes('coverall') || nameLower.includes('cover-all')) standardName = 'Cover All';
    else if (nameLower.includes('gloves') || nameLower.includes('glove')) standardName = 'Gloves';
    else if (nameLower.includes('hard hat') || nameLower.includes('hardhat')) standardName = 'Hard Hat';
    else if (nameLower.includes('pe tshirt') || nameLower.includes('pe shirt') || nameLower.includes('p.e. shirt') || nameLower.includes('pe t-shirt')) standardName = 'PE Tshirt';
    else if (nameLower.includes('pe pants') || nameLower.includes('pe pant') || nameLower.includes('p.e. pants')) standardName = 'PE Pants';
    else if (nameLower.includes('pershing')) standardName = 'Pershing Cap';
    else if (nameLower.includes('plotting')) standardName = 'Plotting Sheet';
    else if (nameLower.includes('gala')) standardName = 'Gala';
    else if (nameLower.includes('bsname')) standardName = 'BSNAME Uniform';
    else if (nameLower.includes('pe short') || nameLower.includes('pe shorts') || nameLower.includes('p.e. shorts')) standardName = 'PE Short';
    else if (nameLower.includes('buttons') || nameLower.includes('button')) standardName = 'Buttons';
    else if (nameLower.includes('anchor')) standardName = 'Anchor Pins';
    else if (nameLower.includes('propeller')) standardName = 'Propeller Pins';
    else if (nameLower.includes('shoulder')) standardName = 'Shoulder Board';
    else if (nameLower.includes('swimming set') || nameLower.includes('swimset')) standardName = 'Swimming Set';
    else if (nameLower.includes('cwts')) standardName = 'CWTS Shirt';
    else if (nameLower.includes('rotc')) standardName = 'ROTC Manual';
    else if (nameLower.includes('belt')) standardName = 'Belt';
    else if (nameLower.includes('swim cap') || nameLower.includes('swimming cap')) standardName = 'Swimming Cap';
    else if (nameLower.includes('white shoes') || nameLower.includes('white shoe')) standardName = 'White Shoes';
    else if (nameLower.includes('rope')) standardName = 'Rope';
    else if (nameLower.includes('type a') || nameLower.includes('type b') || nameLower.includes('type a & b')) standardName = 'Type A & B Uniform';
    else if (nameLower.includes('type c')) standardName = 'Type C Uniform';
    else if (nameLower.includes('locker')) standardName = 'Locker Rent';
    else if (nameLower.includes('toga')) standardName = 'Toga Rent';
    else if (nameLower.includes('bonggo')) standardName = 'Income from Bonggo';
    else standardName = itemName; // default to whatever was in the sheet if no match

    // Find the product in store
    let matchedProduct: any = products.find(p => p.name.toLowerCase() === standardName.toLowerCase());
    
    // If not found in store, create a temporary mock object
    if (!matchedProduct) {
      if (standardName === 'Locker Rent') {
        matchedProduct = {
          id: 'prod-locker-rent',
          name: 'Locker Rent',
          sku: 'SRV-001',
          price: 150, // default locker rent price
          category: 'service',
          available: true,
          stock: 999,
          createdAt: new Date().toISOString()
        };
      } else if (standardName === 'Toga Rent') {
        matchedProduct = {
          id: 'prod-toga-rent',
          name: 'Toga Rent',
          sku: 'SRV-002',
          price: 300, // default toga rent price
          category: 'service',
          available: true,
          stock: 999,
          createdAt: new Date().toISOString()
        };
      } else {
        matchedProduct = {
          id: `prod-temp-${standardName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: standardName,
          sku: `TEMP-${standardName.toUpperCase().substring(0, 3)}`,
          price: amountVal / (qnty || 1),
          category: 'uniform',
          available: true,
          stock: 999,
          createdAt: new Date().toISOString()
        };
      }
    }

    // Resolve Options
    const selectedOptions: Record<string, string> = {};
    const rowUnitPrice = Math.round(amountVal / (qnty || 1));
    
    if (matchedProduct.options) {
      const courseOption = matchedProduct.options.find((o: any) => o.id === 'course');
      if (courseOption) {
        const val = course.toUpperCase().trim();
        let matchedChoice = courseOption.choices.find((c: any) => {
          const matchPrice = c.match(/₱([\d,]+)/);
          return matchPrice && parseInt(matchPrice[1].replace(/,/g, '')) === rowUnitPrice;
        });

        if (!matchedChoice) {
          matchedChoice = courseOption.choices.find((c: any) => {
            const cleanChoice = c.split(' ')[0].toUpperCase();
            return val === cleanChoice || val.startsWith(cleanChoice) || cleanChoice.startsWith(val);
          }) || courseOption.choices[0];
        }
        
        selectedOptions['course'] = matchedChoice;
      }
      
      const sizeOption = matchedProduct.options.find((o: any) => o.id === 'size');
      if (sizeOption) {
        let val = size.toUpperCase().trim();
        // Normalize size aliases
        if (val === 'XXL') val = '2XL';
        else if (val === 'XXXL') val = '3XL';
        else if (val === 'XXXXL') val = '4XL';
        else if (val === 'XXXXXL') val = '5XL';
        else if (val === 'S') val = 'SMALL';
        else if (val === 'M') val = 'MEDIUM';
        else if (val === 'L') val = 'LARGE';

        // 1. Try to match by unit price if choice has price tag e.g. "2XL (₱210)"
        let matchedChoice = sizeOption.choices.find((c: any) => {
          const matchPrice = c.match(/₱([\d,]+)/);
          return matchPrice && parseInt(matchPrice[1].replace(/,/g, '')) === rowUnitPrice;
        });

        // 2. Try exact clean size match
        if (!matchedChoice && val) {
          matchedChoice = sizeOption.choices.find((c: any) => {
            const cleanChoice = c.split(' ')[0].toUpperCase();
            return val === cleanChoice;
          });
        }

        // 3. Try prefix match
        if (!matchedChoice && val) {
          matchedChoice = sizeOption.choices.find((c: any) => {
            const cleanChoice = c.split(' ')[0].toUpperCase();
            return cleanChoice.startsWith(val) || val.startsWith(cleanChoice);
          });
        }

        // 4. Fallback to first choice
        if (!matchedChoice) {
          matchedChoice = sizeOption.choices[0];
        }
        
        selectedOptions['size'] = matchedChoice;
      }

      const bundleOption = matchedProduct.options.find((o: any) => o.id === 'bundle');
      if (bundleOption) {
        const matchedChoice = bundleOption.choices.find((c: any) => {
          const bundleLabel = c.split(' ')[0] + ' ' + c.split(' ')[1];
          return nameLower.includes(bundleLabel.toLowerCase());
        }) || bundleOption.choices[0];
        
        selectedOptions['bundle'] = matchedChoice;
      }
    }

    const isTailoredProduct = ['Gala', 'Type A & B Uniform', 'BSNAME Uniform'].includes(matchedProduct.name);
    let paymentType: 'full' | 'downpayment' = 'full';
    let fullPrice: number | undefined = undefined;

    if (isTailoredProduct) {
      const rowUnitPrice = amountVal / (qnty || 1);
      if (matchedProduct.name === 'Gala' && rowUnitPrice <= 500) {
        paymentType = 'downpayment';
        fullPrice = matchedProduct.price;
      } else if ((matchedProduct.name === 'Type A & B Uniform' || matchedProduct.name === 'BSNAME Uniform') && rowUnitPrice <= 1500) {
        paymentType = 'downpayment';
        fullPrice = matchedProduct.price;
      }
    }

    return {
      productId: matchedProduct.id,
      productName: matchedProduct.name,
      unitPrice: amountVal / (qnty || 1),
      selectedOptions,
      paymentType,
      orderType: isTailoredProduct ? 'preorder' : 'regular',
      fullPrice
    };
  };

  const executeImport = async () => {
    if (parsedTransactions.length === 0) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: parsedTransactions.length });
    const logs = [...importLogs, 'Starting batch import process...'];
    setImportLogs(logs);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    try {
      const hasLockerItem = parsedTransactions.some(t => 
        t.items.some((item: any) => item.productName === 'Locker Rent')
      );
      const hasTogaItem = parsedTransactions.some(t => 
        t.items.some((item: any) => item.productName === 'Toga Rent')
      );
      
      let dbProducts = [...products];
      if (hasLockerItem && !dbProducts.some(p => p.name.toLowerCase() === 'locker rent')) {
        logs.push('Locker Rent product not found in database. Auto-creating Locker Rent service product...');
        setImportLogs([...logs]);
        try {
          const newProd = await apiClient.createProduct({
            name: 'Locker Rent',
            sku: 'SRV-001',
            price: 150,
            category: 'service',
            stock: 9999,
            available: true,
            image: '🔑'
          });
          logs.push(`Successfully created Locker Rent product: ${newProd.id}`);
          setImportLogs([...logs]);
          
          await AppDataSync.loadProductsFromAPI();
          dbProducts = useAppStore.getState().products;
        } catch (prodErr: any) {
          console.error('Failed to create Locker Rent product:', prodErr);
          logs.push(`WARNING: Failed to auto-create Locker Rent product: ${prodErr.message || prodErr}. Using temp fallback.`);
          setImportLogs([...logs]);
        }
      }

      if (hasTogaItem && !dbProducts.some(p => p.name.toLowerCase() === 'toga rent')) {
        logs.push('Toga Rent product not found in database. Auto-creating Toga Rent service product...');
        setImportLogs([...logs]);
        try {
          const newProd = await apiClient.createProduct({
            name: 'Toga Rent',
            sku: 'SRV-002',
            price: 300,
            category: 'service',
            stock: 9999,
            available: true,
            image: '🎓'
          });
          logs.push(`Successfully created Toga Rent product: ${newProd.id}`);
          setImportLogs([...logs]);
          
          await AppDataSync.loadProductsFromAPI();
          dbProducts = useAppStore.getState().products;
        } catch (prodErr: any) {
          console.error('Failed to create Toga Rent product:', prodErr);
          logs.push(`WARNING: Failed to auto-create Toga Rent product: ${prodErr.message || prodErr}. Using temp fallback.`);
          setImportLogs([...logs]);
        }
      }

      const uniqueTempProducts = new Map<string, any>();
      parsedTransactions.forEach(t => {
        t.items.forEach((item: any) => {
          if (item.productId.startsWith('prod-temp-')) {
            uniqueTempProducts.set(item.productName, item);
          }
        });
      });

      if (uniqueTempProducts.size > 0) {
        logs.push(`Found ${uniqueTempProducts.size} custom product(s) in spreadsheet. Auto-creating them in DB to ensure database integrity...`);
        setImportLogs([...logs]);
        for (const [pName, item] of uniqueTempProducts.entries()) {
          if (!dbProducts.some(p => p.name.toLowerCase() === pName.toLowerCase())) {
            try {
              const cleanSku = `UNI-${Math.floor(100 + Math.random() * 900)}`;
              const created = await apiClient.createProduct({
                name: pName,
                sku: cleanSku,
                price: item.unitPrice,
                category: 'uniform',
                stock: 9999,
                available: true,
                image: '👕'
              });
              logs.push(`Successfully created product: ${pName} (${created.id})`);
              setImportLogs([...logs]);
            } catch (prodErr: any) {
              console.error(`Failed to create product ${pName}:`, prodErr);
              logs.push(`WARNING: Failed to auto-create product ${pName}: ${prodErr.message || prodErr}`);
              setImportLogs([...logs]);
            }
          }
        }
        
        await AppDataSync.loadProductsFromAPI();
        dbProducts = useAppStore.getState().products;
      }

      const updatedTransactions = parsedTransactions.map(t => {
        const updatedItems = t.items.map((item: any) => {
          const dbProd = dbProducts.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
          if (dbProd) {
            return {
              ...item,
              productId: dbProd.id
            };
          }
          return item;
        });
        return {
          ...t,
          items: updatedItems
        };
      });

      for (let i = 0; i < updatedTransactions.length; i++) {
        const t = updatedTransactions[i];
        setImportProgress({ current: i + 1, total: updatedTransactions.length });

        if (t.isDuplicate && !t.overrideDuplicate && importSettings.skipDuplicates) {
          logs.push(`[SKIP] Transaction ${t.receiptNo} is a duplicate. Skipping.`);
          setImportLogs([...logs]);
          skipCount++;
          continue;
        }

        let isWalkIn = true;
        let userId = undefined;
        const cleanName = (t.walkInName || '').toLowerCase().trim();
        
        if (cleanName && cleanName !== 'walk-in student') {
          const matchedUser = allUsers?.find((u: any) => {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().trim();
            const reverseFullName = `${u.lastName || ''} ${u.firstName || ''}`.toLowerCase().trim();
            const commaFullName = `${u.lastName || ''}, ${u.firstName || ''}`.toLowerCase().trim();
            const uname = (u.name || '').toLowerCase().trim();
            const idMatch = t.walkInIdNumber && (u.id_number === t.walkInIdNumber || u.idNumber === t.walkInIdNumber || u.studentId === t.walkInIdNumber);
            return idMatch || fullName === cleanName || reverseFullName === cleanName || commaFullName === cleanName || uname === cleanName;
          });

          if (matchedUser) {
            isWalkIn = false;
            userId = matchedUser.id;
          }
        }

        const orderData = {
          isWalkIn,
          walkInName: isWalkIn ? t.walkInName : undefined,
          walkInIdNumber: isWalkIn ? (t.walkInIdNumber || undefined) : undefined,
          walkInCourse: isWalkIn ? t.walkInCourse : undefined,
          walkInMembershipStatus: isWalkIn ? t.walkInMembershipStatus : undefined,
          userId,
          items: t.items.map((item: any) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            selectedOptions: item.selectedOptions,
            paymentType: item.paymentType || null,
            orderType: item.orderType || 'regular',
            fullPrice: item.fullPrice || null
          })),
          totalAmount: t.totalAmount,
          paymentMethod: t.paymentMethod,
          referenceNumber: t.referenceNumber || null,
          receiptNo: t.receiptNo,
          orderType: 'merchandise',
          status: 'completed',
          createdAt: t.createdAt,
          completedAt: t.completedAt,
          skipStockDeduction: true  // Historical import — do not touch current inventory
        };

        try {
          await apiClient.createOrder(orderData, user?.id || '');
          logs.push(`[SUCCESS] Imported receipt ${t.receiptNo} (${t.walkInName})`);
          setImportLogs([...logs]);
          successCount++;
        } catch (orderErr: any) {
          console.error(`Failed to import transaction ${t.receiptNo}:`, orderErr);
          logs.push(`[ERROR] Failed to save transaction ${t.receiptNo}: ${orderErr.message || orderErr}`);
          setImportLogs([...logs]);
          failCount++;
        }
      }

      logs.push(`Import completed! Success: ${successCount}, Skipped: ${skipCount}, Failed: ${failCount}.`);
      setImportLogs([...logs]);
      showNotification(`Import finished. Saved ${successCount} transactions successfully!`, 'success');

      await refreshActiveTabData();
      
      setTimeout(() => {
        setShowImportExcelModal(false);
        setImportFile(null);
        setImportWorkbook(null);
        setImportSheetMeta([]);
        setParsedTransactions([]);
      }, 3000);

    } catch (err: any) {
      console.error('Batch import process error:', err);
      logs.push(`FATAL ERROR: Import process failed - ${err.message || err}`);
      setImportLogs([...logs]);
      showNotification('Import process encountered a fatal error', 'error');
    } finally {
      setIsImporting(false);
    }
  };


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
      
      // Filter orders for today (exclude insurance and class ring orders)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = allOrders.filter((order: any) => {
        // Use completed_at for completed orders (payment date), created_at for cancelled orders
        const orderDate = new Date((order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        const isToday = orderDate.getTime() === today.getTime();
        const isCompletedOrCancelled = order.status === 'completed' || order.status === 'released' || order.status === 'cancelled';
        const isNotInsurance = order.order_type !== 'insurance';
        const isNotRing = !isClassRingOrder(order);
        
        return isToday && isCompletedOrCancelled && isNotInsurance && isNotRing;
      });
      
      console.log('[Daily Summary] Filtered orders:', todayOrders.length, 'out of', allOrders.length);
      setDailyOrders(todayOrders);
    } catch (err) {
      console.error('Failed to load daily summary:', err);
    }
  };

  const handleDeleteOrder = (orderId: string, receiptNo: string) => {
    setOrderToDelete({ id: orderId, receiptNo });
    setRestoreInventoryStock(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setIsDeleting(true);
    try {
      await apiClient.deleteOrderAsAdmin(orderToDelete.id, user?.id || '', restoreInventoryStock);
      showNotification(
        `Order #${orderToDelete.receiptNo} deleted successfully${restoreInventoryStock ? ' (inventory stock restored)' : ' (stock not restored)'}`,
        'success'
      );
      setOrderToDelete(null);
      
      // Reload summaries to update the tables and stats immediately
      loadDailySummary();
      loadHistorySummary();
      loadInsuranceOrders();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      showNotification(error?.message || 'Failed to delete order', 'error');
    } finally {
      setIsDeleting(false);
    }
  };


  const isImportedReceipt = (r: string) => {
    const norm = String(r || '').toUpperCase().trim();
    return norm.startsWith('TR-') || norm.startsWith('TR ') || norm.startsWith('TR#') || norm.includes('WALKIN') || norm.includes('COPY OF');
  };

  const handleBulkDeleteDay = async () => {
    const allTargetOrders = bulkDeleteTarget === 'history' ? historyOrders : dailyOrders;
    const currentFilteredRows = bulkDeleteTarget === 'history' ? filteredHistoryRows : filteredDailyRows;

    let ordersToClear: any[] = [];
    if (bulkDeleteScope === 'all') {
      ordersToClear = allTargetOrders;
    } else if (bulkDeleteScope === 'imported_only') {
      ordersToClear = allTargetOrders.filter((o: any) => isImportedReceipt(o.receipt_no || o.receiptNo));
    } else if (bulkDeleteScope === 'filtered_only') {
      const filteredOrderIds = new Set(currentFilteredRows.map((r: any) => r.orderId));
      ordersToClear = allTargetOrders.filter((o: any) => filteredOrderIds.has(o.id));
    }

    if (!ordersToClear || ordersToClear.length === 0) {
      showNotification('No orders match the selected deletion criteria', 'warning');
      return;
    }

    const orderIds = Array.from(new Set(ordersToClear.map((o: any) => o.id).filter(Boolean)));
    if (orderIds.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const res = await apiClient.bulkDeleteOrdersAsAdmin(
        orderIds,
        user?.id || '',
        bulkRestoreInventoryStock
      );
      showNotification(
        `Successfully deleted ${res?.deletedCount || orderIds.length} orders${
          bulkRestoreInventoryStock ? ' (inventory stock restored)' : ' (stock not modified)'
        }`,
        'success'
      );
      setShowBulkDeleteModal(false);

      // Reload summaries immediately
      await loadDailySummary();
      await loadHistorySummary();
    } catch (error: any) {
      console.error('Failed to bulk delete orders:', error);
      showNotification(error?.message || 'Failed to bulk delete orders', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const loadHistorySummary = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      // Filter orders for selected date (exclude insurance and class ring orders)
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);
      
      const historyOrdersFiltered = allOrders.filter((order: any) => {
        // Use completed_at for completed orders (payment date), created_at for cancelled orders
        const orderDate = new Date((order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === targetDate.getTime() && 
               (order.status === 'completed' || order.status === 'released' || order.status === 'cancelled') &&
               order.order_type !== 'insurance' &&
               !isClassRingOrder(order); // Exclude Class Ring orders from Coop sales
      });
      
      setHistoryOrders(historyOrdersFiltered);
    } catch (err) {
      console.error('Failed to load history summary:', err);
    }
  };

  const isLockerRentalOrder = (order: any): boolean => {
    if (!order) return false;
    if (order.order_type === 'locker' || order.order_type === 'locker_rental') return true;
    if (order.items && Array.isArray(order.items)) {
      return order.items.some((item: any) => {
        const name = (item.product_name || item.productName || item.name || '').toLowerCase();
        return name.includes('locker');
      });
    }
    const mainName = (order.product_name || order.productName || order.name || '').toLowerCase();
    return mainName.includes('locker');
  };

  const loadRemittanceSummary = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      const targetDate = new Date(remittanceDate);
      targetDate.setHours(0, 0, 0, 0);
      
      const filtered = allOrders.filter((order: any) => {
        const orderDate = new Date((order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === targetDate.getTime() && 
               (order.status === 'completed' || order.status === 'released' || order.status === 'cancelled') &&
               order.order_type !== 'insurance' &&
               !isClassRingOrder(order) &&
               !isLockerRentalOrder(order);
      });
      
      setRemittanceOrders(filtered);
    } catch (err) {
      console.error('Failed to load remittance summary:', err);
    }
  };

  const loadClassRingOrders = async () => {
    try {
      const allTransactions = await apiClient.getAllTransactions(user?.id || '') as any[];
      if (Array.isArray(allTransactions)) {
        const ringOrders = allTransactions.filter((order: any) => isClassRingOrder(order));
        setClassRingOrders(ringOrders);
      }
    } catch (err) {
      console.error('Failed to load Class Ring orders:', err);
    }
  };

  const loadGcashOrders = async () => {
    try {
      const allTransactions = await apiClient.getAllTransactions(user?.id || '') as any[];
      if (Array.isArray(allTransactions)) {
        const gcashList = allTransactions.filter((order: any) => {
          const method = String(order?.payment_method || '').toLowerCase();
          return method === 'ewallet' || method === 'gcash';
        });
        setGcashOrders(gcashList);
      }
    } catch (err) {
      console.error('Failed to load GCash orders:', err);
    }
  };

  // Helper to check if an item is a downpayment item
  const isDownpaymentItem = (item: any): boolean => {
    const paymentType = item.paymentType || item.payment_type;
    if (paymentType === 'downpayment') return true;
    if (paymentType === 'full') return false;

    // For legacy orders or items without explicit paymentType, check subtotal
    const productName = item.productName || item.product_name || item.name || '';
    const subtotal = parseFloat(item.subtotal || item.price || 0);

    if (productName.includes('Gala') && subtotal === 500) return true;
    if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return true;
    return false;
  };

  const loadPreOrderOrders = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      // Filter for pre-order items (excluding downpayment items)
      const preOrders = allOrders.filter((order: any) => {
        if (!order.items || !Array.isArray(order.items)) return false;
        
        // Exclude orders that contain downpayment items
        const hasDownpayment = order.items.some(isDownpaymentItem);
        if (hasDownpayment) return false;

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
        return order.items.some(isDownpaymentItem);
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
        // Exclude pre-order orders
        const isPreOrder = order.items && Array.isArray(order.items) && order.items.some((item: any) => item.orderType === 'preorder' || item.order_type === 'preorder');
        if (isPreOrder) return false;

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
      
      // Filter for insurance orders (order_type = 'insurance' and status = 'completed' or 'released')
      const insuranceOrdersFiltered = allOrders.filter((order: any) => 
        order.order_type === 'insurance' && (order.status === 'completed' || order.status === 'released')
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

  const loadHardboundOrders = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      const hardboundOrdersFiltered = allOrders.filter((order: any) => {
        if (!order.items || !Array.isArray(order.items)) return false;
        if (order.status !== 'completed') return false;
        return order.items.some((item: any) => {
          const productName = item.productName || item.product_name || '';
          return productName.toLowerCase().includes('hard bound') || productName.toLowerCase().includes('hardbound');
        });
      });
      
      setHardboundOrders(hardboundOrdersFiltered);
    } catch (err) {
      console.error('Failed to load hardbound orders:', err);
    }
  };

  const handleNotifyHardboundSubmitted = async (order: any) => {
    if (isNotifyingHardbound) return;
    try {
      setIsNotifyingHardbound(order.id);
      const customerName = formatFullName(order.first_name, order.last_name) || order.walk_in_name || 'Valued Student';
      const targetEmail = (order.email && order.email.includes('@') && !order.email.includes('@uc-metc-walkin.com'))
        ? order.email
        : (allUsers.find((u: any) => u.id === order.user_id)?.email || '');

      const hardboundItem = order.items?.find((item: any) => {
        const name = (item.productName || item.product_name || '').toLowerCase();
        return name.includes('hard bound') || name.includes('hardbound');
      });

      const researchTitle = hardboundItem?.selectedOptions?.researchTitle || order.selectedOptions?.researchTitle || 'Research Project';
      const leadResearcher = hardboundItem?.selectedOptions?.leadResearcher || order.selectedOptions?.leadResearcher || customerName;

      const subject = `Your Hardbound Book Has Been Submitted to the Research Office! - Receipt #${order.receipt_no}`;
      const body = `Hello ${customerName},\n\nGood news! Your Hardbound research book (Receipt #${order.receipt_no}) has been processed and officially submitted to the UC METC Research Office.\n\nResearch Details:\n• Research Title: "${researchTitle}"\n• Lead Researcher: ${leadResearcher}\n\nYour hardbound is now with the Research Office for review, recording, and final endorsement. You no longer need to check personally at the Coop Office.\n\nBest regards,\nUC METC Multipurpose Cooperative (Coop Office)`;

      if (targetEmail && targetEmail.includes('@') && !targetEmail.includes('@uc-metc-walkin.com')) {
        await apiClient.sendEmail({
          to: targetEmail,
          subject,
          body
        });
        showNotification(`Notification sent to ${customerName} (${targetEmail})!`, 'success');
      } else {
        showNotification(`Hardbound marked as submitted to Research Office for ${customerName}!`, 'success');
      }

      setNotifiedHardboundOrders(prev => {
        const updated = {
          ...prev,
          [order.id]: {
            submittedAt: new Date().toISOString(),
            notifiedBy: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Coop Staff'
          }
        };
        try {
          localStorage.setItem('coop_notified_hardbound_submitted', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save hardbound notification state', e);
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to send hardbound submission notification:', err);
      showNotification('Failed to send submission notification', 'error');
    } finally {
      setIsNotifyingHardbound(null);
    }
  };

  const loadSwimmingOrders = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      const swimmingOrdersFiltered = allOrders.filter((order: any) => {
        if (!order.items || !Array.isArray(order.items)) return false;
        if (order.status !== 'completed' && order.status !== 'released') return false;
        return order.items.some((item: any) => {
          const name = (item.productName || item.product_name || '').toLowerCase();
          return name.includes('swimming') || name.includes('swim set') || name.includes('swim cap') || name.includes('swimset');
        });
      });
      
      setSwimmingOrders(swimmingOrdersFiltered);
    } catch (err) {
      console.error('Failed to load swimming orders:', err);
    }
  };

  const isPrintingOrPhotocopyItem = (item: any): boolean => {
    if (!item) return false;
    const name = (item.product_name || item.productName || item.name || '').toLowerCase();
    const cat = (item.category || '').toLowerCase();
    return name.includes('print') || name.includes('photocopy') || name.includes('photo copy') || name.includes('xerox') || name.includes('copying') || cat === 'printing' || cat === 'photocopy';
  };

  const isPrintingOrPhotocopyOrder = (order: any): boolean => {
    if (!order) return false;
    const orderType = (order.order_type || order.orderType || '').toLowerCase();
    if (orderType === 'printing' || orderType === 'photocopy' || orderType === 'xerox') return true;
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items.some(isPrintingOrPhotocopyItem);
    }
    const mainName = (order.product_name || order.productName || order.name || '').toLowerCase();
    return mainName.includes('print') || mainName.includes('photocopy') || mainName.includes('photo copy') || mainName.includes('xerox') || mainName.includes('copying');
  };

  const loadPrintingOrders = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      const printingFiltered = (allOrders || []).filter((order: any) => isPrintingOrPhotocopyOrder(order));
      setPrintingOrders(printingFiltered);
    } catch (err) {
      console.error('Failed to load printing and photocopy orders:', err);
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

  const changeRemittanceDate = (days: number) => {
    const newDate = new Date(remittanceDate);
    newDate.setHours(0, 0, 0, 0);
    newDate.setDate(newDate.getDate() + days);
    
    // Don't allow future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate.getTime() <= today.getTime()) {
      setRemittanceDate(newDate);
    }
  };

  const exportToExcel = () => {
    // Local date formatter to prevent UTC day shifting
    const formatLocalDate = (date: Date): string => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    // Utility functions to wrap Excel XML/HTML and trigger download
    const getExcelHtmlWrapper = (title: string, subtitle: string, cards: Array<{ label: string; value: string; bg: string; border: string; color: string }>, tableHeader: string, tableRows: string) => {
      return `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Sales Report</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        </head>
        <body>
          <table style="margin-bottom: 20px; border: none; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <tr>
              <td colspan="5" style="font-size: 20px; font-weight: bold; color: #1e1b4b; padding-bottom: 5px;">
                UC-METC Multipurpose Cooperative - ${title}
              </td>
            </tr>
            <tr>
              <td colspan="5" style="font-size: 12px; color: #64748b; padding-bottom: 20px;">
                ${subtitle} | Generated on: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
              </td>
            </tr>
            
            ${cards.length > 0 ? `
            <tr style="height: 40px;">
              ${cards.map((card, i) => `
                <td ${i === cards.length - 1 ? 'colspan="2"' : ''} style="background-color: ${card.bg}; border: 1px solid ${card.border}; padding: 10px; text-align: center; border-radius: 8px;">
                  <span style="font-size: 9px; color: ${card.color}; font-weight: bold; text-transform: uppercase;">${card.label}</span><br/>
                  <span style="font-size: 14px; font-weight: bold; color: #1e1b4b;">${card.value}</span>
                </td>
              `).join('')}
            </tr>
            ` : ''}
          </table>

          <table style="border-collapse: collapse; border: 1px solid #cbd5e1;">
            <thead>
              ${tableHeader}
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
        </html>
      `;
    };

    const triggerExcelDownload = (htmlContent: string, fileName: string) => {
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    // Helper to resolve category and SKU from master products
    const resolveProductInfo = (itemName: string) => {
      const baseName = itemName.split(' - ')[0];
      const matchedProduct = products.find(p => p.name === baseName);
      const category = matchedProduct?.category ? matchedProduct.category.charAt(0).toUpperCase() + matchedProduct.category.slice(1) : 'Merchandise';
      const sku = matchedProduct?.sku || 'N/A';
      return { category, sku };
    };

    if (activeTab === 'remittance') {
      const dailyProductsSold: Record<string, { quantity: number; revenue: number; category: string; sku: string; price: number }> = {};
      
      remittanceOrders
        .filter((order: any) => (order.status === 'completed' || order.status === 'released') && order.order_type !== 'insurance')
        .forEach((order: any) => {
          const isBalancePayment = (order.receipt_no && order.receipt_no.startsWith('BAL-')) ||
                                   (order.receiptNo && order.receiptNo.startsWith('BAL-'));
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const productName = formatProductNameWithVariants(item);
              const { category, sku } = resolveProductInfo(item.productName || item.product_name || '');
              const unitPrice = parseFloat(item.unitPrice || item.unit_price || 0);

              if (!dailyProductsSold[productName]) {
                dailyProductsSold[productName] = { quantity: 0, revenue: 0, category, sku, price: unitPrice };
              }
              if (!isBalancePayment) {
                dailyProductsSold[productName].quantity += item.quantity;
              }
              dailyProductsSold[productName].revenue += parseFloat(item.subtotal || 0);
            });
          }
        });

      const rows = Object.entries(dailyProductsSold)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .map(([productName, data]) => ({
          name: productName,
          category: data.category,
          sku: data.sku,
          price: data.price,
          quantity: data.quantity,
          revenue: data.revenue
        }));

      const totalSales = rows.reduce((sum, r) => sum + r.revenue, 0);
      const totalUnits = rows.reduce((sum, r) => sum + r.quantity, 0);

      const tableHeader = `
        <tr style="background-color: #6d28d9; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; height: 35px;">
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 250px;">Product Name</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Category</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 150px;">SKU</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 110px;">Unit Price</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 100px;">Units Sold</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 130px;">Total Revenue</th>
        </tr>
      `;

      const tableRows = rows.map((row, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        return `
          <tr style="background-color: ${bg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #334155; height: 30px;">
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${row.name}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 11px; font-weight: bold; color: #64748b;">${row.category}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; color: #0f172a;">${row.sku}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #6d28d9;">₱${row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${row.quantity}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #047857;">₱${row.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      }).join('');

      const dateTitle = remittanceDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const htmlContent = getExcelHtmlWrapper(
        'Daily Remittance Report',
        `Remittance Date: ${dateTitle}`,
        [
          { label: 'Total Sales', value: `₱${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
          { label: 'Completed Orders', value: remittanceOrders.filter((o: any) => (o.status === 'completed' || o.status === 'released') && o.order_type !== 'insurance').length.toString(), bg: '#f3e8ff', border: '#d8b4fe', color: '#6d28d9' },
          { label: 'Products Sold', value: `${totalUnits} units`, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' }
        ],
        tableHeader,
        tableRows
      );

      triggerExcelDownload(htmlContent, `daily_remittance_${formatLocalDate(remittanceDate)}`);
      showNotification('Daily remittance report exported successfully!', 'success');
      return;
    }


    if (activeTab === 'daily' || activeTab === 'history') {
      const isHistory = activeTab === 'history';
      const ordersToExport = isHistory ? historyOrders : dailyOrders;
      const filterToUse = isHistory ? historyStatusFilter : statusFilter;
      const filteredOrders = ordersToExport.filter(order => filterToUse === 'all' || order.status === filterToUse);
      
      const rows: any[] = [];
      filteredOrders.forEach(order => {
        const items = order?.items || [];
        const courseYear = order?.course && order?.year 
          ? `${order.course} - ${order.year}` 
          : order?.course || order?.year || 'N/A';
        const orderDateStr = (order?.status === 'completed' || order?.status === 'released') && order?.completed_at ? order.completed_at : order?.created_at;
        const date = orderDateStr ? new Date(orderDateStr).toLocaleDateString() : 'N/A';

        if (items.length > 0) {
          items.forEach((item: any) => {
            const { category, sku } = resolveProductInfo(item.productName || item.product_name || '');
            rows.push({
              receiptNo: order?.receipt_no || 'N/A',
              customerName: order?.first_name ? formatFullName(order.first_name, order.last_name) : 'N/A',
              idNumber: order?.id_number || 'N/A',
              courseYear,
              productName: formatProductNameWithVariants(item),
              sku,
              category,
              unitPrice: parseFloat(item?.unitPrice || item?.unit_price || 0),
              quantity: item?.quantity || 0,
              subtotal: parseFloat(item?.subtotal || 0),
              paymentMethod: formatPaymentMethod(order?.payment_method),
              referenceNumber: order?.reference_number || 'N/A',
              status: order?.status === 'completed' ? 'COMPLETED' : order?.status === 'released' ? 'RELEASED' : 'CANCELLED',
              date
            });
          });
        } else {
          rows.push({
            receiptNo: order?.receipt_no || 'N/A',
            customerName: order?.first_name ? formatFullName(order.first_name, order.last_name) : 'N/A',
            idNumber: order?.id_number || 'N/A',
            courseYear,
            productName: 'Multiple Items',
            sku: 'N/A',
            category: 'Merchandise',
            unitPrice: parseFloat(order?.total_amount || 0),
            quantity: 1,
            subtotal: parseFloat(order?.total_amount || 0),
            paymentMethod: formatPaymentMethod(order?.payment_method),
            referenceNumber: order?.reference_number || 'N/A',
            status: order?.status === 'completed' ? 'COMPLETED' : order?.status === 'released' ? 'RELEASED' : 'CANCELLED',
            date
          });
        }
      });

      const totalSales = rows.reduce((sum, r) => (r.status === 'COMPLETED' || r.status === 'RELEASED') ? sum + r.subtotal : sum, 0);
      const completedCount = filteredOrders.filter(o => o.status === 'completed' || o.status === 'released').length;
      const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length;

      const tableHeader = `
        <tr style="background-color: #6d28d9; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; height: 35px;">
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 120px;">Receipt No</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 160px;">Customer Name</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 120px;">ID Number</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Course & Year</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 220px;">Product Name</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 110px;">SKU</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">Category</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 100px;">Unit Price</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 80px;">Qty</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 110px;">Subtotal</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">Payment</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 130px;">Ref Number</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 110px;">Status</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">Date</th>
        </tr>
      `;

      const tableRows = rows.map((row, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        const statusColor = row.status === 'COMPLETED' ? '#166534' : '#991b1b';
        const statusBg = row.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2';

        return `
          <tr style="background-color: ${bg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #334155; height: 30px;">
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; font-weight: bold; color: #1e293b;">${row.receiptNo}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #1e293b;">${row.customerName}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #475569;">${row.idNumber}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #475569;">${row.courseYear}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${row.productName}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; color: #64748b;">${row.sku}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 11px; font-weight: bold; color: #64748b;">${row.category}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right;">₱${row.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${row.quantity}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #6d28d9;">₱${row.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #475569;">${row.paymentMethod}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; color: #64748b;">${row.referenceNumber}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${statusColor}; background-color: ${statusBg};">${row.status}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">${row.date}</td>
          </tr>
        `;
      }).join('');

      const dateToUse = isHistory ? selectedDate : new Date();
      const dateStr = dateToUse.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const htmlContent = getExcelHtmlWrapper(
        isHistory ? 'Historical Sales Report' : 'Daily Sales Report',
        `Sales Date: ${dateStr}`,
        [
          { label: 'Total Revenue', value: `₱${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
          { label: 'Completed Orders', value: completedCount.toString(), bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
          { label: 'Cancelled Orders', value: cancelledCount.toString(), bg: '#fee2e2', border: '#fca5a5', color: '#b91c1c' }
        ],
        tableHeader,
        tableRows
      );

      triggerExcelDownload(htmlContent, `${isHistory ? 'historical' : 'daily'}_sales_${formatLocalDate(dateToUse)}`);
      showNotification('Report exported successfully!', 'success');
      return;
    }

    if (activeTab === 'tailored') {
      // Combine tailored orders in accordance to tab filters
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

      if (tailoredSearchQuery) {
        displayOrders = displayOrders.filter(order => {
          const customerName = `${order?.first_name || ''} ${order?.last_name || ''}`.trim().toLowerCase();
          return customerName.includes(tailoredSearchQuery.toLowerCase());
        });
      }

      displayOrders.sort((a, b) => {
        const dateA = new Date(a.completed_at || a.created_at).getTime();
        const dateB = new Date(b.completed_at || b.created_at).getTime();
        return dateB - dateA;
      });

      const rows: any[] = [];
      displayOrders.forEach(order => {
        // Filter items to only show the tailored products matching the specific order type
        const items = (order?.items || []).filter((item: any) => {
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
        });

        const courseYear = order?.course && order?.year 
          ? `${order.course} - ${order.year}` 
          : order?.course || order?.year || 'N/A';
        const dateStr = new Date(order.completed_at || order.created_at).toLocaleDateString();

        const badgeLabel = order.type === 'preorder' ? 'PRE-ORDER'
                         : order.type === 'downpayment' ? 'DOWNPAYMENT'
                         : 'FULL PAYMENT';

        if (items.length > 0) {
          items.forEach((item: any) => {
            const { category, sku } = resolveProductInfo(item.productName || item.product_name || '');
            rows.push({
              receiptNo: order?.receipt_no || 'N/A',
              customerName: order?.first_name ? formatFullName(order.first_name, order.last_name) : 'N/A',
              idNumber: order?.id_number || 'N/A',
              courseYear,
              productName: formatProductNameWithVariants(item),
              sku,
              category,
              unitPrice: parseFloat(item?.unitPrice || item?.unit_price || 0),
              quantity: item?.quantity || 0,
              subtotal: parseFloat(item?.subtotal || 0),
              paymentType: badgeLabel,
              paymentMethod: formatPaymentMethod(order?.payment_method),
              referenceNumber: order?.reference_number || 'N/A',
              fulfillmentStatus: order?.status === 'released' ? 'Released' : (order?.status || 'Pending'),
              date: dateStr
            });
          });
        }
      });

      const totalSales = rows.reduce((sum, r) => sum + r.subtotal, 0);

      const tableHeader = `
        <tr style="background-color: #6d28d9; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; height: 35px;">
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 120px;">Receipt No</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 160px;">Customer Name</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 120px;">ID Number</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Course & Year</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 220px;">Product Details</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 110px;">SKU</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Payment Type</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 100px;">Qty</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 110px;">Subtotal</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">Method</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 130px;">Ref Number</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Fulfillment</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">Order Date</th>
        </tr>
      `;

      const tableRows = rows.map((row, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        
        let typeColor = '#6d28d9';
        let typeBg = '#f3e8ff';
        if (row.paymentType === 'DOWNPAYMENT') {
          typeColor = '#c2410c';
          typeBg = '#ffedd5';
        } else if (row.paymentType === 'FULL PAYMENT') {
          typeColor = '#15803d';
          typeBg = '#dcfce7';
        }

        const fulfillColor = row.fulfillmentStatus === 'Released' ? '#15803d' : '#854d0e';
        const fulfillBg = row.fulfillmentStatus === 'Released' ? '#dcfce7' : '#fef9c3';

        return `
          <tr style="background-color: ${bg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #334155; height: 30px;">
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; font-weight: bold; color: #1e293b;">${row.receiptNo}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #1e293b;">${row.customerName}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #475569;">${row.idNumber}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #475569;">${row.courseYear}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${row.productName}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; color: #64748b;">${row.sku}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${typeColor}; background-color: ${typeBg}; font-size: 11px;">${row.paymentType}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${row.quantity}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #6d28d9;">₱${row.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #475569;">${row.paymentMethod}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; color: #64748b;">${row.referenceNumber}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${fulfillColor}; background-color: ${fulfillBg}; font-size: 11px;">${row.fulfillmentStatus}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">${row.date}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = getExcelHtmlWrapper(
        'Tailored Uniform Orders Report',
        `Tailored orders filter: ${tailoredFilter.toUpperCase()}`,
        [
          { label: 'Total Sales Revenue', value: `₱${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
          { label: 'Tailored Orders Count', value: displayOrders.length.toString(), bg: '#f3e8ff', border: '#d8b4fe', color: '#6d28d9' },
          { label: 'Filter State', value: tailoredFilter.toUpperCase(), bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' }
        ],
        tableHeader,
        tableRows
      );

      triggerExcelDownload(htmlContent, `tailored_orders_${tailoredFilter}_${formatLocalDate(new Date())}`);
      showNotification('Tailored report exported successfully!', 'success');
      return;
    }

    if (activeTab === 'insurance') {
      const rows = insuranceOrders.map(order => {
        const details = order.items?.[0]?.selectedOptions || {};
        const paymentDateStr = new Date(order.completed_at || order.updated_at || order.created_at).toLocaleDateString();
        
        let formattedBirthday = details.birthday || 'N/A';
        try {
          if (details.birthday) {
            formattedBirthday = new Date(details.birthday).toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            });
          }
        } catch (e) {
          console.error(e);
        }

        const courseYear = order?.course && order?.year 
          ? `${order.course} - ${order.year}` 
          : order?.course || order?.year || 'N/A';

        return {
          receiptNo: order.receipt_no || 'N/A',
          insuredName: details.fullName || `${order.first_name} ${order.last_name || ''}`.trim(),
          idNumber: order.id_number || 'N/A',
          courseYear,
          premium: parseFloat(order.total_amount || 0),
          paymentMethod: formatPaymentMethod(order.payment_method),
          referenceNumber: order.reference_number || 'N/A',
          birthday: formattedBirthday,
          age: details.age || 'N/A',
          beneficiary: details.beneficiary || 'N/A',
          relation: details.relation || 'N/A',
          paymentDate: paymentDateStr
        };
      });

      const totalRevenueVal = rows.reduce((sum, r) => sum + r.premium, 0);

      const tableHeader = `
        <tr style="background-color: #6d28d9; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; height: 35px;">
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 120px;">Receipt No</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 180px;">Insured Name</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 120px;">ID Number</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Course & Year</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 110px;">Premium</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">Method</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 130px;">Ref Number</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 110px;">Birth Date</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 80px;">Age</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 180px;">Beneficiary</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">Relation</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 110px;">Payment Date</th>
        </tr>
      `;

      const tableRows = rows.map((row, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        return `
          <tr style="background-color: ${bg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #334155; height: 30px;">
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; font-weight: bold; color: #1e293b;">${row.receiptNo}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${row.insuredName}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #475569;">${row.idNumber}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #475569;">${row.courseYear}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #6d28d9;">₱${row.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #475569;">${row.paymentMethod}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; color: #64748b;">${row.referenceNumber}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #475569;">${row.birthday}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${row.age}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #1e293b;">${row.beneficiary}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #6d28d9; font-size: 11px;">${row.relation}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">${row.paymentDate}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = getExcelHtmlWrapper(
        'Insurance Policies Sales Report',
        'All completed I-CARD insurance policy sales',
        [
          { label: 'Total Revenue', value: `₱${totalRevenueVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
          { label: 'Policies Sold', value: insuranceOrders.length.toString(), bg: '#f3e8ff', border: '#d8b4fe', color: '#6d28d9' }
        ],
        tableHeader,
        tableRows
      );

      triggerExcelDownload(htmlContent, `insurance_sales_${formatLocalDate(new Date())}`);
      showNotification('Insurance sales report exported successfully!', 'success');
      return;
    }

    if (activeTab === 'hardbound') {
      const rows: any[] = [];
      
      hardboundOrders.forEach(order => {
        order.items?.forEach((item: any) => {
          const isHardbound = (item.productName || item.product_name || '').toLowerCase().includes('hard bound') || (item.productName || item.product_name || '').toLowerCase().includes('hardbound');
          if (!isHardbound) return;
          
          const orderDateObj = new Date(order.created_at);
          const orderDateString = `${orderDateObj.getFullYear()}-${String(orderDateObj.getMonth() + 1).padStart(2, '0')}-${String(orderDateObj.getDate()).padStart(2, '0')}`;
          if (hardboundFilterDate && orderDateString !== hardboundFilterDate) return;
          
          rows.push({
            researchTitle: item.selectedOptions?.researchTitle || 'N/A',
            leadResearcher: item.selectedOptions?.leadResearcher || 'N/A'
          });
        });
      });

      const tableRows = rows.map((row, index) => {
        return `
          <tr style="height: 30px;">
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; text-align: center; padding: 6px; color: #000000;">${index + 1}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px; color: #000000; font-weight: bold;">${row.leadResearcher}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px; color: #000000; white-space: normal; word-wrap: break-word; word-break: break-word; overflow: hidden;">${row.researchTitle}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px;"></td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px;"></td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px;"></td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px;"></td>
          </tr>
        `;
      }).join('');

      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Hardbound Log</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        </head>
        <body style="font-family: Arial, sans-serif;">
          <table style="width: 100%; border: none; margin-bottom: 20px;">
            <tr>
              <td colspan="7" style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-align: center; color: #000000; padding: 2px 0;">
                University of Cebu - METC Multipurpose Cooperative (UC-METC MPC)
              </td>
            </tr>
            <tr>
              <td colspan="7" style="font-family: Arial, sans-serif; font-size: 10px; text-align: center; color: #444444; padding: 2px 0;">
                UCMETC Campus Alumnos, Mambaling, Cebu City
              </td>
            </tr>
            <tr>
              <td colspan="7" style="font-family: Arial, sans-serif; font-size: 10px; text-align: center; color: #444444; padding: 2px 0;">
                ucmetc.ecc@gmail.com tel no. 410-8811 local 5155
              </td>
            </tr>
            <tr>
              <td colspan="7" style="font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; color: #000000; padding: 4px 0; padding-bottom: 20px;">
                Date: ${hardboundFilterDate ? new Date(hardboundFilterDate).toLocaleDateString('en-US', { dateStyle: 'long' }) : new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
              </td>
            </tr>
          </table>

          <table style="border-collapse: collapse; border: 1px solid #cbd5e1; width: 100%;">
            <thead>
              <tr style="height: 35px; background-color: #6d28d9;">
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 45px; color: #ffffff; background-color: #6d28d9;">NO.</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 180px; color: #ffffff; background-color: #6d28d9;">LEAD RESERACHER</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 350px; color: #ffffff; background-color: #6d28d9;">RESEARCH TITLE</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 140px; color: #ffffff; background-color: #6d28d9;">DATE&SIGNATURE<br/>(SERVICE PROVIDER)</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 140px; color: #ffffff; background-color: #6d28d9;">DATE RECEIVED FROM<br/>SERVICE PROVIDER</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 140px; color: #ffffff; background-color: #6d28d9;">DATE&SIGNATURE<br/>(ENDORSEMENT TO RO)</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 100px; color: #ffffff; background-color: #6d28d9;">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const fileDateSuffix = hardboundFilterDate ? hardboundFilterDate : formatLocalDate(new Date());
      triggerExcelDownload(htmlContent, `hardbound_research_orders_${fileDateSuffix}`);
      showNotification('Hardbound report exported successfully!', 'success');
      return;
    }

    if (activeTab === 'swimming') {
      const rows: any[] = [];
      swimmingOrders.forEach(order => {
        order.items?.forEach((item: any) => {
          const productName = (item.productName || item.product_name || '').toLowerCase();
          if (!productName.includes('swimming') && !productName.includes('swim set') && !productName.includes('swim cap') && !productName.includes('swimset')) return;
          
          const orderDateObj = new Date(order.created_at);
          const orderDateString = `${orderDateObj.getFullYear()}-${String(orderDateObj.getMonth() + 1).padStart(2, '0')}-${String(orderDateObj.getDate()).padStart(2, '0')}`;
          if (swimmingFilterDate && orderDateString !== swimmingFilterDate) return;
          
          rows.push({
            receiptNo: order.receipt_no || 'N/A',
            studentName: formatFullName(order.first_name, order.last_name) || order.walk_in_name || 'N/A',
            studentId: order.id_number || order.walk_in_id_number || 'N/A',
            course: order.course || order.walk_in_course || 'N/A',
            productName: item.productName || item.product_name || 'Swimming Gear',
            size: item.selectedOptions?.size || item.selectedOptions?.Size || 'N/A',
            quantity: item.quantity || 1,
            instructor: item.selectedOptions?.instructor || item.selectedOptions?.Instructor || 'N/A',
            date: new Date(order.created_at).toLocaleDateString(),
            amount: parseFloat(item.subtotal || order.total_amount || 0),
            paymentMethod: formatPaymentMethod(order.payment_method)
          });
        });
      });

      const tableRows = rows.map((row, index) => {
        return `
          <tr style="height: 30px;">
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; text-align: center; padding: 6px; color: #000000;">${index + 1}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px; color: #000000; font-weight: bold;">${row.receiptNo}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px; color: #000000;">${row.studentName}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px; color: #000000;">${row.course}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px; color: #000000;">${row.productName}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px; text-align: center; color: #000000;">${row.size}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px; color: #000000; font-weight: bold;">${row.instructor}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px; text-align: center; color: #000000;">${row.date}</td>
            <td style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; padding: 6px; text-align: right; color: #000000;">₱${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Swimming Orders</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        </head>
        <body style="font-family: Arial, sans-serif;">
          <table style="width: 100%; border: none; margin-bottom: 20px;">
            <tr>
              <td colspan="9" style="font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-align: center; color: #000000; padding: 2px 0;">
                University of Cebu - METC Multipurpose Cooperative (UC-METC MPC)
              </td>
            </tr>
            <tr>
              <td colspan="9" style="font-family: Arial, sans-serif; font-size: 10px; text-align: center; color: #444444; padding: 2px 0;">
                UCMETC Campus Alumnos, Mambaling, Cebu City
              </td>
            </tr>
            <tr>
              <td colspan="9" style="font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; color: #000000; padding: 4px 0; padding-bottom: 20px;">
                Swimming Gear Orders Log - Date: ${swimmingFilterDate ? new Date(swimmingFilterDate).toLocaleDateString('en-US', { dateStyle: 'long' }) : new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
              </td>
            </tr>
          </table>

          <table style="border-collapse: collapse; border: 1px solid #cbd5e1; width: 100%;">
            <thead>
              <tr style="height: 35px; background-color: #0284c7;">
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 45px; color: #ffffff; background-color: #0284c7;">NO.</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 120px; color: #ffffff; background-color: #0284c7;">RECEIPT NO</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 180px; color: #ffffff; background-color: #0284c7;">STUDENT NAME</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 90px; color: #ffffff; background-color: #0284c7;">COURSE</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 160px; color: #ffffff; background-color: #0284c7;">PRODUCT</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 70px; color: #ffffff; background-color: #0284c7;">SIZE</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 180px; color: #ffffff; background-color: #0284c7;">INSTRUCTOR</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 100px; color: #ffffff; background-color: #0284c7;">DATE</th>
                <th style="border: 1px solid #cbd5e1; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; width: 100px; color: #ffffff; background-color: #0284c7;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const fileDateSuffix = swimmingFilterDate ? swimmingFilterDate : formatLocalDate(new Date());
      triggerExcelDownload(htmlContent, `swimming_instructor_orders_${fileDateSuffix}`);
      showNotification('Swimming report exported successfully!', 'success');
      return;
    }

    if (activeTab === 'classring') {
      const rows = classRingOrders.map(order => {
        const item = order.items?.[0] || {};
        const opts = item.selectedOptions || order.selectedOptions || {};
        const paymentDateStr = new Date(order.completed_at || order.updated_at || order.created_at).toLocaleDateString();

        return {
          receiptNo: order.receipt_no || 'N/A',
          cadetName: `${order.first_name || ''} ${order.last_name || ''}`.trim() || order.walk_in_name || 'N/A',
          contactNumber: opts['Contact Number'] || order.contact_number || 'N/A',
          contactAddress: opts['Contact Address'] || opts['Complete Address'] || order.address || 'N/A',
          schoolOrg: opts['School/Organization'] || 'UC METC',
          program: opts['Degree/Program'] || order.course || 'BSMT',
          gradYear: opts['Graduation Year'] || '2026',
          model: opts['Model'] || 'Medium',
          material: opts['Material'] || 'Stainless Steel',
          finish: opts['Finish'] || 'Natural Gold',
          ringSize: opts['Ring Size'] || 'Size 8',
          birthstone: opts['Birthstone'] || 'September (Sapphire)',
          engraving: opts['Inside Engraving'] || 'None',
          price: parseFloat(order.total_amount || item.price || 0),
          paymentMethod: formatPaymentMethod(order.payment_method),
          status: (order.status || 'pending').toUpperCase(),
          date: paymentDateStr,
        };
      });

      const totalRevenueVal = rows.reduce((sum, r) => sum + r.price, 0);

      const tableHeader = `
        <tr style="background-color: #d97706; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', sans-serif; font-size: 13px; height: 35px;">
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Receipt No</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Cadet Name</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Contact No</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Contact Address</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Program & Year</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Model & Size</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Material & Finish</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Birthstone</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Inside Engraving</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Total Price</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Status</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Date</th>
        </tr>
      `;

      const tableRows = rows.map((row, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#fffbeb';
        return `
          <tr style="background-color: ${bg}; font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #334155; height: 30px;">
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold; font-family: Consolas, monospace;">${row.receiptNo}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold;">${row.cadetName}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${row.contactNumber}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${row.contactAddress}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${row.program} (${row.gradYear})</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${row.model} (${row.ringSize})</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${row.material} - ${row.finish}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${row.birthstone}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #b45309;">${row.engraving}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #d97706;">₱${row.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${row.status}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${row.date}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = getExcelHtmlWrapper(
        'Royal Gem Official Class Ring Orders (Trust Fund Account)',
        'Segregated Royal Gem Class Ring Custom Orders List',
        [
          { label: 'Total Trust Funds Collected', value: `₱${totalRevenueVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, bg: '#fffbeb', border: '#fde047', color: '#b45309' },
          { label: 'Total Class Ring Orders', value: classRingOrders.length.toString(), bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8' }
        ],
        tableHeader,
        tableRows
      );

      triggerExcelDownload(htmlContent, `class_ring_orders_${formatLocalDate(new Date())}`);
      showNotification('Class Ring orders report exported successfully!', 'success');
      return;
    }

    if (activeTab === 'gcash') {
      const filtered = gcashOrders.filter(order => {
        const matchesStatus = gcashStatusFilter === 'all' || order.status === gcashStatusFilter;
        const matchesDate = !gcashFilterDate || (() => {
          const d = new Date((order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return dateStr === gcashFilterDate;
        })();
        const customerName = (order.first_name ? formatFullName(order.first_name, order.last_name) : order.walk_in_name || '').toLowerCase();
        const receiptNo = (order.receipt_no || order.receiptNo || '').toLowerCase();
        const refNo = (order.reference_number || '').toLowerCase();
        const matchesSearch = !gcashSearchQuery || customerName.includes(gcashSearchQuery.toLowerCase()) || receiptNo.includes(gcashSearchQuery.toLowerCase()) || refNo.includes(gcashSearchQuery.toLowerCase());
        return matchesStatus && matchesDate && matchesSearch;
      });

      const rows = filtered.map(order => {
        const orderAmount = parseFloat(order.total_amount || 0);
        const serviceFee = calculateEWalletFee(orderAmount);
        const totalPaid = orderAmount + serviceFee;
        const customerName = order.first_name ? formatFullName(order.first_name, order.last_name) : order.walk_in_name || 'N/A';
        const courseYear = order.course && order.year ? `${order.course} - ${order.year}` : order.course || order.year || order.walk_in_course || 'N/A';
        const dateStr = new Date((order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at).toLocaleDateString();

        return {
          receiptNo: order.receipt_no || order.receiptNo || 'N/A',
          customerName,
          courseYear,
          referenceNumber: order.reference_number || 'N/A',
          orderAmount,
          serviceFee,
          totalPaid,
          status: (order.status || 'pending').toUpperCase(),
          date: dateStr
        };
      });

      const totalSalesVal = rows.reduce((sum, r) => sum + (r.status === 'COMPLETED' || r.status === 'RELEASED' ? r.orderAmount : 0), 0);
      const totalServiceFeesVal = rows.reduce((sum, r) => sum + (r.status === 'COMPLETED' || r.status === 'RELEASED' ? r.serviceFee : 0), 0);
      const grandTotalVal = totalSalesVal + totalServiceFeesVal;

      const tableHeader = `
        <tr style="background-color: #0284c7; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', sans-serif; font-size: 13px; height: 35px;">
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Receipt No</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left;">Customer Name</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Course / Year</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">GCash Ref #</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Order Amount (Sales)</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Service Charge (GCash)</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">Total Paid</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Status</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">Date</th>
        </tr>
      `;

      const tableRows = rows.map((row, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f0f9ff';
        return `
          <tr style="background-color: ${bg}; font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #334155; height: 30px;">
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold; font-family: Consolas, monospace;">${row.receiptNo}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold;">${row.customerName}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${row.courseYear}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-family: Consolas, monospace; font-weight: bold; color: #0284c7;">${row.referenceNumber}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #047857;">₱${row.orderAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #d97706;">₱${row.serviceFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #6d28d9;">₱${row.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${row.status}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${row.date}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = getExcelHtmlWrapper(
        'GCash Service Charge & Transaction Report',
        'Official GCash Transaction Fee Log',
        [
          { label: 'Total GCash Orders', value: rows.length.toString(), bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8' },
          { label: 'Total Merchandise Sales', value: `₱${totalSalesVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
          { label: 'Total Service Charges', value: `₱${totalServiceFeesVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, bg: '#fffbeb', border: '#fde047', color: '#b45309' },
          { label: 'Grand Total Collected', value: `₱${grandTotalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, bg: '#f3e8ff', border: '#d8b4fe', color: '#6d28d9' }
        ],
        tableHeader,
        tableRows
      );

      triggerExcelDownload(htmlContent, `gcash_service_charges_${formatLocalDate(new Date())}`);
      showNotification('GCash service charges report exported successfully!', 'success');
      return;
    }

    if (activeTab === 'printing') {
      const rows: any[] = [];
      printingOrders.forEach(order => {
        const orderDateObj = new Date((order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at);
        const orderDateString = `${orderDateObj.getFullYear()}-${String(orderDateObj.getMonth() + 1).padStart(2, '0')}-${String(orderDateObj.getDate()).padStart(2, '0')}`;
        if (printingFilterDate && orderDateString !== printingFilterDate) return;

        const customerName = formatFullName(order.first_name, order.last_name) || order.walk_in_name || 'Walk-in Customer';
        const studentId = order.id_number || order.walk_in_id_number || 'N/A';
        const courseYear = order.course && order.year ? `${order.course} - ${order.year}` : order.course || order.year || 'N/A';
        const status = order.status === 'completed' ? 'COMPLETED' : order.status === 'released' ? 'RELEASED' : order.status === 'pending' ? 'PENDING' : 'CANCELLED';
        const paymentMethod = formatPaymentMethod(order.payment_method);
        const dateFormatted = orderDateObj.toLocaleDateString();

        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
          order.items.forEach((item: any) => {
            if (!isPrintingOrPhotocopyItem(item)) return;
            const prodName = formatProductNameWithVariants(item);
            const isCopy = prodName.toLowerCase().includes('photocopy') || prodName.toLowerCase().includes('xerox') || prodName.toLowerCase().includes('photo copy');
            const serviceType = isCopy ? 'Photocopy' : 'Printing';
            const qty = item.quantity || 1;
            const amount = parseFloat(item.subtotal || item.price || 0);

            rows.push({
              receiptNo: order.receipt_no || order.receiptNo || 'N/A',
              customerName,
              studentId,
              courseYear,
              serviceType,
              serviceItem: prodName,
              quantity: qty,
              amount,
              paymentMethod,
              status,
              date: dateFormatted
            });
          });
        } else {
          const prodName = order.product_name || order.productName || 'Printing Service';
          const isCopy = prodName.toLowerCase().includes('photocopy') || prodName.toLowerCase().includes('xerox') || prodName.toLowerCase().includes('photo copy');
          rows.push({
            receiptNo: order.receipt_no || order.receiptNo || 'N/A',
            customerName,
            studentId,
            courseYear,
            serviceType: isCopy ? 'Photocopy' : 'Printing',
            serviceItem: prodName,
            quantity: 1,
            amount: parseFloat(order.total_amount || 0),
            paymentMethod,
            status,
            date: dateFormatted
          });
        }
      });

      const totalRevenueVal = rows.reduce((sum, r) => sum + (r.status === 'COMPLETED' || r.status === 'RELEASED' ? r.amount : 0), 0);
      const totalPrintingSalesVal = rows.filter(r => r.serviceType === 'Printing' && (r.status === 'COMPLETED' || r.status === 'RELEASED')).reduce((sum, r) => sum + r.amount, 0);
      const totalPhotocopySalesVal = rows.filter(r => r.serviceType === 'Photocopy' && (r.status === 'COMPLETED' || r.status === 'RELEASED')).reduce((sum, r) => sum + r.amount, 0);
      const totalCopiesVal = rows.reduce((sum, r) => sum + r.quantity, 0);

      const tableHeader = `
        <tr style="background-color: #0891b2; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', sans-serif; font-size: 13px; height: 35px;">
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 45px;">No.</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 120px;">Receipt No</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 180px;">Customer Name</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">ID Number</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 110px;">Course / Year</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 110px;">Service Type</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 220px;">Document / Job Description</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 70px;">Copies</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 100px;">Amount</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 90px;">Payment</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 90px;">Status</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">Date</th>
        </tr>
      `;

      const tableRows = rows.map((row, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f0fdfa';
        return `
          <tr style="background-color: ${bg}; font-family: 'Segoe UI', sans-serif; font-size: 12px; color: #334155; height: 30px;">
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold; font-family: Consolas, monospace;">${row.receiptNo}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold;">${row.customerName}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${row.studentId}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${row.courseYear}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${row.serviceType === 'Printing' ? '#0891b2' : '#7c3aed'};">${row.serviceType}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${row.serviceItem}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${row.quantity}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #047857;">₱${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${row.paymentMethod}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${row.status}</td>
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${row.date}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = getExcelHtmlWrapper(
        'Printing & Photocopy Sales Report',
        'Official Printing & Photocopy Services Sales Ledger',
        [
          { label: 'Total Jobs / Items', value: rows.length.toString(), bg: '#f0fdfa', border: '#99f6e4', color: '#0f766e' },
          { label: 'Total Copies / Pages', value: totalCopiesVal.toLocaleString(), bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
          { label: 'Printing Sales', value: `₱${totalPrintingSalesVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, bg: '#ecfeff', border: '#a5f3fc', color: '#0891b2' },
          { label: 'Photocopy Sales', value: `₱${totalPhotocopySalesVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, bg: '#f5f3ff', border: '#ddd6fe', color: '#6d28d9' },
          { label: 'Total Revenue', value: `₱${totalRevenueVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' }
        ],
        tableHeader,
        tableRows
      );

      triggerExcelDownload(htmlContent, `printing_photocopy_sales_${formatLocalDate(new Date())}`);
      showNotification('Printing & Photocopy sales report exported successfully!', 'success');
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] p-4 sm:p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header with Export Button */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sales Management</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-2">Process orders and view sales reports</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">


            <button
              onClick={() => setShowImportExcelModal(true)}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg hover:scale-105 text-xs sm:text-base w-full sm:w-auto hover:shadow-green-500/20"
            >
              <Upload size={18} className="sm:w-5 sm:h-5" />
              <span>Import Excel/CSV</span>
            </button>

            {/* Export Button - Show on Daily, History, Remittance, Monthly, Tailored, Insurance, Hardbound, Class Ring, GCash, and Printing tabs */}
            {(activeTab === 'daily' || activeTab === 'history' || activeTab === 'remittance' || activeTab === 'tailored' || activeTab === 'insurance' || activeTab === 'hardbound' || activeTab === 'classring' || activeTab === 'gcash' || activeTab === 'printing') && (
              <button
                onClick={exportToExcel}
                className="flex items-center justify-center sm:justify-start space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg hover:scale-105 text-xs sm:text-base w-full sm:w-auto hover:shadow-purple-500/20"
              >
                <Download size={18} className="sm:w-5 sm:h-5" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200 overflow-x-auto">
          <div className="flex space-x-2 sm:space-x-4 min-w-min">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'history'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('remittance')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'remittance'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Remittance
            </button>
            <button
              onClick={() => setActiveTab('tailored')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'tailored'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tailored
            </button>
            <button
              onClick={() => setActiveTab('fulfillment')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'fulfillment'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pre-Orders
            </button>
            <button
              onClick={() => setActiveTab('downpayment')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'downpayment'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Downpayments
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'insurance'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Insurance
            </button>
            <button
              onClick={() => setActiveTab('hardbound')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'hardbound'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hardbound
            </button>
            <button
              onClick={() => setActiveTab('swimming')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'swimming'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Swimming
            </button>
            <button
              onClick={() => setActiveTab('classring')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'classring'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Class Ring
            </button>
            <button
              onClick={() => setActiveTab('gcash')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'gcash'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GCash Service Charge
            </button>
            <button
              onClick={() => setActiveTab('printing')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'printing'
                  ? 'text-cyan-600 border-b-2 border-cyan-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Printing & Photocopy
            </button>
          </div>
        </div>

        {/* Pending Orders Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-6 animate-fade-in">
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
                                  {formatFullName(order.first_name, order.last_name)}
                                </p>
                                {order.receipt_no && order.receipt_no.startsWith('BAL-') && (
                                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">BALANCE</span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 truncate text-left">
                                {order.email?.includes('@uc-metc-walkin.com')
                                  ? (order.course || 'Walk-in Guest')
                                  : order.email}
                              </p>
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
                    <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-left">
                      {formatFullName(selectedPendingOrder.first_name, selectedPendingOrder.last_name)}
                      {selectedPendingOrder.email?.includes('@uc-metc-walkin.com') && (
                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          Walk-In
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-500 text-left">
                      {selectedPendingOrder.email?.includes('@uc-metc-walkin.com')
                        ? (selectedPendingOrder.course || 'Walk-in Guest')
                        : selectedPendingOrder.email}
                      {selectedPendingOrder.id_number && ` • ID: ${selectedPendingOrder.id_number}`}
                    </p>
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
                          {isBalance && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">BALANCE</span>}
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
                      if (isUpdatingStatus) return;
                      try {
                        setIsUpdatingStatus(true);
                        await AppDataSync.updateOrderStatus(selectedPendingOrder.id, 'completed', user?.id || '');
                        await AppDataSync.loadProductsFromAPI();
                        await loadPendingOrders();
                        await loadDownpaymentOrders();
                        setSelectedPendingOrder(null);
                        showNotification('Order marked as paid! Stock updated.', 'success');
                      } catch (err) {
                        showNotification('Failed to mark order as paid. Please try again.', 'error');
                      } finally {
                        setIsUpdatingStatus(false);
                      }
                    }}
                    disabled={isUpdatingStatus}
                    className="flex-1 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    {isUpdatingStatus ? 'Processing...' : 'Paid'}
                  </button>
                  <button
                    onClick={async () => {
                      if (isUpdatingStatus) return;
                      try {
                        setIsUpdatingStatus(true);
                        await AppDataSync.updateOrderStatus(selectedPendingOrder.id, 'cancelled', user?.id || '');
                        await loadPendingOrders();
                        setSelectedPendingOrder(null);
                        showNotification('Order cancelled successfully!', 'success');
                      } catch (err) {
                        showNotification('Failed to cancel order. Please try again.', 'error');
                      } finally {
                        setIsUpdatingStatus(false);
                      }
                    }}
                    disabled={isUpdatingStatus}
                    className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center"
                  >
                    {isUpdatingStatus ? 'Processing...' : 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Friendly Delete Confirmation Modal */}
        {orderToDelete && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setOrderToDelete(null)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 pb-4 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 animate-bounce">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Delete Order</h3>
                <p className="text-slate-500 mt-2 text-sm">
                  Are you sure you want to completely delete order <span className="font-semibold text-slate-800">#{orderToDelete.receiptNo}</span>?
                </p>
              </div>

              {/* Stock Restoration Option — hidden for insurance orders (no inventory involved) */}
              {!orderToDelete?.isInsurance && (
                <div className="mx-6 mb-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl transition-all">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={restoreInventoryStock}
                      onChange={(e) => setRestoreInventoryStock(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-sm">
                          Restore inventory stock
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          restoreInventoryStock ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {restoreInventoryStock ? 'Yes, restore' : 'Do not restore'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {restoreInventoryStock
                          ? 'Quantities from this order will be added back to product inventory stocks.'
                          : 'Inventory counts will remain unchanged after deleting this order.'}
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Warning box */}
              <div className="mx-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                <span className="text-base mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold">Important Notice:</p>
                  <p className="mt-0.5 leading-relaxed text-amber-700">
                    This action is permanent and cannot be undone. All items associated with this receipt will be deleted{restoreInventoryStock ? ', and the inventory stock will be restored.' : ', and inventory stock will NOT be restored.'}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 flex gap-3">
                <button
                  onClick={() => setOrderToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteOrder}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all duration-200 active:scale-95 shadow-md shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Friendly Bulk Delete Confirmation Modal */}
        {showBulkDeleteModal && (() => {
          const targetOrders = bulkDeleteTarget === 'history' ? historyOrders : dailyOrders;
          const targetRows = bulkDeleteTarget === 'history' ? historyRows : dailyRows;
          const activeFilteredRows = bulkDeleteTarget === 'history' ? filteredHistoryRows : filteredDailyRows;
          const activeSearch = bulkDeleteTarget === 'history' ? historySearchQuery : searchQuery;
          const isFilterActive = activeFilteredRows.length < targetRows.length || Boolean(activeSearch);

          const importedOrders = targetOrders.filter((o: any) => isImportedReceipt(o.receipt_no || o.receiptNo));
          const importedRows = targetRows.filter((r: any) => isImportedReceipt(r.receipt));

          const filteredOrderIds = new Set(activeFilteredRows.map((r: any) => r.orderId));
          const filteredOrders = targetOrders.filter((o: any) => filteredOrderIds.has(o.id));

          // Resolve active selection
          let selectedOrders = targetOrders;
          let selectedRows = targetRows;
          if (bulkDeleteScope === 'imported_only') {
            selectedOrders = importedOrders;
            selectedRows = importedRows;
          } else if (bulkDeleteScope === 'filtered_only') {
            selectedOrders = filteredOrders;
            selectedRows = activeFilteredRows;
          }

          const dateLabel = bulkDeleteTarget === 'history' 
            ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : `Today (${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})`;
          
          const totalRev = selectedOrders.reduce((sum: number, o: any) => {
            if (o.status !== 'completed' && o.status !== 'released') return sum;
            if (o.items && Array.isArray(o.items) && o.items.length > 0) {
              return sum + o.items.reduce((iSum: number, item: any) => iSum + (parseFloat(item.subtotal || item.total || (item.price * item.quantity)) || 0), 0);
            }
            return sum + (parseFloat(o.total_amount) || 0);
          }, 0);

          return (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto"
              onClick={() => !isBulkDeleting && setShowBulkDeleteModal(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-scale-in overflow-hidden border border-slate-100 my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Landscape Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shadow-inner shrink-0">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">Clear Day's Records</h3>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Target date: <span className="font-semibold text-purple-700">{dateLabel}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={isBulkDeleting}
                    onClick={() => setShowBulkDeleteModal(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-40"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* 2-Column Landscape Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Scope Selector */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      1. Choose What to Delete:
                    </span>

                    {/* Option 1: Only Imported Excel Transactions */}
                    {importedOrders.length > 0 && (
                      <label
                        onClick={() => setBulkDeleteScope('imported_only')}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          bulkDeleteScope === 'imported_only'
                            ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deleteScope"
                          checked={bulkDeleteScope === 'imported_only'}
                          onChange={() => setBulkDeleteScope('imported_only')}
                          className="mt-0.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">Only Imported Transactions (TR-*)</span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              {importedOrders.length} orders
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Safely removes only records imported from Excel (TR-* receipts). Keeps real POS orders untouched.
                          </p>
                        </div>
                      </label>
                    )}

                    {/* Option 2: Filtered Results (if search or filter active) */}
                    {isFilterActive && (
                      <label
                        onClick={() => setBulkDeleteScope('filtered_only')}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          bulkDeleteScope === 'filtered_only'
                            ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deleteScope"
                          checked={bulkDeleteScope === 'filtered_only'}
                          onChange={() => setBulkDeleteScope('filtered_only')}
                          className="mt-0.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              Filtered Results {activeSearch ? `("${activeSearch}")` : ''}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {filteredOrders.length} orders
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Deletes only the {filteredOrders.length} orders currently matching your search and column filters.
                          </p>
                        </div>
                      </label>
                    )}

                    {/* Option 3: All Records */}
                    <label
                      onClick={() => setBulkDeleteScope('all')}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        bulkDeleteScope === 'all'
                          ? 'border-red-500 bg-red-50/70 ring-2 ring-red-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="deleteScope"
                        checked={bulkDeleteScope === 'all'}
                        onChange={() => setBulkDeleteScope('all')}
                        className="mt-0.5 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">All Records for this Day</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {targetOrders.length} orders
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Permanently deletes all transactions recorded on this date.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Right Column: Impact Stats & Options */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      2. Deletion Scope & Options:
                    </span>

                    {/* Summary Info Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Orders</span>
                        <span className="text-base font-bold text-slate-800">{selectedOrders.length}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Line Items</span>
                        <span className="text-base font-bold text-slate-800">{selectedRows.length}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Amount</span>
                        <span className="text-base font-bold text-green-600">₱{totalRev.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Stock Restoration Option */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl transition-all">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={bulkRestoreInventoryStock}
                          onChange={(e) => setBulkRestoreInventoryStock(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                              Restore inventory stock
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              bulkRestoreInventoryStock ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {bulkRestoreInventoryStock ? 'Yes, restore' : 'Do not restore'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {bulkRestoreInventoryStock
                              ? 'Item quantities will be added back into product inventory counts.'
                              : 'Recommended for spreadsheet imports so physical store inventory is not artificially inflated.'}
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Warning box */}
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
                      <span className="text-sm mt-0.5 shrink-0">⚠️</span>
                      <div>
                        <p className="font-bold">Permanent Deletion:</p>
                        <p className="mt-0.5 leading-relaxed text-red-700 text-[11px]">
                          This will permanently remove <strong>{selectedOrders.length}</strong> orders ({selectedRows.length} item records). You can cleanly re-import afterwards.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Landscape Actions Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowBulkDeleteModal(false)}
                    disabled={isBulkDeleting}
                    className="py-2.5 px-5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDeleteDay}
                    disabled={isBulkDeleting || selectedOrders.length === 0}
                    className="py-2.5 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all duration-200 active:scale-95 shadow-md shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isBulkDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Deleting {selectedOrders.length} Records...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete {selectedOrders.length} {bulkDeleteScope === 'imported_only' ? 'Imported' : bulkDeleteScope === 'filtered_only' ? 'Filtered' : 'Day'} Records
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Daily Summary Tab */}
        {activeTab === 'daily' && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Completed Today</h3>
                  <CheckCircle size={24} />
                </div>
                <p className="text-3xl font-bold">
                  {dailyOrders.filter(o => o.status === 'completed' || o.status === 'released').length}
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
                    .filter(o => (o.status === 'completed' || o.status === 'released') && o.order_type !== 'insurance')
                    .reduce((sum, o) => {
                      if (o.items && Array.isArray(o.items) && o.items.length > 0) {
                        return sum + o.items.reduce((iSum: number, item: any) => iSum + (parseFloat(item.subtotal || item.total || (item.price * item.quantity)) || 0), 0);
                      }
                      return sum + (parseFloat(o.total_amount) || 0);
                    }, 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
                  <div className="flex items-center gap-2">
                    {dailyOrders.length > 0 && user && ['admin', 'staff'].includes(user.role) && (
                      <>
                        {(filteredDailyRows.length < dailyRows.length || searchQuery) && (
                          <button
                            onClick={() => {
                              setBulkDeleteTarget('daily');
                              setBulkDeleteScope('filtered_only');
                              setBulkRestoreInventoryStock(false);
                              setShowBulkDeleteModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-200 rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-95"
                            title="Delete only orders matching current search or filters"
                          >
                            <Trash2 size={13} />
                            Clear Filtered ({new Set(filteredDailyRows.map(r => r.orderId)).size})
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setBulkDeleteTarget('daily');
                            const hasImported = dailyOrders.some((o: any) => isImportedReceipt(o.receipt_no || o.receiptNo));
                            setBulkDeleteScope(hasImported ? 'imported_only' : 'all');
                            setBulkRestoreInventoryStock(false);
                            setShowBulkDeleteModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-200 rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-95"
                          title="Open bulk delete options for today"
                        >
                          <Trash2 size={13} />
                          Clear Records ({dailyOrders.length})
                        </button>
                      </>
                    )}
                    {dailyRows.length > 0 && (
                      <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        Showing <span className="font-bold text-purple-600">{filteredDailyRows.length}</span> of <span className="font-bold text-slate-700">{dailyRows.length}</span> records
                      </div>
                    )}
                  </div>
                </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4">
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

                        {/* Clear All Filters Button */}
                        {(Object.keys(dailyColumnFilters).length > 0 || dailySortColumn || searchQuery || statusFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setDailyColumnFilters({});
                              setDailySortColumn(null);
                              setDailySortDirection(null);
                              setSearchQuery('');
                              setStatusFilter('all');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold transition-all"
                            title="Reset all search, sorting, and column filters"
                          >
                            <RotateCcw size={13} />
                            Reset All Filters
                            {Object.keys(dailyColumnFilters).length > 0 && (
                              <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.2 rounded-full ml-0.5">
                                {Object.keys(dailyColumnFilters).length}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search customer, receipt, product..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm w-72"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {filteredDailyRows.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-600 font-medium">
                        {searchQuery || Object.keys(dailyColumnFilters).length > 0
                          ? `No records match current search or filters` 
                          : statusFilter === 'all' 
                            ? 'No orders processed today' 
                            : `No ${statusFilter} orders today`}
                      </p>
                      {(searchQuery || Object.keys(dailyColumnFilters).length > 0 || statusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setDailyColumnFilters({});
                            setDailySortColumn(null);
                            setDailySortDirection(null);
                            setSearchQuery('');
                            setStatusFilter('all');
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
                        >
                          <RotateCcw size={14} />
                          Clear all filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-slate-300 bg-slate-50">
                            <SpreadsheetColumnHeader
                              columnKey="receipt"
                              label="Receipt"
                              allRows={dailyRows}
                              activeFilters={dailyColumnFilters}
                              onFilterChange={handleDailyFilterChange}
                              sortColumn={dailySortColumn}
                              sortDirection={dailySortDirection}
                              onSortChange={handleDailySortChange}
                              activeDropdown={dailyActiveDropdown}
                              setActiveDropdown={setDailyActiveDropdown}
                            />
                            <SpreadsheetColumnHeader
                              columnKey="customerName"
                              label="Customer Name"
                              allRows={dailyRows}
                              activeFilters={dailyColumnFilters}
                              onFilterChange={handleDailyFilterChange}
                              sortColumn={dailySortColumn}
                              sortDirection={dailySortDirection}
                              onSortChange={handleDailySortChange}
                              activeDropdown={dailyActiveDropdown}
                              setActiveDropdown={setDailyActiveDropdown}
                            />
                            <SpreadsheetColumnHeader
                              columnKey="courseYear"
                              label="Course & Year"
                              allRows={dailyRows}
                              activeFilters={dailyColumnFilters}
                              onFilterChange={handleDailyFilterChange}
                              sortColumn={dailySortColumn}
                              sortDirection={dailySortDirection}
                              onSortChange={handleDailySortChange}
                              activeDropdown={dailyActiveDropdown}
                              setActiveDropdown={setDailyActiveDropdown}
                            />
                            <SpreadsheetColumnHeader
                              columnKey="product"
                              label="Product"
                              allRows={dailyRows}
                              activeFilters={dailyColumnFilters}
                              onFilterChange={handleDailyFilterChange}
                              sortColumn={dailySortColumn}
                              sortDirection={dailySortDirection}
                              onSortChange={handleDailySortChange}
                              activeDropdown={dailyActiveDropdown}
                              setActiveDropdown={setDailyActiveDropdown}
                            />
                            <SpreadsheetColumnHeader
                              columnKey="quantity"
                              label="Quantity"
                              align="center"
                              type="number"
                              allRows={dailyRows}
                              activeFilters={dailyColumnFilters}
                              onFilterChange={handleDailyFilterChange}
                              sortColumn={dailySortColumn}
                              sortDirection={dailySortDirection}
                              onSortChange={handleDailySortChange}
                              activeDropdown={dailyActiveDropdown}
                              setActiveDropdown={setDailyActiveDropdown}
                            />
                            <SpreadsheetColumnHeader
                              columnKey="amount"
                              label="Amount"
                              type="number"
                              allRows={dailyRows}
                              activeFilters={dailyColumnFilters}
                              onFilterChange={handleDailyFilterChange}
                              sortColumn={dailySortColumn}
                              sortDirection={dailySortDirection}
                              onSortChange={handleDailySortChange}
                              activeDropdown={dailyActiveDropdown}
                              setActiveDropdown={setDailyActiveDropdown}
                            />
                            <SpreadsheetColumnHeader
                              columnKey="payment"
                              label="Payment"
                              allRows={dailyRows}
                              activeFilters={dailyColumnFilters}
                              onFilterChange={handleDailyFilterChange}
                              sortColumn={dailySortColumn}
                              sortDirection={dailySortDirection}
                              onSortChange={handleDailySortChange}
                              activeDropdown={dailyActiveDropdown}
                              setActiveDropdown={setDailyActiveDropdown}
                            />
                            <SpreadsheetColumnHeader
                              columnKey="status"
                              label="Status"
                              allRows={dailyRows}
                              activeFilters={dailyColumnFilters}
                              onFilterChange={handleDailyFilterChange}
                              sortColumn={dailySortColumn}
                              sortDirection={dailySortDirection}
                              onSortChange={handleDailySortChange}
                              activeDropdown={dailyActiveDropdown}
                              setActiveDropdown={setDailyActiveDropdown}
                            />
                            <SpreadsheetColumnHeader
                              columnKey="date"
                              label="Date"
                              type="date"
                              alignRight={true}
                              allRows={dailyRows}
                              activeFilters={dailyColumnFilters}
                              onFilterChange={handleDailyFilterChange}
                              sortColumn={dailySortColumn}
                              sortDirection={dailySortDirection}
                              onSortChange={handleDailySortChange}
                              activeDropdown={dailyActiveDropdown}
                              setActiveDropdown={setDailyActiveDropdown}
                            />
                            <th className="text-center py-4 px-6 font-semibold text-slate-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDailyRows.map((row) => (
                            <tr
                              key={row.rowId}
                              className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-4 px-6 font-mono text-slate-900 text-xs">
                                {row.displayReceipt || (Object.keys(dailyColumnFilters).length > 0 ? row.receipt : '')}
                              </td>
                              <td className="py-4 px-6 text-slate-900 font-medium">
                                {row.customerName}
                              </td>
                              <td className="py-4 px-6 text-slate-900">
                                {row.courseYear}
                              </td>
                              <td className="py-4 px-6 text-slate-900">
                                {row.product}
                              </td>
                              <td className="py-4 px-6 text-center text-slate-900 font-semibold">
                                {row.quantity}
                              </td>
                              <td className="py-4 px-6 font-semibold text-green-700">
                                ₱{Number(row.amount).toFixed(2)}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    row.rawPaymentMethod?.toLowerCase() === 'ewallet' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {row.payment}
                                  </span>
                                  {row.rawPaymentMethod?.toLowerCase() === 'ewallet' && row.referenceNumber && (
                                    <span className="text-[10px] text-slate-600 font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                      Ref: {row.referenceNumber}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  row.rawStatus === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : row.rawStatus === 'released'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-700 text-xs">
                                {row.date}
                              </td>
                              <td className="py-4 px-6 text-center">
                                {row.isFirstItem && (
                                  <button
                                    onClick={() => handleDeleteOrder(row.orderId, row.receipt)}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-105 duration-200"
                                    title="Delete Order completely"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

        {/* Remittance Tab */}
        {activeTab === 'remittance' && (
          <div className="space-y-6 animate-fade-in">
            {/* Date Navigation */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <button
                  onClick={() => changeRemittanceDate(-1)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors w-full sm:w-auto"
                >
                  <ChevronLeft size={20} />
                  <span className="font-semibold">Previous Day</span>
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Viewing sales for:</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {remittanceDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                <button
                  onClick={() => changeRemittanceDate(1)}
                  disabled={(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const comp = new Date(remittanceDate);
                    comp.setHours(0, 0, 0, 0);
                    return comp.getTime() >= today.getTime();
                  })()}
                  className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto ${
                    (() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const comp = new Date(remittanceDate);
                      comp.setHours(0, 0, 0, 0);
                      return comp.getTime() >= today.getTime();
                    })()
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
                  <label htmlFor="remittance-date-picker" className="text-sm font-semibold text-slate-700">
                    Jump to date:
                  </label>
                  <input
                    id="remittance-date-picker"
                    type="date"
                    value={(() => {
                      const year = remittanceDate.getFullYear();
                      const month = String(remittanceDate.getMonth() + 1).padStart(2, '0');
                      const day = String(remittanceDate.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })()}
                    max={(() => {
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = String(today.getMonth() + 1).padStart(2, '0');
                      const day = String(today.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })()}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      const newDate = new Date(y, m - 1, d);
                      newDate.setHours(0, 0, 0, 0);
                      setRemittanceDate(newDate);
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
                  ₱{remittanceOrders
                    .filter(o => (o.status === 'completed' || o.status === 'released') && o.order_type !== 'insurance')
                    .reduce((sum, o) => {
                      if (o.items && Array.isArray(o.items) && o.items.length > 0) {
                        return sum + o.items.reduce((iSum: number, item: any) => iSum + (parseFloat(item.subtotal || item.total || (item.price * item.quantity)) || 0), 0);
                      }
                      return sum + (parseFloat(o.total_amount) || 0);
                    }, 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm opacity-75 mt-1">on this day</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Orders Completed</h3>
                  <CheckCircle size={24} />
                </div>
                <p className="text-3xl font-bold">
                  {remittanceOrders.filter(o => (o.status === 'completed' || o.status === 'released') && o.order_type !== 'insurance').length}
                </p>
                <p className="text-sm opacity-75 mt-1">orders</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold opacity-90">Products Sold</h3>
                  <Package size={24} />
                </div>
                <p className="text-3xl font-bold">
                  {(() => {
                    const dailyProductsSold: Record<string, number> = {};
                    remittanceOrders
                      .filter((o: any) => (o.status === 'completed' || o.status === 'released') && o.order_type !== 'insurance')
                      .forEach((o: any) => {
                        const isBalancePayment = (o.receipt_no && o.receipt_no.startsWith('BAL-')) ||
                                                 (o.receiptNo && o.receiptNo.startsWith('BAL-'));
                        if (o.items && Array.isArray(o.items)) {
                          o.items.forEach((item: any) => {
                            const productName = formatProductNameWithVariants(item);
                            if (!isBalancePayment) {
                              dailyProductsSold[productName] = (dailyProductsSold[productName] || 0) + item.quantity;
                            }
                          });
                        }
                      });
                    return Object.values(dailyProductsSold).reduce((sum, q) => sum + q, 0);
                  })()}
                </p>
                <p className="text-sm opacity-75 mt-1">units</p>
              </div>
            </div>

            {/* Products Sold Today Table */}
            {(() => {
              // Calculate daily product remittance from completed orders
              const dailyProductsSold: Record<string, { quantity: number; revenue: number }> = {};
              
              remittanceOrders
                .filter((order: any) => (order.status === 'completed' || order.status === 'released') && order.order_type !== 'insurance')
                .forEach((order: any) => {
                  const isBalancePayment = (order.receipt_no && order.receipt_no.startsWith('BAL-')) ||
                                           (order.receiptNo && order.receiptNo.startsWith('BAL-'));
                  if (order.items && Array.isArray(order.items)) {
                    order.items.forEach((item: any) => {
                      const productName = formatProductNameWithVariants(item);
                      if (!dailyProductsSold[productName]) {
                        dailyProductsSold[productName] = { quantity: 0, revenue: 0 };
                      }
                      if (!isBalancePayment) {
                        dailyProductsSold[productName].quantity += item.quantity;
                      }
                      dailyProductsSold[productName].revenue += parseFloat(item.subtotal || 0);
                    });
                  }
                });

              const dailyProductsSoldEntries = Object.entries(dailyProductsSold).sort((a: any, b: any) => b[1].quantity - a[1].quantity);

              return (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Products Sold on {remittanceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                  </div>
                  {dailyProductsSoldEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-600 text-lg">No products sold on this date</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Product Name</th>
                            <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Units Sold</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyProductsSoldEntries.map(([productName, data]: [string, any]) => (
                            <tr key={productName} className="border-b border-slate-200 hover:bg-slate-50">
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">{productName}</td>
                              <td className="px-6 py-4 text-sm text-center text-slate-600 font-semibold">{data.quantity} units</td>
                              <td className="px-6 py-4 text-sm text-right font-semibold text-green-700">
                                ₱{data.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
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
                    value={(() => {
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })()}
                    max={(() => {
                      const prevDay = new Date();
                      prevDay.setDate(prevDay.getDate() - 1);
                      const year = prevDay.getFullYear();
                      const month = String(prevDay.getMonth() + 1).padStart(2, '0');
                      const day = String(prevDay.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })()}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      const newDate = new Date(y, m - 1, d, 0, 0, 0);
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
                  {historyOrders.filter(o => o.status === 'completed' || o.status === 'released').length}
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
                    .filter(o => (o.status === 'completed' || o.status === 'released') && o.order_type !== 'insurance')
                    .reduce((sum, o) => {
                      if (o.items && Array.isArray(o.items) && o.items.length > 0) {
                        return sum + o.items.reduce((iSum: number, item: any) => iSum + (parseFloat(item.subtotal || item.total || (item.price * item.quantity)) || 0), 0);
                      }
                      return sum + (parseFloat(o.total_amount) || 0);
                    }, 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm opacity-75 mt-1">that day</p>
              </div>
            </div>

            {/* Detailed Records Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Detailed Records</h3>
                  <div className="flex items-center gap-2">
                    {historyOrders.length > 0 && user && ['admin', 'staff'].includes(user.role) && (
                      <>
                        {(filteredHistoryRows.length < historyRows.length || historySearchQuery) && (
                          <button
                            onClick={() => {
                              setBulkDeleteTarget('history');
                              setBulkDeleteScope('filtered_only');
                              setBulkRestoreInventoryStock(false);
                              setShowBulkDeleteModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-200 rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-95"
                            title="Delete only orders matching current search or filters"
                          >
                            <Trash2 size={13} />
                            Clear Filtered ({new Set(filteredHistoryRows.map(r => r.orderId)).size})
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setBulkDeleteTarget('history');
                            const hasImported = historyOrders.some((o: any) => isImportedReceipt(o.receipt_no || o.receiptNo));
                            setBulkDeleteScope(hasImported ? 'imported_only' : 'all');
                            setBulkRestoreInventoryStock(false);
                            setShowBulkDeleteModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-200 rounded-lg text-xs font-semibold transition-all shadow-xs active:scale-95"
                          title="Open bulk delete options for this date"
                        >
                          <Trash2 size={13} />
                          Clear Records ({historyOrders.length})
                        </button>
                      </>
                    )}
                    {historyRows.length > 0 && (
                      <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        Showing <span className="font-bold text-purple-600">{filteredHistoryRows.length}</span> of <span className="font-bold text-slate-700">{historyRows.length}</span> records
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
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

                    {/* Clear All Filters Button */}
                    {(Object.keys(historyColumnFilters).length > 0 || historySortColumn || historySearchQuery || historyStatusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setHistoryColumnFilters({});
                          setHistorySortColumn(null);
                          setHistorySortDirection(null);
                          setHistorySearchQuery('');
                          setHistoryStatusFilter('all');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold transition-all"
                        title="Reset all search, sorting, and column filters"
                      >
                        <RotateCcw size={13} />
                        Reset All Filters
                        {Object.keys(historyColumnFilters).length > 0 && (
                          <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.2 rounded-full ml-0.5">
                            {Object.keys(historyColumnFilters).length}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search customer, receipt, product..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm w-72"
                    />
                    {historySearchQuery && (
                      <button
                        onClick={() => setHistorySearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {filteredHistoryRows.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 font-medium">
                    {historySearchQuery || Object.keys(historyColumnFilters).length > 0
                      ? `No records match current search or filters` 
                      : historyStatusFilter === 'all' 
                        ? 'No orders found for this date' 
                        : `No ${historyStatusFilter} orders for this date`}
                  </p>
                  {(historySearchQuery || Object.keys(historyColumnFilters).length > 0 || historyStatusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setHistoryColumnFilters({});
                        setHistorySortColumn(null);
                        setHistorySortDirection(null);
                        setHistorySearchQuery('');
                        setHistoryStatusFilter('all');
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
                    >
                      <RotateCcw size={14} />
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-50">
                        <SpreadsheetColumnHeader
                          columnKey="receipt"
                          label="Receipt"
                          allRows={historyRows}
                          activeFilters={historyColumnFilters}
                          onFilterChange={handleHistoryFilterChange}
                          sortColumn={historySortColumn}
                          sortDirection={historySortDirection}
                          onSortChange={handleHistorySortChange}
                          activeDropdown={historyActiveDropdown}
                          setActiveDropdown={setHistoryActiveDropdown}
                        />
                        <SpreadsheetColumnHeader
                          columnKey="customerName"
                          label="Customer Name"
                          allRows={historyRows}
                          activeFilters={historyColumnFilters}
                          onFilterChange={handleHistoryFilterChange}
                          sortColumn={historySortColumn}
                          sortDirection={historySortDirection}
                          onSortChange={handleHistorySortChange}
                          activeDropdown={historyActiveDropdown}
                          setActiveDropdown={setHistoryActiveDropdown}
                        />
                        <SpreadsheetColumnHeader
                          columnKey="courseYear"
                          label="Course & Year"
                          allRows={historyRows}
                          activeFilters={historyColumnFilters}
                          onFilterChange={handleHistoryFilterChange}
                          sortColumn={historySortColumn}
                          sortDirection={historySortDirection}
                          onSortChange={handleHistorySortChange}
                          activeDropdown={historyActiveDropdown}
                          setActiveDropdown={setHistoryActiveDropdown}
                        />
                        <SpreadsheetColumnHeader
                          columnKey="product"
                          label="Product"
                          allRows={historyRows}
                          activeFilters={historyColumnFilters}
                          onFilterChange={handleHistoryFilterChange}
                          sortColumn={historySortColumn}
                          sortDirection={historySortDirection}
                          onSortChange={handleHistorySortChange}
                          activeDropdown={historyActiveDropdown}
                          setActiveDropdown={setHistoryActiveDropdown}
                        />
                        <SpreadsheetColumnHeader
                          columnKey="quantity"
                          label="Quantity"
                          align="center"
                          type="number"
                          allRows={historyRows}
                          activeFilters={historyColumnFilters}
                          onFilterChange={handleHistoryFilterChange}
                          sortColumn={historySortColumn}
                          sortDirection={historySortDirection}
                          onSortChange={handleHistorySortChange}
                          activeDropdown={historyActiveDropdown}
                          setActiveDropdown={setHistoryActiveDropdown}
                        />
                        <SpreadsheetColumnHeader
                          columnKey="amount"
                          label="Amount"
                          type="number"
                          allRows={historyRows}
                          activeFilters={historyColumnFilters}
                          onFilterChange={handleHistoryFilterChange}
                          sortColumn={historySortColumn}
                          sortDirection={historySortDirection}
                          onSortChange={handleHistorySortChange}
                          activeDropdown={historyActiveDropdown}
                          setActiveDropdown={setHistoryActiveDropdown}
                        />
                        <SpreadsheetColumnHeader
                          columnKey="payment"
                          label="Payment"
                          allRows={historyRows}
                          activeFilters={historyColumnFilters}
                          onFilterChange={handleHistoryFilterChange}
                          sortColumn={historySortColumn}
                          sortDirection={historySortDirection}
                          onSortChange={handleHistorySortChange}
                          activeDropdown={historyActiveDropdown}
                          setActiveDropdown={setHistoryActiveDropdown}
                        />
                        <SpreadsheetColumnHeader
                          columnKey="status"
                          label="Status"
                          allRows={historyRows}
                          activeFilters={historyColumnFilters}
                          onFilterChange={handleHistoryFilterChange}
                          sortColumn={historySortColumn}
                          sortDirection={historySortDirection}
                          onSortChange={handleHistorySortChange}
                          activeDropdown={historyActiveDropdown}
                          setActiveDropdown={setHistoryActiveDropdown}
                        />
                        <SpreadsheetColumnHeader
                          columnKey="date"
                          label="Date"
                          type="date"
                          alignRight={true}
                          allRows={historyRows}
                          activeFilters={historyColumnFilters}
                          onFilterChange={handleHistoryFilterChange}
                          sortColumn={historySortColumn}
                          sortDirection={historySortDirection}
                          onSortChange={handleHistorySortChange}
                          activeDropdown={historyActiveDropdown}
                          setActiveDropdown={setHistoryActiveDropdown}
                        />
                        <th className="text-center py-4 px-6 font-semibold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistoryRows.map((row) => (
                        <tr
                          key={row.rowId}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-6 font-mono text-slate-900 text-xs">
                            {row.displayReceipt || (Object.keys(historyColumnFilters).length > 0 ? row.receipt : '')}
                          </td>
                          <td className="py-4 px-6 text-slate-900 font-medium">
                            {row.customerName}
                          </td>
                          <td className="py-4 px-6 text-slate-900">
                            {row.courseYear}
                          </td>
                          <td className="py-4 px-6 text-slate-900">
                            {row.product}
                          </td>
                          <td className="py-4 px-6 text-center text-slate-900 font-semibold">
                            {row.quantity}
                          </td>
                          <td className="py-4 px-6 font-semibold text-green-700">
                            ₱{Number(row.amount).toFixed(2)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                row.rawPaymentMethod?.toLowerCase() === 'ewallet' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {row.payment}
                              </span>
                              {row.rawPaymentMethod?.toLowerCase() === 'ewallet' && row.referenceNumber && (
                                <span className="text-[10px] text-slate-600 font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                  Ref: {row.referenceNumber}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              row.rawStatus === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : row.rawStatus === 'released'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-700 text-xs">
                            {row.date}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {row.isFirstItem && (
                              <button
                                onClick={() => handleDeleteOrder(row.orderId, row.receipt)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-105 duration-200"
                                title="Delete Order completely"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Tailored Orders Tab */}
        {activeTab === 'tailored' && (
          <div className="space-y-6 animate-fade-in">
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

                      const filteredItems = (order.items || []).filter((item: any) => {
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
                      });

                      const displayAmount = filteredItems.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal || 0), 0);

                      return (
                        <div key={order.id} className={`border rounded-lg p-4 ${bgColor}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {formatFullName(order.first_name, order.last_name)}
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
                                ₱{displayAmount.toLocaleString()}
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
                              {filteredItems.map((item: any, idx: number) => {
                                const isDownpay = isDownpaymentItem(item);
                                const isPre = (item.orderType === 'preorder' || item.order_type === 'preorder') && !isDownpay;

                                const itemBadgeColor = isDownpay
                                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                  : isPre
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : 'bg-green-100 text-green-700 border border-green-200';

                                const itemBadgeLabel = isDownpay ? 'DOWNPAYMENT' : isPre ? 'PRE-ORDER' : 'FULL PAYMENT';

                                return (
                                  <div key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${itemBadgeColor}`}>
                                      {itemBadgeLabel}
                                    </span>
                                    <span>• {parseAndFormatLegacyProductName(item.productName || item.product_name || '', item.selectedOptions)} (Qty: {item.quantity}) - ₱{parseFloat(item.subtotal || 0).toLocaleString()}</span>
                                  </div>
                                );
                              })}
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

        {/* Pre-Orders Tab */}
        {activeTab === 'fulfillment' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Pre-Orders</h3>
                <p className="text-sm text-slate-600">Manage pre-orders awaiting fulfillment and pickup.</p>
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
              <div>
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
                    }).map((order) => {
                      const preOrderItems = (order.items || []).filter((item: any) => 
                        item.orderType === 'preorder' || item.order_type === 'preorder'
                      );
                      const preOrderTotal = preOrderItems.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal || 0), 0);
                      const isWalkIn = order.email?.includes('walkin') || order.email?.includes('@uc-metc-walkin.com') || order.is_walkin;
                      const customerEmail = order.walk_in_contact_number || order.email || order.contact_number || '';
                      const displayEmail = (customerEmail && !customerEmail.includes('@uc-metc-walkin.com')) ? customerEmail : order.email;

                      return (
                        <div key={order.id} className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold text-slate-900">
                                  {formatFullName(order.first_name, order.last_name) || order.walk_in_name || 'Walk-In Customer'}
                                </p>
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                                  PRE-ORDER
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 mb-1">
                                {isWalkIn ? (
                                  <>{displayEmail ? `Email: ${displayEmail}` : 'Walk-In Customer'} • {order.walk_in_course || 'Walk-In Kiosk'}</>
                                ) : (
                                  <>{order.email} • ID: {order.id_number}</>
                                )}
                              </p>
                              <p className="text-xs text-slate-500">
                                Receipt: {order.receipt_no} • Ordered: {new Date(order.created_at).toLocaleDateString()}
                              </p>
                              
                              {/* Pre-order items */}
                              <div className="mt-3 bg-white rounded p-2">
                                <p className="text-xs font-semibold text-slate-700 mb-1">Items:</p>
                                {preOrderItems.map((item: any, idx: number) => (
                                  <p key={idx} className="text-xs text-slate-600">
                                    • {formatProductNameWithVariants(item)} (Qty: {item.quantity})
                                  </p>
                                ))}
                              </div>
                            </div>
                            
                            <div className="text-right ml-4 flex flex-col items-end justify-between">
                              <p className="text-lg font-bold text-purple-600 mb-2">
                                ₱{preOrderTotal.toLocaleString()}
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                                    (notifiedOrders.has(order.id) || order.is_notified || order.notified)
                                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-500/20'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  onClick={async () => {
                                    if (isUpdatingStatus) return;
                                    try {
                                      setIsUpdatingStatus(true);
                                      const customerName = formatFullName(order.first_name, order.last_name) || order.walk_in_name || 'Customer';
                                      const targetEmail = customerEmail && customerEmail.includes('@') ? customerEmail : order.email;
                                      const itemsList = preOrderItems.map((item: any) => `• ${formatProductNameWithVariants(item)} (Qty: ${item.quantity})`).join('\n');
                                      
                                      const subject = `Your Pre-Order is Ready for Release! - Receipt #${order.receipt_no}`;
                                      const body = `Hello ${customerName},\n\nGood news! Your pre-order (Receipt #${order.receipt_no}) is now ready for release and pickup at the UC METC Coop Office.\n\nItems Ready for Release:\n${itemsList}\n\nPlease visit the UC METC Coop Office with your e-receipt to claim your items.\n\nBest regards,\nUC METC SILMS`;
                                      
                                      if (targetEmail && targetEmail.includes('@') && !targetEmail.includes('@uc-metc-walkin.com')) {
                                        await apiClient.sendEmail({
                                          to: targetEmail,
                                          subject,
                                          body
                                        });
                                        showNotification(`Email notification sent to ${customerName} (${targetEmail})!`, 'success');
                                      } else {
                                        showNotification(`Notification sent to ${customerName}!`, 'success');
                                      }
                                      
                                      setNotifiedOrders(prev => {
                                        const next = new Set(prev).add(order.id);
                                        try {
                                          localStorage.setItem('coop_notified_preorders', JSON.stringify(Array.from(next)));
                                        } catch (e) {
                                          console.error('Failed to save notified orders', e);
                                        }
                                        return next;
                                      });
                                    } catch (err) {
                                      console.error('Failed to send ready notification:', err);
                                      showNotification('Failed to send ready notification', 'error');
                                    } finally {
                                      setIsUpdatingStatus(false);
                                    }
                                  }}
                                  disabled={isUpdatingStatus}
                                >
                                  {(notifiedOrders.has(order.id) || order.is_notified || order.notified) ? 'Notified (Resend)' : 'Ready for Release'}
                                </button>

                                <button
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                  onClick={async () => {
                                    if (isUpdatingStatus) return;
                                    try {
                                      setIsUpdatingStatus(true);
                                      await AppDataSync.updateOrderStatus(order.id, 'released', user?.id || '');
                                      showNotification('Order marked as released!', 'success');
                                      // Reload all orders from API to get updated status
                                      await AppDataSync.loadOrdersFromAPI(user?.id || '');
                                      // Then reload pre-orders to update the list
                                      await loadPreOrderOrders();
                                    } catch (err) {
                                      console.error('Failed to mark order as released:', err);
                                      showNotification('Failed to mark order as released', 'error');
                                    } finally {
                                      setIsUpdatingStatus(false);
                                    }
                                  }}
                                  disabled={isUpdatingStatus}
                                >
                                  {isUpdatingStatus ? 'Processing...' : 'Released'}
                                </button>
                              </div>
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

        {/* Downpayments Tab */}
        {activeTab === 'downpayment' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Downpayments</h3>
                <p className="text-sm text-slate-600">Manage downpayment balance collections and dues.</p>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by customer name..."
                    value={downpaymentSearchQuery}
                    onChange={(e) => setDownpaymentSearchQuery(e.target.value)}
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
                      if (downpaymentSearchQuery) {
                        const customerName = `${o.first_name || ''} ${o.last_name || ''}`.toLowerCase();
                        if (!customerName.includes(downpaymentSearchQuery.toLowerCase())) return false;
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
                  if (!downpaymentSearchQuery) return true;
                  const customerName = `${o.first_name || ''} ${o.last_name || ''}`.toLowerCase();
                  return customerName.includes(downpaymentSearchQuery.toLowerCase());
                }).length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg">
                    <p className="text-slate-500 text-sm">
                      {downpaymentSearchQuery ? 'No downpayment orders found matching your search' : 'No downpayment balances pending'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {downpaymentOrders
                      .filter(o => {
                        if (o.status !== 'completed') return false;
                        if (!downpaymentSearchQuery) return true;
                        const customerName = `${o.first_name || ''} ${o.last_name || ''}`.toLowerCase();
                        return customerName.includes(downpaymentSearchQuery.toLowerCase());
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
                                  {formatFullName(order.first_name, order.last_name)}
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
                                  <p className="text-lg font-bold text-green-600 mb-1">
                                    ₱{downpaymentItems.reduce((sum: number, item: any) => {
                                      let fullPrice = item.fullPrice || item.full_price;
                                      
                                      if (!fullPrice) {
                                        const productName = item.productName || item.product_name || '';
                                        if (productName.includes('Gala')) {
                                          const isMember = productName.includes('Member');
                                          fullPrice = isMember ? 1150 : 1200;
                                        } else if (productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) {
                                          fullPrice = 3000;
                                        }
                                      }
                                      
                                      return sum + (fullPrice * item.quantity);
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
          <div className="space-y-6 animate-fade-in">
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
                                {formatFullName(order.first_name, order.last_name)}
                              </h4>
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                Paid
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">
                              ID: {order.id_number}
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-purple-600">
                                ₱{parseFloat(order.total_amount).toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatPaymentMethod(order.payment_method)}
                                {order.payment_method?.toLowerCase() === 'ewallet' && order.reference_number && (
                                  <span className="block text-xs text-slate-400 font-mono mt-0.5">
                                    Ref: {order.reference_number}
                                  </span>
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => setOrderToDelete({ id: order.id, receiptNo: order.receipt_no, isInsurance: true })}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 transition-all duration-200 active:scale-95 cursor-pointer flex-shrink-0"
                              title="Delete this insurance transaction"
                            >
                              <Trash2 size={16} />
                            </button>
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

                        {/* Coverage Details Section */}
                        {(() => {
                          const details = order.items?.[0]?.selectedOptions;
                          if (!details || Object.keys(details).length === 0) return null;
                          
                          let formattedBirthday = details.birthday;
                          try {
                            if (details.birthday) {
                              formattedBirthday = new Date(details.birthday).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              });
                            }
                          } catch (e) {
                            console.error(e);
                          }

                          return (
                            <div className="border-t border-slate-200 pt-4 mt-4 bg-purple-50/50 -mx-6 -mb-6 p-6 rounded-b-lg">
                              <h5 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-3">
                                Coverage & Beneficiary Details
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                                <div>
                                  <p className="text-slate-600 text-xs">Insured Full Name:</p>
                                  <p className="font-semibold text-slate-900">{details.fullName || `${order.first_name} ${order.last_name}`}</p>
                                </div>
                                <div>
                                  <p className="text-slate-600 text-xs">Birthday & Age:</p>
                                  <p className="font-semibold text-slate-900">
                                    {formattedBirthday} {details.age ? `(${details.age} years old)` : ''}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-600 text-xs">Beneficiary:</p>
                                  <p className="font-semibold text-slate-900">
                                    {details.beneficiary} <span className="text-xs text-purple-700 font-medium">({details.relation})</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hardbound Tab */}
        {activeTab === 'hardbound' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Summary */}
            <div className="bg-purple-600 rounded-xl p-8 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Hardbound Research Portal</h3>
                  <p className="text-purple-100 text-sm mt-1">Manage and track hardbound book orders, research titles, and research office submissions</p>
                  
                  {/* Status Badges Header Counter */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 text-xs font-semibold">
                    <span className="bg-white/15 px-3 py-1.5 rounded-full">
                      Total Orders: {hardboundOrders.length}
                    </span>
                    <span className="bg-emerald-500/30 border border-emerald-300/30 text-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <CheckCircle size={13} className="text-emerald-300" />
                      Submitted to RO: {hardboundOrders.filter((o: any) => !!notifiedHardboundOrders[o.id]).length}
                    </span>
                    <span className="bg-amber-500/30 border border-amber-300/30 text-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-300" />
                      Pending Submission: {hardboundOrders.filter((o: any) => !notifiedHardboundOrders[o.id]).length}
                    </span>
                    {hardboundFilterDate && (
                      <span className="bg-white/20 px-3 py-1.5 rounded-full">
                        Filter Date: {new Date(hardboundFilterDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-white/20 p-4 rounded-full hidden sm:block">
                  <BookOpen size={48} />
                </div>
              </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Hardbound Order Log</h3>
                  <p className="text-sm text-slate-600 mt-1">View research titles, authors, and manage submissions to the Research Office</p>
                </div>
                
                {/* Controls (Status Filter, Date Filter & Search Bar) */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  {/* Submission Status Filter Dropdown */}
                  <div className="w-full sm:w-auto">
                    <select
                      value={hardboundStatusFilter}
                      onChange={(e) => setHardboundStatusFilter(e.target.value as any)}
                      className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white text-slate-800 font-semibold shadow-xs"
                    >
                      <option value="all">All Submissions</option>
                      <option value="pending_submission">Pending Submission</option>
                      <option value="submitted">Submitted to Research Office</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor="hb-date-filter" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                      Date:
                    </label>
                    <div className="relative w-full sm:w-44">
                      <input
                        id="hb-date-filter"
                        type="date"
                        value={hardboundFilterDate}
                        onChange={(e) => setHardboundFilterDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white text-slate-900 font-medium"
                      />
                      {hardboundFilterDate && (
                        <button
                          onClick={() => setHardboundFilterDate('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-white px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search titles, authors, students..."
                      value={hardboundSearchQuery}
                      onChange={(e) => setHardboundSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6">
                {(() => {
                  const filtered = hardboundOrders.filter((order: any) => {
                    // Filter by date first
                    if (hardboundFilterDate) {
                      const orderDateObj = new Date(order.created_at);
                      const orderDateString = `${orderDateObj.getFullYear()}-${String(orderDateObj.getMonth() + 1).padStart(2, '0')}-${String(orderDateObj.getDate()).padStart(2, '0')}`;
                      if (orderDateString !== hardboundFilterDate) return false;
                    }

                    // Filter by submission status
                    const isSubmitted = !!notifiedHardboundOrders[order.id];
                    if (hardboundStatusFilter === 'submitted' && !isSubmitted) return false;
                    if (hardboundStatusFilter === 'pending_submission' && isSubmitted) return false;

                    const query = hardboundSearchQuery.toLowerCase().trim();
                    if (!query) return true;
                    if (order.receipt_no?.toLowerCase().includes(query)) return true;
                    const fullName = `${order.first_name || ''} ${order.last_name || ''}`.toLowerCase();
                    if (fullName.includes(query)) return true;
                    if (order.walk_in_name?.toLowerCase().includes(query)) return true;
                    if (order.id_number?.toLowerCase().includes(query)) return true;
                    if (order.walk_in_id_number?.toLowerCase().includes(query)) return true;
                    return order.items?.some((item: any) => {
                      const title = item.selectedOptions?.researchTitle || '';
                      const researcher = item.selectedOptions?.leadResearcher || '';
                      return title.toLowerCase().includes(query) || researcher.toLowerCase().includes(query);
                    }) || false;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <Package size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-600 text-lg font-medium">No hardbound orders match the selected filters</p>
                        <p className="text-slate-400 text-sm mt-1">Try clearing your search query or adjusting the submission filter</p>
                      </div>
                    );
                  }

                  // Calculate pagination
                  const totalItems = filtered.length;
                  const totalPages = Math.max(1, Math.ceil(totalItems / hardboundRowsPerPage));
                  const currentPageClamped = Math.min(hardboundCurrentPage, totalPages);
                  const startIndex = (currentPageClamped - 1) * hardboundRowsPerPage;
                  const endIndex = Math.min(startIndex + hardboundRowsPerPage, totalItems);
                  const paginatedOrders = filtered.slice(startIndex, endIndex);

                  return (
                    <div className="space-y-6">
                      {/* Paginated Hardbound Cards List */}
                      <div className="space-y-6">
                        {paginatedOrders.map((order: any) => {
                          const isSubmitted = !!notifiedHardboundOrders[order.id];
                          const submissionData = notifiedHardboundOrders[order.id];

                          return (
                            <div
                               key={order.id}
                               className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-slate-50/30"
                            >
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                                <div>
                                  <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                    <h4 className="font-semibold text-slate-900 text-base">
                                      {formatFullName(order.first_name, order.last_name) || order.walk_in_name || 'Walk-in Student'}
                                    </h4>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                      order.status === 'pending'
                                        ? 'bg-amber-100 text-amber-700'
                                        : order.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : order.status === 'released'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {order.status.toUpperCase()}
                                    </span>
                                    {isSubmitted && (
                                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                        <CheckCircle size={12} className="text-emerald-600" />
                                        SUBMITTED TO RO
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium">
                                    Student ID: {order.id_number || order.walk_in_id_number || 'N/A'} • Email: {order.email || 'N/A'}
                                  </p>
                                </div>
                                <div className="text-left md:text-right">
                                  <p className="text-xs text-slate-500 font-medium">Receipt No: <span className="font-semibold text-slate-700">{order.receipt_no}</span></p>
                                  <p className="text-xs text-slate-500 mt-1">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                {/* Research Metadata */}
                                <div className="lg:col-span-8 space-y-3">
                                  {order.items?.map((item: any, idx: number) => {
                                    const isHardbound = (item.productName || item.product_name || '').toLowerCase().includes('hard bound') || (item.productName || item.product_name || '').toLowerCase().includes('hardbound');
                                    if (!isHardbound) return null;
                                    return (
                                      <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                                          <BookOpen size={16} />
                                          <span className="text-xs font-bold uppercase tracking-wider">Research Metadata</span>
                                        </div>
                                        <div className="space-y-2.5">
                                          <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Research Title</p>
                                            <p className="text-sm font-semibold text-slate-800 leading-snug">
                                              {item.selectedOptions?.researchTitle || 'N/A'}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Lead Researcher</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                              <User size={14} className="text-slate-400" />
                                              <p className="text-sm font-medium text-slate-800">
                                                {item.selectedOptions?.leadResearcher || 'N/A'}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Payment Summary & Actions */}
                                <div className="lg:col-span-4 flex flex-col justify-between h-full bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">Amount:</p>
                                    <p className="text-2xl font-bold text-slate-900 mb-2">
                                      ₱{(order.items || [])
                                        .filter((item: any) => {
                                          const productName = item.productName || item.product_name || '';
                                          return productName.toLowerCase().includes('hard bound') || productName.toLowerCase().includes('hardbound');
                                        })
                                        .reduce((sum: number, item: any) => sum + parseFloat(item.subtotal || 0), 0)
                                        .toLocaleString()}
                                    </p>
                                    <div className="text-xs text-slate-500 font-medium">
                                      Payment Method: <span className="font-semibold text-slate-700">{formatPaymentMethod(order.payment_method)}</span>
                                      {order.payment_method === 'ewallet' && order.reference_number && (
                                        <p className="mt-0.5 text-slate-500">Ref: <span className="font-mono">{order.reference_number}</span></p>
                                      )}
                                    </div>

                                    {/* Submission to Research Office Status Badge */}
                                    {isSubmitted ? (
                                      <div className="mt-3.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                                          <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                                          <span>Submitted to Research Office</span>
                                        </div>
                                        <p className="text-[11px] text-emerald-700 mt-1">
                                          Student Notified: {new Date(submissionData.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="mt-3.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                                          <Clock size={14} className="text-amber-600 shrink-0" />
                                          <span>Pending Submission to RO</span>
                                        </div>
                                        <p className="text-[11px] text-amber-700 mt-1">
                                          In processing at Coop Office
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Notification / Submission Trigger Button */}
                                  <div className="mt-4 pt-3 border-t border-slate-100">
                                    <button
                                      onClick={() => handleNotifyHardboundSubmitted(order)}
                                      disabled={isNotifyingHardbound === order.id}
                                      className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                                        isSubmitted
                                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 active:scale-[0.98]'
                                          : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98]'
                                      }`}
                                    >
                                      {isNotifyingHardbound === order.id ? (
                                        <>
                                          <Clock size={14} className="animate-spin text-purple-400" />
                                          <span>Sending Notification...</span>
                                        </>
                                      ) : isSubmitted ? (
                                        <>
                                          <Send size={13} />
                                          <span>Resend Notification</span>
                                        </>
                                      ) : (
                                        <>
                                          <Send size={13} />
                                          <span>Notify: Submitted to RO</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls Footer */}
                      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Rows per page & record count readout */}
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-2">
                            <span>Rows per page:</span>
                            <select
                              value={hardboundRowsPerPage}
                              onChange={(e) => {
                                setHardboundRowsPerPage(Number(e.target.value));
                                setHardboundCurrentPage(1);
                              }}
                              className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-slate-800 font-bold"
                            >
                              <option value={10}>10</option>
                              <option value={15}>15</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                            </select>
                          </div>
                          <span>
                            Showing <strong className="text-slate-900">{totalItems > 0 ? startIndex + 1 : 0}</strong> to <strong className="text-slate-900">{endIndex}</strong> of <strong className="text-slate-900">{totalItems}</strong> orders
                          </span>
                        </div>

                        {/* Page Navigation Buttons */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setHardboundCurrentPage(1)}
                            disabled={currentPageClamped === 1}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            title="First Page"
                          >
                            « First
                          </button>
                          <button
                            onClick={() => setHardboundCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPageClamped === 1}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                          >
                            <ChevronLeft size={14} />
                            <span>Prev</span>
                          </button>
                          <span className="px-3 py-1.5 text-xs font-extrabold text-purple-700 bg-purple-50 rounded-lg border border-purple-200">
                            Page {currentPageClamped} of {totalPages}
                          </span>
                          <button
                            onClick={() => setHardboundCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPageClamped === totalPages}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                          >
                            <span>Next</span>
                            <ChevronRight size={14} />
                          </button>
                          <button
                            onClick={() => setHardboundCurrentPage(totalPages)}
                            disabled={currentPageClamped === totalPages}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            title="Last Page"
                          >
                            Last »
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Swimming Tab */}
        {activeTab === 'swimming' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Summary */}
            <div className="bg-purple-600 rounded-xl p-8 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Swimming Gear & Instructor Portal</h3>
                  <p className="text-purple-100 text-sm mt-1">Manage and track Swimming Set & Swimming Cap orders and instructors</p>
                  <div className="flex gap-4 mt-4 text-xs font-semibold text-purple-100">
                    <span className="bg-white/15 px-3 py-1 rounded-full">
                      {(() => {
                        const filteredByDateCount = swimmingOrders.filter((order: any) => {
                          const orderDateObj = new Date(order.created_at);
                          const orderDateString = `${orderDateObj.getFullYear()}-${String(orderDateObj.getMonth() + 1).padStart(2, '0')}-${String(orderDateObj.getDate()).padStart(2, '0')}`;
                          return !swimmingFilterDate || orderDateString === swimmingFilterDate;
                        }).length;
                        return swimmingFilterDate 
                          ? `Completed on ${new Date(swimmingFilterDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}: ${filteredByDateCount}` 
                          : `Total Orders: ${swimmingOrders.length}`;
                      })()}
                    </span>
                  </div>
                </div>
                <div className="bg-white/20 p-4 rounded-full hidden sm:block">
                  <Waves size={48} />
                </div>
              </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Swimming Order Log</h3>
                  <p className="text-sm text-slate-600 mt-1">View instructors, sizes, and student details for swimming gear orders</p>
                </div>
                
                {/* Controls (Date Filter & Search Bar) */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  {/* Date Filter */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor="sw-date-filter" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                      Date:
                    </label>
                    <div className="relative w-full sm:w-44">
                      <input
                        id="sw-date-filter"
                        type="date"
                        value={swimmingFilterDate}
                        onChange={(e) => setSwimmingFilterDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white text-slate-900 font-medium"
                      />
                      {swimmingFilterDate && (
                        <button
                          onClick={() => setSwimmingFilterDate('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-white px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search instructors, students, receipt..."
                      value={swimmingSearchQuery}
                      onChange={(e) => setSwimmingSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6">
                {(() => {
                  const filtered = swimmingOrders.filter((order: any) => {
                    if (swimmingFilterDate) {
                      const orderDateObj = new Date(order.created_at);
                      const orderDateString = `${orderDateObj.getFullYear()}-${String(orderDateObj.getMonth() + 1).padStart(2, '0')}-${String(orderDateObj.getDate()).padStart(2, '0')}`;
                      if (orderDateString !== swimmingFilterDate) return false;
                    }

                    const query = swimmingSearchQuery.toLowerCase().trim();
                    if (!query) return true;
                    if (order.receipt_no?.toLowerCase().includes(query)) return true;
                    const fullName = `${order.first_name || ''} ${order.last_name || ''}`.toLowerCase();
                    if (fullName.includes(query)) return true;
                    if (order.id_number?.toLowerCase().includes(query)) return true;
                    return order.items?.some((item: any) => {
                      const instructorName = item.selectedOptions?.instructor || item.selectedOptions?.Instructor || '';
                      const prodName = item.productName || item.product_name || '';
                      return instructorName.toLowerCase().includes(query) || prodName.toLowerCase().includes(query);
                    }) || false;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <Package size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-600 text-lg">No swimming orders found</p>
                      </div>
                    );
                  }

                  const totalItems = filtered.length;
                  const totalPages = Math.max(1, Math.ceil(totalItems / swimmingRowsPerPage));
                  const currentPageClamped = Math.min(swimmingCurrentPage, totalPages);
                  const startIndex = (currentPageClamped - 1) * swimmingRowsPerPage;
                  const endIndex = Math.min(startIndex + swimmingRowsPerPage, totalItems);
                  const paginatedOrders = filtered.slice(startIndex, endIndex);

                  return (
                    <div className="space-y-6">
                      <div className="space-y-6">
                        {paginatedOrders.map((order: any) => (
                          <div
                            key={order.id}
                            className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-slate-50/30"
                          >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                              <div>
                                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                  <h4 className="font-semibold text-slate-900 text-base">
                                    {formatFullName(order.first_name, order.last_name) || order.walk_in_name || 'Walk-in Student'}
                                  </h4>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    order.status === 'pending'
                                      ? 'bg-amber-100 text-amber-700'
                                      : order.status === 'completed'
                                      ? 'bg-green-100 text-green-700'
                                      : order.status === 'released'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {(order.status || 'completed').toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                  Student ID: {order.id_number || order.walk_in_id_number || 'N/A'} • Course: {order.course || order.walk_in_course || 'BSMT'}
                                </p>
                              </div>
                              <div className="text-left md:text-right">
                                <p className="text-xs text-slate-500 font-medium">Receipt No: <span className="font-semibold text-slate-700">{order.receipt_no}</span></p>
                                <p className="text-xs text-slate-500 mt-1">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                              <div className="lg:col-span-8 space-y-3">
                                {order.items?.map((item: any, idx: number) => {
                                  const name = (item.productName || item.product_name || '').toLowerCase();
                                  const isSwim = name.includes('swimming') || name.includes('swim set') || name.includes('swim cap') || name.includes('swimset');
                                  if (!isSwim) return null;
                                  return (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-purple-600">
                                          <Waves size={16} />
                                          <span className="text-xs font-bold uppercase tracking-wider">{item.productName || item.product_name}</span>
                                        </div>
                                        {item.selectedOptions?.size && (
                                          <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                                            Size: {item.selectedOptions.size}
                                          </span>
                                        )}
                                      </div>
                                      <div className="space-y-1.5 pt-1">
                                        <div>
                                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Assigned Instructor</p>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <User size={14} className="text-purple-600" />
                                            <p className="text-sm font-semibold text-slate-800">
                                              {item.selectedOptions?.instructor || item.selectedOptions?.Instructor || 'Not Specified'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="lg:col-span-4 flex flex-col justify-between h-full bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Amount:</p>
                                  <p className="text-2xl font-bold text-slate-900 mb-2">
                                    ₱{(order.items || [])
                                      .filter((item: any) => {
                                        const name = (item.productName || item.product_name || '').toLowerCase();
                                        return name.includes('swimming') || name.includes('swim set') || name.includes('swim cap') || name.includes('swimset');
                                      })
                                      .reduce((sum: number, item: any) => sum + parseFloat(item.subtotal || 0), 0)
                                      .toLocaleString()}
                                  </p>
                                  <div className="text-xs text-slate-500 font-medium">
                                    Payment Method: <span className="font-semibold text-slate-700">{formatPaymentMethod(order.payment_method)}</span>
                                    {order.payment_method === 'ewallet' && order.reference_number && (
                                      <p className="mt-0.5 text-slate-500">Ref: <span className="font-mono">{order.reference_number}</span></p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-2">
                            <span>Rows per page:</span>
                            <select
                              value={swimmingRowsPerPage}
                              onChange={(e) => {
                                setSwimmingRowsPerPage(Number(e.target.value));
                                setSwimmingCurrentPage(1);
                              }}
                              className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-slate-800 font-bold"
                            >
                              <option value={10}>10</option>
                              <option value={15}>15</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                            </select>
                          </div>
                          <span>
                            Showing {startIndex + 1}–{endIndex} of {totalItems} orders
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSwimmingCurrentPage(1)}
                            disabled={currentPageClamped === 1}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            title="First Page"
                          >
                            « First
                          </button>
                          <button
                            onClick={() => setSwimmingCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPageClamped === 1}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                          >
                            <ChevronLeft size={14} />
                            <span>Prev</span>
                          </button>
                          <span className="px-3 py-1.5 text-xs font-extrabold text-purple-700 bg-purple-50 rounded-lg border border-purple-200">
                            Page {currentPageClamped} of {totalPages}
                          </span>
                          <button
                            onClick={() => setSwimmingCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPageClamped === totalPages}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                          >
                            <span>Next</span>
                            <ChevronRight size={14} />
                          </button>
                          <button
                            onClick={() => setSwimmingCurrentPage(totalPages)}
                            disabled={currentPageClamped === totalPages}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            title="Last Page"
                          >
                            Last »
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Class Ring Tab */}
        {activeTab === 'classring' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Summary Banner */}
            <div className="bg-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-xs border border-white/30 text-blue-100">
                    <Award size={14} className="text-blue-200" />
                    <span>Segregated Royal Gem Trust Account</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">Class Ring Orders & Trust Funds</h3>
                  <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    Official maritime graduation class ring customizer logs. All funds collected are held on behalf of Royal Gem Jewelers and are strictly isolated from general Cooperative sales.
                  </p>
                </div>
                
                {/* Stats & Availability Toggle */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full md:w-auto">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center">
                    <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Total Trust Funds</p>
                    <p className="text-xl sm:text-2xl font-black text-white mt-1">
                      ₱{classRingOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center">
                    <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Total Ring Orders</p>
                    <p className="text-xl sm:text-2xl font-black text-white mt-1">
                      {classRingOrders.length}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col justify-between items-center text-center col-span-2 lg:col-span-1">
                    <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Class Ring</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isClassRingAvailable ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'}`}>
                        {isClassRingAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                      </span>
                      <button
                        type="button"
                        onClick={handleClassRingAvailabilityToggle}
                        style={{ minHeight: '28px', height: '28px', minWidth: '48px', width: '48px' }}
                        className={`no-min-target relative inline-flex h-7 w-12 p-0.5 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                          isClassRingAvailable ? 'bg-emerald-500 shadow-md' : 'bg-slate-400/60'
                        }`}
                        aria-label="Toggle Class Ring Ordering Availability"
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 flex-shrink-0 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isClassRingAvailable ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Orders Log Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Custom Class Ring Submissions</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Filter by cadet name, program, birthstone, or order status</p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search cadet, ring model, engraving..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed / Paid</option>
                    <option value="pending">Pending Cashier</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Class Ring Orders List */}
              <div className="p-4 sm:p-6">
                {(() => {
                  const filteredRings = classRingOrders.filter((order) => {
                    const matchesStatus = statusFilter === 'all' || 
                      (statusFilter === 'completed' && (order.status === 'completed' || order.status === 'released')) ||
                      ((statusFilter as string) === 'pending' && order.status === 'pending') ||
                      (statusFilter === 'cancelled' && order.status === 'cancelled');

                    const item = order.items?.[0] || {};
                    const opts = item.selectedOptions || order.selectedOptions || {};
                    const cadetName = `${order.first_name || ''} ${order.last_name || ''}`.toLowerCase();
                    const engraving = (opts['Inside Engraving'] || '').toLowerCase();
                    const model = (opts['Model'] || '').toLowerCase();
                    const receipt = (order.receipt_no || '').toLowerCase();
                    const query = searchQuery.toLowerCase();

                    const matchesSearch = !query || cadetName.includes(query) || engraving.includes(query) || model.includes(query) || receipt.includes(query);

                    return matchesStatus && matchesSearch;
                  });

                  if (filteredRings.length === 0) {
                    return (
                      <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                        <Award size={48} className="mx-auto text-slate-400" />
                        <h4 className="text-base font-bold text-slate-700">No Class Ring Orders Found</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          When cadets customize and submit class ring orders online, they will appear in this dedicated Royal Gem trust log.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filteredRings.map((order) => {
                        const item = order.items?.[0] || {};
                        const opts = item.selectedOptions || order.selectedOptions || {};
                        const cadetName = `${order.first_name || ''} ${order.last_name || ''}`.trim() || order.walk_in_name || 'Cadet Member';

                        return (
                          <div key={order.id || order.receipt_no} className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs hover:border-blue-300 transition-all space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                              <div className="flex items-center space-x-3">
                                <span className="font-mono text-xs font-black text-blue-900 bg-blue-100 px-3 py-1 rounded-lg border border-blue-200">
                                  #{order.receipt_no}
                                </span>
                                <div>
                                  <h4 className="text-base font-extrabold text-slate-900">{cadetName}</h4>
                                  <p className="text-xs text-slate-500 font-medium">
                                    Submitted {new Date(order.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                                  order.status === 'completed' || order.status === 'released'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : order.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                                }`}>
                                  {order.status}
                                </span>
                                <span className="text-lg font-black text-blue-700">
                                  ₱{parseFloat(order.total_amount || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Ring Specifications Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              {/* Ring Specs */}
                              <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1.5">
                                <p className="font-bold text-blue-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                                  <Award size={13} />
                                  <span>Ring Specifications</span>
                                </p>
                                <p className="text-slate-800 font-semibold"><span className="text-slate-500 font-normal">Model:</span> {opts['Model'] || 'Medium'}</p>
                                <p className="text-slate-800 font-semibold"><span className="text-slate-500 font-normal">Ring Size:</span> {opts['Ring Size'] || 'Size 8'}</p>
                                <p className="text-slate-800 font-semibold"><span className="text-slate-500 font-normal">Material:</span> {opts['Material'] || 'Stainless Steel'}</p>
                                <p className="text-slate-800 font-semibold"><span className="text-slate-500 font-normal">Finish Tone:</span> {opts['Finish'] || 'Natural Gold'}</p>
                                <p className="text-slate-800 font-semibold"><span className="text-slate-500 font-normal">Birthstone:</span> {opts['Birthstone'] || 'September (Sapphire)'}</p>
                              </div>

                              {/* Cadet Contact Info */}
                              <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1.5">
                                <p className="font-bold text-blue-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                                  <User size={13} />
                                  <span>Cadet Contact Details</span>
                                </p>
                                <p className="text-slate-800 font-semibold"><span className="text-slate-500 font-normal">Contact:</span> {opts['Contact Number'] || order.contact_number || 'N/A'}</p>
                                <p className="text-slate-800 font-semibold"><span className="text-slate-500 font-normal">School:</span> {opts['School/Organization'] || 'UC METC'}</p>
                                <p className="text-slate-800 font-semibold"><span className="text-slate-500 font-normal">Program:</span> {opts['Degree/Program'] || order.course || 'BSMT'}</p>
                                <p className="text-slate-800 font-semibold"><span className="text-slate-500 font-normal">Grad Year:</span> {opts['Graduation Year'] || '2026'}</p>
                                <p className="text-slate-800 font-semibold truncate"><span className="text-slate-500 font-normal">Address:</span> {opts['Contact Address'] || opts['Complete Address'] || order.address || 'N/A'}</p>
                              </div>

                              {/* Inside Engraving & Payment */}
                              <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 flex flex-col justify-between">
                                <div>
                                  <p className="font-bold text-blue-800 text-[11px] uppercase tracking-wider mb-1">
                                    Inside Ring Engraving
                                  </p>
                                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200 text-center font-mono font-bold text-blue-900 text-xs">
                                    "{opts['Inside Engraving'] || 'None'}"
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 text-[11px] flex justify-between text-slate-500">
                                  <span>Method: <strong className="text-slate-800">{formatPaymentMethod(order.payment_method)}</strong></span>
                                  <span>Ref: <strong className="text-slate-800 font-mono">{order.reference_number || 'N/A'}</strong></span>
                                </div>
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
          </div>
        )}

        {/* GCash Service Charge Tab */}
        {activeTab === 'gcash' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
                <Smartphone size={160} />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase">
                    <span>E-Wallet Service Fee Management</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">GCash Service Charges</h2>
                  <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
                    E-wallet convenience fees are segregated from official store sales revenue. View, audit, and reconcile GCash transaction charges collected here.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center">
                    <p className="text-[11px] text-emerald-200 uppercase font-semibold">Total GCash Logs</p>
                    <p className="text-2xl font-black text-white">{gcashOrders.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Metrics Cards */}
            {(() => {
              const completedGcash = gcashOrders.filter(o => o.status === 'completed' || o.status === 'released');
              const totalGcashSales = completedGcash.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
              const totalGcashFees = completedGcash.reduce((sum, o) => sum + calculateEWalletFee(parseFloat(o.total_amount || 0)), 0);
              const grandTotalCollected = totalGcashSales + totalGcashFees;

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {/* Card 1: Completed Transactions */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Completed Orders</p>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{completedGcash.length}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">GCash transactions</p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                      <Smartphone size={26} />
                    </div>
                  </div>

                  {/* Card 2: Service Charges Collected */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">GCash Service Charges</p>
                      <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                        ₱{totalGcashFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-amber-600/80 mt-0.5 font-medium">Segregated fee pool</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                      <CreditCard size={26} />
                    </div>
                  </div>

                  {/* Card 3: GCash Sales Revenue (Matches Reports Page) */}
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white shadow-md flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-emerald-100 tracking-wider">GCash Sales Revenue</p>
                      <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                        ₱{totalGcashSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-emerald-100/90 mt-0.5 font-medium">
                        + ₱{totalGcashFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} fee = ₱{grandTotalCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total received
                      </p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <TrendingUp size={26} />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Records Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Controls Bar */}
              <div className="p-6 border-b border-slate-200 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">GCash Transactions & Service Charges</h3>
                    <p className="text-xs text-slate-500 mt-0.5">List of all orders placed or settled via GCash with their corresponding convenience fee</p>
                  </div>
                  
                  {/* Jump to Date Filter */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="gcash-date-filter" className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Date:</label>
                    <input
                      id="gcash-date-filter"
                      type="date"
                      value={gcashFilterDate}
                      onChange={(e) => setGcashFilterDate(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {gcashFilterDate && (
                      <button
                        onClick={() => setGcashFilterDate('')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                        title="Clear date filter"
                      >
                        All Dates
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter and Search Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  {/* Status Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    <span className="text-xs text-slate-500 font-semibold mr-1">Status:</span>
                    {(['all', 'completed', 'released', 'pending', 'cancelled'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setGcashStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                          gcashStatusFilter === st
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search customer, receipt, ref #..."
                      value={gcashSearchQuery}
                      onChange={(e) => setGcashSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    {gcashSearchQuery && (
                      <button
                        onClick={() => setGcashSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Body */}
              {(() => {
                const filtered = gcashOrders.filter(order => {
                  const matchesStatus = gcashStatusFilter === 'all' || order.status === gcashStatusFilter;
                  const matchesDate = !gcashFilterDate || (() => {
                    const d = new Date((order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at);
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return dateStr === gcashFilterDate;
                  })();
                  const customerName = (order.first_name ? formatFullName(order.first_name, order.last_name) : order.walk_in_name || '').toLowerCase();
                  const receiptNo = (order.receipt_no || order.receiptNo || '').toLowerCase();
                  const refNo = (order.reference_number || '').toLowerCase();
                  const matchesSearch = !gcashSearchQuery || customerName.includes(gcashSearchQuery.toLowerCase()) || receiptNo.includes(gcashSearchQuery.toLowerCase()) || refNo.includes(gcashSearchQuery.toLowerCase());
                  return matchesStatus && matchesDate && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                        <Smartphone size={32} />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">No GCash Transactions Found</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        No transactions match the selected filters. Change the date range or clear the search filters above.
                      </p>
                    </div>
                  );
                }

                const totalItems = filtered.length;
                const totalPages = Math.max(1, Math.ceil(totalItems / gcashRowsPerPage));
                const currentPageClamped = Math.min(gcashCurrentPage, totalPages);
                const startIndex = (currentPageClamped - 1) * gcashRowsPerPage;
                const endIndex = Math.min(startIndex + gcashRowsPerPage, totalItems);
                const paginatedRows = filtered.slice(startIndex, endIndex);

                return (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                            <th className="py-3.5 px-4 font-mono">Receipt #</th>
                            <th className="py-3.5 px-4">Customer Name</th>
                            <th className="py-3.5 px-4">Course / Year</th>
                            <th className="py-3.5 px-4">GCash Ref #</th>
                            <th className="py-3.5 px-4 text-right">Order Amount</th>
                            <th className="py-3.5 px-4 text-right">Service Charge</th>
                            <th className="py-3.5 px-4 text-right font-bold text-slate-900">Total Paid</th>
                            <th className="py-3.5 px-4 text-center">Status</th>
                            <th className="py-3.5 px-4 text-center">Date</th>
                            <th className="py-3.5 px-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {paginatedRows.map((order) => {
                            const orderAmount = parseFloat(order.total_amount || 0);
                            const serviceFee = calculateEWalletFee(orderAmount);
                            const totalPaid = orderAmount + serviceFee;
                            const customerName = order.first_name ? formatFullName(order.first_name, order.last_name) : order.walk_in_name || 'Walk-in Customer';
                            const courseYear = order.course && order.year ? `${order.course} - ${order.year}` : order.course || order.year || order.walk_in_course || 'N/A';
                            const displayDate = (order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at;
                            const formattedDate = displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A';

                            return (
                              <tr key={order.id || order.receipt_no} className="hover:bg-purple-50/40 transition-colors">
                                <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900">
                                  {order.receipt_no || order.receiptNo || 'N/A'}
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-slate-900">
                                  {customerName}
                                </td>
                                <td className="py-3.5 px-4 text-xs text-slate-600">
                                  {courseYear}
                                </td>
                                <td className="py-3.5 px-4">
                                  {order.reference_number ? (
                                    <span className="inline-flex items-center font-mono text-xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                                      Ref: {order.reference_number}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400 font-mono">None</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                                  ₱{orderAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                                  +₱{serviceFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3.5 px-4 text-right font-black text-indigo-700">
                                  ₱{totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                    order.status === 'completed' 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                      : order.status === 'released'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : order.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-medium">
                                  {formattedDate}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    onClick={() => handleDeleteOrder(order.id, order.receipt_no || order.receiptNo)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-105"
                                    title="Delete order"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalItems > 0 && (
                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span>Rows per page:</span>
                            <select
                              value={gcashRowsPerPage}
                              onChange={(e) => {
                                setGcashRowsPerPage(Number(e.target.value));
                                setGcashCurrentPage(1);
                              }}
                              className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-slate-800 font-bold"
                            >
                              <option value={10}>10</option>
                              <option value={15}>15</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                            </select>
                          </div>
                          <span>
                            Showing {startIndex + 1}–{endIndex} of {totalItems} orders
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setGcashCurrentPage(1)}
                            disabled={currentPageClamped === 1}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            title="First Page"
                          >
                            « First
                          </button>
                          <button
                            onClick={() => setGcashCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPageClamped === 1}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                          >
                            <ChevronLeft size={14} />
                            <span>Prev</span>
                          </button>
                          <span className="px-3 py-1.5 text-xs font-extrabold text-purple-700 bg-purple-50 rounded-lg border border-purple-200">
                            Page {currentPageClamped} of {totalPages}
                          </span>
                          <button
                            onClick={() => setGcashCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPageClamped === totalPages}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                          >
                            <span>Next</span>
                            <ChevronRight size={14} />
                          </button>
                          <button
                            onClick={() => setGcashCurrentPage(totalPages)}
                            disabled={currentPageClamped === totalPages}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            title="Last Page"
                          >
                            Last »
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Printing & Photocopy Tab */}
        {activeTab === 'printing' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-sky-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
                <Printer size={160} />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase">
                    <Copy size={13} />
                    <span>Document & Reprographics Services</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Printing & Photocopy Sales</h2>
                  <p className="text-cyan-100 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
                    Track, audit, and reconcile document printing, thesis reports, handouts, and photocopying jobs across the cooperative.
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center">
                    <p className="text-[11px] text-cyan-200 uppercase font-semibold">Total Orders</p>
                    <p className="text-2xl font-black text-white">{printingOrders.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Metrics Cards */}
            {(() => {
              const completedPrinting = printingOrders.filter(o => o.status === 'completed' || o.status === 'released');
              const totalRevenue = completedPrinting.reduce((sum, o) => {
                if (o.items && Array.isArray(o.items) && o.items.length > 0) {
                  const printItemsSum = o.items
                    .filter((it: any) => isPrintingOrPhotocopyItem(it))
                    .reduce((itSum: number, it: any) => itSum + parseFloat(it.subtotal || it.price || 0), 0);
                  return sum + (printItemsSum > 0 ? printItemsSum : parseFloat(o.total_amount || 0));
                }
                return sum + parseFloat(o.total_amount || 0);
              }, 0);

              let printingSales = 0;
              let photocopySales = 0;
              let totalCopiesCount = 0;

              completedPrinting.forEach(o => {
                if (o.items && Array.isArray(o.items) && o.items.length > 0) {
                  o.items.forEach((it: any) => {
                    if (!isPrintingOrPhotocopyItem(it)) return;
                    const name = (it.productName || it.product_name || it.name || '').toLowerCase();
                    const isCopy = name.includes('photocopy') || name.includes('xerox') || name.includes('photo copy');
                    const amt = parseFloat(it.subtotal || it.price || 0);
                    const qty = Number(it.quantity || 1);
                    totalCopiesCount += qty;
                    if (isCopy) {
                      photocopySales += amt;
                    } else {
                      printingSales += amt;
                    }
                  });
                } else {
                  const name = (o.product_name || o.productName || '').toLowerCase();
                  const isCopy = name.includes('photocopy') || name.includes('xerox') || name.includes('photo copy');
                  const amt = parseFloat(o.total_amount || 0);
                  totalCopiesCount += 1;
                  if (isCopy) {
                    photocopySales += amt;
                  } else {
                    printingSales += amt;
                  }
                }
              });

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {/* Card 1: Total Revenue */}
                  <div className="bg-gradient-to-br from-cyan-600 to-teal-700 text-white rounded-xl p-5 shadow-md flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-cyan-100 tracking-wider">Total Sales Revenue</p>
                      <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                        ₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-cyan-100/90 mt-0.5 font-medium">All completed print & copy sales</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <TrendingUp size={26} />
                    </div>
                  </div>

                  {/* Card 2: Completed Orders */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Completed Orders</p>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{completedPrinting.length}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">{totalCopiesCount.toLocaleString()} total copies/pages</p>
                    </div>
                    <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100">
                      <CheckCircle size={26} />
                    </div>
                  </div>

                  {/* Card 3: Printing Sales */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Printing Revenue</p>
                      <p className="text-2xl sm:text-3xl font-black text-cyan-600 mt-1">
                        ₱{printingSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Document & thesis prints</p>
                    </div>
                    <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                      <Printer size={26} />
                    </div>
                  </div>

                  {/* Card 4: Photocopy Sales */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Photocopy / Xerox</p>
                      <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
                        ₱{photocopySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Photocopying services</p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                      <Copy size={26} />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Records Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Controls Bar */}
              <div className="p-6 border-b border-slate-200 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Printing & Photocopy Transaction Log</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Comprehensive list of all document printing and photocopying orders</p>
                  </div>
                  
                  {/* Date Filter */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="printing-date-filter" className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Date:</label>
                    <input
                      id="printing-date-filter"
                      type="date"
                      value={printingFilterDate}
                      onChange={(e) => setPrintingFilterDate(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    {printingFilterDate && (
                      <button
                        onClick={() => setPrintingFilterDate('')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                        title="Clear date filter"
                      >
                        All Dates
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter and Search Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Service Type Pills */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                      <span className="text-xs text-slate-500 font-semibold px-2">Service:</span>
                      {(['all', 'printing', 'photocopy'] as const).map((srv) => (
                        <button
                          key={srv}
                          onClick={() => setPrintingServiceFilter(srv)}
                          className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all ${
                            printingServiceFilter === srv
                              ? 'bg-cyan-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {srv === 'all' ? 'All Services' : srv === 'printing' ? 'Printing' : 'Photocopy'}
                        </button>
                      ))}
                    </div>

                    {/* Status Pills */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                      <span className="text-xs text-slate-500 font-semibold px-2">Status:</span>
                      {(['all', 'completed', 'released', 'pending', 'cancelled'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setPrintingStatusFilter(st)}
                          className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all ${
                            printingStatusFilter === st
                              ? 'bg-cyan-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full lg:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search customer, student ID, receipt..."
                      value={printingSearchQuery}
                      onChange={(e) => setPrintingSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                    {printingSearchQuery && (
                      <button
                        onClick={() => setPrintingSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Body */}
              {(() => {
                const filtered = printingOrders.filter(order => {
                  const matchesStatus = printingStatusFilter === 'all' || order.status === printingStatusFilter;
                  const matchesDate = !printingFilterDate || (() => {
                    const d = new Date((order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at);
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return dateStr === printingFilterDate;
                  })();

                  const matchesService = printingServiceFilter === 'all' || (() => {
                    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                      return order.items.some((it: any) => {
                        const name = (it.productName || it.product_name || it.name || '').toLowerCase();
                        const isCopy = name.includes('photocopy') || name.includes('xerox') || name.includes('photo copy');
                        return printingServiceFilter === 'photocopy' ? isCopy : !isCopy;
                      });
                    }
                    const name = (order.product_name || order.productName || '').toLowerCase();
                    const isCopy = name.includes('photocopy') || name.includes('xerox') || name.includes('photo copy');
                    return printingServiceFilter === 'photocopy' ? isCopy : !isCopy;
                  })();

                  const customerName = (order.first_name ? formatFullName(order.first_name, order.last_name) : order.walk_in_name || '').toLowerCase();
                  const receiptNo = (order.receipt_no || order.receiptNo || '').toLowerCase();
                  const studentId = (order.id_number || order.walk_in_id_number || '').toLowerCase();
                  const course = (order.course || order.walk_in_course || '').toLowerCase();
                  const itemNames = (order.items || []).map((it: any) => (it.productName || it.product_name || '').toLowerCase()).join(' ');

                  const q = printingSearchQuery.toLowerCase().trim();
                  const matchesSearch = !q || customerName.includes(q) || receiptNo.includes(q) || studentId.includes(q) || course.includes(q) || itemNames.includes(q);

                  return matchesStatus && matchesDate && matchesService && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-600">
                        <Printer size={32} />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">No Printing or Photocopy Orders Found</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        No orders match the selected filters. Change the date filter or clear search terms above.
                      </p>
                    </div>
                  );
                }

                const totalItems = filtered.length;
                const totalPages = Math.max(1, Math.ceil(totalItems / printingRowsPerPage));
                const currentPageClamped = Math.min(printingCurrentPage, totalPages);
                const startIndex = (currentPageClamped - 1) * printingRowsPerPage;
                const endIndex = Math.min(startIndex + printingRowsPerPage, totalItems);
                const paginatedOrders = filtered.slice(startIndex, endIndex);

                return (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <th className="py-3 px-4">Receipt No</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4">ID & Course</th>
                            <th className="py-3 px-4">Service Details</th>
                            <th className="py-3 px-4 text-center">Copies / Qty</th>
                            <th className="py-3 px-4 text-right">Amount</th>
                            <th className="py-3 px-4 text-center">Payment</th>
                            <th className="py-3 px-4 text-center">Status</th>
                            <th className="py-3 px-4 text-center">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {paginatedOrders.map((order: any) => {
                            const printItems = (order.items && Array.isArray(order.items) && order.items.length > 0)
                              ? order.items.filter((it: any) => isPrintingOrPhotocopyItem(it))
                              : [];
                            const customerName = order.first_name ? formatFullName(order.first_name, order.last_name) : order.walk_in_name || 'Walk-in Student';
                            const studentId = order.id_number || order.walk_in_id_number || 'N/A';
                            const courseYear = order.course && order.year ? `${order.course} - ${order.year}` : order.course || order.year || 'N/A';
                            const receiptNo = order.receipt_no || order.receiptNo || 'N/A';
                            const paymentMethod = formatPaymentMethod(order.payment_method);
                            const displayDate = (order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at;
                            const dateFormatted = displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A';

                            const totalOrderAmount = parseFloat(order.total_amount || 0);

                            return (
                              <tr key={order.id} className="hover:bg-cyan-50/30 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-cyan-800 whitespace-nowrap">
                                  {receiptNo}
                                </td>
                                <td className="py-3.5 px-4 font-semibold text-slate-800">
                                  {customerName}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">
                                  <div className="font-mono text-[11px] font-semibold text-slate-700">{studentId}</div>
                                  <div className="text-[10px] text-slate-500">{courseYear}</div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {printItems.length > 0 ? (
                                    <div className="space-y-1">
                                      {printItems.map((item: any, idx: number) => {
                                        const prodName = formatProductNameWithVariants(item);
                                        const isCopy = prodName.toLowerCase().includes('photocopy') || prodName.toLowerCase().includes('xerox') || prodName.toLowerCase().includes('photo copy');
                                        return (
                                          <div key={idx} className="flex items-center space-x-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                              isCopy ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                                            }`}>
                                              {isCopy ? 'Photocopy' : 'Printing'}
                                            </span>
                                            <span className="font-semibold text-slate-800">{prodName}</span>
                                            {item.selectedOptions?.color && (
                                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                                {item.selectedOptions.color}
                                              </span>
                                            )}
                                            {item.selectedOptions?.paperSize && (
                                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                                {item.selectedOptions.paperSize}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-700 border border-cyan-200">
                                        Printing
                                      </span>
                                      <span className="font-semibold text-slate-800">{order.product_name || order.productName || 'Printing Service'}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                                  {printItems.length > 0 
                                    ? printItems.reduce((s: number, it: any) => s + Number(it.quantity || 1), 0)
                                    : 1}
                                </td>
                                <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                                  ₱{totalOrderAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    paymentMethod === 'GCASH'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {paymentMethod}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    order.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : order.status === 'released'
                                      ? 'bg-purple-100 text-purple-800'
                                      : order.status === 'pending'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center font-medium text-slate-500 whitespace-nowrap">
                                  {dateFormatted}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalItems > 0 && (
                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span>Rows per page:</span>
                            <select
                              value={printingRowsPerPage}
                              onChange={(e) => {
                                setPrintingRowsPerPage(Number(e.target.value));
                                setPrintingCurrentPage(1);
                              }}
                              className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white text-slate-800 font-bold"
                            >
                              <option value={10}>10</option>
                              <option value={15}>15</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                            </select>
                          </div>
                          <span>
                            Showing {startIndex + 1}–{endIndex} of {totalItems} orders
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPrintingCurrentPage(1)}
                            disabled={currentPageClamped === 1}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            title="First Page"
                          >
                            « First
                          </button>
                          <button
                            onClick={() => setPrintingCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPageClamped === 1}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                          >
                            <ChevronLeft size={14} />
                            <span>Prev</span>
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-800">
                            Page {currentPageClamped} of {totalPages}
                          </span>
                          <button
                            onClick={() => setPrintingCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPageClamped === totalPages}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                          >
                            <span>Next</span>
                            <ChevronRight size={14} />
                          </button>
                          <button
                            onClick={() => setPrintingCurrentPage(totalPages)}
                            disabled={currentPageClamped === totalPages}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            title="Last Page"
                          >
                            Last »
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Excel Import Modal */}
        {showImportExcelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in" onClick={() => !isImporting && setShowImportExcelModal(false)}>
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Import Transactions from Excel/CSV</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Batch upload historical transaction lists directly to the system</p>
                  </div>
                </div>
                <button
                  disabled={isImporting}
                  onClick={() => setShowImportExcelModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* File Dropzone */}
                {!importFile ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors bg-slate-50/50">
                    <Upload className="mx-auto text-slate-400 mb-3" size={36} />
                    <p className="text-sm font-semibold text-slate-700">Drag and drop your spreadsheet here</p>
                    <p className="text-xs text-slate-500 mt-1">Supports Excel Workbook (.xlsx, .xls) and CSV (.csv)</p>
                    <label className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition-colors">
                      Browse Files
                      <input 
                        type="file" 
                        accept=".xlsx,.xls,.csv" 
                        onChange={handleImportFileChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                        <FileSpreadsheet size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{importFile.name}</p>
                        <p className="text-xs text-slate-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    {!isImporting && (
                      <button 
                        onClick={() => {
                          setImportFile(null);
                          setImportWorkbook(null);
                          setImportSheetMeta([]);
                          setParsedTransactions([]);
                        }}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        Remove File
                      </button>
                    )}
                  </div>
                )}

                {/* Configuration Options */}
                {importFile && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Select Sheet / Month</label>
                      <button
                        type="button"
                        disabled={isParsing || isImporting || importSheets.length === 0}
                        onClick={() => setIsSheetDropdownOpen(o => !o)}
                        className={`w-full flex items-center justify-between px-3 py-2 border-2 rounded-lg text-xs text-left font-semibold focus:outline-none transition-all duration-200 ${
                          isParsing || isImporting || importSheets.length === 0
                            ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                            : isSheetDropdownOpen
                              ? 'border-green-500 ring-2 ring-green-200 bg-white text-slate-800'
                              : 'border-slate-300 hover:border-slate-400 bg-white text-slate-800'
                        }`}
                      >
                        <span className={selectedImportSheet ? 'text-slate-800' : 'text-slate-400'}>
                          {importSheets.length === 0
                            ? 'No compatible sheets found'
                            : selectedImportSheet === 'All Sheets'
                              ? `All Compatible Sheets (${importSheets.length})`
                              : `✅ ${selectedImportSheet}`
                          }
                        </span>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 flex-shrink-0 ml-2 ${isSheetDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isSheetDropdownOpen && importSheets.length > 0 && (
                        <>
                          {/* Overlay to close */}
                          <div className="fixed inset-0 z-10" onClick={() => setIsSheetDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-xl shadow-2xl z-20 overflow-hidden" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                            {/* All Sheets option */}
                            <button
                              type="button"
                              onClick={() => { setSelectedImportSheet('All Sheets'); setIsSheetDropdownOpen(false); }}
                              className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-colors border-b border-slate-100 ${
                                selectedImportSheet === 'All Sheets'
                                  ? 'bg-green-50 text-green-700'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              📋 All Compatible Sheets ({importSheets.length})
                            </button>

                            {/* Compatible sheets group header */}
                            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">✅ Compatible</span>
                            </div>
                            {importSheets.map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => { setSelectedImportSheet(s); setIsSheetDropdownOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors ${
                                  selectedImportSheet === s
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {s}
                              </button>
                            ))}

                            {/* Incompatible sheets group */}
                            {importSheetMeta.filter(s => !s.valid).length > 0 && (
                              <>
                                <div className="px-3 py-1.5 bg-amber-50 border-t border-b border-amber-100">
                                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">⚠ Incompatible — will be skipped</span>
                                </div>
                                {importSheetMeta.filter(s => !s.valid).map(s => (
                                  <div
                                    key={s.name}
                                    className="px-3 py-2 text-xs text-slate-400 bg-slate-50/60 flex items-start gap-2"
                                    title={s.reason || 'Different column format'}
                                  >
                                    <span className="flex-shrink-0 mt-0.5">⚠</span>
                                    <div>
                                      <span className="font-semibold text-slate-500">{s.name}</span>
                                      <span className="text-slate-400"> — Different format</span>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </>
                      )}

                      {importSheetMeta.filter(s => !s.valid).length > 0 && (
                        <p className="text-[10px] text-amber-600 font-semibold mt-1.5">
                          ⚠ {importSheetMeta.filter(s => !s.valid).length} sheet(s) have a different format and will be skipped.
                        </p>
                      )}
                    </div>



                    <div className="flex flex-col justify-end space-y-2">
                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={importSettings.skipDuplicates}
                          onChange={(e) => setImportSettings({ ...importSettings, skipDuplicates: e.target.checked })}
                          disabled={isParsing || isImporting}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <span>Skip Duplicate Receipt Numbers</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={importSettings.autoCreateUsers}
                          onChange={(e) => setImportSettings({ ...importSettings, autoCreateUsers: e.target.checked })}
                          disabled={isParsing || isImporting}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <span>Auto-create Walk-in Members</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Parse Actions */}
                {importFile && parsedTransactions.length === 0 && (
                  <div className="text-center">
                    <button
                      onClick={() => {
                        const runParser = async () => {
                          setIsParsing(true);
                          const sheetsToParse = selectedImportSheet === 'All Sheets' ? importSheets : [selectedImportSheet];
                          const allParsed: any[] = [];
                          const logs: string[] = [];

                          try {
                            logs.push('Fetching existing transactions for duplicate detection...');
                            setImportLogs([...logs]);
                            const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
                            const existingReceiptNoSet = new Set<string>();
                            allOrders.forEach((o: any) => {
                              const r = String(o.receipt_no || o.receiptNo || '').toUpperCase().trim();
                              if (r) {
                                existingReceiptNoSet.add(r);
                                const trMatch = r.match(/TR-?(\d+)/i);
                                if (trMatch && trMatch[1]) {
                                  existingReceiptNoSet.add(trMatch[1].toUpperCase());
                                  existingReceiptNoSet.add(`TR-${trMatch[1]}`.toUpperCase());
                                  existingReceiptNoSet.add(`TR-${trMatch[1]}-2026`.toUpperCase());
                                }
                              }
                            });
                            
                            const seenInBatch = new Set<string>();

                            const normalizeStr = (text: any) => String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();

                            const isSummaryOrTotalRow = (rowCells: any[], rawClient: string, colItemVal: string, colAmountVal: string) => {
                              const cA = normalizeStr(rowCells[0] || '');
                              const cB = normalizeStr(rowCells[1] || '');
                              const client = normalizeStr(rawClient);
                              const item = normalizeStr(colItemVal);
                              const amt = parseFloat(String(colAmountVal).replace(/[^0-9.-]/g, '')) || 0;

                              // Explicit summary label in Date, TR, Client, or Item column
                              const isExplicitTotal = (s: string) => /^(total|grand\s*total|sub\s*total|subtotal|daily\s*total|monthly\s*total|overall\s*total|overall|remittance|cash\s*on\s*hand|cash\s*count|summary)$/i.test(s.trim());
                              if (isExplicitTotal(client) || isExplicitTotal(item) || isExplicitTotal(cA) || isExplicitTotal(cB)) {
                                return true;
                              }

                              // Row has amount, but NO TR, NO Client Name, and NO Item Name (bottom total row)
                              if (amt > 0 && !cB && !client && !item) {
                                return true;
                              }

                              return false;
                            };

                            sheetsToParse.forEach(sheetName => {
                              const sheet = importWorkbook.Sheets[sheetName];
                              if (!sheet) return;

                              const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
                              logs.push(`Parsing sheet "${sheetName}" (${rows.length} rows found)...`);
                              setImportLogs([...logs]);

                              let sheetTransactionsCount = 0;
                              let currentHeaderDate: string = '';
                              let currentTransaction: any = null;

                              // Detect column indices from header row if present
                              let colDate = -1;
                              let colTrNo = -1;
                              let colClient = -1;
                              let colFirstName = -1;
                              let colLastName = -1;
                              let colIdNo = -1;
                              let colCourse = -1;
                              let colItem = -1;
                              let colQty = -1;
                              let colSize = -1;
                              let colAmount = -1;
                              let colRemarks = -1;
                              let colGCash = -1;

                              const isPaymentOrRefOrRemarks = (text: string) => {
                                const t = normalizeStr(text);
                                return (
                                  t.includes('remark') ||
                                  t.includes('note') ||
                                  t.includes('comment') ||
                                  t.includes('gcash') ||
                                  t.includes('ref') ||
                                  t.includes('reference') ||
                                  t.includes('e-wallet') ||
                                  t.includes('ewallet') ||
                                  t.includes('payment') ||
                                  t.includes('paid') ||
                                  t.includes('balance') ||
                                  t.includes('change')
                                );
                              };

                              const isItemHeader = (text: string) => {
                                if (isPaymentOrRefOrRemarks(text)) return false;
                                const t = normalizeStr(text);
                                return (
                                  t.includes('item') ||
                                  t.includes('product') ||
                                  t.includes('particular') ||
                                  t.includes('description') ||
                                  t.includes('merchandise') ||
                                  t.includes('article') ||
                                  t === 'uniform' ||
                                  t === 'uniform set' ||
                                  t === 'orders' ||
                                  t === 'order'
                                );
                              };

                              const isIdHeader = (text: string) => {
                                const t = normalizeStr(text);
                                return (
                                  t.includes('id no') ||
                                  t.includes('id #') ||
                                  t.includes('id num') ||
                                  t.includes('student id') ||
                                  t.includes('id_number') ||
                                  t.includes('edp') ||
                                  t.includes('school id') ||
                                  t === 'id'
                                );
                              };

                              const isStaffOrOtherHeader = (text: string) => {
                                const t = normalizeStr(text);
                                return (
                                  t.includes('instructor') ||
                                  t.includes('teacher') ||
                                  t.includes('prof') ||
                                  t.includes('faculty') ||
                                  t.includes('cashier') ||
                                  t.includes('encoder') ||
                                  t.includes('checker') ||
                                  t.includes('prepared') ||
                                  t.includes('signature')
                                );
                              };

                              const isCourseHeader = (text: string) => {
                                if (isPaymentOrRefOrRemarks(text)) return false;
                                const t = normalizeStr(text);
                                return (
                                  t.includes('course') ||
                                  t.includes('program') ||
                                  t.includes('dept') ||
                                  t.includes('department') ||
                                  t.includes('section') ||
                                  t === 'yr' ||
                                  t === 'year' ||
                                  t === 'course/yr' ||
                                  t === 'course/year' ||
                                  t === 'course & year'
                                );
                              };

                              const isAmountHeader = (text: string) => {
                                const t = normalizeStr(text);
                                if (t.includes('ref') || t.includes('gcash') || t.includes('number') || t.includes('no.')) return false;
                                return (
                                  t.includes('amount') ||
                                  t.includes('total') ||
                                  t.includes('price') ||
                                  t.includes('subtotal') ||
                                  t.includes('cost') ||
                                  t === 'amt'
                                );
                              };

                              // Scan first 15 rows for header row
                              for (let i = 0; i < Math.min(15, rows.length); i++) {
                                const r = rows[i];
                                if (!r) continue;
                                const cells = r.map(c => normalizeStr(c));
                                const hasDate = cells.some(c => c.includes('date'));
                                const hasTr = cells.some(c => c.includes('tr no') || c.includes('tr #') || c.includes('tr.') || c.includes('receipt') || c.includes('or no') || c.includes('or #') || c.includes('trans'));
                                const hasClient = cells.some(c => 
                                  !isItemHeader(c) && !isStaffOrOtherHeader(c) && !isIdHeader(c) && !isPaymentOrRefOrRemarks(c) &&
                                  (c.includes('client') || c.includes('student') || c.includes('name') || c.includes('customer') || c.includes('buyer') || c.includes('payor') || c.includes('payer') || c.includes('cadet') || c.includes('midshipman') || c.includes('member'))
                                );
                                const hasItem = cells.some(c => isItemHeader(c));
                                const hasAmount = cells.some(c => isAmountHeader(c));

                                if ((hasDate || hasTr) && (hasClient || hasItem) && (hasItem || hasAmount)) {
                                  cells.forEach((headerText, idx) => {
                                    if (!headerText) return;

                                    if (headerText.includes('date') && colDate === -1) {
                                      colDate = idx;
                                    } else if ((headerText.includes('tr no') || headerText.includes('tr #') || headerText.includes('tr.') || headerText.includes('receipt') || headerText.includes('or no') || headerText.includes('or #') || headerText.includes('trans')) && colTrNo === -1) {
                                      colTrNo = idx;
                                    } else if (isIdHeader(headerText) && colIdNo === -1) {
                                      colIdNo = idx;
                                    } else if ((headerText.includes('first name') || headerText.includes('firstname') || headerText.includes('given name')) && colFirstName === -1) {
                                      colFirstName = idx;
                                    } else if ((headerText.includes('last name') || headerText.includes('lastname') || headerText.includes('surname') || headerText.includes('family name')) && colLastName === -1) {
                                      colLastName = idx;
                                    } else if (isItemHeader(headerText) && colItem === -1) {
                                      colItem = idx;
                                    } else if (isCourseHeader(headerText) && colCourse === -1) {
                                      colCourse = idx;
                                    } else if ((headerText.includes('qnty') || headerText.includes('qty') || headerText.includes('quantity') || headerText.includes('pcs') || headerText.includes('count')) && colQty === -1) {
                                      colQty = idx;
                                    } else if (headerText.includes('size') && colSize === -1) {
                                      colSize = idx;
                                    } else if (isAmountHeader(headerText) && colAmount === -1) {
                                      colAmount = idx;
                                    } else if ((headerText.includes('remark') || headerText.includes('note') || headerText.includes('comment')) && colRemarks === -1) {
                                      colRemarks = idx;
                                    } else if ((headerText.includes('gcash') || headerText.includes('ref') || headerText.includes('reference') || headerText.includes('e-wallet') || headerText.includes('ewallet')) && colGCash === -1) {
                                      colGCash = idx;
                                    } else if (colClient === -1 && !isStaffOrOtherHeader(headerText) && !isPaymentOrRefOrRemarks(headerText) && (
                                      headerText.includes('client') ||
                                      headerText.includes('student') ||
                                      headerText.includes('customer') ||
                                      headerText.includes('buyer') ||
                                      headerText.includes('payor') ||
                                      headerText.includes('payer') ||
                                      headerText.includes('cadet') ||
                                      headerText.includes('midshipman') ||
                                      headerText.includes('member') ||
                                      headerText.includes('full name') ||
                                      headerText.includes('fullname') ||
                                      headerText.includes('name')
                                    )) {
                                      colClient = idx;
                                    }
                                  });
                                  break;
                                }
                              }

                              // Sensible fallback defaults
                              if (colDate === -1) colDate = 0;
                              if (colTrNo === -1) colTrNo = 1;
                              if (colClient === -1 && colFirstName === -1 && colLastName === -1) colClient = 2;
                              if (colCourse === -1) colCourse = 3;
                              if (colItem === -1) colItem = 4;
                              if (colQty === -1) colQty = 5;
                              if (colSize === -1) colSize = 6;
                              if (colAmount === -1) colAmount = 7;
                              if (colRemarks === -1) colRemarks = 8;
                              if (colGCash === -1) colGCash = 9;

                              for (let r = 0; r < rows.length; r++) {
                                const row = rows[r];
                                if (!row || row.length === 0) continue;

                                const colA = colDate !== -1 ? String(row[colDate] || '').replace(/\s+/g, ' ').trim() : '';
                                const colB = colTrNo !== -1 ? String(row[colTrNo] || '').replace(/\s+/g, ' ').trim() : '';
                                
                                let rawClientName = '';
                                if (colFirstName !== -1 && colLastName !== -1) {
                                  const fn = String(row[colFirstName] || '').trim();
                                  const ln = String(row[colLastName] || '').trim();
                                  if (fn && ln) rawClientName = `${ln}, ${fn}`;
                                  else rawClientName = fn || ln;
                                } else if (colClient !== -1) {
                                  rawClientName = String(row[colClient] || '').trim();
                                }

                                // Dynamic fallback: if rawClientName is still empty, look across candidate text columns between colTrNo and colItem
                                if (!rawClientName) {
                                  for (let c = Math.max(0, colTrNo + 1); c < Math.min(row.length, colItem !== -1 ? colItem : 5); c++) {
                                    if (c === colCourse || c === colIdNo || c === colDate || c === colAmount || c === colQty || c === colSize) continue;
                                    const cellVal = String(row[c] || '').trim();
                                    if (cellVal && isNaN(Number(cellVal)) && !cellVal.includes('/') && !cellVal.includes('-') && cellVal.length > 1) {
                                      rawClientName = cellVal;
                                      break;
                                    }
                                  }
                                }

                                const colD = colCourse !== -1 ? String(row[colCourse] || '').trim() : '';
                                const colE = colItem !== -1 ? String(row[colItem] || '').trim() : '';
                                const colF = colQty !== -1 ? String(row[colQty] || '').trim() : '';
                                const colG = colSize !== -1 ? String(row[colSize] || '').trim() : '';
                                const colH = colAmount !== -1 ? String(row[colAmount] || '').trim() : '';
                                const colRemarksVal = colRemarks !== -1 ? String(row[colRemarks] || '').trim() : '';
                                const colGCashVal = colGCash !== -1 ? String(row[colGCash] || '').trim() : '';
                                const colIdVal = colIdNo !== -1 ? String(row[colIdNo] || '').trim() : '';

                                // Filter out any summary/total rows (e.g. Grand Total, Daily Total, Balance, etc.)
                                if (isSummaryOrTotalRow(row, rawClientName, colE, colH)) {
                                  continue;
                                }

                                const normColA = normalizeStr(colA);
                                const normColB = normalizeStr(colB);
                                const normClient = normalizeStr(rawClientName);
                                const normItem = normalizeStr(colE);

                                if (normColA === 'date' || normColB.includes('tr no') || normColB.includes('tr #') || normClient === 'client' || normClient === 'student') {
                                  continue;
                                }

                                if (rawClientName && !colE && !colH) {
                                  const hasMonthName = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
                                    .some(m => normClient.includes(m));
                                  if (hasMonthName) {
                                    currentHeaderDate = rawClientName;
                                    continue;
                                  }
                                }

                                if (!rawClientName && !colE && colH) {
                                  continue;
                                }

                                let effectiveItemName = colE;
                                let effectiveClientName = rawClientName;

                                // If Item column is blank but Client column actually holds a service/item (e.g. "Toga Rent", "Locker Rent")
                                const clientLower = normClient;
                                const isClientServiceOrItem = clientLower.includes('toga') ||
                                  clientLower.includes('locker') ||
                                  clientLower.includes('bonggo') ||
                                  clientLower.includes('rent') ||
                                  clientLower.includes('patch') ||
                                  clientLower.includes('lanyard') ||
                                  clientLower.includes('shirt') ||
                                  clientLower.includes('pants') ||
                                  clientLower.includes('cloth');

                                if (!effectiveItemName && rawClientName && colH) {
                                  if (isClientServiceOrItem || colB) {
                                    effectiveItemName = rawClientName;
                                    effectiveClientName = 'Walk-in Student';
                                  } else {
                                    effectiveItemName = 'General Merchandise';
                                  }
                                }

                                if (!effectiveItemName && colB && colH) {
                                  effectiveItemName = 'General Merchandise';
                                }

                                if (!effectiveItemName || !colH) {
                                  continue;
                                }

                                let dateObj = new Date();
                                if (colA) {
                                  dateObj = parseDateForImport(colA, sheetName);
                                } else if (currentHeaderDate) {
                                  dateObj = parseDateForImport(currentHeaderDate, sheetName);
                                } else {
                                  dateObj = parseDateForImport('', sheetName);
                                }

                                const trNo = colB;
                                const clientName = effectiveClientName || (trNo ? '' : (currentTransaction ? currentTransaction.walkInName : '')) || 'Walk-in Student';
                                const course = colD || (trNo ? '' : (currentTransaction ? currentTransaction.walkInCourse : '')) || '';
                                const idNumber = colIdVal || (trNo ? '' : (currentTransaction ? currentTransaction.walkInIdNumber : '')) || undefined;
                                const itemName = effectiveItemName;
                                const qnty = parseInt(String(colF).replace(/[^0-9]/g, '')) || 1;
                                const size = colG;
                                const amountVal = parseFloat(String(colH).replace(/[^0-9.-]/g, '')) || 0;

                                if (amountVal <= 0 && !trNo && !effectiveItemName) continue;

                                // Payment Method & GCash Ref Detection
                                let rowPaymentMethod = importSettings.defaultPaymentMethod || 'cash';
                                let rowReferenceNumber: string | null = null;

                                if (colGCashVal) {
                                  rowPaymentMethod = 'ewallet';
                                  rowReferenceNumber = colGCashVal.replace(/^(?:ref|gcash)\s*[:#]?\s*/i, '').trim();
                                } else if (colRemarksVal) {
                                  const remLower = colRemarksVal.toLowerCase();
                                  if (remLower.includes('gcash') || remLower.includes('e-wallet') || remLower.includes('ewallet')) {
                                    rowPaymentMethod = 'ewallet';
                                    const match = colRemarksVal.match(/(?:ref\s*[:#]?\s*|gcash\s*[:#]?\s*)(\d{4,})/i);
                                    if (match && match[1]) {
                                      rowReferenceNumber = match[1];
                                    }
                                  }
                                }

                                const matched = mapSpreadsheetItemToProductForImport(itemName, amountVal, qnty, size, course);

                                const item = {
                                  productId: matched.productId,
                                  productName: matched.productName,
                                  quantity: qnty,
                                  unitPrice: matched.unitPrice,
                                  subtotal: amountVal,
                                  selectedOptions: matched.selectedOptions,
                                  paymentType: matched.paymentType || 'full',
                                  orderType: matched.orderType || 'regular',
                                  fullPrice: matched.fullPrice || undefined
                                };

                                const cleanTr = trNo ? String(trNo).trim().replace(/^TR\s*[-#.:]?\s*/i, '').replace(/[^a-zA-Z0-9-]/g, '') : '';
                                let receiptIdStr = '';
                                if (cleanTr) {
                                  receiptIdStr = `TR-${cleanTr}-2026`;
                                } else {
                                  const dateKey = `${dateObj.getFullYear()}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getDate()).padStart(2, '0')}`;
                                  const cleanClientKey = (clientName || 'WALKIN').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
                                  receiptIdStr = `TR-WALKIN-${dateKey}-${cleanClientKey}-${Math.round(amountVal)}-R${r + 1}`;
                                }

                                const isContinuationOfCurrent = Boolean(
                                  currentTransaction && (
                                    // 1. Explicit same TR number repeated on multiple rows for same student/order (e.g. TR 8 on row 1 and TR 8 on row 2)
                                    (cleanTr && currentTransaction.rawTr && cleanTr.toUpperCase() === currentTransaction.rawTr.toUpperCase()) ||
                                    // 2. Multi-item row where TR is blank and customer matches (or customer is blank)
                                    (!trNo && (!rawClientName || normalizeStr(rawClientName) === normalizeStr(currentTransaction.walkInName) || currentTransaction.walkInName === 'Walk-in Student')) ||
                                    // 3. Customer matches and previous row had blank TR but this row provides the TR number
                                    (cleanTr && !currentTransaction.rawTr && rawClientName && normalizeStr(rawClientName) === normalizeStr(currentTransaction.walkInName))
                                  )
                                );

                                if (isContinuationOfCurrent && currentTransaction) {
                                  currentTransaction.items.push(item);
                                  currentTransaction.totalAmount += amountVal;
                                  if (rowPaymentMethod === 'ewallet') {
                                    currentTransaction.paymentMethod = 'ewallet';
                                    if (rowReferenceNumber) {
                                      currentTransaction.referenceNumber = rowReferenceNumber;
                                    }
                                  }
                                  // If previous row had a temporary walk-in ID but this continuation row provides the explicit TR number
                                  if (cleanTr && !currentTransaction.rawTr) {
                                    currentTransaction.rawTr = cleanTr;
                                    currentTransaction.receiptNo = `TR-${cleanTr}-2026`;
                                    seenInBatch.add(`TR-${cleanTr}`.toUpperCase());
                                    seenInBatch.add(`TR-${cleanTr}-2026`.toUpperCase());
                                  }
                                } else {
                                  if (currentTransaction) {
                                    allParsed.push(currentTransaction);
                                    sheetTransactionsCount++;
                                  }

                                  const isDuplicate = Boolean(
                                    existingReceiptNoSet.has(receiptIdStr.toUpperCase()) ||
                                    (cleanTr && (existingReceiptNoSet.has(cleanTr.toUpperCase()) || existingReceiptNoSet.has(`TR-${cleanTr}`.toUpperCase()) || existingReceiptNoSet.has(`TR-${cleanTr}-2026`.toUpperCase()) || existingReceiptNoSet.has(`TR-${cleanTr}-${sheetName.toUpperCase()}-2026`))) ||
                                    seenInBatch.has(receiptIdStr.toUpperCase()) ||
                                    (cleanTr && seenInBatch.has(cleanTr.toUpperCase()))
                                  );

                                  if (cleanTr) {
                                    seenInBatch.add(cleanTr.toUpperCase());
                                    seenInBatch.add(`TR-${cleanTr}`.toUpperCase());
                                    seenInBatch.add(`TR-${cleanTr}-2026`.toUpperCase());
                                  }
                                  if (receiptIdStr) {
                                    seenInBatch.add(receiptIdStr.toUpperCase());
                                  }

                                  currentTransaction = {
                                    isWalkIn: true,
                                    rawTr: cleanTr || undefined,
                                    walkInName: clientName,
                                    walkInIdNumber: idNumber || undefined,
                                    walkInCourse: course,
                                    walkInMembershipStatus: 'none',
                                    items: [item],
                                    totalAmount: amountVal,
                                    paymentMethod: rowPaymentMethod,
                                    referenceNumber: rowReferenceNumber,
                                    receiptNo: receiptIdStr,
                                    status: 'completed',
                                    createdAt: dateObj.toISOString(),
                                    completedAt: dateObj.toISOString(),
                                    isDuplicate,
                                    sheetName
                                  };
                                }
                              }

                              if (currentTransaction) {
                                allParsed.push(currentTransaction);
                                sheetTransactionsCount++;
                              }

                              logs.push(`Successfully parsed ${sheetTransactionsCount} transactions from "${sheetName}".`);
                              setImportLogs([...logs]);
                            });

                            setParsedTransactions(allParsed);
                            logs.push(`Total parsed: ${allParsed.length} transactions.`);
                            setImportLogs([...logs]);
                          } catch (err: any) {
                            console.error('Error parsing sheet:', err);
                            logs.push(`ERROR: Failed to parse spreadsheet - ${err.message || err}`);
                            setImportLogs([...logs]);
                          } finally {
                            setIsParsing(false);
                          }
                        };
                        runParser();
                      }}
                      disabled={isParsing}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition-colors text-sm disabled:opacity-50"
                    >
                      {isParsing ? 'Analyzing Spreadsheet...' : 'Analyze & Preview Data'}
                    </button>
                  </div>
                )}

                {/* Progress bar */}
                {importProgress && (
                  <div className="space-y-2 animate-pulse">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Importing Transactions...</span>
                      <span>{importProgress.current} / {importProgress.total} ({Math.round((importProgress.current / importProgress.total) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-600 h-full transition-all duration-100" 
                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Console Logs */}
                {importLogs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Log Terminal</p>
                    <div className="bg-slate-900 text-emerald-400 font-mono text-[10px] sm:text-xs p-4 rounded-xl max-h-[160px] overflow-y-auto space-y-1 scrollbar-thin">
                      {importLogs.map((log, idx) => (
                        <div key={idx} className={log.includes('ERROR') ? 'text-red-400' : log.includes('Success') || log.includes('complete') ? 'text-green-400' : 'text-emerald-400'}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Table with Filtering Toolbar */}
                {parsedTransactions.length > 0 && (
                  <div className="space-y-3">
                    {/* Filter & Batch Actions Toolbar */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Date Filter Selector & Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>Filter Date:</span>
                          </div>

                          <select
                            value={previewSelectedDate}
                            onChange={(e) => setPreviewSelectedDate(e.target.value)}
                            className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-xs cursor-pointer"
                          >
                            <option value="all">All Dates ({uniquePreviewDates.length} days, {parsedTransactions.length} txns)</option>
                            {uniquePreviewDates.map(d => (
                              <option key={d.dateKey} value={d.dateKey}>
                                {d.label} ({d.count} orders — ₱{d.total.toLocaleString()})
                              </option>
                            ))}
                          </select>

                          {previewSelectedDate !== 'all' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => keepOnlyDateInPreview(previewSelectedDate)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
                                title="Delete all other dates from preview and keep only this day's records"
                              >
                                <span>Keep Only {uniquePreviewDates.find(d => d.dateKey === previewSelectedDate)?.label}</span>
                                <span className="bg-purple-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                  {uniquePreviewDates.find(d => d.dateKey === previewSelectedDate)?.count}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeDateFromPreview(previewSelectedDate)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                                title="Delete this selected date's records from preview"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                                <span>Remove This Date</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Global Batch Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                          {parsedTransactions.some(t => t.isDuplicate && !t.overrideDuplicate) && (
                            <button
                              type="button"
                              onClick={removeAllDuplicatesFromPreview}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                              title="Remove all duplicate transactions from the preview"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              <span>Remove Duplicates ({parsedTransactions.filter(t => t.isDuplicate && !t.overrideDuplicate).length})</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setParsedTransactions([]);
                              setPreviewSelectedDate('all');
                              setPreviewSearchQuery('');
                            }}
                            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-all active:scale-95"
                            title="Clear all preview transactions"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      {/* Quick Search & Summary Stats */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                          <input
                            type="text"
                            placeholder="Search student, receipt, course, item..."
                            value={previewSearchQuery}
                            onChange={(e) => setPreviewSearchQuery(e.target.value)}
                            className="w-full text-xs pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        </div>

                        <div className="text-xs text-slate-500 font-medium">
                          Showing <span className="font-bold text-slate-900">{filteredPreviewTransactions.length}</span> of <span className="font-bold text-slate-900">{parsedTransactions.length}</span> records
                          {' • '}
                          Total: <span className="font-bold text-purple-700">₱{filteredPreviewTransactions.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[280px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 shadow-xs border-b border-slate-200">
                          <tr className="bg-slate-100">
                            <th className="px-4 py-2.5 bg-slate-100">Receipt No</th>
                            <th className="px-4 py-2.5 bg-slate-100">Date</th>
                            <th className="px-4 py-2.5 bg-slate-100">Client / Course</th>
                            <th className="px-4 py-2.5 bg-slate-100">Items</th>
                            <th className="px-4 py-2.5 bg-slate-100 text-right">Amount</th>
                            <th className="px-4 py-2.5 bg-slate-100 text-center">Payment</th>
                            <th className="px-4 py-2.5 bg-slate-100 text-center">Status</th>
                            <th className="px-4 py-2.5 bg-slate-100 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredPreviewTransactions.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                                No records match the current filter or search criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredPreviewTransactions.map((t, idx) => (
                              <tr key={t.receiptNo || idx} className={`hover:bg-slate-50 transition-colors ${t.isDuplicate && !t.overrideDuplicate && importSettings.skipDuplicates ? 'opacity-60' : ''}`}>
                                <td className="px-4 py-2 font-mono font-semibold">{t.receiptNo}</td>
                                <td className="px-4 py-2 text-slate-600">{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                                <td className="px-4 py-2 font-medium">
                                  <div>{t.walkInName}</div>
                                  <div className="text-[10px] text-slate-500">{t.walkInCourse}</div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="space-y-0.5">
                                    {t.items.map((it: any, iIdx: number) => (
                                      <div key={iIdx} className="text-slate-700">
                                        {it.productName} ({it.quantity}x)
                                        {it.selectedOptions?.size && <span className="ml-1 text-[10px] bg-slate-100 px-1 py-0.2 rounded text-slate-600">{it.selectedOptions.size}</span>}
                                        {it.paymentType === 'downpayment' && <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold">Downpayment</span>}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-right font-bold text-slate-900">₱{t.totalAmount.toLocaleString()}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    t.paymentMethod === 'ewallet' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {t.paymentMethod === 'ewallet' ? 'GCASH' : 'CASH'}
                                  </span>
                                  {t.paymentMethod === 'ewallet' && t.referenceNumber && (
                                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">Ref: {t.referenceNumber}</div>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {t.isDuplicate ? (
                                    <div className="flex flex-col items-center gap-1">
                                      {t.overrideDuplicate ? (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-800">
                                          Balance Payment
                                        </span>
                                      ) : (
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${importSettings.skipDuplicates ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                          {importSettings.skipDuplicates ? 'Duplicate (Skip)' : 'Duplicate (Overwrite)'}
                                        </span>
                                      )}
                                      <button
                                        title={t.overrideDuplicate ? 'Undo — mark as duplicate again' : 'Import this anyway as a balance / separate payment'}
                                        disabled={isImporting}
                                        onClick={() => setParsedTransactions(prev => prev.map(p => p === t ? { ...p, overrideDuplicate: !p.overrideDuplicate } : p))}
                                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                          t.overrideDuplicate
                                            ? 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                                            : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                        }`}
                                      >
                                        {t.overrideDuplicate ? 'Undo' : 'Import Anyway'}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-800">
                                      New Transaction
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    title="Remove from import"
                                    disabled={isImporting}
                                    onClick={() => setParsedTransactions(prev => prev.filter(item => item !== t))}
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-red-100 hover:border-red-300"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                      <polyline points="3 6 5 6 21 6"/>
                                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                      <path d="M10 11v6M14 11v6"/>
                                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                <button
                  disabled={isImporting}
                  onClick={() => {
                    setShowImportExcelModal(false);
                    setImportFile(null);
                    setImportWorkbook(null);
                    setParsedTransactions([]);
                    setPreviewSelectedDate('all');
                    setPreviewSearchQuery('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {parsedTransactions.length > 0 && (
                  <button
                    disabled={isImporting}
                    onClick={executeImport}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>{isImporting ? 'Executing Import...' : `Confirm & Save ${parsedTransactions.length} Transactions`}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
