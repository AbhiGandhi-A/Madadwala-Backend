'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader, Trash2, Lock, LockOpen, Search } from 'lucide-react';
import { useState } from 'react';

const fetcher = () => api.get('/admin/users').then((res) => res.data);

export default function UsersPage() {
  const { data: users = [], error, isLoading, mutate } = useSWR('admin/users', fetcher, {
    revalidateOnFocus: false,
  });
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin" />
      </div>
    );
  }

  const filteredUsers = users.filter((user: any) =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.phoneNumber?.includes(search) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (uid: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setLoadingAction(uid);
    try {
      await api.delete(`/admin/users/${uid}`);
      mutate();
      alert('User deleted successfully');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to delete user'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBlock = async (uid: string) => {
    setLoadingAction(uid);
    try {
      await api.patch(`/admin/users/${uid}/block`, {});
      mutate();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to block user'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUnblock = async (uid: string) => {
    setLoadingAction(uid);
    try {
      await api.patch(`/admin/users/${uid}/unblock`, {});
      mutate();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to unblock user'));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users Management</h1>
        <p className="text-gray-600 mt-1">Manage all customers and providers</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none flex-1"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.profileImage && (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium">{user.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phoneNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'provider'
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            user.blocked ? handleUnblock(user.uid) : handleBlock(user.uid)
                          }
                          disabled={loadingAction === user.uid}
                          className={`p-2 rounded-lg transition-colors ${
                            user.blocked
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          }`}
                          title={user.blocked ? 'Unblock' : 'Block'}
                        >
                          {user.blocked ? <LockOpen size={16} /> : <Lock size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(user.uid)}
                          disabled={loadingAction === user.uid}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Users</p>
          <p className="text-2xl font-bold mt-2">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Verified Users</p>
          <p className="text-2xl font-bold mt-2">
            {users.filter((u: any) => u.isVerified).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Providers</p>
          <p className="text-2xl font-bold mt-2">
            {users.filter((u: any) => u.role === 'provider').length}
          </p>
        </div>
      </div>
    </div>
  );
}
