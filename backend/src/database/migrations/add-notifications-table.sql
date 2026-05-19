-- Migration: Add notifications table for real-time notification system
-- Date: 2026-05-12

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'new_message',
    'pending_order',
    'pending_membership',
    'order_completed',
    'order_cancelled',
    'membership_approved',
    'membership_rejected'
  )),
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Add comment to table
COMMENT ON TABLE notifications IS 'Stores user notifications for real-time notification system';
COMMENT ON COLUMN notifications.type IS 'Type of notification: new_message, pending_order, pending_membership, order_completed, order_cancelled, membership_approved, membership_rejected';
COMMENT ON COLUMN notifications.link IS 'Navigation link when notification is clicked';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the user';
