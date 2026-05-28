import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, ShoppingBag, Home, Mail, CreditCard, Package, User } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface SearchResult {
  id: string;
  type: 'page' | 'product';
  title: string;
  description?: string;
  path?: string;
  icon?: React.ReactNode;
  keywords?: string[];
  product?: any; // For product type results
}

export const GlobalSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { products } = useAppStore();

  // Navigation pages
  const pages: SearchResult[] = [
    {
      id: 'dashboard',
      type: 'page',
      title: 'Dashboard',
      description: 'View your dashboard and overview',
      path: '/dashboard',
      icon: <Home size={20} className="text-purple-600" />,
      keywords: ['home', 'overview', 'main'],
    },
    {
      id: 'merchandise',
      type: 'page',
      title: 'Merchandise',
      description: 'Browse and shop products',
      path: '/merchandise',
      icon: <ShoppingBag size={20} className="text-green-600" />,
      keywords: ['shop', 'store', 'products', 'buy'],
    },
    {
      id: 'cart',
      type: 'page',
      title: 'Cart',
      description: 'View your shopping cart',
      path: '/cart',
      icon: <ShoppingBag size={20} className="text-orange-600" />,
      keywords: ['shopping', 'checkout', 'basket'],
    },
    {
      id: 'inbox',
      type: 'page',
      title: 'Inbox',
      description: 'Read and send messages',
      path: '/inbox',
      icon: <Mail size={20} className="text-blue-600" />,
      keywords: ['messages', 'mail', 'communication'],
    },
    {
      id: 'transaction',
      type: 'page',
      title: 'Transaction History',
      description: 'View your order history',
      path: '/transaction',
      icon: <CreditCard size={20} className="text-indigo-600" />,
      keywords: ['orders', 'purchases', 'history', 'billing'],
    },
    {
      id: 'locker',
      type: 'page',
      title: 'Locker',
      description: 'Manage your locker',
      path: '/locker',
      icon: <Package size={20} className="text-teal-600" />,
      keywords: ['storage', 'rental'],
    },
    {
      id: 'profile',
      type: 'page',
      title: 'Profile',
      description: 'View and edit your profile',
      path: '/account-settings',
      icon: <User size={20} className="text-pink-600" />,
      keywords: ['account', 'settings', 'personal', 'profile'],
    },
  ];

  // Search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search pages
    pages.forEach((page) => {
      const titleMatch = page.title.toLowerCase().includes(query);
      const descMatch = page.description?.toLowerCase().includes(query);
      const keywordMatch = page.keywords?.some((k) => k.toLowerCase().includes(query));

      if (titleMatch || descMatch || keywordMatch) {
        searchResults.push(page);
      }
    });

    // Search products
    products.forEach((product) => {
      const nameMatch = product.name.toLowerCase().includes(query);
      const categoryMatch = product.category?.toLowerCase().includes(query);
      const noteMatch = product.note?.toLowerCase().includes(query);

      if (nameMatch || categoryMatch || noteMatch) {
        searchResults.push({
          id: product.id,
          type: 'product',
          title: product.name,
          description: `₱${product.price} - ${product.category}`,
          icon: <ShoppingBag size={20} className="text-green-600" />,
          product: product, // Store the full product object
        });
      }
    });

    setResults(searchResults.slice(0, 8)); // Limit to 8 results
    setSelectedIndex(0);
  }, [searchQuery, products]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }

      // Arrow keys to navigate results
      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'product' && result.product) {
      // For products, navigate to merchandise with product state
      navigate('/merchandise', { state: { selectedProduct: result.product } });
    } else if (result.path) {
      // For pages, navigate to the path
      navigate(result.path);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white border border-slate-200 rounded-lg transition-all hover:shadow-md w-full max-w-md"
      >
        <Search size={18} className="text-slate-500" />
        <span className="text-sm text-slate-600">Search...</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div
            ref={searchRef}
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl animate-scale-in"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-200">
              <Search size={20} className="text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages and products..."
                className="flex-1 text-lg outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="p-1 hover:bg-slate-100 rounded transition"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {searchQuery && results.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Search size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No results found for "{searchQuery}"</p>
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                        index === selectedIndex
                          ? 'bg-purple-50 border-l-4 border-purple-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-shrink-0">{result.icon}</div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-900">{result.title}</p>
                        {result.description && (
                          <p className="text-sm text-slate-600">{result.description}</p>
                        )}
                      </div>
                      <ArrowRight
                        size={16}
                        className={`flex-shrink-0 ${
                          index === selectedIndex ? 'text-purple-600' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Search size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="mb-2">Quick Search</p>
                  <p className="text-sm">
                    Search for pages, products, and more...
                  </p>
                  <div className="mt-4 hidden sm:flex items-center justify-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded">↑↓</kbd>
                    <span>to navigate</span>
                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded">↵</kbd>
                    <span>to select</span>
                    <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded">esc</kbd>
                    <span>to close</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
