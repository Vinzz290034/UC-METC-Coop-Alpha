const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('%c=== API CONFIGURATION ===', 'color: blue; font-weight: bold;');
console.log('VITE_API_URL env:', import.meta.env.VITE_API_URL);
console.log('API_BASE_URL being used:', API_BASE_URL);

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
    return localStorage.getItem('token');
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
      
      // Log token info for debugging
      console.log(`[API ${options.method || 'GET'} ${endpoint}] Token present:`, {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 30) + '...',
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn(`[API ${options.method || 'GET'} ${endpoint}] NO TOKEN FOUND`);
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
          console.error(`API Error [${endpoint}]:`, { status: response.status, error });
        } catch (e) {
          console.error(`API Error [${endpoint}]: Could not parse error response`, response);
        }
        
        // Log detailed token error info
        if (response.status === 401) {
          console.error('[AUTH ERROR] Token rejected by server:', {
            errorMessage,
            errorDetail,
            endpoint,
            tokenLength: token?.length || 0
          });
        }
        
        throw {
          message: errorMessage,
          status: response.status,
          detail: errorDetail
        };
      }

      return await response.json();
    } catch (err: any) {
      console.error(`API Error [${endpoint}]:`, err);
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
    return this.request('/auth/login', {
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
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Users endpoints
  async getUsers() {
    // Temporarily use test endpoint (no auth required) for debugging
    return this.request('/users/test-get-all');
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async getCurrentUser() {
    return this.request('/users/me');
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async demoteMember(id: string) {
    return this.request(`/users/${id}/demote`, {
      method: 'POST',
    });
  }

  async freezeMember(id: string) {
    return this.request(`/users/${id}/freeze`, {
      method: 'POST',
    });
  }

  // Lockers endpoints
  async getLockers() {
    return this.request('/lockers');
  }

  async createLocker(locker_number: string) {
    return this.request('/lockers', {
      method: 'POST',
      body: JSON.stringify({ locker_number }),
    });
  }

  async updateLockerStatus(id: string, status: string) {
    return this.request(`/lockers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async assignLocker(id: string, user_id: string) {
    return this.request(`/lockers/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ user_id }),
    });
  }

  async deleteLocker(id: string) {
    return this.request(`/lockers/${id}`, {
      method: 'DELETE',
    });
  }

  // Inventory endpoints
  async getInventory() {
    return this.request('/inventory');
  }

  async createInventoryItem(data: any) {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventoryItem(id: string, data: any) {
    return this.request(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInventoryItem(id: string) {
    return this.request(`/inventory/${id}`, {
      method: 'DELETE',
    });
  }

  // Key requests endpoints
  async getKeyRequests() {
    return this.request('/keys');
  }

  async createKeyRequest() {
    return this.request('/keys', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async updateKeyRequestStatus(id: string, status: string) {
    return this.request(`/keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Billing endpoints
  async getBillingRecords() {
    return this.request('/billing');
  }

  async createBillingRecord(data: any) {
    return this.request('/billing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBillingStatus(id: string, status: string) {
    return this.request(`/billing/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Membership Requests endpoints
  async getPendingMembershipRequests() {
    // Temporarily use test endpoint (no auth required) for debugging
    return this.request('/users/membership-requests/pending-test');
  }

  async createMembershipRequest(data: {
    user_id?: string;
    name: string;
    email: string;
    phone?: string;
  }) {
    return this.request('/users/membership-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveMembershipRequest(id: string) {
    // Temporarily use test endpoint (no auth required) for debugging
    return this.request(`/users/membership-requests/${id}/approve-test`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  }

  async rejectMembershipRequest(id: string) {
    // Temporarily use test endpoint (no auth required) for debugging
    return this.request(`/users/membership-requests/${id}/reject-test`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  }

  async sendEmail(data: { to: string; subject: string; body: string }) {
    return this.request('/users/send-email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reports endpoints
  async getSalesReport() {
    return this.request('/reports/sales');
  }

  async getInventoryReport() {
    return this.request('/reports/inventory');
  }

  async getMembersReport() {
    return this.request('/reports/members');
  }

  // Cart endpoints
  async addToCart(item: any, userId: string) {
    return this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify(item),
    }, userId);
  }

  async getCart(userId: string) {
    return this.request('/cart', {}, userId);
  }

  async updateCartItem(itemId: string, quantity: number, userId: string) {
    return this.request(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }, userId);
  }

  async removeFromCart(itemId: string, userId: string) {
    return this.request(`/cart/${itemId}`, {
      method: 'DELETE',
    }, userId);
  }

  async clearCart(userId: string) {
    return this.request('/cart', {
      method: 'DELETE',
    }, userId);
  }

  // Orders endpoints
  async createOrder(orderData: any, userId: string) {
    return this.request('/orders/create', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }, userId);
  }

  async getOrders(userId: string) {
    return this.request('/orders', {}, userId);
  }

  async getOrder(orderId: string, userId: string) {
    return this.request(`/orders/${orderId}`, {}, userId);
  }

  async updateOrderStatus(orderId: string, status: string, userId: string) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }, userId);
  }

  async cancelOrder(orderId: string, userId: string) {
    return this.request(`/orders/${orderId}/cancel`, {
      method: 'PUT',
    }, userId);
  }

  async deleteOrder(orderId: string, userId: string) {
    return this.request(`/orders/${orderId}`, {
      method: 'DELETE',
    }, userId);
  }

  async getPendingOrders(userId: string) {
    return this.request(`/orders/pending/list`, {}, userId);
  }

  // Get all transactions (staff/admin see all, users see their own)
  async getAllTransactions(userId: string) {
    return this.request(`/orders/all/transactions`, {}, userId);
  }

  // Messages endpoints
  async sendMessage(messageData: any, userId: string) {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
    }, userId);
  }

  async getMessages(folder: 'inbox' | 'sent', userId: string) {
    return this.request(`/messages?folder=${folder}`, {}, userId);
  }

  async getMessage(messageId: string, userId: string) {
    return this.request(`/messages/${messageId}`, {}, userId);
  }

  async markMessageAsRead(messageId: string, userId: string) {
    return this.request(`/messages/${messageId}/read`, {
      method: 'PUT',
    }, userId);
  }

  async toggleMessageFavorite(messageId: string, userId: string) {
    return this.request(`/messages/${messageId}/favorite`, {
      method: 'PUT',
    }, userId);
  }

  async deleteMessage(messageId: string, userId: string) {
    return this.request(`/messages/${messageId}`, {
      method: 'DELETE',
    }, userId);
  }
}

export const apiClient = new ApiClient();
