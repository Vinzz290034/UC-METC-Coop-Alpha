# Database & API Integration Summary

## Database Tables Created

### 1. **cart_items**
- Stores user shopping cart items
- Unique constraint on (user_id, product_id, selected_options) to auto-merge duplicates
- Fields: id, user_id, product_id, product_name, price, quantity, selected_options (JSON), timestamps

### 2. **orders**
- Main order/transaction table
- Tracks receipt number, user, total, payment method, status (pending/completed/cancelled)
- Fields: id, receipt_no, user_id, total_amount, payment_method, status, timestamps

### 3. **order_items**
- Individual items in each order
- Links to orders table
- Fields: id, order_id, product_id, quantity, unit_price, subtotal, created_at

### 4. **messages**
- Inbox/sent messages
- Supports role-based filtering and recipient types
- Fields: id, sender_id, sender_name, sender_role, recipient_id, recipient_role, subject, content, preview, is_read (boolean), is_favorite (boolean), folder (inbox/sent), status (unread/read/archived/deleted), timestamps

## Backend API Endpoints

### Cart Routes (`/api/cart`)
- `POST /add` - Add item to cart (auto-merges duplicates)
- `GET /` - Get user's cart
- `PUT /:id` - Update cart item quantity
- `DELETE /:id` - Remove item from cart
- `DELETE /` - Clear entire cart

### Orders Routes (`/api/orders`)
- `POST /create` - Create order from cart items
- `GET /` - Get all user orders
- `GET /:id` - Get specific order
- `PUT /:id/status` - Update order status (staff/admin only)
- `PUT /:id/cancel` - Cancel pending order (user only)

### Messages Routes (`/api/messages`)
- `POST /send` - Send message (creates inbox entry for recipient + sent entry for sender)
- `GET ?folder=inbox|sent` - Get inbox or sent messages
- `GET /:id` - Get specific message
- `PUT /:id/read` - Mark message as read
- `PUT /:id/favorite` - Toggle favorite status
- `DELETE /:id` - Delete message

## Frontend API Client Methods

**New methods in `src/services/api.ts`:**
- Cart: `addToCart()`, `getCart()`, `updateCartItem()`, `removeFromCart()`, `clearCart()`
- Orders: `createOrder()`, `getOrders()`, `getOrder()`, `updateOrderStatus()`, `cancelOrder()`
- Messages: `sendMessage()`, `getMessages()`, `getMessage()`, `markMessageAsRead()`, `toggleMessageFavorite()`, `deleteMessage()`

## Frontend Data Sync Module

**New file: `src/store/appDataSync.ts`**

Class `AppDataSync` with static methods:
- `loadCartFromAPI(userId)` - Load cart from backend
- `syncCartToAPI(userId)` - Sync local cart to backend
- `loadOrdersFromAPI(userId)` - Load orders from backend
- `createOrderFromCart(userId)` - Create order and sync to backend
- `updateOrderStatus(orderId, status, userId)` - Update order status
- `loadMessagesFromAPI(userId, folder)` - Load messages
- `sendMessageViaAPI(messageData, userId)` - Send message
- `initializeAppData(userId)` - Initialize all data on login

## How It Works

### Cart Persistence Workflow:
1. User logs in → `AppDataSync.initializeAppData(userId)` loads cart from DB
2. User adds item to cart → sync to backend via `AppDataSync.syncCartToAPI(userId)`
3. User updates quantity → API updates in DB
4. User removes item → API deletes from DB
5. User logs out and logs back in → cart is restored from DB

### Order Workflow:
1. User checks out → `AppDataSync.createOrderFromCart(userId)` creates order in DB
2. Order status starts as 'pending'
3. User can cancel if pending via `AppDataSync.updateOrderStatus(orderId, 'cancelled', userId)`
4. Staff can mark as paid via `AppDataSync.updateOrderStatus(orderId, 'completed', userId)`
5. Orders persist across sessions

### Messages Workflow:
1. User sends message → `AppDataSync.sendMessageViaAPI(messageData, userId)` creates:
   - Inbox entry for recipient (unread)
   - Sent entry for sender (read)
2. Messages load on app init via `AppDataSync.loadMessagesFromAPI(userId, 'inbox')`
3. User can mark read, favorite, or delete
4. All changes persist to DB

## Next Steps to Complete Integration

1. **Update CartPage.tsx** to call `AppDataSync.syncCartToAPI()` when items change
2. **Update CartPage.tsx** checkout to call `AppDataSync.createOrderFromCart()`
3. **Update TransactionPage.tsx** to call `AppDataSync.loadOrdersFromAPI()` on mount
4. **Update TransactionPage.tsx** to call `AppDataSync.updateOrderStatus()` when staff marks order as paid
5. **Update InboxPage.tsx** to call `AppDataSync.sendMessageViaAPI()` and `AppDataSync.loadMessagesFromAPI()`
6. **Update authContext.tsx** to call `AppDataSync.initializeAppData(userId)` on successful login
7. Test end-to-end: logout → login → verify cart/orders/messages persisted

## Notes
- All endpoints require `x-user-id` header for identification
- Cart items with same product ID and selected options automatically merge in DB
- Orders create both order record and individual order_items records in transaction
- Messages support role-based filtering (inbox can filter by sender role and recipient role)
