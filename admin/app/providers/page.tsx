'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader, Search } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const fetcher = () => api.get('/admin/providers').then((res) => res.data);

export default function AllProvidersPage() {
  const { data: providers = [], isLoading } = useSWR('all-providers', fetcher, {
    revalidateOnFocus: false,
  });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin" />
      </div>
    );
  }

  let filteredProviders = providers.filter((provider: any) =>
    provider.name?.toLowerCase().includes(search.toLowerCase()) ||
    provider.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (filterStatus === 'verified') {
    filteredProviders = filteredProviders.filter((p: any) => p.isVerified);
  } else if (filterStatus === 'unverified') {
    filteredProviders = filteredProviders.filter((p: any) => !p.isVerified);
  } else if (filterStatus === 'online') {
    filteredProviders = filteredProviders.filter((p: any) => p.isAvailable);
  } else if (filterStatus === 'offline') {
    filteredProviders = filteredProviders.filter((p: any) => !p.isAvailable);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Providers</h1>
        <p className="text-gray-600 mt-1">View and manage all service providers</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none flex-1"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All ({providers.length})
          </button>
          <button
            onClick={() => setFilterStatus('verified')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'verified'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Verified ({providers.filter((p: any) => p.isVerified).length})
          </button>
          <button
            onClick={() => setFilterStatus('unverified')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'unverified'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Unverified ({providers.filter((p: any) => !p.isVerified).length})
          </button>
          <button
            onClick={() => setFilterStatus('online')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'online'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Online
          </button>
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Category</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Verified</th>
                <th className="px-6 py-3 text-left font-semibold">Rating</th>
                <th className="px-6 py-3 text-left font-semibold">Jobs</th>
                <th className="px-6 py-3 text-left font-semibold">Price</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No providers found
                  </td>
                </tr>
              ) : (
                filteredProviders.map((provider: any) => (
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
                        <span className="font-medium">{provider.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{provider.category || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          provider.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {provider.isAvailable ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          provider.isVerified
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {provider.isVerified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{provider.rating || 0} ⭐</td>
                    <td className="px-6 py-4">{provider.totalJobs || 0}</td>
                    <td className="px-6 py-4 font-medium">₹{provider.startingPrice || 0}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/providers/${provider.uid}`}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Providers</p>
          <p className="text-2xl font-bold mt-2">{providers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Verified</p>
          <p className="text-2xl font-bold mt-2 text-green-600">
            {providers.filter((p: any) => p.isVerified).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Online Now</p>
          <p className="text-2xl font-bold mt-2 text-blue-600">
            {providers.filter((p: any) => p.isAvailable).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Avg Rating</p>
          <p className="text-2xl font-bold mt-2">
            {providers.length > 0
              ? (
                  providers.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) /
                  providers.length
                ).toFixed(1)
              : 0}
          </p>
        </div>
      </div>
    </div>
  );
}
