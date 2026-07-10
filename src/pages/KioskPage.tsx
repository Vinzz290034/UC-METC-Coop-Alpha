import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tablet, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  CheckCircle2, 
  Search, 
  Info,
  ChevronRight,
  LogOut,
  Home,
  GraduationCap,
  User,
  Banknote,
  Smartphone
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/uiStore';
import { useAuth } from '../store/authContext';
import { AppDataSync } from '../store/appDataSync';
import { getProductImageByName } from '../utils/productImageResolver';
import { getFrontendUrl } from '../utils/apiBaseUrl';
import { apiClient } from '../services/api';
import { COOP_LOGO_URL, GCASH_URL } from '../constants/cloudinaryAssets';
import { TypingEffect } from '../components/TypingEffect';
import { FloatingInput } from '../components/FloatingInput';
import { FloatingSelect } from '../components/FloatingSelect';
import type { Product } from '../types';

const COURSES = ['BSMT', 'BSMARE', 'BSNAME', 'HM', 'TOURISM', 'SHS', 'JHS'];

const getValidYearsForCourse = (courseName: string): string[] => {
  if (!courseName) return [];
  if (['BSMT', 'BSMARE', 'BSNAME'].includes(courseName)) {
    return ['1st', '2nd', '3rd'];
  }
  if (['HM', 'TOURISM'].includes(courseName)) {
    return ['1st', '2nd', '3rd', '4th'];
  }
  if (courseName === 'SHS') {
    return ['11th', '12th'];
  }
  if (courseName === 'JHS') {
    return ['7th', '8th', '9th', '10th'];
  }
  return [];
};

interface KioskCartItem {
  id: string; // Deterministic based on product and options
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedOptions: Record<string, string>;
  paymentType?: 'full' | 'downpayment';
  orderType?: 'regular' | 'preorder';
  fullPrice?: number;
}

const styles = `
  @keyframes blob-glow-pulse {
    0%, 100% {
      opacity: 0.35;
      transform: scale(0.9) translate(0px, 0px);
    }
    50% {
      opacity: 0.95;
      transform: scale(1.15) translate(15px, -15px);
    }
  }

  .blob-pulse-green {
    animation: blob-glow-pulse 5s ease-in-out infinite;
  }
  
  .blob-pulse-purple {
    animation: blob-glow-pulse 5s ease-in-out infinite;
    animation-delay: 2.5s;
  }

  @keyframes spring-slide-up {
    0% {
      opacity: 0;
      transform: translateY(120px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spring-slide-in-right {
    0% {
      opacity: 0;
      transform: translateX(120px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .animate-catalog-entrance {
    animation: spring-slide-up 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  .animate-sidebar-entrance {
    animation: spring-slide-in-right 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.08s both;
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-scale-in {
    animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-kiosk-title {
    animation: spring-slide-up 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  .animate-kiosk-content {
    animation: spring-slide-up 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.1) 0.15s both;
  }

  .animate-kiosk-content-delay {
    animation: spring-slide-up 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.1) 0.3s both;
  }

  @keyframes welcome-pop-in {
    0% {
      opacity: 0;
      transform: scale(0.7) translateY(40px);
    }
    60% {
      opacity: 1;
      transform: scale(1.05) translateY(-8px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes welcome-fade-overlay {
    0% { opacity: 0; }
    15% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes welcome-name-slide {
    0% { opacity: 0; transform: translateY(24px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes welcome-sub-slide {
    0% { opacity: 0; transform: translateY(16px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes welcome-icon-bounce {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.2) rotate(-8deg); }
    75% { transform: scale(1.2) rotate(8deg); }
  }

  @keyframes welcome-ring-pulse {
    0%, 100% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(1.18); opacity: 0.15; }
  }

  .animate-welcome-overlay {
    animation: welcome-fade-overlay 2.8s ease-in-out forwards;
  }

  .animate-welcome-card {
    animation: welcome-pop-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
  }

  .animate-welcome-name {
    animation: welcome-name-slide 0.5s cubic-bezier(0.25, 1, 0.5, 1) 0.45s both;
  }

  .animate-welcome-sub {
    animation: welcome-sub-slide 0.5s cubic-bezier(0.25, 1, 0.5, 1) 0.65s both;
  }

  .animate-welcome-icon {
    animation: welcome-icon-bounce 1.2s ease-in-out 0.3s infinite;
  }

  .animate-welcome-ring {
    animation: welcome-ring-pulse 1.8s ease-in-out infinite;
  }
`;

export const KioskPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products } = useAppStore();
  const { showNotification } = useUIStore();

  // Kiosk flow state
  const [step, setStep] = useState<'idle' | 'customer-select' | 'customer-details' | 'catalog' | 'payment-select' | 'checkout' | 'success'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<KioskCartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  
  // Checkout Form state
  const [fullName, setFullName] = useState('');
  const [isStudent, setIsStudent] = useState(true);
  const [idNumber, setIdNumber] = useState('');
  const [course, setCourse] = useState('BSMT');
  const [year, setYear] = useState('1st');
  const [contactNumber, setContactNumber] = useState('');
  const [isCoopMember, setIsCoopMember] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ewallet'>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Helper to resolve kiosk variant image, prioritizing database variant images
  const getKioskVariantImage = (product: Product | null, opts: Record<string, string>): string => {
    if (!product) return '';
    if (product.variants && Object.keys(product.variants).length > 0) {
      const variantKey = Object.entries(opts)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      const variant = product.variants[variantKey];
      if (variant && (variant as any).image && (variant as any).image !== '📦' && (variant as any).image.trim() !== '') {
        return (variant as any).image;
      }
    }
    return getProductImageByName(product.name, opts) || product.image || '';
  };

  // GCash service fee calculation (matches CartPage logic)
  const calculateEWalletFee = (amount: number): number => {
    if (amount <= 0) return 0;
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
    return Math.ceil(amount / 500) * 10;
  };

  // Custom tailoring option selectors
  const [paymentType, setPaymentType] = useState<'full' | 'downpayment'>('full');
  const [researchTitle, setResearchTitle] = useState('');
  const [leadResearcher, setLeadResearcher] = useState('');

  const hasVariants = selectedProduct ? (
    ['Gala', 'Type A & B Uniform'].includes(selectedProduct.name) ||
    (selectedProduct.stock <= 0 && selectedProduct.allowPreorder === true) ||
    (selectedProduct.options && selectedProduct.options.length > 0) ||
    selectedProduct.name === 'Hard Bound'
  ) : false;

  const isSelectionConfigured = (product: Product, selectedOpts: Record<string, string>): boolean => {
    if (!product.options || product.options.length === 0) return true;
    if (product.name === 'BSNAME Uniform') return Object.keys(selectedOpts).length > 0;
    return product.options.every(opt => selectedOpts[opt.id]);
  };

  const getSelectionStock = (product: Product, selectedOpts: Record<string, string>): number => {
    if (product.variants && Object.keys(product.variants).length > 0 && product.options && product.options.length > 0) {
      if (isSelectionConfigured(product, selectedOpts)) {
        const variantKey = Object.entries(selectedOpts)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([key, value]) => `${key}:${value}`)
          .join('|');
        const variant = product.variants[variantKey];
        return variant ? variant.stock : 0;
      }
    }
    return product.stock;
  };

  const isSelectionOutOfStock = selectedProduct ? (
    isSelectionConfigured(selectedProduct, selectedOptions) && getSelectionStock(selectedProduct, selectedOptions) <= 0
  ) : false;

  const isPreorderAvailable = selectedProduct ? (
    selectedProduct.allowPreorder !== false
  ) : false;

  // Success states
  const [createdReceipt, setCreatedReceipt] = useState<string | null>(null);
  const [successSubStep, setSuccessSubStep] = useState<'receipt' | 'qrcode'>('receipt');
  const [successCountdown, setSuccessCountdown] = useState(5);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Welcome greeting overlay
  const [showWelcomeGreeting, setShowWelcomeGreeting] = useState(false);
  const welcomeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load products when kiosk is opened
  useEffect(() => {
    AppDataSync.loadProductsFromAPI();
    
    // Poll for stock updates
    const interval = setInterval(() => {
      AppDataSync.loadProductsFromAPI();
    }, 15000);

    return () => {
      clearInterval(interval);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Idle timeout: Reset to idle page if no interaction for 3 minutes on catalog/checkout
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (step === 'catalog' || step === 'checkout') {
      idleTimerRef.current = setTimeout(() => {
        handleResetKiosk();
        showNotification('Kiosk session reset due to inactivity');
      }, 180000); // 3 minutes
    }
  };

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [step, cart, selectedProduct]);

  // Handle Success Screen Auto-Reset Countdown and Status Polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (step === 'success') {
      if (successSubStep === 'receipt') {
        // Poll backend every 2 seconds to check if cashier marked order as paid
        pollInterval = setInterval(async () => {
          if (!createdReceipt) return;
          try {
            const data = await apiClient.getPublicReceipt(createdReceipt);
            if (data && (data.status === 'completed' || data.status === 'released')) {
              if (pollInterval) clearInterval(pollInterval);
              setSuccessSubStep('qrcode');
            } else if (data && data.status === 'cancelled') {
              if (pollInterval) clearInterval(pollInterval);
              showNotification('Order was cancelled', 'error');
              handleResetKiosk();
            }
          } catch (err) {
            console.error('Error polling receipt status:', err);
          }
        }, 2000);
      } else {
        // Start 15s countdown to auto-reset once QR code is shown
        setSuccessCountdown(15);
        countdownTimerRef.current = setInterval(() => {
          setSuccessCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownTimerRef.current!);
              handleResetKiosk();
              return 15;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [step, successSubStep, createdReceipt]);

  // Reset Kiosk State
  const handleResetKiosk = (shouldCancelOrder = false) => {
    // If cancelling while awaiting payment, mark the walk-in order as cancelled on the backend
    if (shouldCancelOrder && createdReceipt) {
      apiClient.cancelPublicWalkInOrder(createdReceipt).catch((err) => {
        console.error('Failed to cancel walk-in order on reset:', err);
      });
    }

    setCart([]);
    setFullName('');
    setIsStudent(true);
    setIdNumber('');
    setCourse('BSMT');
    setYear('1st');
    setContactNumber('');
    setIsCoopMember(false);
    setPaymentMethod('cash');
    setReferenceNumber('');
    setSearchQuery('');
    setSelectedCategory('all');
    setCreatedReceipt(null);
    setSuccessSubStep('receipt');
    setShowWelcomeGreeting(false);
    if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    setStep('idle');
  };

  // Trigger welcome greeting then transition to catalog
  const handleStartOrdering = () => {
    setShowWelcomeGreeting(true);
    welcomeTimerRef.current = setTimeout(() => {
      setShowWelcomeGreeting(false);
      setStep('catalog');
    }, 2800);
  };

  // Helper functions for prices
  const extractPrice = (choiceText: string, isMember: boolean): number | null => {
    const memberPriceMatch = choiceText.match(/₱([\d,]+)\s*\/\s*₱([\d,]+)\s*Member/);
    if (memberPriceMatch) {
      const regularPrice = parseInt(memberPriceMatch[1].replace(/,/g, ''));
      const memberPrice = parseInt(memberPriceMatch[2].replace(/,/g, ''));
      return isMember ? memberPrice : regularPrice;
    }
    const match = choiceText.match(/₱([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : null;
  };

  const getSelectedPrice = (product: Product, selectedOpts: Record<string, string>): number | null => {
    if (product.variants && Object.keys(product.variants).length > 0 && product.options && product.options.length > 0) {
      const isBSNAME = product.name === 'BSNAME Uniform';
      const allOptionsSelected = isBSNAME
        ? Object.keys(selectedOpts).length > 0
        : product.options.every(opt => selectedOpts[opt.id]);
        
      if (allOptionsSelected) {
        const variantKey = Object.entries(selectedOpts)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([key, value]) => `${key}:${value}`)
          .join('|');
        const variant = product.variants[variantKey];
        if (variant && (variant as any).price && (variant as any).price > 0) {
          return (variant as any).price;
        }
      }
    }

    if (!product.options || product.options.length === 0) return null;
    
    for (const option of product.options) {
      if (selectedOpts[option.id]) {
        const price = extractPrice(selectedOpts[option.id], isCoopMember);
        if (price !== null) return price;
      }
    }
    return null;
  };

  const getAvailablePrices = (product: Product): { min: number; max: number } | null => {
    const prices: number[] = [];

    if (product.options && product.options.length > 0) {
      const optionPrices = product.options
        .flatMap(option => option.choices)
        .map(choice => extractPrice(choice, isCoopMember))
        .filter((price): price is number => price !== null);
      prices.push(...optionPrices);
    }

    if (product.variants && Object.keys(product.variants).length > 0) {
      const variantPrices = Object.values(product.variants)
        .map(v => (v as any).price)
        .filter((price): price is number => price !== undefined && price !== null && price > 0);
      prices.push(...variantPrices);
    }

    if (product.price) {
      prices.push(product.price);
    }

    if (prices.length === 0) return null;
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };

  // Filter products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.available === false) return false;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    // Validate Hard Bound custom fields
    if (selectedProduct.name === 'Hard Bound') {
      if (!researchTitle.trim()) {
        showNotification('Please enter the Research Title', 'error');
        return;
      }
      if (!leadResearcher.trim()) {
        showNotification('Please enter the Lead Researcher', 'error');
        return;
      }
    }

    // Check if options are selected
    if (selectedProduct.options && selectedProduct.options.length > 0) {
      if (selectedProduct.name === 'BSNAME Uniform') {
        const hasAnyOption = selectedProduct.options.some(option => selectedOptions[option.id]);
        if (!hasAnyOption) {
          showNotification('Please select a size', 'error');
          return;
        }
      } else {
        const missingOptions = selectedProduct.options.filter(option => !selectedOptions[option.id]);
        if (missingOptions.length > 0) {
          showNotification(`Please select your ${missingOptions.map(o => o.label.toLowerCase()).join(' and ')}`, 'error');
          return;
        }
      }
    }

    const isTailoredProduct = ['Gala', 'Type A & B Uniform'].includes(selectedProduct.name);
    const fullPrice = getSelectedPrice(selectedProduct, selectedOptions) || selectedProduct.price;
    let actualPrice = fullPrice;
    
    if (isTailoredProduct && paymentType === 'downpayment') {
      if (selectedProduct.name === 'Gala') {
        actualPrice = 500;
      } else if (selectedProduct.name === 'Type A & B Uniform' || selectedProduct.name === 'BSNAME Uniform') {
        actualPrice = 1500;
      }
    }

    const mergedOptions = { ...selectedOptions };
    if (selectedProduct.name === 'Hard Bound') {
      mergedOptions['researchTitle'] = researchTitle.trim();
      mergedOptions['leadResearcher'] = leadResearcher.trim();
    }

    // Determine order type dynamically based on variant/item stock
    const resolvedOrderType = isSelectionOutOfStock ? 'preorder' : 'regular';

    const optionsString = Object.entries(mergedOptions)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    const paymentSuffix = isTailoredProduct ? `-${paymentType}` : '';
    const orderSuffix = resolvedOrderType === 'preorder' ? '-preorder' : '';
    const cartItemId = `${selectedProduct.id}${optionsString ? `-${optionsString}` : ''}${paymentSuffix}${orderSuffix}`;
    const productImage = getKioskVariantImage(selectedProduct, selectedOptions);

    // Check if item already in cart
    const existingIndex = cart.findIndex(item => item.id === cartItemId);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        id: cartItemId,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        price: actualPrice,
        quantity: 1,
        image: productImage,
        selectedOptions: mergedOptions,
        paymentType: isTailoredProduct ? paymentType : undefined,
        orderType: resolvedOrderType,
        fullPrice: isTailoredProduct && paymentType === 'downpayment' ? fullPrice : undefined,
      }]);
    }

    showNotification(`${selectedProduct.name} added to cart`, 'success');
    setSelectedProduct(null);
    setSelectedOptions({});
    setPaymentType('full');
    setResearchTitle('');
    setLeadResearcher('');
  };

  const updateCartQuantity = (id: string, delta: number) => {
    const updatedCart = cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
    showNotification('Item removed from cart');
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const ewalletFee = calculateEWalletFee(cartTotal);
  const gcashTotal = cartTotal + ewalletFee;

  // Place Order API Call
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!fullName.trim()) {
      showNotification('Please enter your full name', 'error');
      return;
    }

    showNotification('Submitting order...');

    try {
      const receiptNo = `WALK-${Date.now()}`;
      
      const orderItems = cart.map(item => {
        const orderItem: any = {
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
          selectedOptions: item.selectedOptions,
        };
        if (item.paymentType) orderItem.paymentType = item.paymentType;
        if (item.orderType) orderItem.orderType = item.orderType;
        if (item.fullPrice) orderItem.fullPrice = item.fullPrice;
        return orderItem;
      });

      const orderData = {
        items: orderItems,
        totalAmount: cartTotal,
        paymentMethod: paymentMethod,
        referenceNumber: paymentMethod === 'ewallet' ? referenceNumber : undefined,
        receiptNo: receiptNo,
        orderType: 'merchandise',
        isWalkIn: true,
        walkInName: fullName.trim(),
        walkInIdNumber: isStudent ? idNumber.trim() : null,
        walkInCourse: isStudent ? `${course} - ${year}` : 'Guest',
        walkInContactNumber: !isStudent ? contactNumber.trim() : null,
        walkInMembershipStatus: isCoopMember ? 'approved' : 'none'
      };

      // Submit using the logged-in staff member's credentials
      await apiClient.createOrder(orderData, user?.id || '');
      
      setCreatedReceipt(receiptNo);
      setStep('success');
      showNotification('Order placed successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'Failed to place order. Please call staff.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 text-gray-900 flex flex-col font-sans select-none overflow-hidden" onClick={resetIdleTimer}>
      <style>{styles}</style>

      {/* Welcome Greeting Overlay */}
      {showWelcomeGreeting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-welcome-overlay"
          style={{ background: '#ede9fe' }}>
          {/* Decorative blobs */}
          <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full opacity-25 animate-welcome-ring"
            style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
          <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 rounded-full opacity-25 animate-welcome-ring"
            style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)', animationDelay: '0.9s' }} />

          <div className="animate-welcome-card text-center px-12 py-14 rounded-3xl shadow-2xl max-w-lg w-full mx-6"
            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(24px)', border: '2px solid rgba(167,139,250,0.35)' }}>

            {/* Waving emoji / icon */}
            <div className="text-7xl mb-5 animate-welcome-icon select-none">👋</div>

            {/* Greeting text */}
            <div className="animate-welcome-name">
              <p className="text-purple-500 text-lg font-semibold tracking-widest uppercase mb-1">Welcome,</p>
              <h2 className="text-slate-900 font-black tracking-tight leading-none"
                style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
                {fullName.trim().split(' ')[0]}!
              </h2>
            </div>

            <div className="animate-welcome-sub mt-5 space-y-2">
              <p className="text-slate-800 text-xl font-bold">You're all set to order</p>
              <p className="text-slate-500 text-sm font-medium">
                Browse our products and add them to your cart.
              </p>

              {isCoopMember && (
                <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
                  <CheckCircle2 size={16} />
                  Coop Member — Discounts Applied!
                </div>
              )}
            </div>

            {/* Loading dots */}
            <div className="mt-8 flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-purple-300"
                  style={{ animation: `welcome-ring-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Kiosk Header */}
      {step === 'idle' && (
        <header className="h-20 bg-white border-b-2 border-purple-600 px-8 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-600 rounded-xl">
              <Tablet size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wider text-purple-600">COOP KIOSK</h1>
              <p className="text-xs font-semibold text-gray-500 leading-none mt-1">Tablet Self-Service Ordering</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-gray-500 border border-gray-200 flex items-center justify-center shadow-sm"
            title="Exit Kiosk Mode"
          >
            <LogOut size={20} />
          </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">

        {/* STEP 1: IDLE / WELCOME SCREEN */}
        {step === 'idle' && (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-20 animate-fade-in overflow-hidden">

            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-80 pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-green-400 to-green-300 rounded-full blur-3xl blob-pulse-green"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-purple-400 to-purple-300 rounded-full blur-3xl blob-pulse-purple" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-36 h-36 bg-purple-100 border-4 border-purple-200 rounded-full flex items-center justify-center mb-8 overflow-hidden">
                <img src={COOP_LOGO_URL} alt="UC METC Logo" className="w-full h-full rounded-full object-cover" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                Welcome to{' '}
                <TypingEffect
                  words={['UC METC Coop', 'UC METC SILMS']}
                  colors={['#a855f7', '#16a34a']} // purple then green
                  className="font-black inline-block"
                  speed={80}
                  deleteSpeed={40}
                  delayBetweenWords={1500}
                />
              </h2>
              <p className="text-lg text-gray-500 max-w-xl mb-12 font-medium">
                No internet? No problem! Order uniforms, manuals, and accessories directly from this tablet.
              </p>
              <button
                onClick={() => setStep('customer-select')}
                className="px-10 py-5 bg-green-600 hover:bg-green-700 text-white text-2xl font-black rounded-2xl shadow-lg active:scale-95 transition-all flex items-center space-x-3 group"
              >
                <span>TAP TO START ORDERING</span>
                <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 1.5: CUSTOMER SELECT (Student or Guest) */}
        {step === 'customer-select' && (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-20 overflow-hidden">
            <div className="max-w-5xl w-full flex flex-col items-center">
              <div className="animate-kiosk-title">
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-3 tracking-tight">
                  TELL US ABOUT YOURSELF
                </h2>
                <p className="text-lg text-gray-500 mb-16 font-medium">
                  Please select how you would like to register your walk-in order.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
                {/* Student Option */}
                <div 
                  onClick={() => {
                    setIsStudent(true);
                    setStep('customer-details');
                  }}
                  className="bg-white border-2 border-gray-200 hover:border-purple-500 hover:shadow-2xl rounded-3xl py-16 px-10 flex flex-col items-center cursor-pointer transition-all active:scale-[0.98] group animate-kiosk-content"
                >
                  <div className="w-28 h-28 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <GraduationCap size={56} />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-gray-900 mb-3">I AM A STUDENT</h3>
                  <p className="text-sm lg:text-base text-gray-400 text-center leading-relaxed max-w-xs">
                    Select this option if you are an enrolled student at UC METC.
                  </p>
                </div>

                {/* Guest Option */}
                <div 
                  onClick={() => {
                    setIsStudent(false);
                    setStep('customer-details');
                  }}
                  className="bg-white border-2 border-gray-200 hover:border-purple-500 hover:shadow-2xl rounded-3xl py-16 px-10 flex flex-col items-center cursor-pointer transition-all active:scale-[0.98] group animate-kiosk-content-delay"
                >
                  <div className="w-28 h-28 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-green-600 group-hover:text-white transition-all">
                    <User size={56} />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-gray-900 mb-3">GUEST</h3>
                  <p className="text-sm lg:text-base text-gray-400 text-center leading-relaxed max-w-xs">
                    Select this option if you are a non-student, visitor, parent, or alumni.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1.8: CUSTOMER DETAILS FORM */}
        {step === 'customer-details' && (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 z-20 animate-fade-in overflow-y-auto">
            {/* Back button */}
            <button 
              onClick={() => setStep('customer-select')} 
              className="absolute top-8 left-8 text-gray-500 hover:text-purple-600 flex items-center space-x-2 font-black text-lg bg-gray-100 border-2 border-gray-200 rounded-full px-6 py-3 transition-colors shadow-sm"
            >
              <ArrowLeft size={22} />
              <span>Back</span>
            </button>

            <div className="max-w-2xl w-full">
              <div className="text-center mb-12 animate-kiosk-title">
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">ENTER DETAILS</h2>
                <p className="text-lg text-gray-500 mt-2">
                  {isStudent ? 'Please provide student info to match your record.' : 'Please provide contact info for your order.'}
                </p>
              </div>

              <div className="space-y-6 animate-kiosk-content">
                <div>
                  <FloatingInput
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    thick={true}
                    focusColor="purple"
                    required
                  />
                </div>

                {isStudent ? (
                  <>
                    <div>
                      <FloatingInput
                        label="Student ID Number"
                        value={idNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 8) {
                            setIdNumber(val);
                          }
                        }}
                        thick={true}
                        focusColor="purple"
                        required
                        maxLength={8}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FloatingSelect
                          label="Course"
                          value={course}
                          onChange={(e) => {
                            const newCourse = e.target.value;
                            setCourse(newCourse);
                            const validYears = getValidYearsForCourse(newCourse);
                            if (!validYears.includes(year)) {
                              setYear('');
                            }
                          }}
                          options={COURSES}
                          thick={true}
                        />
                      </div>
                      <div>
                        <FloatingSelect
                          label="Year Level"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          options={getValidYearsForCourse(course)}
                          thick={true}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <FloatingInput
                      label="Contact Number"
                      value={contactNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setContactNumber(val);
                      }}
                      thick={true}
                      focusColor="purple"
                      required
                      inputMode="numeric"
                    />
                  </div>
                )}

                <button 
                  onClick={() => {
                    if (!fullName.trim()) {
                      showNotification('Please enter your full name', 'error');
                      return;
                    }
                    if (isStudent && !idNumber.trim()) {
                      showNotification('Please enter your student ID number', 'error');
                      return;
                    }
                    if (isStudent && idNumber.length !== 8) {
                      showNotification('Student ID number must be exactly 8 digits', 'error');
                      return;
                    }
                    if (isStudent && !course) {
                      showNotification('Please select your course', 'error');
                      return;
                    }
                    if (isStudent && !year) {
                      showNotification('Please select your year level', 'error');
                      return;
                    }
                    if (!isStudent && !contactNumber.trim()) {
                      showNotification('Please enter your contact number', 'error');
                      return;
                    }
                    handleStartOrdering();
                  }} 
                  className="w-full py-5 mt-6 bg-green-600 hover:bg-green-700 text-white font-black text-xl rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                >
                  <span>START ORDERING</span>
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CATALOG & BROWSE SCREEN */}
        {step === 'catalog' && (
          <div className="flex-1 flex overflow-hidden w-full">
            {/* Catalog Grid Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 p-6 animate-catalog-entrance">
              
              {/* Category selector & search */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search product name or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-800 placeholder-gray-400 text-base shadow-sm"
                  />
                </div>
                
                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[
                    { value: 'all', label: 'All Products' },
                    { value: 'uniform', label: 'Uniforms' },
                    { value: 'accessory', label: 'Accessories' },
                    { value: 'equipment', label: 'Equipment' }
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-5 py-3 rounded-xl text-sm font-bold border transition-all flex-shrink-0 ${
                        selectedCategory === cat.value
                          ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product cards grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pr-2">
                {filteredProducts.map((product) => {
                  const prices = getAvailablePrices(product);
                  const image = getProductImageByName(product.name) || product.image || '';
                  const isOutOfStock = product.stock <= 0 && product.allowPreorder === false;
                  
                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (!isOutOfStock) {
                          setSelectedProduct(product);
                          setSelectedOptions({});
                        }
                      }}
                      className={`bg-white border-2 rounded-2xl p-4 flex flex-col items-center justify-between cursor-pointer active:scale-95 transition-all shadow-sm group ${
                        isOutOfStock
                          ? 'border-gray-100 opacity-40 cursor-not-allowed'
                          : 'border-gray-200 hover:border-purple-400 hover:shadow-md'
                      }`}
                    >
                      {/* Product image */}
                      <div className="w-full aspect-square rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-3 mb-4 overflow-hidden relative">
                        {image ? (
                          <img src={image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                        ) : (
                          <span className="text-5xl">📦</span>
                        )}
                        {product.stock <= 0 && !isOutOfStock && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 border border-yellow-300 rounded-md text-[9px] font-black text-yellow-700">
                            PRE-ORDER
                          </div>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-black text-red-500">
                            OUT OF STOCK
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="text-center w-full">
                        <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block mb-0.5">{product.sku}</span>
                        <h3 className="font-bold text-sm text-gray-800 group-hover:text-purple-700 truncate w-full px-1">{product.name}</h3>
                        <div className="mt-2 text-purple-600 font-extrabold text-base">
                          {prices ? (
                            prices.min === prices.max
                              ? `₱${prices.min.toLocaleString()}`
                              : `₱${prices.min.toLocaleString()} - ₱${prices.max.toLocaleString()}`
                          ) : `₱${product.price.toLocaleString()}`}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-16 text-center text-gray-400">
                    <Search size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No products match your search/filter.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Kiosk Cart */}
            <div className="w-96 border-l-2 border-gray-200 bg-white flex flex-col animate-sidebar-entrance">
              <div className="p-6 border-b-2 border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="text-purple-600" size={22} />
                  <span className="font-black text-base tracking-wide text-gray-800">CURRENT CART</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1.5 bg-purple-100 text-purple-600 text-xs font-bold rounded-lg border border-purple-200">
                    {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
                  </span>
                  <button
                  onClick={() => handleResetKiosk()}
                    className="p-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-500 border border-gray-200 flex items-center justify-center shadow-sm"
                    title="Cancel & Go Home"
                  >
                    <Home size={16} />
                  </button>
                </div>
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 border-2 border-gray-200 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center p-1">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xl">📦</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-gray-800 truncate">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {Object.values(item.selectedOptions).join(', ')}
                        {item.paymentType && ` (${item.paymentType})`}
                        {item.orderType === 'preorder' && ' (Pre-order)'}
                      </p>
                      <p className="text-purple-600 font-extrabold text-xs mt-1">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-center space-y-1.5">
                      <button onClick={() => removeFromCart(item.id)} className="p-1 text-gray-300 hover:text-red-500 active:scale-90 transition-all">
                        <Trash2 size={14} />
                      </button>
                      <div className="flex items-center bg-white border-2 border-gray-200 rounded-lg py-0.5 px-1 gap-1">
                        <button onClick={() => updateCartQuantity(item.id, -1)} className="p-0.5 text-gray-400 hover:text-purple-600">
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center text-gray-700">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.id, 1)} className="p-0.5 text-gray-400 hover:text-purple-600">
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-center px-6">
                    <ShoppingCart size={40} className="mb-4 opacity-25" />
                    <p className="font-bold text-sm">Your cart is empty</p>
                    <p className="text-xs text-gray-300 mt-1">Tap a product to add items.</p>
                  </div>
                )}
              </div>

              {/* Total & Checkout */}
              <div className="p-6 border-t-2 border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 font-semibold text-sm">Total Amount</span>
                  <span className="text-green-600 font-black text-2xl">₱{cartTotal.toLocaleString()}</span>
                </div>
                
                <button
                  disabled={cart.length === 0}
                  onClick={() => setStep('payment-select')}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white disabled:text-gray-400 font-black text-base rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                >
                  <span>PROCEED TO CHECKOUT</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2.5: PAYMENT METHOD SELECTION */}
        {step === 'payment-select' && (
          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-20 overflow-hidden">
            <div className="max-w-5xl w-full flex flex-col items-center">
              <div className="animate-kiosk-title">
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-3 tracking-tight">
                  PAYMENT METHOD
                </h2>
                <p className="text-lg text-gray-500 mb-16 font-medium">
                  How would you like to pay for your order?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl">
                {/* Cash Option */}
                <div
                  onClick={() => {
                    setPaymentMethod('cash');
                    setStep('checkout');
                  }}
                  className="bg-white border-2 border-gray-200 hover:border-green-500 hover:shadow-2xl rounded-3xl py-16 px-10 flex flex-col items-center cursor-pointer transition-all active:scale-[0.98] group animate-kiosk-content"
                >
                  <div className="w-28 h-28 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-green-600 group-hover:text-white transition-all">
                    <Banknote size={56} />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-gray-900 mb-3">CASH</h3>
                  <p className="text-sm lg:text-base text-gray-400 text-center leading-relaxed max-w-xs">
                    Pay with physical cash at the counter upon claiming your order.
                  </p>
                </div>

                {/* GCash Option */}
                <div
                  onClick={() => {
                    setPaymentMethod('ewallet');
                    setStep('checkout');
                  }}
                  className="bg-white border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl rounded-3xl py-16 px-10 flex flex-col items-center cursor-pointer transition-all active:scale-[0.98] group animate-kiosk-content-delay"
                >
                  <div className="w-28 h-28 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Smartphone size={56} />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-gray-900 mb-3">GCASH</h3>
                  <p className="text-sm lg:text-base text-gray-400 text-center leading-relaxed max-w-xs">
                    Pay via GCash e-wallet. You will be shown a QR code to scan.
                  </p>
                </div>
              </div>

              {/* Back button */}
              <button
                onClick={() => setStep('catalog')}
                className="mt-12 text-gray-500 hover:text-purple-600 flex items-center space-x-2 font-black text-lg bg-gray-100 border-2 border-gray-200 rounded-full px-6 py-3 transition-colors shadow-sm"
              >
                <ArrowLeft size={22} />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CHECKOUT SCREEN */}
        {step === 'checkout' && (
          <div className="absolute inset-0 bg-gray-50 overflow-y-auto">
            <div className="min-h-full flex items-start justify-center p-6 lg:p-8">
            <div className="w-full max-w-4xl bg-white border-2 border-gray-200 rounded-3xl p-6 lg:p-8 flex flex-col gap-6 shadow-xl animate-kiosk-title my-auto">

              {/* Back button row — full width, no overlap */}
              <div className="flex items-center">
                <button
                  onClick={() => setStep('catalog')}
                  className="text-gray-500 hover:text-purple-600 flex items-center space-x-1.5 font-bold text-sm bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 transition-colors"
                >
                  <ArrowLeft size={16} /><span>Back</span>
                </button>
              </div>

              {/* Two-column body */}
              <div className="flex flex-col lg:flex-row gap-8">

              {/* Order Summary — LEFT panel */}
              <div className="w-full lg:w-80 flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r-2 border-gray-200 pb-6 lg:pb-0 lg:pr-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-purple-600" /><span>Order Summary</span>
                </h3>
                <div className="flex-1 overflow-y-auto max-h-[35vh] space-y-2.5 pr-2 mb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs border-b border-gray-100 pb-2">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-gray-700 truncate">{item.name} <span className="text-purple-600">x{item.quantity}</span></p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{Object.values(item.selectedOptions).join(', ')}</p>
                      </div>
                      <span className="font-extrabold text-gray-800">₱{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-semibold">Grand Total</span>
                    <span className="text-green-600 font-black text-xl">₱{cartTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Walk-In Form — RIGHT panel, independently scrollable */}
              <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[75vh] pr-1">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-gray-900">Checkout Info</h3>
                      <p className="text-xs text-gray-500">Please review your information and choose your payment method.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setStep('customer-details')}
                      className="px-3 py-1.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg text-xs font-black hover:bg-purple-100 transition-colors"
                    >
                      EDIT DETAILS
                    </button>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Customer Name</span>
                        <p className="font-extrabold text-gray-800 mt-0.5">{fullName}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Customer Type</span>
                        <p className="font-extrabold text-gray-800 mt-0.5">{isStudent ? 'Student' : 'Guest'}</p>
                      </div>
                      {isStudent ? (
                        <>
                          <div>
                            <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Student ID</span>
                            <p className="font-extrabold text-gray-800 mt-0.5">{idNumber}</p>
                          </div>
                          <div>
                            <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Course & Year</span>
                            <p className="font-extrabold text-gray-800 mt-0.5">{course} - {year}</p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Contact Info</span>
                          <p className="font-extrabold text-gray-800 mt-0.5">{contactNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Payment Method</label>
                    <div className={`p-3 bg-white border-2 rounded-xl flex items-center space-x-2.5 ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
                      {paymentMethod === 'cash'
                        ? <Banknote size={18} className="text-green-600 shrink-0" />
                        : <Smartphone size={18} className="text-blue-600 shrink-0" />
                      }
                      <div className="text-left leading-tight">
                        <p className="text-xs font-bold text-gray-800">{paymentMethod === 'cash' ? 'Cash' : 'GCash'}</p>
                        <p className="text-[10px] text-gray-400">Selected payment method</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('payment-select')}
                        className="ml-auto text-[10px] font-bold text-purple-500 hover:text-purple-700 underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* GCash Details: no-refund notice + service fee + QR code + reference input */}
                  {paymentMethod === 'ewallet' && (
                    <div className="space-y-3">
                      {/* No Refund Notice */}
                      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                        <h4 className="text-xs font-black text-amber-900 mb-1 uppercase tracking-wider">IMPORTANT: No Refund Policy</h4>
                        <p className="text-xs text-amber-800">
                          GCash payments are <span className="font-bold">NON-REFUNDABLE</span> once completed.
                        </p>
                        <p className="text-xs text-amber-800 mt-1">
                          Service fee: <span className="font-bold">₱{ewalletFee.toFixed(2)}</span>
                        </p>
                        <p className="text-xs text-amber-900 font-black mt-1">
                          Total amount to pay: ₱{gcashTotal.toFixed(2)}
                        </p>
                      </div>

                      {/* QR Code */}
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Scan QR Code to Pay</h4>
                        <div className="bg-white p-3 rounded-lg inline-block mb-3 shadow-sm">
                          <img
                            src={GCASH_URL}
                            alt="GCash QR Code"
                            className="w-48 h-auto object-cover rounded-md"
                            style={{ objectPosition: 'center 15%', maxHeight: '280px' }}
                          />
                        </div>
                        <div className="text-left bg-white rounded-lg p-3 text-xs space-y-1">
                          <p className="text-gray-700"><span className="font-semibold">Account Name:</span> Michelle Pable</p>
                          <p className="text-gray-700"><span className="font-semibold">GCash Number:</span> 09498664041</p>
                          <p className="text-gray-700">
                            <span className="font-semibold">Amount to Pay:</span>{' '}
                            <span className="font-black text-purple-600 text-sm">₱{gcashTotal.toFixed(2)}</span>
                          </p>
                          <p className="text-[10px] text-gray-400">
                            (Order: ₱{cartTotal.toFixed(2)} + Service Fee: ₱{ewalletFee.toFixed(2)})
                          </p>
                        </div>
                      </div>

                      {/* Reference Number Input */}
                      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3">
                        <p className="text-xs font-semibold text-yellow-800 mb-2">
                          After payment, enter the last 4 digits of your reference number below
                        </p>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={referenceNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 4) setReferenceNumber(val);
                          }}
                          placeholder="Last 4 digits"
                          maxLength={4}
                          className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg text-center text-2xl font-black tracking-widest text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={paymentMethod === 'ewallet' && referenceNumber.length !== 4}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-400 text-white font-black text-base rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2 mt-4"
                >
                  <CheckCircle2 size={18} /><span>PLACE ORDER</span>
                </button>
              </form>
              </div>{/* end two-column body */}
            </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS / CONFIRMATION SCREEN */}
        {step === 'success' && successSubStep === 'receipt' && (
          <div key="success-receipt" className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-20">
            <div className="flex flex-col items-center animate-kiosk-title">
              <div className="w-24 h-24 bg-green-100 border-4 border-green-200 rounded-full flex items-center justify-center mb-6 text-green-600 animate-bounce">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">ORDER PLACED!</h2>
              <p className="text-base text-gray-500 max-w-md mb-8">Your walk-in order was sent to the Coop system. Please go to the counter to complete payment.</p>
            </div>

            <div className="w-full flex flex-col items-center animate-kiosk-content">
              <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 max-w-md w-full mb-8 shadow-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Receipt Reference No.</span>
                <span className="text-2xl font-black text-purple-600 font-mono bg-purple-50 border-2 border-purple-100 px-4 py-2 rounded-xl inline-block">
                  {createdReceipt}
                </span>
                <div className="border-t-2 border-gray-100 mt-6 pt-4 text-left space-y-3">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-gray-400">Total Price:</span>
                    <span className="text-green-600 font-extrabold text-base">₱{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-gray-400">Customer Name:</span>
                    <span className="text-gray-800">{fullName}</span>
                  </div>
                  {isStudent && (
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-400">Student ID:</span>
                      <span className="text-gray-600">{idNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2 text-purple-600 bg-purple-50 px-4 py-2.5 rounded-full border border-purple-100 animate-pulse">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping"></div>
                  <span className="text-xs font-black tracking-wide">AWAITING PAYMENT AT THE COUNTER...</span>
                </div>
                <button 
                  onClick={() => handleResetKiosk(true)} 
                  className="text-xs text-gray-400 hover:text-red-500 font-bold transition-colors underline"
                >
                  CANCEL / START A NEW ORDER
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'success' && successSubStep === 'qrcode' && (
          <div key="success-qrcode" className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-20">
            <div className="flex flex-col items-center animate-kiosk-title">
              <div className="w-24 h-24 bg-purple-100 border-4 border-purple-200 rounded-full flex items-center justify-center mb-6 text-purple-600 animate-bounce">
                <CheckCircle2 size={48} className="text-purple-600" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">SCAN FOR RECEIPT</h2>
              <p className="text-base text-gray-500 max-w-md mb-8">Scan this QR code with your phone camera to view, download, or save your digital copy.</p>
            </div>

            <div className="w-full flex flex-col items-center animate-kiosk-content">
              <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 max-w-md w-full mb-8 shadow-xl flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Order Reference: {createdReceipt}</span>
                <div className="bg-white p-3 border border-slate-100 rounded-2xl inline-block shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      `${getFrontendUrl()}/receipt/${createdReceipt}`
                    )}`} 
                    alt="Receipt QR Code"
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-3">Take a screenshot or present this on your phone</p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <button onClick={() => handleResetKiosk()} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-black rounded-xl shadow-md active:scale-95 transition-all">
                  START A NEW ORDER
                </button>
                <p className="text-xs text-gray-400 flex items-center space-x-1">
                  <span>Auto-resetting page in</span>
                  <span className="font-bold text-purple-600">{successCountdown}s</span>
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-3xl bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-scale-in">
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Product Info */}
              <div className="w-full md:w-64 flex flex-col items-center flex-shrink-0">
                <div className="w-full aspect-square bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden mb-4 shadow-sm">
                  {getKioskVariantImage(selectedProduct, selectedOptions) ? (
                    <img src={getKioskVariantImage(selectedProduct, selectedOptions)} alt={selectedProduct.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                </div>
                <h3 className="font-black text-xl text-gray-900 text-center leading-tight mb-1">{selectedProduct.name}</h3>
                <span className="text-xs font-mono text-gray-400 font-bold uppercase tracking-wider mb-3">{selectedProduct.sku}</span>
                <div className="text-green-600 font-black text-2xl mt-1">
                  ₱{(getSelectedPrice(selectedProduct, selectedOptions) || selectedProduct.price).toLocaleString()}
                </div>
              </div>

              {/* Options */}
              <div className="flex-1 flex flex-col">
                <div>
                  <h4 className="text-lg font-black text-gray-800 uppercase tracking-wider mb-4 border-b pb-2 border-gray-100">Configure Item</h4>
                  
                  {['Gala', 'Type A & B Uniform'].includes(selectedProduct.name) && (
                    <div className="mb-5">
                      <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Payment Options</label>
                      <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 border border-gray-200 rounded-xl">
                        <button onClick={() => setPaymentType('full')} className={`py-3 rounded-lg text-sm font-bold transition-all ${paymentType === 'full' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Full Payment</button>
                        <button onClick={() => setPaymentType('downpayment')} className={`py-3 rounded-lg text-sm font-bold transition-all ${paymentType === 'downpayment' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>Downpayment (₱{selectedProduct.name === 'Gala' ? '500' : '1,500'})</button>
                      </div>
                    </div>
                  )}

                  {isSelectionOutOfStock && isPreorderAvailable && (
                    <div className="mb-5">
                      <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-yellow-700 text-sm flex items-start gap-2 leading-relaxed">
                        <Info size={20} className="flex-shrink-0 mt-0.5 text-yellow-500" />
                        <div>
                          <p className="font-extrabold">Pre-order Active</p>
                          <p className="text-xs text-yellow-600">This size/variant is currently out of stock. You can pre-order and the Coop will notify you when it's available.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isSelectionOutOfStock && !isPreorderAvailable && (
                    <div className="mb-5">
                      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2 leading-relaxed">
                        <Info size={20} className="flex-shrink-0 mt-0.5 text-red-500" />
                        <div>
                          <p className="font-extrabold">Out of Stock</p>
                          <p className="text-xs text-red-600">This size/variant is currently out of stock and pre-orders are not available.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProduct.options && selectedProduct.options.map((option) => (
                    <div key={option.id} className="mb-5">
                      <label className="block text-sm font-extrabold text-gray-500 mb-2 uppercase tracking-wider">{option.label}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {option.choices.map((choice) => {
                          const isSelected = selectedOptions[option.id] === choice;
                          const displayLabel = choice.split('(')[0].trim();
                          return (
                            <button key={choice} onClick={() => setSelectedOptions({ ...selectedOptions, [option.id]: choice })}
                              className={`py-3.5 px-4 border-2 rounded-xl text-sm font-black transition-all text-center leading-tight shadow-sm ${isSelected ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-600/20' : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'}`}>
                              {displayLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {selectedProduct.name === 'Hard Bound' && (
                    <div className="space-y-4 mb-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Research Title</label>
                        <input type="text" placeholder="Enter project/research title" value={researchTitle} onChange={(e) => setResearchTitle(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-800 text-sm shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Lead Researcher Name</label>
                        <input type="text" placeholder="Enter Lead Researcher" value={leadResearcher} onChange={(e) => setLeadResearcher(e.target.value)} className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-800 text-sm shadow-sm" />
                      </div>
                    </div>
                  )}
                </div>

                <div className={`flex space-x-3 ${hasVariants ? 'pt-5 border-t-2 border-gray-100 mt-auto' : 'my-auto'}`}>
                  <button onClick={() => { setSelectedProduct(null); setSelectedOptions({}); setPaymentType('full'); }} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-base rounded-xl transition-all active:scale-95">Cancel</button>
                  <button 
                    onClick={handleAddToCart}
                    disabled={isSelectionOutOfStock && !isPreorderAvailable}
                    className={`flex-1 py-4 font-black text-base rounded-xl transition-all active:scale-95 ${
                      isSelectionOutOfStock && !isPreorderAvailable
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
                    }`}
                  >
                    {isSelectionOutOfStock && !isPreorderAvailable ? 'Out of Stock' : 'Add to Cart'}
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
