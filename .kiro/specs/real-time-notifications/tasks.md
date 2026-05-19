# Implementation Tasks: Real-Time Notification System

## Task 1: Create Database Schema for Notifications

**Status**: pending  
**Priority**: high  
**Dependencies**: None

### Description
Create the database schema for storing notification records, including all necessary fields for notification management, read/unread status, and automatic cleanup.

### Acceptance Criteria
- [ ] Create `notifications` table with fields: id, user_id, type, title, description, link, is_read, created_at
- [ ] Add foreign key constraint from user_id to users(id) with ON DELETE CASCADE
- [ ] Create indexes on user_id, is_read, and created_at for query performance
- [ ] Add CHECK constraint for notification type enum values
- [ ] Create SQL migration script that can be run on PostgreSQL database
- [ ] Test migration script on development database

### Files to Create/Modify
- `backend/src/database/migrations/add-notifications-table.sql`
- `backend/src/database/schema.sql` (update with new table)

---

## Task 2: Set Up WebSocket Server Infrastructure

**Status**: pending  
**Priority**: high  
**Dependencies**: None

### Description
Set up WebSocket server infrastructure using Socket.IO or ws library to enable real-time bidirectional communication between server and clients.

### Acceptance Criteria
- [ ] Install Socket.IO or ws library as dependency
- [ ] Create WebSocket server instance integrated with existing Express server
- [ ] Implement connection authentication using JWT tokens
- [ ] Create connection manager to track active user connections
- [ ] Implement automatic reconnection handling
- [ ] Add connection/disconnection event logging
- [ ] Test WebSocket connection establishment from frontend

### Files to Create/Modify
- `backend/package.json` (add socket.io dependency)
- `backend/src/websocket/server.ts` (new file)
- `backend/src/websocket/connectionManager.ts` (new file)
- `backend/src/index.ts` (integrate WebSocket server)

---

## Task 3: Implement Notification Service Backend

**Status**: pending  
**Priority**: high  
**Dependencies**: Task 1, Task 2

### Description
Create the backend notification service that handles notification creation, storage, retrieval, and real-time delivery to connected clients.

### Acceptance Criteria
- [ ] Create NotificationService class with methods: createNotification, getNotifications, markAsRead, markAllAsRead, deleteOldNotifications
- [ ] Implement database queries for notification CRUD operations
- [ ] Implement real-time notification delivery via WebSocket
- [ ] Implement batch notification creation for role-based notifications (admin/staff)
- [ ] Add notification type validation and formatting
- [ ] Implement rate limiting (max 10 notifications per user per minute)
- [ ] Add error handling and logging
- [ ] Create unit tests for notification service methods

### Files to Create/Modify
- `backend/src/services/notificationService.ts` (new file)
- `backend/src/types/notification.ts` (new file for TypeScript types)

---

## Task 4: Create Notification API Endpoints

**Status**: pending  
**Priority**: high  
**Dependencies**: Task 3

### Description
Create REST API endpoints for notification management including fetching notifications, marking as read, and getting unread count.

### Acceptance Criteria
- [ ] Create GET /api/notifications endpoint to fetch user notifications (with pagination)
- [ ] Create GET /api/notifications/unread-count endpoint to get unread count
- [ ] Create PUT /api/notifications/:id/read endpoint to mark single notification as read
- [ ] Create PUT /api/notifications/mark-all-read endpoint to mark all as read
- [ ] Create DELETE /api/notifications/:id endpoint to delete notification
- [ ] Add authentication middleware to all endpoints
- [ ] Add role-based authorization checks
- [ ] Add request validation and error handling
- [ ] Test all endpoints with Postman or similar tool

### Files to Create/Modify
- `backend/src/routes/notifications.ts` (new file)
- `backend/src/index.ts` (register notification routes)

---

## Task 5: Integrate Notifications with Inbox Messages

**Status**: pending  
**Priority**: high  
**Dependencies**: Task 3

### Description
Integrate notification creation with the existing inbox/messaging system to send notifications when new messages are created.

### Acceptance Criteria
- [ ] Modify message creation endpoint to trigger notification creation
- [ ] For messages with specific recipient_id, create notification for that user
- [ ] For messages with recipient_role (admin/staff), create notifications for all users with that role
- [ ] Include sender name, message subject, and link to inbox in notification
- [ ] Emit WebSocket event to deliver notification in real-time
- [ ] Test notification creation when sending messages to users
- [ ] Test notification creation when sending messages to admin/staff roles

### Files to Create/Modify
- `backend/src/routes/messages.ts` (modify message creation endpoint)

---

## Task 6: Integrate Notifications with Order Management

**Status**: pending  
**Priority**: high  
**Dependencies**: Task 3

### Description
Integrate notification creation with the order management system to notify admin/staff of pending orders and notify members of order status changes.

### Acceptance Criteria
- [ ] Modify order creation endpoint to create notifications for admin/staff when order status is "pending"
- [ ] Modify order status update endpoint to create notifications for order owner when status changes to "completed" or "cancelled"
- [ ] Include customer name, receipt number, and total amount in pending order notifications
- [ ] Include receipt number and status in order status change notifications
- [ ] Emit WebSocket events for real-time delivery
- [ ] Test notification creation for new pending orders
- [ ] Test notification creation for order status changes

### Files to Create/Modify
- `backend/src/routes/orders.ts` (modify order creation and status update endpoints)

---

## Task 7: Integrate Notifications with Membership System

**Status**: pending  
**Priority**: medium  
**Dependencies**: Task 3

### Description
Integrate notification creation with the membership approval system to notify admin/staff of pending requests and notify members of approval/rejection.

### Acceptance Criteria
- [ ] Modify membership status update endpoint to create notifications for admin/staff when status changes to "pending"
- [ ] Modify membership status update endpoint to create notifications for user when status changes to "approved" or "rejected"
- [ ] Include user name and email in pending membership notifications
- [ ] Include approval/rejection status in member notifications
- [ ] Emit WebSocket events for real-time delivery
- [ ] Test notification creation for pending membership requests
- [ ] Test notification creation for membership approvals/rejections

### Files to Create/Modify
- `backend/src/routes/users.ts` or `backend/src/routes/membership.ts` (modify membership status update endpoint)

---

## Task 8: Create Frontend WebSocket Client

**Status**: pending  
**Priority**: high  
**Dependencies**: Task 2

### Description
Create the frontend WebSocket client that establishes connection to the server, handles authentication, and manages real-time notification delivery.

### Acceptance Criteria
- [ ] Install socket.io-client library as dependency
- [ ] Create WebSocket client service with connection management
- [ ] Implement authentication using JWT token from authContext
- [ ] Implement automatic reconnection with exponential backoff
- [ ] Create event listeners for incoming notifications
- [ ] Implement fallback to polling if WebSocket connection fails
- [ ] Add connection status indicator (optional)
- [ ] Test WebSocket connection establishment and reconnection

### Files to Create/Modify
- `package.json` (add socket.io-client dependency)
- `src/services/websocketClient.ts` (new file)

---

## Task 9: Create Notification Store (State Management)

**Status**: pending  
**Priority**: high  
**Dependencies**: Task 8

### Description
Create a Zustand store for managing notification state including unread count, notification list, and read/unread operations.

### Acceptance Criteria
- [ ] Create notificationStore with state: notifications, unreadCount, isLoading
- [ ] Implement actions: addNotification, setNotifications, markAsRead, markAllAsRead, incrementUnreadCount, decrementUnreadCount
- [ ] Integrate with WebSocket client to receive real-time notifications
- [ ] Implement API calls to fetch notifications on mount
- [ ] Add error handling for failed API calls
- [ ] Test store actions and state updates

### Files to Create/Modify
- `src/store/notificationStore.ts` (new file)
- `src/types/index.ts` (add Notification type)

---

## Task 10: Create Notification Bell Component

**Status**: pending  
**Priority**: high  
**Dependencies**: Task 9

### Description
Create the notification bell icon component that displays in the application header with unread count badge and handles dropdown toggle.

### Acceptance Criteria
- [ ] Create NotificationBell component with bell icon (use lucide-react)
- [ ] Display unread count badge (show "99+" if count > 99)
- [ ] Hide badge when unread count is 0
- [ ] Implement click handler to toggle notification dropdown
- [ ] Add visual indicator (animation/color) when new notification arrives
- [ ] Style component to match application design (purple/green theme)
- [ ] Make component responsive for mobile devices
- [ ] Test component rendering and interactions

### Files to Create/Modify
- `src/components/NotificationBell.tsx` (new file)

---

## Task 11: Create Notification Dropdown Component

**Status**: pending  
**Priority**: high  
**Dependencies**: Task 9, Task 10

### Description
Create the notification dropdown panel that displays recent notifications with title, description, timestamp, and read/unread indicators.

### Acceptance Criteria
- [ ] Create NotificationDropdown component that displays up to 10 recent notifications
- [ ] Display each notification with icon, title, description, and relative timestamp
- [ ] Show read/unread indicator (bold text or background color for unread)
- [ ] Implement click handler to navigate to notification link and mark as read
- [ ] Add "Mark All as Read" button
- [ ] Add "View All" link to navigate to full notifications page
- [ ] Show "No notifications" message when list is empty
- [ ] Close dropdown when clicking outside
- [ ] Style component with proper spacing and colors
- [ ] Test dropdown rendering and interactions

### Files to Create/Modify
- `src/components/NotificationDropdown.tsx` (new file)

---

## Task 12: Integrate Notification Bell into Application Header

**Status**: pending  
**Priority**: high  
**Dependencies**: Task 10, Task 11

### Description
Integrate the notification bell component into the application header/navigation bar so it's visible on all pages for authenticated users.

### Acceptance Criteria
- [ ] Add NotificationBell component to application header (Sidebar or App.tsx)
- [ ] Position bell icon in top-right area of header
- [ ] Ensure bell is visible only for authenticated users
- [ ] Ensure bell is visible on all pages (persistent across navigation)
- [ ] Test bell visibility and positioning on different screen sizes
- [ ] Verify bell appears for all user roles (admin, staff, user)

### Files to Create/Modify
- `src/components/Sidebar.tsx` or `src/App.tsx` (add NotificationBell)

---

## Task 13: Create Full Notifications Page

**Status**: pending  
**Priority**: medium  
**Dependencies**: Task 9

### Description
Create a dedicated notifications page that displays all notifications with pagination, filtering, and search capabilities.

### Acceptance Criteria
- [ ] Create NotificationsPage component with full notification list
- [ ] Implement pagination (20 notifications per page)
- [ ] Add filter options: All, Unread, Read
- [ ] Add search functionality by notification title/description
- [ ] Display notifications with same format as dropdown
- [ ] Implement mark as read/unread toggle for individual notifications
- [ ] Add "Mark All as Read" button
- [ ] Add delete notification functionality
- [ ] Style page to match application design
- [ ] Add route for notifications page (/notifications)
- [ ] Test page functionality and navigation

### Files to Create/Modify
- `src/pages/NotificationsPage.tsx` (new file)
- `src/App.tsx` (add route for /notifications)

---

## Task 14: Implement Notification Cleanup Job

**Status**: pending  
**Priority**: medium  
**Dependencies**: Task 3

### Description
Implement a scheduled job that runs daily to delete notifications older than 30 days to prevent database bloat.

### Acceptance Criteria
- [ ] Install node-cron or similar scheduling library
- [ ] Create cleanup job that deletes notifications older than 30 days
- [ ] Schedule job to run daily at midnight
- [ ] Add logging for cleanup operations (number of notifications deleted)
- [ ] Create manual cleanup endpoint for administrators
- [ ] Test cleanup job execution
- [ ] Verify old notifications are deleted correctly

### Files to Create/Modify
- `backend/package.json` (add node-cron dependency)
- `backend/src/jobs/notificationCleanup.ts` (new file)
- `backend/src/index.ts` (initialize cleanup job)

---

## Task 15: Remove Existing Polling from SalesPage

**Status**: pending  
**Priority**: medium  
**Dependencies**: Task 6

### Description
Remove the existing polling intervals from SalesPage and replace with WebSocket-based real-time updates triggered by notifications.

### Acceptance Criteria
- [ ] Remove setInterval polling for pending orders in SalesPage
- [ ] Remove setInterval polling for daily summary in SalesPage
- [ ] Remove setInterval polling for monthly report in SalesPage
- [ ] Remove setInterval polling for tailored orders in SalesPage
- [ ] Remove setInterval polling for fulfillment orders in SalesPage
- [ ] Implement WebSocket event listeners to trigger data refresh when notifications arrive
- [ ] Test that data updates in real-time without polling
- [ ] Verify performance improvement (reduced API calls)

### Files to Create/Modify
- `src/pages/SalesPage.tsx` (remove polling intervals, add WebSocket listeners)

---

## Task 16: Add Notification Sound/Visual Effects (Optional)

**Status**: pending  
**Priority**: low  
**Dependencies**: Task 10

### Description
Add optional sound and visual effects when new notifications arrive to improve user awareness.

### Acceptance Criteria
- [ ] Add subtle notification sound (optional, user can disable)
- [ ] Add bell shake animation when new notification arrives
- [ ] Add color pulse effect on notification badge
- [ ] Implement user preference to enable/disable sound
- [ ] Store sound preference in localStorage
- [ ] Test sound and animations across browsers

### Files to Create/Modify
- `src/components/NotificationBell.tsx` (add animations)
- `src/assets/sounds/notification.mp3` (add sound file)
- `src/store/notificationStore.ts` (add sound preference)

---

## Task 17: Implement Browser Notifications (Optional)

**Status**: pending  
**Priority**: low  
**Dependencies**: Task 9

### Description
Implement browser notification support to alert users even when the application tab is not active.

### Acceptance Criteria
- [ ] Request browser notification permission on first login
- [ ] Send browser notifications for high-priority events (messages, order status)
- [ ] Include notification title, body, and icon in browser notification
- [ ] Implement click handler to focus application tab and navigate to relevant page
- [ ] Respect user's browser notification permission (don't spam if denied)
- [ ] Store permission status in localStorage
- [ ] Test browser notifications across different browsers

### Files to Create/Modify
- `src/services/browserNotifications.ts` (new file)
- `src/store/notificationStore.ts` (integrate browser notifications)

---

## Task 18: Add Notification Preferences Page (Optional)

**Status**: pending  
**Priority**: low  
**Dependencies**: Task 9

### Description
Create a notification preferences page where users can customize which types of notifications they want to receive.

### Acceptance Criteria
- [ ] Create NotificationPreferencesPage component
- [ ] Add toggle switches for each notification type (messages, orders, membership)
- [ ] Create user_notification_preferences table in database
- [ ] Create API endpoints to save/load preferences
- [ ] Modify notification service to respect user preferences
- [ ] Add link to preferences page from notifications dropdown
- [ ] Style page to match application design
- [ ] Test preference saving and loading

### Files to Create/Modify
- `src/pages/NotificationPreferencesPage.tsx` (new file)
- `backend/src/database/migrations/add-notification-preferences-table.sql` (new file)
- `backend/src/routes/notifications.ts` (add preferences endpoints)
- `backend/src/services/notificationService.ts` (check preferences before creating notifications)

---

## Task 19: Write Integration Tests

**Status**: pending  
**Priority**: medium  
**Dependencies**: All implementation tasks

### Description
Write integration tests to verify the complete notification flow from event trigger to frontend display.

### Acceptance Criteria
- [ ] Test notification creation when new message is sent
- [ ] Test notification creation when new order is placed
- [ ] Test notification creation when membership status changes
- [ ] Test WebSocket delivery of notifications
- [ ] Test notification display in bell and dropdown
- [ ] Test mark as read functionality
- [ ] Test notification cleanup job
- [ ] Test fallback to polling when WebSocket fails
- [ ] All tests pass successfully

### Files to Create/Modify
- `backend/src/__tests__/notifications.test.ts` (new file)
- `src/__tests__/NotificationBell.test.tsx` (new file)
- `src/__tests__/NotificationDropdown.test.tsx` (new file)

---

## Task 20: Update Documentation

**Status**: pending  
**Priority**: low  
**Dependencies**: All implementation tasks

### Description
Update project documentation to include information about the notification system, API endpoints, and usage instructions.

### Acceptance Criteria
- [ ] Document notification system architecture and flow
- [ ] Document all notification API endpoints with examples
- [ ] Document WebSocket events and message formats
- [ ] Document notification types and their triggers
- [ ] Add user guide for notification preferences (if implemented)
- [ ] Update README with notification system overview
- [ ] Create developer guide for adding new notification types

### Files to Create/Modify
- `docs/NOTIFICATIONS.md` (new file)
- `README.md` (add notification system section)
- `docs/API.md` (add notification endpoints)

---

## Implementation Order

**Phase 1: Backend Foundation (Tasks 1-4)**
1. Task 1: Database Schema
2. Task 2: WebSocket Server
3. Task 3: Notification Service
4. Task 4: API Endpoints

**Phase 2: Backend Integration (Tasks 5-7)**
5. Task 5: Inbox Integration
6. Task 6: Order Integration
7. Task 7: Membership Integration

**Phase 3: Frontend Foundation (Tasks 8-12)**
8. Task 8: WebSocket Client
9. Task 9: Notification Store
10. Task 10: Notification Bell
11. Task 11: Notification Dropdown
12. Task 12: Header Integration

**Phase 4: Enhancement & Cleanup (Tasks 13-15)**
13. Task 13: Full Notifications Page
14. Task 14: Cleanup Job
15. Task 15: Remove Polling

**Phase 5: Optional Features (Tasks 16-18)**
16. Task 16: Sound/Visual Effects
17. Task 17: Browser Notifications
18. Task 18: Preferences Page

**Phase 6: Testing & Documentation (Tasks 19-20)**
19. Task 19: Integration Tests
20. Task 20: Documentation
