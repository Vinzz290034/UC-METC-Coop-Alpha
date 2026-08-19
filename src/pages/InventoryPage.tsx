import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, AlertTriangle, TrendingDown, TrendingUp, Search, Package, Download, GripVertical, ChevronLeft, ChevronRight, CheckCircle, Calendar, Filter, Eye, ChevronDown, Check, Copy, Printer, Paperclip, FileText, ShieldCheck, Save, RefreshCw, Layers, DollarSign, CheckCircle2, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/uiStore';
import { useAuth } from '../store/authContext';
import { AppDataSync } from '../store/appDataSync';
import { FloatingInput } from '../components/FloatingInput';
import { AnimatedSelect } from '../components/AnimatedSelect';
import { apiClient } from '../services/api';
import type { Product, ItemType } from '../types';
import { PRODUCT_IMAGES } from '../constants/cloudinaryAssets';
import { uploadToCloudinary } from '../utils/cloudinary';
import { formatProductName, parseAndFormatLegacyProductName, cleanRepeatedSegments } from '../utils/productNameFormatter';
import { formatDisplaySKU, generateCategoryNextSKU } from '../utils/skuFormatter';

const CATEGORY_OPTIONS = [
  { value: 'uniform', label: 'Uniform' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'equipment', label: 'PPE (Personal Protective Equipment)' },
  { value: 'service', label: 'Service' },
  { value: 'essentials', label: 'Essentials' },
];

// Helper to resolve dynamic Cloudinary product images for display in admin inventory management
const getInventoryProductImage = (productName: string, variantKey: string = '', customImage: string = ''): string => {
  // If customImage is already a data URL, http URL, or file path, return it directly
  if (customImage && (customImage.startsWith('data:') || customImage.startsWith('http') || customImage.includes('.'))) {
    return customImage;
  }

  // Standardize product name search
  const name = productName || '';

  if (name === 'Type A & B Uniform') {
    return PRODUCT_IMAGES['Type A & B Uniform'];
  }
  
  if (name === 'Gala') {
    const keyLower = variantKey.toLowerCase();
    if (keyLower.includes('bundle:bundle b')) return PRODUCT_IMAGES['Gala Bundle B'];
    if (keyLower.includes('bundle:bundle c')) return PRODUCT_IMAGES['Gala Bundle C'];
    if (keyLower.includes('bundle:bundle d')) return PRODUCT_IMAGES['Gala Bundle D'];
    if (keyLower.includes('bundle:bundle e')) return PRODUCT_IMAGES['Gala Bundle E'];
    if (keyLower.includes('bundle:bundle f')) return PRODUCT_IMAGES['Gala Bundle F'];
    if (keyLower.includes('bundle:bundle g')) return PRODUCT_IMAGES['Gala Bundle G'];
    if (keyLower.includes('bundle:bundle h')) return PRODUCT_IMAGES['Gala Bundle H'];
    if (keyLower.includes('bundle:bundle i')) return PRODUCT_IMAGES['Gala Bundle I'];
    return PRODUCT_IMAGES['Gala Bundle A'];
  }
  
  if (name === 'Type C Uniform') {
    const keyLower = variantKey.toLowerCase();
    if (keyLower.includes('course:bsmare')) return PRODUCT_IMAGES['Type C-BSMARE'];
    if (keyLower.includes('course:shs')) return PRODUCT_IMAGES['Type C-SHS'];
    return PRODUCT_IMAGES['Type C-BSMT']; // Default/BSMT
  }
  
  if (name === 'Lanyard') {
    const keyLower = variantKey.toLowerCase();
    if (keyLower.includes('course:bsmare')) return PRODUCT_IMAGES['Lanyard-BSMARE'];
    if (keyLower.includes('course:shs')) return PRODUCT_IMAGES['Lanyard-SHS'];
    if (keyLower.includes('course:hm')) return PRODUCT_IMAGES['Lanyard-HM'];
    if (keyLower.includes('course:tm') || keyLower.includes('tourism')) return PRODUCT_IMAGES['Lanyard-TM'];
    return PRODUCT_IMAGES['Lanyard-BSMT'];
  }
  
  if (name === 'Hard Hat') {
    const keyLower = variantKey.toLowerCase();
    if (keyLower.includes('color:blue')) return PRODUCT_IMAGES['Hardhat-Blue'];
    return PRODUCT_IMAGES['Hardhat-Yellow'];
  }
  
  if (name === 'Pershing Cap') {
    const keyLower = variantKey.toLowerCase();
    if (keyLower.includes('course:bsmare')) return PRODUCT_IMAGES['Pershing Cap BSMARE'];
    return PRODUCT_IMAGES['Pershing Cap'];
  }
  
  if (name === 'Cover All') {
    const keyLower = variantKey.toLowerCase();
    if (keyLower.includes('color:blue')) return PRODUCT_IMAGES['Cover All BLUE'];
    return PRODUCT_IMAGES['Coverall'];
  }
  
  if (name === 'Belt') {
    const keyLower = variantKey.toLowerCase();
    if (keyLower.includes('color:white')) return PRODUCT_IMAGES['White Belt'];
    return PRODUCT_IMAGES['Black Belt'];
  }
  
  if (name === 'Shoulder Board') {
    const keyLower = variantKey.toLowerCase();
    if (keyLower.includes('course:bsmare')) return PRODUCT_IMAGES['Shoulder board 1'];
    return PRODUCT_IMAGES['Shoulder board 2'];
  }
  
  if (name === 'ROTC Manual') {
    const keyLower = variantKey.toLowerCase();
    if (keyLower.includes('part:part 1')) return PRODUCT_IMAGES['ROTC Manual Part 1'];
    return PRODUCT_IMAGES['ROTC Manual'];
  }
  
  if (name === 'BSNAME Uniform') return PRODUCT_IMAGES['BSNAME Uniform'];
  if (name === 'ID Case') return PRODUCT_IMAGES['ID Case'];
  if (name === 'Handbag') return PRODUCT_IMAGES['Handbag'];
  if (name === 'Hard Bound') return PRODUCT_IMAGES['Hardbound'];
  if (name === 'Safety Shoes') return PRODUCT_IMAGES['Safety Shoes'];
  if (name === 'Gloves') return PRODUCT_IMAGES['Gloves'];
  if (name === 'PE Tshirt') return PRODUCT_IMAGES['PE Shirt'];
  if (name === 'PE Pants') return PRODUCT_IMAGES['PE Pants'];
  if (name === 'Plotting Sheet') return PRODUCT_IMAGES['Plotting Sheet'];
  if (name === 'PE Short') return PRODUCT_IMAGES['PE Shorts'];
  if (name === 'Swimming Set') return PRODUCT_IMAGES['Swimming Trunks'];
  if (name === 'Swimming Cap') return PRODUCT_IMAGES['Cap'];
  if (name === 'CWTS Shirt') return PRODUCT_IMAGES['CWTS Shirt'];
  if (name === 'White Shoes') return PRODUCT_IMAGES['White Shoes '];
  if (name === 'Safety Goggles') return PRODUCT_IMAGES['Goggles'];
  if (name === 'Rope') return PRODUCT_IMAGES['Rope'];

  return customImage;
};

// Helper to get preset variant options based on product name
const getPresetOptions = (productName: string) => {
  const name = productName || '';
  if (name === 'Type C Uniform') {
    return [
      { label: 'BSMT', value: PRODUCT_IMAGES['Type C-BSMT'] },
      { label: 'BSMARE', value: PRODUCT_IMAGES['Type C-BSMARE'] },
      { label: 'SHS', value: PRODUCT_IMAGES['Type C-SHS'] },
    ];
  }
  if (name === 'Lanyard') {
    return [
      { label: 'BSMT', value: PRODUCT_IMAGES['Lanyard-BSMT'] },
      { label: 'BSMARE', value: PRODUCT_IMAGES['Lanyard-BSMARE'] },
      { label: 'SHS', value: PRODUCT_IMAGES['Lanyard-SHS'] },
      { label: 'HM', value: PRODUCT_IMAGES['Lanyard-HM'] },
      { label: 'TM', value: PRODUCT_IMAGES['Lanyard-TM'] },
    ];
  }
  if (name === 'Hard Hat') {
    return [
      { label: 'Yellow', value: PRODUCT_IMAGES['Hardhat-Yellow'] },
      { label: 'Blue', value: PRODUCT_IMAGES['Hardhat-Blue'] },
    ];
  }
  if (name === 'Pershing Cap') {
    return [
      { label: 'BSMT', value: PRODUCT_IMAGES['Pershing Cap'] },
      { label: 'BSMARE', value: PRODUCT_IMAGES['Pershing Cap BSMARE'] },
    ];
  }
  if (name === 'Cover All') {
    return [
      { label: 'Orange', value: PRODUCT_IMAGES['Coverall'] },
      { label: 'Blue', value: PRODUCT_IMAGES['Cover All BLUE'] },
    ];
  }
  if (name === 'Belt') {
    return [
      { label: 'Black', value: PRODUCT_IMAGES['Black Belt'] },
      { label: 'White', value: PRODUCT_IMAGES['White Belt'] },
    ];
  }
  if (name === 'Shoulder Board') {
    return [
      { label: 'BSMT', value: PRODUCT_IMAGES['Shoulder board 2'] },
      { label: 'BSMARE', value: PRODUCT_IMAGES['Shoulder board 1'] },
    ];
  }
  if (name === 'ROTC Manual') {
    return [
      { label: 'Part 1', value: PRODUCT_IMAGES['ROTC Manual Part 1'] },
      { label: 'Part 2', value: PRODUCT_IMAGES['ROTC Manual'] },
    ];
  }
  if (name === 'Gala') {
    return [
      { label: 'Bundle A', value: PRODUCT_IMAGES['Gala Bundle A'] },
      { label: 'Bundle B', value: PRODUCT_IMAGES['Gala Bundle B'] },
      { label: 'Bundle C', value: PRODUCT_IMAGES['Gala Bundle C'] },
      { label: 'Bundle D', value: PRODUCT_IMAGES['Gala Bundle D'] },
      { label: 'Bundle E', value: PRODUCT_IMAGES['Gala Bundle E'] },
      { label: 'Bundle F', value: PRODUCT_IMAGES['Gala Bundle F'] },
      { label: 'Bundle G', value: PRODUCT_IMAGES['Gala Bundle G'] },
      { label: 'Bundle H', value: PRODUCT_IMAGES['Gala Bundle H'] },
      { label: 'Bundle I', value: PRODUCT_IMAGES['Gala Bundle I'] },
    ];
  }
  return [];
};

// Helper function to format product name with variants
const formatProductNameWithVariants = (item: any): string => {
  // Get the full product name from database
  let fullName = item?.product_name || item?.productName || 'Unknown Product';
  
  // Clean up any extra spaces and repeated segments
  fullName = cleanRepeatedSegments(fullName.replace(/\s+/g, ' ').trim());
  
  // If the name already appears to be formatted (contains " - " pattern multiple times),
  // check for duplicates and clean up
  const dashCount = (fullName.match(/ - /g) || []).length;
  if (dashCount >= 2) {
    // Check for duplicate variant values (e.g., "Gala - Bundle G - Bundle G (BSMARE)")
    const parts = fullName.split(' - ');
    if (parts.length >= 3) {
      // Check if the second and third parts are the same (before any parenthesis)
      const secondPart = parts[1].trim();
      const thirdPartBeforeParen = parts[2].split('(')[0].trim();
      
      // Compare after trimming both parts
      if (secondPart.toLowerCase() === thirdPartBeforeParen.toLowerCase()) {
        // Remove the duplicate - keep base name, variant name, and everything after (including course code)
        const baseName = parts[0].trim();
        const variantName = parts[1].trim();
        // Get everything after the duplicate, including the course code in parentheses
        const afterDuplicate = parts[2].substring(thirdPartBeforeParen.length).trim();
        return cleanRepeatedSegments(`${baseName} - ${variantName} ${afterDuplicate}`.trim());
      }
    }
    
    return cleanRepeatedSegments(fullName);
  }
  
  // Get unit price to determine if member discount was applied
  const unitPrice = item?.unitPrice || item?.unit_price;
  
  // Parse selected options - handle both string and object formats
  let options: Record<string, string> = {};
  if (item?.selectedOptions || item?.selected_options) {
    const selectedOpts = item?.selectedOptions || item?.selected_options;
    try {
      if (typeof selectedOpts === 'string') {
        options = JSON.parse(selectedOpts);
      } else if (typeof selectedOpts === 'object' && selectedOpts !== null) {
        options = selectedOpts;
      }
    } catch (e) {
      console.warn('Failed to parse selectedOptions:', selectedOpts);
    }
  }
  
  // If we have selectedOptions, use the standard formatter
  if (options && Object.keys(options).length > 0) {
    // Extract base name from full name (remove everything after first parenthesis)
    const baseNameMatch = fullName.match(/^([^(]+)/);
    const baseName = baseNameMatch ? baseNameMatch[1].trim() : fullName;
    return cleanRepeatedSegments(formatProductName(baseName, options, unitPrice));
  }
  
  // Fallback: Parse the legacy format from the product name itself
  // This handles old orders where the full format was stored in product_name
  return cleanRepeatedSegments(parseAndFormatLegacyProductName(fullName, unitPrice));
};

// Helper function to extract variants array cleanly whether stored as object or array
const getProductVariantsList = (p: any): Array<{ itemKeySuffix: string; variantKey?: string; variantStr: string; sku: string; price: number; stock: number; [key: string]: any }> => {
  if (!p || !p.variants) return [];
  
  let rawVariants: any[] = [];
  if (Array.isArray(p.variants)) {
    rawVariants = p.variants.map((v: any, idx: number) => ({ _vKey: `v_${idx}`, ...v }));
  } else if (typeof p.variants === 'object' && p.variants !== null) {
    rawVariants = Object.entries(p.variants).map(([vKey, vVal]: [string, any]) => {
      const vObj = typeof vVal === 'object' && vVal !== null ? vVal : { stock: Number(vVal) || 0 };
      return { _vKey: vKey, ...vObj };
    });
  }

  const parsedProductPrice = parseFloat(p.price) || 0;

  return rawVariants.map((v: any, idx: number) => {
    const itemKeySuffix = `v_${idx}`;
    let variantStr = '';
    if (v.options && typeof v.options === 'object' && Object.keys(v.options).length > 0) {
      variantStr = Object.entries(v.options)
        .map(([k, val]) => {
          if (k.toLowerCase().startsWith('option-') || k.toLowerCase().startsWith('opt_') || !isNaN(Number(k))) {
            return `${val}`;
          }
          return `${k}: ${val}`;
        })
        .join(', ');
    } else if (v._vKey) {
      variantStr = v._vKey.replace(/-/g, ' ').replace(/_/g, ' ');
    } else {
      variantStr = Object.entries(v)
        .filter(([k]) => k !== 'stock' && k !== 'price' && k !== 'sku' && k !== '_vKey')
        .map(([k, val]) => `${k}: ${val}`)
        .join(', ');
    }

    const parsedVPrice = parseFloat(v.price);
    const vPrice = !isNaN(parsedVPrice) && parsedVPrice > 0 ? parsedVPrice : parsedProductPrice;
    const sysStock = typeof v.stock === 'number' ? v.stock : (parseInt(v.stock, 10) || 0);

    return {
      itemKeySuffix,
      variantKey: v._vKey,
      variantStr,
      sku: v.sku || `${p.sku || 'SKU'}-${idx + 1}`,
      price: vPrice,
      stock: sysStock,
      options: v.options || {},
    };
  });
};

interface ReceiveStockVariantFieldProps {
  productId: string;
  selectedVariantIndex: string;
  products: Product[];
  onVariantChange: (vIdx: string, unitPrice: number) => void;
}

const ReceiveStockVariantField: React.FC<ReceiveStockVariantFieldProps> = ({
  productId,
  selectedVariantIndex,
  products,
  onVariantChange,
}) => {
  const targetP = products.find((p) => p.id === productId);
  if (!targetP) return null;
  const vList = getProductVariantsList(targetP);
  if (!vList || vList.length === 0) return null;

  const selectedV =
    selectedVariantIndex !== '' && !isNaN(parseInt(selectedVariantIndex, 10))
      ? vList[parseInt(selectedVariantIndex, 10)]
      : null;

  return (
    <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-200/80 space-y-2">
      <AnimatedSelect
        label="Select Variant *"
        value={selectedVariantIndex}
        placeholder="-- Select Variant (e.g. Size, Course) --"
        options={vList.map((v, idx) => ({
          value: String(idx),
          label: `${v.variantStr} (Current Stock: ${v.stock} Pcs) - ₱${v.price.toFixed(2)}`,
        }))}
        onChange={(vIdx) => {
          const vItem = vIdx !== '' ? vList[parseInt(vIdx, 10)] : null;
          onVariantChange(vIdx, vItem ? vItem.price : (parseFloat(targetP.price) || 0));
        }}
      />
      {selectedV && (
        <p className="text-[11px] text-purple-800 font-semibold flex items-center gap-1.5 pt-1">
          <Package size={13} />
          <span>
            Current Variant Inventory Stock: <strong>{selectedV.stock} Pcs</strong>
          </span>
        </p>
      )}
    </div>
  );
};

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
  
  const { user } = useAuth();
  const { products, addProduct, deleteProduct, updateProduct } =
    useAppStore();
  const { showNotification, setSidebarOpen } = useUIStore();

  const [activeTab, setActiveTab] = useState<'inventory' | 'stock-intake' | 'stock-receiving' | 'monthly' | 'summary'>('inventory');

  // Stock Receiving (Incoming Stock Arrival with Auto Inventory Update) states
  interface StockReceivingRecord {
    id: string;
    dateReceived: string;
    referenceNo: string;
    productId: string;
    productName: string;
    variantKey?: string;
    variantLabel?: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
    supplier: string;
    receivedBy: string;
    notes: string;
    createdAt: string;
  }

  const [stockReceivingRecords, setStockReceivingRecords] = useState<StockReceivingRecord[]>(() => {
    const saved = localStorage.getItem('silms_stock_receiving_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stock receiving records:', e);
      }
    }
    return [
      {
        id: 'rcv-1001',
        dateReceived: '2026-08-10',
        referenceNo: 'DR-2026-8801',
        productId: 'prod-001',
        productName: 'Rice',
        quantity: 50,
        unitCost: 250,
        totalValue: 12500,
        supplier: 'Grains Supplier Co.',
        receivedBy: 'Office Staff',
        notes: 'Delivered 50 sacks via delivery truck',
        createdAt: '2026-08-10T08:30:00Z',
      },
      {
        id: 'rcv-1002',
        dateReceived: '2026-08-08',
        referenceNo: 'DR-2026-8790',
        productId: 'prod-002',
        productName: 'Lanyard',
        variantLabel: 'HM',
        quantity: 100,
        unitCost: 45,
        totalValue: 4500,
        supplier: 'Accents & Badges Inc.',
        receivedBy: 'Office Staff',
        notes: '100 pcs HM Lanyards packed in 2 boxes',
        createdAt: '2026-08-08T10:15:00Z',
      },
    ];
  });

  const [showReceiveStockModal, setShowReceiveStockModal] = useState<boolean>(false);
  const [deleteReceivingConfirmModal, setDeleteReceivingConfirmModal] = useState<{ show: boolean; record: StockReceivingRecord | null }>({ show: false, record: null });
  const [receiveStockSearchQuery, setReceiveStockSearchQuery] = useState<string>('');
  const [receiveStockCurrentPage, setReceiveStockCurrentPage] = useState<number>(1);
  const receiveStockItemsPerPage = 10;

  const [receiveStockFormData, setReceiveStockFormData] = useState({
    productId: '',
    selectedVariantIndex: '',
    quantity: 1,
    unitCost: 0,
    supplier: '',
    referenceNo: '',
    dateReceived: new Date().toISOString().split('T')[0],
    receivedBy: 'Office Staff',
    notes: '',
  });
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [monthlySearchQuery, setMonthlySearchQuery] = useState<string>('');
  const [monthlyPaymentTypeFilter, setMonthlyPaymentTypeFilter] = useState<'all' | 'full' | 'downpayment' | 'balance'>('all');
  const [selectedMonthlyExportProducts, setSelectedMonthlyExportProducts] = useState<string[]>([]);
  const [showMonthlyExportModal, setShowMonthlyExportModal] = useState<boolean>(false);
  const [selectedProductSoldDetails, setSelectedProductSoldDetails] = useState<{ productName: string; paymentType?: 'full' | 'downpayment' | 'balance'; quantity: number } | null>(null);
  const [productSoldSearchQuery, setProductSoldSearchQuery] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});
  const [variantPrices, setVariantPrices] = useState<Record<string, number>>({});
  const [variantImages, setVariantImages] = useState<Record<string, string>>({});
  const [newChoiceInputs, setNewChoiceInputs] = useState<Record<string, string>>({});
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
  const [deleteIntakeConfirm, setDeleteIntakeConfirm] = useState<{ show: boolean; record: any | null; isDeleting: boolean }>({ show: false, record: null, isDeleting: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedOverChoice, setDraggedOverChoice] = useState<{ optionIndex: number; choiceIndex: number } | null>(null);

  
  // Purchase Invoices (Stock Intake) states
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [viewInvoiceModal, setViewInvoiceModal] = useState<{ show: boolean; record: any | null }>({ show: false, record: null });
  const [stockIntakeRecords, setStockIntakeRecords] = useState<any[]>([]);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceCurrentPage, setInvoiceCurrentPage] = useState(1);
  const invoiceItemsPerPage = 10;
  const [showStockIntakeForm, setShowStockIntakeForm] = useState(false);
  const [isDueDateDropdownOpen, setIsDueDateDropdownOpen] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [openItemDropdownIndex, setOpenItemDropdownIndex] = useState<number | null>(null);
  const [openAccountDropdownIndex, setOpenAccountDropdownIndex] = useState<number | null>(null);
  const [openUnitDropdownIndex, setOpenUnitDropdownIndex] = useState<number | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [showJournalModal, setShowJournalModal] = useState(false);

  // Month-End Physical Inventory Stock Summary states
  const summaryMonthOptions = React.useMemo(() => {
    const options: Array<{ label: string; value: string }> = [];
    const currentDate = new Date();
    // Generate current month and preceding 11 months dynamically
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = d.toLocaleString('en-US', { month: 'long' });
      const year = d.getFullYear();
      const val = `${monthName} ${year}`;
      options.push({
        value: val,
        label: i === 0 ? `${val} (Current)` : val,
      });
    }
    return options;
  }, []);

  const [selectedSummaryMonth, setSelectedSummaryMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`;
  });
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number>>({});
  const [summaryCategoryFilter, setSummaryCategoryFilter] = useState<string>('all');
  const [summaryStockStatusFilter, setSummaryStockStatusFilter] = useState<'all' | 'instock' | 'lowstock' | 'out-of-stock' | 'discrepancy'>('all');
  const [summarySearchQuery, setSummarySearchQuery] = useState('');
  const [isAuditSaved, setIsAuditSaved] = useState<boolean>(false);
  const [showPrintAuditSheetModal, setShowPrintAuditSheetModal] = useState<boolean>(false);
  const [summaryCurrentPage, setSummaryCurrentPage] = useState(1);
  const [summaryRowsPerPage, setSummaryRowsPerPage] = useState(15);

  // Month-End Physical Audit Form Modal states
  const [showPhysicalAuditModal, setShowPhysicalAuditModal] = useState<boolean>(false);
  const [tempPhysicalCounts, setTempPhysicalCounts] = useState<Record<string, number>>({});
  const [auditModalCategory, setAuditModalCategory] = useState<string>('all');
  const [auditModalSearch, setAuditModalSearch] = useState<string>('');


  const getInventoryProductDisplayTitle = (name: string, variantLabel?: string) => {
    const baseName = (name || '').trim();
    const rawVariant = (variantLabel || '').trim();

    if (!rawVariant) {
      return { title: baseName, subtitle: '' };
    }

    // Clean up variant string
    let cleanVariant = rawVariant
      .replace(/\b(course|option):\s*/gi, '')
      .trim();

    // If cleanVariant already contains baseName (e.g. "UC Patch" for baseName "Patch")
    if (cleanVariant.toLowerCase().includes(baseName.toLowerCase())) {
      return { title: cleanVariant, subtitle: '' };
    }

    // If baseName contains cleanVariant
    if (baseName.toLowerCase().includes(cleanVariant.toLowerCase())) {
      return { title: baseName, subtitle: '' };
    }

    // For short course/program codes like "HM", "SHS", "BSMT", "BSMARE", "TOURISM"
    // Combine into single clean title: e.g. "HM Lanyard", "SHS Lanyard", "BSMT Lanyard"
    if (/^[A-Za-z0-9\s&-]{1,15}$/.test(cleanVariant) && !cleanVariant.includes(',')) {
      return { title: `${cleanVariant} ${baseName}`, subtitle: '' };
    }

    // For multi-attribute variants like "size: 4 (₱350), course: BSMT" -> "Pershing Cap (4 (₱350), BSMT)"
    let formattedVariant = rawVariant
      .replace(/\b(course|size|option):\s*/gi, '')
      .trim();

    return { title: `${baseName} (${formattedVariant})`, subtitle: '' };
  };

  const isMadeToOrderProduct = (p: any) => {
    if (!p) return false;
    const nameLower = (p.name || '').toLowerCase().trim();

    if (p.madeToOrder === true) return true;

    const madeToOrderNames = [
      'type a & b uniform',
      'type a & b',
      'bsname uniform',
      'bsname',
      'gala',
      'gala uniform',
      'hardbound',
      'hard bound',
    ];

    if (madeToOrderNames.some((target) => nameLower.includes(target))) {
      return true;
    }

    if (nameLower.includes('made to order') || nameLower.includes('preorder') || nameLower.includes('pre-order')) {
      return true;
    }

    return false;
  };

  // Category filter options matching the exact master categories from the Inventory catalog tab
  const summaryCategoryOptions = [
    { key: 'all', label: 'All Categories' },
    { key: 'uniform', label: 'Uniform' },
    { key: 'accessory', label: 'Accessory' },
    { key: 'equipment', label: 'PPE (Personal Protective Equipment)' },
    { key: 'service', label: 'Service' },
    { key: 'essentials', label: 'Essentials' },
  ];

  const matchesSummaryCategory = (itemCategory: string, filterKey: string) => {
    if (!filterKey || filterKey === 'all') return true;
    const cat = (itemCategory || '').toLowerCase().trim();
    const filter = filterKey.toLowerCase().trim();

    if (filter === 'uniform') {
      return cat === 'uniform' || cat === 'uniforms';
    }
    if (filter === 'accessory') {
      return cat === 'accessory' || cat === 'accessories';
    }
    if (filter === 'equipment' || filter === 'ppe') {
      return cat === 'equipment' || cat === 'ppe' || cat.includes('personal protective') || cat.includes('safety');
    }
    if (filter === 'service') {
      return cat === 'service' || cat === 'services';
    }
    if (filter === 'essentials') {
      return cat === 'essentials' || cat === 'essential' || cat === 'grocery' || cat === 'groceries';
    }

    return cat === filter;
  };

  // Handler to receive new incoming stock and automatically update Inventory Catalog stock
  const handleSaveStockReceiving = async () => {
    const { productId, selectedVariantIndex, quantity, unitCost, supplier, referenceNo, dateReceived, receivedBy, notes } = receiveStockFormData;
    
    const qtyNum = parseInt(String(quantity), 10);
    if (!productId) {
      showNotification('Please select a merchandise product to receive.', 'error');
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      showNotification('Please enter a valid received quantity greater than 0.', 'error');
      return;
    }

    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) {
      showNotification('Selected product not found.', 'error');
      return;
    }

    const costNum = parseFloat(String(unitCost)) || parseFloat(targetProduct.price) || 0;
    const vList = getProductVariantsList(targetProduct);
    let variantLabel = '';
    let variantKey = '';
    let updatedProduct: any = { ...targetProduct };

    if (vList.length > 0) {
      // Product has variants
      const vIndex = parseInt(String(selectedVariantIndex), 10);
      if (isNaN(vIndex) || vIndex < 0 || vIndex >= vList.length) {
        showNotification('Please select a specific product variant to receive.', 'error');
        return;
      }
      const targetVariant = vList[vIndex];
      variantLabel = targetVariant.variantStr;
      variantKey = targetVariant.variantKey || `v_${vIndex}`;

      if (Array.isArray(targetProduct.variants)) {
        let updatedVariants = targetProduct.variants.map((v: any, idx: number) => {
          if (idx === vIndex) {
            const currentStock = typeof v.stock === 'number' ? v.stock : (parseInt(v.stock, 10) || 0);
            return { ...v, stock: currentStock + qtyNum };
          }
          return v;
        });
        const newTotalStock = updatedVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        updatedProduct = { ...targetProduct, variants: updatedVariants, stock: newTotalStock };
      } else if (typeof targetProduct.variants === 'object' && targetProduct.variants !== null) {
        let updatedVariants = { ...targetProduct.variants };
        const vKeyTarget = targetVariant.variantKey || Object.keys(targetProduct.variants)[vIndex];
        if (vKeyTarget && updatedVariants[vKeyTarget]) {
          const currentStock = typeof updatedVariants[vKeyTarget].stock === 'number' ? updatedVariants[vKeyTarget].stock : (parseInt(updatedVariants[vKeyTarget].stock, 10) || 0);
          updatedVariants[vKeyTarget] = {
            ...updatedVariants[vKeyTarget],
            stock: currentStock + qtyNum,
          };
          const newTotalStock = Object.values(updatedVariants).reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
          updatedProduct = { ...targetProduct, variants: updatedVariants, stock: newTotalStock };
        }
      }
    } else {
      // Simple product without variants
      const currentStock = typeof targetProduct.stock === 'number' ? targetProduct.stock : (parseInt(targetProduct.stock, 10) || 0);
      updatedProduct = { ...targetProduct, stock: currentStock + qtyNum };
    }

    try {
      // 1. Update product stock on Inventory tab via Zustand store
      updateProduct(targetProduct.id, updatedProduct);

      // 2. Persist updated product to backend API
      try {
        await AppDataSync.syncProductToAPI(updatedProduct);
      } catch (apiErr) {
        console.error('Failed to sync updated product stock to API:', apiErr);
      }

      // 3. Save Stock Receiving Log
      const refCode = referenceNo || `RCV-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReceivingRecord: StockReceivingRecord = {
        id: `rcv-${Date.now()}`,
        dateReceived: dateReceived || new Date().toISOString().split('T')[0],
        referenceNo: refCode,
        productId: targetProduct.id,
        productName: targetProduct.name,
        variantKey,
        variantLabel,
        quantity: qtyNum,
        unitCost: costNum,
        totalValue: qtyNum * costNum,
        supplier: supplier || 'General Supplier',
        receivedBy: receivedBy || 'Office Staff',
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };

      const updatedRecords = [newReceivingRecord, ...stockReceivingRecords];
      setStockReceivingRecords(updatedRecords);
      try {
        localStorage.setItem('silms_stock_receiving_records', JSON.stringify(updatedRecords));
      } catch (err) {
        console.error('Failed to save receiving records to localStorage:', err);
      }

      const itemDisplayName = variantLabel ? `${targetProduct.name} (${variantLabel})` : targetProduct.name;
      showNotification(`Successfully received ${qtyNum} pcs of ${itemDisplayName}! Inventory stock level updated.`, 'success');
      setShowReceiveStockModal(false);
    } catch (err) {
      console.error('Failed to record stock receiving:', err);
      showNotification('Failed to process stock receiving record.', 'error');
    }
  };

  const handleDeleteStockReceivingRecord = (record: StockReceivingRecord) => {
    setDeleteReceivingConfirmModal({ show: true, record });
  };

  const confirmDeleteReceivingRecord = async () => {
    const record = deleteReceivingConfirmModal.record;
    if (!record) return;

    try {
      const targetProduct = products.find(p => p.id === record.productId);
      if (targetProduct) {
        let updatedProduct: any = { ...targetProduct };
        const vList = getProductVariantsList(targetProduct);

        if (vList.length > 0 && record.variantLabel) {
          const vIndex = vList.findIndex(v => v.variantStr === record.variantLabel || v.variantKey === record.variantKey);
          if (vIndex !== -1) {
            if (Array.isArray(targetProduct.variants)) {
              let updatedVariants = targetProduct.variants.map((v: any, idx: number) => {
                if (idx === vIndex) {
                  const currentStock = typeof v.stock === 'number' ? v.stock : (parseInt(v.stock, 10) || 0);
                  return { ...v, stock: Math.max(0, currentStock - record.quantity) };
                }
                return v;
              });
              const newTotalStock = updatedVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
              updatedProduct = { ...targetProduct, variants: updatedVariants, stock: newTotalStock };
            } else if (typeof targetProduct.variants === 'object' && targetProduct.variants !== null) {
              let updatedVariants = { ...targetProduct.variants };
              const vKeyTarget = record.variantKey || Object.keys(targetProduct.variants)[vIndex];
              if (vKeyTarget && updatedVariants[vKeyTarget]) {
                const currentStock = typeof updatedVariants[vKeyTarget].stock === 'number' ? updatedVariants[vKeyTarget].stock : (parseInt(updatedVariants[vKeyTarget].stock, 10) || 0);
                updatedVariants[vKeyTarget] = {
                  ...updatedVariants[vKeyTarget],
                  stock: Math.max(0, currentStock - record.quantity),
                };
                const newTotalStock = Object.values(updatedVariants).reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
                updatedProduct = { ...targetProduct, variants: updatedVariants, stock: newTotalStock };
              }
            }
          }
        } else {
          const currentStock = typeof targetProduct.stock === 'number' ? targetProduct.stock : (parseInt(targetProduct.stock, 10) || 0);
          updatedProduct = { ...targetProduct, stock: Math.max(0, currentStock - record.quantity) };
        }

        updateProduct(targetProduct.id, updatedProduct);
        try {
          await AppDataSync.syncProductToAPI(updatedProduct);
        } catch (apiErr) {
          console.error('Failed to sync deducted stock to API:', apiErr);
        }
      }

      const updatedRecords = stockReceivingRecords.filter(r => r.id !== record.id);
      setStockReceivingRecords(updatedRecords);
      localStorage.setItem('silms_stock_receiving_records', JSON.stringify(updatedRecords));
      showNotification(`Removed receiving entry ${record.referenceNo} and reverted inventory stock.`, 'success');
      setDeleteReceivingConfirmModal({ show: false, record: null });
    } catch (err) {
      console.error('Failed to delete stock receiving record:', err);
      showNotification('Failed to remove stock receiving record.', 'error');
    }
  };

  // Load and sync physical stock counts from localStorage whenever selected month or products change
  useEffect(() => {
    const savedKey = `coop_monthly_inventory_physical_${selectedSummaryMonth.replace(/\s+/g, '_')}`;
    const saved = localStorage.getItem(savedKey);
    if (saved) {
      try {
        setPhysicalCounts(JSON.parse(saved));
        setIsAuditSaved(true);
        return;
      } catch (e) {
        console.error('Failed to parse physical counts:', e);
      }
    }
    // Default physical counts to current system stock
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      if (isMadeToOrderProduct(p)) return;
      const vList = getProductVariantsList(p);
      if (vList.length > 0) {
        vList.forEach((v, idx) => {
          initial[`${p.id}_v_${idx}`] = v.stock;
        });
      } else {
        initial[p.id] = typeof p.stock === 'number' ? p.stock : (parseInt(p.stock, 10) || 0);
      }
    });
    setPhysicalCounts(initial);
    setIsAuditSaved(false);
  }, [selectedSummaryMonth, products]);

  const handleOpenPhysicalAuditModal = (filterSearchText?: string) => {
    const initial: Record<string, number> = { ...physicalCounts };
    products.forEach((p) => {
      if (isMadeToOrderProduct(p)) return;
      const vList = getProductVariantsList(p);
      if (vList.length > 0) {
        vList.forEach((v, idx) => {
          const key = `${p.id}_v_${idx}`;
          if (!(key in initial)) {
            initial[key] = v.stock;
          }
        });
      } else {
        if (!(p.id in initial)) {
          initial[p.id] = typeof p.stock === 'number' ? p.stock : (parseInt(p.stock, 10) || 0);
        }
      }
    });
    setTempPhysicalCounts(initial);
    setAuditModalSearch(filterSearchText || '');
    setAuditModalCategory('all');
    setShowPhysicalAuditModal(true);
  };

  const handleSavePhysicalAuditModal = () => {
    setPhysicalCounts(tempPhysicalCounts);
    const savedKey = `coop_monthly_inventory_physical_${selectedSummaryMonth.replace(/\s+/g, '_')}`;
    localStorage.setItem(savedKey, JSON.stringify(tempPhysicalCounts));
    setIsAuditSaved(true);
    setShowPhysicalAuditModal(false);
    showNotification(`Month-end physical count audit for ${selectedSummaryMonth} submitted and saved successfully!`, 'success');
  };

  const handleAutoFillFromSystemStock = () => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      if (isMadeToOrderProduct(p)) return;
      const vList = getProductVariantsList(p);
      if (vList.length > 0) {
        vList.forEach((v, idx) => {
          initial[`${p.id}_v_${idx}`] = v.stock;
        });
      } else {
        initial[p.id] = typeof p.stock === 'number' ? p.stock : (parseInt(p.stock, 10) || 0);
      }
    });
    setTempPhysicalCounts(initial);
    showNotification('Pre-filled physical count form with current System Stock values!', 'success');
  };

  const handleTempPhysicalCountChange = (itemKey: string, valStr: string) => {
    const parsed = parseInt(valStr, 10);
    const num = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setTempPhysicalCounts(prev => ({
      ...prev,
      [itemKey]: num
    }));
  };

  // Flatten products & variants for physical stock inventory summary
  const inventorySummaryItems = React.useMemo(() => {
    const items: Array<{
      itemKey: string;
      productId: string;
      name: string;
      sku: string;
      category: string;
      variantLabel: string;
      unitPrice: number;
      systemStock: number;
      physicalStock: number;
      variance: number;
      totalValue: number;
      image: string;
    }> = [];

    products.forEach((p) => {
      if (isMadeToOrderProduct(p)) return;
      const category = p.category || 'General';
      const image = p.image || '';
      const parsedProductPrice = parseFloat(p.price) || 0;
      const sysStockMain = typeof p.stock === 'number' ? p.stock : (parseInt(p.stock, 10) || 0);
      const vList = getProductVariantsList(p);

      if (vList.length > 0) {
        vList.forEach((v, idx) => {
          const itemKey = `${p.id}_v_${idx}`;
          const physStock = itemKey in physicalCounts ? (Number(physicalCounts[itemKey]) || 0) : v.stock;

          items.push({
            itemKey,
            productId: p.id,
            name: p.name,
            sku: v.sku,
            category,
            variantLabel: v.variantStr,
            unitPrice: v.price,
            systemStock: v.stock,
            physicalStock: physStock,
            variance: physStock - v.stock,
            totalValue: physStock * v.price,
            image,
          });
        });
      } else {
        const itemKey = p.id;
        const sysStock = sysStockMain;
        const physStock = itemKey in physicalCounts ? (Number(physicalCounts[itemKey]) || 0) : sysStock;

        items.push({
          itemKey,
          productId: p.id,
          name: p.name,
          sku: p.sku || 'SKU-00',
          category,
          variantLabel: '',
          unitPrice: parsedProductPrice,
          systemStock: sysStock,
          physicalStock: physStock,
          variance: physStock - sysStock,
          totalValue: physStock * parsedProductPrice,
          image,
        });
      }
    });

    return items;
  }, [products, physicalCounts]);

  const filteredSummaryItems = React.useMemo(() => {
    return inventorySummaryItems.filter((item) => {
      const query = summarySearchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.variantLabel.toLowerCase().includes(query);

      const matchesCategory = matchesSummaryCategory(item.category, summaryCategoryFilter);

      let matchesStatus = true;
      if (summaryStockStatusFilter === 'instock') {
        matchesStatus = item.systemStock > 5;
      } else if (summaryStockStatusFilter === 'lowstock') {
        matchesStatus = item.systemStock > 0 && item.systemStock <= 5;
      } else if (summaryStockStatusFilter === 'out-of-stock') {
        matchesStatus = item.systemStock === 0;
      } else if (summaryStockStatusFilter === 'discrepancy') {
        matchesStatus = item.variance !== 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventorySummaryItems, summarySearchQuery, summaryCategoryFilter, summaryStockStatusFilter]);

  const summaryMetrics = React.useMemo(() => {
    const totalItems = inventorySummaryItems.length;
    const totalSystemUnits = inventorySummaryItems.reduce((acc, i) => acc + i.systemStock, 0);
    const totalPhysicalUnits = inventorySummaryItems.reduce((acc, i) => acc + i.physicalStock, 0);
    const totalStockValuation = inventorySummaryItems.reduce((acc, i) => acc + (i.physicalStock * i.unitPrice), 0);
    const discrepanciesCount = inventorySummaryItems.filter(i => i.variance !== 0).length;
    const lowStockCount = inventorySummaryItems.filter(i => i.systemStock <= 5).length;

    return {
      totalItems,
      totalSystemUnits,
      totalPhysicalUnits,
      totalStockValuation,
      discrepanciesCount,
      lowStockCount,
    };
  }, [inventorySummaryItems]);

  const handlePhysicalCountChange = (itemKey: string, valStr: string) => {
    const parsed = parseInt(valStr, 10);
    const num = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setPhysicalCounts(prev => ({
      ...prev,
      [itemKey]: num
    }));
    setIsAuditSaved(false);
  };

  const handleSavePhysicalAudit = () => {
    const savedKey = `coop_monthly_inventory_physical_${selectedSummaryMonth.replace(/\s+/g, '_')}`;
    localStorage.setItem(savedKey, JSON.stringify(physicalCounts));
    setIsAuditSaved(true);
    showNotification(`Month-end physical count audit for ${selectedSummaryMonth} saved successfully!`, 'success');
  };

  const handleApplyPhysicalCountsToSystem = async () => {
    if (!confirm(`Are you sure you want to update system stock levels to match the month-end physical count for ${selectedSummaryMonth}?`)) {
      return;
    }
    try {
      for (const p of products) {
        let updatedProduct: any = { ...p };
        let hasChange = false;
        const vList = getProductVariantsList(p);
        if (vList.length > 0) {
          if (Array.isArray(p.variants)) {
            let updatedVariants = p.variants.map((v: any, idx: number) => {
              const countKey = `${p.id}_v_${idx}`;
              if (countKey in physicalCounts && physicalCounts[countKey] !== v.stock) {
                hasChange = true;
                return { ...v, stock: physicalCounts[countKey] };
              }
              return v;
            });
            if (hasChange) {
              const newTotalStock = updatedVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
              updatedProduct = { ...p, variants: updatedVariants, stock: newTotalStock };
            }
          } else if (typeof p.variants === 'object' && p.variants !== null) {
            let updatedVariants = { ...p.variants };
            let variantKeys = Object.keys(p.variants);
            variantKeys.forEach((vKey: string, idx: number) => {
              const countKey = `${p.id}_v_${idx}`;
              if (countKey in physicalCounts && physicalCounts[countKey] !== (p.variants[vKey]?.stock || 0)) {
                hasChange = true;
                updatedVariants[vKey] = {
                  ...p.variants[vKey],
                  stock: physicalCounts[countKey],
                };
              }
            });
            if (hasChange) {
              const newTotalStock = Object.values(updatedVariants).reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
              updatedProduct = { ...p, variants: updatedVariants, stock: newTotalStock };
            }
          }
        } else {
          if (p.id in physicalCounts && physicalCounts[p.id] !== p.stock) {
            hasChange = true;
            updatedProduct = { ...p, stock: physicalCounts[p.id] };
          }
        }
        if (hasChange) {
          updateProduct(p.id, updatedProduct);
          try {
            await AppDataSync.syncProductToAPI(updatedProduct);
          } catch (apiErr) {
            console.error(`Failed to sync product ${p.id} to API:`, apiErr);
          }
        }
      }
      handleSavePhysicalAudit();
      showNotification(`System stock levels successfully reconciled to match ${selectedSummaryMonth} physical count!`, 'success');
    } catch (err) {
      console.error('Error applying physical stock counts:', err);
      showNotification('Failed to update system stock levels.', 'error');
    }
  };

  const handleExportSummaryExcel = () => {
    try {
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        showNotification('Excel library unavailable', 'error');
        return;
      }

      const listToExport = filteredSummaryItems;

      const totalSystemPcs = listToExport.reduce((sum, item) => sum + item.systemStock, 0);
      const totalPhysicalPcs = listToExport.reduce((sum, item) => sum + item.physicalStock, 0);
      const totalVariance = listToExport.reduce((sum, item) => sum + item.variance, 0);
      const totalValuation = listToExport.reduce((sum, item) => sum + (item.physicalStock * item.unitPrice), 0);

      const sheetData: any[] = [
        ['UNIVERSITY OF CEBU - METC COOPERATIVE'],
        ['MONTH-END PHYSICAL INVENTORY & STOCK SUMMARY REPORT'],
        [`Audit Month: ${selectedSummaryMonth}`, '', '', '', `Export Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
        [''],
        [
          '#',
          'SKU',
          'Merchandise Item',
          'Category',
          'Unit Price (₱)',
          'System Stock (Pcs)',
          'Physical Count (Pcs)',
          'Stock Variance',
          'Audit Status',
          'Physical Valuation (₱)',
        ],
      ];

      listToExport.forEach((item, idx) => {
        const displayInfo = getInventoryProductDisplayTitle(item.name, item.variantLabel);
        const itemTitle = displayInfo.subtitle ? `${displayInfo.title} (${displayInfo.subtitle})` : displayInfo.title;
        const statusText = item.variance === 0 ? 'Verified Match' : (item.variance < 0 ? `Shortage (${item.variance} Pcs)` : `Surplus (+${item.variance} Pcs)`);
        const itemValuation = item.physicalStock * item.unitPrice;

        sheetData.push([
          idx + 1,
          item.sku || 'N/A',
          itemTitle,
          item.category,
          Number((item.unitPrice || 0).toFixed(2)),
          item.systemStock,
          item.physicalStock,
          item.variance,
          statusText,
          Number(itemValuation.toFixed(2)),
        ]);
      });

      sheetData.push(['']);
      sheetData.push([
        'TOTALS',
        '',
        `Total Items: ${listToExport.length}`,
        '',
        '',
        totalSystemPcs,
        totalPhysicalPcs,
        totalVariance,
        totalVariance === 0 ? 'Fully Reconciled' : `${Math.abs(totalVariance)} Unit Variance`,
        Number(totalValuation.toFixed(2)),
      ]);

      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      ws['!cols'] = [
        { wch: 6 },  // #
        { wch: 16 }, // SKU
        { wch: 38 }, // Merchandise Item
        { wch: 22 }, // Category
        { wch: 15 }, // Unit Price
        { wch: 18 }, // System Stock
        { wch: 20 }, // Physical Count
        { wch: 16 }, // Stock Variance
        { wch: 20 }, // Audit Status
        { wch: 22 }, // Physical Valuation
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Summary');
      const fileName = `UC_METC_Monthly_Inventory_Summary_${selectedSummaryMonth.replace(/\s+/g, '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showNotification('Downloaded Monthly Inventory Summary Excel file!', 'success');
    } catch (e) {
      console.error('Export error:', e);
      showNotification('Failed to export summary Excel.', 'error');
    }
  };

  // Reset pagination on summary search or filter change
  useEffect(() => {
    setSummaryCurrentPage(1);
  }, [summarySearchQuery, summaryCategoryFilter, summaryStockStatusFilter]);


  const handleDownloadPdf = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      showNotification('Unable to locate document for PDF export', 'error');
      return;
    }

    showNotification('Generating PDF file for download...');

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);
      showNotification(`Downloaded ${filename}.pdf!`, 'success');
    } catch (err) {
      console.error(err);
      showNotification('Failed to generate PDF download', 'error');
    }
  };
  
  // Reference layout toggle states
  const [showLineNumberCol, setShowLineNumberCol] = useState(false);
  const [showDescriptionCol, setShowDescriptionCol] = useState(false);
  const [showDiscountCol, setShowDiscountCol] = useState(false);
  const [showFreightInCol, setShowFreightInCol] = useState(false);
  const [freightInAmount, setFreightInAmount] = useState(0);
  const [hideBalanceDue, setHideBalanceDue] = useState(false);
  const [alsoGoodsReceipt, setAlsoGoodsReceipt] = useState(false);
  const [showFooters, setShowFooters] = useState(false);
  const [footerText, setFooterText] = useState('');
  const [isClosedInvoice, setIsClosedInvoice] = useState(false);
interface StockIntakeItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  costPerUnit: number;
  sellingPrice: number;
  discount?: number;
  description?: string;
  selectedVariant: Record<string, string>;
  account: string;
}

  const [stockIntakeFormData, setStockIntakeFormData] = useState({
    supplier: '',
    notes: '',
    dateReceived: new Date().toISOString().split('T')[0],
    dueDateTerms: 'Net',
    dueDateDays: '',
    attachment: '',
    referenceNo: '',
    balanceDue: 0,
    status: 'Paid in full',
    items: [
      {
        id: '1',
        productId: '',
        productName: '',
        quantity: 1,
        unit: 'Units',
        costPerUnit: 0,
        sellingPrice: 0,
        discount: 0,
        description: '',
        selectedVariant: {} as Record<string, string>,
        account: 'Inventory on hand',
      },
    ] as StockIntakeItem[],
    // Legacy fields for backward compatibility
    productId: '',
    productName: '',
    quantity: 0,
    costPerUnit: 0,
    sellingPrice: 0,
    selectedVariant: {} as Record<string, string>,
  });

  const resetStockIntakeFormData = () => {
    setEditingInvoiceId(null);
    setShowStockIntakeForm(false);
    setStockIntakeFormData({
      supplier: '',
      notes: '',
      dateReceived: new Date().toISOString().split('T')[0],
      dueDateTerms: 'Net',
      dueDateDays: '',
      attachment: '',
      referenceNo: '',
      balanceDue: 0,
      status: 'Paid in full',
      items: [
        {
          id: Date.now().toString(),
          productId: '',
          productName: '',
          quantity: 1,
          costPerUnit: 0,
          sellingPrice: 0,
          selectedVariant: {},
          account: 'Inventory',
        },
      ],
      productId: '',
      productName: '',
      quantity: 0,
      costPerUnit: 0,
      sellingPrice: 0,
      selectedVariant: {},
    });
  };

  const handleAddLineItem = () => {
    setStockIntakeFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now().toString() + Math.random().toString().slice(2, 5),
          productId: '',
          productName: '',
          quantity: 1,
          unit: 'Units',
          costPerUnit: 0,
          sellingPrice: 0,
          discount: 0,
          description: '',
          selectedVariant: {},
          account: 'Inventory on hand',
        },
      ],
    }));
  };

  const handleDuplicateLineItem = (index: number) => {
    const itemToCopy = stockIntakeFormData.items[index];
    const newItem = {
      ...itemToCopy,
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
    };
    setStockIntakeFormData((prev) => {
      const updated = [...prev.items];
      updated.splice(index + 1, 0, newItem);
      return { ...prev, items: updated };
    });
  };

  const handleMoveLineItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= stockIntakeFormData.items.length) return;
    setStockIntakeFormData((prev) => {
      const updated = [...prev.items];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { ...prev, items: updated };
    });
  };

  const handleRemoveLineItem = (index: number) => {
    if (stockIntakeFormData.items.length <= 1) return;
    setStockIntakeFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateLineItem = (index: number, field: string, value: any) => {
    setStockIntakeFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleSavePurchaseInvoice = async () => {
    // Validate form - check if at least one item line is filled
    const validItems = stockIntakeFormData.items.filter(
      (it) => it.productId && Number(it.quantity) > 0 && Number(it.costPerUnit) > 0
    );

    if (validItems.length === 0) {
      showNotification('Please fill out at least one item line with product, quantity, and cost per unit', 'error');
      return;
    }

    try {
      const userStr = sessionStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : { id: 'admin' };

      const refNo = stockIntakeFormData.referenceNo || `V${Math.floor(100 + Math.random() * 900)}`;

      // Calculate automatic status: 'Ongoing' if within terms, 'Overdue' if past terms
      const daysNum = parseInt(stockIntakeFormData.dueDateDays || '30', 10) || 30;
      const issueDate = new Date(stockIntakeFormData.dateReceived);
      const dueDate = new Date(issueDate.getTime() + daysNum * 24 * 60 * 60 * 1000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      const autoStatus = today > dueDate ? 'Overdue' : 'Ongoing';

      const firstItem = validItems[0];
      const recordData = {
        id: editingInvoiceId && editingInvoiceId !== 'editing' ? editingInvoiceId : undefined,
        productId: firstItem.productId,
        productName: firstItem.productName,
        quantity: Number(firstItem.quantity),
        unit: firstItem.unit || 'Units',
        costPerUnit: Number(firstItem.costPerUnit),
        sellingPrice: Number(firstItem.sellingPrice),
        totalCost: Number(firstItem.quantity) * Number(firstItem.costPerUnit),
        potentialRevenue: Number(firstItem.quantity) * Number(firstItem.sellingPrice),
        profit: Number(firstItem.quantity) * (Number(firstItem.sellingPrice) - Number(firstItem.costPerUnit)),
        profitMargin: ((Number(firstItem.sellingPrice) - Number(firstItem.costPerUnit)) / Number(firstItem.sellingPrice) * 100).toFixed(1),
        supplier: stockIntakeFormData.supplier,
        notes: stockIntakeFormData.notes,
        dateReceived: stockIntakeFormData.dateReceived,
        dueDateTerms: stockIntakeFormData.dueDateTerms || 'Net',
        dueDateDays: stockIntakeFormData.dueDateDays || '30',
        selectedVariant: firstItem.selectedVariant,
        attachment: stockIntakeFormData.attachment,
        referenceNo: refNo,
        balanceDue: 0,
        status: autoStatus,
        items: validItems.map(it => ({ ...it, unit: it.unit || firstItem.unit || 'Units' })),
      };

      if (editingInvoiceId) {
        // UPDATE EXISTING INVOICE RECORD (NO DUPLICATION)
        const updatedRecord = {
          ...recordData,
          id: editingInvoiceId,
          unit: recordData.unit,
          date_received: recordData.dateReceived,
          reference_no: recordData.referenceNo,
          total_cost: recordData.totalCost,
          cost_per_unit: recordData.costPerUnit,
          product_name: recordData.productName,
          product_id: recordData.productId,
          due_date_days: recordData.dueDateDays,
          due_date_terms: recordData.dueDateTerms,
          items: recordData.items,
        };

        setStockIntakeRecords(prev => {
          const updatedRecords = prev.map(rec => {
            const isMatch = String(rec.id) === String(editingInvoiceId) ||
                            (rec.reference_no && recordData.referenceNo && String(rec.reference_no) === String(recordData.referenceNo)) ||
                            (rec.referenceNo && recordData.referenceNo && String(rec.referenceNo) === String(recordData.referenceNo));
            if (isMatch) {
              return { ...rec, ...updatedRecord };
            }
            return rec;
          });
          try {
            localStorage.setItem('silms_purchase_invoices', JSON.stringify(updatedRecords));
          } catch (err) {
            console.error('Failed to persist purchase invoices to localStorage:', err);
          }
          return updatedRecords;
        });

        if (viewInvoiceModal.record) {
          const isModalMatch = String(viewInvoiceModal.record.id) === String(editingInvoiceId) ||
                               String(viewInvoiceModal.record.referenceNo || viewInvoiceModal.record.reference_no) === String(recordData.referenceNo);
          if (isModalMatch) {
            setViewInvoiceModal({ show: true, record: updatedRecord });
          }
        }

        try {
          if (editingInvoiceId !== 'editing' && !editingInvoiceId.startsWith('samp-')) {
            await apiClient.updateStockIntakeRecord(editingInvoiceId, recordData, user.id);
          }
        } catch (e) {
          console.error('API update failed, updated in local state:', e);
        }

        showNotification('Purchase invoice updated successfully!', 'success');
      } else {
        // CREATE NEW INVOICE RECORD
        try {
          for (const item of validItems) {
            const itemRecordData = {
              ...recordData,
              productId: item.productId,
              productName: item.productName,
              quantity: Number(item.quantity),
              costPerUnit: Number(item.costPerUnit),
              sellingPrice: Number(item.sellingPrice),
              totalCost: Number(item.quantity) * Number(item.costPerUnit),
            };
            await apiClient.createStockIntakeRecord(itemRecordData, user.id);
          }
        } catch (e) {
          console.error('API create failed, adding to state:', e);
          const newRecord = {
            ...recordData,
            id: `inv-${Date.now()}`,
            date_received: recordData.dateReceived,
            reference_no: recordData.referenceNo,
            total_cost: recordData.totalCost,
            cost_per_unit: recordData.costPerUnit,
            product_name: recordData.productName,
            product_id: recordData.productId,
          };
          setStockIntakeRecords(prev => {
            const updated = [newRecord, ...prev];
            try {
              localStorage.setItem('silms_purchase_invoices', JSON.stringify(updated));
            } catch (err) {
              console.error('Failed to persist purchase invoices to localStorage:', err);
            }
            return updated;
          });
        }
        showNotification('Purchase invoice recorded successfully!', 'success');
      }

      refreshAvailableSuppliers();
      resetStockIntakeFormData();
    } catch (error) {
      console.error('Failed to save purchase invoice:', error);
      showNotification('Failed to save purchase invoice record', 'error');
    }
  };

  // Available suppliers state from Suppliers module
  const DEFAULT_SUPPLIERS: Array<{ id: string; name: string }> = [];

  const [availableSuppliers, setAvailableSuppliers] = useState<Array<{ id: string; name: string }>>(() => {
    const saved = localStorage.getItem('silms_suppliers');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((s: any) => ({ id: s.id, name: s.name }));
        }
      } catch (e) {
        console.error('Error loading suppliers in InventoryPage:', e);
      }
    }
    return DEFAULT_SUPPLIERS;
  });

  const refreshAvailableSuppliers = () => {
    const saved = localStorage.getItem('silms_suppliers');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setAvailableSuppliers(parsed.map((s: any) => ({ id: s.id, name: s.name })));
          return;
        }
      } catch (e) {
        console.error('Error refreshing suppliers in InventoryPage:', e);
      }
    }
    setAvailableSuppliers(DEFAULT_SUPPLIERS);
  };

  useEffect(() => {
    const handleSuppliersUpdate = () => {
      refreshAvailableSuppliers();
    };
    window.addEventListener('suppliers_updated', handleSuppliersUpdate);
    window.addEventListener('storage', handleSuppliersUpdate);
    return () => {
      window.removeEventListener('suppliers_updated', handleSuppliersUpdate);
      window.removeEventListener('storage', handleSuppliersUpdate);
    };
  }, []);

  // Synchronize and migrate variant stocks when options are modified
  useEffect(() => {
    if (!editingProduct) return;
    
    const generateCombinations = (options: any[]) => {
      if (editingProduct.name === 'BSNAME Uniform') {
        const combinations: any[] = [];
        options.forEach(option => {
          option.choices.forEach((choice: string) => {
            combinations.push({
              [option.id]: choice
            });
          });
        });
        return combinations;
      }

      if (options.length === 0) return [{}];
      if (options.length === 1) {
        return options[0].choices.map((choice: string) => ({
          [options[0].id]: choice
        }));
      }
      
      const [first, ...rest] = options;
      const restCombinations = generateCombinations(rest);
      const combinations: any[] = [];
      
      first.choices.forEach((choice: string) => {
        restCombinations.forEach((restCombo: any) => {
          combinations.push({
            [first.id]: choice,
            ...restCombo
          });
        });
      });
      
      return combinations;
    };

    const newCombinations = generateCombinations(editingProduct.options || []);
    const newVariantStocks: Record<string, number> = {};
    const newVariantPrices: Record<string, number> = {};
    const newVariantImages: Record<string, string> = {};
    
    newCombinations.forEach((combo: Record<string, string>) => {
      const variantKey = Object.entries(combo)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, val]) => `${key}:${val}`)
        .join('|');
      
      // Sync Stocks
      if (variantStocks[variantKey] !== undefined) {
        newVariantStocks[variantKey] = variantStocks[variantKey];
      } else {
        const newKeyParts = variantKey.split('|');
        const matchingOldKey = Object.keys(variantStocks).find(oldKey => {
          const oldKeyParts = oldKey.split('|');
          return oldKeyParts.every(part => newKeyParts.includes(part));
        });
        if (matchingOldKey !== undefined) {
          newVariantStocks[variantKey] = variantStocks[matchingOldKey];
        } else {
          if (Object.keys(variantStocks).length === 0) {
            newVariantStocks[variantKey] = editingProduct.stock || 0;
          } else {
            newVariantStocks[variantKey] = 0;
          }
        }
      }

      // Sync Prices
      if (variantPrices[variantKey] !== undefined) {
        newVariantPrices[variantKey] = variantPrices[variantKey];
      } else {
        const newKeyParts = variantKey.split('|');
        const matchingOldKey = Object.keys(variantPrices).find(oldKey => {
          const oldKeyParts = oldKey.split('|');
          return oldKeyParts.every(part => newKeyParts.includes(part));
        });
        if (matchingOldKey !== undefined) {
          newVariantPrices[variantKey] = variantPrices[matchingOldKey];
        } else {
          newVariantPrices[variantKey] = 0;
        }
      }

      // Sync Images
      if (variantImages[variantKey] !== undefined) {
        newVariantImages[variantKey] = variantImages[variantKey];
      } else {
        const newKeyParts = variantKey.split('|');
        const matchingOldKey = Object.keys(variantImages).find(oldKey => {
          const oldKeyParts = oldKey.split('|');
          return oldKeyParts.every(part => newKeyParts.includes(part));
        });
        if (matchingOldKey !== undefined) {
          newVariantImages[variantKey] = variantImages[matchingOldKey];
        } else {
          newVariantImages[variantKey] = '';
        }
      }
    });
    
    // Check if the records have actually changed to prevent infinite loops
    const hasChanged = Object.keys(newVariantStocks).length !== Object.keys(variantStocks).length ||
      Object.keys(newVariantStocks).some(k => newVariantStocks[k] !== variantStocks[k]) ||
      Object.keys(newVariantPrices).some(k => newVariantPrices[k] !== variantPrices[k]) ||
      Object.keys(newVariantImages).some(k => newVariantImages[k] !== variantImages[k]);
      
    if (hasChanged) {
      setVariantStocks(newVariantStocks);
      setVariantPrices(newVariantPrices);
      setVariantImages(newVariantImages);
    }
  }, [editingProduct?.options, editingProduct?.stock]);

  // Load stock intake records when Stock Intake tab is active
  useEffect(() => {
    if (activeTab === 'stock-intake') {
      loadStockIntakeRecords();
      refreshAvailableSuppliers();
    }
  }, [activeTab, showStockIntakeForm]);

  const SAMPLE_PURCHASE_INVOICES = [
    {
      id: 'samp-1',
      date_received: '2026-07-21',
      due_date_days: 30,
      reference_no: 'V201',
      supplier: 'Karen Oberes',
      notes: 'Payment for 69 pairs of Male White Shoes and 3 pairs of Female 2 inches White Shoes & Delivery Fee',
      total_cost: 33000.00,
      balance_due: 0.00,
      status: 'Ongoing',
    },
    {
      id: 'samp-2',
      date_received: '2026-07-15',
      due_date_days: 30,
      reference_no: 'V198',
      supplier: 'Janneth B. Guido',
      notes: 'Payment for 73 sets GALA and 1 Upper ONLY',
      total_cost: 66200.00,
      balance_due: 0.00,
      status: 'Ongoing',
    },
    {
      id: 'samp-3',
      date_received: '2026-07-01',
      due_date_days: 30,
      reference_no: 'V185',
      supplier: 'Gan Go Trading Corporation',
      notes: 'Purchase of PE Unifrom',
      total_cost: 94910.00,
      balance_due: 0.00,
      status: 'Ongoing',
    },
    {
      id: 'samp-4',
      date_received: '2026-06-04',
      due_date_days: 30,
      reference_no: 'V154',
      supplier: "Emma L. Victorio / Emma's Garments Shop",
      notes: 'Payment for 56 sets GALA Male and 3 pieces GALA Male Upper only',
      total_cost: 51900.00,
      balance_due: 0.00,
      status: 'Paid in full',
    },
    {
      id: 'samp-5',
      date_received: '2026-06-01',
      due_date_days: 30,
      reference_no: 'V150',
      supplier: 'Janneth B. Guido',
      notes: 'Payment for 56 Sets Gala Male and 3 pcs Gala Male Upper Only',
      total_cost: 51900.00,
      balance_due: 0.00,
      status: 'Paid in full',
    },
    {
      id: 'samp-6',
      date_received: '2026-05-26',
      due_date_days: 30,
      reference_no: '',
      supplier: 'Gan Go Trading Corporation',
      notes: 'Payment for PE Uniforms',
      total_cost: 94910.00,
      balance_due: 0.00,
      status: 'Paid in full',
    },
    {
      id: 'samp-7',
      date_received: '2026-05-19',
      due_date_days: 30,
      reference_no: '',
      supplier: "Toning's Clothier",
      notes: 'Payment for 84 pcs Pershing Cap',
      total_cost: 22680.00,
      balance_due: 22680.00,
      status: 'Overdue',
    },
    {
      id: 'samp-8',
      date_received: '2026-05-15',
      due_date_days: 30,
      reference_no: 'V129',
      supplier: 'Nelson D. Felicidario Jr.',
      notes: 'Payment for 1000 BSMT Lanyard',
      total_cost: 30000.00,
      balance_due: 7000.00,
      status: 'Overdue',
    },
    {
      id: 'samp-9',
      date_received: '2026-05-15',
      due_date_days: 30,
      reference_no: '',
      supplier: 'Nelson D. Felicidario Jr.',
      notes: 'Payment for 1,000 pcs BSMT Lanyard',
      total_cost: 30000.00,
      balance_due: 30000.00,
      status: 'Overdue',
    },
  ];

  const loadStockIntakeRecords = async () => {
    const savedLocal = localStorage.getItem('silms_purchase_invoices');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStockIntakeRecords(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse local purchase invoices:', e);
      }
    }

    try {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const records = await apiClient.getStockIntakeRecords(user.id) as any[];
        if (records && records.length > 0) {
          setStockIntakeRecords(records);
          localStorage.setItem('silms_purchase_invoices', JSON.stringify(records));
          return;
        }
      }
      setStockIntakeRecords(SAMPLE_PURCHASE_INVOICES);
    } catch (error) {
      console.error('Failed to load stock intake records:', error);
      setStockIntakeRecords(SAMPLE_PURCHASE_INVOICES);
    }
  };

  // Load monthly report data when monthly tab is active or selectedMonth changes
  useEffect(() => {
    if (activeTab === 'monthly') {
      loadMonthlyReport();
    }
  }, [activeTab, selectedMonth]);

  const loadMonthlyReport = async () => {
    try {
      const allOrders = await apiClient.getAllTransactions(user?.id || '') as any[];
      
      // Filter orders for selected month (exclude insurance orders)
      const selectedMonthValue = selectedMonth.getMonth();
      const selectedYear = selectedMonth.getFullYear();
      
      const monthlyOrders = allOrders.filter((order: any) => {
        // Use completed_at for completed orders (payment date)
        const orderDate = new Date(order.completed_at || order.created_at);
        return orderDate.getMonth() === selectedMonthValue && 
               orderDate.getFullYear() === selectedYear &&
               (order.status === 'completed' || order.status === 'released') &&
               order.order_type !== 'insurance'; // Exclude insurance orders
      });
      
      // Calculate total sales
      const totalSales = monthlyOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.total_amount), 0
      );
      
      // Calculate product units sold with payment stage distinction
      const productsSold: Record<string, { productName: string; paymentType: 'full' | 'downpayment' | 'balance'; quantity: number; revenue: number }> = {};
      
      monthlyOrders.forEach((order: any) => {
        const isBalancePayment = (order.receipt_no && order.receipt_no.startsWith('BAL-')) ||
                                 (order.receiptNo && order.receiptNo.startsWith('BAL-')) ||
                                 (order.order_type === 'balance_payment') ||
                                 (order.orderType === 'balance_payment');
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const rawProductName = formatProductNameWithVariants(item);
            const cleanName = cleanRepeatedSegments(rawProductName);
            
            const rawPaymentType = item.paymentType || item.payment_type || order.paymentType || order.payment_type;
            const price = parseFloat(item.price || item.unit_price || item.unitPrice || 0);
            const isTailored = cleanName.toLowerCase().includes('uniform') || cleanName.toLowerCase().includes('gala');
            
            let pType: 'full' | 'downpayment' | 'balance' = 'full';
            if (isBalancePayment) {
              pType = 'balance';
            } else if (rawPaymentType === 'downpayment' || (isTailored && (price === 1500 || price === 500))) {
              pType = 'downpayment';
            }

            const itemKey = `${cleanName}::${pType}`;
            if (!productsSold[itemKey]) {
              productsSold[itemKey] = { 
                productName: cleanName,
                paymentType: pType,
                quantity: 0, 
                revenue: 0 
              };
            }
            if (!isBalancePayment) {
              productsSold[itemKey].quantity += (parseInt(String(item.quantity || 1), 10) || 1);
            }
            productsSold[itemKey].revenue += parseFloat(String(item.subtotal || (item.quantity * (price || 0)) || 0)) || 0;
          });
        }
      });
      
      setMonthlyData({
        totalSales,
        orderCount: monthlyOrders.length,
        productsSold,
        orders: monthlyOrders
      });
    } catch (err) {
      console.error('Failed to load monthly report:', err);
    }
  };

  const getProductSoldOrders = (productName: string, paymentType?: 'full' | 'downpayment' | 'balance') => {
    if (!monthlyData || !monthlyData.orders) return [];
    
    const matchingPurchases: any[] = [];
    
    monthlyData.orders.forEach((order: any) => {
      const isBalancePayment = (order.receipt_no && order.receipt_no.startsWith('BAL-')) ||
                               (order.receiptNo && order.receiptNo.startsWith('BAL-')) ||
                               (order.order_type === 'balance_payment') ||
                               (order.orderType === 'balance_payment');
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const itemProductName = cleanRepeatedSegments(formatProductNameWithVariants(item));
          const rawPaymentType = item.paymentType || item.payment_type || order.paymentType || order.payment_type;
          const price = parseFloat(item.price || item.unit_price || item.unitPrice || 0);
          const isTailored = itemProductName.toLowerCase().includes('uniform') || itemProductName.toLowerCase().includes('gala');
          
          let pType: 'full' | 'downpayment' | 'balance' = 'full';
          if (isBalancePayment) {
            pType = 'balance';
          } else if (rawPaymentType === 'downpayment' || (isTailored && (price === 1500 || price === 500))) {
            pType = 'downpayment';
          }

          if (itemProductName === productName && (!paymentType || pType === paymentType)) {
            matchingPurchases.push({
              id: order.id,
              receipt_no: order.receipt_no || order.receiptNo || 'N/A',
              date: order.completed_at || order.completedAt || order.created_at || order.createdAt,
              name: `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'N/A',
              courseYear: order.course && order.year 
                ? `${order.course} - ${order.year}` 
                : order.course || order.year || 'N/A',
              quantity: item.quantity || 0,
              subtotal: parseFloat(String(item.subtotal || (item.quantity * price) || 0)) || 0,
              paymentType: pType,
            });
          }
        });
      }
    });
    
    // Sort by date (most recent first)
    return matchingPurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleExportMonthlyReport = (selectedProductKeys?: string[]) => {
    if (!monthlyData) return;
    
    // Helper to resolve category and SKU from master products
    const resolveProductInfo = (itemName: string) => {
      const baseName = itemName.split(' - ')[0].split('(')[0].trim();
      const matchedProduct = products.find(p => p.name.toLowerCase().trim() === baseName.toLowerCase().trim() || p.name.toLowerCase().trim() === itemName.toLowerCase().trim());
      const rawCat = matchedProduct?.category || '';
      const category = (rawCat === 'equipment' || rawCat === 'ppe') ? 'PPE' : (rawCat ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1) : 'Merchandise');
      const sku = matchedProduct?.sku || 'N/A';
      return { category, sku };
    };

    let entries = Object.entries(monthlyData.productsSold);
    
    // Filter if specific products were specified
    if (selectedProductKeys && selectedProductKeys.length > 0) {
      entries = entries.filter(([pKey]) => selectedProductKeys.includes(pKey));
    }

    if (entries.length === 0) {
      showNotification('No products selected to export', 'error');
      return;
    }

    const rows = entries
      .sort((a: any, b: any) => b[1].quantity - a[1].quantity)
      .map(([key, data]: [string, any]) => {
        const pName = data.productName || key;
        const pType = data.paymentType || 'full';
        const pTypeLabel = pType === 'downpayment' ? 'Downpayment' : pType === 'balance' ? 'Balance Settlement' : 'Full Payment';
        const { category, sku } = resolveProductInfo(pName);
        const price = data.quantity > 0 ? (data.revenue / data.quantity) : data.revenue;
        return {
          name: pName,
          paymentType: pTypeLabel,
          category,
          sku,
          price,
          quantity: data.quantity,
          revenue: data.revenue
        };
      });

    const totalSales = rows.reduce((sum, r) => sum + r.revenue, 0);
    const totalUnits = rows.reduce((sum, r) => sum + r.quantity, 0);

    const tableHeader = `
      <tr style="background-color: #6d28d9; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; height: 35px;">
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 250px;">Product Name</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 140px;">Payment Stage</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Category</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 150px;">SKU</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 110px;">Avg Unit Price</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 100px;">Units Sold</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 130px;">Total Revenue</th>
      </tr>
    `;

    const tableRows = rows.map((row, index) => {
      const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
      const pColor = row.paymentType === 'Downpayment' ? '#b45309' : row.paymentType === 'Balance Settlement' ? '#047857' : '#6d28d9';
      return `
        <tr style="background-color: ${bg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #334155; height: 30px;">
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${row.name}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${pColor};">${row.paymentType}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 11px; font-weight: bold; color: #64748b;">${row.category}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; color: #0f172a;">${row.sku}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #6d28d9;">₱${row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${row.quantity}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #047857;">₱${row.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join('');

    const monthStr = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Monthly Sales Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <table style="margin-bottom: 20px; border: none; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <tr>
            <td colspan="4" style="font-size: 20px; font-weight: bold; color: #1e1b4b; padding-bottom: 5px;">
              Monthly Sales Report
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 12px; color: #64748b; padding-bottom: 20px;">
              Month: ${monthStr}
            </td>
          </tr>
          <tr style="height: 40px;">
            <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; text-align: center; border-radius: 8px;">
              <span style="font-size: 10px; color: #047857; font-weight: bold; text-transform: uppercase;">Total Sales</span><br/>
              <span style="font-size: 16px; font-weight: bold; color: #1e1b4b;">₱${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </td>
            <td style="background-color: #f3e8ff; border: 1px solid #d8b4fe; padding: 10px; text-align: center; border-radius: 8px;">
              <span style="font-size: 10px; color: #6d28d9; font-weight: bold; text-transform: uppercase;">Completed Orders</span><br/>
              <span style="font-size: 16px; font-weight: bold; color: #1e1b4b;">${monthlyData.orderCount}</span>
            </td>
            <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; text-align: center; border-radius: 8px;">
              <span style="font-size: 10px; color: #1d4ed8; font-weight: bold; text-transform: uppercase;">Products Sold</span><br/>
              <span style="font-size: 16px; font-weight: bold; color: #1e1b4b;">${totalUnits} units</span>
            </td>
          </tr>
        </table>
        <table style="border-collapse: collapse; border: 1px solid #cbd5e1;">
          <thead>
            ${tableHeader}
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    link.download = `monthly_sales_${monthStr.replace(/\s/g, '_')}.xls`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification('Monthly report exported successfully!', 'success');
  };



  const handleExportToExcel = () => {
    // 1. Prepare data rows
    const rows: Array<{
      name: string;
      variant: string;
      category: string;
      sku: string;
      price: number;
      stock: number;
      preorder: string;
      status: string;
    }> = [];

    products.forEach((product) => {
      const hasVariants = product.variants && Object.keys(product.variants).length > 0;
      const rawCat = product.category || '';
      const categoryName = (rawCat === 'equipment' || rawCat === 'ppe') 
        ? 'PPE' 
        : (rawCat ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1) : 'N/A');
      
      const allowPreorderVal = product.allowPreorder !== false; // defaults to true

      if (!hasVariants) {
        // Simple product
        rows.push({
          name: product.name,
          variant: 'N/A (Simple Product)',
          category: categoryName,
          sku: product.sku || 'N/A',
          price: product.price || 0,
          stock: product.stock || 0,
          preorder: allowPreorderVal ? 'Yes' : 'No',
          status: (product.stock || 0) === 0 
            ? 'Out of Stock' 
            : (product.stock || 0) <= 5 
              ? 'Low Stock' 
              : 'Good Stock'
        });
      } else {
        // Product with variants
        Object.values(product.variants!).forEach((variantData) => {
          // Format variant description beautifully, e.g. "Size: XL | Type: SHS"
          const variantDesc = Object.entries(variantData.options)
            .map(([optKey, optVal]) => `${optKey.toUpperCase()}: ${optVal}`)
            .join(' | ');

          // Format variant SKU (e.g. parent-sku + variant-suffix or customized)
          const variantSuffix = Object.values(variantData.options).join('-');
          const variantSku = product.sku ? `${product.sku}-${variantSuffix}` : 'N/A';

          rows.push({
            name: product.name,
            variant: variantDesc,
            category: categoryName,
            sku: variantSku,
            price: product.price || 0,
            stock: variantData.stock || 0,
            preorder: allowPreorderVal ? 'Yes' : 'No',
            status: (variantData.stock || 0) === 0 
              ? 'Out of Stock' 
              : (variantData.stock || 0) <= 5 
                ? 'Low Stock' 
                : 'Good Stock'
          });
        });
      }
    });

    // 2. Generate HTML Spreadsheet with beautiful corporate styling
    const tableHeader = `
      <tr style="background-color: #6d28d9; color: #ffffff; font-weight: bold; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px; height: 35px;">
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 220px;">Product Name</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 200px;">Variant Option</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Category</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; width: 150px;">SKU</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 110px;">Unit Price</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 90px;">Stock Qty</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; width: 130px;">Stock Value</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 120px;">Pre-Order</th>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; width: 130px;">Stock Status</th>
      </tr>
    `;

    const tableRows = rows.map((row, index) => {
      // Alternating row background colors for supreme readability
      const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
      
      // Stock status cell colors
      let statusColor = '#0f172a'; // dark
      let statusBg = '#f1f5f9';
      if (row.status === 'Out of Stock') {
        statusColor = '#991b1b'; // red text
        statusBg = '#fee2e2'; // light red bg
      } else if (row.status === 'Low Stock') {
        statusColor = '#9a3412'; // orange text
        statusBg = '#ffedd5'; // light orange bg
      } else if (row.status === 'Good Stock') {
        statusColor = '#166534'; // green text
        statusBg = '#dcfce7'; // light green bg
      }

      // Pre-order status cell colors
      const preorderColor = row.preorder === 'Yes' ? '#166534' : '#475569';
      const preorderBg = row.preorder === 'Yes' ? '#dcfce7' : '#f1f5f9';

      const totalValue = row.price * row.stock;

      return `
        <tr style="background-color: ${bg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #334155; height: 30px;">
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${row.name}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #475569;">${row.variant}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 11px; font-weight: bold; color: #64748b;">${row.category}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-family: Consolas, monospace; color: #0f172a;">${row.sku}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #6d28d9;">₱${row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${row.stock}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">₱${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${preorderColor}; background-color: ${preorderBg};">${row.preorder}</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${statusColor}; background-color: ${statusBg};">${row.status}</td>
        </tr>
      `;
    }).join('');

    // Summary calculations
    const totalItems = rows.length;
    const totalStock = rows.reduce((sum, r) => sum + r.stock, 0);
    const totalInventoryValue = rows.reduce((sum, r) => sum + (r.price * r.stock), 0);

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Inventory Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <!-- Header Info Table -->
        <table style="margin-bottom: 20px; border: none; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <tr>
            <td colspan="4" style="font-size: 20px; font-weight: bold; color: #1e1b4b; padding-bottom: 5px;">
              UC-METC Cooperative - Official Inventory Report
            </td>
          </tr>
          <tr>
            <td colspan="4" style="font-size: 12px; color: #64748b; padding-bottom: 20px;">
              Generated on: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
            </td>
          </tr>
          
          <!-- Key Performance Cards inside Excel -->
          <tr style="height: 40px;">
            <td style="background-color: #f3e8ff; border: 1px solid #d8b4fe; padding: 10px; text-align: center; border-radius: 8px;">
              <span style="font-size: 10px; color: #6d28d9; font-weight: bold; text-transform: uppercase;">Total Products/Variants</span><br/>
              <span style="font-size: 16px; font-weight: bold; color: #1e1b4b;">${totalItems}</span>
            </td>
            <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; text-align: center; border-radius: 8px;">
              <span style="font-size: 10px; color: #047857; font-weight: bold; text-transform: uppercase;">Total Stock Count</span><br/>
              <span style="font-size: 16px; font-weight: bold; color: #1e1b4b;">${totalStock}</span>
            </td>
            <td colspan="2" style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; text-align: center; border-radius: 8px;">
              <span style="font-size: 10px; color: #1d4ed8; font-weight: bold; text-transform: uppercase;">Total Inventory Value</span><br/>
              <span style="font-size: 16px; font-weight: bold; color: #1e1b4b;">₱${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </td>
          </tr>
        </table>

        <!-- Main Data Table -->
        <table style="border-collapse: collapse; border: 1px solid #cbd5e1;">
          <thead>
            ${tableHeader}
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // 3. Create blob and trigger download
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `UC_Coop_Inventory_${dateStr}.xls`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Inventory successfully exported to Excel!', 'success');
  };

  const [formData, setFormData] = useState<{
    name?: ItemType | string;
    price?: number;
    stock?: number;
    sku?: string;
    category?: 'uniform' | 'accessory' | 'equipment' | 'service' | 'grocery' | 'essentials' | 'ppe';
    note?: string;
    image?: string;
    options?: Array<{
      id: string;
      label: string;
      choices: string[];
    }>;
    allowPreorder?: boolean;
    madeToOrder?: boolean;
  }>({
    name: '',
    price: 0,
    stock: 0,
    sku: '',
    category: 'uniform',
    note: '',
    image: '',
    options: [],
    allowPreorder: true,
    madeToOrder: false,
  });
  const [newVariantStocks, setNewVariantStocks] = useState<Record<string, number>>({});
  const [newProductVariantPrices, setNewProductVariantPrices] = useState<Record<string, number>>({});
  const [newProductVariantImages, setNewProductVariantImages] = useState<Record<string, string>>({});

  const handleAddChoiceEdit = (optionId: string, optionIndex: number) => {
    const inputVal = (newChoiceInputs[optionId] || '').trim();
    if (!inputVal) return;
    
    const option = editingProduct?.options?.[optionIndex];
    if (!option) return;
    
    if (option.choices.includes(inputVal)) {
      showNotification('Choice already exists', 'error');
      return;
    }
    
    const newOptions = [...(editingProduct.options || [])];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      choices: [...newOptions[optionIndex].choices, inputVal]
    };
    
    setEditingProduct({ ...editingProduct, options: newOptions });
    setNewChoiceInputs(prev => ({ ...prev, [optionId]: '' }));
  };

  const handleRemoveChoiceEdit = (optionIndex: number, choiceIndex: number) => {
    if (!editingProduct) return;
    const option = editingProduct.options?.[optionIndex];
    if (!option) return;
    
    const newOptions = [...(editingProduct.options || [])];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      choices: option.choices.filter((_, idx) => idx !== choiceIndex)
    };
    
    setEditingProduct({ ...editingProduct, options: newOptions });
  };

  const handleAddChoiceAdd = (optionId: string, optionIndex: number) => {
    const inputVal = (newChoiceInputs[optionId] || '').trim();
    if (!inputVal) return;
    
    const option = formData.options?.[optionIndex];
    if (!option) return;
    
    if (option.choices.includes(inputVal)) {
      showNotification('Choice already exists', 'error');
      return;
    }
    
    const newOptions = [...(formData.options || [])];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      choices: [...newOptions[optionIndex].choices, inputVal]
    };
    
    setFormData({ ...formData, options: newOptions });
    setNewChoiceInputs(prev => ({ ...prev, [optionId]: '' }));
    setNewVariantStocks({});
    setNewProductVariantPrices({});
    setNewProductVariantImages({});
  };

  const handleRemoveChoiceAdd = (optionIndex: number, choiceIndex: number) => {
    const option = formData.options?.[optionIndex];
    if (!option) return;
    
    const newOptions = [...(formData.options || [])];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      choices: option.choices.filter((_, idx) => idx !== choiceIndex)
    };
    
    setFormData({ ...formData, options: newOptions });
    setNewVariantStocks({});
    setNewProductVariantPrices({});
    setNewProductVariantImages({});
  };

  const handleDragStart = (e: React.DragEvent, optionIndex: number, choiceIndex: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ optionIndex, choiceIndex }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetOptionIndex: number, targetChoiceIndex: number, isEditMode: boolean) => {
    e.preventDefault();
    setDraggedOverChoice(null);
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { optionIndex: sourceOptionIndex, choiceIndex: sourceChoiceIndex } = JSON.parse(dataStr);
      
      // Only allow dragging within the same option row
      if (sourceOptionIndex !== targetOptionIndex) return;
      if (sourceChoiceIndex === targetChoiceIndex) return;
      
      if (isEditMode) {
        if (!editingProduct) return;
        const option = editingProduct.options?.[targetOptionIndex];
        if (!option) return;
        
        const newChoices = [...option.choices];
        const [movedChoice] = newChoices.splice(sourceChoiceIndex, 1);
        newChoices.splice(targetChoiceIndex, 0, movedChoice);
        
        const newOptions = [...(editingProduct.options || [])];
        newOptions[targetOptionIndex] = {
          ...newOptions[targetOptionIndex],
          choices: newChoices
        };
        
        setEditingProduct({ ...editingProduct, options: newOptions });
      } else {
        const option = formData.options?.[targetOptionIndex];
        if (!option) return;
        
        const newChoices = [...option.choices];
        const [movedChoice] = newChoices.splice(sourceChoiceIndex, 1);
        newChoices.splice(targetChoiceIndex, 0, movedChoice);
        
        const newOptions = [...(formData.options || [])];
        newOptions[targetOptionIndex] = {
          ...newOptions[targetOptionIndex],
          choices: newChoices
        };
        
        setFormData({ ...formData, options: newOptions });
        setNewVariantStocks({});
        setNewProductVariantPrices({});
        setNewProductVariantImages({});
      }
    } catch (err) {
      console.error('Drag drop error:', err);
    }
  };

  const generateNextSKU = (category: string, excludeId?: string) => {
    return generateCategoryNextSKU(category, products, excludeId);
  };

  const handleOpenAddForm = () => {
    const defaultCategory = 'uniform';
    setFormData({
      name: '',
      price: 0,
      stock: 0,
      sku: generateNextSKU(defaultCategory),
      category: defaultCategory,
      note: '',
      image: '',
      options: [],
      allowPreorder: true,
      madeToOrder: false,
    });
    setNewVariantStocks({});
    setNewProductVariantPrices({});
    setNewProductVariantImages({});
    setShowForm(true);
  };

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
    
    // If product has no variants, check stock (optional, just ensure it is not negative)
    if ((!formData.options || formData.options.length === 0) && formData.stock !== undefined && formData.stock < 0) {
      showNotification('Stock quantity cannot be negative', 'error');
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
      
      // Validate that variant stocks are not negative
      const hasNegativeStock = Object.values(newVariantStocks).some(stock => stock < 0);
      if (hasNegativeStock) {
        showNotification('Variant stock quantities cannot be negative', 'error');
        return;
      }
    }
    
    if (formData.name && formData.price && formData.sku) {
      try {
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
          allowPreorder: formData.allowPreorder !== false,
          madeToOrder: formData.madeToOrder === true,
          createdAt: new Date().toISOString(),
        };

        // If product has variants, add variant stock data
        if (formData.options && formData.options.length > 0) {
          // Generate all variant combinations
          const generateCombinations = (options: any[]) => {
            if (formData.name === 'BSNAME Uniform') {
              const combinations: any[] = [];
              options.forEach(option => {
                option.choices.forEach((choice: string) => {
                  combinations.push({
                    [option.id]: choice
                  });
                });
              });
              return combinations;
            }

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
          const variants: Record<string, { stock: number; options: Record<string, string>; price?: number; image?: string }> = {};
          combinations.forEach((combo: Record<string, string>) => {
            const variantKey = Object.entries(combo)
              .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
              .map(([key, val]) => `${key}:${val}`)
              .join('|');
            
            variants[variantKey] = {
              stock: newVariantStocks[variantKey] || 0,
              options: combo,
              price: newProductVariantPrices[variantKey] || undefined,
              image: newProductVariantImages[variantKey] || undefined
            };
          });

          newProduct.variants = variants;
          // Calculate total stock from all variants
          newProduct.stock = Object.values(variants).reduce((sum, v) => sum + v.stock, 0);
        }

        // Sync to API first - if it fails, it throws and skips the local store update
        await AppDataSync.syncProductToAPI(newProduct);
        
        // If API sync is successful, add to local store
        addProduct(newProduct);
        
        setFormData({
          name: '',
          price: 0,
          stock: 0,
          sku: '',
          category: 'uniform',
          note: '',
          image: '',
          options: [],
          allowPreorder: true,
          madeToOrder: false,
        });
        setNewVariantStocks({});
        setNewProductVariantPrices({});
        setNewProductVariantImages({});
        setShowForm(false);
        showNotification(`${formData.name} added successfully`, 'success');
      } catch (error: any) {
        console.error('Failed to add product:', error);
        showNotification(error?.message || 'Failed to add product to database. Please check connection.', 'error');
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    let formattedSku = formatDisplaySKU(product.sku, product.category);
    const isConflict = products.some(p => p.id !== product.id && (p.sku === formattedSku || formatDisplaySKU(p.sku, p.category) === formattedSku));
    if (isConflict) {
      formattedSku = generateCategoryNextSKU(product.category, products, product.id);
    }
    setEditingProduct({ ...product, sku: formattedSku });
    
    // Clear choice inputs state
    setNewChoiceInputs({});

    // Initialize variant stocks from product data
    if (product.variants) {
      setVariantStocks(
        Object.entries(product.variants).reduce((acc, [key, variant]) => {
          acc[key] = variant.stock;
          return acc;
        }, {} as Record<string, number>)
      );
      setVariantPrices(
        Object.entries(product.variants).reduce((acc, [key, variant]) => {
          acc[key] = (variant as any).price || 0;
          return acc;
        }, {} as Record<string, number>)
      );
      setVariantImages(
        Object.entries(product.variants).reduce((acc, [key, variant]) => {
          acc[key] = (variant as any).image || '';
          return acc;
        }, {} as Record<string, string>)
      );
    } else {
      setVariantStocks({});
      setVariantPrices({});
      setVariantImages({});
    }
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (editingProduct) {
      const finalSku = formatDisplaySKU(editingProduct.sku, editingProduct.category);
      const updates: Partial<Product> = {
        category: editingProduct.category,
        sku: finalSku,
        price: editingProduct.price,
        note: editingProduct.note,
        options: editingProduct.options,
        allowPreorder: editingProduct.allowPreorder !== false,
        madeToOrder: editingProduct.madeToOrder === true,
        image: editingProduct.image,
      };

      // If product has variants, save variant stocks
      if (editingProduct.options && editingProduct.options.length > 0) {
        // Generate all variant combinations
        const generateCombinations = (options: any[]) => {
          if (editingProduct.name === 'BSNAME Uniform') {
            const combinations: any[] = [];
            options.forEach(option => {
              option.choices.forEach((choice: string) => {
                combinations.push({
                  [option.id]: choice
                });
              });
            });
            return combinations;
          }

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
        const variants: Record<string, { stock: number; options: Record<string, string>; price?: number; image?: string }> = {};
        combinations.forEach((combo: Record<string, string>) => {
          const variantKey = Object.entries(combo)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, val]) => `${key}:${val}`)
            .join('|');
          
          variants[variantKey] = {
            stock: variantStocks[variantKey] || 0,
            options: combo,
            price: variantPrices[variantKey] || undefined,
            image: variantImages[variantKey] || undefined
          };
        });

        updates.variants = variants;
        
        // Calculate total stock from all variants
        updates.stock = Object.values(variants).reduce((sum, v) => sum + v.stock, 0);
      } else {
        // For products without variants, use the simple stock value
        updates.stock = editingProduct.stock;
        updates.variants = {}; // Clear variants if no options are defined
      }

      try {
        updateProduct(editingProduct.id, updates);
        
        // Sync to API
        const updatedProduct = { ...editingProduct, ...updates };
        await AppDataSync.syncProductToAPI(updatedProduct);
        
        showNotification(`${editingProduct.name} updated successfully`, 'success');
        setShowEditModal(false);
        setEditingProduct(null);
        setVariantStocks({});
        setVariantPrices({});
        setVariantImages({});
        setNewChoiceInputs({});
      } catch (err: any) {
        console.error('Failed to sync product to API:', err);
        showNotification(err.message || 'Failed to save product changes to the server.', 'error');
      }
    }
  };

  // Low stock products calculated but kept for potential future use
  // const lowStockProducts = products.filter((p) => p.stock <= 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebdcfc] via-[#f3e8ff] to-[#e2f7e5] p-4 sm:p-6 animate-slide-in-right">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                Inventory Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2">Manage products and stock levels</p>
            </div>
            {activeTab === 'inventory' && (
              <div className="flex gap-3">
                <button
                  onClick={handleExportToExcel}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 hover:shadow-lg transition-all font-semibold"
                >
                  <Download size={20} />
                  <span>Export Excel</span>
                </button>
                <button
                  onClick={handleOpenAddForm}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 hover:shadow-lg transition-all font-semibold"
                >
                  <Plus size={20} />
                  <span>Add Product</span>
                </button>
              </div>
            )}
            {activeTab === 'stock-intake' && (
              <button
                onClick={() => {
                  setStockIntakeFormData({
                    supplier: '',
                    notes: '',
                    dateReceived: new Date().toISOString().split('T')[0],
                    dueDateTerms: 'Net',
                    dueDateDays: '',
                    attachment: '',
                    referenceNo: `V${Math.floor(100 + Math.random() * 900)}`,
                    balanceDue: 0,
                    status: 'Paid in full',
                    items: [
                      {
                        id: Date.now().toString(),
                        productId: '',
                        productName: '',
                        quantity: 1,
                        costPerUnit: 0,
                        sellingPrice: 0,
                        selectedVariant: {},
                        account: 'Inventory',
                      },
                    ],
                    productId: '',
                    productName: '',
                    quantity: 0,
                    costPerUnit: 0,
                    sellingPrice: 0,
                    selectedVariant: {},
                  });
                  setShowStockIntakeForm(true);
                }}
                className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 hover:shadow-lg transition-all font-semibold"
              >
                <Plus size={20} />
                <span>New Purchase Invoice</span>
              </button>
            )}

            {activeTab === 'stock-receiving' && (
              <button
                onClick={() => {
                  setReceiveStockFormData({
                    productId: '',
                    selectedVariantIndex: '',
                    quantity: 1,
                    unitCost: 0,
                    supplier: '',
                    referenceNo: `DR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                    dateReceived: new Date().toISOString().split('T')[0],
                    receivedBy: 'Office Staff',
                    notes: '',
                  });
                  setShowReceiveStockModal(true);
                }}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 hover:shadow-lg transition-all font-semibold cursor-pointer shadow-md"
              >
                <Plus size={20} />
                <span>Receive Incoming Stock</span>
              </button>
            )}
            {activeTab === 'monthly' && (
              <button
                onClick={() => handleExportMonthlyReport(selectedMonthlyExportProducts.length > 0 ? selectedMonthlyExportProducts : undefined)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 hover:shadow-lg transition-all font-semibold"
              >
                <Download size={20} />
                <span>
                  {selectedMonthlyExportProducts.length > 0 
                    ? `Export Selected (${selectedMonthlyExportProducts.length})` 
                    : 'Export Report'}
                </span>
              </button>
            )}
            {activeTab === 'summary' && (
              <button
                type="button"
                onClick={() => handleOpenPhysicalAuditModal()}
                className={`flex items-center space-x-2 text-white px-5 py-3 rounded-lg shadow-md transition-all font-bold text-sm cursor-pointer ${
                  isAuditSaved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <ShieldCheck size={18} />
                <span>{isAuditSaved ? 'Edit Physical Audit' : 'Conduct Physical Audit'}</span>
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
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Inventory</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-3">Manage products and stock levels</p>
            <div className="flex justify-end gap-2">
              {activeTab === 'inventory' && (
                <>
                  <button
                    onClick={handleExportToExcel}
                    className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-xs sm:text-sm font-semibold shadow-sm hover:shadow"
                  >
                    <Download size={16} className="sm:w-5 sm:h-5" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={handleOpenAddForm}
                    className="flex items-center space-x-1 sm:space-x-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-all text-xs sm:text-sm font-semibold shadow-sm hover:shadow"
                  >
                    <Plus size={16} className="sm:w-5 sm:h-5" />
                    <span>Add</span>
                  </button>
                </>
              )}

              {activeTab === 'stock-receiving' && (
                <button
                  onClick={() => {
                    setReceiveStockFormData({
                      productId: '',
                      selectedVariantIndex: '',
                      quantity: 1,
                      unitCost: 0,
                      supplier: '',
                      referenceNo: `DR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                      dateReceived: new Date().toISOString().split('T')[0],
                      receivedBy: 'Office Staff',
                      notes: '',
                    });
                    setShowReceiveStockModal(true);
                  }}
                  className="flex items-center space-x-1 sm:space-x-2 bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all text-xs sm:text-sm font-semibold shadow-sm hover:shadow"
                >
                  <Plus size={16} className="sm:w-5 sm:h-5" />
                  <span>Receive Incoming Stock</span>
                </button>
              )}

              {activeTab === 'summary' && (
                <button
                  type="button"
                  onClick={() => handleOpenPhysicalAuditModal()}
                  className={`flex items-center space-x-1 text-white px-3 py-2 rounded-lg transition-all text-xs font-bold shadow-sm ${
                    isAuditSaved ? 'bg-emerald-600' : 'bg-purple-600'
                  }`}
                >
                  <ShieldCheck size={15} />
                  <span>{isAuditSaved ? 'Audit Saved ✓' : 'Audit Form'}</span>
                </button>
              )}
              {activeTab === 'stock-intake' && (
                <button
                  onClick={() => {
                    if (!stockIntakeFormData.items || stockIntakeFormData.items.length === 0) {
                      setStockIntakeFormData(prev => ({
                        ...prev,
                        items: [
                          {
                            id: Date.now().toString(),
                            productId: prev.productId || '',
                            productName: prev.productName || '',
                            quantity: prev.quantity || 1,
                            costPerUnit: prev.costPerUnit || 0,
                            sellingPrice: prev.sellingPrice || 0,
                            selectedVariant: prev.selectedVariant || {},
                            account: 'Inventory',
                          },
                        ],
                      }));
                    }
                    setShowStockIntakeForm(true);
                  }}
                  className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-xs sm:text-sm font-semibold shadow-sm hover:shadow"
                >
                  <Plus size={16} className="sm:w-5 sm:h-5" />
                  <span>Record</span>
                </button>
              )}
              {activeTab === 'monthly' && (
                <button
                  onClick={() => handleExportMonthlyReport(selectedMonthlyExportProducts.length > 0 ? selectedMonthlyExportProducts : undefined)}
                  className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-xs sm:text-sm font-semibold shadow-sm hover:shadow"
                >
                  <Download size={16} className="sm:w-5 sm:h-5" />
                  <span>{selectedMonthlyExportProducts.length > 0 ? `Export (${selectedMonthlyExportProducts.length})` : 'Export'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center mb-6 border-b border-slate-200 overflow-x-auto">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'inventory'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('stock-intake')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'stock-intake'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Purchase Invoices
            </button>
            <button
              onClick={() => setActiveTab('stock-receiving')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'stock-receiving'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stock Receiving
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'monthly'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Sales
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'summary'
                  ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inventory Summary
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
          <div className="space-y-6 animate-fade-in">
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
                  <AnimatedSelect
                    floatingLabel
                    label="Category"
                    value={formData.category === 'ppe' ? 'equipment' : (formData.category === 'grocery' || formData.category === 'essentials') ? 'essentials' : (formData.category || 'uniform')}
                    options={CATEGORY_OPTIONS}
                    onChange={(val) => {
                      const newCat = val as 'uniform' | 'accessory' | 'equipment' | 'service' | 'grocery' | 'essentials' | 'ppe';
                      setFormData({
                        ...formData,
                        category: newCat,
                        sku: generateNextSKU(newCat),
                      });
                    }}
                  />
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
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            showNotification('Uploading image to Cloudinary...');
                            try {
                              const cloudinaryUrl = await uploadToCloudinary(file, 'products');
                              if (cloudinaryUrl && cloudinaryUrl.startsWith('http')) {
                                setFormData({ ...formData, image: cloudinaryUrl });
                                showNotification('Image uploaded successfully', 'success');
                              } else {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({ ...formData, image: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            } catch (err) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData({ ...formData, image: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
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
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg border border-purple-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                            {(() => {
                              const resolvedImage = getInventoryProductImage(formData.name || '', '', formData.image);
                              const isImageUrl = resolvedImage && (resolvedImage.startsWith('data:') || resolvedImage.startsWith('http') || resolvedImage.includes('.'));
                              return isImageUrl ? (
                                <img src={resolvedImage} alt="Main Preview" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                              );
                            })()}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs text-purple-700 font-semibold truncate" title={formData.image.startsWith('data:') ? 'Uploaded custom image' : formData.image}>
                              Selected: {formData.image.startsWith('data:') ? 'Uploaded Image' : formData.image}
                            </p>
                          </div>
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

                {/* Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Pre-Order Toggle */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <label className="font-bold text-slate-800 text-sm block">Allow Pre-Order</label>
                      <span className="text-xs text-slate-500">Allow customers to pre-order this product when it is out of stock</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allowPreorder !== false}
                        onChange={(e) => setFormData({ ...formData, allowPreorder: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Made to Order Toggle */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <label className="font-bold text-slate-800 text-sm block">Made to Order</label>
                      <span className="text-xs text-slate-500">Mark this product as customized or made-to-order (bypasses stock check)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.madeToOrder === true}
                        onChange={(e) => setFormData({ ...formData, madeToOrder: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
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
                          <div className="space-y-2">
                            {/* Tags List */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {option.choices.map((choice, choiceIdx) => (
                                <span 
                                  key={choiceIdx} 
                                  draggable={true}
                                  onDragStart={(e) => handleDragStart(e, optionIndex, choiceIdx)}
                                  onDragOver={(e) => handleDragOver(e)}
                                  onDragEnter={() => setDraggedOverChoice({ optionIndex, choiceIndex: choiceIdx })}
                                  onDragLeave={() => setDraggedOverChoice(null)}
                                  onDragEnd={() => setDraggedOverChoice(null)}
                                  onDrop={(e) => handleDrop(e, optionIndex, choiceIdx, false)}
                                  className={`inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs pl-2 pr-1.5 py-1 rounded-full font-medium border transition-all duration-200 group cursor-grab active:cursor-grabbing ${
                                    draggedOverChoice?.optionIndex === optionIndex && draggedOverChoice?.choiceIndex === choiceIdx
                                      ? 'border-purple-600 border-dashed border-2 bg-purple-100/70 scale-105 shadow-sm'
                                      : 'border-purple-200'
                                  }`}
                                >
                                  <GripVertical size={11} className="text-purple-400 cursor-grab opacity-50 group-hover:opacity-100 transition-opacity" />
                                  <span className="mr-1 select-none">{choice}</span>
                                  <span className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveChoiceAdd(optionIndex, choiceIdx)}
                                      className="text-purple-400 hover:text-red-600 transition-colors active:scale-75 cursor-pointer"
                                      title="Remove choice"
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                </span>
                              ))}
                              {option.choices.length === 0 && (
                                <span className="text-[11px] text-slate-400 italic">No choices added yet.</span>
                              )}
                            </div>

                            {/* Add Choice Input & Button */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Add a choice (e.g. BSMT (₱3,000))"
                                value={newChoiceInputs[option.id] || ''}
                                onChange={(e) => setNewChoiceInputs(prev => ({
                                  ...prev,
                                  [option.id]: e.target.value
                                }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddChoiceAdd(option.id, optionIndex);
                                  }
                                }}
                                className="flex-1 border border-purple-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-slate-700 font-medium"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddChoiceAdd(option.id, optionIndex)}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 font-bold px-3 py-1.5 rounded-lg border border-purple-200 text-xs transition-all active:scale-95 whitespace-nowrap"
                              >
                                + Add
                              </button>
                            </div>
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
                    <h4 className="font-semibold text-slate-900 mb-3">Set stock, override price, and upload variant images:</h4>
                    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm max-h-96 overflow-y-auto mb-3">
                      <table className="w-full border-collapse text-left table-fixed">
                        <thead>
                          <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase bg-slate-100/80">
                            <th className="p-3 w-48">Variant Combination</th>
                            <th className="p-3 w-24 text-center">Stock</th>
                            <th className="p-3 w-28 text-center">Price (₱)</th>
                            <th className="p-3 w-80">Image Settings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Generate all variant combinations
                            const generateCombinations = (options: any[]) => {
                              if (formData.name === 'BSNAME Uniform') {
                                const combinations: any[] = [];
                                options.forEach(option => {
                                  option.choices.forEach((choice: string) => {
                                    combinations.push({
                                      [option.id]: choice
                                    });
                                  });
                                });
                                return combinations;
                              }

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
                                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                                .map(([key, val]) => `${key}:${val}`)
                                .join('|');
                              
                              const isBaseImage = !newProductVariantImages[variantKey];

                              return (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs">
                                  <td className="p-3 font-medium text-slate-700">
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(combo).map(([key, value], i) => {
                                        const option = formData.options?.find((opt: any) => opt.id === key);
                                        const label = option ? `${option.label}: ${value}` : value;
                                        return (
                                          <span key={i} className="inline-block bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded font-semibold border border-purple-100">
                                            {label}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <input
                                      type="number"
                                      value={newVariantStocks[variantKey] || 0}
                                      onChange={(e) => {
                                        const newStock = parseInt(e.target.value) || 0;
                                        setNewVariantStocks(prev => ({
                                          ...prev,
                                          [variantKey]: newStock
                                        }));
                                      }}
                                      className="w-16 px-1.5 py-1 text-center border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                                      min="0"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      placeholder={formData.price?.toString() || '0'}
                                      value={newProductVariantPrices[variantKey] || ''}
                                      onChange={(e) => {
                                        const newPrice = parseFloat(e.target.value) || 0;
                                        setNewProductVariantPrices(prev => ({
                                          ...prev,
                                          [variantKey]: newPrice
                                        }));
                                      }}
                                      className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                                      min="0"
                                      step="0.01"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const activeImage = isBaseImage ? formData.image : newProductVariantImages[variantKey];
                                        const resolvedImage = getInventoryProductImage(formData.name || '', variantKey, activeImage);
                                        const isImageUrl = resolvedImage && (resolvedImage.startsWith('data:') || resolvedImage.startsWith('http') || resolvedImage.includes('.'));
                                        return (
                                          <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0 shadow-sm" title={isBaseImage ? "Using main product image" : "Custom variant image"}>
                                            {resolvedImage ? (
                                              isImageUrl ? (
                                                <img src={resolvedImage} alt="Variant" className="w-full h-full object-cover" />
                                              ) : (
                                                <span className="text-base">{resolvedImage}</span>
                                              )
                                            ) : (
                                              <Package className="w-4 h-4 text-slate-400" />
                                            )}
                                          </div>
                                        );
                                      })()}
                                      {(() => {
                                        const productName = formData.name || '';
                                        const presets = getPresetOptions(productName);
                                        const activeImage = newProductVariantImages[variantKey] || '';
                                        
                                        if (presets.length > 0) {
                                          const currentVal = (() => {
                                            if (activeImage && (activeImage.startsWith('data:') || activeImage === 'custom-image.png')) {
                                              return 'custom';
                                            }
                                            const matchedPreset = presets.find(p => p.value === activeImage);
                                            if (matchedPreset) return matchedPreset.value;
                                            
                                            if (!activeImage) {
                                              const resolvedImage = getInventoryProductImage(productName, variantKey, '');
                                              const matchedResolved = presets.find(p => p.value === resolvedImage);
                                              if (matchedResolved) return matchedResolved.value;
                                            }
                                            return presets[0].value;
                                          })();
                                          const showUpload = currentVal === 'custom';

                                          return (
                                            <>
                                              <select
                                                value={currentVal}
                                                onChange={(e) => {
                                                  const selectVal = e.target.value;
                                                  if (selectVal === 'custom') {
                                                    setNewProductVariantImages(prev => ({ ...prev, [variantKey]: 'custom-image.png' }));
                                                  } else {
                                                    setNewProductVariantImages(prev => ({ ...prev, [variantKey]: selectVal }));
                                                  }
                                                }}
                                                className="border border-slate-300 rounded px-1.5 py-1 bg-white focus:outline-none text-[11px] text-slate-700"
                                              >
                                                {presets.map((preset, pIdx) => (
                                                  <option key={pIdx} value={preset.value}>{preset.label}</option>
                                                ))}
                                                <option value="custom">Custom Image</option>
                                              </select>
                                              {showUpload && (
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    id={`add-variant-upload-${idx}`}
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                        showNotification('Uploading image to Cloudinary...');
                                                        try {
                                                          const cloudinaryUrl = await uploadToCloudinary(file, 'products');
                                                          if (cloudinaryUrl && cloudinaryUrl.startsWith('http')) {
                                                            setNewProductVariantImages(prev => ({ ...prev, [variantKey]: cloudinaryUrl }));
                                                            showNotification('Image uploaded successfully', 'success');
                                                          } else {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                              setNewProductVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                            };
                                                            reader.readAsDataURL(file);
                                                          }
                                                        } catch (err) {
                                                          const reader = new FileReader();
                                                          reader.onloadend = () => {
                                                            setNewProductVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                          };
                                                          reader.readAsDataURL(file);
                                                        }
                                                      }
                                                    }}
                                                  />
                                                  <label
                                                    htmlFor={`add-variant-upload-${idx}`}
                                                    className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700 text-[10px] whitespace-nowrap active:scale-95 transition-all"
                                                  >
                                                    Upload
                                                  </label>
                                                  <span className="text-[10px] text-slate-500 truncate max-w-[80px]" title={activeImage.startsWith('data:') ? 'Custom uploaded image' : activeImage}>
                                                    {activeImage.startsWith('data:') ? 'Uploaded' : activeImage}
                                                  </span>
                                                </div>
                                              )}
                                            </>
                                          );
                                        } else {
                                          const isBaseImage = !activeImage;
                                          return (
                                            <>
                                              <select
                                                value={isBaseImage ? 'base' : 'custom'}
                                                onChange={(e) => {
                                                  const selectVal = e.target.value;
                                                  if (selectVal === 'base') {
                                                    setNewProductVariantImages(prev => ({ ...prev, [variantKey]: '' }));
                                                  } else {
                                                    setNewProductVariantImages(prev => ({ ...prev, [variantKey]: 'custom-image.png' }));
                                                  }
                                                }}
                                                className="border border-slate-300 rounded px-1.5 py-1 bg-white focus:outline-none text-[11px] text-slate-700"
                                              >
                                                <option value="base">Same as Product</option>
                                                <option value="custom">Custom Image</option>
                                              </select>
                                              {!isBaseImage && (
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    id={`add-variant-upload-${idx}`}
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                        showNotification('Uploading image to Cloudinary...');
                                                        try {
                                                          const cloudinaryUrl = await uploadToCloudinary(file, 'products');
                                                          if (cloudinaryUrl && cloudinaryUrl.startsWith('http')) {
                                                            setNewProductVariantImages(prev => ({ ...prev, [variantKey]: cloudinaryUrl }));
                                                            showNotification('Image uploaded successfully', 'success');
                                                          } else {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                              setNewProductVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                            };
                                                            reader.readAsDataURL(file);
                                                          }
                                                        } catch (err) {
                                                          const reader = new FileReader();
                                                          reader.onloadend = () => {
                                                            setNewProductVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                          };
                                                          reader.readAsDataURL(file);
                                                        }
                                                      }
                                                    }}
                                                  />
                                                  <label
                                                    htmlFor={`add-variant-upload-${idx}`}
                                                    className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700 text-[10px] whitespace-nowrap active:scale-95 transition-all"
                                                  >
                                                    Upload
                                                  </label>
                                                  <span className="text-[10px] text-slate-500 truncate max-w-[80px]" title={activeImage.startsWith('data:') ? 'Custom uploaded image' : activeImage}>
                                                    {activeImage.startsWith('data:') ? 'Uploaded' : activeImage}
                                                  </span>
                                                </div>
                                              )}
                                            </>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
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
                    const isMadeToOrder = product.madeToOrder === true || ['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(product.name);
                    const isLowStock = totalStock <= 10 && !isMadeToOrder;
                    const isCriticalStock = totalStock === 0 && !isMadeToOrder;
                    
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
                        {product.category === 'equipment' ? 'ppe' : product.category === 'grocery' ? 'essentials' : product.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono font-medium">
                        {formatDisplaySKU(product.sku, product.category)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        ₱{product.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isMadeToOrder && (!product.options || product.options.length === 0) ? (
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

        {/* Purchase Invoices Tab Content */}
        {activeTab === 'stock-intake' && (
          <div className="space-y-6 animate-fade-in">
          {/* Purchase Invoice Form */}
          {showStockIntakeForm && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-slide-in-right space-y-6">
              {/* Header & Reference */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-semibold text-purple-600 mb-1">
                    <button
                      type="button"
                      onClick={() => setShowStockIntakeForm(false)}
                      className="hover:underline hover:text-purple-800 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                    >
                      <ChevronLeft size={14} />
                      <span>Purchase Invoices</span>
                    </button>
                    <span>›</span>
                    <span className="text-slate-500 font-medium">New Purchase Invoice</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Purchase Invoice
                  </h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3.5 py-1 bg-purple-50 text-purple-700 font-mono font-bold text-xs rounded-full border border-purple-200 shadow-2xs">
                    Ref: {stockIntakeFormData.referenceNo || 'V-NEW'}
                  </span>
                </div>
              </div>

              {/* Form Row 1: Issue date | Due date | Reference */}
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                {/* Issue Date */}
                <div className="w-full md:w-48 flex-shrink-0">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Issue date
                  </label>
                  <input
                    type="date"
                    value={stockIntakeFormData.dateReceived}
                    onChange={(e) =>
                      setStockIntakeFormData({ ...stockIntakeFormData, dateReceived: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white text-slate-900 font-medium"
                  />
                </div>

                {/* Due Date & Terms */}
                <div className="flex-shrink-0">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Due date / Terms
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Animated Dropdown */}
                    <div className="relative w-24 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsDueDateDropdownOpen(!isDueDateDropdownOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm border rounded-lg transition-all bg-white font-medium text-slate-900 focus:outline-none ${
                          isDueDateDropdownOpen
                            ? 'border-purple-500 ring-2 ring-purple-200 shadow-sm'
                            : 'border-slate-300 hover:border-purple-400'
                        }`}
                      >
                        <span>{stockIntakeFormData.dueDateTerms || 'Net'}</span>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ml-1 ${
                            isDueDateDropdownOpen ? 'rotate-180 text-purple-600' : ''
                          }`}
                        />
                      </button>

                      {isDueDateDropdownOpen && (
                        <>
                          {/* Backdrop to dismiss dropdown */}
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setIsDueDateDropdownOpen(false)}
                          />

                          {/* Animated Dropdown Menu */}
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1 overflow-hidden animate-scale-in">
                            {['Net', 'By'].map((termOption) => (
                              <button
                                key={termOption}
                                type="button"
                                onClick={() => {
                                  setStockIntakeFormData({
                                    ...stockIntakeFormData,
                                    dueDateTerms: termOption,
                                  });
                                  setIsDueDateDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150 flex items-center justify-between ${
                                  (stockIntakeFormData.dueDateTerms || 'Net') === termOption
                                    ? 'bg-purple-50 text-purple-700 font-bold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span>{termOption}</span>
                                {(stockIntakeFormData.dueDateTerms || 'Net') === termOption && (
                                  <Check size={14} className="text-purple-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="relative w-28 flex-shrink-0 flex items-center">
                      <input
                        type="number"
                        placeholder=""
                        value={stockIntakeFormData.dueDateDays}
                        onChange={(e) =>
                          setStockIntakeFormData({ ...stockIntakeFormData, dueDateDays: e.target.value })
                        }
                        className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white text-slate-900 font-medium"
                      />
                      <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">
                        {stockIntakeFormData.dueDateTerms === 'By' ? 'th' : 'days'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reference No */}
                <div className="w-full md:w-56 flex-shrink-0">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Reference No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. V185 (Optional)"
                    value={stockIntakeFormData.referenceNo}
                    onChange={(e) =>
                      setStockIntakeFormData({ ...stockIntakeFormData, referenceNo: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Form Row 2: Supplier Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Supplier
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm border rounded-lg transition-all bg-white font-medium text-left ${
                      isSupplierDropdownOpen
                        ? 'border-purple-500 ring-2 ring-purple-200 shadow-sm text-slate-900'
                        : 'border-slate-300 hover:border-purple-400 text-slate-900'
                    }`}
                  >
                    <span className={stockIntakeFormData.supplier ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                      {stockIntakeFormData.supplier || 'Select a supplier...'}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ml-1 ${
                        isSupplierDropdownOpen ? 'rotate-180 text-purple-600' : ''
                      }`}
                    />
                  </button>

                  {isSupplierDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsSupplierDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-30 py-1 max-h-60 overflow-y-auto animate-scale-in">
                        <button
                          type="button"
                          onClick={() => {
                            setStockIntakeFormData({ ...stockIntakeFormData, supplier: '' });
                            setIsSupplierDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-sm text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                          Select a supplier...
                        </button>
                        {availableSuppliers.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setStockIntakeFormData({ ...stockIntakeFormData, supplier: s.name });
                              setIsSupplierDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-sm transition-colors duration-150 flex items-center justify-between ${
                              stockIntakeFormData.supplier === s.name
                                ? 'bg-purple-50 text-purple-700 font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{s.name}</span>
                            {stockIntakeFormData.supplier === s.name && (
                              <Check size={14} className="text-purple-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Form Row 3: Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bulk stock purchase for school opening supplies"
                  value={stockIntakeFormData.notes}
                  onChange={(e) =>
                    setStockIntakeFormData({ ...stockIntakeFormData, notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white text-slate-900 font-medium"
                />
              </div>

              {/* Line Items Section (Matching reference structure while maintaining clean light/purple theme) */}
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl overflow-visible shadow-2xs relative bg-white">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Line Items</h4>
                      {alsoGoodsReceipt && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                          Goods Receipt Active
                        </span>
                      )}
                      {isClosedInvoice && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded-full border border-slate-300">
                          Closed Invoice
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {(stockIntakeFormData.items || []).length} {(stockIntakeFormData.items || []).length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="overflow-x-visible">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700">
                        <tr>
                          <th className="w-10 px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider">↕</th>
                          {showLineNumberCol && (
                            <th className="w-10 px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider">#</th>
                          )}
                          <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider min-w-[220px]">Item</th>
                          <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider w-44">Account</th>
                          <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider w-36 text-right">Qty</th>
                          <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider w-32 text-right">Unit price</th>
                          {showDiscountCol && (
                            <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider w-28 text-right">Discount</th>
                          )}
                          <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider w-36 text-right">Total</th>
                          <th className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider w-20"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {(stockIntakeFormData.items || []).map((item, index) => {
                          const rawSubtotal = Number(item.quantity || 0) * Number(item.costPerUnit || 0);
                          const discountAmt = showDiscountCol ? Number(item.discount || 0) : 0;
                          const lineTotal = Math.max(0, rawSubtotal - discountAmt);
                          const selectedProduct = products.find((p) => p.id === item.productId);

                          return (
                            <tr key={item.id || index} className={`hover:bg-slate-50/80 transition-colors ${openItemDropdownIndex === index || openAccountDropdownIndex === index || openUnitDropdownIndex === index ? 'relative z-40' : 'relative z-1'}`}>
                              {/* Reorder handle */}
                              <td className="px-2 py-3 align-top text-center pt-3.5">
                                <button
                                  type="button"
                                  onClick={() => handleMoveLineItem(index, index - 1)}
                                  disabled={index === 0}
                                  className="text-slate-400 hover:text-purple-600 disabled:opacity-20 p-0.5"
                                  title="Move Up"
                                >
                                  <GripVertical size={14} />
                                </button>
                              </td>

                              {/* Line number column */}
                              {showLineNumberCol && (
                                <td className="px-2 py-3 align-top text-center font-mono text-xs font-bold text-slate-500 pt-4">
                                  {index + 1}
                                </td>
                              )}

                              {/* Item Select Cell */}
                              <td className="px-3 py-3 align-top">
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenItemDropdownIndex(openItemDropdownIndex === index ? null : index)}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs sm:text-sm border rounded-lg transition-all bg-white font-medium text-left ${
                                      openItemDropdownIndex === index
                                        ? 'border-purple-500 ring-2 ring-purple-200 shadow-sm text-slate-900'
                                        : 'border-slate-300 hover:border-purple-400 text-slate-900'
                                    }`}
                                  >
                                    {selectedProduct ? (
                                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                        <span className="truncate font-semibold text-slate-900">{selectedProduct.name} ({selectedProduct.sku})</span>
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpdateLineItem(index, 'productId', '');
                                            handleUpdateLineItem(index, 'productName', '');
                                            handleUpdateLineItem(index, 'sellingPrice', 0);
                                            handleUpdateLineItem(index, 'selectedVariant', {});
                                          }}
                                          className="text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded p-0.5 flex-shrink-0 transition-colors"
                                          title="Clear item"
                                        >
                                          <X size={12} />
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 truncate">Select item...</span>
                                    )}
                                    <ChevronDown
                                      size={14}
                                      className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ml-1 ${
                                        openItemDropdownIndex === index ? 'rotate-180 text-purple-600' : ''
                                      }`}
                                    />
                                  </button>

                                  {openItemDropdownIndex === index && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => setOpenItemDropdownIndex(null)} />
                                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 py-1 max-h-60 overflow-y-auto animate-scale-in">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateLineItem(index, 'productId', '');
                                            handleUpdateLineItem(index, 'productName', '');
                                            handleUpdateLineItem(index, 'sellingPrice', 0);
                                            handleUpdateLineItem(index, 'selectedVariant', {});
                                            setOpenItemDropdownIndex(null);
                                          }}
                                          className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 transition-colors"
                                        >
                                          Clear item...
                                        </button>
                                        {products.map((product) => {
                                          const isSelected = selectedProduct?.id === product.id;
                                          return (
                                            <button
                                              key={product.id}
                                              type="button"
                                              onClick={() => {
                                                handleUpdateLineItem(index, 'productId', product.id);
                                                handleUpdateLineItem(index, 'productName', product.name);
                                                handleUpdateLineItem(index, 'sellingPrice', product.price || 0);
                                                handleUpdateLineItem(index, 'selectedVariant', {});
                                                setOpenItemDropdownIndex(null);
                                              }}
                                              className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors duration-150 flex items-center justify-between ${
                                                isSelected
                                                  ? 'bg-purple-50 text-purple-700 font-bold'
                                                  : 'text-slate-700 hover:bg-slate-50'
                                              }`}
                                            >
                                              <span className="truncate pr-2">{product.name} ({product.sku})</span>
                                              {isSelected && <Check size={14} className="text-purple-600 flex-shrink-0" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Optional Item Description field */}
                                {showDescriptionCol && (
                                  <input
                                    type="text"
                                    placeholder="Add item description..."
                                    value={item.description || ''}
                                    onChange={(e) => handleUpdateLineItem(index, 'description', e.target.value)}
                                    className="mt-1.5 w-full px-2.5 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-purple-500 bg-slate-50/50 text-slate-800 placeholder-slate-400"
                                  />
                                )}

                                {/* Variant Selection if available */}
                                {selectedProduct?.options && selectedProduct.options.length > 0 && (
                                  <div className="mt-2 space-y-1.5 pl-1">
                                    {selectedProduct.options.map((option) => (
                                      <div key={option.id} className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold text-slate-500 min-w-[50px]">{option.label}:</span>
                                        <select
                                          value={item.selectedVariant?.[option.id] || ''}
                                          onChange={(e) => {
                                            const selectedChoice = e.target.value;
                                            const priceMatch = selectedChoice.match(/\(₱(\d+)\)/);
                                            const variantPrice = priceMatch ? parseFloat(priceMatch[1]) : null;

                                            const updatedVariant = {
                                              ...item.selectedVariant,
                                              [option.id]: selectedChoice,
                                            };
                                            handleUpdateLineItem(index, 'selectedVariant', updatedVariant);
                                            if (variantPrice !== null) {
                                              handleUpdateLineItem(index, 'sellingPrice', variantPrice);
                                            }
                                          }}
                                          className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-purple-500 bg-white font-medium"
                                        >
                                          <option value="">Select {option.label}</option>
                                          {option.choices.map((choice) => (
                                            <option key={choice} value={choice.replace(/\s*\(₱\d+\)/, '')}>
                                              {choice.replace(/\s*\(₱\d+\)/, '')}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>

                              {/* Account Cell */}
                              <td className="px-3 py-3 align-top">
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenAccountDropdownIndex(openAccountDropdownIndex === index ? null : index)}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs sm:text-sm border rounded-lg transition-all bg-white font-medium text-left ${
                                      openAccountDropdownIndex === index
                                        ? 'border-purple-500 ring-2 ring-purple-200 shadow-sm text-slate-900'
                                        : 'border-slate-300 hover:border-purple-400 text-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1 min-w-0 pr-1">
                                      <span className="truncate">{item.account || 'Inventory on hand'}</span>
                                      {item.account && item.account !== 'Inventory on hand' && (
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpdateLineItem(index, 'account', 'Inventory on hand');
                                          }}
                                          className="text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded p-0.5 flex-shrink-0"
                                          title="Reset account"
                                        >
                                          <X size={12} />
                                        </span>
                                      )}
                                    </div>
                                    <ChevronDown
                                      size={14}
                                      className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ml-1 ${
                                        openAccountDropdownIndex === index ? 'rotate-180 text-purple-600' : ''
                                      }`}
                                    />
                                  </button>

                                  {openAccountDropdownIndex === index && (
                                    <>
                                      <div className="fixed inset-0 z-40" onClick={() => setOpenAccountDropdownIndex(null)} />
                                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 py-1 animate-scale-in">
                                        {['Inventory on hand', 'Freight In', 'Cost of Goods Sold', 'Supplies Expense', 'Equipment'].map((acc) => {
                                          const isSelected = (item.account || 'Inventory on hand') === acc;
                                          return (
                                            <button
                                              key={acc}
                                              type="button"
                                              onClick={() => {
                                                handleUpdateLineItem(index, 'account', acc);
                                                setOpenAccountDropdownIndex(null);
                                              }}
                                              className={`w-full text-left px-3 py-2 text-xs sm:text-sm transition-colors duration-150 flex items-center justify-between ${
                                                isSelected
                                                  ? 'bg-purple-50 text-purple-700 font-bold'
                                                  : 'text-slate-700 hover:bg-slate-50'
                                              }`}
                                            >
                                              <span>{acc}</span>
                                              {isSelected && <Check size={14} className="text-purple-600 flex-shrink-0 ml-1" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>

                              {/* Qty Cell with Animated Custom Unit Dropdown */}
                              <td className="px-3 py-3 align-top">
                                <div className="flex items-center border border-slate-300 rounded-lg focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 bg-white">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                    className="w-full pl-2 pr-1 py-2 text-xs sm:text-sm text-right focus:outline-none font-bold text-slate-900 bg-transparent min-w-[45px]"
                                  />
                                  
                                  {/* Animated Custom Unit Dropdown */}
                                  <div className="relative flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setOpenUnitDropdownIndex(openUnitDropdownIndex === index ? null : index)}
                                      className={`flex items-center gap-1 px-2 py-2 text-xs border-l border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold focus:outline-none transition-colors ${
                                        openUnitDropdownIndex === index ? 'text-purple-600 bg-purple-50' : ''
                                      }`}
                                    >
                                      <span>{item.unit || 'Units'}</span>
                                      <ChevronDown
                                        size={12}
                                        className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                                          openUnitDropdownIndex === index ? 'rotate-180 text-purple-600' : ''
                                        }`}
                                      />
                                    </button>

                                    {openUnitDropdownIndex === index && (
                                      <>
                                        <div className="fixed inset-0 z-40" onClick={() => setOpenUnitDropdownIndex(null)} />
                                        <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-50 py-1 w-24 animate-scale-in">
                                          {['Units', 'Pair', 'Set'].map((unitOption) => {
                                            const isSelected = (item.unit || 'Units') === unitOption;
                                            return (
                                              <button
                                                key={unitOption}
                                                type="button"
                                                onClick={() => {
                                                  handleUpdateLineItem(index, 'unit', unitOption);
                                                  setOpenUnitDropdownIndex(null);
                                                }}
                                                className={`w-full text-left px-3 py-1.5 text-xs transition-colors duration-150 flex items-center justify-between ${
                                                  isSelected
                                                    ? 'bg-purple-50 text-purple-700 font-bold'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                              >
                                                <span>{unitOption}</span>
                                                {isSelected && <Check size={12} className="text-purple-600 flex-shrink-0 ml-1" />}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Unit price Cell */}
                              <td className="px-3 py-3 align-top">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.costPerUnit}
                                  onChange={(e) => handleUpdateLineItem(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2.5 py-2 text-xs sm:text-sm text-right border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white font-bold text-slate-900"
                                />
                              </td>

                              {/* Optional Discount Cell */}
                              {showDiscountCol && (
                                <td className="px-3 py-3 align-top">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0"
                                    value={item.discount || ''}
                                    onChange={(e) => handleUpdateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-2 text-xs sm:text-sm text-right border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 transition-all bg-white font-medium text-slate-900"
                                  />
                                </td>
                              )}

                              {/* Total Cell */}
                              <td className="px-4 py-3 align-top text-right">
                                <div className="px-3 py-2 text-xs sm:text-sm font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg text-right">
                                  {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </td>

                              {/* Actions Cell */}
                              <td className="px-2 py-3 text-center align-top pt-2.5">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateLineItem(index)}
                                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Duplicate line"
                                  >
                                    <Copy size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLineItem(index)}
                                    disabled={(stockIntakeFormData.items || []).length <= 1}
                                    className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-20 rounded-lg transition-colors"
                                    title="Remove line"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Subtotal Summary Box aligned under Total column */}
                  {(() => {
                    const itemsTotal = (stockIntakeFormData.items || []).reduce((sum, item) => {
                      const raw = Number(item.quantity || 0) * Number(item.costPerUnit || 0);
                      const disc = showDiscountCol ? Number(item.discount || 0) : 0;
                      return sum + Math.max(0, raw - disc);
                    }, 0);
                    const grandTotal = itemsTotal + (showFreightInCol ? Number(freightInAmount || 0) : 0);

                    return (
                      <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Subtotal:</span>
                          <div className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-right font-black text-slate-900 text-sm shadow-2xs">
                            ₱{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Add Line Button & Checkbox Options (matching reference layout) */}
                <div className="space-y-4 pt-1">
                  <div>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-300 shadow-2xs transition-all active:scale-95"
                    >
                      <span className="text-[10px]">▶</span>
                      <span>Add line</span>
                    </button>
                  </div>

                  {/* Form Toggles List */}
                  <div className="space-y-2 pl-1">
                    {[
                      { id: 'lineNumber', label: 'Column — Line number', state: showLineNumberCol, setter: setShowLineNumberCol },
                      { id: 'description', label: 'Column — Description', state: showDescriptionCol, setter: setShowDescriptionCol },
                      { id: 'discount', label: 'Column — Discount', state: showDiscountCol, setter: setShowDiscountCol },
                      { id: 'freightIn', label: 'Freight-in', state: showFreightInCol, setter: setShowFreightInCol },
                      { id: 'hideBalance', label: 'Hide — Balance due', state: hideBalanceDue, setter: setHideBalanceDue },
                      { id: 'goodsReceipt', label: 'Also acts as goods receipt', state: alsoGoodsReceipt, setter: setAlsoGoodsReceipt },
                      { id: 'footers', label: 'Footers', state: showFooters, setter: setShowFooters },
                      { id: 'closedInvoice', label: 'Closed invoice', state: isClosedInvoice, setter: setIsClosedInvoice },
                    ].map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-2.5 cursor-pointer text-xs transition-colors select-none w-fit ${
                          option.state ? 'text-purple-700 font-semibold' : 'text-slate-700 hover:text-purple-700 font-medium'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={option.state}
                          onChange={(e) => option.setter(e.target.checked)}
                          style={{ accentColor: '#9333ea' }}
                          className="w-4 h-4 accent-purple-600 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Conditional Freight-In Field */}
                  {showFreightInCol && (
                    <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200 w-full sm:w-72 mt-2 space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">Freight-In Amount (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={freightInAmount || ''}
                        onChange={(e) => setFreightInAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded bg-white focus:outline-none focus:border-purple-500 text-slate-900"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Conditional Footers Field */}
                  {showFooters && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2 space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase">Invoice Footer Notes</label>
                      <textarea
                        rows={2}
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder="Custom footer text, payment terms, or thank you message..."
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-purple-500 text-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Image Attachment Upload */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Invoice Image / Attachment
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          showNotification('Uploading invoice attachment...');
                          try {
                            const cloudinaryUrl = await uploadToCloudinary(file, 'receipts');
                            if (cloudinaryUrl && cloudinaryUrl.startsWith('http')) {
                              setStockIntakeFormData({ ...stockIntakeFormData, attachment: cloudinaryUrl });
                              showNotification('Invoice uploaded successfully', 'success');
                            } else {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setStockIntakeFormData({ ...stockIntakeFormData, attachment: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          } catch (err) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setStockIntakeFormData({ ...stockIntakeFormData, attachment: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                      className="hidden"
                      id="stock-intake-attachment"
                    />
                    <label
                      htmlFor="stock-intake-attachment"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-purple-300 rounded-lg text-purple-700 font-semibold hover:bg-purple-50 hover:border-purple-500 cursor-pointer transition-all duration-200 text-xs sm:text-sm"
                    >
                      <Plus size={16} />
                      <span>{stockIntakeFormData.attachment ? 'Change Invoice File' : 'Choose File / Upload Image'}</span>
                    </label>
                  </div>
                  {stockIntakeFormData.attachment && (
                    <div className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center shadow-xs">
                      <img src={stockIntakeFormData.attachment} alt="Invoice preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setStockIntakeFormData({ ...stockIntakeFormData, attachment: '' })}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                        title="Remove attachment"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary Bar */}
              {(() => {
                const totalInvoiceAmount = (stockIntakeFormData.items || []).reduce((sum, item) => {
                  const raw = Number(item.quantity || 0) * Number(item.costPerUnit || 0);
                  const disc = showDiscountCol ? Number(item.discount || 0) : 0;
                  return sum + Math.max(0, raw - disc);
                }, 0) + (showFreightInCol ? Number(freightInAmount || 0) : 0);

                return (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-slate-50 rounded-xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoice Amount</p>
                      <p className="text-2xl font-black text-purple-900">
                        ₱{totalInvoiceAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Form Submit & Cancel Actions */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={handleSavePurchaseInvoice}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-600/30 hover:scale-105 transition-all duration-300 active:scale-95 text-sm"
                >
                  {editingInvoiceId ? 'Update Purchase Invoice' : 'Record Purchase Invoice'}
                </button>
                <button
                  onClick={resetStockIntakeFormData}
                  className="bg-slate-200 text-slate-800 px-6 py-3 rounded-xl font-semibold hover:bg-slate-300 hover:scale-105 transition-all duration-300 active:scale-95 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}


          {/* Purchase Invoices Table - Styled matching Reference Image 1 */}
          {(() => {
            const filteredInvoices = stockIntakeRecords.filter((record) => {
              if (!invoiceSearchQuery.trim()) return true;
              const q = invoiceSearchQuery.toLowerCase();
              const ref = (record.reference_no || record.referenceNo || '').toLowerCase();
              const prod = (record.product_name || record.productName || '').toLowerCase();
              const sup = (record.supplier || '').toLowerCase();
              const notes = (record.notes || '').toLowerCase();
              const status = (record.status || '').toLowerCase();
              return ref.includes(q) || prod.includes(q) || sup.includes(q) || notes.includes(q) || status.includes(q);
            });

            const totalInvoicePages = Math.ceil(filteredInvoices.length / invoiceItemsPerPage) || 1;
            const startInvoiceIndex = (invoiceCurrentPage - 1) * invoiceItemsPerPage;
            const paginatedInvoices = filteredInvoices.slice(startInvoiceIndex, startInvoiceIndex + invoiceItemsPerPage);

            return (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                {/* Search Bar Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/70">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-slate-900 text-base">Purchase Invoices</h3>
                    <span className="text-xs text-slate-500 font-medium bg-slate-200/60 px-2.5 py-1 rounded-full">
                      Total: {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Invoice' : 'Invoices'}
                    </span>
                  </div>

                  {/* Search Bar & Search Button */}
                  <div className="flex items-center gap-2 max-w-md w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-72">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search reference, product, supplier..."
                        value={invoiceSearchQuery}
                        onChange={(e) => {
                          setInvoiceSearchQuery(e.target.value);
                          setInvoiceCurrentPage(1);
                        }}
                        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white shadow-xs"
                      />
                      {invoiceSearchQuery && (
                        <button
                          onClick={() => {
                            setInvoiceSearchQuery('');
                            setInvoiceCurrentPage(1);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-semibold"
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setInvoiceCurrentPage(1)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap"
                    >
                      <Search size={14} />
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100/80 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-16">Edit</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-16">View</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Issue date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Reference</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Supplier</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Invoice Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Balance due</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                            <Package size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
                            <p className="text-lg font-semibold">
                              {invoiceSearchQuery ? 'No matching invoices found' : 'No purchase invoices recorded yet'}
                            </p>
                            <p className="text-sm mt-2 text-slate-400">
                              {invoiceSearchQuery ? 'Try searching for a different reference, product name, or supplier.' : 'Click "New Purchase Invoice" above to add your first entry'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedInvoices.map((record) => {
                          const totalCost = Number(record.total_cost || record.totalCost || (Number(record.quantity || 0) * Number(record.cost_per_unit || record.costPerUnit || 0)));
                          const quantity = Number(record.quantity || 0);
                          const dateReceived = record.date_received || record.dateReceived || record.created_at;
                          const productName = record.product_name || record.productName || '';
                          const selectedVariant = record.selected_variant || record.selectedVariant;
                          const supplierName = record.supplier || '';
                          const referenceNo = record.reference_no !== undefined ? record.reference_no : (record.referenceNo || '');
                          const balanceDue = Number(record.balance_due !== undefined ? record.balance_due : (record.balanceDue || 0));
                          
                          // Evaluate automatic status based on issue date and term days
                          const daysVal = parseInt(String(record.due_date_days || record.dueDateDays || '30'), 10) || 30;
                          let computedStatus = record.status || 'Ongoing';
                          if (record.status === 'Paid in full') {
                            computedStatus = 'Paid in full';
                          } else if (dateReceived) {
                            const issueDate = new Date(dateReceived);
                            const dueDate = new Date(issueDate.getTime() + daysVal * 24 * 60 * 60 * 1000);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            dueDate.setHours(0, 0, 0, 0);
                            computedStatus = today > dueDate ? 'Overdue' : 'Ongoing';
                          }
                          
                          let variantStr = '';
                          if (selectedVariant && Object.keys(selectedVariant).length > 0) {
                            variantStr = Object.entries(selectedVariant)
                              .map(([, val]) => String(val).replace(/\s*\(₱\d+\)/, ''))
                              .join(', ');
                          }
                          
                          const description = record.notes || (productName ? `Payment for ${quantity} pcs of ${productName}${variantStr ? ` (${variantStr})` : ''}` : '');
                          
                          return (
                            <tr key={record.id} className="hover:bg-purple-50/40 transition-colors border-b border-slate-100">
                              {/* Edit Icon Button */}
                              <td className="px-3 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingInvoiceId(record.id ? String(record.id) : 'editing');
                                    setStockIntakeFormData({
                                      productId: record.product_id || record.productId || '',
                                      productName: record.product_name || record.productName || '',
                                      quantity: Number(record.quantity || 0),
                                      costPerUnit: Number(record.cost_per_unit || record.costPerUnit || 0),
                                      sellingPrice: Number(record.selling_price || record.sellingPrice || 0),
                                      supplier: record.supplier || '',
                                      notes: record.notes || '',
                                      dateReceived: record.date_received || record.dateReceived || new Date().toISOString().split('T')[0],
                                      dueDateTerms: record.dueDateTerms || record.due_date_terms || 'Net',
                                      dueDateDays: record.dueDateDays !== undefined && record.dueDateDays !== null ? String(record.dueDateDays) : (record.due_date_days !== undefined && record.due_date_days !== null ? String(record.due_date_days) : ''),
                                      selectedVariant: record.selected_variant || record.selectedVariant || {},
                                      attachment: record.attachment || '',
                                      referenceNo,
                                      balanceDue,
                                      status,
                                      items: record.items && record.items.length > 0
                                        ? record.items.map((it: any) => ({ ...it, unit: it.unit || record.unit || 'Units' }))
                                        : [
                                        {
                                          id: '1',
                                          productId: record.product_id || record.productId || '',
                                          productName: record.product_name || record.productName || '',
                                          quantity: Number(record.quantity || 1),
                                          unit: record.unit || 'Units',
                                          costPerUnit: Number(record.cost_per_unit || record.costPerUnit || 0),
                                          sellingPrice: Number(record.selling_price || record.sellingPrice || 0),
                                          selectedVariant: record.selected_variant || record.selectedVariant || {},
                                          account: 'Inventory on hand',
                                        },
                                      ],
                                    });
                                    setShowStockIntakeForm(true);
                                  }}
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-purple-600 rounded-lg transition-colors inline-flex items-center justify-center"
                                  title="Edit invoice"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </td>

                              {/* View Icon Button */}
                              <td className="px-3 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setViewInvoiceModal({ show: true, record: { ...record, referenceNo, description, totalCost, balanceDue, status } })}
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-purple-600 rounded-lg transition-colors inline-flex items-center justify-center"
                                  title="View invoice details"
                                >
                                  <Eye size={16} />
                                </button>
                              </td>

                              {/* Issue Date */}
                              <td className="px-4 py-3 text-xs sm:text-sm text-slate-900 font-medium whitespace-nowrap">
                                {dateReceived ? new Date(dateReceived).toISOString().split('T')[0] : '-'}
                              </td>

                              {/* Reference */}
                              <td className="px-4 py-3 text-xs sm:text-sm font-semibold text-purple-700 font-mono whitespace-nowrap">
                                {referenceNo}
                              </td>

                              {/* Supplier */}
                              <td className="px-4 py-3 text-xs sm:text-sm text-slate-900 font-semibold whitespace-nowrap">
                                {supplierName}
                              </td>

                              {/* Description */}
                              <td className="px-4 py-3 text-xs sm:text-sm text-slate-700 max-w-sm">
                                <div className="line-clamp-2" title={description}>
                                  {description}
                                </div>
                              </td>

                              {/* Invoice Amount */}
                              <td className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                                {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>

                              {/* Balance Due */}
                              <td className="px-4 py-3 text-xs sm:text-sm text-right whitespace-nowrap">
                                {balanceDue > 0 ? (
                                  <span className="font-bold text-amber-600 font-mono">
                                    {balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono">0.00</span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span
                                  className={`inline-block px-3 py-1 rounded text-xs font-bold shadow-2xs ${
                                    computedStatus === 'Ongoing'
                                      ? 'bg-blue-600 text-white'
                                      : computedStatus === 'Overdue'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-emerald-500 text-white'
                                  }`}
                                >
                                  {computedStatus}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-3 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setDeleteIntakeConfirm({ show: true, record, isDeleting: false })}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                                  title="Delete purchase invoice"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Animated Pagination Bar */}
                {filteredInvoices.length > 0 && (
                  <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                    <div className="text-xs sm:text-sm text-slate-600 font-medium">
                      Showing <span className="font-semibold text-slate-900">{startInvoiceIndex + 1}</span> to{' '}
                      <span className="font-semibold text-slate-900">{Math.min(startInvoiceIndex + invoiceItemsPerPage, filteredInvoices.length)}</span> of{' '}
                      <span className="font-semibold text-purple-700">{filteredInvoices.length}</span> invoices
                    </div>

                    {totalInvoicePages > 1 && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setInvoiceCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={invoiceCurrentPage === 1}
                          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 transition-all duration-200 shadow-xs active:scale-95"
                          title="Previous Page"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {Array.from({ length: totalInvoicePages }, (_, i) => i + 1).map((pageNum) => {
                          const isActive = pageNum === invoiceCurrentPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setInvoiceCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-300 transform ${
                                isActive
                                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-110'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 hover:scale-105 shadow-xs'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setInvoiceCurrentPage((prev) => Math.min(prev + 1, totalInvoicePages))}
                          disabled={invoiceCurrentPage === totalInvoicePages}
                          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 transition-all duration-200 shadow-xs active:scale-95"
                          title="Next Page"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Stock Receiving Tab (Auto-Syncs with Inventory Catalog) */}
      {activeTab === 'stock-receiving' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Units Received */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Units Received</span>
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Package size={18} />
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-extrabold text-slate-900">
                  {stockReceivingRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)} Pcs
                </h4>
                <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Synced directly to Inventory Tab</span>
                </p>
              </div>
            </div>

            {/* Card 2: Total Receiving Batches */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receiving Deliveries</span>
                <span className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <Layers size={18} />
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-extrabold text-slate-900">
                  {stockReceivingRecords.length} Deliveries
                </h4>
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  Recorded in Receiving Ledger
                </p>
              </div>
            </div>

            {/* Card 3: Total Receiving Valuation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inflow Cost</span>
                <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <DollarSign size={18} />
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-extrabold text-slate-900">
                  ₱{stockReceivingRecords.reduce((sum, r) => sum + (Number(r.totalValue) || 0), 0).toFixed(2)}
                </h4>
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  Value of incoming merchandise
                </p>
              </div>
            </div>

            {/* Card 4: Recent Stock Arrival */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest Arrival</span>
                <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <RotateCcw size={18} />
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-sm font-extrabold text-slate-900 truncate">
                  {stockReceivingRecords[0] ? (stockReceivingRecords[0].variantLabel ? `${stockReceivingRecords[0].productName} (${stockReceivingRecords[0].variantLabel})` : stockReceivingRecords[0].productName) : 'No Deliveries Yet'}
                </h4>
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  {stockReceivingRecords[0] ? `+${stockReceivingRecords[0].quantity} Pcs on ${stockReceivingRecords[0].dateReceived}` : 'Waiting for incoming stock'}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search product, SKU, DR #, supplier..."
                value={receiveStockSearchQuery}
                onChange={(e) => {
                  setReceiveStockSearchQuery(e.target.value);
                  setReceiveStockCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {receiveStockSearchQuery && (
                <button
                  type="button"
                  onClick={() => setReceiveStockSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Stock Receiving Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 text-left">Date Received</th>
                    <th className="px-5 py-3.5 text-left">DR / PO Ref #</th>
                    <th className="px-5 py-3.5 text-left">Merchandise Item</th>
                    <th className="px-5 py-3.5 text-center">Qty Received</th>
                    <th className="px-5 py-3.5 text-right">Unit Cost</th>
                    <th className="px-5 py-3.5 text-left">Supplier</th>
                    <th className="px-5 py-3.5 text-center">Inventory Impact</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(() => {
                    const filteredRecords = stockReceivingRecords.filter((rec) => {
                      const query = receiveStockSearchQuery.toLowerCase().trim();
                      if (!query) return true;
                      const itemTitle = rec.variantLabel ? `${rec.productName} (${rec.variantLabel})` : rec.productName;
                      return (
                        itemTitle.toLowerCase().includes(query) ||
                        (rec.referenceNo && rec.referenceNo.toLowerCase().includes(query)) ||
                        (rec.supplier && rec.supplier.toLowerCase().includes(query)) ||
                        (rec.notes && rec.notes.toLowerCase().includes(query))
                      );
                    });

                    if (filteredRecords.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">
                            No stock receiving logs found. Click "+ Receive Incoming Stock" to record incoming stock arrivals!
                          </td>
                        </tr>
                      );
                    }

                    const totalPages = Math.ceil(filteredRecords.length / receiveStockItemsPerPage);
                    const currentPageValid = Math.min(receiveStockCurrentPage, totalPages || 1);
                    const startIndex = (currentPageValid - 1) * receiveStockItemsPerPage;
                    const paginated = filteredRecords.slice(startIndex, startIndex + receiveStockItemsPerPage);

                    return (
                      <>
                        {paginated.map((rec) => {
                          const displayInfo = getInventoryProductDisplayTitle(rec.productName, rec.variantLabel);

                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                              {/* Date Received */}
                              <td className="px-5 py-4 whitespace-nowrap font-bold text-slate-700">
                                {rec.dateReceived}
                              </td>

                              {/* DR / PO Ref # */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className="font-mono text-xs font-extrabold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                                  {rec.referenceNo || 'N/A'}
                                </span>
                              </td>

                              {/* Merchandise Item */}
                              <td className="px-5 py-4">
                                <div>
                                  <p className="font-bold text-slate-900 leading-snug">{displayInfo.title}</p>
                                  {displayInfo.subtitle && (
                                    <p className="text-[11px] font-bold text-purple-700 mt-0.5">{displayInfo.subtitle}</p>
                                  )}
                                </div>
                              </td>

                              {/* Qty Received */}
                              <td className="px-5 py-4 text-center whitespace-nowrap">
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-extrabold text-xs rounded-full border border-emerald-300">
                                  +{rec.quantity} Pcs
                                </span>
                              </td>

                              {/* Unit Cost */}
                              <td className="px-5 py-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                                ₱{(Number(rec.unitCost) || 0).toFixed(2)}
                              </td>

                              {/* Supplier */}
                              <td className="px-5 py-4 text-slate-700 font-semibold whitespace-nowrap">
                                {rec.supplier || 'General Supplier'}
                              </td>

                              {/* Inventory Impact */}
                              <td className="px-5 py-4 text-center whitespace-nowrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-800 rounded-full text-[11px] font-bold border border-purple-200">
                                  <CheckCircle2 size={12} className="text-purple-600" />
                                  <span>Synced to Inventory</span>
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-5 py-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStockReceivingRecord(rec)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete receiving record and revert inventory stock"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Sales Tab */}
      {activeTab === 'monthly' && monthlyData && (
        <div className="space-y-6 animate-fade-in">
          {/* Month Navigation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const newMonth = new Date(selectedMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setSelectedMonth(newMonth);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
                <span className="font-semibold">Previous Month</span>
              </button>
              
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Viewing sales for:</p>
                <p className="text-2xl font-bold text-purple-600">
                  {selectedMonth.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long'
                  })}
                </p>
              </div>
              
              <button
                onClick={() => {
                  const newMonth = new Date(selectedMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  const now = new Date();
                  if (newMonth.getMonth() <= now.getMonth() && newMonth.getFullYear() <= now.getFullYear()) {
                    setSelectedMonth(newMonth);
                  }
                }}
                disabled={selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear()}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear()
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <span className="font-semibold">Next Month</span>
                <ChevronRight size={20} />
              </button>
            </div>
            
            {/* Month Picker */}
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3">
                <label htmlFor="month-picker" className="text-sm font-semibold text-slate-700">
                  Jump to month:
                </label>
                <input
                  id="month-picker"
                  type="month"
                  value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                  max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-');
                    const newMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
                    setSelectedMonth(newMonth);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold opacity-90">Total Sales</h3>
                <TrendingUp size={24} />
              </div>
              <p className="text-3xl font-bold">
                ₱{monthlyData.totalSales.toLocaleString()}
              </p>
              <p className="text-sm opacity-75 mt-1">
                {selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear() 
                  ? 'this month' 
                  : 'that month'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold opacity-90">Orders Completed</h3>
                <CheckCircle size={24} />
              </div>
              <p className="text-3xl font-bold">{monthlyData.orderCount}</p>
              <p className="text-sm opacity-75 mt-1">orders</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold opacity-90">Products Sold</h3>
                <Package size={24} />
              </div>
              <p className="text-3xl font-bold">
                {Object.values(monthlyData.productsSold).reduce((sum: number, p: any) => sum + p.quantity, 0)}
              </p>
              <p className="text-sm opacity-75 mt-1">units</p>
            </div>
          </div>

          {/* Products Sold Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">Products Sold This Month</h3>
                    {selectedMonthlyExportProducts.length > 0 && (
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                        {selectedMonthlyExportProducts.length} selected for export
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Breakdown of product items sold, downpayment deposits, and balance settlements.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 sm:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search product name..."
                      value={monthlySearchQuery}
                      onChange={(e) => setMonthlySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm placeholder-slate-400"
                    />
                    {monthlySearchQuery && (
                      <button
                        onClick={() => setMonthlySearchQuery('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMonthlyExportModal(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200"
                    title="Open Product Picker Modal"
                  >
                    <Filter size={15} />
                    <span>Select Products</span>
                  </button>

                  {selectedMonthlyExportProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleExportMonthlyReport(selectedMonthlyExportProducts)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 animate-fade-in"
                    >
                      <Download size={15} />
                      <span>Export Selected ({selectedMonthlyExportProducts.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Stage Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter size={14} /> Payment Stage:
                </span>
                <button
                  onClick={() => setMonthlyPaymentTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    monthlyPaymentTypeFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All Transactions
                </button>
                <button
                  onClick={() => setMonthlyPaymentTypeFilter('full')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    monthlyPaymentTypeFilter === 'full'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Full Payments
                </button>
                <button
                  onClick={() => setMonthlyPaymentTypeFilter('downpayment')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    monthlyPaymentTypeFilter === 'downpayment'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Downpayments
                </button>
                <button
                  onClick={() => setMonthlyPaymentTypeFilter('balance')}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    monthlyPaymentTypeFilter === 'balance'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Balance Settlements
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Product Name</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Payment Stage</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Units Sold</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = Object.entries(monthlyData.productsSold)
                      .filter(([_, data]: [string, any]) => {
                        const nameMatches = (data.productName || '').toLowerCase().includes(monthlySearchQuery.toLowerCase());
                        const typeMatches = monthlyPaymentTypeFilter === 'all' || data.paymentType === monthlyPaymentTypeFilter;
                        return nameMatches && typeMatches;
                      })
                      .sort((a: any, b: any) => b[1].quantity !== a[1].quantity ? b[1].quantity - a[1].quantity : b[1].revenue - a[1].revenue);

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500 font-medium">
                            No products found matching the current filter
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map(([key, data]: [string, any]) => {
                      return (
                        <tr 
                          key={key} 
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            <div>{data.productName}</div>
                            {data.paymentType === 'downpayment' && (
                              <span className="text-[11px] text-amber-700 font-bold">
                                Partial Downpayment Deposit
                              </span>
                            )}
                            {data.paymentType === 'balance' && (
                              <span className="text-[11px] text-emerald-700 font-bold">
                                Remaining Balance Settlement
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            {data.paymentType === 'downpayment' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                DOWNPAYMENT
                              </span>
                            ) : data.paymentType === 'balance' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                BALANCE SETTLEMENT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                Full Payment
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            {data.paymentType === 'balance' ? (
                              <button
                                onClick={() => setSelectedProductSoldDetails({ productName: data.productName, paymentType: data.paymentType, quantity: data.quantity })}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs transition-all hover:scale-105 active:scale-95 border border-emerald-200 shadow-2xs"
                                title="Click to view balance settlement orders"
                              >
                                Balance Settlements
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedProductSoldDetails({ productName: data.productName, paymentType: data.paymentType, quantity: data.quantity })}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-2xs ${
                                  data.paymentType === 'downpayment'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200/50'
                                }`}
                              >
                                {data.quantity} units
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-black text-slate-900">
                            ₱{data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Summary Tab: Month-End Physical Stock Audit & Merchandise Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-fade-in">

          {/* Month Selector, Title & Primary Action Controls Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-100 text-purple-700 rounded-xl font-bold">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Month-End Inventory & Stock Summary
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Staff physical stock count, remaining inventory audit & stock valuation log
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Month Selector */}
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <Calendar size={16} className="text-purple-600 ml-2" />
                <select
                  value={selectedSummaryMonth}
                  onChange={(e) => setSelectedSummaryMonth(e.target.value)}
                  className="bg-transparent text-slate-900 font-extrabold text-xs sm:text-sm focus:outline-none cursor-pointer pr-2"
                >
                  {summaryMonthOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleExportSummaryExcel}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <FileSpreadsheet size={15} className="text-emerald-600" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Metric Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Total Merchandise Items */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Items</span>
                <span className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <Package size={18} />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {summaryMetrics.totalItems} <span className="text-xs text-slate-400 font-bold">Items/Variants</span>
              </p>
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-semibold border-t border-slate-100 pt-2.5">
                <span>Active Merchandise Catalog</span>
                <span className="text-purple-700 font-extrabold">{products.length} Products</span>
              </div>
            </div>

            {/* Card 2: Remaining System Stock */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Remaining Stock</span>
                <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <Layers size={18} />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-blue-950 mt-2">
                {summaryMetrics.totalSystemUnits.toLocaleString()} <span className="text-xs text-slate-400 font-bold">Pcs</span>
              </p>
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-semibold border-t border-slate-100 pt-2.5">
                <span>Physical Count Total:</span>
                <span className="text-blue-800 font-extrabold">{summaryMetrics.totalPhysicalUnits.toLocaleString()} Pcs</span>
              </div>
            </div>

            {/* Card 3: Audit Discrepancies / Status */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Month Audit Status</span>
                <span className={`p-2 rounded-xl ${summaryMetrics.discrepanciesCount === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {summaryMetrics.discrepanciesCount === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                </span>
              </div>
              <p className={`text-2xl sm:text-3xl font-black mt-2 ${summaryMetrics.discrepanciesCount === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {summaryMetrics.discrepanciesCount === 0 ? 'Verified' : `${summaryMetrics.discrepanciesCount} Discrepant`}
              </p>
              <div className="flex items-center justify-between mt-3 text-xs text-slate-500 font-semibold border-t border-slate-100 pt-2.5">
                <span>Low Stock Warning (≤5):</span>
                <span className="text-amber-700 font-extrabold">{summaryMetrics.lowStockCount} Items</span>
              </div>
            </div>
          </div>

          {/* Filters & Controls Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
                {summaryCategoryOptions.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSummaryCategoryFilter(cat.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      summaryCategoryFilter === cat.key
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full lg:w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search item, SKU, category..."
                  value={summarySearchQuery}
                  onChange={(e) => setSummarySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                />
                {summarySearchQuery && (
                  <button
                    onClick={() => setSummarySearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Stock Status Secondary Filters & Audit Modal Launcher */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Filter size={14} className="text-purple-600" />
                <span>Stock Filter:</span>
                {[
                  { key: 'all', label: 'All Items' },
                  { key: 'instock', label: 'Healthy Stock' },
                  { key: 'lowstock', label: 'Low Stock (≤5)' },
                  { key: 'out-of-stock', label: 'Out of Stock (0)' },
                  { key: 'discrepancy', label: 'Variance Discrepancies' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setSummaryStockStatusFilter(st.key as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      summaryStockStatusFilter === st.key
                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Month-End Physical Inventory Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 text-left">SKU</th>
                    <th className="px-5 py-3.5 text-left">Merchandise Item</th>
                    <th className="px-5 py-3.5 text-left">Category</th>
                    <th className="px-5 py-3.5 text-right">Unit Price</th>
                    <th className="px-5 py-3.5 text-center">System Stock</th>
                    <th className="px-5 py-3.5 text-center bg-purple-50/50 text-purple-950 border-x border-purple-100">
                      Physical Count ({selectedSummaryMonth.split(' ')[0]})
                    </th>
                    <th className="px-5 py-3.5 text-center">Variance</th>
                    <th className="px-5 py-3.5 text-right">Stock Valuation</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(() => {
                    if (filteredSummaryItems.length === 0) {
                      return (
                        <tr>
                          <td colSpan={9} className="px-6 py-12 text-center text-slate-500 font-medium">
                            No merchandise items found matching your filters.
                          </td>
                        </tr>
                      );
                    }

                    const totalPages = Math.ceil(filteredSummaryItems.length / summaryRowsPerPage);
                    const currentPageValid = Math.min(summaryCurrentPage, totalPages || 1);
                    const startIndex = (currentPageValid - 1) * summaryRowsPerPage;
                    const paginatedItems = filteredSummaryItems.slice(startIndex, startIndex + summaryRowsPerPage);

                    return (
                      <>
                        {paginatedItems.map((item) => {
                          const isDiscrepancy = item.variance !== 0;
                          const isLowStock = item.systemStock <= 5;
                          const isOutOfStock = item.systemStock === 0;

                          return (
                            <tr
                              key={item.itemKey}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                isDiscrepancy ? 'bg-amber-50/30' : ''
                              }`}
                            >
                              {/* SKU */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className="font-mono text-xs font-extrabold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                  {item.sku}
                                </span>
                              </td>

                              {/* Merchandise Item */}
                              <td className="px-5 py-4">
                                {(() => {
                                  const display = getInventoryProductDisplayTitle(item.name, item.variantLabel);
                                  return (
                                    <div>
                                      <p className="font-bold text-slate-900 leading-snug">{display.title}</p>
                                      {display.subtitle && (
                                        <p className="text-[11px] font-bold text-purple-700 mt-0.5">
                                          {display.subtitle}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* Category */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                                  {item.category}
                                </span>
                              </td>

                              {/* Unit Price */}
                              <td className="px-5 py-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                                ₱{(Number(item.unitPrice) || 0).toFixed(2)}
                              </td>

                              {/* System Stock */}
                              <td className="px-5 py-4 text-center whitespace-nowrap">
                                <span className={`font-black text-sm ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-700' : 'text-slate-900'}`}>
                                  {item.systemStock}
                                </span>
                              </td>

                              {/* Physical Count Badge Button */}
                              <td className="px-5 py-4 text-center bg-purple-50/30 border-x border-purple-100 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPhysicalAuditModal(item.name)}
                                  className="font-extrabold text-sm text-purple-950 bg-purple-100 hover:bg-purple-200 px-3 py-1 rounded-lg border border-purple-300 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                                  title="Click to open physical audit form modal for this item"
                                >
                                  <span>{item.physicalStock}</span>
                                  <span className="text-[10px] text-purple-700 font-extrabold uppercase">Pcs</span>
                                  <Edit2 size={12} className="text-purple-600 ml-0.5" />
                                </button>
                              </td>

                              {/* Variance */}
                              <td className="px-5 py-4 text-center whitespace-nowrap">
                                {item.variance === 0 ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    0 (Match)
                                  </span>
                                ) : item.variance < 0 ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-red-100 text-red-800 border border-red-300">
                                    {item.variance} (Shortage)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">
                                    +{item.variance} (Overage)
                                  </span>
                                )}
                              </td>

                              {/* Stock Valuation */}
                              <td className="px-5 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                ₱{(Number(item.totalValue) || 0).toFixed(2)}
                              </td>

                              {/* Status */}
                              <td className="px-5 py-4 text-center whitespace-nowrap">
                                {isOutOfStock ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-red-100 text-red-800 border border-red-300">
                                    Out of Stock
                                  </span>
                                ) : isLowStock ? (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                    Low Stock
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Healthy Stock
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })()}
                </tbody>
              </table>

              {/* Table Footer with Pagination & Summary Totals */}
              {filteredSummaryItems.length > 0 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500">Rows per page:</span>
                    <select
                      value={summaryRowsPerPage}
                      onChange={(e) => {
                        setSummaryRowsPerPage(Number(e.target.value));
                        setSummaryCurrentPage(1);
                      }}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-xs"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-xs text-slate-500 font-medium">
                      Showing <span className="font-bold text-slate-800">
                        {Math.min((summaryCurrentPage - 1) * summaryRowsPerPage + 1, filteredSummaryItems.length)}
                      </span> to{' '}
                      <span className="font-bold text-slate-800">
                        {Math.min(summaryCurrentPage * summaryRowsPerPage, filteredSummaryItems.length)}
                      </span> of{' '}
                      <span className="font-bold text-slate-800">{filteredSummaryItems.length}</span> merchandise items
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSummaryCurrentPage(1)}
                      disabled={summaryCurrentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                    >
                      First
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={summaryCurrentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                    >
                      Previous
                    </button>

                    <span className="text-xs font-bold text-purple-700 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
                      Page {summaryCurrentPage} of {Math.ceil(filteredSummaryItems.length / summaryRowsPerPage) || 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSummaryCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredSummaryItems.length / summaryRowsPerPage)))}
                      disabled={summaryCurrentPage >= Math.ceil(filteredSummaryItems.length / summaryRowsPerPage)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryCurrentPage(Math.ceil(filteredSummaryItems.length / summaryRowsPerPage))}
                      disabled={summaryCurrentPage >= Math.ceil(filteredSummaryItems.length / summaryRowsPerPage)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Printable Physical Audit Sheet Modal */}
          {showPrintAuditSheetModal && createPortal(
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] overflow-y-auto flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 relative my-6">
                <button
                  type="button"
                  onClick={() => setShowPrintAuditSheetModal(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors no-print"
                >
                  <X size={20} />
                </button>

                <div className="no-print mb-6 flex justify-end gap-3 border-b pb-4">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Printer size={16} />
                    <span>Print Audit Sheet Now</span>
                  </button>
                </div>

                <div id="printable-audit-sheet" className="printable-document-card space-y-6">
                  {/* Header */}
                  <div className="text-center border-b pb-4">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                      UNIVERSITY OF CEBU-METC MULTIPURPOSE COOPERATIVE
                    </h2>
                    <p className="text-xs text-slate-600 font-bold mt-0.5">
                      Coop Store & Merchandise Operations | UCMETC Campus, Mambaling, Cebu City
                    </p>
                    <div className="mt-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200 inline-block px-6">
                      <p className="text-sm font-black text-purple-950 uppercase tracking-wider">
                        MONTH-END PHYSICAL INVENTORY COUNT & STOCK AUDIT SHEET
                      </p>
                      <p className="text-xs font-bold text-purple-800">
                        Month: {selectedSummaryMonth} &nbsp;|&nbsp; Location: Coop Main Store
                      </p>
                    </div>
                  </div>

                  {/* Audit Info Metadata */}
                  <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block font-semibold">Audit Date:</span>
                      <strong className="text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Audited By (Staff):</span>
                      <strong className="text-slate-900">Coop Inventory Staff</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Total Merchandise Items:</span>
                      <strong className="text-purple-900">{inventorySummaryItems.length} Items</strong>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-xs border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-black border-b border-slate-300 uppercase">
                        <th className="p-2 border border-slate-300 text-center w-10">#</th>
                        <th className="p-2 border border-slate-300 text-left">SKU</th>
                        <th className="p-2 border border-slate-300 text-left">Merchandise Item</th>
                        <th className="p-2 border border-slate-300 text-left">Category</th>
                        <th className="p-2 border border-slate-300 text-right">Selling Price</th>
                        <th className="p-2 border border-slate-300 text-center w-24">System Stock</th>
                        <th className="p-2 border border-slate-300 text-center w-32">Physical Count</th>
                        <th className="p-2 border border-slate-300 text-center w-24">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventorySummaryItems.map((item, idx) => (
                        <tr key={item.itemKey} className="border-b border-slate-200">
                          <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2 border border-slate-300 font-mono font-bold">{item.sku}</td>
                          <td className="p-2 border border-slate-300 font-bold text-slate-900">
                            {(() => {
                              const display = getInventoryProductDisplayTitle(item.name, item.variantLabel);
                              return display.subtitle ? `${display.title} (${display.subtitle})` : display.title;
                            })()}
                          </td>
                          <td className="p-2 border border-slate-300">{item.category}</td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-bold">₱{(Number(item.unitPrice) || 0).toFixed(2)}</td>
                          <td className="p-2 border border-slate-300 text-center font-bold text-slate-900">{item.systemStock}</td>
                          <td className="p-2 border border-slate-300 text-center font-mono font-bold text-purple-900">
                            {item.physicalStock}
                          </td>
                          <td className="p-2 border border-slate-300 text-center font-bold">
                            {item.variance === 0 ? '0' : item.variance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Signatures */}
                  <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs border-t border-slate-200">
                    <div>
                      <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">__________________________</div>
                      <span className="text-slate-500 font-semibold">Prepared By (Inventory Staff)</span>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">__________________________</div>
                      <span className="text-slate-500 font-semibold">Verified By (Auditor)</span>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">__________________________</div>
                      <span className="text-slate-500 font-semibold">Approved By (Coop Manager)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        </div>
      )}
      </div>

      {/* Selective Product Export Modal */}
      {showMonthlyExportModal && monthlyData && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowMonthlyExportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Select Products to Export</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose specific items for your monthly sales Excel report
                </p>
              </div>
              <button 
                onClick={() => setShowMonthlyExportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={monthlySearchQuery}
                    onChange={(e) => setMonthlySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allNames = Object.keys(monthlyData.productsSold);
                      setSelectedMonthlyExportProducts(allNames);
                    }}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors border border-purple-200"
                  >
                    Select All ({Object.keys(monthlyData.productsSold).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMonthlyExportProducts([])}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors border border-slate-200"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[42vh] overflow-y-auto">
                {Object.entries(monthlyData.productsSold)
                  .filter(([_, data]: [string, any]) => (data.productName || '').toLowerCase().includes(monthlySearchQuery.toLowerCase()))
                  .sort((a: any, b: any) => b[1].quantity !== a[1].quantity ? b[1].quantity - a[1].quantity : b[1].revenue - a[1].revenue)
                  .map(([itemKey, data]: [string, any]) => {
                    const isChecked = selectedMonthlyExportProducts.includes(itemKey);
                    return (
                      <label 
                        key={itemKey}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${isChecked ? 'bg-purple-50/60' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMonthlyExportProducts(prev => [...prev, itemKey]);
                              } else {
                                setSelectedMonthlyExportProducts(prev => prev.filter(name => name !== itemKey));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800 truncate">{data.productName}</span>
                              {data.paymentType === 'downpayment' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  DOWNPAYMENT
                                </span>
                              )}
                              {data.paymentType === 'balance' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  BALANCE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-shrink-0">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                            {data.paymentType === 'balance' ? 'Settlement' : `${data.quantity} units`}
                          </span>
                          <span className="text-purple-700 font-bold">₱{data.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-600">
                {selectedMonthlyExportProducts.length > 0
                  ? `${selectedMonthlyExportProducts.length} of ${Object.keys(monthlyData.productsSold).length} products selected`
                  : 'No specific products selected (will export all)'}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowMonthlyExportModal(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleExportMonthlyReport(selectedMonthlyExportProducts.length > 0 ? selectedMonthlyExportProducts : undefined);
                    setShowMonthlyExportModal(false);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Download size={15} />
                  <span>
                    {selectedMonthlyExportProducts.length > 0 
                      ? `Export Selected (${selectedMonthlyExportProducts.length})` 
                      : 'Export All Products'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Stock Intake Confirmation Modal */}
      {deleteIntakeConfirm.show && deleteIntakeConfirm.record && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="px-6 py-5 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Delete Stock Intake Record</h3>
                  <p className="text-sm text-slate-600">This will also revert the added stock</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-slate-700 mb-4">
                Delete the intake record for <span className="font-semibold text-slate-900">"{deleteIntakeConfirm.record.product_name || deleteIntakeConfirm.record.productName}"</span>?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> The stock that was added by this intake will be automatically deducted. Record another intake if the amount was wrong.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3 rounded-b-2xl">
              <button
                onClick={() => setDeleteIntakeConfirm({ show: false, record: null, isDeleting: false })}
                disabled={deleteIntakeConfirm.isDeleting}
                className="px-5 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={deleteIntakeConfirm.isDeleting}
                onClick={async () => {
                  setDeleteIntakeConfirm(prev => ({ ...prev, isDeleting: true }));
                  try {
                    const userStr = sessionStorage.getItem('user');
                    const user = userStr ? JSON.parse(userStr) : null;
                    await apiClient.deleteStockIntakeRecord(deleteIntakeConfirm.record.id, user?.id || '');
                    showNotification('Stock intake record deleted and stock reverted', 'success');
                    setDeleteIntakeConfirm({ show: false, record: null, isDeleting: false });
                    await loadStockIntakeRecords();
                    AppDataSync.loadProductsFromAPI();
                  } catch (error: any) {
                    showNotification(error?.message || 'Failed to delete record', 'error');
                    setDeleteIntakeConfirm(prev => ({ ...prev, isDeleting: false }));
                  }
                }}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all hover:scale-105 active:scale-95 flex items-center space-x-2 disabled:opacity-50"
              >
                {deleteIntakeConfirm.isDeleting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Deleting...</span></>
                ) : (
                  <><Trash2 size={18} /><span>Delete Record</span></>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Receipt Attachment Modal */}
      {selectedReceiptUrl && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={() => setSelectedReceiptUrl(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-scale-in flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Receipt Attachment</h3>
              <button onClick={() => setSelectedReceiptUrl(null)} className="text-slate-500 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-50">
              <img src={selectedReceiptUrl} alt="Receipt Attachment" className="max-w-full max-h-[60vh] object-contain rounded-lg border shadow-md" />
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
                  {(!editingProduct.options || editingProduct.options.length === 0) && !editingProduct.madeToOrder && !['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(editingProduct.name) && (
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

                  {/* Category - Editable Animated Select Dropdown */}
                  <AnimatedSelect
                    label="Category"
                    value={editingProduct.category === 'ppe' ? 'equipment' : (editingProduct.category === 'grocery' || editingProduct.category === 'essentials') ? 'essentials' : editingProduct.category}
                    options={CATEGORY_OPTIONS}
                    onChange={(val) => {
                      const newCat = val as any;
                      if (newCat !== editingProduct.category) {
                        const nextSku = generateCategoryNextSKU(newCat, products, editingProduct.id);
                        setEditingProduct({
                          ...editingProduct,
                          category: newCat,
                          sku: nextSku,
                        });
                      }
                    }}
                  />

                  {/* Stock Keeping Unit (SKU) - Editable */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Stock Keeping Unit (SKU)
                    </label>
                    <input
                      type="text"
                      value={editingProduct.sku || ''}
                      onChange={(e) => setEditingProduct({
                        ...editingProduct,
                        sku: e.target.value
                      })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm font-bold text-slate-800"
                      placeholder="e.g. UNI-008"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      SKU prefix auto-updates when category changes, or enter custom SKU code
                    </p>
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

                  {/* Product Image Editing */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Product Image
                    </label>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const resolvedImage = getInventoryProductImage(editingProduct.name, '', editingProduct.image);
                        const isImageUrl = resolvedImage && (resolvedImage.startsWith('data:') || resolvedImage.startsWith('http') || resolvedImage.includes('.'));
                        return (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden flex-shrink-0">
                            {resolvedImage && isImageUrl ? (
                              <img src={resolvedImage} alt={editingProduct.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex-1 relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              showNotification('Uploading image to Cloudinary...');
                              try {
                                const cloudinaryUrl = await uploadToCloudinary(file, 'products');
                                if (cloudinaryUrl && cloudinaryUrl.startsWith('http')) {
                                  setEditingProduct({ ...editingProduct, image: cloudinaryUrl });
                                  showNotification('Image uploaded successfully', 'success');
                                } else {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setEditingProduct({ ...editingProduct, image: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              } catch (err) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditingProduct({ ...editingProduct, image: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                          className="hidden"
                          id="edit-product-image-upload"
                        />
                        <label
                          htmlFor="edit-product-image-upload"
                          className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-purple-400 transition-colors shadow-sm"
                        >
                          Change Product Image
                        </label>
                        {editingProduct.image && (
                          <span className="text-[10px] text-slate-500 ml-2 block truncate max-w-[200px] mt-1" title={editingProduct.image.startsWith('data:') ? 'Uploaded custom image' : editingProduct.image}>
                            Selected: {editingProduct.image.startsWith('data:') ? 'Uploaded Image' : editingProduct.image}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* Pre-Order Toggle */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <label className="font-bold text-slate-800 text-sm block">Allow Pre-Order</label>
                        <span className="text-xs text-slate-500">Allow customers to pre-order this product when it is out of stock</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingProduct.allowPreorder !== false}
                          onChange={(e) => setEditingProduct({ ...editingProduct, allowPreorder: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {/* Made to Order Toggle */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <label className="font-bold text-slate-800 text-sm block">Made to Order</label>
                        <span className="text-xs text-slate-500">Mark this product as customized or made-to-order (bypasses stock check)</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingProduct.madeToOrder === true}
                          onChange={(e) => setEditingProduct({ ...editingProduct, madeToOrder: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Manage Variants & Options Section */}
                  {true && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Product Options & Variants</h4>
                          <p className="text-xs text-slate-500">Configure sizes, courses, colors, or categories</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newOption = {
                              id: `option-${Date.now()}`,
                              label: '',
                              choices: []
                            };
                            setEditingProduct({
                              ...editingProduct,
                              options: [...(editingProduct.options || []), newOption]
                            });
                          }}
                          className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1 shadow-sm hover:shadow"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Option
                        </button>
                      </div>

                      {editingProduct.options && editingProduct.options.length > 0 ? (
                        <div className="space-y-3">
                          {editingProduct.options.map((option, optionIndex) => (
                            <div key={option.id} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 shadow-xs">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs font-semibold text-slate-500 mb-1">Option Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g., Size, Course, Color"
                                    value={option.label}
                                    onChange={(e) => {
                                      const newOptions = [...(editingProduct.options || [])];
                                      newOptions[optionIndex] = {
                                        ...newOptions[optionIndex],
                                        label: e.target.value
                                      };
                                      setEditingProduct({ ...editingProduct, options: newOptions });
                                    }}
                                    className="w-full border border-slate-200 hover:border-purple-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium text-slate-800"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = editingProduct.options?.filter((_, i) => i !== optionIndex) || [];
                                    setEditingProduct({ ...editingProduct, options: newOptions });
                                    setNewChoiceInputs(prev => {
                                      const next = { ...prev };
                                      delete next[option.id];
                                      return next;
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg mt-5 transition-all duration-300"
                                  title="Remove option"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Option Choices</label>
                                
                                {/* Tags List */}
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {option.choices.map((choice, choiceIdx) => (
                                    <span 
                                      key={choiceIdx} 
                                      draggable={true}
                                      onDragStart={(e) => handleDragStart(e, optionIndex, choiceIdx)}
                                      onDragOver={(e) => handleDragOver(e)}
                                      onDragEnter={() => setDraggedOverChoice({ optionIndex, choiceIndex: choiceIdx })}
                                      onDragLeave={() => setDraggedOverChoice(null)}
                                      onDragEnd={() => setDraggedOverChoice(null)}
                                      onDrop={(e) => handleDrop(e, optionIndex, choiceIdx, true)}
                                      className={`inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs pl-2 pr-1.5 py-1 rounded-full font-medium border transition-all duration-200 group cursor-grab active:cursor-grabbing ${
                                        draggedOverChoice?.optionIndex === optionIndex && draggedOverChoice?.choiceIndex === choiceIdx
                                          ? 'border-purple-600 border-dashed border-2 bg-purple-100/70 scale-105 shadow-sm'
                                          : 'border-purple-200'
                                      }`}
                                    >
                                      <GripVertical size={11} className="text-purple-400 cursor-grab opacity-50 group-hover:opacity-100 transition-opacity" />
                                      <span className="mr-1 select-none">{choice}</span>
                                      <span className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveChoiceEdit(optionIndex, choiceIdx)}
                                          className="text-purple-400 hover:text-red-600 transition-colors active:scale-75 cursor-pointer"
                                          title="Remove choice"
                                        >
                                          <X size={12} />
                                        </button>
                                      </span>
                                    </span>
                                  ))}
                                  {option.choices.length === 0 && (
                                    <span className="text-[11px] text-slate-400 italic">No choices added yet.</span>
                                  )}
                                </div>

                                {/* Add Choice Input & Button */}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Add a choice (e.g. BSMT (₱3,000))"
                                    value={newChoiceInputs[option.id] || ''}
                                    onChange={(e) => setNewChoiceInputs(prev => ({
                                      ...prev,
                                      [option.id]: e.target.value
                                    }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddChoiceEdit(option.id, optionIndex);
                                      }
                                    }}
                                    className="flex-1 border border-slate-200 hover:border-purple-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-slate-700 font-medium"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddChoiceEdit(option.id, optionIndex)}
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 font-bold px-3 py-1.5 rounded-lg border border-purple-200 text-xs transition-all active:scale-95 whitespace-nowrap"
                                  >
                                    + Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-5 bg-slate-100/50 rounded-lg border border-dashed border-slate-300">
                          <p className="text-sm font-medium text-slate-600">No options defined</p>
                          <p className="text-xs text-slate-500 mt-0.5">Click "Add Option" to configure custom sizes, courses, or colors.</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Right Column - Variant Stock Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {editingProduct.options && editingProduct.options.length > 0 
                      ? 'Variant Stock Management' 
                      : 'Product Details'}
                  </h3>

                  {/* Check if product is made-to-order (no stock tracking needed) */}
                  {(editingProduct.madeToOrder || ['Type A & B Uniform', 'Gala', 'BSNAME Uniform'].includes(editingProduct.name)) && (!editingProduct.options || editingProduct.options.length === 0) ? (
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
                  ) : editingProduct.name === 'Hard Bound' && (!editingProduct.options || editingProduct.options.length === 0) ? (
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
                    <div className="bg-slate-50 rounded-lg p-4 max-h-[600px] overflow-y-auto border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-3">
                        Set stock, override price, and upload variant images:
                      </p>

                      {/* Generate all variant combinations in a table */}
                      <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm">
                        <table className="w-full border-collapse text-left table-fixed">
                          <thead>
                            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase bg-slate-100/80">
                              <th className="p-3 w-48">Variant Combination</th>
                              <th className="p-3 w-24 text-center">Stock</th>
                              <th className="p-3 w-28 text-center">Price (₱)</th>
                              <th className="p-3 w-80">Image Settings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // Helper function to generate all combinations
                              const generateCombinations = (options: any[]) => {
                                if (editingProduct.name === 'BSNAME Uniform') {
                                  const combinations: any[] = [];
                                  options.forEach(option => {
                                    option.choices.forEach((choice: string) => {
                                      combinations.push({
                                        [option.id]: choice
                                      });
                                    });
                                  });
                                  return combinations;
                                }

                                if (options.length === 0) return [{}];
                                if (options.length === 1) {
                                  return options[0].choices.map((choice: string) => ({
                                    [options[0].id]: choice
                                  }));
                                }
                                
                                const [first, ...rest] = options;
                                const restCombinations = generateCombinations(rest);
                                const combinations: any[] = [];
                                
                                first.choices.forEach((choice: string) => {
                                  restCombinations.forEach((restCombo: any) => {
                                    combinations.push({
                                      [first.id]: choice,
                                      ...restCombo
                                    });
                                  });
                                });
                                
                                return combinations;
                              };

                              const combinations = generateCombinations(editingProduct.options || []);
                              return combinations.map((combo: Record<string, string>, idx: number) => {
                                const variantKey = Object.entries(combo)
                                  .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                                  .map(([key, val]) => `${key}:${val}`)
                                  .join('|');
                                
                                const isBaseImage = !variantImages[variantKey];

                                return (
                                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs">
                                    <td className="p-3 font-medium text-slate-700">
                                      <div className="flex flex-wrap gap-1">
                                        {Object.entries(combo).map(([key, value], i) => {
                                          const option = editingProduct.options?.find(opt => opt.id === key);
                                          const label = option ? `${option.label}: ${value}` : value;
                                          return (
                                            <span key={i} className="inline-block bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded font-semibold border border-purple-100">
                                              {label}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </td>
                                    <td className="p-2 text-center">
                                      <input
                                        type="number"
                                        value={variantStocks[variantKey] || 0}
                                        onChange={(e) => {
                                          const newStock = parseInt(e.target.value) || 0;
                                          setVariantStocks(prev => ({
                                            ...prev,
                                            [variantKey]: newStock
                                          }));
                                        }}
                                        className="w-16 px-1.5 py-1 text-center border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                                        min="0"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        placeholder={editingProduct.price?.toString()}
                                        value={variantPrices[variantKey] || ''}
                                        onChange={(e) => {
                                          const newPrice = parseFloat(e.target.value) || 0;
                                          setVariantPrices(prev => ({
                                            ...prev,
                                            [variantKey]: newPrice
                                          }));
                                        }}
                                        className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                                        min="0"
                                        step="0.01"
                                      />
                                    </td>
                                         <td className="p-2">
                                       <div className="flex items-center gap-2">
                                         {(() => {
                                           const activeImage = isBaseImage ? editingProduct.image : variantImages[variantKey];
                                           const resolvedImage = getInventoryProductImage(editingProduct.name, variantKey, activeImage);
                                           const isImageUrl = resolvedImage && (resolvedImage.startsWith('data:') || resolvedImage.startsWith('http') || resolvedImage.includes('.'));
                                           return (
                                             <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0 shadow-sm" title={isBaseImage ? "Using main product image" : "Custom variant image"}>
                                               {resolvedImage ? (
                                                 isImageUrl ? (
                                                   <img src={resolvedImage} alt="Variant" className="w-full h-full object-cover" />
                                                 ) : (
                                                   <span className="text-base">{resolvedImage}</span>
                                                 )
                                               ) : (
                                                 <Package className="w-4 h-4 text-slate-400" />
                                               )}
                                             </div>
                                           );
                                         })()}
                                         {(() => {
                                           const productName = editingProduct.name || '';
                                           const presets = getPresetOptions(productName);
                                           const activeImage = variantImages[variantKey] || '';

                                           if (presets.length > 0) {
                                             const currentVal = (() => {
                                               if (activeImage && (activeImage.startsWith('data:') || activeImage === 'custom-image.png')) {
                                                 return 'custom';
                                               }
                                               const matchedPreset = presets.find(p => p.value === activeImage);
                                               if (matchedPreset) return matchedPreset.value;

                                               if (!activeImage) {
                                                 const resolvedImage = getInventoryProductImage(productName, variantKey, '');
                                                 const matchedResolved = presets.find(p => p.value === resolvedImage);
                                                 if (matchedResolved) return matchedResolved.value;
                                               }
                                               return presets[0].value;
                                             })();
                                             const showUpload = currentVal === 'custom';

                                             return (
                                               <>
                                                 <select
                                                   value={currentVal}
                                                   onChange={(e) => {
                                                     const selectVal = e.target.value;
                                                     if (selectVal === 'custom') {
                                                       setVariantImages(prev => ({ ...prev, [variantKey]: 'custom-image.png' }));
                                                     } else {
                                                       setVariantImages(prev => ({ ...prev, [variantKey]: selectVal }));
                                                     }
                                                   }}
                                                   className="border border-slate-300 rounded px-1.5 py-1 bg-white focus:outline-none text-[11px] text-slate-700"
                                                 >
                                                   {presets.map((preset, pIdx) => (
                                                     <option key={pIdx} value={preset.value}>{preset.label}</option>
                                                   ))}
                                                   <option value="custom">Custom Image</option>
                                                 </select>
                                                 {showUpload && (
                                                   <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                     <input
                                                       type="file"
                                                       accept="image/*"
                                                       id={`edit-variant-upload-${idx}`}
                                                       className="hidden"
                                                       onChange={async (e) => {
                                                         const file = e.target.files?.[0];
                                                         if (file) {
                                                           showNotification('Uploading image to Cloudinary...');
                                                           try {
                                                             const cloudinaryUrl = await uploadToCloudinary(file, 'products');
                                                             if (cloudinaryUrl && cloudinaryUrl.startsWith('http')) {
                                                               setVariantImages(prev => ({ ...prev, [variantKey]: cloudinaryUrl }));
                                                               showNotification('Image uploaded successfully', 'success');
                                                             } else {
                                                               const reader = new FileReader();
                                                               reader.onloadend = () => {
                                                                 setVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                               };
                                                               reader.readAsDataURL(file);
                                                             }
                                                           } catch (err) {
                                                             const reader = new FileReader();
                                                             reader.onloadend = () => {
                                                               setVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                             };
                                                             reader.readAsDataURL(file);
                                                           }
                                                         }
                                                       }}
                                                     />
                                                     <label
                                                       htmlFor={`edit-variant-upload-${idx}`}
                                                       className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700 text-[10px] whitespace-nowrap active:scale-95 transition-all"
                                                     >
                                                       Upload
                                                     </label>
                                                     <span className="text-[10px] text-slate-500 truncate max-w-[80px]" title={activeImage.startsWith('data:') ? 'Custom uploaded image' : activeImage}>
                                                       {activeImage.startsWith('data:') ? 'Uploaded' : activeImage}
                                                     </span>
                                                   </div>
                                                 )}
                                               </>
                                             );
                                           } else {
                                             const isBaseImage = !activeImage;
                                             return (
                                               <>
                                                 <select
                                                   value={isBaseImage ? 'base' : 'custom'}
                                                   onChange={(e) => {
                                                     const selectVal = e.target.value;
                                                     if (selectVal === 'base') {
                                                       setVariantImages(prev => ({ ...prev, [variantKey]: '' }));
                                                     } else {
                                                       setVariantImages(prev => ({ ...prev, [variantKey]: 'custom-image.png' }));
                                                     }
                                                   }}
                                                   className="border border-slate-300 rounded px-1.5 py-1 bg-white focus:outline-none text-[11px] text-slate-700"
                                                 >
                                                   <option value="base">Same as Product</option>
                                                   <option value="custom">Custom Image</option>
                                                 </select>
                                                 {!isBaseImage && (
                                                   <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                     <input
                                                       type="file"
                                                       accept="image/*"
                                                       id={`edit-variant-upload-${idx}`}
                                                       className="hidden"
                                                       onChange={async (e) => {
                                                         const file = e.target.files?.[0];
                                                         if (file) {
                                                           showNotification('Uploading image to Cloudinary...');
                                                           try {
                                                             const cloudinaryUrl = await uploadToCloudinary(file, 'products');
                                                             if (cloudinaryUrl && cloudinaryUrl.startsWith('http')) {
                                                               setVariantImages(prev => ({ ...prev, [variantKey]: cloudinaryUrl }));
                                                               showNotification('Image uploaded successfully', 'success');
                                                             } else {
                                                               const reader = new FileReader();
                                                               reader.onloadend = () => {
                                                                 setVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                               };
                                                               reader.readAsDataURL(file);
                                                             }
                                                           } catch (err) {
                                                             const reader = new FileReader();
                                                             reader.onloadend = () => {
                                                               setVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                             };
                                                             reader.readAsDataURL(file);
                                                           }
                                                         }
                                                       }}
                                                     />
                                                     <label
                                                       htmlFor={`edit-variant-upload-${idx}`}
                                                       className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 py-1 font-semibold text-slate-700 text-[10px] whitespace-nowrap active:scale-95 transition-all"
                                                     >
                                                       Upload
                                                     </label>
                                                     <span className="text-[10px] text-slate-500 truncate max-w-[80px]" title={activeImage.startsWith('data:') ? 'Custom uploaded image' : activeImage}>
                                                       {activeImage.startsWith('data:') ? 'Uploaded' : activeImage}
                                                     </span>
                                                   </div>
                                                 )}
                                               </>
                                             );
                                           }
                                         })()}
                                       </div>
                                     </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">
                          <strong>Note:</strong> Overridden prices will apply only to the selected variant options. Custom variant images will be displayed during option selection in the shop.
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

            <div className="px-8 py-6 border-t border-slate-200 bg-slate-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                    setNewChoiceInputs({});
                    setVariantStocks({});
                    setVariantPrices({});
                    setVariantImages({});
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
      {selectedProductSoldDetails && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => {
            setSelectedProductSoldDetails(null);
            setProductSoldSearchQuery('');
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedProductSoldDetails.productName}
                  </h3>
                  {selectedProductSoldDetails.paymentType === 'downpayment' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                      DOWNPAYMENT DEPOSITS
                    </span>
                  )}
                  {selectedProductSoldDetails.paymentType === 'balance' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                      BALANCE SETTLEMENTS
                    </span>
                  )}
                  {selectedProductSoldDetails.paymentType === 'full' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      FULL PAYMENTS
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Transactions in {selectedMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} • Total: <span className="font-semibold text-purple-600">{selectedProductSoldDetails.paymentType === 'balance' ? 'Balance Settlement Transactions' : `${selectedProductSoldDetails.quantity} units`}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedProductSoldDetails(null);
                  setProductSoldSearchQuery('');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Search Bar inside Modal */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="relative w-80">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Search by customer name..."
                  value={productSoldSearchQuery}
                  onChange={(e) => setProductSoldSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm placeholder-slate-400"
                />
                {productSoldSearchQuery && (
                  <button
                    onClick={() => setProductSoldSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body / Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const purchases = getProductSoldOrders(selectedProductSoldDetails.productName, selectedProductSoldDetails.paymentType);
                const filteredPurchases = purchases.filter(p => 
                  productSoldSearchQuery === '' || 
                  p.name.toLowerCase().includes(productSoldSearchQuery.toLowerCase())
                );

                if (filteredPurchases.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">
                        {productSoldSearchQuery 
                          ? `No purchases found matching "${productSoldSearchQuery}"` 
                          : 'No purchase records found for this product category.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left py-3 px-6 font-semibold text-slate-900">Date</th>
                          <th className="text-left py-3 px-6 font-semibold text-slate-900">Receipt No.</th>
                          <th className="text-left py-3 px-6 font-semibold text-slate-900">Name</th>
                          <th className="text-left py-3 px-6 font-semibold text-slate-900">Course & Year</th>
                          <th className="text-center py-3 px-6 font-semibold text-slate-900">Payment Stage</th>
                          <th className="text-center py-3 px-6 font-semibold text-slate-900">Quantity</th>
                          <th className="text-right py-3 px-6 font-semibold text-slate-900">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredPurchases.map((purchase, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                              {new Date(purchase.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }) || 'N/A'}
                            </td>
                            <td className="py-4 px-6 font-mono text-slate-500 text-xs">
                              {purchase.receipt_no}
                            </td>
                            <td className="py-4 px-6 font-semibold text-slate-900">
                              {purchase.name}
                            </td>
                            <td className="py-4 px-6 text-slate-700">
                              {purchase.courseYear}
                            </td>
                            <td className="py-4 px-6 text-center whitespace-nowrap">
                              {purchase.paymentType === 'downpayment' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  DOWNPAYMENT
                                </span>
                              ) : purchase.paymentType === 'balance' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  BALANCE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  FULL
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center font-medium text-slate-800">
                              {purchase.paymentType === 'balance' ? '-' : purchase.quantity}
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-green-700 whitespace-nowrap">
                              ₱{purchase.subtotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => {
                  setSelectedProductSoldDetails(null);
                  setProductSoldSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Purchase Invoice Modal - Structured Document Layout */}
      {viewInvoiceModal.show && viewInvoiceModal.record && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setViewInvoiceModal({ show: false, record: null })}>
          <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden animate-scale-in flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* Top Toolbar Action Bar */}
            <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 no-print">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base">Purchase Invoice</span>
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 font-mono font-bold text-xs rounded-full border border-purple-200">
                  {viewInvoiceModal.record.referenceNo || viewInvoiceModal.record.reference_no || `V${viewInvoiceModal.record.id || '100'}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const record = viewInvoiceModal.record;
                    setViewInvoiceModal({ show: false, record: null });
                    setEditingInvoiceId(record.id ? String(record.id) : 'editing');
                    setStockIntakeFormData({
                      productId: record.product_id || record.productId || '',
                      productName: record.product_name || record.productName || '',
                      quantity: Number(record.quantity || 0),
                      costPerUnit: Number(record.cost_per_unit || record.costPerUnit || 0),
                      sellingPrice: Number(record.selling_price || record.sellingPrice || 0),
                      supplier: record.supplier || '',
                      notes: record.notes || record.description || '',
                      dateReceived: record.date_received || record.dateReceived || new Date().toISOString().split('T')[0],
                      dueDateTerms: record.dueDateTerms || record.due_date_terms || 'Net',
                      dueDateDays: record.dueDateDays !== undefined && record.dueDateDays !== null ? String(record.dueDateDays) : (record.due_date_days !== undefined && record.due_date_days !== null ? String(record.due_date_days) : ''),
                      selectedVariant: record.selected_variant || record.selectedVariant || {},
                      attachment: record.attachment || '',
                      referenceNo: record.referenceNo || record.reference_no || '',
                      balanceDue: Number(record.balanceDue || record.balance_due || 0),
                      status: record.status || 'Paid in full',
                      items: record.items && record.items.length > 0
                        ? record.items.map((it: any) => ({ ...it, unit: it.unit || record.unit || 'Units' }))
                        : [
                        {
                          id: '1',
                          productId: record.product_id || record.productId || '',
                          productName: record.product_name || record.productName || '',
                          quantity: Number(record.quantity || 1),
                          unit: record.unit || 'Units',
                          costPerUnit: Number(record.cost_per_unit || record.costPerUnit || 0),
                          sellingPrice: Number(record.selling_price || record.sellingPrice || 0),
                          selectedVariant: record.selected_variant || record.selectedVariant || {},
                          account: 'Inventory on hand',
                        },
                      ],
                    });
                    setShowStockIntakeForm(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const refNo = viewInvoiceModal.record?.referenceNo || viewInvoiceModal.record?.reference_no || 'V100';
                    handleDownloadPdf('printable-invoice-card', `Purchase_Invoice_${refNo}`);
                  }}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download size={13} />
                  <span>PDF</span>
                </button>
                <div className="h-5 w-px bg-slate-200 mx-1"></div>
                <button
                  type="button"
                  onClick={() => setViewInvoiceModal({ show: false, record: null })}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Paper Card Style) */}
            <div className="p-6 overflow-y-auto space-y-6">
              {(() => {
                if (!viewInvoiceModal.record) return null;
                const rec = stockIntakeRecords.find(r => 
                  String(r.id) === String(viewInvoiceModal.record?.id) ||
                  (r.reference_no && String(r.reference_no) === String(viewInvoiceModal.record?.referenceNo || viewInvoiceModal.record?.reference_no)) ||
                  (r.referenceNo && String(r.referenceNo) === String(viewInvoiceModal.record?.referenceNo || viewInvoiceModal.record?.reference_no))
                ) || viewInvoiceModal.record;

                if (!rec) return null;
                const issueDateStr = rec.date_received || rec.dateReceived || rec.created_at;
                const formattedIssueDate = issueDateStr ? new Date(issueDateStr).toISOString().split('T')[0] : '-';
                
                const termsDays = parseInt(String(rec.due_date_days || rec.dueDateDays || '30'), 10) || 30;
                let formattedDueDate = '-';
                if (issueDateStr) {
                  const d = new Date(issueDateStr);
                  d.setDate(d.getDate() + termsDays);
                  formattedDueDate = d.toISOString().split('T')[0];
                }

                const refNo = rec.referenceNo || rec.reference_no || 'V100';
                const supplierName = rec.supplier || 'Supplier';
                const notes = rec.notes || rec.description || '';

                const itemsList = (rec.items && rec.items.length > 0 ? rec.items : [
                  {
                    id: '1',
                    productId: rec.product_id || rec.productId || '',
                    productName: rec.product_name || rec.productName || 'Inventory Item',
                    quantity: Number(rec.quantity || 1),
                    unit: rec.unit || 'Units',
                    costPerUnit: Number(rec.cost_per_unit || rec.costPerUnit || 0),
                    selectedVariant: rec.selected_variant || rec.selectedVariant || {},
                    account: 'Inventory on hand',
                  }
                ]).map((it: any) => ({
                  ...it,
                  unit: it.unit || rec.unit || 'Units'
                }));

                const grandTotal = Number(rec.total_cost || rec.totalCost || itemsList.reduce((sum: number, it: any) => sum + (Number(it.quantity || 0) * Number(it.costPerUnit || 0)), 0));

                return (
                  <div id="printable-invoice-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 printable-document-card">
                    {/* Document Header */}
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b border-slate-200">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Purchase Invoice</h2>
                        <div className="mt-3">
                          <p className="font-bold text-slate-900 text-sm">{supplierName}</p>
                          <p className="text-xs text-slate-500">Coop Vendor Supplier</p>
                        </div>
                      </div>

                      {/* Middle Meta Grid & Business Name */}
                      <div className="flex flex-col sm:flex-row items-start gap-8">
                        <div className="border-l-2 border-slate-200 pl-4 space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400 font-semibold block">Invoice date</span>
                            <span className="font-bold text-slate-900">{formattedIssueDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">Due date</span>
                            <span className="font-bold text-slate-900">{formattedDueDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block">Invoice number</span>
                            <span className="font-bold text-purple-700 font-mono">{refNo}</span>
                          </div>
                        </div>

                        <div className="text-right sm:text-right">
                          <p className="font-extrabold text-slate-900 text-sm tracking-wide">UC METC ECC MPC</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Purchasing & Inventory Portal</p>
                        </div>
                      </div>
                    </div>

                    {/* Description Sub-header */}
                    {notes && (
                      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                          {notes}
                        </p>
                      </div>
                    )}

                    {/* Items Table */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-300">
                          <tr>
                            <th className="px-4 py-2.5 font-bold text-slate-800 border-r border-slate-300">Item</th>
                            <th className="px-4 py-2.5 font-bold text-slate-800 border-r border-slate-300">Account</th>
                            <th className="px-3 py-2.5 font-bold text-slate-800 text-center border-r border-slate-300">Qty / Unit</th>
                            <th className="px-4 py-2.5 font-bold text-slate-800 text-right border-r border-slate-300">Unit price</th>
                            <th className="px-4 py-2.5 font-bold text-slate-800 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {itemsList.map((item: any, idx: number) => {
                            const qty = Number(item.quantity || 1);
                            const unit = item.unit || rec.unit || 'Units';
                            const price = Number(item.costPerUnit || item.cost_per_unit || 0);
                            const lineTotal = qty * price;
                            let variantStr = '';
                            if (item.selectedVariant && Object.keys(item.selectedVariant).length > 0) {
                              variantStr = Object.entries(item.selectedVariant)
                                .map(([, val]) => String(val).replace(/\s*\(₱\d+\)/, ''))
                                .join(', ');
                            }

                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 border-r border-slate-200">
                                  <p className="font-bold text-slate-900">{item.productName || rec.product_name || 'Inventory Item'}</p>
                                  {variantStr && <p className="text-[11px] text-purple-600 font-medium">{variantStr}</p>}
                                </td>
                                <td className="px-4 py-3 text-slate-600 border-r border-slate-200">
                                  {item.account || 'Inventory on hand'}
                                </td>
                                <td className="px-3 py-3 text-center font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                                  {qty} {unit}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-700 border-r border-slate-200 font-mono">
                                  {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-right font-extrabold text-slate-900 font-mono">
                                  {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="flex justify-end pt-2">
                      <div className="w-full sm:w-64 space-y-1 text-right">
                        <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t-2 border-slate-300">
                          <span>Total</span>
                          <span className="text-lg font-black text-purple-900 font-mono">
                            ₱{grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Receipt Image Preview if attached */}
                    {rec.attachment && (
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-600 uppercase mb-2">Attached Receipt Image</p>
                        <div className="relative group border border-slate-200 rounded-lg overflow-hidden max-w-sm bg-slate-50 p-2">
                          <img
                            src={rec.attachment}
                            alt="Receipt"
                            className="max-h-48 mx-auto object-contain rounded cursor-pointer"
                            onClick={() => setSelectedReceiptUrl(rec.attachment)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Bottom Row 1: Attachment Action Bar */}
            <div className="px-6 py-2.5 bg-slate-200/80 border-t border-slate-300 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Paperclip size={16} className="text-slate-600" />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        showNotification('Uploading invoice attachment...');
                        try {
                          const cloudinaryUrl = await uploadToCloudinary(file, 'receipts');
                          const finalUrl = cloudinaryUrl || (await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(file);
                          }));
                          setViewInvoiceModal(prev => ({
                            ...prev,
                            record: { ...prev.record, attachment: finalUrl }
                          }));
                          showNotification('Attachment added to invoice!', 'success');
                        } catch (err) {
                          console.error(err);
                          showNotification('Failed to upload attachment', 'error');
                        }
                      }
                    }}
                  />
                  <span className="px-3 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-md shadow-2xs transition-colors inline-block">
                    New Attachment ...
                  </span>
                </label>
              </div>
            </div>

            {/* Bottom Row 2: Secondary Actions Footer (No History) */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-300 flex items-center justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => setShowJournalModal(true)}
                className="px-3.5 py-1.5 text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <FileText size={13} className="text-purple-600" />
                <span>Transaction Journal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const rec = viewInvoiceModal.record;
                  const refNo = rec.referenceNo || rec.reference_no || 'V100';
                  const supplier = rec.supplier || 'Vendor Supplier';
                  const issueDate = rec.date_received || rec.dateReceived || '-';
                  const total = Number(rec.total_cost || rec.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
                  const text = `Purchase Invoice #${refNo}\nSupplier: ${supplier}\nDate: ${issueDate}\nTotal Amount: ₱${total}`;
                  navigator.clipboard.writeText(text);
                  showNotification('Copied invoice details to clipboard!', 'success');
                }}
                className="px-3.5 py-1.5 text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Copy size={13} className="text-purple-600" />
                <span>Copy to clipboard</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Transaction Journal Modal - Large Document Card Style */}
      {showJournalModal && viewInvoiceModal.record && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={() => setShowJournalModal(false)}>
          <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden animate-scale-in flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* Top Toolbar Action Bar */}
            <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0 no-print">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base">Transaction Journal</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const refNo = viewInvoiceModal.record?.referenceNo || viewInvoiceModal.record?.reference_no || 'V100';
                    handleDownloadPdf('printable-journal-card', `Transaction_Journal_${refNo}`);
                  }}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download size={13} />
                  <span>PDF</span>
                </button>
                <div className="h-5 w-px bg-slate-200 mx-1"></div>
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Document Body Card */}
            <div className="p-6 overflow-y-auto space-y-6">
              {(() => {
                if (!viewInvoiceModal.record) return null;
                const rec = stockIntakeRecords.find(r => 
                  String(r.id) === String(viewInvoiceModal.record?.id) ||
                  (r.reference_no && String(r.reference_no) === String(viewInvoiceModal.record?.referenceNo || viewInvoiceModal.record?.reference_no)) ||
                  (r.referenceNo && String(r.referenceNo) === String(viewInvoiceModal.record?.referenceNo || viewInvoiceModal.record?.reference_no))
                ) || viewInvoiceModal.record;

                if (!rec) return null;
                const issueDateStr = rec.date_received || rec.dateReceived || rec.created_at;
                const formattedIssueDate = issueDateStr ? new Date(issueDateStr).toISOString().split('T')[0] : '-';
                const supplierName = rec.supplier || 'Vendor Supplier';

                const itemsList = rec.items && rec.items.length > 0 ? rec.items : [
                  {
                    id: '1',
                    productId: rec.product_id || rec.productId || '',
                    productName: rec.product_name || rec.productName || 'Inventory Item',
                    quantity: Number(rec.quantity || 1),
                    costPerUnit: Number(rec.cost_per_unit || rec.costPerUnit || 0),
                  }
                ];

                const grandTotal = Number(rec.total_cost || rec.totalCost || itemsList.reduce((sum: number, it: any) => sum + (Number(it.quantity || 0) * Number(it.costPerUnit || 0)), 0));

                return (
                  <div id="printable-journal-card" className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-8 printable-document-card">
                    {/* Header Banner */}
                    <div className="text-center space-y-1">
                      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">UC METC ECC MPC</p>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Transaction Journal</h2>
                      <p className="text-sm font-semibold text-slate-600 mt-1">
                        Purchase Invoice — {formattedIssueDate}
                      </p>
                    </div>

                    {/* Journal Table Grid */}
                    <div className="pt-2">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b-2 border-slate-900 text-slate-800 font-extrabold">
                            <th className="py-2.5 text-left">Account Breakdown</th>
                            <th className="py-2.5 text-right w-36 pr-4">Debit</th>
                            <th className="py-2.5 text-right w-36 pr-2">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Date Group Heading */}
                          <tr>
                            <td colSpan={3} className="pt-4 pb-2 font-extrabold text-slate-900 text-xs">
                              {formattedIssueDate}
                            </td>
                          </tr>

                          {/* Debit Line Item Rows */}
                          {itemsList.map((item: any, idx: number) => {
                            const lineTotal = Number(item.quantity || 1) * Number(item.costPerUnit || item.cost_per_unit || 0);
                            return (
                              <tr key={idx} className="text-slate-800">
                                <td className="py-1.5 pl-4 font-medium">
                                  Inventory on hand — {item.productName || rec.product_name || 'Inventory Item'}
                                </td>
                                <td className="py-1.5 text-right font-mono font-bold text-slate-900 pr-4">
                                  {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-1.5 text-right font-mono text-slate-300 pr-2">
                                  -
                                </td>
                              </tr>
                            );
                          })}

                          {/* Credit Line Row */}
                          <tr className="text-slate-800">
                            <td className="py-1.5 pl-8 font-medium">
                              Accounts payable — {supplierName} — {formattedIssueDate}
                            </td>
                            <td className="py-1.5 text-right font-mono text-slate-300 pr-4">
                              -
                            </td>
                            <td className="py-1.5 text-right font-mono font-bold text-slate-900 pr-2">
                              {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-b-4 border-slate-900 font-mono font-black text-xs sm:text-sm">
                            <td className="py-3 font-sans font-bold text-slate-900">Total</td>
                            <td className="py-3 text-right pr-4 text-slate-900">
                              {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 text-right pr-2 text-slate-900">
                              {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Month-End Physical Stock Audit Form Modal */}
      {showPhysicalAuditModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-fade-in">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-purple-600/30 text-purple-300 rounded-2xl border border-purple-500/30">
                  <ShieldCheck size={26} />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                    Month-End Physical Stock Count Audit Form
                    <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                      {selectedSummaryMonth}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Fill up staff physical counts for each merchandise item and variant. Click Submit when completed.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFillFromSystemStock}
                  className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Pre-fill physical count inputs with current system stock"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Copy System Stock to All</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPhysicalAuditModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
              <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs w-full sm:w-auto">
                {summaryCategoryOptions.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setAuditModalCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      auditModalCategory === cat.key
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item, SKU, category..."
                  value={auditModalSearch}
                  onChange={(e) => setAuditModalSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                />
                {auditModalSearch && (
                  <button
                    type="button"
                    onClick={() => setAuditModalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Audit Form List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
              {(() => {
                const modalItems = products.flatMap((p) => {
                  if (isMadeToOrderProduct(p)) return [];
                  const category = p.category || 'General';
                  const image = p.image || '';
                  const parsedProductPrice = parseFloat(p.price) || 0;
                  const sysStockMain = typeof p.stock === 'number' ? p.stock : (parseInt(p.stock, 10) || 0);
                  const vList = getProductVariantsList(p);

                  if (vList.length > 0) {
                    return vList.map((v, idx) => {
                      const itemKey = `${p.id}_v_${idx}`;
                      const physStock = itemKey in tempPhysicalCounts ? (Number(tempPhysicalCounts[itemKey]) || 0) : v.stock;

                      return {
                        itemKey,
                        productId: p.id,
                        name: p.name,
                        sku: v.sku,
                        category,
                        variantLabel: v.variantStr,
                        unitPrice: v.price,
                        systemStock: v.stock,
                        physicalStock: physStock,
                        variance: physStock - v.stock,
                        image,
                      };
                    });
                  } else {
                    const itemKey = p.id;
                    const sysStock = sysStockMain;
                    const physStock = itemKey in tempPhysicalCounts ? (Number(tempPhysicalCounts[itemKey]) || 0) : sysStock;

                    return [{
                      itemKey,
                      productId: p.id,
                      name: p.name,
                      sku: p.sku || 'SKU-00',
                      category,
                      variantLabel: '',
                      unitPrice: parsedProductPrice,
                      systemStock: sysStock,
                      physicalStock: physStock,
                      variance: physStock - sysStock,
                      image,
                    }];
                  }
                });

                const filteredItems = modalItems.filter((item) => {
                  const query = auditModalSearch.toLowerCase().trim();
                  const matchesSearch =
                    !query ||
                    item.name.toLowerCase().includes(query) ||
                    item.sku.toLowerCase().includes(query) ||
                    item.category.toLowerCase().includes(query) ||
                    item.variantLabel.toLowerCase().includes(query);

                  const matchesCategory = matchesSummaryCategory(item.category, auditModalCategory);

                  return matchesSearch && matchesCategory;
                });

                if (filteredItems.length === 0) {
                  return (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                      <p className="text-slate-500 font-semibold text-sm">No merchandise items match your search filter.</p>
                    </div>
                  );
                }

                const totalPhysUnits = filteredItems.reduce((acc, i) => acc + i.physicalStock, 0);
                const totalValuation = filteredItems.reduce((acc, i) => acc + (i.physicalStock * i.unitPrice), 0);
                const discrepancyCount = filteredItems.filter(i => i.variance !== 0).length;

                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="px-4 py-3.5 text-left">Merchandise Item</th>
                            <th className="px-4 py-3.5 text-left">Category</th>
                            <th className="px-4 py-3.5 text-right">Unit Price</th>
                            <th className="px-4 py-3.5 text-center">System Stock</th>
                            <th className="px-4 py-3.5 text-center bg-purple-100/60 text-purple-950 border-x border-purple-200">
                              Staff Physical Count
                            </th>
                            <th className="px-4 py-3.5 text-center">Stock Variance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredItems.map((item) => {
                            const isDiscrepancy = item.variance !== 0;

                            return (
                              <tr key={item.itemKey} className={`hover:bg-purple-50/20 transition-colors ${isDiscrepancy ? 'bg-amber-50/20' : ''}`}>
                                {/* Merchandise Item */}
                                <td className="px-4 py-3.5">
                                  {(() => {
                                    const display = getInventoryProductDisplayTitle(item.name, item.variantLabel);
                                    return (
                                      <div>
                                        <p className="font-bold text-slate-900 leading-snug">{display.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                                            {item.sku}
                                          </span>
                                          {display.subtitle && (
                                            <span className="text-[11px] font-bold text-purple-700">
                                              {display.subtitle}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </td>

                                {/* Category */}
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                                    {item.category}
                                  </span>
                                </td>

                                {/* Unit Price */}
                                <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                                  ₱{item.unitPrice.toFixed(2)}
                                </td>

                                {/* System Stock */}
                                <td className="px-4 py-3.5 text-center font-black text-slate-700 whitespace-nowrap">
                                  {item.systemStock} Pcs
                                </td>

                                {/* Physical Count Input Stepper */}
                                <td className="px-4 py-2.5 text-center bg-purple-50/40 border-x border-purple-100 whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleTempPhysicalCountChange(item.itemKey, (item.physicalStock - 1).toString())}
                                      className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center text-slate-700 font-extrabold text-sm cursor-pointer shadow-2xs active:scale-95 transition-all"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.physicalStock}
                                      onChange={(e) => handleTempPhysicalCountChange(item.itemKey, e.target.value)}
                                      className="w-16 py-1 text-center font-black text-slate-900 bg-white border-2 border-purple-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleTempPhysicalCountChange(item.itemKey, (item.physicalStock + 1).toString())}
                                      className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center text-slate-700 font-extrabold text-sm cursor-pointer shadow-2xs active:scale-95 transition-all"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* Live Variance */}
                                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                  {item.variance === 0 ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      0 (Match)
                                    </span>
                                  ) : item.variance < 0 ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-red-100 text-red-800 border border-red-300">
                                      {item.variance} (Shortage)
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">
                                      +{item.variance} (Overage)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Modal Internal Footer Summary */}
                    <div className="bg-slate-50 border-t border-slate-200 p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-4">
                        <span>Items Listed: <strong className="text-slate-900">{filteredItems.length}</strong></span>
                        <span>Physical Units: <strong className="text-purple-700">{totalPhysUnits.toLocaleString()} Pcs</strong></span>
                        <span>Valuation: <strong className="text-emerald-700 font-mono">₱{totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                      </div>
                      {discrepancyCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {discrepancyCount} Discrepancies
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-white border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0 shadow-lg">
              <div className="text-xs text-slate-500 font-medium">
                Note: Submitting will establish the physical count for <span className="font-bold text-slate-900">{selectedSummaryMonth}</span>.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowPhysicalAuditModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePhysicalAuditModal}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Save size={16} />
                  <span>Submit & Save Month-End Audit</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Receive Incoming Stock Modal Form Portal */}
      {showReceiveStockModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] transition-all">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-snug">Receive Incoming Stock</h3>
                  <p className="text-xs text-slate-400 font-medium">Log stock arrivals to update Inventory catalog levels</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiveStockModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
              {/* Product Selection */}
              <div>
                <AnimatedSelect
                  label="Select Merchandise Product *"
                  value={receiveStockFormData.productId}
                  placeholder="-- Choose Product --"
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.sku ? `[${p.sku}] ` : ''}${p.name} (${p.category || 'General'})`,
                  }))}
                  onChange={(selectedId) => {
                    const p = products.find(prod => prod.id === selectedId);
                    setReceiveStockFormData(prev => ({
                      ...prev,
                      productId: selectedId,
                      selectedVariantIndex: '',
                      unitCost: p ? (parseFloat(p.price) || 0) : 0,
                    }));
                  }}
                />
              </div>

              {/* Variant Selection if Product Has Variants */}
              <ReceiveStockVariantField
                productId={receiveStockFormData.productId}
                selectedVariantIndex={receiveStockFormData.selectedVariantIndex}
                products={products}
                onVariantChange={(vIdx, unitPrice) => {
                  setReceiveStockFormData((prev) => ({
                    ...prev,
                    selectedVariantIndex: vIdx,
                    unitCost: unitPrice,
                  }));
                }}
              />

              {/* Quantity Received & Unit Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Quantity Received <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={receiveStockFormData.quantity}
                    onChange={(e) => setReceiveStockFormData(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Unit Cost (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={receiveStockFormData.unitCost}
                    onChange={(e) => setReceiveStockFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Supplier, DR Ref & Date Received */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    DR / PO Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DR-2026-8801"
                    value={receiveStockFormData.referenceNo}
                    onChange={(e) => setReceiveStockFormData(prev => ({ ...prev, referenceNo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Date Received
                  </label>
                  <input
                    type="date"
                    value={receiveStockFormData.dateReceived}
                    onChange={(e) => setReceiveStockFormData(prev => ({ ...prev, dateReceived: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Accents & Badges Inc."
                    value={receiveStockFormData.supplier}
                    onChange={(e) => setReceiveStockFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Delivery Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional delivery details or condition..."
                  value={receiveStockFormData.notes}
                  onChange={(e) => setReceiveStockFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowReceiveStockModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStockReceiving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <CheckCircle2 size={16} />
                <span>Confirm & Update Inventory Stock</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Stock Receiving Confirm Modal Portal */}
      {deleteReceivingConfirmModal.show && deleteReceivingConfirmModal.record && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" onClick={() => setDeleteReceivingConfirmModal({ show: false, record: null })}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 p-6 animate-scale-in space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">Confirm Stock Reversion</h3>
                <p className="text-xs text-slate-500 font-medium">Remove receiving record & update inventory</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-200/80 p-4 rounded-2xl text-xs space-y-2 text-red-950 font-medium">
              <p className="font-bold text-red-900 text-sm">
                Deduct {deleteReceivingConfirmModal.record.quantity} pcs of {deleteReceivingConfirmModal.record.variantLabel ? `${deleteReceivingConfirmModal.record.productName} (${deleteReceivingConfirmModal.record.variantLabel})` : deleteReceivingConfirmModal.record.productName} from Inventory and remove receiving record {deleteReceivingConfirmModal.record.referenceNo}?
              </p>
              <p className="text-[11px] text-red-700">
                This action will decrease current system stock in the Inventory tab by {deleteReceivingConfirmModal.record.quantity} pcs.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteReceivingConfirmModal({ show: false, record: null })}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteReceivingRecord}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Trash2 size={16} />
                <span>Delete & Revert Stock</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

