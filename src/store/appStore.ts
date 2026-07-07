import create from 'zustand';
import type {
  Product,
  Member,
  Locker,
  LockerRental,
  KeyDuplication,
  LockerReplacement,
  Sale,
  CartItem,
  Message,
} from '../types';
import { apiClient } from '../services/api';

// Default products based on ITEM_INVENTORY
const createDefaultProducts = (): Product[] => {
  const defaultItems = [
    { name: 'Type A & B Uniform', sku: 'UNI-001', price: 3150, stock: 45, category: 'uniform', available: true, image: '', note: 'Note: Please proceed to the Coop office to register your name for uniform tailoring and size fitting.', options: [
      { id: 'course', label: 'Course', choices: ['SHS (₱2,700)', 'BSMT (₱2,950)', 'BSMARE (₱2,950)'] }
    ] },
    { name: 'Type C Uniform', sku: 'UNI-003', price: 400, stock: 28, category: 'uniform', available: true, image: '', note: 'Note: Please proceed to the Coop Office if you need assistance in confirming your size', options: [
      { id: 'course', label: 'Course', choices: ['SHS', 'BSMT', 'BSMARE'] },
      { id: 'size', label: 'Size', choices: ['Small', 'Medium', 'Large', 'XL', '2XL', '3XL', '4XL'] }
    ] },
    { name: 'Lanyard', sku: 'ACC-001', price: 100, stock: 100, category: 'accessory', available: true, image: '', options: [
      { id: 'course', label: 'Course', choices: ['SHS', 'BSMT', 'BSMARE', 'HM', 'TOURISM'] }
    ] },
    { name: 'ID Case', sku: 'ACC-002', price: 15, stock: 50, category: 'accessory', available: true, image: '' },
    { name: 'Handbag', sku: 'ACC-003', price: 600, stock: 134, category: 'accessory', available: true, image: '' },
    { name: 'Hard Bound', sku: 'EQUIP-001', price: 300, stock: 35, category: 'equipment', available: true, image: '', note: 'Note: Make sure the pages are printed and in order to ensure smooth transaction.' },
    { name: 'Safety Shoes', sku: 'EQUIP-002', price: 550, stock: 28, category: 'equipment', available: true, image: '', note: 'Note: Please proceed to the Coop office for sizing or if you are not sure of your shoe size.', options: [{ id: 'size', label: 'Size', choices: ['39', '40', '41', '42', '43', '44', '45'] }] },
    { name: 'Safety Goggles', sku: 'EQUIP-003', price: 100, stock: 40, category: 'equipment', available: true, image: '' },
    { name: 'Cover All', sku: 'EQUIP-004', price: 1300, stock: 25, category: 'equipment', available: true, image: '', note: 'Note: Please proceed to the Coop Office if you need assistance in confirming your size.', options: [
      { id: 'color', label: 'Color', choices: ['Orange', 'Blue'] },
      { id: 'size', label: 'Size', choices: ['Small', 'Medium', 'Large', 'XL'] }
    ] },
    { name: 'Gloves', sku: 'EQUIP-005', price: 50, stock: 50, category: 'equipment', available: true, image: '' },
    { name: 'Hard Hat', sku: 'EQUIP-006', price: 150, stock: 20, category: 'equipment', available: true, image: '', options: [{ id: 'color', label: 'Color', choices: ['Yellow (₱150)', 'Blue (₱300)'] }] },
    { name: 'PE Tshirt', sku: 'UNI-004', price: 190, stock: 40, category: 'uniform', available: true, image: '', note: 'Note: Please proceed to the Coop Office if you need assistance in confirming your size.', options: [{ id: 'size', label: 'Size', choices: ['Small (₱190)', 'Medium (₱190)', 'Large (₱190)', 'XL (₱200)', '2XL (₱210)', '3XL (₱220)', '4XL (₱230)', '5XL (₱240)'] }] },
    { name: 'PE Pants', sku: 'UNI-005', price: 260, stock: 35, category: 'uniform', available: true, image: '', note: 'Note: Please proceed to the Coop Office if you need assistance in confirming your size.', options: [{ id: 'size', label: 'Size', choices: ['Small (₱260)', 'Medium (₱260)', 'Large (₱260)', 'XL (₱280)', '2XL (₱280)', '3XL (₱320)'] }] },
    { name: 'Pershing Cap', sku: 'ACC-004', price: 350, stock: 30, category: 'accessory', available: true, image: '', note: 'Note: Please proceed to the Coop Office if you need assistance in confirming your size.', options: [
      { id: 'course', label: 'Course', choices: ['BSMT', 'BSMARE'] },
      { id: 'size', label: 'Size', choices: ['4', '5', '6', '7', '8', '9'] }
    ] },
    { name: 'Plotting Sheet', sku: 'SS-001', price: 20, stock: 100, category: 'equipment', available: true, image: '' },
    { name: 'Gala', sku: 'UNI-002', price: 1200, stock: 999, category: 'uniform', available: true, image: '', note: 'Note: Please proceed to the Coop office to register your name for uniform tailoring and size fitting.', options: [
      { id: 'course', label: 'Course', choices: ['BSMT', 'BSMARE'] },
      { id: 'bundle', label: 'Bundle', choices: ['Bundle A (₱1,200 / ₱1,150 Member)', 'Bundle B (₱1,700 / ₱1,650 Member)', 'Bundle C (₱2,030 / ₱1,980 Member)', 'Bundle D (₱2,180 / ₱2,130 Member)', 'Bundle E (₱2,710 / ₱2,660 Member)', 'Bundle F (₱2,230 / ₱2,180 Member)', 'Bundle G (₱2,550 / ₱2,500 Member)', 'Bundle H - Girls Only (₱1,980 / ₱1,930 Member)', 'Bundle I - Girls Only (₱1,450 / ₱1,400 Member)'] }
    ] },
    { name: 'BSNAME Uniform', sku: 'UNI-006', price: 3150, stock: 999, category: 'uniform', available: true, image: '', note: 'Note: Please proceed to the Coop office to register your name for uniform tailoring and size fitting.' },
    { name: 'PE Short', sku: 'UNI-007', price: 280, stock: 40, category: 'uniform', available: true, image: '', note: 'Note: Please proceed to the Coop Office if you need assistance in confirming your size.', options: [{ id: 'size', label: 'Size', choices: ['Small', 'Medium', 'Large', 'XL', '2XL', '3XL'] }] },
    { name: 'Buttons', sku: 'ACC-005', price: 15, stock: 100, category: 'accessory', available: true, image: '' },
    { name: 'Anchor Pins', sku: 'ACC-006', price: 30, stock: 100, category: 'accessory', available: true, image: '' },
    { name: 'Propeller Pins', sku: 'ACC-007', price: 40, stock: 100, category: 'accessory', available: true, image: '' },
    { name: 'Shoulder Board', sku: 'ACC-008', price: 140, stock: 100, category: 'accessory', available: true, image: '', options: [
      { id: 'course', label: 'Course', choices: ['BSMT', 'BSMARE'] }
    ] },
    { name: 'Swimming Set', sku: 'UNI-008', price: 320, stock: 40, category: 'uniform', available: true, image: '', note: 'Note: Please proceed to the Coop Office if you need assistance in confirming your size.', options: [{ id: 'size', label: 'Size', choices: ['Small', 'Medium', 'Large', 'XL', '2XL', '3XL'] }] },
    { name: 'CWTS Shirt', sku: 'UNI-009', price: 250, stock: 40, category: 'uniform', available: true, image: '', note: 'Note: Sizes for CWTS Shirt is the same on PE Tshirt.', options: [{ id: 'size', label: 'Size', choices: ['Small', 'Medium', 'Large', 'XL', '2XL'] }] },
    { name: 'ROTC Manual', sku: 'EQUIP-007', price: 150, stock: 50, category: 'equipment', available: true, image: '', options: [{ id: 'part', label: 'Part', choices: ['Part 1', 'Part 2'] }] },
    { name: 'Belt', sku: 'ACC-009', price: 150, stock: 50, category: 'accessory', available: true, image: '', options: [{ id: 'color', label: 'Color', choices: ['Black', 'White'] }] },
    { name: 'Swimming Cap', sku: 'ACC-010', price: 100, stock: 50, category: 'accessory', available: true, image: '' },
    { name: 'White Shoes', sku: 'EQUIP-008', price: 550, stock: 30, category: 'equipment', available: true, image: '', note: 'Note: Please proceed to the Coop Office if you need assistance in confirming your size.', options: [{ id: 'size', label: 'Size', choices: ['4', '5', '6', '7', '8', '9', '10', '11', '12'] }] },
    { name: 'Rope', sku: 'EQUIP-009', price: 200, stock: 50, category: 'equipment', available: true, image: '' },
  ];

  return defaultItems.map((item, index) => ({
    id: `prod-${index + 1}`,
    name: item.name as any,
    category: item.category as 'uniform' | 'accessory' | 'equipment' | 'service',
    price: item.price,
    stock: item.stock,
    sku: item.sku,
    image: item.image,
    available: item.available,
    note: item.note,
    options: item.options,
    createdAt: new Date().toISOString(),
  }));
};

interface AppState {
  // Data collections
  products: Product[];
  members: Member[];
  lockers: Locker[];
  lockerRentals: LockerRental[];
  keyDuplications: KeyDuplication[];
  lockerReplacements: LockerReplacement[];
  sales: Sale[];
  cart: CartItem[];
  messages: Message[];

  // Product actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItem: (cartItemId: string, update: Partial<CartItem>) => void;
  clearCart: () => void;
  getCart: () => CartItem[];

  // Member actions
  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;

  // Locker actions
  setLockers: (lockers: Locker[]) => void;
  addLocker: (locker: Locker) => void;
  updateLocker: (id: string, locker: Partial<Locker>) => void;
  deleteLocker: (id: string) => void;

  // Locker Rental actions
  setLockerRentals: (rentals: LockerRental[]) => void;
  addLockerRental: (rental: LockerRental) => void;
  updateLockerRental: (id: string, rental: Partial<LockerRental>) => void;

  // Key Duplication actions
  setKeyDuplications: (keyDuplications: KeyDuplication[]) => void;
  addKeyDuplication: (keyDuplication: KeyDuplication) => void;

  // Locker Replacement actions
  setLockerReplacements: (replacements: LockerReplacement[]) => void;
  addLockerReplacement: (replacement: LockerReplacement) => void;

  // Sales actions
  setSales: (sales: Sale[]) => void;
  addSale: (sale: Sale) => void;
  updateSale: (id: string, sale: Partial<Sale>) => void;

  // Message actions
  addMessage: (message: Message) => void;
  removeMessage: (id: string) => void;
  updateMessage: (id: string, update: Partial<Message>) => void;
  markAsRead: (id: string) => void;
  toggleFavorite: (id: string, userId: string) => Promise<void>;
  getMessages: () => Message[];
  setMessages: (messages: Message[]) => void;

  // Utility
  clearAll: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  products: createDefaultProducts(),
  members: [],
  lockers: [],
  lockerRentals: [],
  keyDuplications: [],
  lockerReplacements: [],
  sales: [],
  cart: [],
  messages: [],

  setProducts: (products) => set({ products }),
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),

  addToCart: (item: CartItem) =>
    set((state) => {
      const existingItem = state.cart.find((c) => c.id === item.id);
      if (existingItem) {
        return {
          cart: state.cart.map((c) =>
            c.id === item.id ? { ...c, quantity: c.quantity + item.quantity } : c
          ),
        };
      }
      return { cart: [...state.cart, item] };
    }),

  removeFromCart: (cartItemId: string) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.id !== cartItemId),
    })),

  updateCartItem: (cartItemId: string, update: Partial<CartItem>) =>
    set((state) => ({
      cart: state.cart.map((c) =>
        c.id === cartItemId ? { ...c, ...update } : c
      ),
    })),

  clearCart: () => set({ cart: [] }),

  getCart: () => {
    // This will be implemented in the set state callback
    let currentCart: CartItem[] = [];
    set((state) => {
      currentCart = state.cart;
      return {};
    });
    return currentCart;
  },

  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((state) => ({ members: [...state.members, member] })),
  updateMember: (id, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  deleteMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    })),

  setLockers: (lockers) => set({ lockers }),
  addLocker: (locker) =>
    set((state) => ({ lockers: [...state.lockers, locker] })),
  updateLocker: (id, updates) =>
    set((state) => ({
      lockers: state.lockers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),
  deleteLocker: (id) =>
    set((state) => ({
      lockers: state.lockers.filter((l) => l.id !== id),
    })),

  setLockerRentals: (rentals) => set({ lockerRentals: rentals }),
  addLockerRental: (rental) =>
    set((state) => ({
      lockerRentals: [...state.lockerRentals, rental],
    })),
  updateLockerRental: (id, updates) =>
    set((state) => ({
      lockerRentals: state.lockerRentals.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  setKeyDuplications: (keyDuplications) =>
    set({ keyDuplications }),
  addKeyDuplication: (keyDuplication) =>
    set((state) => ({
      keyDuplications: [...state.keyDuplications, keyDuplication],
    })),

  setLockerReplacements: (replacements) =>
    set({ lockerReplacements: replacements }),
  addLockerReplacement: (replacement) =>
    set((state) => ({
      lockerReplacements: [...state.lockerReplacements, replacement],
    })),

  setSales: (sales) => set({ sales }),
  addSale: (sale) =>
    set((state) => ({ sales: [...state.sales, sale] })),
  updateSale: (id, updates) =>
    set((state) => ({
      sales: state.sales.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  removeMessage: (id: string) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),

  updateMessage: (id: string, update: Partial<Message>) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...update } : m
      ),
    })),

  markAsRead: (id: string) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isRead: true, status: 'read' } : m
      ),
    })),

  toggleFavorite: async (id: string, userId: string) => {
    // Optimistically toggle the local state immediately for instant UI feedback
    const previousMessages = get().messages;
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
      ),
    }));

    try {
      // Call API to persist favorite status in database
      const result = await apiClient.toggleMessageFavorite(id, userId);
      
      // Reconcile with the server's authoritative value
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, isFavorite: result.is_favorite } : m
        ),
      }));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert optimistic update on failure
      set({ messages: previousMessages });
      throw error;
    }
  },

  getMessages: () => [],

  setMessages: (messages: Message[]) => set({ messages }),

  clearAll: () =>
    set({
      products: [],
      members: [],
      lockers: [],
      lockerRentals: [],
      keyDuplications: [],
      lockerReplacements: [],
      sales: [],
      cart: [],
      messages: [],
    }),
}));
