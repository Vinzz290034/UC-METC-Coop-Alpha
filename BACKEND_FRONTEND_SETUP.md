# UC METC Coop - Complete Backend & Frontend Setup

## ✅ What's Been Created

### Backend Setup
```
backend/
├── src/
│   ├── config/
│   │   ├── config.ts        # Environment config
│   │   └── database.ts      # PostgreSQL connection
│   ├── database/
│   │   └── schema.sql       # Database schema
│   ├── middleware/
│   │   ├── auth.ts          # JWT authentication
│   │   └── errorHandler.ts  # Error handling
│   ├── routes/              # 7 API modules
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── lockers.ts
│   │   ├── inventory.ts
│   │   ├── keys.ts
│   │   ├── billing.ts
│   │   └── reports.ts
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   └── server.ts            # Express app
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
└── SETUP.md
```

### Frontend Integration
- ✅ `src/services/api.ts` - Complete API client with all endpoints
- ✅ `src/store/authStore.ts` - Updated with backend login/register
- ✅ `src/pages/LoginPage.tsx` - Connected to backend API
- ✅ `.env` - API URL configuration

## 🗄️ Database Schema

6 tables created:
1. **users** - User accounts with roles
2. **lockers** - Storage lockers for members
3. **inventory** - Product inventory
4. **sales** - Sales transactions
5. **key_requests** - Key duplication requests
6. **billing** - Billing records

All with proper indexes and constraints.

## 🔐 Authentication

### How It Works
1. User signs up via frontend form
2. Password is hashed on backend with bcryptjs
3. Backend returns JWT token
4. Token stored in localStorage
5. Token included in all API requests
6. Backend validates token on each request

### User Roles
- admin
- manager
- cashier
- locker_officer
- inventory_officer
- member

## 📡 API Endpoints

### Auth (No authentication needed)
```
POST   /api/auth/login              # Login
POST   /api/auth/register           # Register
```

### Users (Authenticated)
```
GET    /api/users                   # Get all (admin only)
GET    /api/users/:id               # Get one
PUT    /api/users/:id               # Update
DELETE /api/users/:id               # Delete (admin only)
```

### Lockers (Authenticated)
```
GET    /api/lockers
POST   /api/lockers                 # Create (admin)
PUT    /api/lockers/:id             # Update status
POST   /api/lockers/:id/assign      # Assign to member
DELETE /api/lockers/:id             # Delete (admin)
```

### Inventory (Authenticated)
```
GET    /api/inventory
POST   /api/inventory               # Create (admin)
PUT    /api/inventory/:id           # Update
DELETE /api/inventory/:id           # Delete
```

### Key Requests (Authenticated)
```
GET    /api/keys
POST   /api/keys                    # Create request
PUT    /api/keys/:id                # Update status (admin)
```

### Billing (Authenticated)
```
GET    /api/billing                 # Get records
POST   /api/billing                 # Create (admin)
PUT    /api/billing/:id             # Update status
```

### Reports (Admin only)
```
GET    /api/reports/sales
GET    /api/reports/inventory
GET    /api/reports/members
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Step 1: Database Setup
```bash
# Create database
createdb uc_metc_coop

# Load schema
psql -U postgres -d uc_metc_coop -f backend/src/database/schema.sql

# Verify
psql -U postgres -d uc_metc_coop -c "\dt"
```

### Step 2: Backend Setup
```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# DB_USER=postgres
# DB_PASSWORD=your_password
# etc.

# Install dependencies
npm install

# Test TypeScript
npm run typecheck

# Start development server
npm run dev
# Server at http://localhost:5000
```

### Step 3: Test Backend
```bash
# In another terminal
curl http://localhost:5000/health
# Response: {"status":"ok","message":"UC METC Coop Backend running"}
```

### Step 4: Frontend Setup
```bash
cd ..  # Go to root directory

# .env already has API_URL configured
# No additional setup needed

# Start frontend
npm run dev
# Frontend at http://localhost:5173
```

## ✅ Testing the Integration

### Test Registration
1. Go to http://localhost:5173
2. Click "Sign up" or "Register here"
3. Fill in the form and submit
4. Should see loading state, then navigate to dashboard

### Test Login
1. Go to http://localhost:5173
2. Enter email and password from registration
3. Click "LOGIN"
4. Should navigate to dashboard

### Test API Directly
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Response includes token and user data
# Copy the token

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'

# Get Users (with token)
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Database Verification

```bash
# Connect to database
psql -U postgres -d uc_metc_coop

# List tables
\dt

# View users table
SELECT * FROM users;

# View lockers
SELECT * FROM lockers;

# Exit
\q
```

## 🔗 Frontend Usage Examples

### Login (already implemented)
```typescript
import { useAuthStore } from '../store/authStore';

const { login } = useAuthStore();

try {
  await login('user@example.com', 'password123');
  // User is logged in, token stored
  navigate('/dashboard');
} catch (err) {
  console.error(err);
}
```

### Get Data from API
```typescript
import { apiClient } from '../services/api';

// Get all lockers
const result = await apiClient.getLockers();
console.log(result.lockers);

// Create locker (admin)
const newLocker = await apiClient.createLocker('A-001');

// Get inventory
const inventory = await apiClient.getInventory();
```

### Check User Role
```typescript
import { useAuthStore } from '../store/authStore';

const { hasRole } = useAuthStore();

if (hasRole('admin')) {
  // Show admin features
}

if (hasRole(['admin', 'manager'])) {
  // Show management features
}
```

## 🐛 Common Issues & Solutions

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port in backend/.env
PORT=5001
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_ctl status

# Start PostgreSQL
pg_ctl -D /usr/local/var/postgres start

# Or on Linux
sudo service postgresql start
```

### CORS Error
- Backend CORS is set to `http://localhost:5173`
- If using different frontend URL, update `CORS_ORIGIN` in `backend/.env`

### Token Expired
- Tokens expire based on `JWT_EXPIRES_IN` in `.env` (default 7d)
- Users must log in again when token expires
- Implement refresh token endpoint for auto-refresh

## 📝 Environment Variables

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
```

### Backend `backend/.env`
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uc_metc_coop
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## 🔄 Next Steps

1. **Implement Dashboard Pages**
   - Fetch user data from `/api/users/:id`
   - Display locker status from `/api/lockers`
   - Show inventory from `/api/inventory`

2. **Add Admin Features**
   - User management dashboard
   - Inventory management
   - Billing management

3. **Implement Reports**
   - Connect reports page to `/api/reports/*` endpoints
   - Display sales analytics
   - Show inventory statistics

4. **Add More Features**
   - Locker assignment
   - Key request management
   - Billing payments

5. **Security Enhancements**
   - Implement password reset
   - Add email verification
   - Implement refresh tokens
   - Rate limiting

6. **Deployment**
   - Set up environment variables for production
   - Change JWT_SECRET in production
   - Use strong database password
   - Configure HTTPS
   - Set NODE_ENV=production

## 📚 Documentation

- Backend API: `backend/README.md`
- Backend Setup: `backend/SETUP.md`
- Frontend Integration: `INTEGRATION.md`
- This file: `BACKEND_FRONTEND_SETUP.md`

## ✨ You're Ready!

Both backend and frontend are fully integrated:
- ✅ Database schema created
- ✅ Backend API server ready
- ✅ Frontend API client configured
- ✅ Authentication flow implemented
- ✅ All endpoints available

Start both servers and test the full flow!
