# Requirements Document: Real-Time Notification System

## Introduction

This document specifies the requirements for implementing a real-time notification system for the UC METC Coop application. The system will provide instant notifications to all user roles (admin, staff, and members) about important events such as new inbox messages, pending order approvals, pending membership requests, and other role-specific activities.

The current system requires users to manually refresh pages or navigate to specific sections to discover new events. This enhancement will provide proactive, real-time notifications through a notification bell icon in the application header, improving user awareness and response times for time-sensitive actions.

## Glossary

- **Notification_System**: The complete notification infrastructure including backend event detection, delivery mechanism, and frontend UI components
- **Notification_Bell**: The UI component (bell icon) displayed in the application header that shows notification count and provides access to the notification dropdown
- **Notification_Dropdown**: The expandable panel that displays a list of recent notifications when the Notification_Bell is clicked
- **Notification_Event**: A system occurrence that triggers a notification, such as a new message, pending order, or membership request
- **Notification_Record**: A database entry representing a single notification with metadata including type, recipient, content, read status, and timestamp
- **WebSocket_Connection**: A persistent bidirectional communication channel between client and server for real-time message delivery
- **Notification_Service**: The backend service responsible for detecting events, creating notifications, and delivering them to connected clients
- **Badge_Count**: The numeric indicator displayed on the Notification_Bell showing the count of unread notifications
- **User_Role**: The role assigned to a user, one of: admin, staff, or user (member)
- **Inbox_System**: The existing messaging system using the messages table for user-to-user and user-to-staff communication
- **Order_Management_System**: The existing order processing system using the orders table with statuses: pending, completed, cancelled, released
- **Membership_System**: The existing membership approval system using the users table with membership_status: none, pending, approved, rejected

## Requirements

### Requirement 1: Notification Bell UI Component

**User Story:** As a user, I want to see a notification bell icon in the application header, so that I can quickly access my notifications from any page.

#### Acceptance Criteria

1. THE Notification_Bell SHALL be displayed in the application header for all authenticated users
2. THE Notification_Bell SHALL display a Badge_Count showing the number of unread notifications
3. WHEN the Badge_Count is zero, THE Notification_Bell SHALL display the bell icon without a badge
4. WHEN the Badge_Count exceeds 99, THE Notification_Bell SHALL display "99+" instead of the exact count
5. WHEN a user clicks the Notification_Bell, THE Notification_System SHALL toggle the visibility of the Notification_Dropdown
6. THE Notification_Bell SHALL use a visually distinct color or animation when new notifications arrive

### Requirement 2: Notification Dropdown Display

**User Story:** As a user, I want to view my recent notifications in a dropdown panel, so that I can quickly review important events without navigating away from my current page.

#### Acceptance Criteria

1. WHEN the Notification_Dropdown is opened, THE Notification_System SHALL display up to 10 most recent notifications
2. THE Notification_Dropdown SHALL display each notification with a title, description, timestamp, and read/unread indicator
3. THE Notification_Dropdown SHALL display notifications in reverse chronological order (newest first)
4. WHEN there are no notifications, THE Notification_Dropdown SHALL display a message "No notifications"
5. THE Notification_Dropdown SHALL include a "View All" link that navigates to a dedicated notifications page
6. THE Notification_Dropdown SHALL include a "Mark All as Read" action button
7. WHEN a user clicks outside the Notification_Dropdown, THE Notification_System SHALL close the dropdown

### Requirement 3: Inbox Message Notifications for Members

**User Story:** As a member, I want to receive notifications when I receive new inbox messages, so that I can respond promptly to communications from staff or other members.

#### Acceptance Criteria

1. WHEN a new message is created in the Inbox_System with a specific recipient_id, THE Notification_Service SHALL create a Notification_Record for that recipient
2. THE Notification_Record SHALL include the notification type "new_message", sender name, message subject, and timestamp
3. THE Notification_Service SHALL deliver the notification to the recipient in real-time if they are online
4. WHEN the recipient is offline, THE Notification_Record SHALL be stored and displayed when they next log in
5. WHEN a member clicks on a message notification, THE Notification_System SHALL navigate to the inbox and mark the notification as read

### Requirement 4: Inbox Message Notifications for Admin and Staff

**User Story:** As an admin or staff member, I want to receive notifications when I receive new inbox messages, so that I can respond to member inquiries promptly.

#### Acceptance Criteria

1. WHEN a new message is created with recipient_role "admin" or "staff", THE Notification_Service SHALL create Notification_Records for all users with that role
2. THE Notification_Record SHALL include the notification type "new_message", sender name, message subject, and timestamp
3. THE Notification_Service SHALL deliver the notification to all online admin/staff members in real-time
4. WHEN an admin or staff member is offline, THE Notification_Record SHALL be stored and displayed when they next log in
5. WHEN an admin or staff member clicks on a message notification, THE Notification_System SHALL navigate to the inbox and mark the notification as read

### Requirement 5: Pending Order Notifications for Admin and Staff

**User Story:** As an admin or staff member, I want to receive notifications when new orders are placed, so that I can process them promptly.

#### Acceptance Criteria

1. WHEN a new order is created with status "pending", THE Notification_Service SHALL create Notification_Records for all admin and staff users
2. THE Notification_Record SHALL include the notification type "pending_order", customer name, order receipt number, total amount, and timestamp
3. THE Notification_Service SHALL deliver the notification to all online admin/staff members in real-time
4. WHEN an order status changes from "pending" to "completed" or "cancelled", THE Notification_Service SHALL NOT create additional notifications
5. WHEN an admin or staff member clicks on a pending order notification, THE Notification_System SHALL navigate to the Sales page pending orders tab and mark the notification as read

### Requirement 6: Pending Membership Notifications for Admin and Staff

**User Story:** As an admin or staff member, I want to receive notifications when users submit membership requests, so that I can review and approve them promptly.

#### Acceptance Criteria

1. WHEN a user's membership_status changes to "pending", THE Notification_Service SHALL create Notification_Records for all admin and staff users
2. THE Notification_Record SHALL include the notification type "pending_membership", user name, email, and timestamp
3. THE Notification_Service SHALL deliver the notification to all online admin/staff members in real-time
4. WHEN a membership_status changes from "pending" to "approved" or "rejected", THE Notification_Service SHALL NOT create additional notifications
5. WHEN an admin or staff member clicks on a pending membership notification, THE Notification_System SHALL navigate to the Members page and mark the notification as read

### Requirement 7: Order Status Update Notifications for Members

**User Story:** As a member, I want to receive notifications when my order status changes, so that I know when my order is ready for pickup or has been cancelled.

#### Acceptance Criteria

1. WHEN an order status changes from "pending" to "completed", THE Notification_Service SHALL create a Notification_Record for the order's user_id
2. WHEN an order status changes from "pending" to "cancelled", THE Notification_Service SHALL create a Notification_Record for the order's user_id
3. THE Notification_Record SHALL include the notification type "order_completed" or "order_cancelled", order receipt number, and timestamp
4. THE Notification_Service SHALL deliver the notification to the member in real-time if they are online
5. WHEN a member clicks on an order status notification, THE Notification_System SHALL navigate to the Transaction page and mark the notification as read

### Requirement 8: Membership Status Notifications for Members

**User Story:** As a member, I want to receive notifications when my membership request is approved or rejected, so that I know the status of my application.

#### Acceptance Criteria

1. WHEN a user's membership_status changes from "pending" to "approved", THE Notification_Service SHALL create a Notification_Record for that user
2. WHEN a user's membership_status changes from "pending" to "rejected", THE Notification_Service SHALL create a Notification_Record for that user
3. THE Notification_Record SHALL include the notification type "membership_approved" or "membership_rejected" and timestamp
4. THE Notification_Service SHALL deliver the notification to the user in real-time if they are online
5. WHEN a member clicks on a membership status notification, THE Notification_System SHALL navigate to the Dashboard page and mark the notification as read

### Requirement 9: Real-Time Notification Delivery

**User Story:** As a user, I want to receive notifications instantly without refreshing the page, so that I can respond to time-sensitive events immediately.

#### Acceptance Criteria

1. THE Notification_System SHALL establish a WebSocket_Connection between the client and server when a user logs in
2. THE Notification_Service SHALL push new notifications to connected clients within 2 seconds of the triggering event
3. WHEN a new notification is received, THE Notification_Bell SHALL update the Badge_Count immediately
4. WHEN a new notification is received, THE Notification_Bell SHALL display a visual indicator (animation or color change) for 3 seconds
5. THE WebSocket_Connection SHALL automatically reconnect if the connection is lost
6. WHEN the WebSocket_Connection is unavailable, THE Notification_System SHALL fall back to polling every 30 seconds

### Requirement 10: Notification Persistence

**User Story:** As a user, I want my notifications to be saved, so that I can review them even after logging out and logging back in.

#### Acceptance Criteria

1. THE Notification_Service SHALL store all Notification_Records in a notifications database table
2. THE notifications table SHALL include fields: id, user_id, type, title, description, link, is_read, created_at
3. WHEN a user logs in, THE Notification_System SHALL load all unread notifications from the database
4. THE Notification_System SHALL retain notifications for 30 days after creation
5. WHEN a notification is older than 30 days, THE Notification_Service SHALL automatically delete it

### Requirement 11: Mark Notifications as Read

**User Story:** As a user, I want to mark notifications as read, so that I can keep track of which notifications I have already reviewed.

#### Acceptance Criteria

1. WHEN a user clicks on a notification in the Notification_Dropdown, THE Notification_System SHALL mark that notification as read
2. WHEN a user clicks "Mark All as Read", THE Notification_System SHALL mark all notifications for that user as read
3. WHEN a notification is marked as read, THE Notification_System SHALL update the Badge_Count immediately
4. THE Notification_System SHALL persist the read status in the database
5. WHEN a notification is marked as read, THE Notification_Dropdown SHALL update the visual indicator (e.g., remove bold text or change background color)

### Requirement 12: Notification Types and Routing

**User Story:** As a user, I want notifications to link to the relevant page, so that I can quickly navigate to the content that triggered the notification.

#### Acceptance Criteria

1. WHEN a notification type is "new_message", THE notification link SHALL navigate to the Inbox page
2. WHEN a notification type is "pending_order", THE notification link SHALL navigate to the Sales page with the pending orders tab active
3. WHEN a notification type is "pending_membership", THE notification link SHALL navigate to the Members page
4. WHEN a notification type is "order_completed" or "order_cancelled", THE notification link SHALL navigate to the Transaction page
5. WHEN a notification type is "membership_approved" or "membership_rejected", THE notification link SHALL navigate to the Dashboard page
6. THE Notification_System SHALL support adding new notification types without requiring database schema changes

### Requirement 13: Role-Based Notification Filtering

**User Story:** As a user, I want to receive only notifications relevant to my role, so that I am not overwhelmed with irrelevant information.

#### Acceptance Criteria

1. THE Notification_Service SHALL create notifications only for users whose role matches the notification's target audience
2. WHEN a notification targets "admin" or "staff", THE Notification_Service SHALL NOT create notifications for users with role "user"
3. WHEN a notification targets a specific user_id, THE Notification_Service SHALL create a notification only for that user
4. THE Notification_System SHALL filter notifications by user_id when loading notifications from the database
5. THE Notification_System SHALL NOT display notifications intended for other users or roles

### Requirement 14: Notification Preferences (Optional)

**User Story:** As a user, I want to control which types of notifications I receive, so that I can customize my notification experience.

#### Acceptance Criteria

1. WHERE notification preferences are enabled, THE Notification_System SHALL provide a settings page for users to manage notification preferences
2. WHERE notification preferences are enabled, THE settings page SHALL allow users to enable or disable notifications by type (messages, orders, membership)
3. WHERE notification preferences are enabled, THE Notification_Service SHALL respect user preferences when creating notifications
4. WHERE notification preferences are enabled, THE Notification_System SHALL store preferences in a user_notification_preferences table
5. WHERE notification preferences are disabled, THE Notification_System SHALL deliver all notifications to all eligible users

### Requirement 15: Browser Notification Support (Optional)

**User Story:** As a user, I want to receive browser notifications even when the application tab is not active, so that I don't miss important events.

#### Acceptance Criteria

1. WHERE browser notifications are enabled, THE Notification_System SHALL request browser notification permission on first login
2. WHERE browser notification permission is granted, THE Notification_System SHALL send browser notifications for high-priority events (new messages, order status changes)
3. WHERE browser notification permission is denied, THE Notification_System SHALL continue to display in-app notifications only
4. WHERE browser notifications are enabled, WHEN a user clicks a browser notification, THE Notification_System SHALL focus the application tab and navigate to the relevant page
5. WHERE browser notifications are disabled, THE Notification_System SHALL function normally with in-app notifications only

### Requirement 16: Performance and Scalability

**User Story:** As a system administrator, I want the notification system to perform efficiently, so that it does not degrade application performance or user experience.

#### Acceptance Criteria

1. THE Notification_System SHALL support at least 100 concurrent WebSocket connections without performance degradation
2. THE Notification_Service SHALL process and deliver notifications within 2 seconds of the triggering event
3. THE Notification_System SHALL limit database queries by caching unread notification counts in memory
4. THE Notification_System SHALL batch database writes when creating notifications for multiple users (e.g., all admin/staff)
5. THE Notification_System SHALL implement rate limiting to prevent notification spam (maximum 10 notifications per user per minute)

### Requirement 17: Notification Cleanup and Maintenance

**User Story:** As a system administrator, I want old notifications to be automatically cleaned up, so that the database does not grow indefinitely.

#### Acceptance Criteria

1. THE Notification_Service SHALL run a daily cleanup job to delete notifications older than 30 days
2. THE cleanup job SHALL delete both read and unread notifications older than 30 days
3. THE cleanup job SHALL log the number of notifications deleted
4. THE Notification_System SHALL provide a manual cleanup endpoint for administrators
5. THE Notification_System SHALL archive deleted notifications to a separate table for audit purposes (optional)

### Requirement 18: Error Handling and Fallback

**User Story:** As a user, I want the notification system to handle errors gracefully, so that I can still use the application even if notifications fail.

#### Acceptance Criteria

1. WHEN the WebSocket_Connection fails to establish, THE Notification_System SHALL fall back to polling every 30 seconds
2. WHEN the Notification_Service encounters an error creating a notification, THE Notification_Service SHALL log the error and continue processing other notifications
3. WHEN the database is unavailable, THE Notification_System SHALL queue notifications in memory and retry when the database is available
4. WHEN a notification delivery fails, THE Notification_Service SHALL retry up to 3 times with exponential backoff
5. THE Notification_System SHALL display an error message to the user if notifications cannot be loaded after 3 retry attempts

### Requirement 19: Notification Content Formatting

**User Story:** As a user, I want notifications to be clearly formatted and easy to understand, so that I can quickly grasp the important information.

#### Acceptance Criteria

1. THE Notification_Record SHALL include a title field with a concise summary (maximum 100 characters)
2. THE Notification_Record SHALL include a description field with additional details (maximum 500 characters)
3. THE Notification_System SHALL format timestamps as relative time (e.g., "2 minutes ago", "1 hour ago", "3 days ago")
4. THE Notification_System SHALL use consistent icons for each notification type (e.g., envelope for messages, shopping cart for orders)
5. THE Notification_System SHALL truncate long titles or descriptions with ellipsis (...) in the Notification_Dropdown

### Requirement 20: Integration with Existing Polling

**User Story:** As a developer, I want the notification system to replace existing polling mechanisms, so that the application is more efficient and responsive.

#### Acceptance Criteria

1. WHEN the Notification_System is implemented, THE SalesPage SHALL remove the existing polling interval for pending orders
2. WHEN the Notification_System is implemented, THE system SHALL use WebSocket events to trigger data refreshes instead of polling
3. THE Notification_System SHALL emit events when data changes (e.g., "order_created", "message_received") to trigger UI updates
4. THE Notification_System SHALL maintain backward compatibility with existing data fetching functions
5. THE Notification_System SHALL reduce the number of API requests by at least 50% compared to the current polling approach
