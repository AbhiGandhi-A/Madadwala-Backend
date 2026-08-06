// API Client for Madadwala Backend
const API_BASE_URL = 'https://madadwala-backend.vercel.app';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  try {
    console.log(`[API] ${options?.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error ${response.status}:`, errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[API] Success:`, result);
    return result;
  } catch (error) {
    console.error(`[API] Failed:`, error);
    throw error;
  }
}

// User API
export const usersApi = {
  getAll: () => apiCall<any[]>('/api/users'),
  
  getById: (uid: string) => apiCall<any>(`/api/users/${uid}`),
  
  update: (uid: string, data: any) =>
    apiCall<any>(`/api/users/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  block: (uid: string) =>
    apiCall<any>(`/api/users/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked: true }),
    }),

  unblock: (uid: string) =>
    apiCall<any>(`/api/users/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked: false }),
    }),

  delete: (uid: string) =>
    apiCall<any>(`/api/users/${uid}`, {
      method: 'DELETE',
    }),
};

// Providers API
export const providersApi = {
  getAll: () => apiCall<any[]>('/api/providers?admin=true'),
  
  getById: (uid: string) => apiCall<any>(`/api/providers/${uid}`),
  
  getPending: () => apiCall<any[]>('/api/admin/pending-providers'),
  
  approve: (uid: string, data: any) =>
    apiCall<any>('/api/admin/approve-provider', {
      method: 'POST',
      body: JSON.stringify({ ...data, uid }),
    }),

  reject: (uid: string, reason: string) =>
    apiCall<any>(`/api/providers/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified: false, rejectionReason: reason }),
    }),

  delete: (uid: string) =>
    apiCall<any>(`/api/providers/${uid}`, {
      method: 'DELETE',
    }),

  getPerformance: (uid: string) =>
    apiCall<any>(`/api/provider/performance/${uid}`),
};

// Bookings API
export const bookingsApi = {
  getAll: () => apiCall<any[]>('/api/bookings'),
  
  getStats: () => apiCall<any>('/api/admin/bookings/stats'),
  
  getById: (id: string) => apiCall<any>(`/api/bookings/${id}`),
  
  getByCustomer: (uid: string) => apiCall<any[]>(`/api/bookings/customer/${uid}`),
  
  getByProvider: (uid: string) => apiCall<any[]>(`/api/bookings/provider/${uid}`),
  
  update: (id: string, data: any) =>
    apiCall<any>(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  complete: (id: string, data: any) =>
    apiCall<any>(`/api/bookings/${id}/complete-payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Withdrawals API
export const withdrawalsApi = {
  getPending: () => apiCall<any[]>('/api/admin/withdrawals/pending'),
  
  approve: (id: string, data: any) =>
    apiCall<any>(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved', ...data }),
    }),

  reject: (id: string, reason: string) =>
    apiCall<any>(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected', rejectionReason: reason }),
    }),

  request: (uid: string, amount: number) =>
    apiCall<any>('/api/withdrawals/request', {
      method: 'POST',
      body: JSON.stringify({ uid, amount }),
    }),
};

// Categories API
export const categoriesApi = {
  getAll: () => apiCall<any[]>('/api/categories'),
  
  create: (data: any) =>
    apiCall<any>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiCall<any>(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<any>(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    }),
};

// Offers API
export const offersApi = {
  getAll: () => apiCall<any[]>('/api/offers'),
  
  create: (data: any) =>
    apiCall<any>('/api/admin/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiCall<any>(`/api/admin/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<any>(`/api/admin/offers/${id}`, {
      method: 'DELETE',
    }),
};

// Banners API
export const bannersApi = {
  getAll: () => apiCall<any[]>('/api/banners'),
  
  create: (formData: FormData) =>
    fetch(`${API_BASE_URL}/api/admin/banners`, {
      method: 'POST',
      body: formData,
    }).then(r => r.json()),

  update: (id: string, formData: FormData) =>
    fetch(`${API_BASE_URL}/api/admin/banners/${id}`, {
      method: 'PUT',
      body: formData,
    }).then(r => r.json()),

  delete: (id: string) =>
    apiCall<any>(`/api/admin/banners/${id}`, {
      method: 'DELETE',
    }),
};

// Analytics API
export const analyticsApi = {
  getAll: () => apiCall<any>('/api/admin/analytics'),
  
  getActivityLogs: () => apiCall<any[]>('/api/admin/activity-logs'),
  
  getCommissions: () => apiCall<any[]>('/api/admin/commissions'),
};

// Support API
export const supportApi = {
  getChats: () => apiCall<any[]>('/api/admin/support/chats'),
  
  getMessages: (userId: string) => apiCall<any[]>(`/api/support/messages/${userId}`),
  
  sendMessage: (userId: string, message: string) =>
    apiCall<any>('/api/support/messages', {
      method: 'POST',
      body: JSON.stringify({ userId, message }),
    }),

  updateStatus: (userId: string, status: string) =>
    apiCall<any>(`/api/support/status/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// Settings API
export const settingsApi = {
  get: () => apiCall<any>('/api/admin/settings'),
  
  getGeneral: () => apiCall<any>('/api/admin/settings/general'),
  
  getNotifications: () => apiCall<any>('/api/admin/settings/notifications'),
  
  getSecurity: () => apiCall<any>('/api/admin/settings/security'),
  
  getPlatform: () => apiCall<any>('/api/admin/settings/platform'),
  
  updateGeneral: (data: any) =>
    apiCall<any>('/api/admin/settings/general', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateNotifications: (data: any) =>
    apiCall<any>('/api/admin/settings/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateSecurity: (data: any) =>
    apiCall<any>('/api/admin/settings/security', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updatePlatform: (data: any) =>
    apiCall<any>('/api/admin/settings/platform', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (data: any) =>
    apiCall<any>('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Active Jobs API
export const jobsApi = {
  getActive: () => apiCall<any[]>('/api/admin/active-jobs'),
};

// Transactions API
export const transactionsApi = {
  getByUser: (uid: string) => apiCall<any[]>(`/api/wallet/transactions/${uid}`),
};
