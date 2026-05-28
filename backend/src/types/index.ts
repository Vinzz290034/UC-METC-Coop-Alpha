export type UserRole = 'admin' | 'staff' | 'user' | 'cashier' | 'locker_officer' | 'inventory_officer' | 'manager' | 'member';

export interface User {
  id: string;
  id_number?: string;
  email: string;
  password: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  email_verified?: boolean;
  course?: string;
  year?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface Locker {
  id: string;
  locker_number: string;
  status: 'available' | 'assigned' | 'maintenance';
  assigned_to?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  category: string;
  created_at: Date;
  updated_at: Date;
}

export interface Sale {
  id: string;
  item_id: string;
  quantity: number;
  total_amount: number;
  created_by: string;
  created_at: Date;
}

export interface KeyRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: Date;
  completed_at?: Date;
}

export interface BillingRecord {
  id: string;
  user_id: string;
  amount: number;
  type: 'locker_rental' | 'service_fee' | 'other';
  status: 'pending' | 'paid' | 'overdue';
  due_date: Date;
  created_at: Date;
}
