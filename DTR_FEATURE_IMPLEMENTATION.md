# DTR (Daily Time Record) Feature Implementation

## Overview
Successfully implemented a comprehensive Daily Time Record (DTR) management system with a new 4-tier user role hierarchy to track staff attendance and working hours.

## Components Created

### 1. **DTRPage.tsx** - Admin Management Interface
**Location:** `src/pages/DTRPage.tsx`

**Features:**
- Admin-only page for viewing and managing all staff DTR records
- Real-time statistics dashboard showing:
  - Total present staff
  - Total late staff
  - Total absent staff
  - Average working hours
- Filtering capabilities:
  - Filter by date (date picker)
  - Filter by staff member (dropdown with unique staff list)
  - CSV export functionality
- DTR Records Table showing:
  - Staff Name
  - Date (formatted)
  - Time In (HH:MM:SS format)
  - Time Out (HH:MM:SS format or "Not yet timed out")
  - Duration in minutes
  - Status badge (color-coded: green for on_time, yellow for late, red for absent, blue for present)
- Summary Statistics:
  - Daily summary with total records, attendance rate, tardiness rate
  - Staff count metrics
- Responsive design with Tailwind CSS
- Color scheme: Purple headers, green action buttons, white background

### 2. **StaffTimeCard.tsx** - Staff Time In/Out Component
**Location:** `src/components/StaffTimeCard.tsx`

**Features:**
- Real-time clock display showing current time
- Current date display
- Status-dependent actions:
  - If not timed in: Shows "Time In" button (green)
  - If timed in but not timed out: Shows "Time Out" button (red)
  - If already timed out: Shows disabled state
- Auto-calculated status based on time:
  - Before 8 AM = "on_time"
  - After 8 AM = "late"
- Displays today's DTR record with:
  - Time In timestamp
  - Time Out timestamp (if applicable)
  - Duration calculation (hours and minutes)
  - Current status badge
- Toast notifications for successful time in/out
- Duration automatically calculated on time out
- Only visible to staff and admin users
- Purple gradient styling with border
- Helpful hint about tardiness determination

### 3. Updated Files

#### **src/types/index.ts**
Added DTRRecord interface:
```typescript
export interface DTRRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD format
  timeIn: string; // HH:MM:SS format
  timeOut?: string; // Optional, HH:MM:SS format
  duration?: number; // Duration in minutes
  status: 'present' | 'absent' | 'late' | 'on_time';
  createdAt: string; // ISO timestamp
}
```

Updated UserRole type to support 4-tier hierarchy:
```typescript
export type UserRole = 'admin' | 'staff' | 'member' | 'user';

// Staff members have optional specialization
staffType?: 'cashier' | 'locker_officer' | 'inventory_officer';
```

#### **src/store/appStore.ts**
Added DTR state management:
- `dtrRecords: DTRRecord[]` - Array to store all DTR records
- `setDTRRecords(records)` - Set entire DTR records list
- `addDTRRecord(record)` - Add new DTR record
- `updateDTRRecord(id, updates)` - Update existing DTR record
- `clearAll()` - Clear DTR records on logout

#### **src/components/Sidebar.tsx**
- Added Clock icon import
- Added DTR Management menu item (admin-only)
  - Route ID: 'dtr'
  - Only visible to admin users
  - Positioned after Reports menu item

#### **src/pages/DashboardPage.tsx**
- Imported StaffTimeCard component
- Added StaffTimeCard display for staff and admin users
- Positioned after stats grid
- Shows time in/out functionality on dashboard

#### **src/App.tsx**
- Imported DTRPage component
- Added `/dtr` route in authenticated routes
- Route only accessible to authenticated users

## User Role Hierarchy

### 4-Tier System
1. **Admin**
   - Full system access
   - Can manage all DTR records
   - Can view all staff attendance
   - Can export DTR reports
   - Can perform all system operations

2. **Staff**
   - Can time in/out for their own DTR
   - Can view own DTR record
   - Limited to operational pages
   - Cannot access DTR management or reports

3. **Member**
   - UC METC cooperative members
   - Can access member-specific features
   - Cannot access operational features

4. **User/Student**
   - General website users
   - Can access public features
   - Typically for merchandise customers

## Features & Functionality

### Time In/Out Logic
- **Time In:**
  - Records current time as timeIn
  - Determines status based on current hour
  - Stores staffId, staffName, and date
  - Creates new DTRRecord with unique ID

- **Time Out:**
  - Records current time as timeOut
  - Calculates duration: (timeOut minutes - timeIn minutes)
  - Updates existing record
  - Prevents multiple time outs for same day

### Status Determination
- **On Time:** Time in before 8:00 AM
- **Late:** Time in after 8:00 AM
- **Present:** Any successful time in for the day
- **Absent:** No time in recorded for the day

### Dashboard Integration
- Staff members see a purple-bordered card on dashboard
- Real-time clock with current date and time
- One-click time in/out buttons
- Displays today's DTR summary if already timed in
- Toast notifications confirm actions

### Admin DTR Management Page
- Comprehensive table view of all staff DTR records
- Filter by date and/or staff member
- Displays statistics:
  - Daily present/late/absent counts
  - Average working hours
  - Attendance and tardiness rates
- Color-coded status indicators
- CSV export for reporting
- Summary statistics widgets

## Technical Details

### State Management
- Uses Zustand for global state
- DTR records persisted in appStore
- Actions: setDTRRecords, addDTRRecord, updateDTRRecord

### Date/Time Handling
- Dates stored as YYYY-MM-DD strings
- Times stored as HH:MM:SS strings
- Duration calculated in minutes
- Automatic local time formatting

### Access Control
- Role-based visibility in Sidebar
- DTR menu item admin-only
- StaffTimeCard only shows to staff/admin
- Components check user.role for rendering

### Styling
- Tailwind CSS utility classes
- Purple gradient backgrounds (#6B21A8 to #7C3AED)
- Green action buttons (#16A34A to #22C55E)
- White backgrounds (#FFFFFF)
- Status color coding for visual clarity

## Next Steps (Optional Enhancements)

1. **Backend Integration:**
   - Create PostgreSQL dtr_records table
   - Implement REST API endpoints:
     - POST /api/dtr/timein
     - POST /api/dtr/timeout
     - GET /api/dtr/records
     - GET /api/dtr/records/:date/:staffId
   - Add database validation and constraints

2. **Advanced Features:**
   - Weekly/monthly DTR summaries
   - Attendance reports with graphs
   - Overtime calculations
   - Late arrival penalties
   - Perfect attendance tracking
   - Bulk import/export capabilities

3. **Notifications:**
   - Email alerts for missing time outs
   - Attendance alerts for admins
   - Weekly DTR summary reports

4. **Mobile Support:**
   - Mobile-optimized time in/out interface
   - QR code check-in system
   - Geolocation tracking

## File Summary

| File | Purpose | Status |
|------|---------|--------|
| src/pages/DTRPage.tsx | Admin DTR management interface | ✅ Complete |
| src/components/StaffTimeCard.tsx | Staff time in/out component | ✅ Complete |
| src/types/index.ts | DTRRecord interface + 4-tier roles | ✅ Updated |
| src/store/appStore.ts | State management for DTR | ✅ Updated |
| src/components/Sidebar.tsx | DTR menu item | ✅ Updated |
| src/pages/DashboardPage.tsx | StaffTimeCard integration | ✅ Updated |
| src/App.tsx | DTR route configuration | ✅ Updated |

## Build Status
✅ TypeScript compilation successful
✅ All components properly typed
✅ No TypeScript errors
✅ Ready for deployment
