# Backend Setup Guide

## Quick Start

### 1. Prerequisites
- **Node.js 18+** (for running the backend)
- **PostgreSQL 12+** (for database)

### 2. Database Setup

#### Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE uc_metc_coop;

# Exit
\q
```

#### Run Schema
```bash
cd backend
psql -U postgres -d uc_metc_coop -f src/database/schema.sql
```

### 3. Environment Configuration
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uc_metc_coop
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Development Server
```bash
npm run dev
```

Server will start at `http://localhost:5000`

## API Testing

### Create Admin User (for testing)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response will include JWT token to use in subsequent requests.

### Example: Get Users
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── config.ts        # Environment & app config
│   │   └── database.ts      # PostgreSQL connection
│   ├── database/
│   │   └── schema.sql       # Database schema
│   ├── middleware/
│   │   ├── auth.ts          # JWT authentication
│   │   └── errorHandler.ts  # Global error handling
│   ├── routes/              # API route handlers
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── lockers.ts
│   │   ├── inventory.ts
│   │   ├── keys.ts
│   │   ├── billing.ts
│   │   └── reports.ts
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   └── server.ts            # Express app entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Database Tables

### users
- User accounts with roles and status
- Fields: id, email, password, first_name, last_name, role, status

### lockers
- Storage lockers for members
- Fields: id, locker_number, status, assigned_to

### inventory
- Product inventory for sales
- Fields: id, name, description, quantity, unit_price, category

### sales
- Sales transactions
- Fields: id, item_id, quantity, total_amount, created_by

### key_requests
- Key duplication requests
- Fields: id, user_id, status, created_at, completed_at

### billing
- Billing records for charges
- Fields: id, user_id, amount, type, status, due_date

## User Roles

- **admin** - Full system access
- **manager** - High-level management
- **cashier** - Handle sales transactions
- **locker_officer** - Manage locker assignments
- **inventory_officer** - Manage inventory
- **member** - Regular member (limited access)

## Environment Variables

See `.env.example` for all configuration options.

## Troubleshooting

### Connection Error
```
✗ Database connection failed
```
**Solution**: Ensure PostgreSQL is running and credentials in `.env` are correct.

### Port Already in Use
```
listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change PORT in `.env` or kill process on port 5000.

### TypeScript Errors
```bash
npm run typecheck
```

## API Documentation

See `README.md` for complete API endpoint documentation.
