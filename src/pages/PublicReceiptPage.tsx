import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { CheckCircle2, Clock, XCircle, Printer, ArrowLeft } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  selectedOptions?: string | any;
  paymentType?: string;
  orderType?: string;
}

interface OrderDetails {
  id: string;
  receipt_no: string;
  total_amount: number;
  payment_method: string;
  reference_number?: string;
  status: string;
  created_at: string;
  is_walk_in: boolean;
  first_name?: string;
  last_name?: string;
  id_number?: string;
  course?: string;
  year?: string;
  items: OrderItem[];
}

export function PublicReceiptPage() {
  const { receiptNo } = useParams<{ receiptNo: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    async function loadReceipt() {
      if (!receiptNo) return;
      try {
        setLoading(true);
        const data = await apiClient.getPublicReceipt(receiptNo);
        setOrder(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load public receipt:', err);
        setError(err.message || 'Failed to retrieve receipt. Please check the reference number.');
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [receiptNo]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-slate-400 text-sm font-medium">Fetching receipt details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-red-900/30 border border-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-500">
          <XCircle size={32} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">RECEIPT NOT FOUND</h2>
        <p className="text-slate-400 max-w-sm mb-8 text-sm">{error || 'This receipt does not exist or has been deleted.'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const statusConfig: Record<string, { color: string; textColor: string; icon: any; label: string }> = {
    completed: { color: 'bg-green-100 border-green-200', textColor: 'text-green-800', icon: CheckCircle2, label: 'Paid & Completed' },
    released: { color: 'bg-green-100 border-green-200', textColor: 'text-green-800', icon: CheckCircle2, label: 'Items Released' },
    pending: { color: 'bg-yellow-100 border-yellow-200', textColor: 'text-yellow-800', icon: Clock, label: 'Pending Payment' },
    cancelled: { color: 'bg-red-100 border-red-200', textColor: 'text-red-800', icon: XCircle, label: 'Cancelled' },
  };

  const statusInfo = statusConfig[order.status] || { color: 'bg-slate-100 border-slate-200', textColor: 'text-slate-800', icon: Clock, label: order.status };
  const StatusIcon = statusInfo.icon;

  // Format options helper
  const formatOptions = (optionsStr: any) => {
    if (!optionsStr) return null;
    try {
      const parsed = typeof optionsStr === 'string' ? JSON.parse(optionsStr) : optionsStr;
      return Object.entries(parsed)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
    } catch (e) {
      return typeof optionsStr === 'string' ? optionsStr : null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 flex flex-col items-center justify-start overflow-y-auto">
      {/* Action Buttons (Hidden during Print) */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 print:hidden">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          <span>Home</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-all text-xs font-semibold shadow border border-slate-700"
        >
          <Printer size={14} />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* Receipt Slip Container */}
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full relative border border-slate-100 flex flex-col print:shadow-none print:border-none print:p-0 print:rounded-none">
        
        {/* Decorative receipt cuts at top/bottom (Hidden during Print) */}
        <div className="absolute left-4 right-4 -top-2 flex justify-between overflow-hidden h-2 select-none pointer-events-none print:hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-3 h-3 bg-slate-900 rotate-45 transform origin-bottom-left -mt-2.5"></div>
          ))}
        </div>

        {/* Coop Header */}
        <div className="text-center mb-6 pb-6 border-b border-slate-200">
          <h1 className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest leading-tight">
            University of Cebu - METC
          </h1>
          <p className="text-[9px] sm:text-[10px] font-bold text-purple-600 uppercase tracking-wider leading-tight mt-0.5">
            Multipurpose Cooperative (UC-METC MPC)
          </p>
          <h2 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">COOP ORDER SLIP</h2>
          <p className="text-xs font-mono font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl inline-block mt-3 tracking-wider">
            {order.receipt_no}
          </p>
        </div>

        {/* Receipt Details Block */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Order Date</p>
              <p className="text-xs font-semibold text-slate-800">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payment Status</p>
              <div className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border mt-0.5 ${statusInfo.color} ${statusInfo.textColor}`}>
                <StatusIcon size={12} />
                <span>{statusInfo.label.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Customer Details</p>
            <p className="text-sm font-black text-slate-800">
              {order.first_name ? `${order.first_name} ${order.last_name || ''}`.trim() : 'Walk-in Guest'}
            </p>
            {order.id_number && (
              <div className="text-xs text-slate-500 font-semibold mt-0.5 space-x-2">
                <span>ID: {order.id_number}</span>
                {order.course && <span>• {order.course}</span>}
                {order.year && <span>• Year {order.year}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Purchased Items List */}
        <div className="mb-6">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Items Ordered</p>
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 space-y-3">
            {order.items.map((item, idx) => {
              const optionsStr = formatOptions(item.selectedOptions);
              return (
                <div key={idx} className="border-b last:border-b-0 border-slate-200/60 pb-3 last:pb-0 flex flex-col">
                  <div className="flex justify-between items-start text-xs font-bold text-slate-800">
                    <span className="flex-1 pr-2 leading-tight">{item.productName}</span>
                    <span className="font-extrabold text-slate-900 whitespace-nowrap">₱{Number(item.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {optionsStr && (
                    <span className="text-[10px] text-purple-600 font-semibold mt-0.5">
                      {optionsStr}
                    </span>
                  )}
                  {item.paymentType === 'downpayment' && (
                    <span className="inline-block bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 self-start">DOWNPAYMENT</span>
                  )}
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                    <span>Qty: {item.quantity}</span>
                    <span>Unit Price: ₱{Number(item.unitPrice || 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-slate-200 pt-4 space-y-2 mb-6">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Subtotal</span>
            <span>₱{Number(order.total_amount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-black text-slate-900 bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
            <span>Total Amount</span>
            <span className="text-purple-600">₱{Number(order.total_amount || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Payment details */}
        <div className="border-t border-slate-200 pt-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Payment Method</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5 capitalize">{order.payment_method === 'ewallet' ? 'GCash / E-Wallet' : order.payment_method}</p>
            </div>
            {order.reference_number && (
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Reference No.</p>
                <p className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded inline-block mt-0.5">
                  {order.reference_number}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer instructions */}
        <div className="border-t border-dashed border-slate-300 pt-6 text-center mt-auto">
          <p className="text-xs font-semibold text-slate-700 leading-relaxed mb-4">
            {order.status === 'pending'
              ? '📢 Please present this screen to the Coop counter along with your payment to complete your order.'
              : 'Thank you for purchasing! Your transaction has been recorded. Present this slip to claim your items.'}
          </p>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            UC METC Coop Management System
          </div>
        </div>
      </div>
    </div>
  );
}
