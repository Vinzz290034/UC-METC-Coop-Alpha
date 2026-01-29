const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    options: RequestInit = {}
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

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw {
          message: error.message || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return await response.json();
    } catch (err: any) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
    return this.request('/users');
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
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
}

export const apiClient = new ApiClient();
