import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, TrendingUp, Package, DollarSign, Calendar, Download, ChevronLeft, ChevronRight, Search, Trash2, BookOpen, User, Upload, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useAuth } from '../store/authContext';
import { apiClient } from '../services/api';
import { AppDataSync } from '../store/appDataSync';
import { useUIStore } from '../store/uiStore';
import { formatProductName, parseAndFormatLegacyProductName } from '../utils/productNameFormatter';
import { useAppStore } from '../store/appStore';
import { formatFullName } from '../utils/nameFormatter';
import * as XLSX from 'xlsx';



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
  const { products } = useAppStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'daily' | 'history' | 'remittance' | 'monthly' | 'tailored' | 'fulfillment' | 'insurance' | 'hardbound'>('pending');
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [dailyOrders, setDailyOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 1))); // Default to yesterday
   const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [preOrderOrders, setPreOrderOrders] = useState<any[]>([]);
  const [downpaymentOrders, setDownpaymentOrders] = useState<any[]>([]);
  const [fullPaymentOrders, setFullPaymentOrders] = useState<any[]>([]);
  const [insuranceOrders, setInsuranceOrders] = useState<any[]>([]);
  const [hardboundOrders, setHardboundOrders] = useState<any[]>([]);
  const [hardboundSearchQuery, setHardboundSearchQuery] = useState<string>('');
  const [hardboundFilterDate, setHardboundFilterDate] = useState<string>('');
  const [insuranceRevenue, setInsuranceRevenue] = useState<number>(0);
  const [tailoredFilter, setTailoredFilter] = useState<'all' | 'preorder' | 'downpayment' | 'fullpayment' | 'released'>('all');
  const [tailoredSearchQuery, setTailoredSearchQuery] = useState<string>('');
  const [fulfillmentSearchQuery, setFulfillmentSearchQuery] = useState<string>('');
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<any | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; receiptNo: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
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
          const salesHeaders = ['date', 'tr no', 'client', 'item', 'amount'];
          for (let i = 0; i < Math.min(10, rows.length); i++) {
            const row = rows[i];
            if (!row) continue;
            const cellValues = row.map(c => String(c || '').toLowerCase().trim());
            const matchCount = salesHeaders.filter(h => cellValues.some(c => c.includes(h))).length;
            if (matchCount >= 4) {
              return { valid: true };
            }
          }

          // No explicit header found — try heuristic: check if rows look like sales data
          // A valid data row has: a date-like value in col A, a number in col B (TR no), a name in col C, an item in col E, a number in col H (amount)
          let validDataRows = 0;
          for (let i = 0; i < Math.min(20, rows.length); i++) {
            const row = rows[i];
            if (!row || row.length < 6) continue;
            const colA = String(row[0] || '').trim();
            const colB = String(row[1] || '').trim();
            const colE = String(row[4] || '').trim() || String(row[5] || '').trim();
            const colH = String(row[7] || '').trim() || String(row[8] || '').trim();
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
    
    // Helper to map month name to index (0-11)
    const getMonthIndex = (name: string): number => {
      const lower = name.toLowerCase();
      if (lower.includes('jan')) return 0;
      if (lower.includes('feb')) return 1;
      if (lower.includes('mar')) return 2;
      if (lower.includes('apr')) return 3;
      if (lower.includes('may')) return 4;
      if (lower.includes('jun')) return 5;
      if (lower.includes('jul')) return 6;
      if (lower.includes('aug')) return 7;
      if (lower.includes('sep')) return 8;
      if (lower.includes('oct')) return 9;
      if (lower.includes('nov')) return 10;
      if (lower.includes('dec')) return 11;
      return 0; // fallback
    };

    let targetMonth = getMonthIndex(sheetName);
    let targetDay = 1;
    let targetYear = defaultYear;

    const trimmed = dateStr.trim();
    if (trimmed) {
      // Check if it's an Excel serial number (a number above 40000)
      const num = Number(trimmed);
      if (!isNaN(num) && num > 40000) {
        const date = new Date((num - 25569) * 86400 * 1000);
        date.setFullYear(defaultYear);
        return date;
      }

      // Check if it's just a day number (e.g. "12")
      if (!isNaN(num) && num >= 1 && num <= 31) {
        targetDay = Math.floor(num);
      } else {
        // Try parsing string like "5-Jan" or "5-Jan-2026" or "Jan 5"
        const parsed = Date.parse(trimmed);
        if (!isNaN(parsed)) {
          const date = new Date(parsed);
          date.setFullYear(defaultYear);
          return date;
        }
        
        // Custom parsing for formats like "2-Jan" or "Jan-2"
        const parts = trimmed.split(/[-/,\s]+/);
        if (parts.length >= 2) {
          const part0Num = Number(parts[0]);
          if (!isNaN(part0Num)) {
            targetDay = part0Num;
            targetMonth = getMonthIndex(parts[1]);
          } else {
            targetMonth = getMonthIndex(parts[0]);
            const part1Num = Number(parts[1]);
            if (!isNaN(part1Num)) {
              targetDay = part1Num;
            }
          }
        }
      }
    }

    const res = new Date(targetYear, targetMonth, targetDay, 12, 0, 0); // set to noon to avoid timezone shifts
    return res;
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
    
    if (matchedProduct.options) {
      const courseOption = matchedProduct.options.find((o: any) => o.id === 'course');
      if (courseOption) {
        const val = course.toUpperCase().trim();
        const matchedChoice = courseOption.choices.find((c: any) => {
          const cleanChoice = c.split(' ')[0].toUpperCase();
          return val.includes(cleanChoice) || cleanChoice.includes(val);
        }) || courseOption.choices[0];
        
        selectedOptions['course'] = matchedChoice;
      }
      
      const sizeOption = matchedProduct.options.find((o: any) => o.id === 'size');
      if (sizeOption) {
        const val = size.toUpperCase().trim();
        const matchedChoice = sizeOption.choices.find((c: any) => {
          const cleanChoice = c.split(' ')[0].toUpperCase();
          return val === cleanChoice || cleanChoice.includes(val) || val.includes(cleanChoice);
        }) || sizeOption.choices[0];
        
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

        if (t.isDuplicate && importSettings.skipDuplicates) {
          logs.push(`[SKIP] Transaction ${t.receiptNo} is a duplicate. Skipping.`);
          setImportLogs([...logs]);
          skipCount++;
          continue;
        }

        let isWalkIn = true;
        let userId = undefined;
        const cleanName = t.walkInName.toLowerCase().trim();
        
        const matchedUser = allUsers?.find((u: any) => {
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().trim();
          return fullName === cleanName || u.name?.toLowerCase().trim() === cleanName;
        });

        if (matchedUser) {
          isWalkIn = false;
          userId = matchedUser.id;
        }

        const orderData = {
          isWalkIn,
          walkInName: isWalkIn ? t.walkInName : undefined,
          walkInIdNumber: undefined,
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
          referenceNumber: null,
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
      
      // Filter orders for today (exclude insurance orders)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = allOrders.filter((order: any) => {
        // Use completed_at for completed orders (payment date), created_at for cancelled orders
        const orderDate = new Date((order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        const isToday = orderDate.getTime() === today.getTime();
        const isCompletedOrCancelled = order.status === 'completed' || order.status === 'released' || order.status === 'cancelled';
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

  const handleDeleteOrder = (orderId: string, receiptNo: string) => {
    setOrderToDelete({ id: orderId, receiptNo });
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setIsDeleting(true);
    try {
      await apiClient.deleteOrderAsAdmin(orderToDelete.id, user?.id || '');
      showNotification(`Order #${orderToDelete.receiptNo} deleted successfully`, 'success');
      setOrderToDelete(null);
      
      // Reload summaries to update the tables and stats immediately
      loadDailySummary();
      loadHistorySummary();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      showNotification(error?.message || 'Failed to delete order', 'error');
    } finally {
      setIsDeleting(false);
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
        const orderDate = new Date((order.status === 'completed' || order.status === 'released') && order.completed_at ? order.completed_at : order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === targetDate.getTime() && 
               (order.status === 'completed' || order.status === 'released' || order.status === 'cancelled') &&
               order.order_type !== 'insurance'; // Exclude insurance orders
      });
      
      setHistoryOrders(historyOrdersFiltered);
    } catch (err) {
      console.error('Failed to load history summary:', err);
    }
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
               order.order_type !== 'insurance';
      });
      
      setRemittanceOrders(filtered);
    } catch (err) {
      console.error('Failed to load remittance summary:', err);
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
        // Exclude pre-order orders
        const isPreOrder = order.items && Array.isArray(order.items) && order.items.some((item: any) => item.orderType === 'preorder' || item.order_type === 'preorder');
        if (isPreOrder) return false;

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
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 animate-slide-in-right">
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

            {/* Export Button - Show on Daily, History, Remittance, Monthly, Tailored, Insurance, and Hardbound tabs */}
            {(activeTab === 'daily' || activeTab === 'history' || activeTab === 'remittance' || activeTab === 'tailored' || activeTab === 'insurance' || activeTab === 'hardbound') && (
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
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('remittance')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'remittance'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Remittance
            </button>
            <button
              onClick={() => setActiveTab('tailored')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'tailored'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tailored ({preOrderOrders.length + downpaymentOrders.filter(o => !o.receipt_no || !o.receipt_no.startsWith('BAL-')).length + fullPaymentOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('fulfillment')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'fulfillment'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fulfillment
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'insurance'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Insurance
            </button>
            <button
              onClick={() => setActiveTab('hardbound')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'hardbound'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hardbound
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

              {/* Warning box */}
              <div className="mx-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2.5">
                <span className="text-base mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold">Important Notice:</p>
                  <p className="mt-0.5 leading-relaxed text-amber-700">
                    This action is permanent and cannot be undone. All items associated with this receipt will be deleted, and the inventory stock will be automatically restored.
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
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Date</th>
                        <th className="text-center py-4 px-6 font-semibold text-slate-900">Actions</th>
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    order?.payment_method?.toLowerCase() === 'ewallet' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {formatPaymentMethod(order?.payment_method)}
                                  </span>
                                  {order?.payment_method?.toLowerCase() === 'ewallet' && order?.reference_number && (
                                    <span className="text-[10px] text-slate-600 font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                      Ref: {order.reference_number}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order?.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : order?.status === 'released'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                  }`}>
                                  {order?.status === 'completed' ? 'COMPLETED' : order?.status === 'released' ? 'RELEASED' : 'CANCELLED'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-700 text-xs">
                                {(() => {
                                  const displayDate = (order?.status === 'completed' || order?.status === 'released') && order?.completed_at ? order.completed_at : order?.created_at;
                                  return displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A';
                                })()}
                              </td>
                              <td className="py-4 px-6 text-center">
                                {itemIdx === 0 ? (
                                  <button
                                    onClick={() => handleDeleteOrder(order.id, order.receipt_no)}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-105 duration-200"
                                    title="Delete Order completely"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                ) : null}
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order?.payment_method?.toLowerCase() === 'ewallet' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {formatPaymentMethod(order?.payment_method)}
                                </span>
                                {order?.payment_method?.toLowerCase() === 'ewallet' && order?.reference_number && (
                                  <span className="text-[10px] text-slate-600 font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                    Ref: {order.reference_number}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order?.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : order?.status === 'released'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order?.status === 'completed' ? 'COMPLETED' : order?.status === 'released' ? 'RELEASED' : 'CANCELLED'}
                              </span>
                            </td>
                             <td className="py-4 px-6 text-slate-700 text-xs">
                               {(() => {
                                 const displayDate = (order?.status === 'completed' || order?.status === 'released') && order?.completed_at ? order.completed_at : order?.created_at;
                                 return displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A';
                               })()}
                             </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => handleDeleteOrder(order.id, order.receipt_no)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-105 duration-200"
                                title="Delete Order completely"
                              >
                                <Trash2 size={16} />
                              </button>
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

        {/* Remittance Tab */}
        {activeTab === 'remittance' && (
          <div className="space-y-6">
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
                    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
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
                        <th className="text-left py-4 px-6 font-semibold text-slate-900">Date</th>
                        <th className="text-center py-4 px-6 font-semibold text-slate-900">Actions</th>
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
                              <td className="py-4 px-6 font-mono text-slate-900 text-xs">{itemIdx === 0 ? (order?.receipt_no || 'N/A') : ''}</td>
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    order?.payment_method?.toLowerCase() === 'ewallet' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {formatPaymentMethod(order?.payment_method)}
                                  </span>
                                  {order?.payment_method?.toLowerCase() === 'ewallet' && order?.reference_number && (
                                    <span className="text-[10px] text-slate-600 font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                      Ref: {order.reference_number}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order?.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : order?.status === 'released'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {order?.status === 'completed' ? 'COMPLETED' : order?.status === 'released' ? 'RELEASED' : 'CANCELLED'}
                                </span>
                              </td>
                               <td className="py-4 px-6 text-slate-700 text-xs">
                                {(() => {
                                  const displayDate = (order?.status === 'completed' || order?.status === 'released') && order?.completed_at ? order.completed_at : order?.created_at;
                                  return displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A';
                                })()}
                              </td>
                              <td className="py-4 px-6 text-center">
                                {itemIdx === 0 ? (
                                  <button
                                    onClick={() => handleDeleteOrder(order.id, order.receipt_no)}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-105 duration-200"
                                    title="Delete Order completely"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                ) : null}
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  order?.payment_method?.toLowerCase() === 'ewallet' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {formatPaymentMethod(order?.payment_method)}
                                </span>
                                {order?.payment_method?.toLowerCase() === 'ewallet' && order?.reference_number && (
                                  <span className="text-[10px] text-slate-600 font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                    Ref: {order.reference_number}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                order?.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : order?.status === 'released'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order?.status === 'completed' ? 'COMPLETED' : order?.status === 'released' ? 'RELEASED' : 'CANCELLED'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-700 text-xs">
                              {(() => {
                                const displayDate = (order?.status === 'completed' || order?.status === 'released') && order?.completed_at ? order.completed_at : order?.created_at;
                                return displayDate ? new Date(displayDate).toLocaleDateString() : 'N/A';
                              })()}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => handleDeleteOrder(order.id, order.receipt_no)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-105 duration-200"
                                title="Delete Order completely"
                              >
                                <Trash2 size={16} />
                              </button>
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
                              {filteredItems.map((item: any, idx: number) => (
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
                    }).map((order) => {
                      const preOrderItems = (order.items || []).filter((item: any) => 
                        item.orderType === 'preorder' || item.order_type === 'preorder'
                      );
                      const preOrderTotal = preOrderItems.reduce((sum: number, item: any) => sum + parseFloat(item.subtotal || 0), 0);

                      return (
                        <div key={order.id} className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold text-slate-900">
                                  {formatFullName(order.first_name, order.last_name)}
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
                                {preOrderItems.map((item: any, idx: number) => (
                                  <p key={idx} className="text-xs text-slate-600">
                                    • {formatProductNameWithVariants(item)} (Qty: {item.quantity})
                                  </p>
                                ))}
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-purple-600 mb-2">
                                ₱{preOrderTotal.toLocaleString()}
                              </p>
                              <button
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                                {isUpdatingStatus ? 'Processing...' : 'Mark as Released'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
          <div className="space-y-6">
            {/* Header Summary */}
            <div className="bg-purple-600 rounded-xl p-8 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Hardbound Research Portal</h3>
                  <p className="text-purple-100 text-sm mt-1">Manage and track hardbound book orders, research titles, and authors</p>
                  <div className="flex gap-4 mt-4 text-xs font-semibold text-purple-100">
                    <span className="bg-white/15 px-3 py-1 rounded-full">
                      {(() => {
                        const filteredByDateCount = hardboundOrders.filter((order: any) => {
                          const orderDateObj = new Date(order.created_at);
                          const orderDateString = `${orderDateObj.getFullYear()}-${String(orderDateObj.getMonth() + 1).padStart(2, '0')}-${String(orderDateObj.getDate()).padStart(2, '0')}`;
                          return !hardboundFilterDate || orderDateString === hardboundFilterDate;
                        }).length;
                        return hardboundFilterDate 
                          ? `Completed on ${new Date(hardboundFilterDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}: ${filteredByDateCount}` 
                          : `Completed: ${hardboundOrders.length}`;
                      })()}
                    </span>
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
                  <p className="text-sm text-slate-600 mt-1">View research titles and lead researchers for all orders</p>
                </div>
                
                {/* Controls (Date Filter & Search Bar) */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
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

                    const query = hardboundSearchQuery.toLowerCase().trim();
                    if (!query) return true;
                    if (order.receipt_no?.toLowerCase().includes(query)) return true;
                    const fullName = `${order.first_name || ''} ${order.last_name || ''}`.toLowerCase();
                    if (fullName.includes(query)) return true;
                    if (order.id_number?.toLowerCase().includes(query)) return true;
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
                        <p className="text-slate-600 text-lg">No hardbound orders found</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {filtered.map((order: any) => (
                        <div
                           key={order.id}
                           className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-slate-50/30"
                        >
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                            <div>
                              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                <h4 className="font-semibold text-slate-900 text-base">
                                  {formatFullName(order.first_name, order.last_name)}
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
                              </div>
                              <p className="text-xs text-slate-500 font-medium">
                                Student ID: {order.id_number || 'N/A'} • Email: {order.email}
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
                              </div>

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
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
                            const existingReceiptNoSet = new Set(
                              allOrders.map(o => String(o.receipt_no || o.receiptNo || '').toUpperCase().trim())
                            );
                            
                            sheetsToParse.forEach(sheetName => {
                              const sheet = importWorkbook.Sheets[sheetName];
                              if (!sheet) return;

                              const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
                              logs.push(`Parsing sheet "${sheetName}" (${rows.length} rows found)...`);
                              setImportLogs([...logs]);

                              let sheetTransactionsCount = 0;
                              let currentHeaderDate: string = '';
                              let currentTransaction: any = null;

                              for (let r = 0; r < rows.length; r++) {
                                const row = rows[r];
                                if (!row || row.length === 0) continue;

                                const colA = String(row[0] || '').trim();
                                const colB = String(row[1] || '').trim();
                                const colC = String(row[2] || '').trim();
                                const colD = String(row[3] || '').trim();
                                const colE = String(row[4] || '').trim();
                                const colF = String(row[5] || '').trim();
                                const colG = String(row[6] || '').trim();
                                const colH = String(row[7] || '').trim();

                                if (colA.toLowerCase() === 'date' || colB.toLowerCase() === 'tr no.') {
                                  continue;
                                }

                                if (colC && !colE && !colH) {
                                  const hasMonthName = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
                                    .some(m => colC.toLowerCase().includes(m));
                                  if (hasMonthName) {
                                    currentHeaderDate = colC;
                                    continue;
                                  }
                                }

                                if (!colC && !colE && colH) {
                                  continue;
                                }

                                if (!colE || !colH) {
                                  continue;
                                }

                                let dateObj = new Date();
                                if (colA) {
                                  dateObj = parseDateForImport(colA, sheetName);
                                } else if (currentHeaderDate) {
                                  dateObj = new Date(currentHeaderDate);
                                } else {
                                  dateObj = parseDateForImport('', sheetName);
                                }

                                const trNo = colB;
                                const clientName = colC || (currentTransaction ? currentTransaction.walkInName : 'Walk-in Student');
                                const course = colD || (currentTransaction ? currentTransaction.walkInCourse : '');
                                const itemName = colE;
                                const qnty = parseInt(colF) || 1;
                                const size = colG;
                                const amountVal = parseFloat(colH.replace(/,/g, '')) || 0;

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

                                const receiptIdStr = trNo ? `TR-${trNo}-${sheetName.toUpperCase()}-2026` : '';
                                const isDuplicate = receiptIdStr ? existingReceiptNoSet.has(receiptIdStr.toUpperCase()) : false;

                                if (trNo) {
                                  if (currentTransaction) {
                                    allParsed.push(currentTransaction);
                                    sheetTransactionsCount++;
                                  }

                                  currentTransaction = {
                                    isWalkIn: true,
                                    walkInName: clientName,
                                    walkInCourse: course,
                                    walkInMembershipStatus: 'none',
                                    items: [item],
                                    totalAmount: amountVal,
                                    paymentMethod: importSettings.defaultPaymentMethod,
                                    receiptNo: receiptIdStr,
                                    status: 'completed',
                                    createdAt: dateObj.toISOString(),
                                    completedAt: dateObj.toISOString(),
                                    isDuplicate,
                                    sheetName
                                  };
                                } else {
                                  if (currentTransaction) {
                                    currentTransaction.items.push(item);
                                    currentTransaction.totalAmount += amountVal;
                                  } else {
                                    currentTransaction = {
                                      isWalkIn: true,
                                      walkInName: clientName,
                                      walkInCourse: course,
                                      walkInMembershipStatus: 'none',
                                      items: [item],
                                      totalAmount: amountVal,
                                      paymentMethod: importSettings.defaultPaymentMethod,
                                      receiptNo: `TR-TEMP-${Date.now()}-${sheetName.toUpperCase()}`,
                                      status: 'completed',
                                      createdAt: dateObj.toISOString(),
                                      completedAt: dateObj.toISOString(),
                                      isDuplicate: false,
                                      sheetName
                                    };
                                  }
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

                {/* Preview Table */}
                {parsedTransactions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Transactions Preview</p>
                      <div className="text-xs text-slate-500 font-medium">
                        Total Amount: <span className="font-bold text-slate-900">₱{parsedTransactions.reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[280px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                          <tr>
                            <th className="px-4 py-2">Receipt No</th>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Client / Course</th>
                            <th className="px-4 py-2">Items</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                            <th className="px-4 py-2 text-center">Status</th>
                            <th className="px-4 py-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedTransactions.map((t, idx) => (
                            <tr key={idx} className={`hover:bg-slate-50 transition-colors ${t.isDuplicate && importSettings.skipDuplicates ? 'opacity-60' : ''}`}>
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
                                {t.isDuplicate ? (
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${importSettings.skipDuplicates ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                    {importSettings.skipDuplicates ? 'Duplicate (Skip)' : 'Duplicate (Overwrite)'}
                                  </span>
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
                                  onClick={() => setParsedTransactions(prev => prev.filter((_, i) => i !== idx))}
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between">
                <button
                  disabled={isImporting}
                  onClick={() => {
                    setShowImportExcelModal(false);
                    setImportFile(null);
                    setImportWorkbook(null);
                    setParsedTransactions([]);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                {parsedTransactions.length > 0 && (
                  <button
                    disabled={isImporting}
                    onClick={executeImport}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors text-sm disabled:opacity-50"
                  >
                    {isImporting ? 'Executing Import...' : `Confirm & Save ${parsedTransactions.length} Transactions`}
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
