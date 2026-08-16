/**
 * Z-Index Constants
 * 
 * Centralized z-index values to prevent layering conflicts.
 * Higher numbers appear on top of lower numbers.
 * 
 * Current Hierarchy:
 * - Sidebar: z-40
 * - Sidebar Overlay: z-30
 * - Login/Terms/Privacy Modals: z-[55]
 * - Product Details Modal: z-[55]
 * - Email/Edit Member Modals: z-[55]
 * - Checkout Modal: z-[60]/z-[61]
 * - Membership Modal: z-[60]/z-[61]
 * - Logout Modal: z-[65]
 * - Toast Notifications: z-[70]
 */

export const Z_INDEX = {
  // Base layers
  BASE: 0,
  
  // Navigation
  SIDEBAR: 40,
  SIDEBAR_OVERLAY: 30,
  MOBILE_TOGGLE: 40,
  
  // General modals (lowest priority)
  GENERAL_MODAL: 55,        // Login, Terms, Privacy, Product details, Email, Edit member
  
  // Important modals (medium priority)
  CHECKOUT_MODAL: 60,       // Cart checkout modal
  MEMBERSHIP_MODAL: 60,     // Membership request modal
  
  // Critical modals (high priority)
  LOGOUT_MODAL: 65,         // Logout confirmation modal
  
  // Notifications (highest priority)
  TOAST: 10000,              // Toast notifications
  
  // Emergency/System modals
  SYSTEM_MODAL: 80,         // System-wide modals (if needed)
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;