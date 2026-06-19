import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, TrendingUp, Package, DollarSign, Calendar, Download, ChevronLeft, ChevronRight, Search, Trash2, PlusCircle, BookOpen, User } from 'lucide-react';
import { useAuth } from '../store/authContext';
import { apiClient } from '../services/api';
import { AppDataSync } from '../store/appDataSync';
import { useUIStore } from '../store/uiStore';
import { formatProductName, parseAndFormatLegacyProductName } from '../utils/productNameFormatter';
import { useAppStore } from '../store/appStore';
import { formatFullName } from '../utils/nameFormatter';

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
  return 300; // Default for amounts above 15000
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

  // States for manual offline transaction logging
  const [showRecordSaleModal, setShowRecordSaleModal] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const [studentType, setStudentType] = useState<'registered' | 'walkin'>('registered');
  const [walkInName, setWalkInName] = useState<string>('');
  const [walkInIdNumber, setWalkInIdNumber] = useState<string>('');
  const [walkInCourse, setWalkInCourse] = useState<string>('');
  const [walkInMembership, setWalkInMembership] = useState<'none' | 'approved'>('none');

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [paymentType, setPaymentType] = useState<'full' | 'downpayment'>('full');
  const [orderType, setOrderType] = useState<'regular' | 'preorder'>('regular');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [manualItems, setManualItems] = useState<any[]>([]);
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ewallet'>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [receiptNo, setReceiptNo] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [transactionTime, setTransactionTime] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<'completed' | 'released' | 'pending'>('completed');
  const [isSavingManualOrder, setIsSavingManualOrder] = useState<boolean>(false);

  // Initialize and load users for manual transaction
  useEffect(() => {
    if (showRecordSaleModal) {
      const loadUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const response = await apiClient.getUsers();
          const usersData = Array.isArray(response) ? response : (response.users || []);
          const studentUsers = usersData.filter((u: any) => u.role === 'user');
          setAllUsers(studentUsers);
        } catch (e) {
          console.error('Failed to load users:', e);
          showNotification('Failed to load students list', 'error');
        } finally {
          setIsLoadingUsers(false);
        }
      };
      loadUsers();

      const now = new Date();
      setReceiptNo(`RCP-OFF-${Math.floor(100000 + Math.random() * 900000)}`);
      
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setTransactionDate(`${year}-${month}-${day}`);
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTransactionTime(`${hours}:${minutes}`);

      setStudentType('registered');
      setWalkInName('');
      setWalkInIdNumber('');
      setWalkInCourse('');
      setWalkInMembership('none');
      setSelectedUser(null);
      setUserSearchQuery('');
      setSelectedProduct(null);
      setSelectedOptions({});
      setPaymentType('full');
      setQuantity(1);
      setUnitPrice(0);
      setPaymentMethod('cash');
      setReferenceNumber('');
      setOrderStatus('completed');

      if (activeTab === 'insurance') {
        setOrderType('regular');
        setManualItems([
          {
            id: `ins-${Date.now()}`,
            productId: null,
            productName: 'I-CARD Micro-insurance',
            quantity: 1,
            unitPrice: 100,
            subtotal: 100,
            selectedOptions: {},
            orderType: 'insurance'
          }
        ]);
      } else {
        setOrderType(activeTab === 'tailored' ? 'preorder' : 'regular');
        setManualItems([]);
      }
    }
  }, [showRecordSaleModal, activeTab]);

  // Keep unitPrice updated when selectedProduct or options change
  useEffect(() => {
    if (selectedProduct) {
      const isTailoredProduct = ['Gala', 'Type A & B Uniform', 'BSNAME Uniform'].includes(selectedProduct.name);
      const isMember = studentType === 'registered' 
        ? selectedUser?.membership_status === 'approved' 
        : walkInMembership === 'approved';
      
      const extractPriceFromChoice = (choiceText: string, isMemberUser: boolean): number | null => {
        const memberPriceMatch = choiceText.match(/₱([\d,]+)\s*\/\s*₱([\d,]+)\s*Member/);
        if (memberPriceMatch) {
          const regularPrice = parseInt(memberPriceMatch[1].replace(/,/g, ''));
          const memberPrice = parseInt(memberPriceMatch[2].replace(/,/g, ''));
          return isMemberUser ? memberPrice : regularPrice;
        }
        const match = choiceText.match(/₱([\d,]+)/);
        return match ? parseInt(match[1].replace(/,/g, '')) : null;
      };

      let basePrice = selectedProduct.price;
      if (selectedProduct.options && selectedProduct.options.length > 0) {
        for (const option of selectedProduct.options) {
          const selectedVal = selectedOptions[option.id];
          if (selectedVal) {
            const optPrice = extractPriceFromChoice(selectedVal, isMember);
            if (optPrice !== null) {
              basePrice = optPrice;
              break;
            }
          }
        }
      }

      if (isTailoredProduct && paymentType === 'downpayment') {
        if (selectedProduct.name === 'Gala') {
          basePrice = 500;
        } else if (selectedProduct.name === 'Type A & B Uniform' || selectedProduct.name === 'BSNAME Uniform') {
          basePrice = 1500;
        }
      }

      setUnitPrice(basePrice);

      // Auto-set orderType if out of stock
      const isMadeToOrder = ['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(selectedProduct.name);
      if (!isMadeToOrder) {
        let isOutOfStock = false;
        if (selectedProduct.variants && Object.keys(selectedProduct.variants).length > 0) {
          const allOptionsSelected = selectedProduct.options?.every((opt: any) => selectedOptions[opt.id]);
          if (allOptionsSelected) {
            const variantKey = Object.entries(selectedOptions)
              .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
              .map(([key, value]) => `${key}:${value}`)
              .join('|');
            const variant = selectedProduct.variants[variantKey];
            isOutOfStock = !variant || variant.stock <= 0;
          }
        } else {
          isOutOfStock = selectedProduct.stock <= 0;
        }

        if (isOutOfStock) {
          if (selectedProduct.allowPreorder !== false) {
            setOrderType('preorder');
          }
        } else {
          setOrderType('regular');
        }
      }
    } else {
      setUnitPrice(0);
    }
  }, [selectedProduct, selectedOptions, paymentType, selectedUser, studentType, walkInMembership]);

  const handleAddManualItem = () => {
    if (!selectedProduct) return;

    if (selectedProduct.options && selectedProduct.options.length > 0) {
      const missingOptions = selectedProduct.options.filter((opt: any) => !selectedOptions[opt.id]);
      if (missingOptions.length > 0) {
        showNotification(`Please select all options: ${missingOptions.map((o: any) => o.label).join(', ')}`, 'error');
        return;
      }
    }

    // Validate stock and pre-order availability
    const isMadeToOrder = ['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(selectedProduct.name);
    if (isMadeToOrder) {
      if (selectedProduct.allowPreorder === false) {
        showNotification('This tailored product/service is currently unavailable.', 'error');
        return;
      }
    } else {
      let isOutOfStock = false;
      let stockVal = 0;
      if (selectedProduct.variants && Object.keys(selectedProduct.variants).length > 0) {
        const variantKey = Object.entries(selectedOptions)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([key, value]) => `${key}:${value}`)
          .join('|');
        const variant = selectedProduct.variants[variantKey];
        stockVal = variant ? variant.stock : 0;
        isOutOfStock = stockVal <= 0;
      } else {
        stockVal = selectedProduct.stock;
        isOutOfStock = stockVal <= 0;
      }

      if (isOutOfStock) {
        if (selectedProduct.allowPreorder === false) {
          showNotification('This item is out of stock and not available for pre-order.', 'error');
          return;
        }
        if (orderType !== 'preorder') {
          showNotification('This item is out of stock. Please set Order Type to Pre-Order.', 'error');
          return;
        }
      } else if (quantity > stockVal && orderType !== 'preorder') {
        showNotification(`Requested quantity (${quantity}) exceeds available stock (${stockVal}). Choose Pre-Order or reduce quantity.`, 'error');
        return;
      }
    }

    const isTailoredProduct = ['Gala', 'Type A & B Uniform', 'BSNAME Uniform'].includes(selectedProduct.name);
    const itemSubtotal = quantity * unitPrice;
    const itemId = `${selectedProduct.id}-${Date.now()}`;

    const isMember = studentType === 'registered' 
      ? selectedUser?.membership_status === 'approved' 
      : walkInMembership === 'approved';
    const extractPriceFromChoice = (choiceText: string, isMemberUser: boolean): number | null => {
      const memberPriceMatch = choiceText.match(/₱([\d,]+)\s*\/\s*₱([\d,]+)\s*Member/);
      if (memberPriceMatch) {
        const regularPrice = parseInt(memberPriceMatch[1].replace(/,/g, ''));
        const memberPrice = parseInt(memberPriceMatch[2].replace(/,/g, ''));
        return isMemberUser ? memberPrice : regularPrice;
      }
      const match = choiceText.match(/₱([\d,]+)/);
      return match ? parseInt(match[1].replace(/,/g, '')) : null;
    };

    let baseFullPrice = selectedProduct.price;
    if (selectedProduct.options && selectedProduct.options.length > 0) {
      for (const option of selectedProduct.options) {
        const selectedVal = selectedOptions[option.id];
        if (selectedVal) {
          const optPrice = extractPriceFromChoice(selectedVal, isMember);
          if (optPrice !== null) {
            baseFullPrice = optPrice;
            break;
          }
        }
      }
    }

    const newItem = {
      id: itemId,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      unitPrice,
      subtotal: itemSubtotal,
      selectedOptions: { ...selectedOptions },
      paymentType: isTailoredProduct ? paymentType : undefined,
      orderType: orderType,
      fullPrice: isTailoredProduct && paymentType === 'downpayment' ? baseFullPrice : undefined
    };

    setManualItems([...manualItems, newItem]);
    
    setSelectedProduct(null);
    setSelectedOptions({});
    setPaymentType('full');
    setOrderType('regular');
    setQuantity(1);
    setUnitPrice(0);
    showNotification('Item added to transaction', 'success');
  };

  const handleRemoveManualItem = (idToRemove: string) => {
    setManualItems(manualItems.filter(item => item.id !== idToRemove));
    showNotification('Item removed from transaction');
  };

  const refreshActiveTabData = async () => {
    if (activeTab === 'pending') await loadPendingOrders();
    else if (activeTab === 'daily') await loadDailySummary();
    else if (activeTab === 'history') await loadHistorySummary();
    else if (activeTab === 'remittance') await loadRemittanceSummary();
    else if (activeTab === 'monthly') await loadMonthlyReport();
    else if (activeTab === 'tailored') {
      await loadPreOrderOrders();
      await loadDownpaymentOrders();
      await loadFullPaymentOrders();
    }
    else if (activeTab === 'insurance') await loadInsuranceOrders();
    else if (activeTab === 'hardbound') await loadHardboundOrders();
  };

  const handleSaveManualOrder = async () => {
    if (studentType === 'registered' && !selectedUser) {
      showNotification('Please select a student/user', 'error');
      return;
    }
    if (studentType === 'walkin' && !walkInName.trim()) {
      showNotification('Please enter student name', 'error');
      return;
    }
    if (manualItems.length === 0) {
      showNotification('Please add at least one item to the transaction', 'error');
      return;
    }
    if (!receiptNo.trim()) {
      showNotification('Please enter a receipt number', 'error');
      return;
    }
    if (paymentMethod === 'ewallet' && (!referenceNumber.trim() || referenceNumber.trim().length !== 4)) {
      showNotification('Please enter the last 4 digits of the GCash reference number', 'error');
      return;
    }

    setIsSavingManualOrder(true);

    try {
      const orderDateObj = new Date(`${transactionDate}T${transactionTime}:00`);
      
      const subtotalAmount = manualItems.reduce((sum, item) => sum + item.subtotal, 0);
      const ewalletFee = paymentMethod === 'ewallet' ? calculateEWalletFee(subtotalAmount) : 0;
      const totalAmount = subtotalAmount + ewalletFee;

      const orderData = {
        isWalkIn: studentType === 'walkin',
        walkInName: studentType === 'walkin' ? walkInName.trim() : undefined,
        walkInIdNumber: studentType === 'walkin' && walkInIdNumber.trim() ? walkInIdNumber.trim() : undefined,
        walkInCourse: studentType === 'walkin' && walkInCourse.trim() ? walkInCourse.trim() : undefined,
        walkInMembershipStatus: studentType === 'walkin' ? walkInMembership : undefined,
        userId: studentType === 'registered' ? selectedUser.id : undefined,
        items: manualItems.map(item => ({
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
        totalAmount,
        paymentMethod,
        referenceNumber: paymentMethod === 'ewallet' ? referenceNumber : null,
        receiptNo: receiptNo.trim(),
        orderType: activeTab === 'insurance' ? 'insurance' : 'merchandise',
        status: orderStatus,
        createdAt: orderDateObj.toISOString(),
        completedAt: orderStatus !== 'pending' ? orderDateObj.toISOString() : null
      };

      await apiClient.createOrder(orderData, user?.id || '');
      
      showNotification('Offline transaction recorded successfully!', 'success');
      setShowRecordSaleModal(false);
      
      await AppDataSync.loadProductsFromAPI();
      await refreshActiveTabData();
    } catch (e: any) {
      console.error('Failed to record manual order:', e);
      showNotification(e.message || 'Failed to record transaction', 'error');
    } finally {
      setIsSavingManualOrder(false);
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
            const productName = formatProductNameWithVariants(item);
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

  const loadRemittanceSummary = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      const targetDate = new Date(remittanceDate);
      targetDate.setHours(0, 0, 0, 0);
      
      const filtered = allOrders.filter((order: any) => {
        const orderDate = new Date(order.status === 'completed' && order.completed_at ? order.completed_at : order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === targetDate.getTime() && 
               (order.status === 'completed' || order.status === 'cancelled') &&
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
        .filter((order: any) => order.status === 'completed' && order.order_type !== 'insurance')
        .forEach((order: any) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              const productName = formatProductNameWithVariants(item);
              const { category, sku } = resolveProductInfo(item.productName || item.product_name || '');
              const unitPrice = parseFloat(item.unitPrice || item.unit_price || 0);

              if (!dailyProductsSold[productName]) {
                dailyProductsSold[productName] = { quantity: 0, revenue: 0, category, sku, price: unitPrice };
              }
              dailyProductsSold[productName].quantity += item.quantity;
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
          { label: 'Completed Orders', value: remittanceOrders.filter((o: any) => o.status === 'completed' && o.order_type !== 'insurance').length.toString(), bg: '#f3e8ff', border: '#d8b4fe', color: '#6d28d9' },
          { label: 'Products Sold', value: `${totalUnits} units`, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' }
        ],
        tableHeader,
        tableRows
      );

      triggerExcelDownload(htmlContent, `daily_remittance_${formatLocalDate(remittanceDate)}`);
      showNotification('Daily remittance report exported successfully!', 'success');
      return;
    }

    if (activeTab === 'monthly') {
      if (!monthlyData) return;
      
      const rows = Object.entries(monthlyData.productsSold)
        .sort((a: any, b: any) => b[1].quantity - a[1].quantity)
        .map(([productName, data]: [string, any]) => {
          const { category, sku } = resolveProductInfo(productName);
          const price = data.revenue / (data.quantity || 1);
          return {
            name: productName,
            category,
            sku,
            price,
            quantity: data.quantity,
            revenue: data.revenue
          };
        });

      const totalSales = monthlyData.totalSales;
      const totalUnits = rows.reduce((sum, r) => sum + r.quantity, 0);

      const tableHeader = `
        <tr style="background-color: #6d28d9; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; height: 35px;">
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 250px;">Product Name</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Category</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 150px;">SKU</th>
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 110px;">Avg Unit Price</th>
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

      const monthStr = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const htmlContent = getExcelHtmlWrapper(
        'Monthly Sales Report',
        `Month: ${monthStr}`,
        [
          { label: 'Total Sales', value: `₱${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' },
          { label: 'Completed Orders', value: monthlyData.orderCount.toString(), bg: '#f3e8ff', border: '#d8b4fe', color: '#6d28d9' },
          { label: 'Products Sold', value: `${totalUnits} units`, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' }
        ],
        tableHeader,
        tableRows
      );

      triggerExcelDownload(htmlContent, `monthly_sales_${monthStr.replace(/\s/g, '_')}`);
      showNotification('Monthly report exported successfully!', 'success');
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
        const orderDateStr = order?.status === 'completed' && order?.completed_at ? order.completed_at : order?.created_at;
        const time = orderDateStr ? new Date(orderDateStr).toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : 'N/A';

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
              status: order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED',
              time
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
            status: order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED',
            time
          });
        }
      });

      const totalSales = rows.reduce((sum, r) => r.status === 'COMPLETED' ? sum + r.subtotal : sum, 0);
      const completedCount = filteredOrders.filter(o => o.status === 'completed').length;
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
          <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 100px;">Time</th>
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
            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">${row.time}</td>
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
              <td colspan="7" style="font-family: Arial, sans-serif; font-size: 10px; text-align: center; color: #444444; padding: 2px 0; padding-bottom: 20px;">
                ucmetc.ecc@gmail.com tel no. 410-8811 local 5155
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
              onClick={() => setShowRecordSaleModal(true)}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg hover:scale-105 text-xs sm:text-base w-full sm:w-auto"
            >
              <PlusCircle size={18} className="sm:w-5 sm:h-5" />
              <span>Record Offline Sale</span>
            </button>

            {/* Export Button - Show on Daily, History, Remittance, Monthly, Tailored, Insurance, and Hardbound tabs */}
            {(activeTab === 'daily' || activeTab === 'history' || activeTab === 'remittance' || activeTab === 'monthly' || activeTab === 'tailored' || activeTab === 'insurance' || activeTab === 'hardbound') && (
              <button
                onClick={exportToExcel}
                className="flex items-center justify-center sm:justify-start space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg hover:scale-105 text-xs sm:text-base w-full sm:w-auto"
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
              onClick={() => setActiveTab('monthly')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'monthly'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
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
                      {formatFullName(selectedPendingOrder.first_name, selectedPendingOrder.last_name)}
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
                                    : 'bg-red-100 text-red-800'
                                  }`}>
                                  {order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-slate-700 text-xs">
                                {(() => {
                                  const displayDate = order?.status === 'completed' && order?.completed_at ? order.completed_at : order?.created_at;
                                  return displayDate ? new Date(displayDate).toLocaleString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  }) : 'N/A';
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
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED'}
                              </span>
                            </td>
                             <td className="py-4 px-6 text-slate-700 text-xs">
                               {(() => {
                                 const displayDate = order?.status === 'completed' && order?.completed_at ? order.completed_at : order?.created_at;
                                 return displayDate ? new Date(displayDate).toLocaleString('en-US', {
                                   hour: 'numeric',
                                   minute: '2-digit',
                                   hour12: true
                                 }) : 'N/A';
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
                    .filter(o => o.status === 'completed' && o.order_type !== 'insurance')
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
                  {remittanceOrders.filter(o => o.status === 'completed' && o.order_type !== 'insurance').length}
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
                      .filter((o: any) => o.status === 'completed' && o.order_type !== 'insurance')
                      .forEach((o: any) => {
                        if (o.items && Array.isArray(o.items)) {
                          o.items.forEach((item: any) => {
                            const productName = formatProductNameWithVariants(item);
                            dailyProductsSold[productName] = (dailyProductsSold[productName] || 0) + item.quantity;
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
                .filter((order: any) => order.status === 'completed' && order.order_type !== 'insurance')
                .forEach((order: any) => {
                  if (order.items && Array.isArray(order.items)) {
                    order.items.forEach((item: any) => {
                      const productName = formatProductNameWithVariants(item);
                      if (!dailyProductsSold[productName]) {
                        dailyProductsSold[productName] = { quantity: 0, revenue: 0 };
                      }
                      dailyProductsSold[productName].quantity += item.quantity;
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
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED'}
                                </span>
                              </td>
                               <td className="py-4 px-6 text-slate-700 text-xs">
                                {(() => {
                                  const displayDate = order?.status === 'completed' && order?.completed_at ? order.completed_at : order?.created_at;
                                  return displayDate ? new Date(displayDate).toLocaleString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  }) : 'N/A';
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
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order?.status === 'completed' ? 'COMPLETED' : 'CANCELLED'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-700 text-xs">
                              {(() => {
                                const displayDate = order?.status === 'completed' && order?.completed_at ? order.completed_at : order?.created_at;
                                return displayDate ? new Date(displayDate).toLocaleString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                }) : 'N/A';
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
                                <p className="text-xs text-slate-500 mb-1">Total Amount:</p>
                                <p className="text-2xl font-bold text-slate-900 mb-2">
                                  ₱{parseFloat(order.total_amount).toLocaleString()}
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
        {/* Record Offline Sale Modal */}
        {showRecordSaleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in" onClick={() => setShowRecordSaleModal(false)}>
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Record Offline Walk-in Transaction</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Manually log direct payments, pre-orders, and downpayments</p>
                </div>
                <button
                  onClick={() => setShowRecordSaleModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body - Two Column Layout */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Column 1: Selector & Item Inputs (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Step 1: Select Student */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-800">
                        1. Select Student
                      </label>
                      <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => {
                            setStudentType('registered');
                            setSelectedUser(null);
                          }}
                          className={`px-3 py-1.5 rounded-md transition-all ${studentType === 'registered' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Registered Student
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStudentType('walkin');
                            setSelectedUser(null);
                          }}
                          className={`px-3 py-1.5 rounded-md transition-all ${studentType === 'walkin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Unregistered Walk-in
                        </button>
                      </div>
                    </div>

                    {studentType === 'registered' ? (
                      <div>
                        {!selectedUser ? (
                          <div className="relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                              <input
                                type="text"
                                placeholder="Search by student name, ID number or email..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white"
                              />
                            </div>
                            {userSearchQuery.trim() !== '' && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {(() => {
                                  if (isLoadingUsers) {
                                    return (
                                      <div className="px-4 py-3 text-sm text-slate-500 text-center flex items-center justify-center gap-2 bg-white">
                                        <div className="w-4.5 h-4.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        Loading students...
                                      </div>
                                    );
                                  }
                                  const filteredUsers = allUsers.filter((u: any) => {
                                    const query = userSearchQuery.toLowerCase();
                                    return (
                                      u.first_name.toLowerCase().includes(query) ||
                                      (u.last_name || '').toLowerCase().includes(query) ||
                                      (u.email || '').toLowerCase().includes(query) ||
                                      (u.id_number || '').toLowerCase().includes(query)
                                    );
                                  });
                                  return filteredUsers.length > 0 ? (
                                    filteredUsers.map((u: any) => (
                                      <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedUser(u);
                                          setUserSearchQuery('');
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center justify-between transition-colors bg-white"
                                      >
                                        <div>
                                          <p className="font-semibold text-slate-900">{formatFullName(u.first_name, u.last_name)}</p>
                                          <p className="text-xs text-slate-500">{u.email} • ID: {u.id_number || 'N/A'}</p>
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.membership_status === 'approved' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                                          {u.membership_status === 'approved' ? 'Member' : 'Non-Member'}
                                        </span>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-4 py-3 text-sm text-slate-500 text-center bg-white">
                                      No students found
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                                {`${selectedUser.first_name?.[0] || ''}${selectedUser.last_name?.[0] || ''}`.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{formatFullName(selectedUser.first_name, selectedUser.last_name)}</p>
                                <p className="text-xs text-slate-500">{selectedUser.email} • ID: {selectedUser.id_number || 'N/A'}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedUser(null)}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1.5 rounded-md border border-red-200 transition-colors bg-white"
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1 font-semibold">Student Name *</label>
                          <input
                            type="text"
                            placeholder="Enter full name..."
                            value={walkInName}
                            onChange={(e) => setWalkInName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1 font-semibold">ID Number (Optional)</label>
                            <input
                              type="text"
                              placeholder="Enter ID number..."
                              value={walkInIdNumber}
                              onChange={(e) => setWalkInIdNumber(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1 font-semibold">Course (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g. BSMT, BSMARE..."
                              value={walkInCourse}
                              onChange={(e) => setWalkInCourse(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1 font-semibold">Membership Status</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="walkInMembership"
                                value="none"
                                checked={walkInMembership === 'none'}
                                onChange={() => setWalkInMembership('none')}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              Non-Member
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name="walkInMembership"
                                value="approved"
                                checked={walkInMembership === 'approved'}
                                onChange={() => setWalkInMembership('approved')}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              Coop Member
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Add Product Item */}
                  {activeTab === 'insurance' ? (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-3">
                      <label className="block text-sm font-semibold text-purple-900">
                        2. Transaction Item
                      </label>
                      <div className="p-4 bg-white border border-purple-100 rounded-lg flex items-center justify-between shadow-sm">
                        <div>
                          <p className="font-semibold text-slate-900">I-CARD Micro-insurance</p>
                          <p className="text-xs text-slate-500">Fixed rate walk-in insurance coverage</p>
                        </div>
                        <span className="font-bold text-purple-700">₱100.00</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                      <label className="block text-sm font-semibold text-slate-800">
                        2. Add Product Item
                      </label>

                      {/* Product Selection */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1 font-semibold">Select Product</label>
                        <select
                          value={selectedProduct?.id || ''}
                          onChange={(e) => {
                            const p = products.find(prod => prod.id === e.target.value);
                            setSelectedProduct(p || null);
                            setSelectedOptions({});
                            setQuantity(1);
                          }}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map(p => {
                            const isMadeToOrder = ['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(p.name);
                            let stockText = '';
                            if (isMadeToOrder) {
                              stockText = p.allowPreorder !== false 
                                ? ' - Made to Order' 
                                : ' - Unavailable';
                            } else {
                              const hasVariants = p.variants && Object.keys(p.variants).length > 0;
                              const stockVal = hasVariants 
                                ? Object.values(p.variants!).reduce((sum, v) => sum + (v.stock || 0), 0)
                                : p.stock;
                              
                              if (stockVal <= 0) {
                                stockText = p.allowPreorder !== false 
                                  ? ' - Out of Stock (Pre-order available)' 
                                  : ' - Out of Stock (Unavailable)';
                              } else {
                                stockText = ` - Stock: ${stockVal}`;
                              }
                            }
                            return (
                              <option key={p.id} value={p.id}>
                                {p.name} (₱{p.price}){stockText}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {selectedProduct && (
                        <div className="space-y-4 border-t border-slate-200 pt-4 animate-fade-in">
                          {/* Live Stock Status Indicator */}
                          <div className="bg-slate-100 rounded-lg p-2.5 flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-600">Stock Availability:</span>
                            {(() => {
                              const isMadeToOrder = ['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(selectedProduct.name);
                              if (isMadeToOrder) {
                                if (selectedProduct.allowPreorder === false) {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                                      ❌ Unavailable
                                    </span>
                                  );
                                }
                                return (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                    ✓ Made to Order (Always Available)
                                  </span>
                                );
                              }

                              const hasVariants = selectedProduct.variants && Object.keys(selectedProduct.variants).length > 0;
                              if (hasVariants) {
                                const allOptionsSelected = selectedProduct.options?.every((opt: any) => selectedOptions[opt.id]);
                                if (!allOptionsSelected) {
                                  const totalStock = Object.values(selectedProduct.variants!).reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
                                  return (
                                    <span className="text-xs text-slate-500 font-medium">
                                      Select options to verify (Total: {totalStock})
                                    </span>
                                  );
                                }

                                const variantKey = Object.entries(selectedOptions)
                                  .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                                  .map(([key, value]) => `${key}:${value}`)
                                  .join('|');
                                const variant = selectedProduct.variants![variantKey];
                                const variantStock = variant ? variant.stock : 0;

                                if (variantStock <= 0) {
                                  if (selectedProduct.allowPreorder !== false) {
                                    return (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                        ⚠️ Out of Stock (Pre-order Only)
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                        ❌ Out of Stock (Unavailable)
                                      </span>
                                    );
                                  }
                                } else {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                      ✓ In Stock ({variantStock} left)
                                    </span>
                                  );
                                }
                              } else {
                                const stockVal = selectedProduct.stock;
                                if (stockVal <= 0) {
                                  if (selectedProduct.allowPreorder !== false) {
                                    return (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                        ⚠️ Out of Stock (Pre-order Only)
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                        ❌ Out of Stock (Unavailable)
                                      </span>
                                    );
                                  }
                                } else {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                      ✓ In Stock ({stockVal} left)
                                    </span>
                                  );
                                }
                              }
                            })()}
                          </div>

                          {/* Dynamic Product Options */}
                          {selectedProduct.options && selectedProduct.options.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedProduct.options.map((option: any) => (
                                <div key={option.id}>
                                  <label className="block text-xs text-slate-500 mb-1 font-semibold">
                                    {option.label}
                                  </label>
                                  <select
                                    value={selectedOptions[option.id] || ''}
                                    onChange={(e) => setSelectedOptions({
                                      ...selectedOptions,
                                      [option.id]: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                                  >
                                    <option value="">-- Select {option.label} --</option>
                                    {option.choices.map((choice: string) => (
                                      <option key={choice} value={choice}>
                                        {choice}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Order & Payment Types */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1 font-semibold">Order Type</label>
                              <select
                                value={orderType}
                                onChange={(e: any) => setOrderType(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                              >
                                <option value="regular" disabled={(() => {
                                  if (!selectedProduct) return false;
                                  const isMadeToOrder = ['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(selectedProduct.name);
                                  if (isMadeToOrder) return selectedProduct.allowPreorder === false;
                                  
                                  if (selectedProduct.variants && Object.keys(selectedProduct.variants).length > 0) {
                                    const allOptionsSelected = selectedProduct.options?.every((opt: any) => selectedOptions[opt.id]);
                                    if (allOptionsSelected) {
                                      const variantKey = Object.entries(selectedOptions)
                                        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                                        .map(([key, value]) => `${key}:${value}`)
                                        .join('|');
                                      const variant = selectedProduct.variants[variantKey];
                                      return !variant || variant.stock <= 0;
                                    }
                                    return false;
                                  }
                                  return selectedProduct.stock <= 0;
                                })()}>Regular Purchase</option>
                                <option value="preorder">Pre-Order</option>
                              </select>
                            </div>

                            {['Gala', 'Type A & B Uniform', 'BSNAME Uniform'].includes(selectedProduct.name) && (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1 font-semibold">Payment Options</label>
                                <select
                                  value={paymentType}
                                  onChange={(e: any) => setPaymentType(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                                >
                                  <option value="full">Full Payment</option>
                                  <option value="downpayment">Downpayment</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Quantity & Unit Price Override */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1 font-semibold">Quantity</label>
                              <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-slate-500 mb-1 font-semibold">Unit Price (₱)</label>
                              <input
                                type="number"
                                min="0"
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                              />
                            </div>
                          </div>

                          {/* Calculated Subtotal & Add Button */}
                          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                            <div>
                              <p className="text-xs text-slate-500 font-semibold">Subtotal</p>
                              <p className="text-xl font-bold text-slate-900">₱{(quantity * unitPrice).toLocaleString()}</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddManualItem}
                              disabled={(() => {
                                if (!selectedProduct) return true;
                                const isMadeToOrder = ['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(selectedProduct.name);
                                if (isMadeToOrder) return selectedProduct.allowPreorder === false;

                                let isOutOfStock = false;
                                if (selectedProduct.variants && Object.keys(selectedProduct.variants).length > 0) {
                                  const allOptionsSelected = selectedProduct.options?.every((opt: any) => selectedOptions[opt.id]);
                                  if (allOptionsSelected) {
                                    const variantKey = Object.entries(selectedOptions)
                                      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                                      .map(([key, value]) => `${key}:${value}`)
                                      .join('|');
                                    const variant = selectedProduct.variants[variantKey];
                                    isOutOfStock = !variant || variant.stock <= 0;
                                  } else {
                                    return false;
                                  }
                                } else {
                                  isOutOfStock = selectedProduct.stock <= 0;
                                }

                                return isOutOfStock && selectedProduct.allowPreorder === false;
                              })()}
                              className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm text-sm"
                            >
                              Add to Transaction
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Column 2: Manual Cart & Transaction metadata (5 cols) */}
                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-8 space-y-6">
                  
                  {/* Cart Items List */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center justify-between">
                      <span>Transaction Cart</span>
                      <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {manualItems.length} items
                      </span>
                    </h4>
                    
                    {manualItems.length === 0 ? (
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                        <Package size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">No items added to this transaction yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                        {manualItems.map(item => (
                          <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3 shadow-xs">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 text-xs truncate">
                                {item.productName}
                              </p>
                              {/* Display Option Subtitle */}
                              {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                <p className="text-[10px] text-slate-500 truncate font-medium">
                                  {Object.entries(item.selectedOptions).map(([k, v]: any) => `${k}: ${v}`).join(', ')}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-600 mt-0.5 font-medium">
                                {item.quantity} × ₱{item.unitPrice.toLocaleString()} 
                                {item.paymentType && (
                                  <span className="ml-1.5 px-1 bg-amber-100 text-amber-800 rounded font-bold text-[9px]">
                                    {item.paymentType.toUpperCase()}
                                  </span>
                                )}
                                {item.orderType === 'preorder' && (
                                  <span className="ml-1.5 px-1 bg-blue-100 text-blue-800 rounded font-bold text-[9px]">
                                    PRE-ORDER
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-900">
                                ₱{item.subtotal.toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveManualItem(item.id)}
                                className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Transaction Metadata Forms */}
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    
                    {/* Custom Receipt Number */}
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 font-semibold">Receipt Number</label>
                      <input
                        type="text"
                        placeholder="Receipt / Order Number"
                        value={receiptNo}
                        onChange={(e) => setReceiptNo(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold bg-white text-slate-900"
                      />
                    </div>

                    {/* Transaction Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1 font-semibold">Date</label>
                        <input
                          type="date"
                          value={transactionDate}
                          onChange={(e) => setTransactionDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1 font-semibold">Time</label>
                        <input
                          type="time"
                          value={transactionTime}
                          onChange={(e) => setTransactionTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                        />
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 font-semibold">Payment Method</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cash')}
                          className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                            paymentMethod === 'cash'
                              ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('ewallet')}
                          className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                            paymentMethod === 'ewallet'
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          GCash
                        </button>
                      </div>
                    </div>

                    {paymentMethod === 'ewallet' && (
                      <div className="animate-fade-in">
                        <label className="block text-xs text-slate-500 mb-1 font-semibold">Last 4 Digits of GCash Reference Number</label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Enter last 4 digits"
                          value={referenceNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 4) {
                              setReferenceNumber(val);
                            }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white font-mono tracking-widest text-center text-lg"
                        />
                      </div>
                    )}

                    {/* Order Fulfillment/DB Status */}
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 font-semibold">Fulfillment Status</label>
                      <select
                        value={orderStatus}
                        onChange={(e: any) => setOrderStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white font-bold"
                      >
                        <option value="completed">Completed (Paid)</option>
                        <option value="released">Released (Picked Up)</option>
                        <option value="pending">Pending Approval</option>
                      </select>
                    </div>

                    {/* Summary Totals & Submit */}
                    <div className="pt-4 border-t border-slate-200 space-y-4 bg-slate-50 rounded-xl p-4">
                      {(() => {
                        const subtotal = manualItems.reduce((sum, item) => sum + item.subtotal, 0);
                        const fee = paymentMethod === 'ewallet' ? calculateEWalletFee(subtotal) : 0;
                        const total = subtotal + fee;
                        return (
                          <>
                            {paymentMethod === 'ewallet' && (
                              <>
                                <div className="flex justify-between items-center text-xs text-slate-600">
                                  <span>Subtotal</span>
                                  <span>₱{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-600">
                                  <span>Service Fee (GCash)</span>
                                  <span>₱{fee.toLocaleString()}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-semibold text-slate-600">Total Bill</span>
                              <span className="text-xl font-bold text-slate-900">
                                ₱{total.toLocaleString()}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                      
                      <button
                        type="button"
                        disabled={
                          isSavingManualOrder || 
                          manualItems.length === 0 || 
                          (studentType === 'registered' ? !selectedUser : !walkInName.trim())
                        }
                        onClick={handleSaveManualOrder}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isSavingManualOrder ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving Transaction...
                          </>
                        ) : (
                          'Save Offline Transaction'
                        )}
                      </button>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
