import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, ShoppingCart, Filter, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/uiStore';
import { useAuth } from '../store/authContext';
import { AppDataSync } from '../store/appDataSync';
import type { Product } from '../types';

const cartButtonStyles = `
  @keyframes cart-pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15);
    }
    100% {
      transform: scale(1);
    }
  }

  .cart-animate {
    animation: cart-pulse 0.4s ease-in-out;
  }
`;

export const MerchandisePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [cartAnimating, setCartAnimating] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const { products, addToCart } = useAppStore();
  const { showNotification } = useUIStore();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'uniform', label: 'Uniforms' },
    { value: 'accessory', label: 'Accessories' },
    { value: 'equipment', label: 'Equipment' },
  ];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper function to extract prices from choice text like "Yellow (₱150)" or "Bundle A (₱1,200 / ₱1,150 Member)"
  const extractPrice = (choiceText: string): number | null => {
    const match = choiceText.match(/₱([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : null;
  };

  // Function to get available prices from a product's options
  const getAvailablePrices = (product: Product): { min: number; max: number } | null => {
    if (!product.options || product.options.length === 0) return null;
    
    const prices = product.options
      .flatMap(option => option.choices)
      .map(choice => extractPrice(choice))
      .filter((price): price is number => price !== null);
    
    if (prices.length === 0) return null;
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  // Function to get the current selected price based on the selected option
  const getSelectedPrice = (product: Product, selectedOpts: Record<string, string>): number | null => {
    if (!product.options || product.options.length === 0) return null;
    
    // Check all options for a selected value and extract its price
    for (const option of product.options) {
      if (selectedOpts[option.id]) {
        const price = extractPrice(selectedOpts[option.id]);
        if (price !== null) return price;
      }
    }
    return null;
  };

  const handleAddToCart = (product: Product) => {
    // Check if product has required options
    if (product.options && product.options.length > 0) {
      // Check if all required options have been selected
      const missingOptions = product.options.filter(option => !selectedOptions[option.id]);
      
      if (missingOptions.length > 0) {
        // Create a custom message based on missing option types
        const missingLabels = missingOptions.map(opt => opt.label.toLowerCase());
        let errorMessage = `Please select your ${missingLabels.join(' and ')}`;
        
        showNotification(errorMessage, 'error');
        return;
      }
    }
    
    // Generate a deterministic cart item ID based on product and selected options
    const optionsString = Object.entries(selectedOptions)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    const cartItemId = optionsString ? `${product.id}-${optionsString}` : product.id;
    
    // Add to global cart store
    addToCart({
      id: cartItemId,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image || '📦',
      selectedOptions: { ...selectedOptions },
    });
    
    // Sync cart to API
    if (user?.id) {
      AppDataSync.syncCartToAPI(user.id);
    }
    
    // Trigger cart icon animation
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 400);
    
    // Show success notification
    showNotification(`${product.name} added to cart`, 'success');
    
    setSelectedProduct(null);
    setSelectedOptions({});
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 animate-slide-in-right">
      <style>{cartButtonStyles}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">MERCHANDISE</h1>
            <p className="text-slate-600 mt-1">Discover UC Coop's exclusive products</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              ref={cartButtonRef}
              onClick={() => navigate('/cart')}
              className={`relative p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 hover:scale-110 transition-all duration-300 ${
                cartAnimating ? 'cart-animate' : ''
              }`}
            >
              <ShoppingCart size={24} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8 flex gap-4 items-center">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg hover:shadow-purple-600/50 hover:scale-105 transition-all duration-300 font-medium"
          >
            <Filter size={20} />
            <span>Filter</span>
          </button>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full px-6 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:border-purple-500 focus:ring-purple-200 transition-all duration-300 ${
                searchFocused ? 'animate-bounce' : ''
              }`}
              style={{
                animation: searchFocused ? 'inputBounce 0.3s ease-out' : 'none',
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="mb-8 bg-white border border-slate-200 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Filter by Category</h3>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => {
                    setSelectedCategory(category.value);
                  }}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    selectedCategory === category.value
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md hover:shadow-lg hover:shadow-purple-600/50'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="mb-6 text-sm text-slate-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 flex flex-col"
            >
              {/* Product Image */}
              <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-6xl relative overflow-hidden group">
                <span className="group-hover:scale-110 transition-transform duration-300">
                  {product.image || '📦'}
                </span>
                {!product.available && (
                  <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Unavailable</span>
                  </div>
                )}
                {product.stock <= 0 && product.available !== false && product.name !== 'Type A & B Uniform' && product.name !== 'Gala' && product.name !== 'BSNAME Uniform' && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <span className="text-white font-bold">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-sm">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="mb-3">
                  {(() => {
                    const availablePrices = getAvailablePrices(product);
                    if (availablePrices) {
                      // If min and max are the same, display single price
                      if (availablePrices.min === availablePrices.max) {
                        return <p className="text-lg font-bold text-slate-900">₱{availablePrices.min}</p>;
                      }
                      return <p className="text-lg font-bold text-slate-900">₱{availablePrices.min}-{availablePrices.max}</p>;
                    }
                    return <p className="text-lg font-bold text-slate-900">₱{product.price.toLocaleString()}</p>;
                  })()}
                </div>

                {/* Stock */}
                {product.name !== 'Type A & B Uniform' && product.name !== 'Hard Bound' && product.name !== 'Gala' && product.name !== 'BSNAME Uniform' && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-600">
                      Stock: <span className={product.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {product.stock}
                      </span>
                    </p>
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* View Button */}
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setSelectedOptions({});
                  }}
                  disabled={!product.available && product.available !== undefined}
                  className="w-full bg-purple-900 text-white py-2 rounded-lg font-semibold hover:bg-purple-950 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye size={18} />
                  <span>View</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 text-lg">No products found.</p>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto">

            <div className="flex flex-col gap-6">
              {/* Product Image */}
              <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center text-8xl">
                {selectedProduct.image || '📦'}
              </div>

              {/* Product Details */}
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  {selectedProduct.name}
                </h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">SKU</p>
                    <p className="font-mono bg-slate-100 p-2 rounded text-slate-900">
                      {selectedProduct.sku}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Category</p>
                    <p className="text-slate-900 font-semibold capitalize">
                      {selectedProduct.category}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Price</p>
                    {(() => {
                      const availablePrices = getAvailablePrices(selectedProduct);
                      const selectedPrice = getSelectedPrice(selectedProduct, selectedOptions);
                      
                      if (availablePrices && selectedPrice) {
                        // Show selected price when a size/color is chosen
                        return <p className="text-3xl font-bold text-slate-900">₱{selectedPrice.toLocaleString()}</p>;
                      } else if (availablePrices) {
                        // Show price range when no size/color is selected
                        // If min and max are the same, display single price
                        if (availablePrices.min === availablePrices.max) {
                          return <p className="text-3xl font-bold text-slate-900">₱{availablePrices.min}</p>;
                        }
                        return <p className="text-3xl font-bold text-slate-900">₱{availablePrices.min}-{availablePrices.max}</p>;
                      } else {
                        // Fallback to base price if no options
                        return <p className="text-3xl font-bold text-slate-900">₱{selectedProduct.price.toLocaleString()}</p>;
                      }
                    })()}
                  </div>

                  {selectedProduct.name !== 'Type A & B Uniform' && selectedProduct.name !== 'Hard Bound' && selectedProduct.name !== 'Gala' && selectedProduct.name !== 'BSNAME Uniform' && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Stock Available</p>
                      <p className={`text-lg font-bold ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedProduct.stock > 0 ? `${selectedProduct.stock} units` : 'Out of Stock'}
                      </p>
                    </div>
                  )}

                  {/* Note */}
                  {selectedProduct.note && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">{selectedProduct.note}</p>
                    </div>
                  )}

                  {/* Options */}
                  {selectedProduct.options && selectedProduct.options.length > 0 && (
                    <div className="pt-4 border-t border-slate-200">
                      {selectedProduct.options.map((option) => (
                        <div key={option.id} className="mb-4">
                          <p className="text-sm text-slate-600 mb-3 font-semibold">{option.label}</p>
                          <div className="flex flex-wrap gap-2">
                            {option.choices.map((choice) => {
                              // Extract just the label without the price info
                              const label = choice.split('(')[0].trim();
                              return (
                                <button
                                  key={choice}
                                  onClick={() =>
                                    setSelectedOptions({
                                      ...selectedOptions,
                                      [option.id]: choice,
                                    })
                                  }
                                  className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                                    selectedOptions[option.id] === choice
                                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                    }}
                    disabled={selectedProduct.stock <= 0 || !selectedProduct.available}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover:scale-105"
                  >
                    <ShoppingCart size={20} />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="flex-1 bg-slate-200 text-slate-900 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
