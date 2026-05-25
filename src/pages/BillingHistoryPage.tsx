import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, CheckCircle, Clock, Eye, Download, X, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../store/authContext';
import { AppDataSync } from '../store/appDataSync';
// @ts-ignore - dom-to-image doesn't have TypeScript definitions
import domtoimage from 'dom-to-image';
import { Z_INDEX } from '../constants/zIndex';
import { formatProductName, parseAndFormatLegacyProductName } from '../utils/productNameFormatter';
import { COOP_LOGO_URL, GCASH_URL } from '../constants/cloudinaryAssets';

export const BillingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { sales } = useAppStore();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled' | 'balance-due'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showReceiptActions, setShowReceiptActions] = useState<boolean>(true);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Balance payment modal state
  const [showBalancePaymentModal, setShowBalancePaymentModal] = useState(false);
  const [balanceTransaction, setBalanceTransaction] = useState<any>(null);
  const [balancePaymentMethod, setBalancePaymentMethod] = useState<'cash' | 'ewallet' | null>(null);
  const [balanceReferenceNumber, setBalanceReferenceNumber] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [confirmedNoRefund, setConfirmedNoRefund] = useState(false);

  // Calculate GCash fee based on amount ranges (same as CartPage)
  const calculateEWalletFee = (amount: number): number => {
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

  // Load orders from API on mount
  useEffect(() => {
    if (user?.id) {
      AppDataSync.loadOrdersFromAPI(user.id);
    }
  }, [user?.id]);

  // Toast notification auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Download receipt directly from transaction list
  const downloadReceiptDirectly = async (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowReceiptActions(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    setTimeout(() => {
      downloadReceiptAsImage();
    }, 0);
  };

  const downloadReceiptAsImage = async () => {
    if (!receiptRef.current || !selectedTransaction) return;

    try {
      const contentArea = receiptRef.current.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
      const footerWithButtons = receiptRef.current.querySelector('.border-t-2.border-slate-300') as HTMLElement;
      
      const originalMaxHeight = receiptRef.current.style.maxHeight;
      const originalOverflow = receiptRef.current.style.overflow;
      const originalContentDisplay = contentArea?.style.overflow;
      const originalContentHeight = contentArea?.style.height;
      const originalFooterDisplay = footerWithButtons?.style.display;

      if (footerWithButtons) {
        footerWithButtons.style.display = 'none';
      }
      
      const closeButton = receiptRef.current.querySelector('button[aria-label="Close modal"]') as HTMLElement;
      const originalCloseButtonDisplay = closeButton?.style.display;
      if (closeButton) {
        closeButton.style.display = 'none';
      }

      if (contentArea) {
        const scrollHeight = contentArea.scrollHeight;
        contentArea.style.overflow = 'visible';
        contentArea.style.height = `${scrollHeight}px`;
      }
      receiptRef.current.style.maxHeight = 'none';
      receiptRef.current.style.overflow = 'visible';

      await new Promise(resolve => setTimeout(resolve, 300));

      const scale = 4;
      const dataUrl = await domtoimage.toPng(receiptRef.current, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: receiptRef.current.offsetWidth * scale,
        height: receiptRef.current.offsetHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: receiptRef.current.offsetWidth + 'px',
          height: receiptRef.current.offsetHeight + 'px',
        },
      });

      receiptRef.current.style.maxHeight = originalMaxHeight;
      receiptRef.current.style.overflow = originalOverflow;
      if (contentArea) {
        contentArea.style.overflow = originalContentDisplay || '';
        contentArea.style.height = originalContentHeight || '';
      }
      if (footerWithButtons) {
        footerWithButtons.style.display = originalFooterDisplay || '';
      }
      if (closeButton) {
        closeButton.style.display = originalCloseButtonDisplay || '';
      }

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `receipt-${selectedTransaction?.receiptNumber || 'download'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowReceiptActions(false);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  // Helper function to format product name with variants
  const formatProductNameWithVariants = (item: any): string => {
    // Get the full product name from database
    let fullName = item?.productName || item?.product_name || 'Unknown Product';
    
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
    if (item?.selectedOptions) {
      try {
        if (typeof item.selectedOptions === 'string') {
          options = JSON.parse(item.selectedOptions);
        } else if (typeof item.selectedOptions === 'object' && item.selectedOptions !== null) {
          options = item.selectedOptions;
        }
      } catch (e) {
        console.warn('Failed to parse selectedOptions:', item.selectedOptions);
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

  // Transform sales to transaction format
  const transactions = sales.map(sale => ({
    id: sale?.id,
    date: sale?.created_at || sale?.createdAt,
    description: sale?.order_type === 'insurance' ? 'I-CARD Insurance' : 'UC METC Merchandise Purchase',
    items: (sale?.items || []).map((item: any) => ({
      id: item?.id,
      product_id: item?.productId || item?.product_id,
      productName: formatProductNameWithVariants(item),
      quantity: item?.quantity || 0,
      unitPrice: item?.unitPrice || item?.unit_price || 0,
      subtotal: item?.subtotal || 0,
      selectedOptions: item?.selectedOptions || item?.selected_options || {},
      paymentType: item?.paymentType || item?.payment_type,
      orderType: item?.orderType || item?.order_type,
      fullPrice: item?.fullPrice || item?.full_price,
    })),
    amount: sale?.total_amount || sale?.totalAmount || 0,
    status: (sale?.status || 'pending') as 'completed' | 'pending' | 'cancelled',
    receiptNumber: sale?.receipt_no || sale?.receiptNo || 'N/A',
    paymentMethod: ((sale?.payment_method || sale?.paymentMethod) === 'cash') ? 'Cash' : 'GCash',
  }));

  const filteredTransactions = filterStatus === 'all'
    ? transactions
    : filterStatus === 'balance-due'
    ? transactions.filter(t => {
        // Exclude balance payment orders (they're the payment itself, not the original order)
        if (t.receiptNumber && t.receiptNumber.startsWith('BAL-')) return false;
        
        // Show completed orders that have downpayment items with remaining balance
        if (t.status !== 'completed') return false;
        
        const hasDownpaymentItems = t.items.some((item: any) => {
          const paymentType = item.paymentType || item.payment_type;
          if (paymentType === 'downpayment') return true;
          
          // For legacy orders, check if it's a downpayment based on price
          const productName = item.productName || item.product_name || '';
          const subtotal = parseFloat(item.subtotal || 0);
          
          if (productName.includes('Gala') && subtotal === 500) return true;
          if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return true;
          
          return false;
        });
        
        if (!hasDownpaymentItems) return false;
        
        // Check if there's a pending OR completed balance payment for this order
        // Look for orders with BAL- receipt that have the same items
        const hasBalancePayment = transactions.some(balanceOrder => {
          if (!balanceOrder.receiptNumber || !balanceOrder.receiptNumber.startsWith('BAL-')) return false;
          // Check for both pending and completed balance payments
          if (balanceOrder.status !== 'pending' && balanceOrder.status !== 'completed') return false;
          
          // Check if this balance order is for the same downpayment items
          // We can check if the items match by comparing product names
          return balanceOrder.items.some((balItem: any) => 
            t.items.some((origItem: any) => {
              const balProductName = balItem.productName || balItem.product_name || '';
              const origProductName = origItem.productName || origItem.product_name || '';
              return balProductName.includes(origProductName.split('(')[0].trim()) || 
                     origProductName.includes(balProductName.split('(')[0].trim());
            })
          );
        });
        
        // Only show if there's NO balance payment (pending or completed)
        return !hasBalancePayment;
      })
    : transactions.filter(t => t.status === filterStatus);

  const statusConfig = {
    completed: { color: 'bg-green-100', textColor: 'text-green-800', icon: CheckCircle, label: 'Paid' },
    pending: { color: 'bg-yellow-100', textColor: 'text-yellow-800', icon: Clock, label: 'Pending' },
    cancelled: { color: 'bg-red-100', textColor: 'text-red-800', icon: Clock, label: 'Cancelled' },
    'balance-due': { color: 'bg-orange-100', textColor: 'text-orange-800', icon: Clock, label: 'Balance Due' },
  };

  // Calculate stats from actual transaction data
  const stats = {
    totalPaid: Math.round(transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)),
    totalPending: Math.round(transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)),
    paidCount: transactions.filter(t => t.status === 'completed').length,
    pendingCount: transactions.filter(t => t.status === 'pending').length,
    totalBalanceDue: Math.round(transactions
      .filter(t => {
        // Only completed orders with downpayment items
        if (t.status !== 'completed') return false;
        if (t.receiptNumber && t.receiptNumber.startsWith('BAL-')) return false;
        
        return t.items.some((item: any) => {
          const paymentType = item.paymentType || item.payment_type;
          if (paymentType === 'downpayment') return true;
          
          const productName = item.productName || item.product_name || '';
          const subtotal = parseFloat(item.subtotal || 0);
          
          if (productName.includes('Gala') && subtotal === 500) return true;
          if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return true;
          
          return false;
        });
      })
      .reduce((sum, t) => {
        // Calculate total balance for each order
        const orderBalance = t.items.reduce((itemSum: number, item: any) => {
          const paymentType = item.paymentType || item.payment_type;
          const paidAmount = parseFloat(item.subtotal || 0);
          
          // Only calculate balance for downpayment items
          if (paymentType !== 'downpayment') {
            const productName = item.productName || item.product_name || '';
            const subtotal = parseFloat(item.subtotal || 0);
            
            if (!(productName.includes('Gala') && subtotal === 500) &&
                !((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500)) {
              return itemSum;
            }
          }
          
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
          
          const balance = (fullPrice || 0) - paidAmount;
          return itemSum + (balance * item.quantity);
        }, 0);
        
        return sum + orderBalance;
      }, 0)),
    balanceDueCount: transactions.filter(t => {
      if (t.status !== 'completed') return false;
      if (t.receiptNumber && t.receiptNumber.startsWith('BAL-')) return false;
      
      return t.items.some((item: any) => {
        const paymentType = item.paymentType || item.payment_type;
        if (paymentType === 'downpayment') return true;
        
        const productName = item.productName || item.product_name || '';
        const subtotal = parseFloat(item.subtotal || 0);
        
        if (productName.includes('Gala') && subtotal === 500) return true;
        if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return true;
        
        return false;
      });
    }).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 py-8 px-4 animate-slide-in-right">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={24} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">BILLING HISTORY</h1>
            <p className="text-slate-700">As a valued cooperative member, you enjoy exclusive access to detailed billing history and transparent payment tracking.</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-2">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">₱{stats.totalPaid.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.paidCount} payments
                </p>
              </div>
              <CheckCircle size={32} className="text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-2">Pending Payment</p>
                <p className="text-3xl font-bold text-purple-600">₱{stats.totalPending.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.pendingCount} pending
                </p>
              </div>
              <Clock size={32} className="text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm mb-2">Balance Due</p>
                <p className="text-3xl font-bold text-orange-600">₱{stats.totalBalanceDue.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.balanceDueCount} orders
                </p>
              </div>
              <Clock size={32} className="text-orange-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filter Billing Records</h2>
          <div className="flex flex-wrap gap-3">
            {['all', 'completed', 'pending', 'cancelled', 'balance-due'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'All' : status === 'completed' ? 'Completed' : status === 'balance-due' ? 'Balance Due' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List - Same format as TransactionPage */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-slate-600 text-lg">No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const status = transaction.status as 'completed' | 'pending' | 'cancelled';
              const config = statusConfig[status] || statusConfig.pending; // Fallback to pending if status not found
              const StatusIcon = config.icon;
              
              return (
                <div
                  key={transaction.id}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className={`p-3 rounded-lg ${config.color}`}>
                            <StatusIcon className={`${config.textColor}`} size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {transaction.description}
                              </h3>
                              {/* Balance Payment Badge */}
                              {transaction.receiptNumber && transaction.receiptNumber.startsWith('BAL-') && (
                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">
                                  BALANCE
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">
                              {transaction.date ? new Date(transaction.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }) : 'N/A'} • Receipt: {transaction.receiptNumber}
                            </p>
                          </div>
                        </div>

                        {/* Items List with Details */}
                        <div className="ml-16 space-y-2 mb-3">
                          {transaction.items.map((item: any, idx: number) => {
                            // Calculate balance for downpayment items
                            const isDownpayment = item.paymentType === 'downpayment' || 
                              (item.productName?.includes('Gala') && item.subtotal === 500) ||
                              ((item.productName?.includes('Type A & B Uniform') || item.productName?.includes('BSNAME Uniform')) && item.subtotal === 1500);
                            
                            let balance = 0;
                            if (isDownpayment && filterStatus === 'balance-due') {
                              const paidAmount = parseFloat(item.subtotal || 0);
                              let fullPrice = item.fullPrice || item.full_price;
                              
                              if (!fullPrice) {
                                const productName = item.productName || '';
                                if (productName.includes('Gala')) {
                                  const isMember = productName.includes('Member');
                                  fullPrice = isMember ? 1150 : 1200;
                                } else if (productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) {
                                  fullPrice = 3000;
                                }
                              }
                              
                              balance = (fullPrice || 0) - paidAmount;
                            }
                            
                            return (
                              <div key={idx} className="text-sm text-slate-600">
                                <div className="flex items-start gap-2 flex-wrap">
                                  <p className="font-medium">• {formatProductNameWithVariants(item)} (Qty: {item.quantity})</p>
                                  {item.paymentType === 'downpayment' && (
                                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">DOWNPAYMENT</span>
                                  )}
                                  {item.orderType === 'preorder' && (
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">PRE-ORDER</span>
                                  )}
                                </div>
                                {filterStatus === 'balance-due' && isDownpayment ? (
                                  <p className="text-xs text-slate-500 ml-4">
                                    Paid: ₱{Number(item.subtotal || 0).toLocaleString()} | Balance: <span className="font-semibold text-orange-600">₱{(balance * item.quantity).toLocaleString()}</span>
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-500 ml-4">
                                    ₱{Number(item.unitPrice || 0).toLocaleString()} × {item.quantity} = ₱{Number(item.subtotal || 0).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Payment Method */}
                        <div className="ml-16">
                          <p className="text-xs text-slate-500">
                            Payment Method: <span className="font-medium">{transaction.paymentMethod}</span>
                          </p>
                        </div>
                      </div>

                      {/* Amount and Actions */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900 mb-4">
                          ₱{filterStatus === 'balance-due' ? 
                            // Calculate total balance for balance-due view
                            transaction.items.reduce((sum: number, item: any) => {
                              const isDownpayment = item.paymentType === 'downpayment' || 
                                (item.productName?.includes('Gala') && item.subtotal === 500) ||
                                ((item.productName?.includes('Type A & B Uniform') || item.productName?.includes('BSNAME Uniform')) && item.subtotal === 1500);
                              
                              if (!isDownpayment) return sum;
                              
                              const paidAmount = parseFloat(item.subtotal || 0);
                              let fullPrice = item.fullPrice || item.full_price;
                              
                              if (!fullPrice) {
                                const productName = item.productName || '';
                                if (productName.includes('Gala')) {
                                  const isMember = productName.includes('Member');
                                  fullPrice = isMember ? 1150 : 1200;
                                } else if (productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) {
                                  fullPrice = 3000;
                                }
                              }
                              
                              const balance = (fullPrice || 0) - paidAmount;
                              return sum + (balance * item.quantity);
                            }, 0).toLocaleString()
                            : Number(transaction.amount || 0).toLocaleString()
                          }
                        </p>
                        <div className="flex space-x-2">
                          {status === 'completed' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowReceiptActions(true);
                                }}
                                className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                title="View Receipt"
                              >
                                <Eye size={20} />
                              </button>
                              {filterStatus !== 'balance-due' && (
                                <button
                                  onClick={() => downloadReceiptDirectly(transaction)}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Download Receipt"
                                >
                                  <Download size={20} />
                                </button>
                              )}
                              {filterStatus === 'balance-due' && (
                                <button
                                  onClick={() => {
                                    setBalanceTransaction(transaction);
                                    setShowBalancePaymentModal(true);
                                    setBalancePaymentMethod(null);
                                    setBalanceReferenceNumber('');
                                    setShowQRCode(false);
                                    setConfirmedNoRefund(false);
                                  }}
                                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                                  title="Pay Remaining Balance"
                                >
                                  Pay Balance
                                </button>
                              )}
                            </>
                          )}
                          {status === 'pending' && (
                            <button
                              onClick={() => setConfirmingOrderId(transaction.id)}
                              className="px-3 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                              title="Cancel Order"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-end">
                      <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${config.color} ${config.textColor}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Receipt Modal Portal - Same as TransactionPage */}
      {selectedTransaction && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTransaction(null)}
          style={{ zIndex: Z_INDEX.GENERAL_MODAL }}
        >
          <div 
            ref={receiptRef} 
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scale-in flex flex-col max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTransaction(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-all duration-200 hover:scale-110"
              aria-label="Close modal"
            >
              <X size={20} className="text-slate-700" />
            </button>

            {/* Receipt Header */}
            <div className="text-center mb-4 pb-4 border-b-2 border-slate-300">
              <div className="flex items-center justify-center mb-3">
                <img src={COOP_LOGO_URL} alt="UC METC SILMS" className="h-12 w-12 object-contain mr-3" />
                <div className="text-left">
                  <div className="text-lg font-bold text-purple-600 whitespace-nowrap" style={{ lineHeight: '1.3', marginBottom: '2px' }}>UC METC</div>
                  <div className="text-xs font-semibold text-slate-700 whitespace-nowrap" style={{ lineHeight: '1.3' }}>SILMS</div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">RECEIPT</h2>
              <p className="text-xs text-slate-600 break-all px-4">{selectedTransaction.receiptNumber}</p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-3 mb-4 flex-1 overflow-y-auto pr-2">
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide">Transaction Date</p>
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(selectedTransaction.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide">Recipient</p>
                <p className="text-sm font-semibold text-slate-900">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name}${user.middle_name ? ` ${user.middle_name}` : ''} ${user.last_name}` 
                    : user?.email || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Items Purchased</p>
                <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
                  {selectedTransaction.items.map((item: any, idx: number) => (
                    <div key={idx} className="border-b last:border-b-0 pb-2 last:pb-0">
                      <div className="flex justify-between items-start text-sm mb-2 gap-2">
                        <span className="font-medium text-slate-900 flex-1">{formatProductNameWithVariants(item)}</span>
                        <span className="font-semibold text-slate-900 flex-shrink-0">₱{Number(item.subtotal || 0).toLocaleString()}</span>
                      </div>
                      {(item.paymentType === 'downpayment' || item.orderType === 'preorder' || selectedTransaction.receiptNumber?.startsWith('BAL-')) && (
                        <div className="flex items-center gap-2 mb-1">
                          {item.paymentType === 'downpayment' && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">DOWNPAYMENT</span>
                          )}
                          {item.orderType === 'preorder' && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">PRE-ORDER</span>
                          )}
                          {selectedTransaction.receiptNumber?.startsWith('BAL-') && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">BALANCE</span>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>Quantity: {item.quantity}</div>
                        <div className="text-right">Unit Price: ₱{Number(item.unitPrice || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">Subtotal</span>
                  <span className="font-medium">₱{Number(selectedTransaction?.amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between text-base font-bold bg-purple-100 p-2 rounded-lg">
                <span>Total</span>
                <span className="text-purple-600">₱{Number(selectedTransaction?.amount || 0).toLocaleString()}</span>
              </div>

              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide">Payment Method</p>
                <p className="text-slate-900 font-medium text-sm">{selectedTransaction?.paymentMethod}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide">Status</p>
                <p className="font-medium text-sm text-green-600">Paid</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-slate-300 pt-4 text-center mt-auto">
              <p className="text-xs text-slate-600 mb-3">
                Thank you for your purchase! Keep this receipt for your records.
              </p>
              
              <div className="flex space-x-2">
                {showReceiptActions && (
                  <>
                    <button
                      onClick={() => setSelectedTransaction(null)}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all text-sm"
                    >
                      Close
                    </button>
                    <button
                      onClick={downloadReceiptAsImage}
                      className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all flex items-center justify-center space-x-1 text-sm"
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </button>
                  </>
                )}
                {!showReceiptActions && (
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all text-sm"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Cancel Order Confirmation Modal */}
      {confirmingOrderId && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmingOrderId(null)}
          style={{ zIndex: Z_INDEX.GENERAL_MODAL + 1 }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Order?</h3>
            </div>
            
            <p className="text-slate-600 mb-6">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmingOrderId(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-colors"
              >
                No, Keep Order
              </button>
              <button
                onClick={async () => {
                  if (!user?.id) return;
                  try {
                    await AppDataSync.cancelOrderForUser(confirmingOrderId, user.id);
                    await AppDataSync.loadOrdersFromAPI(user.id);
                    setConfirmingOrderId(null);
                    setToast({ message: 'Order cancelled successfully!', type: 'success' });
                  } catch (err: any) {
                    console.error('Failed to cancel order:', err);
                    setToast({ message: 'Failed to cancel order. Please try again.', type: 'error' });
                  }
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {/* Balance Payment Modal - Same structure as TransactionPage */}
      {showBalancePaymentModal && balanceTransaction && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: Z_INDEX.CHECKOUT_MODAL }}
          onClick={() => {
            setShowBalancePaymentModal(false);
            setBalancePaymentMethod(null);
            setBalanceReferenceNumber('');
            setShowQRCode(false);
            setConfirmedNoRefund(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              // Calculate balance due
              const downpaymentItems = balanceTransaction.items?.filter((item: any) => {
                const paymentType = item.paymentType || item.payment_type;
                if (paymentType === 'downpayment') return true;
                
                const productName = item.productName || item.product_name || '';
                const subtotal = parseFloat(item.subtotal || 0);
                
                if (productName.includes('Gala') && subtotal === 500) return true;
                if ((productName.includes('Type A & B Uniform') || productName.includes('BSNAME Uniform')) && subtotal === 1500) return true;
                
                return false;
              }) || [];
              
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

              const ewalletFee = calculateEWalletFee(totalBalance);
              const totalWithFee = balancePaymentMethod === 'ewallet' ? totalBalance + ewalletFee : totalBalance;

              return (
                <>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Pay Balance</h2>

                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800 mb-2">
                      You have a remaining balance of <span className="font-bold">₱{totalBalance.toLocaleString()}</span> for your downpayment order.
                    </p>
                    <p className="text-sm text-blue-800">
                      Complete your payment to receive your items.
                    </p>
                  </div>

                  {/* Items with Balance */}
                  <div className="bg-orange-50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Items & Balance Due</h3>
                    <div className="space-y-2 mb-4">
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
                          <div key={idx} className="bg-white rounded p-3">
                            <p className="text-sm font-medium text-slate-900 mb-1">
                              {formatProductNameWithVariants(item)} (Qty: {item.quantity})
                            </p>
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>Already Paid: ₱{paidAmount.toLocaleString()}</span>
                              <span className="font-semibold text-orange-600">
                                Balance: ₱{(balance * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-3 border-t border-orange-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-900">Total Balance:</span>
                        <span className="text-xl font-bold text-orange-600">
                          ₱{totalBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Select Payment Method</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Cash Option */}
                      <button
                        onClick={() => {
                          setBalancePaymentMethod('cash');
                          setBalanceReferenceNumber('');
                          setShowQRCode(false);
                          setConfirmedNoRefund(false);
                        }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          balancePaymentMethod === 'cash'
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 text-lg">Cash</div>
                        <div className="text-xs text-slate-600 mt-1">Pay at Coop office</div>
                      </button>

                      {/* GCash Option */}
                      <button
                        onClick={() => {
                          setBalancePaymentMethod('ewallet');
                          setShowQRCode(false);
                          setConfirmedNoRefund(false);
                        }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          balancePaymentMethod === 'ewallet'
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 text-lg">GCash</div>
                        <div className="text-xs text-slate-600 mt-1">Pay via GCash</div>
                      </button>
                    </div>
                  </div>

                  {/* GCash Fee Notice and Confirmation */}
                  {balancePaymentMethod === 'ewallet' && !showQRCode && (
                    <div className="mb-6">
                      <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
                        <h3 className="text-sm font-bold text-amber-900 mb-2">⚠️ IMPORTANT: No Refund Policy</h3>
                        <p className="text-sm text-amber-800 mb-2">
                          GCash payments are <span className="font-bold">NON-REFUNDABLE</span> once completed.
                        </p>
                        <p className="text-sm text-amber-800 mb-3">
                          Service fee: <span className="font-bold">₱{ewalletFee.toFixed(2)}</span>
                        </p>
                        <p className="text-sm text-amber-800 font-semibold">
                          Total amount to pay: <span className="text-lg">₱{totalWithFee.toFixed(2)}</span>
                        </p>
                      </div>

                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmedNoRefund}
                          onChange={(e) => setConfirmedNoRefund(e.target.checked)}
                          className="mt-1 w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-700">
                          I understand and agree that GCash payments are non-refundable once completed.
                        </span>
                      </label>

                      {confirmedNoRefund && (
                        <button
                          onClick={() => setShowQRCode(true)}
                          className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
                        >
                          Show Payment QR Code
                        </button>
                      )}
                    </div>
                  )}

                  {/* QR Code Display */}
                  {balancePaymentMethod === 'ewallet' && showQRCode && (
                    <div className="mb-6 animate-fade-in-up">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-300 rounded-lg p-6 text-center">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Scan QR Code to Pay</h3>
                        
                        <div className="bg-white p-4 rounded-lg inline-block mb-4">
                          <img 
                            src={GCASH_URL} 
                            alt="GCash QR Code" 
                            className="w-64 h-auto object-cover rounded-lg"
                            style={{
                              objectPosition: 'center 15%',
                              maxHeight: '400px'
                            }}
                          />
                        </div>

                        <div className="text-left bg-white rounded-lg p-4 mb-4">
                          <p className="text-sm text-slate-700 mb-2">
                            <span className="font-semibold">Account Name:</span> Michelle Pable
                          </p>
                          <p className="text-sm text-slate-700 mb-2">
                            <span className="font-semibold">GCash Number:</span> 09498664041
                          </p>
                          <p className="text-sm text-slate-700 mb-2">
                            <span className="font-semibold">Amount to Pay:</span> <span className="text-lg font-bold text-purple-600">₱{totalWithFee.toFixed(2)}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            (Balance: ₱{totalBalance.toFixed(2)} + Service Fee: ₱{ewalletFee.toFixed(2)})
                          </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
                          <p className="text-xs text-yellow-800 font-semibold">
                            📝 After payment, enter the last 4 digits of your reference number below
                          </p>
                        </div>
                      </div>

                      {/* Reference Number Input */}
                      <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-900 mb-2">
                          Last 4 Digits of Reference Number <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={balanceReferenceNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 4) {
                              setBalanceReferenceNumber(value);
                            }
                          }}
                          placeholder="Enter last 4 digits"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl font-bold tracking-widest"
                          maxLength={4}
                          required
                        />
                        <p className="text-xs text-slate-600 mt-1 text-center">
                          Enter the last 4 digits from your GCash transaction receipt
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-slate-700 text-sm">Complete your balance payment</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-slate-700 text-sm">Collect your items at the office</span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowBalancePaymentModal(false);
                        setBalancePaymentMethod(null);
                        setBalanceReferenceNumber('');
                        setShowQRCode(false);
                        setConfirmedNoRefund(false);
                      }}
                      className="flex-1 px-4 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all duration-200 hover:scale-105"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!balancePaymentMethod) {
                          setToast({ message: 'Please select a payment method', type: 'error' });
                          return;
                        }
                        
                        if (balancePaymentMethod === 'ewallet' && balanceReferenceNumber.length !== 4) {
                          setToast({ message: 'Please enter the last 4 digits of your reference number', type: 'error' });
                          return;
                        }
                        
                        try {
                          // Generate receipt number
                          const receiptNo = `BAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                          
                          // Create balance payment order
                          const balanceOrderData = {
                            receiptNo: receiptNo,
                            totalAmount: totalWithFee,
                            paymentMethod: balancePaymentMethod,
                            referenceNumber: balancePaymentMethod === 'ewallet' ? balanceReferenceNumber : null,
                            items: downpaymentItems.map((item: any) => {
                              const paidAmount = parseFloat(item.subtotal || 0);
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
                              
                              const balance = (fullPrice || 0) - paidAmount;
                              
                              return {
                                productId: item.product_id,
                                productName: item.productName || item.product_name,
                                quantity: item.quantity,
                                unitPrice: balance,
                                subtotal: balance * item.quantity,
                                selectedOptions: item.selectedOptions || item.selected_options,
                                paymentType: 'full',
                                orderType: item.orderType || item.order_type,
                                fullPrice: fullPrice
                              };
                            })
                          };

                          if (!user?.id) {
                            setToast({ message: 'User not found. Please log in again.', type: 'error' });
                            return;
                          }
                          
                          await AppDataSync.createOrderFromBalancePayment(balanceOrderData, user.id);
                          setToast({ message: 'Balance payment successful!', type: 'success' });
                          setShowBalancePaymentModal(false);
                          setBalancePaymentMethod(null);
                          setBalanceReferenceNumber('');
                          setShowQRCode(false);
                          setConfirmedNoRefund(false);
                          
                          // Reload transactions
                          if (user?.id) {
                            AppDataSync.loadOrdersFromAPI(user.id);
                          }
                        } catch (err) {
                          console.error('Failed to process balance payment:', err);
                          setToast({ message: 'Failed to process payment. Please try again.', type: 'error' });
                        }
                      }}
                      disabled={
                        !balancePaymentMethod ||
                        (balancePaymentMethod === 'ewallet' && balanceReferenceNumber.length !== 4)
                      }
                      className="flex-1 px-4 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all duration-200 hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {toast && createPortal(
        <div 
          className="fixed top-4 right-4 z-50 animate-slide-in-right"
          style={{ zIndex: Z_INDEX.GENERAL_MODAL + 2 }}
        >
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white font-medium`}>
            {toast.message}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
