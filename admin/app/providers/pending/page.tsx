'use client';

import useSWR from 'swr';
import { getPendingProviders, approveProvider } from '@/lib/api';
import { Loader, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const fetcher = () => getPendingProviders().then((res) => res.data);

export default function PendingProvidersPage() {
  const { data: providers = [], error, isLoading, mutate } = useSWR('pending-providers', fetcher, {
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

  const handleApprove = async (uid: string) => {
    setLoadingAction(uid);
    try {
      await approveProvider(uid);
      mutate();
      alert('Provider approved successfully');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to approve provider'));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Providers</h1>
        <p className="text-gray-600 mt-1">Review and approve provider applications</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Aadhaar Number</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Applied On</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No pending providers
                  </td>
                </tr>
              ) : (
                providers.map((provider: any) => (
                  <tr key={provider._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {provider.profileImage && (
                          <img
                            src={provider.profileImage}
                            alt={provider.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium">{provider.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{provider.category || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{provider.phoneNumber}</td>
                    <td className="px-6 py-4 text-sm">{provider.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{provider.aadhaarNumber || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(provider.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/providers/${provider.uid}`}
                          className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleApprove(provider.uid)}
                          disabled={loadingAction === provider.uid}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Reject"
                        >
                          <XCircle size={16} />
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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <p className="text-gray-600 text-sm">Total Pending Providers: <span className="font-bold text-lg">{providers.length}</span></p>
      </div>
    </div>
  );
}
