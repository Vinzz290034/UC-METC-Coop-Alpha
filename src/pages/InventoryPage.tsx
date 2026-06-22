import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, AlertTriangle, TrendingDown, TrendingUp, Search, Package, Download, GripVertical } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useUIStore } from '../store/uiStore';
import { AppDataSync } from '../store/appDataSync';
import { FloatingInput } from '../components/FloatingInput';
import { apiClient } from '../services/api';
import type { Product, ItemType } from '../types';
import { PRODUCT_IMAGES } from '../constants/cloudinaryAssets';

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
  const [variantPrices, setVariantPrices] = useState<Record<string, number>>({});
  const [variantImages, setVariantImages] = useState<Record<string, string>>({});
  const [newChoiceInputs, setNewChoiceInputs] = useState<Record<string, string>>({});
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
  const [deleteIntakeConfirm, setDeleteIntakeConfirm] = useState<{ show: boolean; record: any | null; isDeleting: boolean }>({ show: false, record: null, isDeleting: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedOverChoice, setDraggedOverChoice] = useState<{ optionIndex: number; choiceIndex: number } | null>(null);

  
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

  // Synchronize and migrate variant stocks when options are modified
  useEffect(() => {
    if (!editingProduct) return;
    
    const generateCombinations = (options: any[]) => {
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
    }
  }, [activeTab]);

  const loadStockIntakeRecords = async () => {
    try {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const records = await apiClient.getStockIntakeRecords(user.id) as any[];
      setStockIntakeRecords(records);
    } catch (error) {
      console.error('Failed to load stock intake records:', error);
    }
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
      const categoryName = product.category 
        ? product.category.charAt(0).toUpperCase() + product.category.slice(1)
        : 'N/A';
      
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
    category?: 'uniform' | 'accessory' | 'equipment' | 'service';
    note?: string;
    image?: string;
    options?: Array<{
      id: string;
      label: string;
      choices: string[];
    }>;
    allowPreorder?: boolean;
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
    setEditingProduct({ ...product });
    
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
      const updates: Partial<Product> = {
        price: editingProduct.price,
        note: editingProduct.note,
        options: editingProduct.options,
        allowPreorder: editingProduct.allowPreorder !== false,
        image: editingProduct.image,
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
    }
  };

  // Low stock products calculated but kept for potential future use
  // const lowStockProducts = products.filter((p) => p.stock <= 5);

  return (
    <div className="min-h-screen p-4 sm:p-6 animate-slide-in-right">
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
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 hover:shadow-lg transition-all font-semibold"
                >
                  <Plus size={20} />
                  <span>Add Product</span>
                </button>
              </div>
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
                    onClick={() => setShowForm(true)}
                    className="flex items-center space-x-1 sm:space-x-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-all text-xs sm:text-sm font-semibold shadow-sm hover:shadow"
                  >
                    <Plus size={16} className="sm:w-5 sm:h-5" />
                    <span>Add</span>
                  </button>
                </>
              )}
              {activeTab === 'stock-intake' && (
                <button
                  onClick={() => setShowStockIntakeForm(true)}
                  className="flex items-center space-x-1 sm:space-x-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-all text-xs sm:text-sm font-semibold shadow-sm hover:shadow"
                >
                  <Plus size={16} className="sm:w-5 sm:h-5" />
                  <span>Record</span>
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
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, image: reader.result as string });
                            };
                            reader.readAsDataURL(file);
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
                                <span className="text-2xl">{resolvedImage || '📦'}</span>
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

                {/* Pre-Order Toggle */}
                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
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
                                      {Object.entries(combo).map(([, value], i) => (
                                        <span key={i} className="inline-block bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded font-semibold border border-purple-100">
                                          {value}
                                        </span>
                                      ))}
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
                                                    onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                          setNewProductVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                        };
                                                        reader.readAsDataURL(file);
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
                                                    onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                          setNewProductVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                        };
                                                        reader.readAsDataURL(file);
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
                      const userStr = sessionStorage.getItem('user');
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
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockIntakeRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
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
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setDeleteIntakeConfirm({ show: true, record, isDeleting: false })}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-105 duration-200"
                          title="Delete record"
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
        </div>
      )}
      </div>

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
                            {resolvedImage ? (
                              isImageUrl ? (
                                <img src={resolvedImage} alt={editingProduct.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl">{resolvedImage}</span>
                              )
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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditingProduct({ ...editingProduct, image: reader.result as string });
                              };
                              reader.readAsDataURL(file);
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

                  {/* Pre-Order Toggle */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
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

                  {/* Manage Variants & Options Section */}
                  {!['Type A & B Uniform', 'Gala', 'BSNAME Uniform', 'Hard Bound'].includes(editingProduct.name) && (
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
                                        {Object.entries(combo).map(([, value], i) => (
                                          <span key={i} className="inline-block bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded font-semibold border border-purple-100">
                                            {value}
                                          </span>
                                        ))}
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
                                                       onChange={(e) => {
                                                         const file = e.target.files?.[0];
                                                         if (file) {
                                                           const reader = new FileReader();
                                                           reader.onloadend = () => {
                                                             setVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                           };
                                                           reader.readAsDataURL(file);
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
                                                       onChange={(e) => {
                                                         const file = e.target.files?.[0];
                                                         if (file) {
                                                           const reader = new FileReader();
                                                           reader.onloadend = () => {
                                                             setVariantImages(prev => ({ ...prev, [variantKey]: reader.result as string }));
                                                           };
                                                           reader.readAsDataURL(file);
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
    </div>
  );
};

