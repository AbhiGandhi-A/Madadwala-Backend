'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader, LockOpen } from 'lucide-react';
import { useState } from 'react';

const fetcher = () => api.get('/admin/blocked-users').then((res) => res.data);

export default function BlockedUsersPage() {
  const { data: blockedUsers = [], isLoading, mutate } = useSWR('blocked-users', fetcher, {
    revalidateOnFocus: false,
  });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin" />
      </div>
    );
  }

  const handleUnblock = async (uid: string) => {
    setLoadingAction(uid);
    try {
      await api.patch(`/admin/users/${uid}/unblock`, {});
      mutate();
      alert('User unblocked successfully');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to unblock user'));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Blocked Users</h1>
        <p className="text-gray-600 mt-1">Manage blocked users and restricted accounts</p>
      </div>

      {/* Blocked Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Blocked On</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blockedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No blocked users
                  </td>
                </tr>
              ) : (
                blockedUsers.map((user: any) => (
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
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.phoneNumber}</td>
                    <td className="px-6 py-4 text-sm">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'provider'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.blockedAt ? new Date(user.blockedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleUnblock(user.uid)}
                        disabled={loadingAction === user.uid}
                        className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                        title="Unblock User"
                      >
                        <LockOpen size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <p className="text-gray-600 text-sm">Total Blocked Users: <span className="text-2xl font-bold">{blockedUsers.length}</span></p>
      </div>
    </div>
  );
}
