import create from 'zustand';
import type {
  Product,
  Member,
  Locker,
  LockerRental,
  KeyDuplication,
  LockerReplacement,
  Sale,
} from '../types';

interface AppState {
  // Data collections
  products: Product[];
  members: Member[];
  lockers: Locker[];
  lockerRentals: LockerRental[];
  keyDuplications: KeyDuplication[];
  lockerReplacements: LockerReplacement[];
  sales: Sale[];

  // Product actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

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

  // Utility
  clearAll: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  products: [],
  members: [],
  lockers: [],
  lockerRentals: [],
  keyDuplications: [],
  lockerReplacements: [],
  sales: [],

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

  clearAll: () =>
    set({
      products: [],
      members: [],
      lockers: [],
      lockerRentals: [],
      keyDuplications: [],
      lockerReplacements: [],
      sales: [],
    }),
}));
