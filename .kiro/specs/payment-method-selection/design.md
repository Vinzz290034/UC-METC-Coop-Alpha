# Design Document: Payment Method Selection at Checkout

## Overview

This document provides the technical design for implementing payment method selection functionality in the UC METC Coop e-commerce system. The feature allows students to choose between Cash and E-Wallet payment methods during checkout, with optional reference number capture for e-wallet transactions.

## High-Level Design

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CartPage.tsx (Checkout UI)                   │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Checkout Modal                                     │  │  │
│  │  │  • Payment Method Selection (Cash/E-Wallet)        │  │  │
│  │  │  • Reference Number Input (conditional)            │  │  │
│  │  │  • Validation & Submit                             │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         AppDataSync.createOrderFromCart()                │  │
│  │  • Collects cart items                                   │  │
│  │  • Accepts paymentMethod & referenceNumber params       │  │
│  │  • Calls API with order data                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼ HTTP POST /api/orders/create
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express/Node)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         POST /orders/create Route Handler                │  │
│  │  • Validates payment_method (cash|ewallet)              │  │
│  │  • Validates reference_number (optional)                │  │
│  │  • Creates order with payment data                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                         │  │
│  │  orders table:                                           │  │
│  │    • payment_method (cash|ewallet) ✓ existing           │  │
│  │    • reference_number VARCHAR(100) ✓ NEW                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼ GET /api/orders/pending/list
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         SalesPage.tsx (Pending Orders View)              │  │
│  │  • Displays payment_method for each order               │  │
│  │  • Shows reference_number for e-wallet orders           │  │
│  │  • Staff marks orders as paid/cancelled                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
Student                CartPage              AppDataSync           Backend API          Database
   │                      │                       │                     │                   │
   │  1. Click Checkout   │                       │                     │                   │
   ├─────────────────────>│                       │                     │                   │
   │                      │                       │                     │                   │
   │  2. Select Payment   │                       │                     │                   │
   │     Method (Cash)    │                       │                     │                   │
   ├─────────────────────>│                       │                     │                   │
   │                      │                       │                     │                   │
   │  3. Click Checkout   │                       │                     │                   │
   │     Button           │                       │                     │                   │
   ├─────────────────────>│                       │                     │                   │
   │                      │  4. createOrderFromCart(userId, 'cash', null)                   │
   │                      ├──────────────────────>│                     │                   │
   │                      │                       │  5. POST /orders/create                 │
   │                      │                       │    {paymentMethod: 'cash',              │
   │                      │                       │     referenceNumber: null}              │
   │                      │                       ├────────────────────>│                   │
   │                      │                       │                     │  6. INSERT order  │
   │                      │                       │                     ├──────────────────>│
   │                      │                       │                     │<──────────────────┤
   │                      │                       │<────────────────────┤                   │
   │                      │<──────────────────────┤                     │                   │
   │  7. Navigate to      │                       │                     │                   │
   │     Transaction Page │                       │                     │                   │
   │<─────────────────────┤                       │                     │                   │
```

### Data Model Changes

#### Orders Table Schema Update

```sql
-- Add reference_number column to orders table
ALTER TABLE orders 
ADD COLUMN reference_number VARCHAR(100);

-- The payment_method column already exists with CHECK constraint
-- payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'ewallet'))
```

#### Order Data Structure

```typescript
interface Order {
  id: string;
  receipt_no: string;
  user_id: string;
  total_amount: number;
  payment_method: 'cash' | 'ewallet';  // ✓ existing
  reference_number?: string;            // ✓ NEW
  status: 'pending' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}
```

## Low-Level Design

### Frontend Implementation

#### 1. CartPage.tsx - Checkout Modal Enhancement

**Location:** `src/pages/CartPage.tsx`

**State Management:**
```typescript
// Add new state variables inside CartPage component
const [paymentMethod, setPaymentMethod] = useState<'cash' | 'ewallet' | null>(null);
const [referenceNumber, setReferenceNumber] = useState<string>('');
```

**UI Components to Add:**

```typescript
// Inside the checkout confirmation modal, after the blue info box and before action buttons:

{/* Payment Method Selection */}
<div className="mb-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-3">Select Payment Method</h3>
  
  <div className="grid grid-cols-2 gap-3">
    {/* Cash Option */}
    <button
      onClick={() => {
        setPaymentMethod('cash');
        setReferenceNumber(''); // Clear reference number when switching to cash
      }}
      className={`p-4 rounded-lg border-2 transition-all ${
        paymentMethod === 'cash'
          ? 'border-purple-600 bg-purple-50'
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      <div className="text-3xl mb-2">💵</div>
      <div className="font-semibold text-slate-900">Cash</div>
      <div className="text-xs text-slate-600 mt-1">Pay at Coop office</div>
    </button>

    {/* E-Wallet Option */}
    <button
      onClick={() => setPaymentMethod('ewallet')}
      className={`p-4 rounded-lg border-2 transition-all ${
        paymentMethod === 'ewallet'
          ? 'border-purple-600 bg-purple-50'
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      <div className="text-3xl mb-2">📱</div>
      <div className="font-semibold text-slate-900">E-Wallet</div>
      <div className="text-xs text-slate-600 mt-1">GCash, PayMaya, etc.</div>
    </button>
  </div>
</div>

{/* Reference Number Input - Conditional on E-Wallet */}
{paymentMethod === 'ewallet' && (
  <div className="mb-6">
    <label className="block text-sm font-semibold text-slate-900 mb-2">
      Reference Number (Optional)
    </label>
    <input
      type="text"
      value={referenceNumber}
      onChange={(e) => setReferenceNumber(e.target.value)}
      placeholder="Enter transaction reference number"
      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      maxLength={100}
    />
    <p className="text-xs text-slate-600 mt-1">
      You can provide this after completing payment at the Coop office
    </p>
  </div>
)}

{/* Payment Instructions - Conditional on E-Wallet */}
{paymentMethod === 'ewallet' && (
  <div className="bg-blue-50 rounded-lg p-4 mb-6">
    <p className="text-sm text-blue-800">
      <strong>E-Wallet Payment Process:</strong> Please proceed to the Coop office 
      to complete your e-wallet payment. Staff will verify your transaction in real-time.
    </p>
  </div>
)}
```

**Checkout Button Logic Update:**

```typescript
// Update the Checkout button to be disabled until payment method is selected
<button
  onClick={async () => {
    if (!paymentMethod) {
      showNotification('Please select a payment method', 'error');
      return;
    }
    
    if (!user?.id) {
      showNotification('Please log in to checkout', 'error');
      return;
    }
    
    try {
      await AppDataSync.createOrderFromCart(
        user.id, 
        paymentMethod,
        referenceNumber || null
      );
      showNotification('Checkout initiated!', 'success');
      setShowCheckoutPrompt(false);
      // Reset payment method state
      setPaymentMethod(null);
      setReferenceNumber('');
      navigate('/transaction');
    } catch (err: any) {
      showNotification(`Checkout failed: ${err.message}`, 'error');
    }
  }}
  disabled={!paymentMethod}
  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg ${
    paymentMethod
      ? 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
  }`}
>
  Checkout
</button>
```

**Modal Reset Logic:**

```typescript
// Update the Cancel button to reset payment method state
<button
  onClick={() => {
    setShowCheckoutPrompt(false);
    setPaymentMethod(null);
    setReferenceNumber('');
  }}
  className="flex-1 px-4 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold transition-all duration-200 hover:scale-105"
>
  Cancel
</button>
```

#### 2. AppDataSync.ts - Order Creation Update

**Location:** `src/store/appDataSync.ts`

**Function Signature Update:**

```typescript
// Update createOrderFromCart to accept payment method and reference number
static async createOrderFromCart(
  userId: string, 
  paymentMethod: 'cash' | 'ewallet' = 'cash',
  referenceNumber: string | null = null
) {
  try {
    const cart = useAppStore.getState().cart;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    const items = cart.map(item => ({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.price * item.quantity,
      selectedOptions: item.selectedOptions || {},
    }));

    // Validate payment method
    if (!['cash', 'ewallet'].includes(paymentMethod)) {
      throw new Error('Invalid payment method. Must be "cash" or "ewallet".');
    }

    const orderData = {
      items,
      totalAmount: total,
      paymentMethod: paymentMethod,  // ✓ UPDATED: use parameter instead of hardcoded 'cash'
      referenceNumber: referenceNumber,  // ✓ NEW: include reference number
      receiptNo: `RCP-${Date.now()}`,
    };

    const newOrder = await apiClient.createOrder(orderData, userId);
    
    // Add order to local store
    const sale = {
      id: newOrder.id,
      receiptNo: newOrder.receipt_no,
      memberId: newOrder.user_id,
      items: items.map((item: any) => ({
        id: `item-${Date.now()}`,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        selectedOptions: item.selectedOptions,
      })),
      totalAmount: newOrder.total_amount,
      paymentMethod: newOrder.payment_method as 'cash' | 'ewallet',
      referenceNumber: newOrder.reference_number,  // ✓ NEW: store reference number
      status: newOrder.status as 'completed' | 'pending' | 'cancelled',
      createdAt: newOrder.created_at,
    };

    useAppStore.setState(state => ({
      sales: [...state.sales, sale],
      cart: [],
    }));

    return newOrder;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
}
```

#### 3. SalesPage.tsx - Pending Orders Display Update

**Location:** `src/pages/SalesPage.tsx`

**Display Payment Method in Order Card:**

```typescript
// Inside the pending orders map, update the payment method display section:

<div className="text-right">
  <p className="text-2xl font-bold text-purple-600">
    ₱{parseFloat(order.total_amount).toLocaleString()}
  </p>
  <div className="text-sm text-slate-600 mt-1">
    {/* Payment Method Display */}
    <div className="flex items-center justify-end space-x-1">
      {order.payment_method === 'cash' ? (
        <>
          <span>💵</span>
          <span>Cash</span>
        </>
      ) : (
        <>
          <span>📱</span>
          <span>E-Wallet</span>
        </>
      )}
    </div>
    
    {/* Reference Number Display - Only for E-Wallet */}
    {order.payment_method === 'ewallet' && order.reference_number && (
      <div className="text-xs text-slate-500 mt-1">
        Ref: {order.reference_number}
      </div>
    )}
  </div>
</div>
```

### Backend Implementation

#### 1. Database Migration

**File:** `backend/src/database/add_reference_number_migration.sql` (new file)

```sql
-- Migration: Add reference_number column to orders table
-- Date: 2026-04-29
-- Description: Support e-wallet reference number storage

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);

-- Add index for faster lookups by reference number
CREATE INDEX IF NOT EXISTS idx_orders_reference_number 
ON orders(reference_number) 
WHERE reference_number IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.reference_number IS 'Optional reference number for e-wallet transactions';
```

#### 2. Orders Route Update

**Location:** `backend/src/routes/orders.ts`

**Update POST /create endpoint:**

```typescript
// Update the create order endpoint to handle reference_number
router.post('/create', verifyUser, async (req: Request, res: Response) => {
  try {
    const { items, totalAmount, paymentMethod, referenceNumber, receiptNo } = req.body;
    const userId = (req as any).userId;

    // Validate payment method
    if (!['cash', 'ewallet'].includes(paymentMethod)) {
      return res.status(400).json({ 
        error: 'Invalid payment method. Must be "cash" or "ewallet".' 
      });
    }

    // Validate reference number length if provided
    if (referenceNumber && referenceNumber.length > 100) {
      return res.status(400).json({ 
        error: 'Reference number must be 100 characters or less.' 
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert order with reference_number
      const orderResult = await client.query(
        `INSERT INTO orders (receipt_no, user_id, total_amount, payment_method, reference_number, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [receiptNo, userId, totalAmount, paymentMethod, referenceNumber || null]
      );

      const orderId = orderResult.rows[0].id;

      // Insert order items with product details
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, selected_options)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            orderId,
            item.productId,
            item.productName || item.name || '',
            item.quantity,
            item.unitPrice,
            item.subtotal,
            item.selectedOptions ? JSON.stringify(item.selectedOptions) : null
          ]
        );
      }

      // Clear cart
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      await client.query('COMMIT');
      res.json(orderResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});
```

**Update GET /pending/list endpoint to include reference_number:**

```typescript
// Update the pending orders query to include reference_number
router.get('/pending/list', verifyUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Verify user is admin or staff
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (!userResult.rows[0] || !['admin', 'staff'].includes(userResult.rows[0].role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT o.id, o.receipt_no, o.user_id, o.total_amount, o.payment_method, 
              o.reference_number, o.status, o.created_at, o.updated_at,
              u.email, u.first_name, u.last_name, u.id_number,
              json_agg(json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productName', oi.product_name,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price,
                'subtotal', oi.subtotal,
                'selectedOptions', oi.selected_options
              )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.status = 'pending'
       GROUP BY o.id, u.id
       ORDER BY o.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});
```

**Update GET /all/transactions endpoint to include reference_number:**

```typescript
// Update the all transactions query to include reference_number
// In the staff/admin query section:
query = `SELECT o.id, o.receipt_no, o.user_id, o.total_amount, o.payment_method, 
                o.reference_number, o.status, o.created_at, o.updated_at,
         u.email, u.first_name, u.last_name, u.id_number, u.course, u.year,
         json_agg(json_build_object(
           'id', oi.id,
           'productId', oi.product_id,
           'productName', oi.product_name,
           'quantity', oi.quantity,
           'unitPrice', oi.unit_price,
           'subtotal', oi.subtotal,
           'selectedOptions', oi.selected_options
         )) as items
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN users u ON o.user_id = u.id
  GROUP BY o.id, u.id
  ORDER BY o.created_at DESC`;
```

### TypeScript Type Definitions

#### Update Order Types

**Location:** `src/types/index.ts` (if exists) or inline in components

```typescript
export interface Order {
  id: string;
  receipt_no: string;
  user_id: string;
  total_amount: number;
  payment_method: 'cash' | 'ewallet';
  reference_number?: string | null;  // ✓ NEW
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  // Staff view fields
  email?: string;
  first_name?: string;
  last_name?: string;
  id_number?: string;
  course?: string;
  year?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  selectedOptions?: Record<string, string>;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'ewallet';
  referenceNumber?: string | null;  // ✓ NEW
  receiptNo: string;
}
```

## Implementation Sequence

### Phase 1: Database Changes
1. Create and run migration to add `reference_number` column
2. Verify column exists and index is created

### Phase 2: Backend Updates
1. Update POST `/orders/create` endpoint to accept and validate `referenceNumber`
2. Update GET `/pending/list` endpoint to return `reference_number`
3. Update GET `/all/transactions` endpoint to return `reference_number`
4. Test endpoints with Postman/curl

### Phase 3: Frontend - Data Layer
1. Update `AppDataSync.createOrderFromCart()` signature and implementation
2. Update type definitions for Order interface
3. Test order creation with both payment methods

### Phase 4: Frontend - UI Components
1. Add payment method selection UI to CartPage checkout modal
2. Add conditional reference number input field
3. Add validation and state management
4. Update checkout button logic

### Phase 5: Frontend - Display
1. Update SalesPage pending orders to display payment method
2. Add reference number display for e-wallet orders
3. Test display with various order types

### Phase 6: Testing & Validation
1. Test complete checkout flow with Cash payment
2. Test complete checkout flow with E-Wallet payment (with and without reference number)
3. Verify staff can see payment method in pending orders
4. Test backward compatibility with existing orders
5. Verify validation errors display correctly

## Error Handling

### Frontend Validation
- Payment method not selected: "Please select a payment method"
- Invalid payment method value: "Invalid payment method selected"
- Reference number too long: "Reference number must be 100 characters or less"

### Backend Validation
- Invalid payment_method: 400 error with message "Invalid payment method. Must be 'cash' or 'ewallet'."
- Reference number exceeds 100 chars: 400 error with message "Reference number must be 100 characters or less."
- Database constraint violation: 500 error with generic message (log details server-side)

## Backward Compatibility

### Existing Orders
- Orders created before this feature will have `reference_number = NULL`
- Display logic handles NULL reference numbers gracefully
- Default payment method for old orders without explicit value: 'cash'

### API Compatibility
- `paymentMethod` parameter is optional in `createOrderFromCart()` with default value 'cash'
- Backend accepts requests without `referenceNumber` field
- Existing API consumers continue to work without changes

## Security Considerations

1. **Input Validation**: Reference number limited to 100 characters to prevent buffer overflow
2. **SQL Injection**: Using parameterized queries for all database operations
3. **Authorization**: Only staff/admin can view pending orders with payment details
4. **Data Sanitization**: Reference number input should be sanitized on frontend and backend

## Performance Considerations

1. **Database Index**: Added index on `reference_number` for faster lookups
2. **Conditional Rendering**: Reference number field only renders when e-wallet is selected
3. **State Management**: Minimal state additions (2 new state variables)
4. **API Payload**: Reference number adds minimal overhead (~50-100 bytes per order)

## Testing Strategy

### Unit Tests
- Validate payment method selection state management
- Test reference number input validation
- Test AppDataSync.createOrderFromCart() with various inputs

### Integration Tests
- Test order creation API with cash payment
- Test order creation API with e-wallet payment + reference number
- Test order creation API with e-wallet payment without reference number
- Test pending orders API returns reference_number

### E2E Tests
- Complete checkout flow with cash payment
- Complete checkout flow with e-wallet payment
- Verify staff sees payment method in pending orders
- Test modal reset on cancel

### Edge Cases
- Very long reference numbers (100 chars)
- Special characters in reference numbers
- Switching payment methods multiple times
- Closing and reopening checkout modal
- Orders with NULL reference_number

## Rollback Plan

If issues arise after deployment:

1. **Frontend Rollback**: Revert CartPage.tsx and AppDataSync.ts changes
   - Orders will be created with default 'cash' payment method
   - No data loss, feature simply disabled

2. **Backend Rollback**: Revert orders.ts route changes
   - Database column remains but is unused
   - No data corruption risk

3. **Database Rollback**: Drop reference_number column (if necessary)
   ```sql
   ALTER TABLE orders DROP COLUMN IF EXISTS reference_number;
   DROP INDEX IF EXISTS idx_orders_reference_number;
   ```

## Future Enhancements

1. **Payment Verification**: Add e-wallet transaction verification via payment gateway APIs
2. **Reference Number Validation**: Validate reference number format based on e-wallet provider
3. **Payment History**: Track payment method preferences per user
4. **Analytics**: Report on payment method distribution
5. **Multiple E-Wallet Providers**: Allow selection of specific e-wallet provider (GCash, PayMaya, etc.)
