import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Analytics
export const getAnalytics = () => api.get('/admin/analytics');

// Users
export const getAllUsers = () => api.get('/admin/users');
export const getUserById = (uid: string) => api.get(`/admin/users/${uid}`);
export const deleteUser = (uid: string) => api.delete(`/admin/users/${uid}`);
export const blockUser = (uid: string) => api.patch(`/admin/users/${uid}/block`, {});
export const unblockUser = (uid: string) => api.patch(`/admin/users/${uid}/unblock`, {});

// Providers
export const getPendingProviders = () => api.get('/admin/pending-providers');
export const approveProvider = (uid: string) => api.post('/admin/approve-provider', { uid });
export const rejectProvider = (uid: string) => api.post('/admin/reject-provider', { uid });
export const getAllProviders = () => api.get('/admin/providers');

// Bookings
export const getActiveJobs = () => api.get('/admin/active-jobs');
export const getAllBookings = () => api.get('/admin/bookings');
export const getBookingById = (id: string) => api.get(`/admin/bookings/${id}`);
export const updateBookingStatus = (id: string, status: string) =>
  api.patch(`/admin/bookings/${id}`, { status });

// Withdrawals
export const getPendingWithdrawals = () => api.get('/admin/withdrawals/pending');
export const approveWithdrawal = (id: string, rejectionReason?: string) =>
  api.patch(`/admin/withdrawals/${id}`, { status: 'approved', rejectionReason });
export const rejectWithdrawal = (id: string, rejectionReason: string) =>
  api.patch(`/admin/withdrawals/${id}`, { status: 'rejected', rejectionReason });

// Transactions
export const getTransactions = (uid: string) => api.get(`/wallet/transactions/${uid}`);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (name: string, icon: string) =>
  api.post('/admin/categories', { name, icon });
export const deleteCategory = (id: string) => api.delete(`/admin/categories/${id}`);

// Support
export const getSupportChats = () => api.get('/admin/support/chats');
export const getSupportMessages = (userId: string) => api.get(`/support/messages/${userId}`);
export const sendSupportMessage = (senderUid: string, receiverUid: string, message: string) =>
  api.post('/support/messages', { senderUid, receiverUid, message, isAdmin: true });

// Reports
export const getReports = () => api.get('/admin/reports');
export const updateReportStatus = (id: string, status: string) =>
  api.patch(`/admin/reports/${id}`, { status });

// Settings
export const getSettings = () => api.get('/admin/settings');
export const updateSettings = (key: string, value: any) =>
  api.put('/admin/settings', { key, value });
