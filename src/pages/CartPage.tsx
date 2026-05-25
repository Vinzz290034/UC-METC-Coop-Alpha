import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/uiStore';
import { useAuth } from '../store/authContext';
import { AppDataSync } from '../store/appDataSync';
import { Z_INDEX } from '../constants/zIndex';
import { GCASH_URL } from '../constants/cloudinaryAssets';
import { formatProductName } from '../utils/productNameFormatter';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, removeFromCart, updateCartItem } = useAppStore();
  const { showNotification, setSidebarOpen } = useUIStore();
  const [showCheckoutPrompt, setShowCheckoutPrompt] = useState(false);
  const [discount] = useState(0); // Discount amount in PHP
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ewallet' | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [confirmedNoRefund, setConfirmedNoRefund] = useState(false);

  // Ensure any existing modals are closed when CartPage mounts
  useEffect(() => {
    // Close any potential product modals or other modals that might be open
    document.body.style.overflow = 'unset';
    
    // Clean up any modal states that might be lingering
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      if (user?.id) AppDataSync.syncCartToAPI(user.id);
      return;
    }
    updateCartItem(id, { quantity: newQuantity });
    if (user?.id) AppDataSync.syncCartToAPI(user.id);
  };

  const removeItem = (id: string) => {
    removeFromCart(id);
    if (user?.id) AppDataSync.syncCartToAPI(user.id);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - discount;

  // Calculate GCash fee based on amount ranges
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

  const ewalletFee = calculateEWalletFee(total);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 via-purple-300 to-purple-400 py-8 px-4 animate-slide-in-right">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft size={24} className="text-slate-700" />
            </button>
            <h1 className="text-3xl font-bold text-slate-900">YOUR CART</h1>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-slate-900">YOUR CART</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cart.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <ShoppingCart size={48} className="mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600 text-lg mb-4">Your cart is empty</p>
                <button
                  onClick={() => navigate('/merchandise')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center space-x-6">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-green-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.image && typeof item.image === 'string' && item.image !== '📦' && (item.image.startsWith('/') || item.image.includes('assets') || item.image.includes('.jpeg') || item.image.includes('.jpg') || item.image.includes('.png') || item.image.startsWith('data:') || item.image.startsWith('http')) ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className={`w-full h-full ${item.name === 'Lanyard' ? 'object-contain' : 'object-cover'}`}
                            onError={(e) => {
                              // Fallback to emoji if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = '<span class="text-5xl">📦</span>';
                            }}
                          />
                        ) : (
                          <span className="text-5xl">{item.image || '📦'}</span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {formatProductName(item.name, item.selectedOptions, item.price)}
                        </h3>
                        <p className="text-2xl font-bold text-purple-600">₱{item.price.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center border border-slate-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-slate-100 transition-colors"
                          >
                            <Minus size={18} className="text-slate-600" />
                          </button>
                          <span className="px-4 py-2 font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-slate-100 transition-colors"
                          >
                            <Plus size={18} className="text-slate-600" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="text-sm text-slate-600 mb-1">Subtotal</p>
                        <p className="text-2xl font-bold text-slate-900">
                          ₱{(item.price * item.quantity).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Continue Shopping */}
                <button
                  onClick={() => navigate('/merchandise')}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cart.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>₱{subtotal.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₱{discount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-xl font-bold text-slate-900 mb-6">
                  <span>Total</span>
                  <span className="text-purple-600">₱{total.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</span>
                </div>

                <button
                  onClick={() => {
                    setShowCheckoutPrompt(true);
                  }}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 shadow-lg hover:scale-105"
                >
                  Proceed to Checkout
                </button>

                {/* GCash Notice */}
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-yellow-900 mb-2">⚠️ GCash Payment Notice</h3>
                  <p className="text-xs text-yellow-800 mb-2">
                    GCash payments incur an additional service fee of <span className="font-bold">₱{ewalletFee.toFixed(2)}</span>. Your total will be <span className="font-bold">₱{(total + ewalletFee).toFixed(2)}</span>.
                  </p>
                  <p className="text-xs text-yellow-800 font-semibold">
                    ⚠️ No refunds for GCash payments once completed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Confirmation Modal - Portal to body for true fixed positioning */}
      {showCheckoutPrompt && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: Z_INDEX.CHECKOUT_MODAL }}
          onClick={() => {
            setShowCheckoutPrompt(false);
            setPaymentMethod(null);
            setReferenceNumber('');
            setShowQRCode(false);
            setConfirmedNoRefund(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Checkout?</h2>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 mb-4">
                  You have <span className="font-bold">{cart.reduce((total, item) => total + item.quantity, 0)} item(s)</span> in your cart with a total of <span className="font-bold">₱{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>.
                </p>
                <p className="text-sm text-blue-800">
                  Payment will be processed at the Coop Office. 
                </p>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Select Payment Method</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Cash Option */}
                  <button
                    onClick={() => {
                      setPaymentMethod('cash');
                      setReferenceNumber('');
                      setShowQRCode(false);
                      setConfirmedNoRefund(false);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'cash'
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
                      setPaymentMethod('ewallet');
                      setShowQRCode(false);
                      setConfirmedNoRefund(false);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'ewallet'
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
              {paymentMethod === 'ewallet' && !showQRCode && (
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
                      Total amount to pay: <span className="text-lg">₱{(total + ewalletFee).toFixed(2)}</span>
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
              {paymentMethod === 'ewallet' && showQRCode && (
                <div className="mb-6 animate-fade-in-up">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-300 rounded-lg p-6 text-center transform transition-all duration-500 ease-out">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Scan QR Code to Pay</h3>
                    
                    {/* QR Code Display */}
                    <div className="bg-white p-4 rounded-lg inline-block mb-4 overflow-hidden transform transition-all duration-700 ease-out hover:scale-105">
                      <img 
                        src={GCASH_URL} 
                        alt="GCash QR Code" 
                        className="w-64 h-auto object-cover rounded-lg animate-fade-in"
                        style={{
                          objectPosition: 'center 15%',
                          maxHeight: '400px'
                        }}
                      />
                    </div>

                    <div className="text-left bg-white rounded-lg p-4 mb-4 transform transition-all duration-600 ease-out animate-slide-in-left">
                      <p className="text-sm text-slate-700 mb-2">
                        <span className="font-semibold">Account Name:</span> Michelle Pable
                      </p>
                      <p className="text-sm text-slate-700 mb-2">
                        <span className="font-semibold">GCash Number:</span> 09498664041
                      </p>
                      <p className="text-sm text-slate-700 mb-2">
                        <span className="font-semibold">Amount to Pay:</span> <span className="text-lg font-bold text-purple-600">₱{(total + ewalletFee).toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        (Order: ₱{total.toFixed(2)} + Service Fee: ₱{ewalletFee.toFixed(2)})
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 animate-bounce-in">
                      <p className="text-xs text-yellow-800 font-semibold">
                        📝 After payment, enter the last 4 digits of your reference number below
                      </p>
                    </div>
                  </div>

                  {/* Reference Number Input */}
                  <div className="mt-4 animate-slide-in-right">
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Last 4 Digits of Reference Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 4) {
                          setReferenceNumber(value);
                        }
                      }}
                      placeholder="Enter last 4 digits"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl font-bold tracking-widest transition-all duration-300 focus:scale-105"
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
                  <span className="text-slate-700 text-sm">Review your items</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 text-sm">Proceed to payment at the office</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-slate-700 text-sm">Collect your items upon payment</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCheckoutPrompt(false);
                    setPaymentMethod(null);
                    setReferenceNumber('');
                    setShowQRCode(false);
                    setConfirmedNoRefund(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!paymentMethod) {
                      showNotification('Please select a payment method', 'error');
                      return;
                    }
                    
                    // Validate reference number for GCash payments
                    if (paymentMethod === 'ewallet' && referenceNumber.length !== 4) {
                      showNotification('Please enter the last 4 digits of your reference number', 'error');
                      return;
                    }
                    
                    if (!user?.id) {
                      showNotification('Please log in to checkout', 'error');
                      return;
                    }
                    
                    try {
                      await AppDataSync.createOrderFromCart(
                        user.id, 
                        paymentMethod,
                        referenceNumber || null
                      );
                      showNotification('Checkout initiated!', 'success');
                      setShowCheckoutPrompt(false);
                      // Reset payment method state
                      setPaymentMethod(null);
                      setReferenceNumber('');
                      setShowQRCode(false);
                      setConfirmedNoRefund(false);
                      navigate('/transaction');
                    } catch (err: any) {
                      showNotification(`Checkout failed: ${err.message}`, 'error');
                    }
                  }}
                  disabled={!paymentMethod || (paymentMethod === 'ewallet' && referenceNumber.length !== 4)}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg ${
                    paymentMethod && (paymentMethod === 'cash' || referenceNumber.length === 4)
                      ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>,
          document.body
      )}
    </div>
  );
};