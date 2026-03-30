// Authentication & User Types - 4-Tier Role System
export type UserRole = 'admin' | 'staff' | 'member' | 'user';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  staffType?: 'cashier' | 'locker_officer' | 'inventory_officer'; // Only for staff role
  course?: string; // For user/student role
  year?: string; // For user/student role (e.g., "1st Year", "2nd Year")
}

// Daily Time Record (DTR) Types
export interface DTRRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD format
  timeIn: string; // HH:MM:SS format
  timeOut?: string; // HH:MM:SS format
  duration?: number; // in minutes
  status: 'present' | 'absent' | 'late' | 'on_time';
  createdAt: string;
}

// Member Types
export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipNo: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// Product Types - All items as per specification
export const ITEM_INVENTORY = [
  'Type A Uniform',
  'Type B Uniform',
  'Type C Uniform',
  'Lanyard',
  'ID Case',
  'Handbag',
  'Hard Bound',
  'Shoes',
  'Goggles',
  'Cover All',
  'Gloves',
  'Hard Hat',
  'Plotting Sheet',
  'Gala',
  'ROTC Manual',
  'Bugsay Kit',
  'BSNAME Uniform',
  'PE Tshirt',
  'PE Pants',
  'Pershing Cap',
  'Buttons',
  'Anchor Pin',
  'Bars',
  'Patch',
  'Swimming Set',
  'Swimming Cap',
  'Belt',
  'Cloth',
  'Shoulder Board',
  'Locker Rent',
  'Locker Deposit',
  'PE Short',
] as const;

export type ItemType = typeof ITEM_INVENTORY[number];

export interface Product {
  id: string;
  name: ItemType;
  price: number;
  stock: number;
  sku: string;
  category: 'uniform' | 'accessory' | 'equipment' | 'service';
  createdAt: string;
}

// Transaction Types
export type TransactionType = 'sale' | 'locker_rental' | 'locker_renewal' | 'key_duplication' | 'locker_replacement';

export interface Transaction {
  id: string;
  memberId?: string;
  type: TransactionType;
  amount: number;
  paymentMethod: 'cash' | 'ewallet';
  status: 'pending' | 'completed' | 'cancelled';
  receiptNo: string;
  createdAt: string;
}

// Locker Types
export type LockerSize = 'Small' | 'Medium' | 'Large';
export type LockerStatus = 'available' | 'occupied' | 'under_maintenance' | 'for_replacement';

export interface Locker {
  id: string;
  lockerId: string;
  location: {
    building: string;
    floor: string;
  };
  size: LockerSize;
  status: LockerStatus;
  createdAt: string;
}

// Locker Rental Types
export interface LockerRental {
  id: string;
  lockerId: string;
  memberId: string;
  startDate: string;
  expiryDate: string;
  renewalCount: number;
  rentalFee: number;
  status: 'active' | 'expired' | 'renewed';
  createdAt: string;
}

// Key Duplication Types
export interface KeyDuplication {
  id: string;
  lockerId: string;
  memberId: string;
  reason: 'lost' | 'spare' | 'damaged';
  fee: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  releaseStatus: 'pending' | 'released';
  createdAt: string;
}

// Locker Replacement Types
export interface LockerReplacement {
  id: string;
  oldLockerId: string;
  newLockerId?: string;
  memberId: string;
  reason: 'damaged' | 'broken_lock' | 'forced_opening';
  replacementFee: number;
  status: 'pending' | 'completed';
  createdAt: string;
}

// Sale Item Types
export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  receiptNo: string;
  memberId?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'ewallet';
  status: 'completed' | 'cancelled';
  createdAt: string;
}
