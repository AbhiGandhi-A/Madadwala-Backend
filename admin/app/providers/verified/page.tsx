'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader, Star, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const fetcher = () => api.get('/admin/providers').then((res) => res.data);

export default function VerifiedProvidersPage() {
  const { data: providers = [], isLoading } = useSWR('admin/providers', fetcher, {
    revalidateOnFocus: false,
  });
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin" />
      </div>
    );
  }

  const filteredProviders = providers.filter((provider: any) =>
    provider.name?.toLowerCase().includes(search.toLowerCase()) ||
    provider.category?.toLowerCase().includes(search.toLowerCase())
  );

  const verifiedProviders = filteredProviders.filter((p: any) => p.isVerified);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verified Providers</h1>
        <p className="text-gray-600 mt-1">Browse verified and active service providers</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
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
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verifiedProviders.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            No verified providers found
          </div>
        ) : (
          verifiedProviders.map((provider: any) => (
            <div
              key={provider._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Provider Image */}
              {provider.profileImage && (
                <div className="w-full h-40 overflow-hidden bg-gray-200">
                  <img
                    src={provider.profileImage}
                    alt={provider.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Provider Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg">{provider.name}</h3>
                <p className="text-sm text-blue-600 font-medium">{provider.category}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{provider.rating || 0}</span>
                  <span className="text-xs text-gray-600">({provider.reviewCount || 0} reviews)</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span>{provider.distance || 'N/A'}</span>
                </div>

                {/* Price & Availability */}
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Starting Price:</span>
                    <span className="font-medium">₹{provider.startingPrice || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`font-medium ${
                        provider.isAvailable ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {provider.isAvailable ? 'Available' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Jobs:</span>
                    <span className="font-medium">{provider.totalJobs || 0}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={`/providers/${provider.uid}`}
                  className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors block text-center text-sm font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Verified Providers</p>
          <p className="text-2xl font-bold mt-2">{verifiedProviders.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Avg Rating</p>
          <p className="text-2xl font-bold mt-2">
            {verifiedProviders.length > 0
              ? (
                  verifiedProviders.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) /
                  verifiedProviders.length
                ).toFixed(1)
              : 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Available Now</p>
          <p className="text-2xl font-bold mt-2">
            {verifiedProviders.filter((p: any) => p.isAvailable).length}
          </p>
        </div>
      </div>
    </div>
  );
}
