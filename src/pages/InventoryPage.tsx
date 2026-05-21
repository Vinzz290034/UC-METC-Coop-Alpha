import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, AlertTriangle, TrendingDown, TrendingUp, Search, Package } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/uiStore';
import { AppDataSync } from '../store/appDataSync';
import { FloatingInput } from '../components/FloatingInput';
import { apiClient } from '../services/api';
import type { Product, ItemType } from '../types';

export const InventoryPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    // Load products from API
    AppDataSync.loadProductsFromAPI();
    
    // Set up polling to reload products every 10 seconds for real-time stock updates
    const interval = setInterval(() => {
      AppDataSync.loadProductsFromAPI();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const { products, addProduct, deleteProduct, updateProduct } =
    useAppStore();
  const { showNotification, setSidebarOpen } = useUIStore();

  const [activeTab, setActiveTab] = useState<'inventory' | 'stock-intake'>('inventory');
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stock Intake states
  const [stockIntakeRecords, setStockIntakeRecords] = useState<any[]>([]);
  const [showStockIntakeForm, setShowStockIntakeForm] = useState(false);
  const [stockIntakeFormData, setStockIntakeFormData] = useState({
    productId: '',
    productName: '',
    quantity: 0,
    costPerUnit: 0,
    sellingPrice: 0,
    supplier: '',
    notes: '',
    dateReceived: new Date().toISOString().split('T')[0],
    selectedVariant: {} as Record<string, string>, // For variant options like course, size, color
  });

  // Load stock intake records when Stock Intake tab is active
  useEffect(() => {
    if (activeTab === 'stock-intake') {
      loadStockIntakeRecords();
    }
  }, [activeTab]);

  const loadStockIntakeRecords = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const records = await apiClient.getStockIntakeRecords(user.id) as any[];
      setStockIntakeRecords(records);
    } catch (error) {
      console.error('Failed to load stock intake records:', error);
    }
  };

  const [formData, setFormData] = useState<{
    name?: ItemType | string;
    price?: number;
    stock?: number;
    sku?: string;
    category?: 'uniform' | 'accessory' | 'equipment' | 'service';
    note?: string;
    image?: string;
    options?: Array<{
      id: string;
      label: string;
      choices: string[];
    }>;
  }>({
    name: '',
    price: 0,
    stock: 0,
    sku: '',
    category: 'uniform',
    note: '',
    image: '',
    options: [],
  });
  const [newVariantStocks, setNewVariantStocks] = useState<Record<string, number>>({});

  const handleAddProduct = async () => {
    // Validation
    if (!formData.name || formData.name.trim() === '') {
      showNotification('Please enter a product name', 'error');
      return;
    }
    
    if (!formData.sku || formData.sku.trim() === '') {
      showNotification('Please enter a SKU', 'error');
      return;
    }
    
    if (!formData.price || formData.price <= 0) {
      showNotification('Please enter a valid price', 'error');
      return;
    }
    
    // If product has no variants, check stock
    if ((!formData.options || formData.options.length === 0) && (!formData.stock || formData.stock < 0)) {
      showNotification('Please enter a valid stock quantity', 'error');
      return;
    }
    
    // If product has variants, validate options
    if (formData.options && formData.options.length > 0) {
      // Check if all options have labels and choices
      const invalidOption = formData.options.find(opt => !opt.label || opt.choices.length === 0);
      if (invalidOption) {
        showNotification('Please complete all variant options (name and choices)', 'error');
        return;
      }
      
      // Check if at least one variant has stock
      const totalVariantStock = Object.values(newVariantStocks).reduce((sum, stock) => sum + stock, 0);
      if (totalVariantStock === 0) {
        showNotification('Please set stock for at least one variant', 'error');
        return;
      }
    }
    
    if (formData.name && formData.price && formData.sku) {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name as ItemType,
        category: formData.category || 'uniform',
        price: formData.price,
        stock: formData.stock || 0,
        sku: formData.sku,
        note: formData.note,
        image: formData.image,
        options: formData.options && formData.options.length > 0 ? formData.options : undefined,
        createdAt: new Date().toISOString(),
      };

      // If product has variants, add variant stock data
      if (formData.options && formData.options.length > 0) {
        // Generate all variant combinations
        const generateCombinations = (options: any[]) => {
          if (options.length === 0) return [{}];
          if (options.length === 1) {
            return options[0].choices.map((choice: string) => ({
              [options[0].id]: choice  // Use id instead of label
            }));
          }
          
          const [first, ...rest] = options;
          const restCombinations = generateCombinations(rest);
          const combinations: any[] = [];
          
          first.choices.forEach((choice: string) => {
            restCombinations.forEach((restCombo: any) => {
              combinations.push({
                [first.id]: choice,  // Use id instead of label
                ...restCombo
              });
            });
          });
          
          return combinations;
        };

        const combinations = generateCombinations(formData.options);
        
        // Build variants object
        const variants: Record<string, { stock: number; options: Record<string, string> }> = {};
        combinations.forEach((combo: Record<string, string>) => {
          const variantKey = Object.entries(combo)
            .map(([key, val]) => `${key}:${val}`)
            .join('|');
          
          variants[variantKey] = {
            stock: newVariantStocks[variantKey] || 0,
            options: combo
          };
        });

        newProduct.variants = variants;
        // Calculate total stock from all variants
        newProduct.stock = Object.values(variants).reduce((sum, v) => sum + v.stock, 0);
      }

      addProduct(newProduct);
      
      // Sync to API
      await AppDataSync.syncProductToAPI(newProduct);
      
      setFormData({
        name: '',
        price: 0,
        stock: 0,
        sku: '',
        category: 'uniform',
        note: '',
        image: '',
        options: [],
      });
      setNewVariantStocks({});
      setShowForm(false);
      showNotification(`${formData.name} added successfully`, 'success');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product });
    // Initialize variant stocks from product data
    if (product.variants) {
      setVariantStocks(
        Object.entries(product.variants).reduce((acc, [key, variant]) => {
          acc[key] = variant.stock;
          return acc;
        }, {} as Record<string, number>)
      );
    } else {
      setVariantStocks({});
    }
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (editingProduct) {
      const updates: Partial<Product> = {
        price: editingProduct.price,
        note: editingProduct.note,
      };

      // If product has variants, save variant stocks
      if (editingProduct.options && editingProduct.options.length > 0) {
        // Generate all variant combinations
        const generateCombinations = (options: any[]) => {
          if (options.length === 0) return [{}];
          if (options.length === 1) {
            return options[0].choices.map((choice: string) => ({
              [options[0].id]: choice  // Use id instead of label
            }));
          }
          
          const [first, ...rest] = options;
          const restCombinations = generateCombinations(rest);
          const combinations: any[] = [];
          
          first.choices.forEach((choice: string) => {
            restCombinations.forEach((restCombo: any) => {
              combinations.push({
                [first.id]: choice,  // Use id instead of label
                ...restCombo
              });
            });
          });
          
          return combinations;
        };

        const combinations = generateCombinations(editingProduct.options);
        
        // Build variants object from variantStocks state
        const variants: Record<string, { stock: number; options: Record<string, string> }> = {};
        combinations.forEach((combo: Record<string, string>) => {
          const variantKey = Object.entries(combo)
            .map(([key, val]) => `${key}:${val}`)
            .join('|');
          
          variants[variantKey] = {
            stock: variantStocks[variantKey] || 0,
            options: combo
          };
        });

        updates.variants = variants;
        
        // Calculate total stock from all variants
        updates.stock = Object.values(variants).reduce((sum, v) => sum + v.stock, 0);
      } else {
        // For products without variants, use the simple stock value
        updates.stock = editingProduct.stock;
      }

      updateProduct(editingProduct.id, updates);
      
      // Sync to API
      const updatedProduct = { ...editingProduct, ...updates };
      await AppDataSync.syncProductToAPI(updatedProduct);
      
      showNotification(`${editingProduct.name} updated successfully`, 'success');
      setShowEditModal(false);
      setEditingProduct(null);
      setVariantStocks({});
    }
  };

  // Low stock products calculated but kept for potential future use
  // const lowStockProducts = products.filter((p) => p.stock <= 5);

  return (
    <div className="min-h-screen p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Inventory Management
              </h1>
              <p className="text-slate-600 mt-2">Manage products and stock levels</p>
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
            {activeTab === 'stock-intake' && (
              <button
                onClick={() => setShowStockIntakeForm(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 hover:shadow-lg transition-all"
              >
                <Plus size={20} />
                <span>Record Stock Intake</span>
              </button>
            )}
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-slate-900">Inventory</h1>
            </div>
            <p className="text-slate-600 text-sm mb-3">Manage products and stock levels</p>
            <div className="flex justify-end">
              {activeTab === 'inventory' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all text-sm"
                >
                  <Plus size={18} />
                  <span>Add Product</span>
                </button>
              )}
              {activeTab === 'stock-intake' && (
                <button
                  onClick={() => setShowStockIntakeForm(true)}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-sm"
                >
                  <Plus size={18} />
                  <span>Record Intake</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center mb-6 border-b border-slate-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'inventory'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('stock-intake')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'stock-intake'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stock Intake
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {activeTab === 'inventory' && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Inventory Tab Content */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Add Product Form */}
            {showForm && (
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-slide-in-right">
                <h3 className="text-lg font-semibold mb-6 text-slate-900">Add New Product</h3>
                
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <FloatingInput
                    label="Product Name"
                    value={formData.name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value as ItemType })
                    }
                    focusColor="purple"
                  />
                  <FloatingInput
                    label="SKU"
                    value={formData.sku || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    focusColor="purple"
                  />
                  <div className="relative">
                    <select
                      value={formData.category || 'uniform'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as 'uniform' | 'accessory' | 'equipment' | 'service',
                        })
                      }
                      className="peer w-full px-4 pt-6 pb-2 border-2 border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200 transition-all duration-300 hover:border-purple-400 hover:shadow-md cursor-pointer appearance-none"
                    >
                      <option value="uniform">Uniform</option>
                      <option value="accessory">Accessory</option>
                      <option value="equipment">Equipment</option>
                      <option value="service">Service</option>
                    </select>
                    <label className="absolute left-4 top-1.5 text-xs font-semibold text-purple-600 pointer-events-none">
                      Category
                    </label>
                    <div className="absolute right-4 top-4 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <FloatingInput
                    label="Base Price"
                    value={formData.price?.toString() || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    type="number"
                    focusColor="purple"
                  />
                  {(!formData.options || formData.options.length === 0) && (
                    <FloatingInput
                      label="Stock Quantity"
                      value={formData.stock?.toString() || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock: parseInt(e.target.value) || 0,
                        })
                      }
                      type="number"
                      focusColor="purple"
                    />
                  )}
                </div>

                {/* Product Image Upload */}
                <div className="mb-6">
                  <div className="relative">
                    <label className="block text-sm font-semibold text-purple-600 mb-2">
                      Product Image
                    </label>
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // For now, we'll store the file name as a placeholder
                            // In a real implementation, you'd upload to a server or cloud storage
                            setFormData({ ...formData, image: file.name });
                          }
                        }}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label
                        htmlFor="product-image-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            Click to upload product image
                          </p>
                          <p className="text-xs text-slate-500">
                            PNG, JPG, JPEG up to 10MB
                          </p>
                        </div>
                      </label>
                      {formData.image && (
                        <div className="mt-3 p-2 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-700 font-medium">
                            Selected: {formData.image}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Note */}
                <div className="mb-6">
                  <div className="relative">
                    <textarea
                      value={formData.note || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, note: e.target.value })
                      }
                      placeholder=" "
                      rows={3}
                      className="peer w-full px-4 pt-6 pb-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 hover:border-purple-400 hover:shadow-md resize-none"
                    />
                    <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      formData.note && formData.note.length > 0
                        ? 'top-1.5 text-xs font-semibold text-purple-600'
                        : 'top-4 text-base text-slate-500'
                    }`}>
                      Product Note (optional)
                    </label>
                  </div>
                </div>

                {/* Variant Options Section */}
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">Product Variants (Optional)</h4>
                    <button
                      onClick={() => {
                        const newOption = {
                          id: `option-${Date.now()}`,
                          label: '',
                          choices: []
                        };
                        setFormData({
                          ...formData,
                          options: [...(formData.options || []), newOption]
                        });
                      }}
                      className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 hover:shadow-md hover:scale-105 transition-all duration-300 active:scale-95"
                    >
                      + Add Option
                    </button>
                  </div>

                  {formData.options && formData.options.length > 0 ? (
                    <div className="space-y-3">
                      {formData.options.map((option, optionIndex) => (
                        <div key={option.id} className="bg-white p-3 rounded-lg border border-slate-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <input
                              type="text"
                              placeholder="Option name (e.g., Size, Color)"
                              value={option.label}
                              onChange={(e) => {
                                const newOptions = [...(formData.options || [])];
                                newOptions[optionIndex].label = e.target.value;
                                setFormData({ ...formData, options: newOptions });
                              }}
                              className="flex-1 border border-purple-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            />
                            <button
                              onClick={() => {
                                const newOptions = formData.options?.filter((_, i) => i !== optionIndex);
                                setFormData({ ...formData, options: newOptions });
                                setNewVariantStocks({});
                              }}
                              className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                              title="Remove option"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder="Enter choices separated by commas (e.g., Small, Medium, Large)"
                              value={option.choices.join(', ')}
                              onChange={(e) => {
                                const newOptions = [...(formData.options || [])];
                                newOptions[optionIndex].choices = e.target.value
                                  .split(',')
                                  .map(c => c.trim())
                                  .filter(c => c.length > 0);
                                setFormData({ ...formData, options: newOptions });
                                setNewVariantStocks({});
                              }}
                              className="flex-1 border border-purple-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 text-center py-2">
                      No variants added. Click "Add Option" to create product variants.
                    </p>
                  )}
                </div>

                {/* Variant Stock Management */}
                {formData.options && formData.options.length > 0 && formData.options.every(opt => opt.label && opt.choices.length > 0) && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-slate-900 mb-3">Set Stock for Each Variant</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(() => {
                        // Generate all variant combinations
                        const generateCombinations = (options: any[]) => {
                          if (options.length === 0) return [{}];
                          if (options.length === 1) {
                            return options[0].choices.map((choice: string) => ({
                              [options[0].id]: choice  // Use id instead of label
                            }));
                          }
                          
                          const [first, ...rest] = options;
                          const restCombinations = generateCombinations(rest);
                          const combinations: any[] = [];
                          
                          first.choices.forEach((choice: string) => {
                            restCombinations.forEach((restCombo: any) => {
                              combinations.push({
                                [first.id]: choice,  // Use id instead of label
                                ...restCombo
                              });
                            });
                          });
                          
                          return combinations;
                        };

                        const combinations = generateCombinations(formData.options || []);
                        
                        return combinations.map((combo: Record<string, string>, idx: number) => {
                          const variantKey = Object.entries(combo)
                            .map(([key, val]) => `${key}:${val}`)
                            .join('|');
                          
                          return (
                            <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200 flex items-center justify-between">
                              <div className="flex-1">
                                {Object.entries(combo).map(([key, value], i) => (
                                  <span key={i} className="text-sm">
                                    <span className="font-semibold text-slate-700">{key}:</span>{' '}
                                    <span className="text-slate-600">{value}</span>
                                    {i < Object.entries(combo).length - 1 && <span className="text-slate-400 mx-2">•</span>}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center space-x-2">
                                <label className="text-xs font-semibold text-slate-600">Stock:</label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={newVariantStocks[variantKey] || 0}
                                  onChange={(e) => {
                                    const newStock = parseInt(e.target.value) || 0;
                                    setNewVariantStocks(prev => ({
                                      ...prev,
                                      [variantKey]: newStock
                                    }));
                                  }}
                                  className="w-24 px-3 py-1.5 border border-purple-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  min="0"
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="mt-3 p-3 bg-white border border-purple-300 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-purple-900">Total Stock:</span>
                        <span className="text-xl font-bold text-purple-600">
                          {Object.values(newVariantStocks).reduce((sum, stock) => sum + stock, 0)} units
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleAddProduct}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-600/50 hover:scale-105 transition-all duration-300 active:scale-95"
                  >
                    Add Product
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        name: '',
                        price: 0,
                        stock: 0,
                        sku: '',
                        category: 'uniform',
                        note: '',
                        image: '',
                        options: [],
                      });
                      setNewVariantStocks({});
                    }}
                    className="bg-slate-200 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-300 hover:shadow-md hover:scale-105 transition-all duration-300 active:scale-95"
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
                  {products
                    .filter((product) => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        product.name.toLowerCase().includes(query) ||
                        product.sku.toLowerCase().includes(query) ||
                        product.category.toLowerCase().includes(query)
                      );
                    })
                    .map((product) => {
                    // Calculate stock level for row highlighting
                    let totalStock = product.stock;
                    if (product.variants) {
                      totalStock = Object.values(product.variants).reduce((sum, v) => sum + v.stock, 0);
                    }
                    const isLowStock = totalStock <= 10 && !['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(product.name);
                    const isCriticalStock = totalStock === 0 && !['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(product.name);
                    
                    return (
                      <tr
                        key={product.id}
                        className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                          isCriticalStock ? 'bg-red-50' : isLowStock ? 'bg-orange-50' : ''
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
                        {['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(product.name) ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 inline-flex items-center space-x-1">
                            <span>{product.name === 'Hard Bound' ? 'Service Only' : 'Made to Order'}</span>
                          </span>
                        ) : product.options && product.options.length > 0 ? (
                          <div className="flex flex-col space-y-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 inline-block w-fit">
                              Has Variants
                            </span>
                            {product.variants && (() => {
                              const totalStock = Object.values(product.variants).reduce((sum, v) => sum + v.stock, 0);
                              const stockLevel = totalStock === 0 ? 'out' : totalStock <= 10 ? 'critical' : totalStock <= 30 ? 'low' : totalStock <= 50 ? 'medium' : 'high';
                              
                              // Find low stock variants (≤10 units)
                              const lowStockVariants = Object.entries(product.variants)
                                .filter(([_, variant]) => variant.stock <= 10)
                                .map(([key, variant]) => ({
                                  key,
                                  stock: variant.stock,
                                  options: variant.options
                                }));
                              
                              return (
                                <div className="space-y-1">
                                  {/* Overall Stock Status */}
                                  <div className="flex items-center space-x-2">
                                    {stockLevel === 'out' && (
                                      <>
                                        <AlertTriangle size={16} className="text-red-600" />
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                          Out of Stock
                                        </span>
                                      </>
                                    )}
                                    {stockLevel === 'critical' && (
                                      <>
                                        <AlertTriangle size={16} className="text-red-600" />
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                          Critical: {totalStock} units
                                        </span>
                                      </>
                                    )}
                                    {stockLevel === 'low' && (
                                      <>
                                        <TrendingDown size={16} className="text-orange-600" />
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                          Low Stock: {totalStock} units
                                        </span>
                                      </>
                                    )}
                                    {stockLevel === 'medium' && (
                                      <>
                                        <TrendingUp size={16} className="text-yellow-600" />
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                          Medium: {totalStock} units
                                        </span>
                                      </>
                                    )}
                                    {stockLevel === 'high' && (
                                      <>
                                        <TrendingUp size={16} className="text-green-600" />
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                          Good Stock: {totalStock} units
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  
                                  {/* Low Stock Variants Warning */}
                                  {lowStockVariants.length > 0 && (
                                    <div className="pl-6 space-y-0.5">
                                      {lowStockVariants.slice(0, 3).map((variant, idx) => {
                                        const variantLabel = Object.entries(variant.options)
                                          .map(([, val]) => `${val}`)
                                          .join(', ');
                                        return (
                                          <div key={idx} className="flex items-center space-x-1">
                                            <AlertTriangle size={12} className={variant.stock === 0 ? 'text-red-500' : 'text-orange-500'} />
                                            <span className={`text-xs ${variant.stock === 0 ? 'text-red-600 font-semibold' : 'text-orange-600'}`}>
                                              {variantLabel}: {variant.stock} units
                                            </span>
                                          </div>
                                        );
                                      })}
                                      {lowStockVariants.length > 3 && (
                                        <span className="text-xs text-slate-500 italic">
                                          +{lowStockVariants.length - 3} more low
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          (() => {
                            const stockLevel = product.stock === 0 ? 'out' : product.stock <= 10 ? 'critical' : product.stock <= 30 ? 'low' : product.stock <= 50 ? 'medium' : 'high';
                            
                            return (
                              <div className="flex items-center space-x-2">
                                {stockLevel === 'out' && (
                                  <>
                                    <AlertTriangle size={16} className="text-red-600" />
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                      Out of Stock
                                    </span>
                                  </>
                                )}
                                {stockLevel === 'critical' && (
                                  <>
                                    <AlertTriangle size={16} className="text-red-600" />
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                      Critical: {product.stock} units
                                    </span>
                                  </>
                                )}
                                {stockLevel === 'low' && (
                                  <>
                                    <TrendingDown size={16} className="text-orange-600" />
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                      Low Stock: {product.stock} units
                                    </span>
                                  </>
                                )}
                                {stockLevel === 'medium' && (
                                  <>
                                    <TrendingUp size={16} className="text-yellow-600" />
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                      Medium: {product.stock} units
                                    </span>
                                  </>
                                )}
                                {stockLevel === 'high' && (
                                  <>
                                    <TrendingUp size={16} className="text-green-600" />
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                      Good Stock: {product.stock} units
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })()
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmModal({ show: true, product });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
              {products.filter((product) => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  product.name.toLowerCase().includes(query) ||
                  product.sku.toLowerCase().includes(query) ||
                  product.category.toLowerCase().includes(query)
                );
              }).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-500">
                    {searchQuery ? `No products found matching "${searchQuery}"` : 'No products yet'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stock Intake Tab Content */}
        {activeTab === 'stock-intake' && (
          <div className="space-y-6">
          {/* Stock Intake Form */}
          {showStockIntakeForm && (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-slide-in-right">
              <h3 className="text-lg font-semibold mb-6 text-slate-900">Record New Stock Intake</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Product Selection */}
                <div className="relative">
                  <select
                    value={stockIntakeFormData.productId}
                    onChange={(e) => {
                      const selectedProduct = products.find(p => p.id === e.target.value);
                      setStockIntakeFormData({
                        ...stockIntakeFormData,
                        productId: e.target.value,
                        productName: selectedProduct?.name || '',
                        sellingPrice: selectedProduct?.price || 0,
                        selectedVariant: {}, // Reset variant selection when product changes
                      });
                    }}
                    className="peer w-full px-4 pt-6 pb-2 border-2 border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200 transition-all duration-300 hover:border-purple-400 hover:shadow-md cursor-pointer appearance-none"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                  <label className="absolute left-4 top-2 text-xs font-semibold text-purple-600 transition-all duration-300">
                    Product
                  </label>
                </div>

                {/* Variant Selection - Show if product has options */}
                {stockIntakeFormData.productId && (() => {
                  const selectedProduct = products.find(p => p.id === stockIntakeFormData.productId);
                  if (selectedProduct?.options && selectedProduct.options.length > 0) {
                    return selectedProduct.options.map((option) => (
                      <div key={option.id} className="relative">
                        <select
                          value={stockIntakeFormData.selectedVariant[option.id] || ''}
                          onChange={(e) => {
                            const selectedChoice = e.target.value;
                            
                            // Extract price from choice if it exists (e.g., "Yellow (₱150)" -> 150)
                            const priceMatch = selectedChoice.match(/\(₱(\d+)\)/);
                            const variantPrice = priceMatch ? parseFloat(priceMatch[1]) : null;
                            
                            setStockIntakeFormData({
                              ...stockIntakeFormData,
                              selectedVariant: {
                                ...stockIntakeFormData.selectedVariant,
                                [option.id]: selectedChoice,
                              },
                              // Update selling price if variant has a specific price
                              sellingPrice: variantPrice !== null ? variantPrice : stockIntakeFormData.sellingPrice,
                            });
                          }}
                          className="peer w-full px-4 pt-6 pb-2 border-2 border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200 transition-all duration-300 hover:border-purple-400 hover:shadow-md cursor-pointer appearance-none"
                        >
                          <option value="">Select {option.label}</option>
                          {option.choices.map((choice) => {
                            // Remove price from display (e.g., "4 (₱350)" becomes "4")
                            const displayChoice = choice.replace(/\s*\(₱\d+\)/, '');
                            return (
                              <option key={choice} value={choice}>
                                {displayChoice}
                              </option>
                            );
                          })}
                        </select>
                        <label className="absolute left-4 top-2 text-xs font-semibold text-purple-600 transition-all duration-300">
                          {option.label}
                        </label>
                      </div>
                    ));
                  }
                  return null;
                })()}

                {/* Quantity Received */}
                <FloatingInput
                  label="Quantity Received"
                  type="number"
                  value={stockIntakeFormData.quantity.toString()}
                  onChange={(e) =>
                    setStockIntakeFormData({ ...stockIntakeFormData, quantity: parseInt(e.target.value) || 0 })
                  }
                  focusColor="purple"
                />

                {/* Cost Per Unit */}
                <FloatingInput
                  label="Cost Per Unit (₱)"
                  type="number"
                  value={stockIntakeFormData.costPerUnit.toString()}
                  onChange={(e) =>
                    setStockIntakeFormData({ ...stockIntakeFormData, costPerUnit: parseFloat(e.target.value) || 0 })
                  }
                  focusColor="purple"
                />

                {/* Selling Price */}
                <FloatingInput
                  label="Selling Price (₱)"
                  type="number"
                  value={stockIntakeFormData.sellingPrice.toString()}
                  onChange={(e) =>
                    setStockIntakeFormData({ ...stockIntakeFormData, sellingPrice: parseFloat(e.target.value) || 0 })
                  }
                  focusColor="purple"
                />

                {/* Supplier */}
                <FloatingInput
                  label="Supplier"
                  value={stockIntakeFormData.supplier}
                  onChange={(e) =>
                    setStockIntakeFormData({ ...stockIntakeFormData, supplier: e.target.value })
                  }
                  focusColor="purple"
                />

                {/* Date Received */}
                <FloatingInput
                  label="Date Received"
                  type="date"
                  value={stockIntakeFormData.dateReceived}
                  onChange={(e) =>
                    setStockIntakeFormData({ ...stockIntakeFormData, dateReceived: e.target.value })
                  }
                  focusColor="purple"
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={stockIntakeFormData.notes}
                  onChange={(e) =>
                    setStockIntakeFormData({ ...stockIntakeFormData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200 transition-all"
                  placeholder="Additional notes about this stock intake..."
                />
              </div>

              {/* Profit Calculation Summary */}
              {stockIntakeFormData.quantity > 0 && stockIntakeFormData.costPerUnit > 0 && stockIntakeFormData.sellingPrice > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-green-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-slate-900 mb-3">Financial Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-600">Total Cost</p>
                      <p className="text-lg font-bold text-slate-900">
                        ₱{(stockIntakeFormData.quantity * stockIntakeFormData.costPerUnit).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Potential Revenue</p>
                      <p className="text-lg font-bold text-slate-900">
                        ₱{(stockIntakeFormData.quantity * stockIntakeFormData.sellingPrice).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Profit Per Unit</p>
                      <p className="text-lg font-bold text-green-600">
                        ₱{(stockIntakeFormData.sellingPrice - stockIntakeFormData.costPerUnit).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Total Profit</p>
                      <p className="text-lg font-bold text-green-600">
                        ₱{(stockIntakeFormData.quantity * (stockIntakeFormData.sellingPrice - stockIntakeFormData.costPerUnit)).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Profit Margin</p>
                      <p className="text-lg font-bold text-purple-600">
                        {((stockIntakeFormData.sellingPrice - stockIntakeFormData.costPerUnit) / stockIntakeFormData.sellingPrice * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={async () => {
                    // Validate form
                    if (!stockIntakeFormData.productId) {
                      showNotification('Please select a product', 'error');
                      return;
                    }
                    if (stockIntakeFormData.quantity <= 0) {
                      showNotification('Please enter a valid quantity', 'error');
                      return;
                    }
                    if (stockIntakeFormData.costPerUnit <= 0) {
                      showNotification('Please enter a valid cost per unit', 'error');
                      return;
                    }
                    
                    try {
                      const userStr = localStorage.getItem('user');
                      if (!userStr) {
                        showNotification('User not authenticated', 'error');
                        return;
                      }
                      
                      const user = JSON.parse(userStr);

                      // Create new stock intake record
                      const recordData = {
                        productId: stockIntakeFormData.productId,
                        productName: stockIntakeFormData.productName,
                        quantity: Number(stockIntakeFormData.quantity),
                        costPerUnit: Number(stockIntakeFormData.costPerUnit),
                        sellingPrice: Number(stockIntakeFormData.sellingPrice),
                        totalCost: Number(stockIntakeFormData.quantity) * Number(stockIntakeFormData.costPerUnit),
                        potentialRevenue: Number(stockIntakeFormData.quantity) * Number(stockIntakeFormData.sellingPrice),
                        profit: Number(stockIntakeFormData.quantity) * (Number(stockIntakeFormData.sellingPrice) - Number(stockIntakeFormData.costPerUnit)),
                        profitMargin: ((Number(stockIntakeFormData.sellingPrice) - Number(stockIntakeFormData.costPerUnit)) / Number(stockIntakeFormData.sellingPrice) * 100).toFixed(1),
                        supplier: stockIntakeFormData.supplier,
                        notes: stockIntakeFormData.notes,
                        dateReceived: stockIntakeFormData.dateReceived,
                        selectedVariant: stockIntakeFormData.selectedVariant,
                      };
                      
                      // Save to database
                      await apiClient.createStockIntakeRecord(recordData, user.id);
                      
                      // Reload records
                      await loadStockIntakeRecords();
                      
                      // Reload products to reflect updated stock
                      await AppDataSync.loadProductsFromAPI();
                      
                      showNotification('Stock intake recorded and inventory updated!', 'success');
                      setShowStockIntakeForm(false);
                      setStockIntakeFormData({
                        productId: '',
                        productName: '',
                        quantity: 0,
                        costPerUnit: 0,
                        sellingPrice: 0,
                        supplier: '',
                        notes: '',
                        dateReceived: new Date().toISOString().split('T')[0],
                        selectedVariant: {},
                      });
                    } catch (error) {
                      console.error('Failed to save stock intake:', error);
                      showNotification('Failed to save stock intake record', 'error');
                    }
                  }}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-600/50 hover:scale-105 transition-all duration-300 active:scale-95"
                >
                  Record Stock Intake
                </button>
                <button
                  onClick={() => {
                    setShowStockIntakeForm(false);
                    setStockIntakeFormData({
                      productId: '',
                      productName: '',
                      quantity: 0,
                      costPerUnit: 0,
                      sellingPrice: 0,
                      supplier: '',
                      notes: '',
                      dateReceived: new Date().toISOString().split('T')[0],
                      selectedVariant: {},
                    });
                  }}
                  className="bg-slate-200 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-300 hover:shadow-md hover:scale-105 transition-all duration-300 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Stock Intake Records Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Quantity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Cost/Unit</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Selling Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Total Cost</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Profit</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {stockIntakeRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      <Package size={48} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-semibold">No stock intake records yet</p>
                      <p className="text-sm mt-2">Click "Record Stock Intake" to add your first entry</p>
                    </td>
                  </tr>
                ) : (
                  stockIntakeRecords.map((record) => {
                    // Ensure numeric values are properly converted
                    const costPerUnit = Number(record.cost_per_unit || record.costPerUnit || 0);
                    const sellingPrice = Number(record.selling_price || record.sellingPrice || 0);
                    const totalCost = Number(record.total_cost || record.totalCost || 0);
                    const profit = Number(record.profit || 0);
                    const quantity = Number(record.quantity || 0);
                    const dateReceived = record.date_received || record.dateReceived;
                    const productName = record.product_name || record.productName;
                    const selectedVariant = record.selected_variant || record.selectedVariant;
                    
                    return (
                    <tr key={record.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {new Date(dateReceived).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        <div>{productName}</div>
                        {selectedVariant && Object.keys(selectedVariant).length > 0 && (
                          <div className="text-xs text-slate-500 mt-1">
                            {Object.entries(selectedVariant).map(([, value]) => {
                              // Remove price from variant display
                              const cleanValue = String(value).replace(/\s*\(₱\d+\)/, '');
                              return cleanValue;
                            }).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">{quantity} units</td>
                      <td className="px-6 py-4 text-sm text-slate-900">₱{costPerUnit.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">₱{sellingPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        ₱{totalCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ₱{profit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{record.supplier || '-'}</td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && deleteConfirmModal.product && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Delete Product</h3>
                  <p className="text-sm text-slate-600">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              <p className="text-slate-700 mb-4">
                Are you sure you want to delete <span className="font-semibold text-slate-900">"{deleteConfirmModal.product.name}"</span>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently remove the product from your inventory. All associated data will be lost.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-2xl">
              <button
                onClick={() => setDeleteConfirmModal({ show: false, product: null })}
                className="px-5 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmModal.product) {
                    deleteProduct(deleteConfirmModal.product.id);
                    await AppDataSync.deleteProductFromAPI(deleteConfirmModal.product.id);
                    showNotification(`${deleteConfirmModal.product.name} deleted successfully`, 'success');
                    setDeleteConfirmModal({ show: false, product: null });
                  }
                }}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
              >
                <Trash2 size={18} />
                <span>Delete Product</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-scale-in flex flex-col">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Edit Product - {editingProduct.name}</h2>
              <p className="text-sm text-slate-600 mt-1">SKU: {editingProduct.sku}</p>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                  
                  {/* Base Price */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Base Price (₱)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Total Stock (if no variants) */}
                  {(!editingProduct.options || editingProduct.options.length === 0) && !['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(editingProduct.name) && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          stock: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                      />
                    </div>
                  )}

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editingProduct.category}
                      disabled
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600 cursor-not-allowed capitalize"
                    />
                  </div>

                  {/* Note - Editable */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Product Note
                    </label>
                    <textarea
                      value={editingProduct.note || ''}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        note: e.target.value
                      })}
                      placeholder="Add a note for customers (e.g., sizing instructions, special requirements)"
                      rows={4}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      This note will be displayed to customers on the product page
                    </p>
                  </div>


                </div>

                {/* Right Column - Variant Stock Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {editingProduct.options && editingProduct.options.length > 0 
                      ? 'Variant Stock Management' 
                      : 'Product Details'}
                  </h3>

                  {/* Check if product is made-to-order (no stock tracking needed) */}
                  {['Type A & B Uniform', 'Gala', 'BSNAME Uniform'].includes(editingProduct.name) ? (
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-2">Made-to-Order Product</h4>
                          <p className="text-sm text-blue-800">
                            This product is tailored/made-to-order and does not require stock tracking. 
                            Customers will register at the Coop office for size fitting and tailoring.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : editingProduct.name === 'Hard Bound' ? (
                    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-2">Service Only</h4>
                          <p className="text-sm text-blue-800">
                            Hard Bound is a binding service. Students bring their printed pages to the Coop office for binding. 
                            No physical stock tracking is needed for this service.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : editingProduct.options && editingProduct.options.length > 0 ? (
                    <div className="bg-slate-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                      <p className="text-sm text-slate-600 mb-4">
                        Set individual stock quantities for each variant combination:
                      </p>
                      
                      {/* Generate all variant combinations */}
                      {(() => {
                        // Helper function to generate all combinations
                        const generateCombinations = (options: any[]) => {
                          if (options.length === 0) return [{}];
                          if (options.length === 1) {
                            return options[0].choices.map((choice: string) => ({
                              [options[0].id]: choice  // Use id instead of label
                            }));
                          }
                          
                          const [first, ...rest] = options;
                          const restCombinations = generateCombinations(rest);
                          const combinations: any[] = [];
                          
                          first.choices.forEach((choice: string) => {
                            restCombinations.forEach((restCombo: any) => {
                              combinations.push({
                                [first.id]: choice,  // Use id instead of label
                                ...restCombo
                              });
                            });
                          });
                          
                          return combinations;
                        };

                        const combinations = generateCombinations(editingProduct.options || []);
                        
                        return (
                          <div className="space-y-3">
                            {combinations.map((combo: Record<string, string>, idx: number) => {
                              const variantKey = Object.entries(combo)
                                .map(([key, val]) => `${key}:${val}`)
                                .join('|');
                              
                              return (
                                <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1">
                                      {Object.entries(combo).map(([key, value], i) => (
                                        <span key={i} className="text-sm">
                                          <span className="font-semibold text-slate-700">{key}:</span>{' '}
                                          <span className="text-slate-600">{value}</span>
                                          {i < Object.entries(combo).length - 1 && <span className="text-slate-400 mx-2">•</span>}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <label className="text-xs font-semibold text-slate-600">Stock:</label>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={variantStocks[variantKey] || 0}
                                      onChange={(e) => {
                                        const newStock = parseInt(e.target.value) || 0;
                                        setVariantStocks(prev => ({
                                          ...prev,
                                          [variantKey]: newStock
                                        }));
                                      }}
                                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                      min="0"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                      
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <strong>Note:</strong> Each variant combination requires its own stock quantity. 
                          The total stock will be calculated automatically.
                        </p>
                      </div>

                      {/* Total Stock Summary */}
                      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-purple-900">Total Stock (All Variants):</span>
                          <span className="text-2xl font-bold text-purple-600">
                            {Object.values(variantStocks).reduce((sum, stock) => sum + stock, 0)} units
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-600">
                        This product has no variants. Stock is managed as a single quantity.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-6 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all shadow-lg hover:scale-105"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

