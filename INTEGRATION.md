# UC METC Coop - Frontend & Backend Integration Guide

## ✅ Completed Setup

### Backend ✓
- Express.js server with TypeScript
- PostgreSQL database schema
- JWT authentication
- 7 API endpoints for all features
- Environment configuration

### Frontend ✓
- API service client (`src/services/api.ts`)
- Updated auth store with backend integration
- Login, Sign Up, and Membership registration connected to API
- Environment configuration for API URL

## 🚀 Quick Start

### Step 1: PostgreSQL Setup
```bash
# Create database
createdb uc_metc_coop

# Load schema
psql -U postgres -d uc_metc_coop -f backend/src/database/schema.sql
```

### Step 2: Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm install
```

### Step 3: Start Backend
```bash
cd backend
npm run dev
# Server runs at http://localhost:5000
```

### Step 4: Start Frontend
In a new terminal:
```bash
npm run dev
# Frontend runs at http://localhost:5173
```

## 🔗 API Integration

### Authentication Flow
1. User enters email/password in LoginPage
2. Frontend calls `apiClient.login(email, password)`
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. All subsequent requests include token in Authorization header

### User Registration
- Sign Up: Creates regular member accounts
- Membership Registration: Creates member accounts with additional data
- Both call `apiClient.register()` which hits backend `/api/auth/register`

### Automatic Token Management
- Token is automatically added to all API requests
- Token is stored in localStorage and retrieved on page reload
- User session persists across browser restarts

## 📝 Test Credentials

After creating a user via the registration form, you can log in with those credentials.

To test quickly, create a user through the API:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "role": "member"
  }'
```

Then login with those credentials in the app.

## 🛠️ Available Endpoints

### Auth
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)

### Lockers
- `GET /api/lockers` - Get all lockers
- `POST /api/lockers` - Create locker (admin)
- `PUT /api/lockers/:id` - Update locker status
- `POST /api/lockers/:id/assign` - Assign to member
- `DELETE /api/lockers/:id` - Delete locker

### Inventory
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Add item (admin)
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item

### More Endpoints
See `backend/README.md` for complete API documentation.

## 📁 Key Files

### Backend
- `backend/src/server.ts` - Express app setup
- `backend/src/routes/*` - API endpoints
- `backend/src/config/database.ts` - Database connection
- `backend/src/database/schema.sql` - Database schema

### Frontend
- `src/services/api.ts` - API client (NEW)
- `src/store/authStore.ts` - Auth state management (UPDATED)
- `src/pages/LoginPage.tsx` - Login/Register (UPDATED)
- `.env` - API URL configuration (NEW)

## 🐛 Troubleshooting

### Connection Refused
**Error**: `Connection refused at http://localhost:5000`
- Ensure backend is running: `npm run dev` in backend folder
- Check backend is on port 5000 in `.env`

### Invalid Token
**Error**: `Invalid or expired token`
- Clear localStorage: `localStorage.clear()` in browser console
- Log in again

### Database Connection Error
**Error**: `Failed to connect to database`
- Ensure PostgreSQL is running: `pg_ctl -D /usr/local/var/postgres start`
- Check credentials in `backend/.env`
- Verify database exists: `psql -l | grep uc_metc`

### CORS Error
**Error**: `Cross-Origin Request Blocked`
- Backend CORS is configured for `http://localhost:5173`
- If using different URL, update `CORS_ORIGIN` in `backend/.env`

## 📦 Environment Variables

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uc_metc_coop
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_super_secret_jwt_key_change_in_production
CORS_ORIGIN=http://localhost:5173
```

## ✨ Next Steps

1. Test registration and login with backend
2. Implement dashboard pages to fetch user data
3. Add inventory management to DashboardPage
4. Connect reports endpoints for analytics
5. Add locker management functionality
6. Implement billing and key request features

All backend endpoints are ready to use!
