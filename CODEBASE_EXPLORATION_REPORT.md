# UC-METC Coop Management System - Comprehensive Technical Exploration Report

## Executive Summary

The UC-METC Coop Management System is a full-stack cooperative management platform built with modern web technologies. It's a production-ready React + TypeScript frontend paired with an Express.js + PostgreSQL backend, designed to manage university cooperative operations including locker management, sales/inventory (POS), key duplication requests, billing, and staff time tracking (DTR).

**Key Stats:**
- **Frontend**: 24 page components + 8 reusable components
- **Backend**: 7 route modules + comprehensive middleware stack
- **Database**: 8 core tables with 15+ indexes for query optimization
- **Type Safety**: Full TypeScript coverage (frontend & backend)
- **Authentication**: JWT-based with role-based access control

---

## Part 1: Frontend Implementation Details

### 1.1 Technology Stack

```
React 18.3 + TypeScript 5.8
├── Vite 7.0 (build tool)
├── React Router 6.30 (SPA routing)
├── Zustand 4.4 (state management)
├── Tailwind CSS 3.4 (styling)
├── Framer Motion 11.0 (animations)
├── GSAP 3.13 (advanced animations)
├── Three.js 0.179 (3D graphics)
├── Lucide React (icon library)
└── Zod 3.25 (validation)
```

### 1.2 Project Structure

```
src/
├── pages/                    # 24 page components
│   ├── Public Pages: Landing, Login, ForgotPassword, LearnMore
│   ├── Student Pages: StudentDashboard, Merchandise, Cart, Locker, Transaction, Events
│   ├── Staff Pages: DTRPage
│   ├── Admin Pages: DashboardPage, LockerManagement, SalesInventory, 
│   │                KeyDuplication, Members, Billing, Reports
│   └── Shared Pages: Announcements, Community, AccountSettings, 
│                    TermsOfUse, PrivacyPolicy, InboxPage
│
├── components/               # Reusable UI components
│   ├── Layout.tsx           # Main wrapper with sidebar
│   ├── Sidebar.tsx          # Navigation with role-based filtering
│   ├── Header.tsx           # Top bar with notifications & profile
│   ├── ProtectedRoute.tsx   # Route protection wrapper
│   ├── ErrorBoundary.tsx    # Error handling boundary
│   ├── FloatingInput.tsx    # Custom input component
│   ├── Toast.tsx            # Notification system
│   ├── StaffTimeCard.tsx    # DTR tracking component
│   ├── PageTransition.tsx   # Page animation wrapper
│   └── TypingEffect.tsx     # Text animation
│
├── store/                    # State management
│   ├── appStore.ts          # Zustand: business data (products, members, lockers, etc.)
│   ├── authStore.ts         # Zustand: auth state (legacy, being replaced)
│   ├── authContext.tsx      # Context API: active auth state
│   └── uiStore.ts           # Zustand: UI state (sidebar, notifications, modals)
│
├── services/
│   └── api.ts               # ApiClient class with all backend methods
│
├── types/
│   └── index.ts             # Comprehensive TypeScript interfaces
│
├── assets/                   # Images and static files
│   └── Coop.jpeg
│
├── App.tsx                   # Main app component with routing
├── main.tsx                  # Application entry point
└── index.css                 # Global styles
```

### 1.3 State Management Architecture

#### AppStore (Zustand) - Business Logic
```typescript
// Manages: products, members, lockers, rentals, keys, replacements, sales, DTR
- setProducts/addProduct/updateProduct/deleteProduct
- setMembers/addMember/updateMember/deleteMember
- setLockers/addLocker/updateLocker/deleteLocker
- setLockerRentals/addLockerRental/updateLockerRental
- setKeyDuplications/addKeyDuplication
- setLockerReplacements/addLockerReplacement
- setSales/addSale
- setDTRRecords/addDTRRecord/updateDTRRecord
- clearAll() - reset all state
```

#### AuthContext (Context API) - Authentication
```typescript
- user: User | null
- isAuthenticated: boolean
- token: string | null
- login(email, password, id_number)
- register(data)
- logout()
- hasRole(role)
- refreshUser()
```

**Authentication Flow:**
1. User submits login → apiClient.login() → JWT returned
2. Token + user stored in localStorage
3. Token auto-injected in all API requests
4. On page reload, session restored from localStorage
5. Supports login via email OR id_number (student ID)

#### UIStore (Zustand) - UI State
```typescript
- sidebarOpen: boolean (toggle)
- currentPage: string
- showModal: boolean
- modalContent: string
- notificationMessage: string | null
- showNotification(message, type, duration)
```

### 1.4 Key Pages & Features

#### Dashboard Page (Role-Based)
- **Admin/Staff View**: Stats cards (members, lockers, rentals, revenue), alerts for expired rentals and pending approvals, recent activity feed
- **Student View**: Featured banner carousel, upcoming events, membership status, office hours, quick actions
- **Components**: StaffTimeCard for time tracking (staff only)

#### Locker Management Page
- **Two Tabs**: Locker Registry | Locker Rentals
- **Registry Features**: 
  - Add locker with ID, building, floor, size, status
  - View all lockers with status badges
  - Update/edit functionality
- **Rental Features**:
  - Create rental (1-month default)
  - Track expiry dates and renewal count
  - Update locker status on rental creation
  - Filter by status and dates

#### Sales & Inventory (POS System)
- **20+ Default Products** in inventory:
  - Uniforms: Type A&B, Type C, Gala, BSNAME, PE Tshirt/Pants/Shorts
  - Accessories: Lanyard, ID Case, Handbag, Pershing Cap
  - Equipment: Hard Bound, Safety Shoes, Goggles, Cover All, Gloves, Hard Hat, Plotting Sheet
- **POS Features**:
  - Shopping cart with add/remove items
  - Product options (size selections, color variants)
  - Checkout with payment method selection (CASH/EWALLET)
  - Receipt generation with unique receipt numbers
- **Inventory Management**:
  - Add/edit/delete products
  - Stock quantity tracking
  - Low stock alerts (≤5 units)
  - SKU and category management

#### DTR (Daily Time Record) Page
- **Time Tracking**:
  - Staff time-in/time-out recording
  - Duration calculation in minutes
  - Status categorization: on_time, late, absent, present
- **Filtering**: By date and staff member
- **Analytics**: 
  - Total present/late/absent counts
  - Average hours worked
- **Export**: CSV export functionality for reports

#### Key Duplication Page
- **Request Submission**: Reason selection (lost, spare, damaged)
- **Approval Workflow**: Admin approval/rejection with justification
- **Release Tracking**: Pending → Released status
- **Fee Management**: Per-request fee tracking

#### Membership & Members Pages
- **Member List**: View all members with status indicators
- **Actions**: Demote, freeze, manage membership status
- **Roles**: Student, Staff, Admin, Member
- **Status**: Active/Inactive, Membership approval status

#### Billing Page
- **User View**: Personal bills only
- **Admin View**: All user bills
- **Bill Types**: Locker rental, service fees, other charges
- **Statuses**: Pending, Paid, Overdue
- **Due Date Tracking**: 30-day default due dates

#### Reports Page
- **Sales Reports**: Daily aggregated sales, revenue, average transaction value
- **Inventory Reports**: Stock levels, categories, total value calculations
- **Member Reports**: Active/inactive counts, role distribution
- **Admin Only**: Requires admin middleware

### 1.5 Styling & UI Patterns

#### Tailwind CSS Configuration
- **Custom Animations** (tailwind.config.js):
  - `fade-in` (0.5s), `scale-in` (0.4s)
  - `slide-in-left`, `slide-in-right`, `slide-down`
  - Long variants (0.7-0.8s) for staggered effects
- **Color Scheme**: Purple/Green gradient primary theme
- **Responsive**: Mobile-first approach with md: and lg: breakpoints

#### Component Patterns
- **Gradient Cards**: 
  ```tsx
  className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6"
  ```
- **Glowing Effects**:
  ```tsx
  className="shadow-lg shadow-purple-500/30"
  ```
- **Animated Entrance**:
  ```tsx
  className="animate-slide-in-right"
  className="animate-fade-in-long" style={{ animationDelay: '0.7s' }}
  ```
- **Hover States**: Scale and shadow transitions
- **Status Badges**:
  ```tsx
  available → bg-green-100 text-green-800
  occupied → bg-blue-100 text-blue-800
  maintenance → bg-orange-100 text-orange-800
  ```

### 1.6 API Service Implementation

#### ApiClient Class (api.ts)
```typescript
class ApiClient {
  // Auth endpoints
  login(email, password, id_number?)
  register(data)
  
  // User endpoints
  getUsers()
  getUser(id)
  getCurrentUser()
  updateUser(id, data)
  deleteUser(id)
  demoteMember(id)
  freezeMember(id)
  
  // Locker endpoints
  getLockers()
  createLocker(locker_number)
  updateLockerStatus(id, status)
  assignLocker(id, user_id)
  deleteLocker(id)
  
  // Inventory endpoints
  getInventory()
  createInventoryItem(data)
  updateInventoryItem(id, data)
  
  // Key endpoints
  getKeyRequests()
  createKeyRequest(data)
  approveKeyRequest(id)
  rejectKeyRequest(id)
  
  // Billing endpoints
  getBillingRecords()
  createBillingRecord(data)
  
  // Reports endpoints
  getSalesReport()
  getInventoryReport()
}
```

**Request Pattern:**
```typescript
- GET requests: Authorization header only
- POST/PUT requests: JSON body + Authorization header
- Error handling: Status code checking, JSON parsing, detailed logging
- Token injection: Automatic from localStorage
- Debug logging: All requests logged with token prefix verification
```

### 1.7 TypeScript Types

#### Core User Types
```typescript
type UserRole = 'admin' | 'staff' | 'member' | 'user';

interface User {
  id: string;
  id_number?: string;                    // Student ID
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: UserRole;
  staffType?: 'cashier' | 'locker_officer' | 'inventory_officer';
  course?: string;                        // e.g., "BSMT", "BSMARE"
  year?: string;                          // e.g., "1st Year", "2nd Year"
  membership_status?: 'approved' | 'pending' | 'rejected';
}
```

#### Product Types
```typescript
type ItemType = 'Type A & B Uniform' | 'Type C Uniform' | 'Lanyard' | ... (20+ items)

interface Product {
  id: string;
  name: ItemType;
  price: number;
  stock: number;
  sku: string;
  category: 'uniform' | 'accessory' | 'equipment' | 'service';
  available?: boolean;
  image?: string;                         // Emoji or image path
  note?: string;                          // Product notes
  options?: Array<{ id: string; label: string; choices: string[] }>;
  createdAt: string;
}
```

#### Locker Types
```typescript
type LockerSize = 'Small' | 'Medium' | 'Large';
type LockerStatus = 'available' | 'occupied' | 'under_maintenance' | 'for_replacement';

interface Locker {
  id: string;
  lockerId: string;
  location: { building: string; floor: string };
  size: LockerSize;
  status: LockerStatus;
  createdAt: string;
}

interface LockerRental {
  id: string;
  lockerId: string;
  memberId: string;
  startDate: string;                      // YYYY-MM-DD
  expiryDate: string;
  renewalCount: number;
  rentalFee: number;
  status: 'active' | 'expired' | 'renewed';
  createdAt: string;
}
```

#### Transaction Types
```typescript
type TransactionType = 'sale' | 'locker_rental' | 'locker_renewal' | 
                       'key_duplication' | 'locker_replacement';

interface Transaction {
  id: string;
  memberId?: string;
  type: TransactionType;
  amount: number;
  paymentMethod: 'cash' | 'ewallet';
  status: 'pending' | 'completed' | 'cancelled';
  receiptNo: string;
  createdAt: string;
}
```

#### DTR Types
```typescript
interface DTRRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;                           // YYYY-MM-DD
  timeIn: string;                         // HH:MM:SS
  timeOut?: string;
  duration?: number;                      // in minutes
  status: 'present' | 'absent' | 'late' | 'on_time';
  createdAt: string;
}
```

### 1.8 Error Handling & Validation

#### Frontend Error Handling
- **API Errors**: Caught in try-catch, displayed via toast notifications
- **Validation**: Form validation before submission, display inline errors
- **Error Boundary**: React ErrorBoundary component catches render errors
- **State Error**: `error` field in authContext for persistent errors

#### Login Form Validation
```typescript
- Required fields: email/id_number AND password
- Course & year required for student signups
- Password confirmation matching
- Minimum password length (6 characters)
- Role validation post-login (verify expected role matches)
```

---

## Part 2: Backend Implementation Details

### 2.1 Technology Stack

```
Express.js 4.18
├── TypeScript 5.3 (strict mode)
├── PostgreSQL 8.11 (database)
├── JWT 9.0 (authentication)
├── bcryptjs 2.4 (password hashing)
├── CORS 2.8 (cross-origin)
├── express-validator 7.0 (validation)
├── axios 1.6 (optional HTTP calls)
└── dotenv 16.3 (environment config)
```

### 2.2 Server Architecture

#### Main Server Setup (server.ts)
```typescript
app.use(express.json());
app.use(cors(config.cors));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lockers', lockerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Middleware
app.use(notFoundHandler);
app.use(errorHandler);
```

**Configuration** (config.ts):
```typescript
{
  port: 5000 (default),
  nodeEnv: 'development',
  database: {
    host: 'localhost',
    port: 5432,
    database: 'uc_coop',
    user: 'postgres',
    password: process.env.DB_PASSWORD
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d'                        // 7-day token expiration
  },
  cors: {
    origin: 'http://localhost:5173'        // Vite dev server
  }
}
```

### 2.3 Middleware Stack

#### Authentication Middleware (authMiddleware)
```typescript
// Verification flow:
1. Extract token from Authorization: Bearer <token>
2. Verify JWT signature against config.jwt.secret
3. Decode token, extract user info (id, email, role)
4. Attach to req.user for downstream routes
5. Return 401 if token invalid/expired

// Error cases:
- No token provided → 401 "No token provided"
- Signature mismatch → 401 "Invalid token"
- Token expired → 401 "Token has expired"
- Malformed JWT → 401 "Invalid token"
```

**Debugging Logs Include:**
- Token length and prefix (first 20 chars)
- Secret length and prefix
- User ID, email, role
- Timestamp of verification

#### Role-Based Middleware
```typescript
adminMiddleware(req, res, next)
  - Checks if req.user.role === 'admin'
  - Returns 403 if not admin

requireRole(...roles)
  - Flexible role checking
  - Accepts multiple roles: requireRole('admin', 'cashier', 'locker_officer')
  - Returns 403 if user role not in whitelist
```

#### Error Handling Middleware
```typescript
errorHandler(err, req, res, next)
  - Centralized error response formatting
  - Development logging with stack traces
  - Production hides sensitive error details

notFoundHandler(req, res)
  - Handles unmatched routes
  - Returns 404 with route path
```

### 2.4 Database Configuration

#### Connection Pool
```typescript
// PostgreSQL Pool Configuration
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password
});

// Error handling
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query execution
export const query = (text, params) => pool.query(text, params);

// Connection testing
testConnection(): Returns true if successful, false otherwise
```

### 2.5 Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL (bcrypt hashed),
  id_number VARCHAR(20),                  -- Student ID
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  course VARCHAR(100),                    -- e.g., "BSMT", "BSMARE"
  year VARCHAR(50),                       -- e.g., "1st Year"
  role VARCHAR(50) NOT NULL DEFAULT 'user'
    CHECK (role IN ('admin', 'staff', 'user')),
  membership_status VARCHAR(50) NOT NULL DEFAULT 'none'
    CHECK (membership_status IN ('none', 'pending', 'approved', 'rejected')),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_membership_status ON users(membership_status);
```

#### Lockers Table
```sql
CREATE TABLE lockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locker_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'assigned', 'maintenance')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_lockers_status ON lockers(status);
CREATE INDEX idx_lockers_assigned_to ON lockers(assigned_to);
```

#### Inventory Table
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_inventory_category ON inventory(category);
```

#### Sales Table
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_sales_item_id ON sales(item_id);
```

#### Key Requests Table
```sql
CREATE TABLE key_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_key_requests_user_id ON key_requests(user_id);
CREATE INDEX idx_key_requests_status ON key_requests(status);
```

#### Membership Requests Table
```sql
CREATE TABLE membership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Create INDEX idx_membership_requests_status ON membership_requests(status);
CREATE INDEX idx_membership_requests_user_id ON membership_requests(user_id);
```

#### Billing Table
```sql
CREATE TABLE billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('locker_rental', 'service_fee', 'other')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_billing_user_id ON billing(user_id);
CREATE INDEX idx_billing_status ON billing(status);
```

### 2.6 API Routes

#### Authentication Routes (auth.ts)

**POST /api/auth/login**
```typescript
Request: { email?: string, id_number?: string, password: string }
- Accepts either email OR id_number + password
- Query: SELECT * FROM users WHERE email=$1 OR id_number=$1
- Password verification: bcryptjs.compare()
- Token generation: JWT.sign(payload, secret, { expiresIn: '7d' })
- Response: { token, user: { id, email, first_name, last_name, role, course, year } }
- Errors: 401 (invalid credentials), 500 (server error)
```

**POST /api/auth/register**
```typescript
Request: { 
  email: string, 
  password: string, 
  first_name: string, 
  last_name: string, 
  role?: string,
  id_number?: string,
  course?: string,
  year?: string
}
- Validation: email unique, all required fields present
- Password hashing: bcryptjs.hash(password, 10)
- Insert: INSERT INTO users (...)
- Token generation: Same as login
- Response: 201 status, { token, user }
- Errors: 409 (email exists), 400 (missing fields), 500 (error)
```

#### Users Routes (users.ts)

**GET /api/users/me** (authMiddleware)
- Returns current authenticated user profile
- Fetches from users table using req.user.id
- Response: User object with full details
- Error: 401 if no token, 404 if user not found

**GET /api/users** (authMiddleware)
- Requires: admin or staff role (isAdminOrStaff check)
- Returns: All users from database
- Response: { users: [...] }
- Error: 403 if insufficient permission

**GET /api/users/:id** (authMiddleware)
- Access control: Own profile OR admin only
- Response: User object
- Error: 403 (not authorized), 404 (not found)

**PUT /api/users/:id** (authMiddleware)
- Updates: first_name, last_name, role (admin only)
- Dynamic query building (UPDATE users SET ...)
- Response: Updated user object
- Error: 403, 404, 400

**GET /api/users/membership-requests/pending** (authMiddleware, admin only)
- Returns pending membership requests
- Response: { requests: [...] }

**POST /api/users/membership-requests/:id/approve** (authMiddleware, admin only)
- Approves pending membership request
- Updates membership status on user
- Updates request status to 'approved'

#### Lockers Routes (lockers.ts)

**GET /api/lockers** (authMiddleware)
- Returns all lockers ordered by number
- Response: { lockers: [...] }

**POST /api/lockers** (authMiddleware, adminMiddleware)
- Creates new locker
- Request: { locker_number: string }
- Validation: locker_number required
- Error: 409 if locker_number unique constraint violated

**PUT /api/lockers/:id** (authMiddleware, requireRole('admin', 'locker_officer'))
- Updates locker status
- Request: { status: 'available' | 'assigned' | 'maintenance' }
- Validation: Status must be in enum

**POST /api/lockers/:id/assign** (authMiddleware, locker_officer)
- Assigns locker to user
- Request: { user_id: string }
- Sets: assigned_to = user_id, status = 'assigned'
- Response: Updated locker

**DELETE /api/lockers/:id** (authMiddleware, adminMiddleware)
- Soft or hard delete locker
- Response: { message: 'Locker deleted' }

#### Inventory Routes (inventory.ts)

**GET /api/inventory** (authMiddleware)
- Returns all inventory items
- Response: { items: [...] }

**POST /api/inventory** (authMiddleware, adminMiddleware)
- Creates inventory item
- Request: { name, description, quantity, unit_price, category }
- Validation: name, quantity, unit_price required

**PUT /api/inventory/:id** (authMiddleware, requireRole('admin', 'inventory_officer'))
- Updates item fields dynamically
- Allowed fields: name, description, quantity, unit_price, category
- Dynamic query building for flexibility

**DELETE /api/inventory/:id** (authMiddleware, adminMiddleware)
- Deletes inventory item

#### Key Requests Routes (keys.ts)

**GET /api/keys** (authMiddleware)
- Returns all key requests with user details (joined)
- Response: { requests: [...] }

**POST /api/keys** (authMiddleware)
- Creates key request for current user
- Request: { } (user from token)
- Status: auto 'pending'
- Response: 201, { request }

**PUT /api/keys/:id** (authMiddleware, adminMiddleware)
- Updates request status
- Request: { status: 'pending' | 'completed' | 'rejected' }
- Sets completed_at if status = 'completed'

#### Billing Routes (billing.ts)

**GET /api/billing** (authMiddleware)
- Non-admin: Returns their own billing records only
- Admin: Returns all billing records
- Response: { records: [...] }

**POST /api/billing** (authMiddleware, adminMiddleware)
- Creates billing record
- Request: { user_id, amount, type, due_date? }
- Default due_date: 30 days from now

**PUT /api/billing/:id** (authMiddleware, adminMiddleware)
- Updates billing status
- Request: { status: 'pending' | 'paid' | 'overdue' }

#### Reports Routes (reports.ts)

**GET /api/reports/sales** (authMiddleware, adminMiddleware)
- Aggregates sales by date (last 30 days)
- Response: { sales: [{ date, total_sales, total_revenue, avg_sale }, ...] }

**GET /api/reports/inventory** (authMiddleware, adminMiddleware)
- Returns inventory with calculated total value
- Response: { inventory: [{ id, name, quantity, unit_price, total_value }, ...] }

**GET /api/reports/members** (authMiddleware, adminMiddleware)
- User statistics counters
- Response: { stats: { total_members, active_members, inactive_members, regular_members, staff_members } }

### 2.7 TypeScript Types (Backend)

```typescript
export type UserRole = 'admin' | 'cashier' | 'locker_officer' | 
                       'inventory_officer' | 'manager' | 'member';

export interface User {
  id: string;
  id_number?: string;
  email: string;
  password: string;                       // Hashed
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: UserRole;
  status: 'active' | 'inactive';
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
  assigned_to?: string;                   // UUID of assigned user
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
```

---

## Part 3: Integration Points

### 3.1 Frontend to Backend Communication

#### Authentication Flow
```
Frontend (Login) → POST /api/auth/login
  └─ Request: { email, password }
     Response: { token, user }
        ├─ localStorage.setItem('token', token)
        ├─ localStorage.setItem('user', JSON.stringify(user))
        └─ authContext updates
           
Subsequent Requests:
  └─ Header: Authorization: Bearer <token>
     ├─ authMiddleware verifies JWT
     ├─ req.user populated from token payload
     └─ Route handler accesses req.user
```

#### API Error Handling
```
Backend Response:
  ├─ 2xx: Success - parse JSON response
  ├─ 401: Unauthorized - likely token expired or invalid
  │   → Frontend logs out, redirects to login
  ├─ 403: Forbidden - user lacks permission
  │   → Frontend shows "Access Denied"
  └─ 5xx: Server Error - show generic error message

Frontend Error Handling:
  try {
    const response = await apiClient.someMethod()
  } catch (err) {
    // err has structure: { message, status, detail? }
    showNotification(err.message, 'error')
  }
```

### 3.2 Environment Configuration

#### Frontend (.env or .env.local)
```
VITE_API_URL=http://localhost:5000/api
```

#### Backend (.env)
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uc_coop
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 3.3 CORS Configuration
```typescript
Backend:
  cors({ origin: 'http://localhost:5173' })
  
Frontend:
  All requests to http://localhost:5000/api
  Credentials: NOT sent (no cookies)
  Headers: Content-Type: application/json, Authorization: Bearer <token>
```

### 3.4 Data Flow Patterns

#### Synchronous (Query Data)
```
Component → useAppStore/apiClient → API GET
  → Backend query() → PostgreSQL → Response
  → Frontend updates Zustand store
  → Component re-renders with new data
```

#### Asynchronous (Mutation)
```
Component form submit → event handler
  → Validation → apiClient.post()
  → Backend INSERT/UPDATE/DELETE
  → Zustand action (addProduct, updateLocker, etc.)
  → Component state update
  → UI notification (success/error)
```

#### Session Persistence
```
Login → token + user saved to localStorage
Page reload → useEffect in authContext
  → Restore from localStorage
  → Set state
  → useAuth hook reads state
  → Protected routes check isAuthenticated
```

---

## Part 4: Key Features Implementation

### 4.1 DTR (Daily Time Record)

**Frontend Components:**
- DTRPage.tsx: Main display with filters and export
- Filters: Date (required), Staff member (optional)
- Actions: Time in/out, Duration calculation, Status assignment

**Backend:**
- Table: key_requests (repurposed for DTR)
- Endpoints: GET, POST, PUT for CRUD
- Calculations: Duration in minutes = (timeOut - timeIn)

**Workflow:**
1. Staff member clocks in → POST with current time
2. System records timeIn, calculates duration
3. Staff member clocks out → PUT with timeOut
4. Admin reviews DTR records → Filter by date/staff
5. Export to CSV for payroll/reports

**Features:**
- On-time detection (8 AM start window)
- Late tracking (after 8 AM)
- Absent marking (no time-in)
- CSV export with columns: Name, Date, TimeIn, TimeOut, Duration, Status

### 4.2 Locker Management Workflow

**Phases:**

**1. Registration**
- Admin creates locker: ID, building, floor, size
- Status: 'available'
- Storage: lockers table

**2. Rental**
- Member requests locker
- Admin creates rental: lockerId, memberId, startDate
- Duration: 1 month default
- Locker status changes: 'available' → 'occupied' (assigned)
- Fee: ₱500 (hardcoded)

**3. Renewal**
- Before expiry, member can renew
- New rental created
- renewalCount incremented
- expiryDate extended by ~1 month

**4. Maintenance**
- Admin marks locker: status = 'maintenance'
- Rentals cannot be created for maintenance lockers

**5. Replacement**
- Member requests new locker (locker_replacement table)
- Admin approves and assigns replacement
- Old locker returned to 'available'

**Database:**
- lockers: Core locker registry
- locker_rentals: Active/expired/renewed rentals
- locker_replacements: Replacement requests

**Frontend:**
- Two tabs: Registry | Rentals
- CRUD operations with forms
- Status filtering and badges

### 4.3 Sales/Inventory POS System

**Products (20+ SKUs):**
- Uniforms: Type A&B, Type C, Gala, BSNAME, PE shirts/pants/shorts
- Accessories: Lanyard, ID Case, Pershing Cap
- Equipment: Hard Bound, Safety Shoes, Goggles, Cover All, Gloves, Hard Hat, Plotting Sheet

**Features per Product:**
- SKU code
- Category classification
- Stock quantity tracking
- Unit price
- Product note (e.g., "See Coop office for sizing")
- Options: size choices, color variants, bundle selections

**POS Workflow:**
1. Cashier selects products
2. Adds to cart (qty + options)
3. Calculates total
4. Selects payment method (CASH/EWALLET)
5. Checkout → generates receipt number
6. Sale record created

**Inventory Management:**
- Admin adds/edits/deletes products
- Stock levels tracked
- Low stock alerts (≤5 units)
- Automatic price calculation per size variant

**Database:**
- inventory: Product catalog
- sales: Transaction records
- Linking: sales.item_id → inventory.id

**Frontend:**
- Two tabs: Inventory Management | POS
- Inventory table with edit/delete actions
- Shopping cart with item removal
- Receipt number auto-generation

### 4.4 Key Duplication Workflow

**Phases:**

**1. Request Submission**
- Member selects reason: Lost, Spare, Damaged
- Submits request
- Status: 'pending'
- Fee recorded (configurable per reason)

**2. Admin Approval**
- Admin views pending requests
- Approves or rejects with justification
- Status: 'approved' or 'rejected'

**3. Key Release**
- Approved request
- Cashier prepares key
- Mark as 'released'
- Member picks up key

**Database:**
- key_requests table
- Fields: user_id, status, created_at, completed_at

**API Endpoints:**
- GET /api/keys - List all
- POST /api/keys - Create request
- PUT /api/keys/:id - Update status (admin only)

**Frontend:**
- Request submission form
- Admin dashboard with approve/reject buttons
- Release tracking

### 4.5 Membership System

**User Roles (4-tier):**
1. **user/student** - Regular student members
2. **staff** - Cooperative employees (subtypes: cashier, locker_officer, inventory_officer)
3. **admin** - System administrators
4. **member** - (Legacy/transition role, not actively used)

**Student Fields:**
- id_number: Student ID (e.g., "2024-12345")
- course: Degree program (BSMT, BSMARE, BSNAME, HM, TOURISM, SHS, JHS)
- year: Academic level (1st-4th for college, 11th-12th for SHS, 7th-10th for JHS)

**Membership Status:**
- none: Not a member
- pending: Application submitted, awaiting approval
- approved: Full member with all privileges
- rejected: Application denied

**Staff Features:**
- Unique staffType assignment
- Access to admin features (partial)
- Role-based endpoint access

**Workflow:**
1. Student registers → status = 'pending'
2. Student membership request submitted
3. Admin approves → status = 'approved'
4. Student can now access member features

---

## Part 5: Build & Configuration

### 5.1 Frontend Configuration

#### Vite (vite.config.ts)
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'  // Backend proxy
    }
  },
  build: {
    target: 'ES2020',
    minify: 'terser',
    outDir: 'dist'
  }
})
```

#### TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["src/*"] }
  }
}
```

#### Tailwind CSS (tailwind.config.js)
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { /* Purple/Green theme */ },
      keyframes: {
        'fade-in', 'scale-in', 'slide-in-*', 'slide-down'
      },
      animation: {
        // Multiple variants: base (0.5s), long (0.7-0.8s)
      }
    }
  }
}
```

#### PostCSS (postcss.config.js)
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

### 5.2 Backend Configuration

#### TypeScript (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  }
}
```

#### Scripts (package.json)
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",     // Development
    "build": "tsc",                       // Compile TypeScript
    "start": "node dist/server.js",       // Run compiled JS
    "typecheck": "tsc --noEmit"           // Type check only
  }
}
```

### 5.3 Build Commands

**Frontend:**
```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Compile to dist/
npm run preview          # Preview production build
```

**Backend:**
```bash
npm install              # Install dependencies
npm run dev              # Start with tsx watch
npm run build            # Compile TypeScript
npm run start            # Run compiled server
npm run typecheck        # Check types without emitting
```

### 5.4 Dependencies Summary

**Frontend Key Packages:**
- React 18.3, React Router DOM 6.30
- Zustand 4.4 (state)
- Tailwind CSS 3.4, PostCSS 8.5
- Vite 7.0, TypeScript 5.8
- Framer Motion 11.0, GSAP 3.13, Three.js 0.179
- Lucide React (icons)
- Zod 3.25 (validation)

**Backend Key Packages:**
- Express 4.18, TypeScript 5.3
- PostgreSQL (pg 8.11)
- JWT 9.0, bcryptjs 2.4
- CORS 2.8, express-validator 7.0
- dotenv 16.3, axios 1.6

---

## Part 6: Current Implementation Status & Architecture Patterns

### 6.1 Completed Features

✅ **Authentication**
- Login/register with email or student ID
- JWT token generation (7-day expiration)
- Session persistence (localStorage)
- Token validation on protected routes

✅ **Role-Based Access Control**
- 4-tier role system fully implemented
- Frontend UI filtering by role
- Backend route protection by role
- Staff subtypes (cashier, locker_officer, inventory_officer)

✅ **Core Modules**
- Dashboard (with role-specific views)
- Locker Management (full CRUD)
- Sales/Inventory POS (with shopping cart)
- Key Duplication (request workflow)
- Member Management (CRUD + status tracking)
- Billing (with role-based visibility)
- Reports (aggregated analytics)
- DTR (time tracking and CSV export)

✅ **UI/UX**
- Responsive design (mobile → desktop)
- Smooth animations and transitions
- Gradient color scheme (purple/green)
- Toast notifications
- Error boundaries

✅ **Database**
- PostgreSQL schema with 8 core tables
- UUID primary keys
- Index optimization
- Foreign key relationships with cascades

✅ **API Layer**
- RESTful endpoints following REST conventions
- Consistent request/response format
- Error handling with status codes
- Token-based authentication

### 6.2 Partially Complete Features

🟡 **Membership Approval Workflow**
- Database schema exists
- API routes exist
- Frontend UI needs refinement
- Integration between student signup and membership request needs work

🟡 **Reports Module**
- Basic aggregation queries implemented
- Infrastructure present
- Could benefit from more sophisticated analytics

### 6.3 Component & Naming Patterns

**Components:**
- Functional components with hooks
- Props interface per component
- Prop destructuring in component parameters

**Files:**
- PascalCase: component files (DashboardPage.tsx)
- camelCase: utilities and hooks
- snake_case: database columns
- CONSTANT_CASE: enums and constants (ITEM_INVENTORY)

**Styling:**
- Tailwind utilities exclusively (no CSS files in components)
- Responsive classes (md:, lg:)
- Hover/focus states
- Animation utility classes

**State Management:**
- Page-level state via Zustand stores
- Local state for forms
- Context API for authentication
- localStorage for persistence

### 6.4 Error Handling Patterns

**Frontend:**
1. API calls wrapped in try-catch
2. Error stored in component/store state
3. User notified via toast
4. Logging to console for debugging

**Backend:**
1. Route-level try-catch in handlers
2. HTTP status codes used meaningfully
3. Error middleware for consistent responses
4. Detailed logging to console
5. Stack traces in development mode

### 6.5 Data Flow

```
User Action
  ↓
Event Handler (onClick, onSubmit)
  ↓
API Call (apiClient.method())
  ↓
Backend Route Handler
  ↓
Database Query (or middleware logic)
  ↓
Response (JSON with 2xx/4xx/5xx status)
  ↓
Frontend Error/Success Handling
  ↓
Update Zustand Store
  ↓
Component Re-render
  ↓
Update UI (toast notification)
```

### 6.6 Database Patterns

- **UUIDs**: All primary keys are UUID v4 (database-generated)
- **Timestamps**: created_at and updated_at on all tables
- **Status Fields**: Enums via CHECK constraints
- **Foreign Keys**: ON DELETE CASCADE for data integrity
- **Indexes**: On frequently queried columns (email, role, status fields)
- **Joins**: Multi-table queries in complex endpoints (e.g., reports)

---

## Part 7: File Organization & Key Files Summary

### Frontend Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/App.tsx` | Root component with routing | ~50 |
| `src/main.tsx` | Application entry point | ~15 |
| `src/store/appStore.ts` | Business data state | ~250 |
| `src/store/authContext.tsx` | Authentication state | ~150 |
| `src/store/uiStore.ts` | UI state | ~50 |
| `src/services/api.ts` | API client class | ~300+ |
| `src/types/index.ts` | TypeScript interfaces | ~150+ |
| `src/pages/DashboardPage.tsx` | Main dashboard | ~200 |
| `src/pages/SalesInventoryPage.tsx` | POS system | ~300+ |
| `src/pages/LockerManagementPage.tsx` | Locker CRUD | ~250+ |
| `src/pages/DTRPage.tsx` | Time tracking | ~200+ |
| `src/components/Sidebar.tsx` | Navigation | ~150+ |
| `src/components/Header.tsx` | Top bar | ~150+ |
| `tailwind.config.js` | Styling config | ~50 |

### Backend Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `backend/src/server.ts` | Express setup | ~55 |
| `backend/src/config/config.ts` | Configuration | ~25 |
| `backend/src/config/database.ts` | DB connection | ~30 |
| `backend/src/middleware/auth.ts` | JWT middleware | ~50 |
| `backend/src/middleware/errorHandler.ts` | Error handling | ~25 |
| `backend/src/routes/auth.ts` | Auth endpoints | ~150+ |
| `backend/src/routes/users.ts` | User endpoints | ~250+ |
| `backend/src/routes/lockers.ts` | Locker endpoints | ~120+ |
| `backend/src/routes/inventory.ts` | Inventory endpoints | ~120+ |
| `backend/src/routes/keys.ts` | Key endpoints | ~75+ |
| `backend/src/routes/billing.ts` | Billing endpoints | ~100+ |
| `backend/src/routes/reports.ts` | Report endpoints | ~85+ |
| `backend/src/database/schema.sql` | Database schema | ~150+ |
| `backend/src/types/index.ts` | TypeScript types | ~75+ |
| `backend/tsconfig.json` | TS config | ~30 |

---

## Summary of Architecture

The UC-METC Coop system follows a modern, layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                              │
│  React Components → Zustand/Context State → API Calls       │
└─────────────────────────────────────────────────────────────┘
                            ↕ (HTTP + JSON)
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER (Express)                        │
│  Route Handlers → Middleware Chain → Database Queries        │
└─────────────────────────────────────────────────────────────┘
                            ↕ (SQL)
┌─────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (PostgreSQL)                     │
│  Tables → Indexes → Relationships → Data Persistence        │
└─────────────────────────────────────────────────────────────┘
```

**Key Design Principles:**
1. **Separation of Concerns**: UI, business logic, data access layers
2. **Type Safety**: Full TypeScript coverage across stack
3. **Security**: JWT auth, role-based access, password hashing
4. **Scalability**: Modular routes, indexed queries, connection pooling
5. **Maintainability**: Clear naming, consistent patterns, comprehensive types

---

## Recommendations for Future Development

1. **Environment Secrets**: Move JWT_SECRET and DB_PASSWORD to secure vault (not in code)
2. **API Documentation**: Add Swagger/OpenAPI documentation
3. **Testing**: Add unit tests (Jest) and integration tests (Supertest)
4. **Logging**: Replace console.log with structured logging (Winston, Pino)
5. **Caching**: Implement Redis for frequently accessed data
6. **Monitoring**: Add error tracking (Sentry) and performance monitoring
7. **Authentication**: Consider OAuth2 or SSO integration
8. **Validation**: Add express-validator to all routes for input validation
9. **Rate Limiting**: Protect endpoints from abuse
10. **Database Migrations**: Implement migration tool (Knex, TypeORM)

