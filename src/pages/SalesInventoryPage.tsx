import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShoppingCart } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { ITEM_INVENTORY } from '../types';
import type { Product, Sale, SaleItem, ItemType } from '../types';

export const SalesInventoryPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const { products, addProduct, updateProduct, deleteProduct, addSale } =
    useAppStore();

  const [activeTab, setActiveTab] = useState<'inventory' | 'pos'>('inventory');
  const [showForm, setShowForm] = useState(false);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ewallet'>(
    'cash'
  );

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

  const lowStockProducts = products.filter((p) => p.stock <= 5);

  return (
    <div className="min-h-screen bg-white p-6">
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
            onClick={() => setActiveTab('pos')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'pos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            POS
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

        {/* POS Tab */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Grid */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-lg transition-shadow"
                  >
                    <h4 className="font-semibold text-slate-900 mb-2">
                      {product.name}
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      SKU: {product.sku}
                    </p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl font-bold text-blue-600">
                        ₱{product.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500">
                        Stock: {product.stock}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit sticky top-32">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <ShoppingCart size={20} />
                <span>Shopping Cart</span>
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto mb-4 border-b border-slate-200 pb-4">
                {cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {product?.name}
                        </p>
                        <p className="text-slate-600">
                          Qty: {item.quantity} x ₱{item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          ₱{item.subtotal.toLocaleString()}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800 text-xs mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    ₱{cartTotal.toLocaleString()}
                  </span>
                </div>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as 'cash' | 'ewallet')
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="ewallet">E-Wallet</option>
                </select>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
                >
                  Checkout
                </button>

                <button
                  onClick={() => setCart([])}
                  className="w-full bg-slate-200 text-slate-900 py-2 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
