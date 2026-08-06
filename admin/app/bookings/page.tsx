'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader, Search } from 'lucide-react';
import { useState } from 'react';

const fetcher = () => api.get('/admin/bookings').then((res) => res.data);

export default function BookingsPage() {
  const { data: bookings = [], error, isLoading } = useSWR('admin/bookings', fetcher, {
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

  const filteredBookings = bookings.filter((booking: any) =>
    booking.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    booking.providerName?.toLowerCase().includes(search.toLowerCase()) ||
    booking.serviceName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      on_the_way: 'bg-cyan-100 text-cyan-800',
      arrived: 'bg-indigo-100 text-indigo-800',
      in_progress: 'bg-purple-100 text-purple-800',
      done: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    return status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Bookings</h1>
        <p className="text-gray-600 mt-1">Manage all service bookings and orders</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search by customer, provider, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none flex-1"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Booking ID</th>
                <th className="px-6 py-3 text-left font-semibold">Customer</th>
                <th className="px-6 py-3 text-left font-semibold">Provider</th>
                <th className="px-6 py-3 text-left font-semibold">Service</th>
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-left font-semibold">Payment</th>
                <th className="px-6 py-3 text-left font-semibold">Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking: any) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">
                      {booking._id?.slice(-8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4">{booking.customerName || 'N/A'}</td>
                    <td className="px-6 py-4">{booking.providerName || 'N/A'}</td>
                    <td className="px-6 py-4">{booking.serviceName || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium">₹{booking.totalAmount || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {booking.scheduledTime ? new Date(booking.scheduledTime).toLocaleString() : 'N/A'}
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
          <p className="text-gray-600 text-sm">Total Bookings</p>
          <p className="text-2xl font-bold mt-2">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-2xl font-bold mt-2">
            {bookings.filter((b: any) => b.status === 'done').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">In Progress</p>
          <p className="text-2xl font-bold mt-2">
            {bookings.filter((b: any) => ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Paid</p>
          <p className="text-2xl font-bold mt-2">
            {bookings.filter((b: any) => b.paymentStatus === 'paid').length}
          </p>
        </div>
      </div>
    </div>
  );
}
