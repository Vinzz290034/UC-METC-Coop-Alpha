import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../store/authContext';
import { apiClient } from '../services/api';
import { AppDataSync } from '../store/appDataSync';
import { Toast } from '../components/Toast';
import { ITEM_INVENTORY } from '../types';
import type { Product, Sale, SaleItem, ItemType } from '../types';

export const SalesInventoryPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const { products, addProduct, deleteProduct, addSale } =
    useAppStore();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'inventory' | 'pending'>('inventory');
  const [showForm, setShowForm] = useState(false);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ewallet'>(
    'cash'
  );
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load pending orders on component mount and when page becomes visible
  useEffect(() => {
    const loadData = () => {
      if (user?.id) {
        // Always load pending orders on mount, regardless of active tab
        // This ensures the count is accurate
        loadPendingOrders();
      }
    };

    loadData();

    // Reload data when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        loadPendingOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id]);

  const loadPendingOrders = async () => {
    try {
      const orders = await apiClient.getPendingOrders(user?.id || '');
      if (Array.isArray(orders)) {
        setPendingOrders(orders);
      }
      console.log('Loaded pending orders:', orders);
    } catch (err) {
      console.error('Failed to load pending orders:', err);
    }
  };

  const [formData, setFormData] = useState<Partial<Product> & { name?: ItemType }>({
    name: ITEM_INVENTORY[0],
    price: 0,
    stock: 0,
    sku: '',
    category: 'uniform',
  });

  const handleAddProduct = () => {
    if (formData.name && formData.price && formData.sku) {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name as ItemType,
        category: formData.category || 'uniform',
        price: formData.price,
        stock: formData.stock || 0,
        sku: formData.sku,
        createdAt: new Date().toISOString(),
      };
      addProduct(newProduct);
      setFormData({
        name: ITEM_INVENTORY[0],
        price: 0,
        stock: 0,
        sku: '',
        category: 'uniform',
      });
      setShowForm(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: Date.now().toString(),
          productId: product.id,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      ]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCheckout = () => {
    if (cart.length > 0) {
      const sale: Sale = {
        id: Date.now().toString(),
        receiptNo: `RCP-${Date.now()}`,
        items: cart,
        totalAmount: cartTotal,
        paymentMethod,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      addSale(sale);
      setCart([]);
      alert('Sale completed! Receipt: ' + sale.receiptNo);
    }
  };

  // Low stock products calculated but kept for potential future use
  // const lowStockProducts = products.filter((p) => p.stock <= 5);

  return (
    <div className="min-h-screen p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Sales & Inventory
            </h1>
            <p className="text-slate-600 mt-2">Manage products and process sales</p>
          </div>
          {activeTab === 'inventory' && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              <span>Add Product</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'inventory'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventory ({products.length})
          </button>
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
        </div>

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Add Product Form */}
            {showForm && (
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={formData.name || ITEM_INVENTORY[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value as ItemType })
                    }
                    className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ITEM_INVENTORY.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="SKU"
                    value={formData.sku || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={formData.category || 'uniform'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as 'uniform' | 'accessory' | 'equipment' | 'service',
                      })
                    }
                    className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="uniform">Uniform</option>
                    <option value="accessory">Accessory</option>
                    <option value="equipment">Equipment</option>
                    <option value="service">Service</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Price"
                    value={formData.price || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value),
                      })
                    }
                    className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Stock Quantity"
                    value={formData.stock || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: parseInt(e.target.value),
                      })
                    }
                    className="border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={handleAddProduct}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add Product
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="bg-slate-200 text-slate-900 px-6 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Inventory Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                        product.stock <= 5 ? 'bg-orange-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        ₱{product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            product.stock <= 5
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-500">No products yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Orders Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6">
                <p className="text-slate-600 mb-6">View and process pending orders from users</p>
                
                {pendingOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600 text-lg">No pending orders at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingOrders.map((order) => (
                      <div key={order.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {order.first_name} {order.last_name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {order.email} • ID: {order.id_number}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-600">
                              ₱{parseFloat(order.total_amount).toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {order.payment_method === 'cash' ? '💵 Cash' : '📱 E-Wallet'}
                            </p>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="bg-slate-50 rounded p-3 mb-3">
                          <p className="text-sm font-semibold text-slate-700 mb-2">Items:</p>
                          <div className="space-y-1">
                            {order.items && order.items.length > 0 && order.items[0] && order.items.map((item: any, idx: number) => {
                              const options = typeof item.selectedOptions === 'string' ? JSON.parse(item.selectedOptions) : item.selectedOptions;
                              return (
                                <div key={idx} className="text-xs text-slate-600">
                                  <p>• {item.productName || 'Unknown'} (Qty: {item.quantity}) - ₱{parseFloat(item.subtotal).toLocaleString()}</p>
                                  {options && Object.keys(options).length > 0 && (
                                    <p className="text-slate-500 ml-2">
                                      {Object.entries(options).map(([key, val]) => `${key}: ${val}`).join(', ')}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                          <span>Receipt: {order.receipt_no}</span>
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              try {
                                await AppDataSync.updateOrderStatus(order.id, 'completed', user?.id || '');
                                await loadPendingOrders();
                                // Also update the global store so Dashboard/Billing/Reports see the change
                                if (user?.id) {
                                  await AppDataSync.loadOrdersFromAPI(user.id);
                                }
                                setToast({ message: 'Order marked as paid!', type: 'success' });
                              } catch (err) {
                                console.error('Failed to mark order as paid:', err);
                                setToast({ message: 'Failed to mark order as paid. Please try again.', type: 'error' });
                              }
                            }}
                            className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center justify-center space-x-1 text-sm"
                          >
                            <CheckCircle size={16} />
                            <span>Paid</span>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await AppDataSync.updateOrderStatus(order.id, 'cancelled', user?.id || '');
                                await loadPendingOrders();
                                // Also update the global store so Dashboard/Billing/Reports see the change
                                if (user?.id) {
                                  await AppDataSync.loadOrdersFromAPI(user.id);
                                }
                                setToast({ message: 'Order cancelled successfully!', type: 'success' });
                              } catch (err) {
                                console.error('Failed to cancel order:', err);
                                setToast({ message: 'Failed to cancel order. Please try again.', type: 'error' });
                              }
                            }}
                            className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors text-sm"
                          >
                            Cancel
                          </button>
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Order Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 uppercase">Customer</p>
                  <p className="font-semibold">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                  <p className="text-sm text-slate-600">{selectedOrder.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase">Receipt</p>
                  <p className="font-semibold">{selectedOrder.receipt_no}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Items Ordered:</p>
                <div className="bg-slate-50 rounded p-3 space-y-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 && selectedOrder.items[0] && selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="border-b last:border-b-0 pb-2 last:pb-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.productName || 'Unknown'}</span>
                        <span>₱{parseFloat(item.subtotal).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Qty: {item.quantity}</span>
                        <span>Unit: ₱{parseFloat(item.unitPrice).toLocaleString()}</span>
                      </div>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          {Object.entries(item.selectedOptions)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-purple-600">₱{parseFloat(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
                <p className="text-sm text-slate-600">
                  Payment Method: <span className="font-semibold">{selectedOrder.payment_method === 'cash' ? 'Cash' : 'E-Wallet'}</span>
                </p>
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/orders/${selectedOrder.id}/status`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-user-id': user?.id || '',
                        },
                        body: JSON.stringify({ status: 'completed' }),
                      });
                      if (response.ok) {
                        setPendingOrders(pendingOrders.filter(o => o.id !== selectedOrder.id));
                        setSelectedOrder(null);
                        alert('Order marked as paid!');
                      }
                    } catch (err) {
                      console.error('Failed to mark order as paid:', err);
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
                >
                  Mark as Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
