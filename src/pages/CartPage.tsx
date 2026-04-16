import React, { useState } from 'react';
import { ChevronLeft, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/uiStore';
import { useAuth } from '../store/authContext';
import { AppDataSync } from '../store/appDataSync';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, removeFromCart, updateCartItem, addSale, clearCart } = useAppStore();
  const { showNotification } = useUIStore();
  const [showCheckoutPrompt, setShowCheckoutPrompt] = useState(false);
  const [discount] = useState(0); // Discount amount in PHP

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
          <h1 className="text-3xl font-bold text-slate-900">YOUR CART</h1>
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
                  className="bg-gradient-to-r from-purple-600 to-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-green-700 transition-all"
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
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-green-100 rounded-lg flex items-center justify-center text-5xl">
                        {item.image}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          {item.name}
                        </h3>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="text-sm text-slate-600 mb-2">
                            {Object.entries(item.selectedOptions).map(([key, value]) => (
                              <p key={key}>
                                <span className="font-medium capitalize">{key}:</span> {value}
                              </p>
                            ))}
                          </div>
                        )}
                        <p className="text-2xl font-bold text-purple-600">₱{item.price}</p>
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
                          ₱{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Continue Shopping */}
                <button
                  onClick={() => navigate('/merchandise')}
                  className="w-full bg-white text-slate-900 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-all shadow-lg"
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
                    <span>₱{subtotal.toLocaleString()}</span>
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
                  onClick={() => setShowCheckoutPrompt(true)}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 shadow-lg hover:scale-105"
                >
                  Proceed to Checkout
                </button>

                
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Confirmation Modal */}
      {showCheckoutPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-scale-in">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Checkout?</h2>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-4">
                You have <span className="font-bold">{cart.reduce((total, item) => total + item.quantity, 0)} item(s)</span> in your cart with a total of <span className="font-bold">₱{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>.
              </p>
              <p className="text-sm text-blue-800">
                Payment will be processed at the Coop Office. 
              </p>
            </div>

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
                onClick={() => setShowCheckoutPrompt(false)}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!user?.id) {
                    showNotification('Please log in to checkout', 'error');
                    return;
                  }
                  
                  try {
                    await AppDataSync.createOrderFromCart(user.id);
                    showNotification('Checkout initiated!', 'success');
                    setShowCheckoutPrompt(false);
                    navigate('/transaction');
                  } catch (err: any) {
                    showNotification(`Checkout failed: ${err.message}`, 'error');
                  }
                }}
                className="flex-1 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200 shadow-lg hover:scale-105"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
