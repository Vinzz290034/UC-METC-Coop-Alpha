import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Download, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../store/authContext';
import { AppDataSync } from '../store/appDataSync';
import { Toast } from '../components/Toast';
import html2canvas from 'html2canvas';
// @ts-ignore
import coopLogo from '../assets/Coop.jpeg';

export const TransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const { sales } = useAppStore();
  const { user } = useAuth();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showReceiptActions, setShowReceiptActions] = useState<boolean>(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Download receipt directly from transaction list
  const downloadReceiptDirectly = async (transaction: any) => {
    // Set the transaction first so the modal renders
    setSelectedTransaction(transaction);
    setShowReceiptActions(true);
    
    // Wait for the modal to render with the receipt
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Then trigger the download function which will hide buttons and capture
    setTimeout(() => {
      downloadReceiptAsImage();
    }, 0);
  };
  const downloadReceiptAsImage = async () => {
    if (!receiptRef.current || !selectedTransaction) return;

    try {
      // Find the scrollable content area and footer with buttons
      const contentArea = receiptRef.current.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
      const footerWithButtons = receiptRef.current.querySelector('.border-t-2.border-slate-300') as HTMLElement;
      
      // Store original styles
      const originalMaxHeight = receiptRef.current.style.maxHeight;
      const originalOverflow = receiptRef.current.style.overflow;
      const originalContentDisplay = contentArea?.style.overflow;
      const originalContentHeight = contentArea?.style.height;
      const originalParentBackground = receiptRef.current.parentElement?.style.background;
      const originalFooterDisplay = footerWithButtons?.style.display;

      // Hide the footer with buttons for cleaner receipt image
      if (footerWithButtons) {
        footerWithButtons.style.display = 'none';
      }

      // Ensure solid white background for better clarity
      if (receiptRef.current.parentElement) {
        receiptRef.current.parentElement.style.background = '#ffffff';
      }

      // Temporarily expand the receipt to show all content
      if (contentArea) {
        const scrollHeight = contentArea.scrollHeight;
        contentArea.style.overflow = 'visible';
        contentArea.style.height = `${scrollHeight}px`;
      }
      receiptRef.current.style.maxHeight = 'none';
      receiptRef.current.style.overflow = 'visible';

      // Wait a moment for the layout to update
      await new Promise(resolve => setTimeout(resolve, 150));

      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        allowTaint: false,
        useCORS: true,
        logging: false,
        removeContainer: true,
        width: receiptRef.current.offsetWidth,
        height: receiptRef.current.offsetHeight,
      });

      // Restore original styles
      receiptRef.current.style.maxHeight = originalMaxHeight;
      receiptRef.current.style.overflow = originalOverflow;
      if (contentArea) {
        contentArea.style.overflow = originalContentDisplay || '';
        contentArea.style.height = originalContentHeight || '';
      }
      if (receiptRef.current.parentElement && originalParentBackground !== undefined) {
        receiptRef.current.parentElement.style.background = originalParentBackground;
      }
      if (footerWithButtons) {
        footerWithButtons.style.display = originalFooterDisplay || '';
      }

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `receipt-${selectedTransaction?.receiptNumber || 'download'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Hide action buttons after download - show receipt better
      setShowReceiptActions(false);

      setToast({ message: 'Receipt downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      setToast({ message: 'Failed to download receipt', type: 'error' });
    }
  };

  // Load orders from API on mount
  useEffect(() => {
    if (user?.id) {
      AppDataSync.loadOrdersFromAPI(user.id);
    }
  }, [user?.id]);

  // Transform sales to transaction format with detailed item information
  const transactions = sales.map(sale => ({
    id: sale?.id,
    date: sale?.created_at || sale?.createdAt,
    description: 'UC METC Merchandise Purchase',
    items: (sale?.items || []).map((item: any) => ({
      id: item?.id,
      productName: item?.productName || item?.product_name || 'Unknown Product',
      quantity: item?.quantity || 0,
      unitPrice: item?.unitPrice || item?.unit_price || 0,
      subtotal: item?.subtotal || 0,
      selectedOptions: item?.selectedOptions || item?.selected_options || {}
    })),
    amount: sale?.total_amount || sale?.totalAmount || 0,
    status: (sale?.status || 'pending') as 'completed' | 'pending' | 'cancelled',
    receiptNumber: sale?.receipt_no || sale?.receiptNo || 'N/A',
    paymentMethod: ((sale?.payment_method || sale?.paymentMethod) === 'cash') ? 'Cash' : 'E-Wallet',
  }));

  // All users can see all their transactions including pending (so they can cancel)
  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  const filteredTransactions = filterStatus === 'all'
    ? transactions
    : transactions.filter(t => t.status === filterStatus);

  // All users can see pending filter to manage their orders
  const availableStatuses = ['all', 'completed', 'pending', 'cancelled'];

  const statusConfig = {
    completed: { color: 'bg-green-100', textColor: 'text-green-800', icon: CheckCircle, label: 'Completed' },
    pending: { color: 'bg-yellow-100', textColor: 'text-yellow-800', icon: Clock, label: 'Pending' },
    cancelled: { color: 'bg-red-100', textColor: 'text-red-800', icon: XCircle, label: 'Cancelled' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 py-8 px-4 animate-slide-in-right">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">TRANSACTION HISTORY</h1>
            <p className="text-slate-700">View your past purchases and receipts</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filter by Status</h2>
          <div className="flex flex-wrap gap-3">
            {availableStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-slate-600 text-lg">
                {filterStatus === 'pending'
                  ? 'No pending orders'
                  : 'No transactions found'}
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => {
              const StatusIcon = statusConfig[transaction.status].icon;
              return (
                <div
                  key={transaction.id}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className={`p-3 rounded-lg ${statusConfig[transaction.status].color}`}>
                            <StatusIcon className={`${statusConfig[transaction.status].textColor}`} size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {transaction.description}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })} • Receipt: {transaction.receiptNumber}
                            </p>
                          </div>
                        </div>

                        {/* Items List with Details */}
                        <div className="ml-16 space-y-2 mb-3">
                          {transaction.items.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm text-slate-600">
                              <p className="font-medium">• {item.productName} (Qty: {item.quantity})</p>
                              {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                <p className="text-xs text-slate-500 ml-4 mt-1">
                                  {Object.entries(item.selectedOptions)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(', ')}
                                </p>
                              )}
                              <p className="text-xs text-slate-500 ml-4">₱{Number(item.unitPrice || 0).toLocaleString()} × {item.quantity} = ₱{Number(item.subtotal || 0).toLocaleString()}</p>
                            </div>
                          ))}
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
                          ₱{Number(transaction.amount || 0).toLocaleString()}
                        </p>
                        <div className="flex space-x-2">
                          {transaction.status === 'completed' && (
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
                          )}
                          {transaction.status === 'pending' && !isStaffOrAdmin && (
                            <button
                              onClick={() => setConfirmingOrderId(transaction.id)}
                              className="px-3 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                              title="Cancel Order"
                            >
                              Cancel Order
                            </button>
                          )}
                          {(transaction.status === 'completed' || isStaffOrAdmin) && (
                            <button
                              onClick={() => downloadReceiptDirectly(transaction)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                              title="Download Receipt"
                            >
                              <Download size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-end">
                      <span className={`px-4 py-1 rounded-full text-sm font-medium ${statusConfig[transaction.status].color} ${statusConfig[transaction.status].textColor}`}>
                        {statusConfig[transaction.status].label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div ref={receiptRef} className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scale-in flex flex-col max-h-[90vh]">
            {/* Receipt Header with Logo */}
            <div className="text-center mb-4 pb-4 border-b-2 border-slate-300">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <img src={coopLogo} alt="UC METC SILMS" className="h-10 w-auto object-contain" />
                <div className="text-left">
                  <p className="text-lg font-bold text-purple-600">UC METC</p>
                  <p className="text-xs font-semibold text-slate-700">SILMS</p>
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">RECEIPT</h2>
              <p className="text-xs text-slate-600">{selectedTransaction.receiptNumber}</p>
            </div>

            {/* Receipt Details - Scrollable content area */}
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

              {/* Detailed Items */}
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Items Purchased</p>
                <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
                  {selectedTransaction.items.map((item: any, idx: number) => (
                    <div key={idx} className="border-b last:border-b-0 pb-2 last:pb-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-900">{item.productName}</span>
                        <span className="font-semibold text-slate-900">₱{Number(item.subtotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Quantity: {item.quantity}</span>
                        <span>Unit Price: ₱{Number(item.unitPrice || 0).toLocaleString()}</span>
                      </div>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <div className="text-xs text-slate-500 mb-1 p-1 bg-white rounded">
                          {Object.entries(item.selectedOptions)
                            .map(([key, value]) => `${key}: ${String(value)}`)
                            .join(' • ')}
                        </div>
                      )}
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
                <p className={`font-medium text-sm ${statusConfig[selectedTransaction.status as keyof typeof statusConfig].textColor}`}>
                  {statusConfig[selectedTransaction.status as keyof typeof statusConfig].label}
                </p>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="border-t-2 border-slate-300 pt-4 text-center mt-auto">
              <p className="text-xs text-slate-600 mb-3">
                {selectedTransaction.status === 'pending' 
                  ? '⏳ This order is pending. You can cancel it anytime before payment is processed.'
                  : 'Thank you for your purchase! Keep this receipt for your records.'}
              </p>
              
              {/* Staff Actions */}
              {(user?.role === 'admin' || user?.role === 'staff') && selectedTransaction.status === 'pending' && showReceiptActions && (
                <div className="flex space-x-2 mb-3">
                  <button
                    onClick={async () => {
                      try {
                        await AppDataSync.updateOrderStatus(selectedTransaction.id, 'completed', user.id);
                        setSelectedTransaction(null);
                      } catch (err: any) {
                        console.error('Failed to mark as paid:', err);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all text-sm"
                  >
                    ✓ Mark as Paid
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await AppDataSync.updateOrderStatus(selectedTransaction.id, 'cancelled', user.id);
                        setSelectedTransaction(null);
                      } catch (err: any) {
                        console.error('Failed to cancel order:', err);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all text-sm"
                  >
                    ✕ Cancel Order
                  </button>
                </div>
              )}

              {/* User Actions - Cancel Pending Order */}
              {selectedTransaction.status === 'pending' && !isStaffOrAdmin && showReceiptActions && (
                <div className="flex space-x-2 mb-3">
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all text-sm"
                  >
                    Keep Shopping
                  </button>
                  <button
                    onClick={async () => {
                      if (!user?.id) return;
                      try {
                        await AppDataSync.cancelOrderForUser(selectedTransaction.id, user.id);
                        setSelectedTransaction(null);
                      } catch (err: any) {
                        console.error('Failed to cancel order:', err);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all text-sm"
                  >
                    ✕ Cancel Order
                  </button>
                </div>
              )}

              <div className="flex space-x-2">
                {showReceiptActions && (
                  <>
                    <button
                      onClick={() => setSelectedTransaction(null)}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all text-sm"
                    >
                      Close
                    </button>
                    {(selectedTransaction.status === 'completed' || isStaffOrAdmin) && (
                      <button
                        onClick={downloadReceiptAsImage}
                        className="flex-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all flex items-center justify-center space-x-1 text-sm"
                      >
                        <Download size={16} />
                        <span>Download</span>
                      </button>
                    )}
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
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {confirmingOrderId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Order?</h3>
            </div>

            <p className="text-slate-600 mb-6">
              Are you sure you want to cancel this order? This action cannot be undone and the order will be removed from your transaction history.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmingOrderId(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-colors"
              >
                Keep Order
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
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
