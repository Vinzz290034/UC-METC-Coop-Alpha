import { getApiBaseUrl } from '../utils/apiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

export interface ApiError {
  message: string;
  status?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return sessionStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    userId?: string
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getAuthToken();
    if (token) {
      (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    // Add user ID if provided
    if (userId) {
      (headers as any)['x-user-id'] = userId;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        let errorDetail: any = {};
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
          errorDetail = error;
        } catch (e) {
          // Could not parse error response
        }
        
        // Handle auth errors
        if (response.status === 401) {
          // Token was rejected by server
        }

        // Handle 403 - Account deactivated
        if (response.status === 403 && errorDetail.accountStatus === 'inactive') {
          // Clear session storage and reload to login page
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          sessionStorage.clear();
          window.location.href = '/login?deactivated=true';
          throw {
            message: errorMessage,
            status: response.status,
            detail: errorDetail
          };
        }
        
        throw {
          message: errorMessage,
          status: response.status,
          detail: errorDetail
        };
      }

      return await response.json();
    } catch (err: any) {
      throw err;
    }
  }

  // Auth endpoints
  async login(email: string | null, password: string, id_number?: string | null) {
    const body: any = { password };
    if (email) {
      body.email = email;
    }
    if (id_number) {
      body.id_number = id_number;
    }
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: string;
  }) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string) {
    return this.request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmail(email: string, code: string) {
    return this.request<any>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async resendVerification(email: string) {
    return this.request<any>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetCode(email: string, code: string) {
    return this.request<any>('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    return this.request<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  }

  // Users endpoints
  async getUsers() {
    return this.request<any>('/users');
  }

  async getMembers() {
    return this.request<any>('/users/members');
  }

  async getUsersForMessaging() {
    return this.request<any>('/users/for-messaging/list');
  }

  async getUser(id: string) {
    return this.request<any>(`/users/${id}`);
  }

  async getCurrentUser() {
    return this.request<any>('/users/me');
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async demoteMember(id: string) {
    return this.request<any>(`/users/${id}/demote`, {
      method: 'POST',
    });
  }

  async freezeMember(id: string) {
    return this.request<any>(`/users/${id}/freeze`, {
      method: 'POST',
    });
  }

  async reactivateUser(id: string) {
    return this.request<any>(`/users/${id}/reactivate`, {
      method: 'POST',
    });
  }

  // Lockers endpoints
  async getLockers() {
    return this.request<any>('/lockers');
  }

  async createLocker(locker_number: string) {
    return this.request<any>('/lockers', {
      method: 'POST',
      body: JSON.stringify({ locker_number }),
    });
  }

  async updateLockerStatus(id: string, status: string) {
    return this.request<any>(`/lockers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async assignLocker(id: string, user_id: string) {
    return this.request<any>(`/lockers/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ user_id }),
    });
  }

  async deleteLocker(id: string) {
    return this.request<any>(`/lockers/${id}`, {
      method: 'DELETE',
    });
  }

  async getAvailableLockers() {
    return this.request<any>('/lockers/available');
  }

  async getMyLocker() {
    return this.request<any>('/lockers/mine');
  }

  async applyForLocker(locker_id: string, semester_count: number, terms_agreed: boolean) {
    return this.request<any>('/lockers/apply', {
      method: 'POST',
      body: JSON.stringify({ locker_id, semester_count, terms_agreed }),
    });
  }

  async getLockerRentals() {
    return this.request<any>('/lockers/rentals');
  }

  async approveLockerRental(rentalId: string, key_code?: string, start_date?: string, end_date?: string) {
    return this.request<any>(`/lockers/rentals/${rentalId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ key_code, start_date, end_date }),
    });
  }

  async rejectLockerRental(rentalId: string, notes?: string) {
    return this.request<any>(`/lockers/rentals/${rentalId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  }

  async markLockerRentalPaid(rentalId: string, payment_status: 'paid' | 'partial') {
    return this.request<any>(`/lockers/rentals/${rentalId}/mark-paid`, {
      method: 'PUT',
      body: JSON.stringify({ payment_status }),
    });
  }

  async terminateLockerRental(rentalId: string) {
    return this.request<any>(`/lockers/rentals/${rentalId}/terminate`, {
      method: 'PUT',
    });
  }

  async updateLockerDetails(id: string, data: { status?: string; location?: string; floor?: string; size?: string; key_code?: string }) {
    return this.request<any>(`/lockers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Inventory endpoints
  async getInventory() {
    return this.request<any>('/inventory');
  }

  async getInventorySummary() {
    return this.request<any>('/inventory/summary');
  }


  async createInventoryItem(data: any) {
    return this.request<any>('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventoryItem(id: string, data: any) {
    return this.request<any>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInventoryItem(id: string) {
    return this.request<any>(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  // Key requests endpoints
  async getKeyRequests() {
    return this.request<any>('/keys');
  }

  async createKeyRequest() {
    return this.request<any>('/keys', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async updateKeyRequestStatus(id: string, status: string) {
    return this.request<any>(`/keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Billing endpoints
  async getBillingRecords() {
    return this.request<any>('/billing');
  }

  async createBillingRecord(data: any) {
    return this.request<any>('/billing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBillingStatus(id: string, status: string) {
    return this.request<any>(`/billing/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Membership Requests endpoints
  async getPendingMembershipRequests() {
    return this.request<any>('/users/membership-requests/pending');
  }

  async checkMyMembershipStatus() {
    return this.request<any>('/users/membership-requests/my-status');
  }

  async createMembershipRequest(data: {
    user_id?: string;
    name: string;
    email: string;
    phone?: string;
  }) {
    return this.request<any>('/users/membership-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveMembershipRequest(id: string) {
    return this.request<any>(`/users/membership-requests/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  }

  async rejectMembershipRequest(id: string) {
    return this.request<any>(`/users/membership-requests/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  }

  async sendEmail(data: { to: string; subject: string; body: string }) {
    return this.request<any>('/users/send-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reports endpoints
  async getSalesReport() {
    return this.request<any>('/reports/sales');
  }

  async getInventoryReport() {
    return this.request<any>('/reports/inventory');
  }

  async getMembersReport() {
    return this.request<any>('/reports/members');
  }

  // Cart endpoints
  async addToCart(item: any, userId: string) {
    return this.request<any>('/cart/add', {
      method: 'POST',
      body: JSON.stringify(item),
    }, userId);
  }

  async getCart(userId: string) {
    return this.request<any>('/cart', {}, userId);
  }

  async updateCartItem(itemId: string, quantity: number, userId: string) {
    return this.request<any>(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }, userId);
  }

  async removeFromCart(itemId: string, userId: string) {
    return this.request<any>(`/cart/${itemId}`, {
      method: 'DELETE',
    }, userId);
  }

  async clearCart(userId: string) {
    return this.request<any>('/cart', {
      method: 'DELETE',
    }, userId);
  }

  // Orders endpoints
  async createOrder(orderData: any, userId: string) {
    return this.request<any>('/orders/create', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }, userId);
  }

  async getOrders(userId: string) {
    return this.request<any>('/orders', {}, userId);
  }

  async getOrder(orderId: string, userId: string) {
    return this.request<any>(`/orders/${orderId}`, {}, userId);
  }

  async updateOrderStatus(orderId: string, status: string, userId: string) {
    return this.request<any>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }, userId);
  }

  async cancelOrder(orderId: string, userId: string) {
    return this.request<any>(`/orders/${orderId}/cancel`, {
      method: 'PUT',
    }, userId);
  }

  async deleteOrder(orderId: string, userId: string) {
    return this.request<any>(`/orders/${orderId}`, {
      method: 'DELETE',
    }, userId);
  }

  async deleteOrderAsAdmin(orderId: string, userId: string) {
    return this.request<any>(`/orders/admin/${orderId}`, {
      method: 'DELETE',
    }, userId);
  }

  async getPendingOrders(userId: string) {
    return this.request<any>(`/orders/pending/list`, {}, userId);
  }

  // Get all transactions (staff/admin see all, users see their own)
  async getAllTransactions(userId: string) {
    return this.request<any>(`/orders/all/transactions`, {}, userId);
  }

  // Messages endpoints
  async sendMessage(messageData: any, userId: string) {
    return this.request<any>('/messages/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
    }, userId);
  }

  async getMessages(folder: 'inbox' | 'sent', userId: string) {
    return this.request<any>(`/messages?folder=${folder}`, {}, userId);
  }

  async getMessage(messageId: string, userId: string) {
    return this.request<any>(`/messages/${messageId}`, {}, userId);
  }

  async markMessageAsRead(messageId: string, userId: string) {
    return this.request<any>(`/messages/${messageId}/read`, {
      method: 'PUT',
    }, userId);
  }

  async toggleMessageFavorite(messageId: string, userId: string) {
    return this.request<any>(`/messages/${messageId}/favorite`, {
      method: 'PUT',
    }, userId);
  }

  async deleteMessage(messageId: string, userId: string) {
    return this.request<any>(`/messages/${messageId}`, {
      method: 'DELETE',
    }, userId);
  }

  // Products endpoints
  async getProducts() {
    return this.request<any>('/products');
  }

  async createProduct(productData: any) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId: string, productData: any) {
    return this.request<any>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId: string) {
    return this.request<any>(`/products/${productId}`, {
      method: 'DELETE',
    });
  }

  // Landing page stats (public endpoint - no auth required)
  async getLandingStats() {
    return this.request<any>('/public/stats');
  }

  // Get public receipt details by receipt number (no auth required)
  async getPublicReceipt(receiptNo: string) {
    return this.request<any>(`/public/receipt/${receiptNo}`);
  }

  // Cancel a walk-in order by receipt number (kiosk use, no auth required)
  async cancelPublicWalkInOrder(receiptNo: string) {
    return this.request<any>(`/public/cancel/${receiptNo}`, { method: 'PUT' });
  }

  // Announcements endpoints
  async getPublicAnnouncements() {
    return this.request<any>('/announcements/public');
  }

  async getAnnouncements(userId: string) {
    return this.request<any>('/announcements', {}, userId);
  }

  async getAnnouncement(announcementId: string) {
    return this.request<any>(`/announcements/${announcementId}`);
  }

  async createAnnouncement(announcementData: any, userId: string) {
    return this.request<any>('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    }, userId);
  }

  async updateAnnouncement(announcementId: string, announcementData: any, userId: string) {
    return this.request<any>(`/announcements/${announcementId}`, {
      method: 'PUT',
      body: JSON.stringify(announcementData),
    }, userId);
  }

  async deleteAnnouncement(announcementId: string, userId: string) {
    return this.request<any>(`/announcements/${announcementId}`, {
      method: 'DELETE',
    }, userId);
  }

  // Recent Activities endpoints
  async getPublicActivities() {
    return this.request<any>('/activities/public');
  }

  async getActivities(userId: string) {
    return this.request<any>('/activities', {}, userId);
  }

  async createActivity(activityData: any, userId: string) {
    return this.request<any>('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    }, userId);
  }

  async updateActivity(activityId: string, activityData: any, userId: string) {
    return this.request<any>(`/activities/${activityId}`, {
      method: 'PUT',
      body: JSON.stringify(activityData),
    }, userId);
  }

  async deleteActivity(activityId: string, userId: string) {
    return this.request<any>(`/activities/${activityId}`, {
      method: 'DELETE',
    }, userId);
  }

  // Stock Intake methods
  async getStockIntakeRecords(userId: string) {
    return this.request<any>('/stock-intake', {
      method: 'GET',
    }, userId);
  }

  async createStockIntakeRecord(recordData: any, userId: string) {
    return this.request<any>('/stock-intake', {
      method: 'POST',
      body: JSON.stringify(recordData),
    }, userId);
  }

  async updateStockIntakeRecord(recordId: string, recordData: any, userId: string) {
    return this.request<any>(`/stock-intake/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    }, userId);
  }

  async deleteStockIntakeRecord(recordId: string, userId: string) {
    return this.request<any>(`/stock-intake/${recordId}`, {
      method: 'DELETE',
    }, userId);
  }

  // Notification methods
  async getNotifications(limit: number = 20, offset: number = 0, unreadOnly: boolean = false) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      unreadOnly: unreadOnly.toString(),
    });
    return this.request<any>(`/notifications?${params.toString()}`);
  }

  async getUnreadNotificationCount() {
    return this.request<any>('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<any>('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
