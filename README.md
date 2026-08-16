# UC METC SILMS - Sales, Inventory, Locker, and Membership System (v2.4.0)

A modern, high-performance web application designed for the **University of Cebu METC Cooperative (UC METC Coop)**. SILMS streamlines campus merchandise sales, inventory tracking, locker rental management, membership onboarding, class ring customizer logs, financial breakdown reporting, and user security settings.

---

## 🎯 System Modules & Features

### 🛍️ Merchandise & Sales
- **POS & Online Ordering:** Multi-product catalog with variant selection, shopping cart, and instant order placement.
- **Payment Gateway Options:** Supports Cash, GCash, and Downpayment options.
- **Class Ring Customization System:** Digital ordering for maritime graduation class rings (steel, brass, gold quotes, birthstones, ring sizing, inside ring engraving).
- **Segregated Trust Account Tracking:** Dedicated isolation of Royal Gem Jewelers class ring funds from general Cooperative revenue.
- **Class Ring Availability Toggle:** Admin switch to open/close student class ring ordering in real-time.

### 🔑 Locker Management
- **Locker Allocation & Rentals:** Digital locker selection, status tracking (Available, Occupied, Under Maintenance).
- **Locker Agreement Validation:** Mandatory 4-term agreement check before rental confirmation.
- **Automated Expiration Tracking:** Term-end rules (June–Dec rentals expire Dec 19; Jan–May rentals expire in May).
- **Locker Income Integration:** Automated aggregation of locker fees into financial reports.

### ⚙️ User Settings & Security (v2.4.0)
- **Idle Session Timeout:** Sliding toggle switch with configurable auto-logout periods (15 Mins, 30 Mins, 1 Hour, 2 Hours) to protect accounts on shared campus terminals.
- **Notification Preferences:** Toggle switches for email receipts, locker expiry alerts, and announcement notifications.
- **Role-Based Views:** Tailored settings layouts for Students vs Admin/Staff accounts.

### 📊 Financial & Analytics Reports
- **Income Breakdown Report:** Real-time multi-stream financial comparison across Product Sales, Locker Services, and Student Insurance.
- **Sales & Transaction Logs:** Exportable Excel/CSV report generation with remittance tracking and receipt printing.

### 👥 User Roles & Access Control
- **admin** - System administration, report exports, setting toggles, user management.
- **staff** - Operational cashiers, inventory managers, and locker officers.
- **user (student)** - Regular campus users, locker renters, and merchandise buyers.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Vanilla CSS design system tokens)
- **State Management:** Zustand
- **Icons:** Lucide React
- **Routing:** React Router DOM v6

### Backend
- **Runtime:** Node.js & Express (TypeScript)
- **Database:** PostgreSQL (or SQLite local fallback)
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs
- **Real-Time Communication:** Socket.io (WebSocket notifications)
- **Email Service:** Nodemailer & SendGrid API

---

## 🚀 Quick Start & Development

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/Vinzz290034/UC-METC-Coop-Alpha.git
cd UC-METC-Coop-Alpha

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Setup

**Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

**Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=uc_coop
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:5173
```

### 3. Run Development Server

```bash
# Start frontend dev server
npm run dev

# Start backend dev server (in backend directory)
cd backend && npm run dev
```

App URL: **http://localhost:5173**

---

## 🔐 Default Admin Credentials (Development)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@uc-metc.com` | `admin123` |
| **Staff** | `staff@uc-metc.com` | `staff123` |
| **User** | `user@uc-metc.com` | `user123` |

---

## 📁 Repository Structure

```
├── src/
│   ├── components/         # Reusable UI components (Sidebar, FloatingSelect, Layout)
│   ├── pages/              # Primary view pages (SettingsPage, SalesPage, LockerPage, ReportsPage)
│   ├── store/              # Zustand state stores (authContext, uiStore)
│   ├── hooks/              # Custom React hooks (useSessionTimeout)
│   ├── types/              # TypeScript interfaces & types
│   └── services/           # API client services
├── backend/
│   └── src/                # Express API routes, database models, and socket handlers
├── README.md               # Application documentation
└── vite.config.ts          # Vite build configuration
```

---

## 📄 License & Attribution

Developed for **University of Cebu METC Cooperative**. All rights reserved.  
**Version:** `v2.4.0 (Production Alpha)`
