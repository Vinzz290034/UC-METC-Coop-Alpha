// Authentication & User Types - 4-Tier Role System
export type UserRole = 'admin' | 'staff' | 'member' | 'user';

export interface User {
  id: string;
  id_number?: string; // Student/Member ID number
  email: string;
  first_name: string;
  middle_name?: string; // Optional middle name
  last_name: string;
  role: UserRole;
  staffType?: 'cashier' | 'locker_officer' | 'inventory_officer'; // Only for staff role
  course?: string; // For user/student role
  year?: string; // For user/student role (e.g., "1st Year", "2nd Year")
  membership_status?: 'approved' | 'pending' | 'rejected'; // Membership status
  tour_completed?: boolean;
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
  'Type A & B Uniform',
  'Type C Uniform',
  'Lanyard',
  'ID Case',
  'Handbag',
  'Hard Bound',
  'Safety Shoes',
  'Safety Goggles',
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
  'Anchor Pins',
  'Propeller Pins',
  'Patch',
  'Swimming Set',
  'Swimming Cap',
  'Belt',
  'Cloth',
  'Shoulder Board',
  'PE Short',
  'CWTS Shirt',
  'White Shoes',
  'Rope',
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
  available?: boolean;
  allowPreorder?: boolean;
  image?: string;
  note?: string;
  options?: Array<{
    id: string;
    label: string;
    choices: string[];
  }>;
  variants?: {
    [variantKey: string]: {
      stock: number;
      options: Record<string, string>;
    };
  };
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

// Message/Email Types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId?: string;
  recipientName?: string;
  recipientRole?: UserRole;
  subject: string;
  content: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  isFavorite: boolean;
  folder: 'inbox' | 'sent';
  status: 'unread' | 'read' | 'archived' | 'deleted';
}

// Cart Item Types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedOptions?: Record<string, string>;
  paymentType?: 'full' | 'downpayment';
  orderType?: 'regular' | 'preorder';
  fullPrice?: number; // The full price of the item (for downpayment items to calculate balance)
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
  receiptNo?: string;
  receipt_no?: string; // snake_case from API
  memberId?: string;
  items: SaleItem[];
  totalAmount?: number;
  total_amount?: number; // snake_case from API
  paymentMethod?: 'cash' | 'ewallet';
  payment_method?: 'cash' | 'ewallet'; // snake_case from API
  status: 'completed' | 'pending' | 'cancelled' | 'released';
  createdAt?: string;
  created_at?: string; // snake_case from API
  order_type?: 'merchandise' | 'insurance'; // Order type for insurance vs merchandise
  referenceNumber?: string | null;
  reference_number?: string | null;
}

// Notification Types
export type NotificationType =
  | 'new_message'
  | 'pending_order'
  | 'pending_membership'
  | 'order_completed'
  | 'order_cancelled'
  | 'membership_approved'
  | 'membership_rejected'
  | 'insurance_approved';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  description?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
