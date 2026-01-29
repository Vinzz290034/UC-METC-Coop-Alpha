# UC METC Coop Backend

Express.js + PostgreSQL backend for the UC METC Cooperative Management System.

## Setup

1. Copy `.env.example` to `.env` and fill in your database credentials:
```bash
cp .env.example .env
```

2. Install dependencies:
```bash
npm install
```

3. Create PostgreSQL database:
```bash
createdb uc_metc_coop
```

4. Run database migrations to set up tables:
```bash
npm run migrate
```

5. Start development server:
```bash
npm run dev
```

Server runs on `http://localhost:5000`

## API Routes

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Lockers
- `GET /api/lockers` - Get all lockers
- `POST /api/lockers` - Create locker (admin only)
- `PUT /api/lockers/:id` - Update locker
- `DELETE /api/lockers/:id` - Delete locker (admin only)
- `POST /api/lockers/:id/assign` - Assign locker to member

### Sales & Inventory
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Add inventory item (admin only)
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `POST /api/sales` - Create sale

### Key Duplication
- `GET /api/keys` - Get all key requests
- `POST /api/keys` - Create key duplication request
- `PUT /api/keys/:id` - Update key request status

### Billing
- `GET /api/billing` - Get billing records
- `POST /api/billing` - Create billing record
- `PUT /api/billing/:id` - Update billing status

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/members` - Members report

## Database Schema

See `src/database/schema.sql` for complete database schema.

## Project Structure

```
src/
├── server.ts              # Express app setup
├── config/
│   ├── database.ts        # Database configuration
│   └── constants.ts       # App constants
├── middleware/
│   ├── auth.ts            # JWT authentication
│   └── errorHandler.ts    # Error handling
├── routes/
│   ├── auth.ts
│   ├── users.ts
│   ├── lockers.ts
│   ├── inventory.ts
│   ├── keys.ts
│   ├── billing.ts
│   └── reports.ts
├── controllers/           # Request handlers
├── models/               # Database queries
├── types/                # TypeScript types
└── database/
    └── schema.sql        # Database schema
```
