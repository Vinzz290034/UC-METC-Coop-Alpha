// Notification types for real-time notification system

export type NotificationType =
  | 'new_message'
  | 'pending_order'
  | 'pending_membership'
  | 'order_completed'
  | 'order_cancelled'
  | 'membership_approved'
  | 'membership_rejected'
  | 'insurance_approved';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  description?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  description?: string;
  link?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export interface WebSocketMessage {
  type: 'notification' | 'notification_read' | 'notification_deleted';
  payload: any;
}
