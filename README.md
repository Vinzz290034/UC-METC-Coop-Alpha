# UC METC SILMS - Sales, Inventory, Locker, and Membership System

A comprehensive web-based management system for UC METC Cooperative, handling merchandise sales, inventory tracking, locker management, membership, billing, and notifications.

## 🎯 Features

- **Merchandise Management** - Product catalog with variants, shopping cart, checkout
- **Order Processing** - Transaction tracking, receipt generation, payment methods (Cash/GCash)
- **Inventory System** - Stock tracking, low-stock alerts, product variants
- **Locker Management** - Assignment, rental, renewal, key duplication requests
- **Membership System** - Request submission, approval workflow, member profiles
- **Billing & Payments** - Multiple billing types, payment status tracking
- **Notifications** - Real-time WebSocket notifications with auto-cleanup
- **Messaging** - User-to-user messaging system
- **Announcements** - System-wide announcements with categories
- **Reports & Analytics** - Sales, inventory, and member reports
- **Password Reset** - Email-based password reset with SendGrid

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Socket.io Client** - Real-time updates

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Socket.io** - WebSocket server
- **Nodemailer** - Email service
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Git**

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd uc-metc-silms
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb uc_coop

# Run schema
psql uc_coop < backend/src/database/schema.sql
```

### 4. Environment Configuration

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (backend/.env):**
```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uc_coop
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (SendGrid)
EMAIL_SERVICE=SendGrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=your-email@gmail.com
```

### 5. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

Visit: **http://localhost:5173**

## 📧 Email Setup (SendGrid)

1. Create account at https://signup.sendgrid.com/
2. Generate API key (Settings → API Keys)
3. Verify sender email (Settings → Sender Authentication)
4. Update `backend/.env` with credentials

See `SENDGRID_SETUP_GUIDE.md` for detailed instructions.

## 🚢 Production Deployment

### Recommended: Railway

1. **Sign up:** https://railway.app/
2. **Install CLI:** `npm install -g @railway/cli`
3. **Deploy:**
   ```bash
   railway init
   railway add postgresql
   railway up
   ```
4. **Set environment variables** in Railway dashboard
5. **Update CORS_ORIGIN** to your frontend URL

See `PRODUCTION_DEPLOYMENT_PLAN.md` for complete guide.

### Cost Estimate
- **Free Tier:** $0/month (₱0) - Good for 100-300 users
- **Pro Tier:** $30-40/month (₱1,740-2,320) - Good for 1000-2000 users
- **SendGrid:** FREE (100 emails/day)

## 📁 Project Structure

```
uc-metc-silms/
├── src/                    # Frontend source
│   ├── pages/             # Page components
│   ├── components/        # Reusable components
│   ├── store/             # Zustand stores
│   ├── services/          # API client
│   ├── types/             # TypeScript types
│   └── assets/            # Images, fonts
├── backend/               # Backend source
│   └── src/
│       ├── routes/        # API endpoints
│       ├── middleware/    # Auth, error handling
│       ├── services/      # Business logic
│       ├── database/      # Schema, migrations
│       ├── websocket/     # Socket.io server
│       └── config/        # Configuration
├── .env                   # Frontend environment
├── backend/.env           # Backend environment
└── README.md             # This file
```

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@ucmetc.edu`
- Password: `admin123`

**Test User:**
- Email: `test@example.com`
- Password: `password123`

⚠️ **Change these in production!**

## 🧪 Testing

```bash
# Frontend
npm run build
npm run preview

# Backend
cd backend
npm run build
npm start
```

## 📊 User Roles

- **admin** - Full system access
- **staff** - Staff operations (cashier, locker officer, inventory)
- **member** - Approved members with limited access
- **user** - Regular students/users

## 🔧 Common Commands

```bash
# Development
npm run dev                 # Start frontend dev server
cd backend && npm run dev   # Start backend dev server

# Build
npm run build              # Build frontend
cd backend && npm run build # Build backend

# Production
npm run preview            # Preview frontend build
cd backend && npm start    # Start backend production
```

## 🐛 Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running
- Verify database credentials in `backend/.env`
- Ensure database exists: `createdb uc_coop`

### Email Not Sending
- Verify SendGrid API key is correct
- Check sender email is verified
- Review backend logs for errors

### Frontend Can't Reach Backend
- Check `VITE_API_URL` in `.env`
- Verify backend is running on port 5000
- Check CORS settings in `backend/.env`

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review backend logs
3. Check browser console for frontend errors

## 📄 License

This project is for UC METC internal use only.

## 👥 Contributors

Developed for UC METC Cooperative

---

**Version:** 1.0.0  
**Last Updated:** 2026
