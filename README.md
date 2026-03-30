#  UC METC Coop System

This is a comprehensive React application built for managing the University of Cebu - METC Multipurpose Cooperative services, tailored specifically for seaman cooperative operations.

## Project Status

- **Project Type**: React + TypeScript Modern Web Application
- **Entry Point**: `src/main.tsx` (React application entry)
- **Build System**: Vite 7.0.0 (Fast development and build)
- **Styling System**: Tailwind CSS 3.4.17 (Atomic CSS framework)
- **State Management**: Zustand for lightweight state management
- **Build Status**: ✅ Production build successful

## System Overview

The system is designed to centralize and streamline operations for the METC Cooperative, providing a modern interface for managing:

### Core Modules Implemented

1. **Landing Page** - Appealing public-facing page with navigation and quick login button
2. **Dashboard** - Comprehensive overview with key metrics and alerts
3. **Locker Management** - Complete locker registration, rental, and renewal workflows
4. **Sales & Inventory** - POS system with uniform and accessory inventory tracking
5. **Key Duplication Management** - Request tracking and approval workflow
6. **Member Management** - Member profiles with linked services
7. **Billing & Payments** - Unified billing, transaction history, and revenue tracking
8. **Reports & Analytics** - Comprehensive reporting on sales, inventory, lockers, keys, and income

### Features

- **Landing Page**: Modern, appealing design with quick login button directing to login page
- **Role-Based Access Control**: Admin, Cashier, Locker Officer, Inventory Officer, Manager roles
- **Authentication**: Secure login with demo accounts for testing
- **Responsive Design**: Works seamlessly on desktop and tablet devices
- **Modern UI/UX**: Contemporary design with smooth interactions and transitions
- **Real-Time Updates**: Zustand state management for instant data synchronization
- **Data Validation**: TypeScript for type-safe development
- **Functional Buttons**: All action buttons now properly functional with data persistence

### Recent Improvements

- ✅ Added appealing landing page with feature showcase
- ✅ Implemented login navigation from landing page
- ✅ Fixed Key Duplication approval/rejection buttons with functional handlers
- ✅ Fixed Locker Management view/edit buttons with working functionality
- ✅ Fixed Locker rental form to properly reset and update locker status
- ✅ All buttons now have proper event handlers and provide user feedback

## Architecture

### Directory Structure

```
project-root/
├── src/
│   ├── components/          # Reusable components (Sidebar, Header, ProtectedRoute)
│   ├── pages/               # Page components for each module
│   │   ├── LandingPage.tsx  # Public landing page
│   │   ├── LoginPage.tsx    # Authentication
│   │   ├── DashboardPage.tsx
│   │   ├── LockerManagementPage.tsx
│   │   ├── SalesInventoryPage.tsx
│   │   ├── KeyDuplicationPage.tsx
│   │   ├── MembersPage.tsx
│   │   ├── BillingPage.tsx
│   │   └── ReportsPage.tsx
│   ├── store/               # Zustand state management stores
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── dist/                    # Build output directory
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── tailwind.config.js       # Tailwind CSS configuration
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

## Authentication

The system uses JWT-based authentication with secure password hashing. Users can register through the application or be added directly via the database.

## Role-Based Access

- **Admin**: Full system access
- **Cashier**: Sales, inventory, and billing access
- **Locker Officer**: Locker management and key duplication access
- **Inventory Officer**: Inventory management access
- **Manager**: Members, reports, and approvals access

## Technology Stack

- **React 18.3.1** - UI framework
- **TypeScript 5.8.3** - Type-safe development
- **Vite 7.0.0** - Build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **Zustand 4.4.7** - State management
- **React Router 6.30.1** - Client-side routing
- **Lucide React 0.533.0** - Icon library
- **Framer Motion 11.0.8** - Animation library
- **Headless UI 1.7.18** - Unstyled accessible components

## Key Implementation Details

### State Management

Three Zustand stores handle different concerns:

1. **authStore** - Authentication and user roles
2. **appStore** - Application data (products, members, lockers, etc.)
3. **uiStore** - UI state (sidebar, modals, notifications)

### Type Definitions

Comprehensive TypeScript interfaces for:
- User and authentication
- Products and inventory
- Lockers and rentals
- Transactions and billing
- Members and services

### Routing

- Landing page displayed to unauthenticated users
- Protected routes ensure proper role-based access
- Automatic redirection based on authentication status

## Functional Buttons

All interactive buttons are fully functional:
- **Key Duplication**: Approve/Reject buttons update status
- **Locker Management**: View details and edit buttons provide feedback
- **POS System**: Add to cart, checkout, and clear cart functions
- **Forms**: All form submissions and cancellations work properly
- **Navigation**: All navigation links and buttons are functional

## Design Principles

- **Modern Aesthetics**: Contemporary design with gradients and smooth transitions
- **Accessibility**: Semantic HTML and ARIA labels for screen readers
- **Responsive**: Mobile-first design that adapts to all screen sizes
- **Performance**: Optimized builds with lazy loading and code splitting
- **User Experience**: Intuitive navigation and clear visual hierarchy

## Notes for Future Development

- Backend integration points are prepared for API calls
- Demo data uses Zustand for state management
- All data is currently stored in browser memory (session-based)
- Ready for backend API integration via RESTful endpoints
- Authentication can be upgraded to JWT-based system
- Database operations can be implemented on the backend

## Support

For backend integration or additional features, refer to the TypeScript types and API structure defined in `src/types/index.ts` and the store implementations in `src/store/`.
