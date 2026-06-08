import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, ShoppingCart, Filter, X, Eye } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/uiStore';
import { useAuth } from '../store/authContext';
import { AppDataSync } from '../store/appDataSync';
import { Z_INDEX } from '../constants/zIndex';
import type { Product } from '../types';
import { PRODUCT_IMAGES } from '../constants/cloudinaryAssets';

// Destructure or map individual product images from PRODUCT_IMAGES
const typeABUniformImage = PRODUCT_IMAGES['Type A & B Uniform'];
const bsnameImage = PRODUCT_IMAGES['BSNAME Uniform'];
const peShirtImage = PRODUCT_IMAGES['PE Shirt'];
const pePantsImage = PRODUCT_IMAGES['PE Pants'];
const plottingSheetImage = PRODUCT_IMAGES['Plotting Sheet'];
const peShortsImage = PRODUCT_IMAGES['PE Shorts'];
const buttonsImage = PRODUCT_IMAGES['Buttons'];
const anchorImage = PRODUCT_IMAGES['Anchor'];
const propellerImage = PRODUCT_IMAGES['Propeller'];
const whiteShoesImage = PRODUCT_IMAGES['White Shoes '];
const safetyGogglesImage = PRODUCT_IMAGES['Goggles'];
const blackBeltImage = PRODUCT_IMAGES['Black Belt'];
const rotcManualImage = PRODUCT_IMAGES['ROTC Manual'];
const rotcManualPart1Image = PRODUCT_IMAGES['ROTC Manual Part 1'];
const hardhatBlueImage = PRODUCT_IMAGES['Hardhat-Blue'];
const lanyardSHSImage = PRODUCT_IMAGES['Lanyard-SHS'];
const galaBundleBImage = PRODUCT_IMAGES['Gala Bundle B'];
const galaBundleCImage = PRODUCT_IMAGES['Gala Bundle C'];
const galaBundleDImage = PRODUCT_IMAGES['Gala Bundle D'];
const galaBundleEImage = PRODUCT_IMAGES['Gala Bundle E'];
const galaBundleFImage = PRODUCT_IMAGES['Gala Bundle F'];
const galaBundleGImage = PRODUCT_IMAGES['Gala Bundle G'];
const galaBundleHImage = PRODUCT_IMAGES['Gala Bundle H'];


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

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-30px);
    }
  }

  .animate-slide-down {
    animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .animate-slide-up {
    animation: slideUp 0.3s cubic-bezier(0.4, 0, 1, 1);
  }
`;

export const MerchandisePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isFilterClosing, setIsFilterClosing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [paymentType, setPaymentType] = useState<'full' | 'downpayment'>('full');
  const [orderType, setOrderType] = useState<'regular' | 'preorder'>('regular');
  const [cartAnimating, setCartAnimating] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const { products, addToCart } = useAppStore();
  const { showNotification, setSidebarOpen } = useUIStore();

  // Dynamically normalize products' options when the database prices are edited
  const normalizedProducts = useMemo(() => {
    return products.map(product => {
      if (!product.options || product.options.length === 0) return product;
      
      const newOptions = product.options.map(option => {
        // Extract all prices from the choices of this option
        const prices = option.choices
          .map(c => {
            const match = c.match(/₱([\d,]+)/);
            return match ? parseInt(match[1].replace(/,/g, '')) : null;
          })
          .filter((p): p is number => p !== null);
          
        const uniquePrices = Array.from(new Set(prices));
        const isConstantPrice = uniquePrices.length === 1;
        
        if (isConstantPrice) {
          const oldPrice = uniquePrices[0];
          const newPrice = product.price;
          
          if (oldPrice !== newPrice) {
            const newChoices = option.choices.map(choice => {
              const oldPriceStr = oldPrice.toLocaleString();
              const newPriceStr = newPrice.toLocaleString();
              return choice.replace(new RegExp(`₱${oldPriceStr}`, 'g'), `₱${newPriceStr}`);
            });
            
            return {
              ...option,
              choices: newChoices
            };
          }
        }
        
        return option;
      });
      
      // Also check variants keys and values, and normalize them!
      let newVariants = product.variants;
      if (product.variants && Object.keys(product.variants).length > 0) {
        newVariants = {};
        Object.entries(product.variants).forEach(([key, variant]) => {
          let newKey = key;
          const newVariantOptions = { ...variant.options };
          
          product.options!.forEach(opt => {
            const prices = opt.choices
              .map(c => {
                const match = c.match(/₱([\d,]+)/);
                return match ? parseInt(match[1].replace(/,/g, '')) : null;
              })
              .filter((p): p is number => p !== null);
              
            const uniquePrices = Array.from(new Set(prices));
            if (uniquePrices.length === 1 && uniquePrices[0] !== product.price) {
              const oldPriceStr = uniquePrices[0].toLocaleString();
              const newPriceStr = product.price.toLocaleString();
              
              newKey = newKey.replace(new RegExp(`₱${oldPriceStr}`, 'g'), `₱${newPriceStr}`);
              if (newVariantOptions[opt.id]) {
                newVariantOptions[opt.id] = newVariantOptions[opt.id].replace(
                  new RegExp(`₱${oldPriceStr}`, 'g'),
                  `₱${newPriceStr}`
                );
              }
            }
          });
          
          newVariants![newKey] = {
            ...variant,
            options: newVariantOptions
          };
        });
      }
      
      return {
        ...product,
        options: newOptions,
        variants: newVariants
      };
    });
  }, [products]);

  // Check for product from navigation state (from GlobalSearch)
  useEffect(() => {
    if (location.state?.selectedProduct) {
      const found = normalizedProducts.find(p => p.sku === location.state.selectedProduct.sku);
      setSelectedProduct(found || location.state.selectedProduct);
      setSelectedOptions({});
      setPaymentType('full');
      // Clear the state so it doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, normalizedProducts]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    // Load products from API
    AppDataSync.loadProductsFromAPI();
    
    // Set up polling to reload products every 10 seconds for real-time stock updates
    const interval = setInterval(() => {
      AppDataSync.loadProductsFromAPI();
    }, 10000);
    
    // Cleanup function to close modal when component unmounts
    return () => {
      setSelectedProduct(null);
      clearInterval(interval);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.style.overflow = 'auto';
      }
    };
  }, []);

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'uniform', label: 'Uniforms' },
    { value: 'accessory', label: 'Accessories' },
    { value: 'equipment', label: 'Equipment' },
  ];

  const filteredProducts = normalizedProducts.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper function to extract prices from choice text like "Yellow (₱150)" or "Bundle A (₱1,200 / ₱1,150 Member)"
  const extractPrice = (choiceText: string, isMember: boolean = false): number | null => {
    // Check if there's a member price format: "₱X / ₱Y Member"
    const memberPriceMatch = choiceText.match(/₱([\d,]+)\s*\/\s*₱([\d,]+)\s*Member/);
    
    if (memberPriceMatch) {
      // If member pricing exists, return appropriate price based on membership status
      const regularPrice = parseInt(memberPriceMatch[1].replace(/,/g, ''));
      const memberPrice = parseInt(memberPriceMatch[2].replace(/,/g, ''));
      return isMember ? memberPrice : regularPrice;
    }
    
    // Otherwise, extract the first price found
    const match = choiceText.match(/₱([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : null;
  };

  // Helper function to extract both regular and member prices
  const extractBothPrices = (choiceText: string): { regular: number; member: number | null } | null => {
    const memberPriceMatch = choiceText.match(/₱([\d,]+)\s*\/\s*₱([\d,]+)\s*Member/);
    
    if (memberPriceMatch) {
      const regularPrice = parseInt(memberPriceMatch[1].replace(/,/g, ''));
      const memberPrice = parseInt(memberPriceMatch[2].replace(/,/g, ''));
      return { regular: regularPrice, member: memberPrice };
    }
    
    // No member pricing, just regular price
    const match = choiceText.match(/₱([\d,]+)/);
    if (match) {
      const price = parseInt(match[1].replace(/,/g, ''));
      return { regular: price, member: null };
    }
    
    return null;
  };

  // Function to get available prices from a product's options
  const getAvailablePrices = (product: Product): { min: number; max: number } | null => {
    if (!product.options || product.options.length === 0) return null;
    
    const isMember = user?.membership_status === 'approved';
    const prices = product.options
      .flatMap(option => option.choices)
      .map(choice => extractPrice(choice, isMember))
      .filter((price): price is number => price !== null);
    
    if (prices.length === 0) return null;
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  // Function to get the current selected price based on the selected option
  // Function to get the current selected price based on the selected option
  const getSelectedPrice = (product: Product, selectedOpts: Record<string, string>): number | null => {
    if (!product.options || product.options.length === 0) return null;
    
    const isMember = user?.membership_status === 'approved';
    // Check all options for a selected value and extract its price
    for (const option of product.options) {
      if (selectedOpts[option.id]) {
        const price = extractPrice(selectedOpts[option.id], isMember);
        if (price !== null) return price;
      }
    }
    return null;
  };

  // Function to get the appropriate image based on selected course
  const getProductImage = (product: Product, selectedOpts: Record<string, string>) => {
    // Products with variant images based on options
    if (product.name === 'Type A & B Uniform') {
      return typeABUniformImage;
    }
    
    if (product.name === 'Gala') {
      const bundleOption = selectedOpts['bundle'];
      if (bundleOption) {
        if (bundleOption.includes('Bundle A')) return PRODUCT_IMAGES['Gala Bundle A'];
        if (bundleOption.includes('Bundle B')) return galaBundleBImage;
        if (bundleOption.includes('Bundle C')) return galaBundleCImage;
        if (bundleOption.includes('Bundle D')) return galaBundleDImage;
        if (bundleOption.includes('Bundle E')) return galaBundleEImage;
        if (bundleOption.includes('Bundle F')) return galaBundleFImage;
        if (bundleOption.includes('Bundle G')) return galaBundleGImage;
        if (bundleOption.includes('Bundle H')) return galaBundleHImage;
        if (bundleOption.includes('Bundle I')) return PRODUCT_IMAGES['Gala Bundle I'];
      }
      return PRODUCT_IMAGES['Gala Bundle A']; // Default to Bundle A
    }
    
    if (product.name === 'Type C Uniform') {
      const courseOption = selectedOpts['course'];
      if (courseOption) {
        if (courseOption.includes('BSMT')) return PRODUCT_IMAGES['Type C-BSMT'];
        if (courseOption.includes('BSMARE')) return PRODUCT_IMAGES['Type C-BSMARE'];
        if (courseOption.includes('SHS')) return PRODUCT_IMAGES['Type C-SHS'];
      }
      return PRODUCT_IMAGES['Type C-BSMT']; // Default to BSMT
    }
    
    if (product.name === 'Lanyard') {
      const courseOption = selectedOpts['course'];
      if (courseOption) {
        if (courseOption.includes('BSMT')) return PRODUCT_IMAGES['Lanyard-BSMT'];
        if (courseOption.includes('BSMARE')) return PRODUCT_IMAGES['Lanyard-BSMARE'];
        if (courseOption.includes('SHS')) return lanyardSHSImage;
        if (courseOption.includes('HM')) return PRODUCT_IMAGES['Lanyard-HM'];
        if (courseOption.includes('TM') || courseOption.includes('TOURISM')) return PRODUCT_IMAGES['Lanyard-TM'];
      }
      return PRODUCT_IMAGES['Lanyard-BSMT']; // Default to BSMT
    }
    
    if (product.name === 'Hard Hat') {
      const colorOption = selectedOpts['color'];
      if (colorOption) {
        if (colorOption.includes('Yellow')) return PRODUCT_IMAGES['Hardhat-Yellow'];
        if (colorOption.includes('Blue')) return hardhatBlueImage;
      }
      return PRODUCT_IMAGES['Hardhat-Yellow']; // Default to Yellow
    }
    
    if (product.name === 'Pershing Cap') {
      const courseOption = selectedOpts['course'];
      if (courseOption) {
        if (courseOption.includes('BSMARE')) return PRODUCT_IMAGES['Pershing Cap BSMARE'];
        if (courseOption.includes('BSMT')) return PRODUCT_IMAGES['Pershing Cap'];
      }
      return PRODUCT_IMAGES['Pershing Cap']; // Default to BSMT
    }
    
    if (product.name === 'Cover All') {
      const colorOption = selectedOpts['color'];
      if (colorOption) {
        if (colorOption.includes('Blue')) return PRODUCT_IMAGES['Cover All BLUE'];
        if (colorOption.includes('Orange')) return PRODUCT_IMAGES['Coverall'];
      }
      return PRODUCT_IMAGES['Coverall']; // Default to Orange
    }
    
    if (product.name === 'Belt') {
      const colorOption = selectedOpts['color'];
      if (colorOption) {
        if (colorOption.includes('Black')) return blackBeltImage;
        if (colorOption.includes('White')) return PRODUCT_IMAGES['White Belt'];
      }
      return blackBeltImage; // Default to Black
    }
    
    if (product.name === 'Shoulder Board') {
      const courseOption = selectedOpts['course'];
      if (courseOption) {
        if (courseOption.includes('BSMT')) return PRODUCT_IMAGES['Shoulder board 2'];
        if (courseOption.includes('BSMARE')) return PRODUCT_IMAGES['Shoulder board 1'];
      }
      return PRODUCT_IMAGES['Shoulder board 2']; // Default to BSMT (Shoulder board 2)
    }
    
    if (product.name === 'ROTC Manual') {
      const partOption = selectedOpts['part'];
      if (partOption) {
        if (partOption.includes('Part 1')) return rotcManualPart1Image;
        if (partOption.includes('Part 2')) return rotcManualImage;
      }
      return rotcManualImage; // Default to Part 2 (original)
    }
    
    // Products with single static images
    if (product.name === 'BSNAME Uniform') return bsnameImage
    if (product.name === 'ID Case') return PRODUCT_IMAGES['ID Case'];
    if (product.name === 'Handbag') return PRODUCT_IMAGES['Handbag'];
    if (product.name === 'Hard Bound') return PRODUCT_IMAGES['Hardbound'];
    if (product.name === 'Safety Shoes') return PRODUCT_IMAGES['Safety Shoes'];
    if (product.name === 'Gloves') return PRODUCT_IMAGES['Gloves'];
    if (product.name === 'PE Tshirt') return peShirtImage;
    if (product.name === 'PE Pants') return pePantsImage;
    if (product.name === 'Plotting Sheet') return plottingSheetImage;
    if (product.name === 'PE Short') return peShortsImage;
    if (product.name === 'Buttons') return buttonsImage;
    if (product.name === 'Anchor Pins') return anchorImage;
    if (product.name === 'Propeller Pins') return propellerImage;
    if (product.name === 'Swimming Set') return PRODUCT_IMAGES['Swimming Trunks'];
    if (product.name === 'Swimming Cap') return PRODUCT_IMAGES['Cap'];
    if (product.name === 'CWTS Shirt') return PRODUCT_IMAGES['CWTS Shirt'];
    if (product.name === 'White Shoes') return whiteShoesImage;
    if (product.name === 'Safety Goggles') return safetyGogglesImage;
    if (product.name === 'Rope') return PRODUCT_IMAGES['Rope'];
    
    return null;
  };

  const handleCloseFilter = () => {
    setIsFilterClosing(true);
    setTimeout(() => {
      setShowFilterPanel(false);
      setIsFilterClosing(false);
    }, 300); // Match animation duration
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
    
    // Determine if this is a tailored product
    const isTailoredProduct = ['Gala', 'Type A & B Uniform', 'BSNAME Uniform'].includes(product.name);
    
    // Strict Pre-Order Gate Check
    const isProductOutOfStock = (() => {
      // Skip for made-to-order products
      if (['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(product.name)) {
        return product.allowPreorder === false;
      }
      
      // For products with variants
      if (product.variants && Object.keys(product.variants).length > 0 && product.options && product.options.length > 0) {
        const allOptionsSelected = product.options.every(opt => selectedOptions[opt.id]);
        if (allOptionsSelected) {
          const variantKey = Object.entries(selectedOptions)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key}:${value}`)
            .join('|');
          const variant = product.variants[variantKey];
          return !variant || variant.stock <= 0;
        }
        return false;
      }
      
      // For simple products
      return product.stock <= 0;
    })();

    if (isProductOutOfStock && product.allowPreorder === false) {
      showNotification('Pre-orders are disabled for this product.', 'error');
      return;
    }
    
    // Get the actual full price based on selected options (if any)
    const fullPrice = getSelectedPrice(product, selectedOptions) || product.price;
    
    // Get the actual price (downpayment or full)
    let actualPrice = fullPrice;
    
    // Apply downpayment pricing for tailored products
    if (isTailoredProduct && paymentType === 'downpayment') {
      if (product.name === 'Gala') {
        actualPrice = 500; // Gala downpayment
      } else if (product.name === 'Type A & B Uniform' || product.name === 'BSNAME Uniform') {
        actualPrice = 1500; // Uniform downpayment
      }
    }
    
    // Generate a deterministic cart item ID based on product, selected options, payment type, and order type
    const optionsString = Object.entries(selectedOptions)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    const paymentSuffix = isTailoredProduct ? `-${paymentType}` : '';
    const orderSuffix = orderType === 'preorder' ? '-preorder' : '';
    const cartItemId = `${product.id}${optionsString ? `-${optionsString}` : ''}${paymentSuffix}${orderSuffix}`;
    
    // Get the product image based on selected options
    const productImage = getProductImage(product, selectedOptions);
    
    // Add to global cart store
    addToCart({
      id: cartItemId,
      productId: product.id,
      name: product.name,
      price: actualPrice,
      quantity: 1,
      image: productImage || product.image || '📦',
      selectedOptions: { ...selectedOptions },
      paymentType: isTailoredProduct ? paymentType : undefined,
      orderType: orderType,
      fullPrice: isTailoredProduct && paymentType === 'downpayment' ? fullPrice : undefined,
    });
    
    // Sync cart to API
    if (user?.id) {
      AppDataSync.syncCartToAPI(user.id);
    }
    
    // Trigger cart icon animation
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 400);
    
    // Build notification message with selected options
    let notificationMessage: string = product.name;
    
    // For products with options, add the selected option details
    if (selectedOptions && Object.keys(selectedOptions).length > 0) {
      const optionDetails: string[] = [];
      
      // Add bundle info for Gala
      if (selectedOptions['bundle']) {
        const bundleName = selectedOptions['bundle'].split('(')[0].trim(); // Extract "Bundle A" from "Bundle A (₱1,200 / ₱1,150 Member)"
        optionDetails.push(bundleName);
      }
      
      // Add course info if not Gala (for Gala, course is less important than bundle)
      if (selectedOptions['course'] && !selectedOptions['bundle']) {
        optionDetails.push(selectedOptions['course']);
      }
      
      // Add part info for ROTC Manual
      if (selectedOptions['part']) {
        const partName = selectedOptions['part'].split('(')[0].trim(); // Extract "Part 1" from "Part 1 (₱150)"
        optionDetails.push(partName);
      }
      
      // Add color info
      if (selectedOptions['color']) {
        const colorName = selectedOptions['color'].split('(')[0].trim();
        optionDetails.push(colorName);
      }
      
      // Add size info
      if (selectedOptions['size']) {
        const sizeName = selectedOptions['size'].split('(')[0].trim();
        optionDetails.push(`Size ${sizeName}`);
      }
      
      if (optionDetails.length > 0) {
        notificationMessage = `${product.name} - ${optionDetails.join(', ')}`;
      }
    }
    
    // Add payment type info for tailored products
    if (isTailoredProduct) {
      notificationMessage += ` (${paymentType === 'downpayment' ? 'Downpayment' : 'Full Payment'})`;
    }
    
    // Add pre-order info
    if (orderType === 'preorder') {
      notificationMessage += ' - Pre-Order';
    }
    
    // Show success notification
    showNotification(`${notificationMessage} added to cart`, 'success');
    
    setSelectedProduct(null);
    setSelectedOptions({});
    setPaymentType('full');
    setOrderType('regular');
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 animate-slide-in-right">
      <style>{cartButtonStyles}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">MERCHANDISE</h1>
              <p className="text-slate-600 mt-1">Discover UC Coop's exclusive products</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                ref={cartButtonRef}
                onClick={() => {
                  setSelectedProduct(null); // Close any open product modal
                  navigate('/cart');
                }}
                className={`relative p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 hover:scale-110 transition-all duration-300 ${
                  cartAnimating ? 'cart-animate' : ''
                }`}
              >
                <ShoppingCart size={24} />
              </button>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-purple-100 rounded-xl shadow-sm hover:bg-purple-50 hover:shadow-md transition-all duration-200 active:scale-95"
                  aria-label="Open menu"
                >
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-slate-900 tracking-wide leading-none">MERCHANDISE</h1>
              </div>
              <button
                ref={cartButtonRef}
                onClick={() => {
                  setSelectedProduct(null);
                  navigate('/cart');
                }}
                className={`relative p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/50 active:scale-95 transition-all duration-200 ${
                  cartAnimating ? 'cart-animate' : ''
                }`}
              >
                <ShoppingCart size={20} />
              </button>
            </div>
            <p className="text-slate-600 text-sm mb-3">Discover UC Coop's exclusive products</p>
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
          <div className={`mb-8 bg-white border border-slate-200 rounded-lg shadow-lg p-6 overflow-hidden ${isFilterClosing ? 'animate-slide-up' : 'animate-slide-down'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Filter by Category</h3>
              <button
                onClick={handleCloseFilter}
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
          Showing {filteredProducts.length} of {normalizedProducts.length} products
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 flex flex-col hover:scale-[1.02]"
            >
              {/* Product Image */}
              <div className="h-32 sm:h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative overflow-hidden group">
                {product.name === 'Type A & B Uniform' && typeABUniformImage ? (
                  <img 
                    src={typeABUniformImage} 
                    alt="Type A & B Uniform" 
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Type C Uniform' && PRODUCT_IMAGES['Type C-BSMT'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Type C-BSMT']} 
                    alt="Type C Uniform" 
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'BSNAME Uniform' && PRODUCT_IMAGES['BSNAME Uniform'] ? (
                  <img 
                    src={PRODUCT_IMAGES['BSNAME Uniform']}
                    alt="BSNAME Uniform" 
                    className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Lanyard' ? (
                  <div className="w-full h-full grid grid-cols-3 gap-0.5 p-1 group-hover:scale-110 transition-transform duration-300">
                    <img src={PRODUCT_IMAGES['Lanyard-BSMT']} alt="BSMT" className="w-full h-full object-cover" />
                    <img src={PRODUCT_IMAGES['Lanyard-BSMARE']} alt="BSMARE" className="w-full h-full object-cover" />
                    <img src={PRODUCT_IMAGES['Lanyard-SHS']} alt="SHS" className="w-full h-full object-cover" />
                  </div>
                ) : product.name === 'ID Case' && PRODUCT_IMAGES['ID Case'] ? (
                  <img 
                    src={PRODUCT_IMAGES['ID Case']} 
                    alt="ID Case" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Handbag' && PRODUCT_IMAGES['Handbag'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Handbag']} 
                    alt="Handbag" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Hard Bound' && PRODUCT_IMAGES['Hardbound'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Hardbound']} 
                    alt="Hard Bound" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Safety Shoes' && PRODUCT_IMAGES['Safety Shoes'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Safety Shoes']} 
                    alt="Safety Shoes" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Cover All' && PRODUCT_IMAGES['Coverall'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Coverall']} 
                    alt="Cover All" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Gloves' && PRODUCT_IMAGES['Gloves'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Gloves']} 
                    alt="Gloves" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Hard Hat' && PRODUCT_IMAGES['Hardhat-Yellow'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Hardhat-Yellow']} 
                    alt="Hard Hat" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'PE Tshirt' && peShirtImage ? (
                  <img 
                    src={peShirtImage} 
                    alt="PE Tshirt" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'PE Pants' && pePantsImage ? (
                  <img 
                    src={pePantsImage} 
                    alt="PE Pants" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Pershing Cap' && PRODUCT_IMAGES['Pershing Cap'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Pershing Cap']} 
                    alt="Pershing Cap" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Plotting Sheet' && plottingSheetImage ? (
                  <img 
                    src={plottingSheetImage} 
                    alt="Plotting Sheet" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'PE Short' && peShortsImage ? (
                  <img 
                    src={peShortsImage} 
                    alt="PE Short" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Buttons' && buttonsImage ? (
                  <img 
                    src={buttonsImage} 
                    alt="Buttons" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Anchor Pins' && anchorImage ? (
                  <img 
                    src={anchorImage} 
                    alt="Anchor Pins" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Propeller Pins' && propellerImage ? (
                  <img 
                    src={propellerImage} 
                    alt="Propeller Pins" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Shoulder Board' && PRODUCT_IMAGES['Shoulder board 2'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Shoulder board 2']} 
                    alt="Shoulder Board" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Swimming Set' && PRODUCT_IMAGES['Swimming Trunks'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Swimming Trunks']} 
                    alt="Swimming Set" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Swimming Cap' && PRODUCT_IMAGES['Cap'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Cap']} 
                    alt="Swimming Cap" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'CWTS Shirt' && PRODUCT_IMAGES['CWTS Shirt'] ? (
                  <img 
                    src={PRODUCT_IMAGES['CWTS Shirt']} 
                    alt="CWTS Shirt" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'ROTC Manual' && rotcManualImage ? (
                  <img 
                    src={rotcManualImage} 
                    alt="ROTC Manual" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'White Shoes' && whiteShoesImage ? (
                  <img 
                    src={whiteShoesImage} 
                    alt="White Shoes" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Belt' && blackBeltImage ? (
                  <img 
                    src={blackBeltImage} 
                    alt="Belt" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Safety Goggles' && safetyGogglesImage ? (
                  <img 
                    src={safetyGogglesImage} 
                    alt="Safety Goggles" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Rope' && PRODUCT_IMAGES['Rope'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Rope']} 
                    alt="Rope" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : product.name === 'Gala' && PRODUCT_IMAGES['Gala Bundle A'] ? (
                  <img 
                    src={PRODUCT_IMAGES['Gala Bundle A']} 
                    alt="Gala" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <span className="group-hover:scale-110 transition-transform duration-300">
                    {product.image || '📦'}
                  </span>
                )}
                {product.stock <= 0 && product.name !== 'Type A & B Uniform' && product.name !== 'Gala' && product.name !== 'BSNAME Uniform' && product.name !== 'Hard Bound' && (
                  <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                    <span className="text-white font-bold">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 sm:p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-slate-900 mb-1 sm:mb-2 line-clamp-2 text-xs sm:text-sm h-8 sm:h-10 leading-tight">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="mb-2 sm:mb-3">
                  {(() => {
                    const isMember = user?.membership_status === 'approved';
                    const availablePrices = getAvailablePrices(product);
                    
                    // Check if product has member pricing in any option
                    let hasMemberPricing = false;
                    let regularMin: number | null = null;
                    let regularMax: number | null = null;
                    let memberMin: number | null = null;
                    let memberMax: number | null = null;
                    
                    if (product.options && product.options.length > 0) {
                      for (const option of product.options) {
                        for (const choice of option.choices) {
                          const bothPrices = extractBothPrices(choice);
                          if (bothPrices && bothPrices.member !== null) {
                            hasMemberPricing = true;
                            
                            // Track min/max for both regular and member prices
                            if (regularMin === null || bothPrices.regular < regularMin) {
                              regularMin = bothPrices.regular;
                            }
                            if (regularMax === null || bothPrices.regular > regularMax) {
                              regularMax = bothPrices.regular;
                            }
                            if (memberMin === null || bothPrices.member < memberMin) {
                              memberMin = bothPrices.member;
                            }
                            if (memberMax === null || bothPrices.member > memberMax) {
                              memberMax = bothPrices.member;
                            }
                          }
                        }
                      }
                    }
                    
                    // If member and has member pricing, show both ranges
                    if (isMember && hasMemberPricing && regularMin !== null && regularMax !== null && memberMin !== null && memberMax !== null) {
                      return (
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] sm:text-xs font-bold text-slate-400 line-through">
                            ₱{regularMin.toLocaleString()}-{regularMax.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs sm:text-base font-bold text-green-600">
                              ₱{memberMin.toLocaleString()}-{memberMax.toLocaleString()}
                            </p>
                            <span className="bg-green-100 text-green-700 px-1 py-0.2 rounded text-[8px] sm:text-[10px] font-semibold leading-none">
                              ₱50 OFF
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    if (availablePrices) {
                      // If min and max are the same, display single price
                      if (availablePrices.min === availablePrices.max) {
                        return <p className="text-xs sm:text-base font-bold text-slate-900">₱{availablePrices.min}</p>;
                      }
                      return <p className="text-xs sm:text-base font-bold text-slate-900">₱{availablePrices.min}-{availablePrices.max}</p>;
                    }
                    return <p className="text-xs sm:text-base font-bold text-slate-900">₱{product.price.toLocaleString()}</p>;
                  })()}
                </div>

                {/* Stock */}
                {['Type A & B Uniform', 'Hard Bound', 'Gala', 'BSNAME Uniform'].includes(product.name) ? (
                  <div className="mb-2 sm:mb-4">
                    {product.allowPreorder === false ? (
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-semibold leading-none">
                        Unavailable
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-semibold leading-none">
                        ✓ Made to Order
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mb-2 sm:mb-4">
                    <p className="text-[10px] sm:text-xs text-slate-600 leading-none">
                      Stock: <span className={product.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {product.stock}
                      </span>
                    </p>
                    {product.stock <= 0 && (
                      <p className="text-[9px] sm:text-xs text-purple-600 font-semibold mt-0.5 sm:mt-1 leading-none">
                        {product.allowPreorder !== false ? '✓ Pre-Order' : 'Unavailable'}
                      </p>
                    )}
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* View Button */}
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setSelectedOptions({});
                    setPaymentType('full');
                    // Automatically set to pre-order if product is out of stock (excluding made-to-order products) and pre-order is allowed
                    const isMadeToOrder = ['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(product.name);
                    const isOutOfStock = isMadeToOrder ? (product.allowPreorder === false) : (product.stock <= 0);
                    const canPreorder = product.allowPreorder !== false;
                    setOrderType((isOutOfStock && canPreorder) ? 'preorder' : 'regular');
                  }}
                  className="w-full bg-purple-900 text-white py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-purple-950 active:scale-[0.97] transition-all duration-200 flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye size={16} />
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

      {/* Modal Portal - Renders outside Layout to be truly fixed */}
      {selectedProduct && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
          style={{ 
            zIndex: Z_INDEX.GENERAL_MODAL
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full animate-scale-in max-h-[90vh] md:max-h-[85vh] flex flex-col md:flex-row relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 z-30 w-9 h-9 flex items-center justify-center bg-slate-100/95 backdrop-blur-sm hover:bg-slate-200 active:scale-90 rounded-full shadow-md transition-all duration-200 hover:scale-110"
              aria-label="Close modal"
            >
              <X size={20} className="text-slate-700" />
            </button>
            
            {/* Modal content - reuse the same content structure */}
            <div className="w-full md:w-2/5 bg-slate-200 flex items-center justify-center p-4 md:p-8 flex-shrink-0 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
              {(selectedProduct.name === 'Type A & B Uniform' || selectedProduct.name === 'Type C Uniform' || selectedProduct.name === 'Lanyard' || selectedProduct.name === 'Hard Hat' || selectedProduct.name === 'Pershing Cap' || selectedProduct.name === 'Cover All' || selectedProduct.name === 'Belt' || selectedProduct.name === 'Shoulder Board' || selectedProduct.name === 'Gala' || selectedProduct.name === 'ROTC Manual') ? (
                <img 
                  key={getProductImage(selectedProduct, selectedOptions)}
                  src={getProductImage(selectedProduct, selectedOptions) || typeABUniformImage} 
                  alt={selectedProduct.name} 
                  className={`w-auto md:w-full h-32 md:h-auto rounded-xl shadow-md md:shadow-2xl animate-slide-in-right object-contain ${
                    selectedProduct.name === 'Gala' ? 'max-h-[140px] md:max-h-[600px]' : 'max-h-[140px] md:max-h-[500px]'
                  }`}
                />
              ) : (
                <img 
                  src={getProductImage(selectedProduct, selectedOptions) || typeABUniformImage} 
                  alt={selectedProduct.name} 
                  className="w-auto md:w-full h-32 md:h-auto max-h-[140px] md:max-h-[500px] object-contain rounded-xl shadow-md md:shadow-2xl"
                />
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 pr-8">
                {selectedProduct.name}
              </h2>

              <div className="space-y-3 mb-4 flex-1">
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
                    const isMember = user?.membership_status === 'approved';
                    const isTailoredProduct = ['Gala', 'Type A & B Uniform', 'BSNAME Uniform'].includes(selectedProduct.name);
                    const availablePrices = getAvailablePrices(selectedProduct);
                    const selectedPrice = getSelectedPrice(selectedProduct, selectedOptions);
                    
                    // Calculate display price based on payment type for tailored products
                    let displayPrice = selectedPrice;
                    if (isTailoredProduct && paymentType === 'downpayment') {
                      if (selectedProduct.name === 'Gala') {
                        displayPrice = 500; // Gala downpayment
                      } else if (selectedProduct.name === 'Type A & B Uniform' || selectedProduct.name === 'BSNAME Uniform') {
                        displayPrice = 1500; // Uniform downpayment
                      }
                    }
                    
                    // Check if selected option has member pricing - prioritize bundle option for Gala
                    let selectedOptionText = '';
                    if (selectedProduct.options && selectedProduct.options.length > 0) {
                      // For Gala, check bundle option first (which has pricing)
                      const bundleOption = selectedProduct.options.find(opt => opt.id === 'bundle');
                      if (bundleOption && selectedOptions['bundle']) {
                        selectedOptionText = selectedOptions['bundle'];
                      } else {
                        // For other products, check any selected option
                        for (const option of selectedProduct.options) {
                          if (selectedOptions[option.id]) {
                            selectedOptionText = selectedOptions[option.id];
                            break;
                          }
                        }
                      }
                    }
                    
                    const bothPrices = selectedOptionText ? extractBothPrices(selectedOptionText) : null;
                    
                    // If downpayment is selected for tailored products, show ONLY downpayment price in black
                    if (isTailoredProduct && paymentType === 'downpayment' && displayPrice) {
                      return (
                        <div className="flex items-center gap-3">
                          <p className="text-3xl font-bold text-slate-900">₱{displayPrice.toLocaleString()}</p>
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-semibold">
                            Downpayment
                          </span>
                        </div>
                      );
                    }
                    
                    // If we have both prices and user is a member, show the discount
                    if (bothPrices && bothPrices.member !== null && isMember && selectedPrice) {
                      const discountAmount = bothPrices.regular - bothPrices.member;
                      return (
                        <div className="flex flex-col gap-1">
                          <p className="text-2xl font-bold text-slate-400 line-through">₱{bothPrices.regular.toLocaleString()}</p>
                          <div className="flex items-center gap-3">
                            <p className="text-3xl font-bold text-green-600">₱{selectedPrice.toLocaleString()}</p>
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-semibold">
                              ₱{discountAmount} OFF
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    // If bundle is selected but user is not a member, show regular price with strikethrough
                    if (bothPrices && bothPrices.member !== null && !isMember && selectedPrice) {
                      return (
                        <div className="flex flex-col gap-1">
                          <p className="text-3xl font-bold text-slate-900">₱{selectedPrice.toLocaleString()}</p>
                        </div>
                      );
                    }
                    
                    // Check if product has member pricing (for default view before selection)
                    if (isMember && selectedProduct.options && selectedProduct.options.length > 0) {
                      let hasMemberPricing = false;
                      let regularMin: number | null = null;
                      let regularMax: number | null = null;
                      let memberMin: number | null = null;
                      let memberMax: number | null = null;
                      
                      for (const option of selectedProduct.options) {
                        for (const choice of option.choices) {
                          const prices = extractBothPrices(choice);
                          if (prices && prices.member !== null) {
                            hasMemberPricing = true;
                            
                            if (regularMin === null || prices.regular < regularMin) {
                              regularMin = prices.regular;
                            }
                            if (regularMax === null || prices.regular > regularMax) {
                              regularMax = prices.regular;
                            }
                            if (memberMin === null || prices.member < memberMin) {
                              memberMin = prices.member;
                            }
                            if (memberMax === null || prices.member > memberMax) {
                              memberMax = prices.member;
                            }
                          }
                        }
                      }
                      
                      // Show range with discount if member pricing exists
                      if (hasMemberPricing && regularMin !== null && regularMax !== null && memberMin !== null && memberMax !== null) {
                        return (
                          <div className="flex flex-col gap-1">
                            <p className="text-2xl font-bold text-slate-400 line-through">
                              ₱{regularMin.toLocaleString()}-{regularMax.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-3">
                              <p className="text-3xl font-bold text-green-600">
                                ₱{memberMin.toLocaleString()}-{memberMax.toLocaleString()}
                              </p>
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-semibold">
                                ₱50 OFF
                              </span>
                            </div>
                          </div>
                        );
                      }
                    }
                    
                    if (availablePrices && displayPrice) {
                      return <p className="text-3xl font-bold text-slate-900">₱{displayPrice.toLocaleString()}</p>;
                    } else if (availablePrices) {
                      if (availablePrices.min === availablePrices.max) {
                        return <p className="text-3xl font-bold text-slate-900">₱{availablePrices.min}</p>;
                      }
                      return <p className="text-3xl font-bold text-slate-900">₱{availablePrices.min}-{availablePrices.max}</p>;
                    } else {
                      return <p className="text-3xl font-bold text-slate-900">₱{selectedProduct.price.toLocaleString()}</p>;
                    }
                  })()}
                </div>

                {['Type A & B Uniform', 'Hard Bound', 'Gala', 'BSNAME Uniform'].includes(selectedProduct.name) ? (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Availability</p>
                    <p className={`text-lg font-bold ${selectedProduct.allowPreorder !== false ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedProduct.allowPreorder !== false ? 'Made to Order' : 'Unavailable'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Stock Available</p>
                    {(() => {
                      // If product has variants data and options are defined, show variant-specific stock
                      if (selectedProduct.variants && Object.keys(selectedProduct.variants).length > 0 && selectedProduct.options && selectedProduct.options.length > 0) {
                        // Check if all required options are selected
                        const allOptionsSelected = selectedProduct.options.every(opt => selectedOptions[opt.id]);
                        
                        if (allOptionsSelected) {
                          // Build variant key from selected options (must match backend format)
                          const variantKey = Object.entries(selectedOptions)
                            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                            .map(([key, value]) => `${key}:${value}`)
                            .join('|');
                          
                          const variant = selectedProduct.variants[variantKey];
                          const variantStock = variant ? variant.stock : 0;
                          
                          return (
                            <p className={`text-lg font-bold ${variantStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {variantStock > 0 ? `${variantStock} units` : 'Out of Stock'}
                            </p>
                          );
                        } else {
                          // Show total stock if not all options selected
                          const totalStock = Object.values(selectedProduct.variants).reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
                          return (
                            <p className={`text-lg font-bold ${totalStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {totalStock > 0 ? `${totalStock} units (total)` : 'Out of Stock'}
                            </p>
                          );
                        }
                      } else {
                        // Product without variants OR variants not yet set up - show main stock
                        return (
                          <p className={`text-lg font-bold ${selectedProduct.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedProduct.stock > 0 ? `${selectedProduct.stock} units` : 'Out of Stock'}
                          </p>
                        );
                      }
                    })()}
                  </div>
                )}

                {selectedProduct.note && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900">{selectedProduct.note}</p>
                  </div>
                )}

                {selectedProduct.options && selectedProduct.options.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    {selectedProduct.options.map((option) => (
                      <div key={option.id} className="mb-4">
                        <p className="text-sm text-slate-600 mb-3 font-semibold">{option.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {option.choices.map((choice) => {
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

                {/* Payment Type Selection for Tailored Products */}
                {['Gala', 'Type A & B Uniform', 'BSNAME Uniform'].includes(selectedProduct.name) && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-3 font-semibold">Payment Type</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setPaymentType('full')}
                        className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                          paymentType === 'full'
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Full Payment
                      </button>
                      <button
                        onClick={() => setPaymentType('downpayment')}
                        className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                          paymentType === 'downpayment'
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Downpayment (₱{selectedProduct.name === 'Gala' ? '500' : '1,500'})
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {paymentType === 'downpayment' 
                        ? 'Pay the remaining balance upon pickup' 
                        : 'Full payment required for tailored items'}
                    </p>
                  </div>
                )}

                {/* Order Type Selection for Out-of-Stock Products */}
                {(() => {
                  // Check if product is out of stock
                  const isOutOfStock = (() => {
                    // Skip for made-to-order products
                    if (['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(selectedProduct.name)) {
                      return false;
                    }
                    
                    // For products with variants
                    if (selectedProduct.variants && Object.keys(selectedProduct.variants).length > 0 && selectedProduct.options && selectedProduct.options.length > 0) {
                      const allOptionsSelected = selectedProduct.options.every(opt => selectedOptions[opt.id]);
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
                    
                    // For simple products
                    return selectedProduct.stock <= 0;
                  })();

                  if (isOutOfStock) {
                    if (selectedProduct.allowPreorder === false) {
                      return (
                        <div className="pt-4 border-t border-slate-200">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
                            <p className="text-sm font-semibold flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Out of Stock
                            </p>
                            <p className="text-xs text-red-500 mt-1">
                              This item is currently out of stock and pre-orders is not currently available.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-600 mb-3 font-semibold">Order Type</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setOrderType('preorder')}
                            className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                              orderType === 'preorder'
                                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Pre-Order
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          This item is currently out of stock. Place a pre-order and we'll notify you when it's available.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex gap-3 pt-4 border-t mt-6">
                <button
                  onClick={() => handleAddToCart(selectedProduct)}
                  disabled={(() => {
                    // Made-to-order products are always available (unless allowPreorder is false)
                    if (['Type A & B Uniform', 'Gala', 'BSNAME Uniform'].includes(selectedProduct.name)) {
                      return selectedProduct.allowPreorder === false;
                    }
                    
                    // Service-only products are always available (unless allowPreorder is false)
                    if (selectedProduct.name === 'Hard Bound') {
                      return selectedProduct.allowPreorder === false;
                    }
                    

                    
                    // If pre-order is selected, allow adding to cart even if out of stock
                    if (orderType === 'preorder') {
                      return false;
                    }
                    
                    // For products with variants data
                    if (selectedProduct.variants && Object.keys(selectedProduct.variants).length > 0 && selectedProduct.options && selectedProduct.options.length > 0) {
                      // Check if all options are selected
                      const allOptionsSelected = selectedProduct.options.every(opt => selectedOptions[opt.id]);
                      if (!allOptionsSelected) return false; // Let validation handle this
                      
                      // Build variant key (must match backend format)
                      const variantKey = Object.entries(selectedOptions)
                        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                        .map(([key, value]) => `${key}:${value}`)
                        .join('|');
                      
                      const variant = selectedProduct.variants[variantKey];
                      return !variant || variant.stock <= 0;
                    }
                    
                    // For simple products OR products without variants set up yet
                    return selectedProduct.stock <= 0;
                  })()}
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
        </div>,
        document.body
      )}
    </div>
  );
};
