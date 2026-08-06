'use client';

import useSWR from 'swr';
import { getActiveJobs } from '@/lib/api';
import { Loader, MapPin, Clock } from 'lucide-react';

const fetcher = () => getActiveJobs().then((res) => res.data);

export default function ActiveJobsPage() {
  const { data: jobs = [], isLoading } = useSWR('active-jobs', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      accepted: 'bg-blue-100 text-blue-800',
      on_the_way: 'bg-cyan-100 text-cyan-800',
      arrived: 'bg-indigo-100 text-indigo-800',
      in_progress: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Active Jobs</h1>
        <p className="text-gray-600 mt-1">Real-time view of ongoing bookings</p>
      </div>

      {/* Active Jobs Count */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <p className="text-gray-600">Total Active Jobs: <span className="text-2xl font-bold text-blue-600">{jobs.length}</span></p>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            No active jobs at the moment
          </div>
        ) : (
          jobs.map((job: any) => (
            <div key={job._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{job.serviceName || 'Service'}</h3>
                  <p className="text-xs text-gray-500">{job.customerName}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={14} />
                  <span>{new Date(job.scheduledTime).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={14} />
                  <span className="truncate">{job.address}</span>
                </div>
                <div className="font-medium">
                  Amount: <span className="text-lg text-green-600">₹{job.totalAmount}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-medium">{job.providerName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment:</span>
                  <span className={`font-medium ${job.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {job.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Accepted</p>
          <p className="text-2xl font-bold mt-2">
            {jobs.filter((j: any) => j.status === 'accepted').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">On The Way</p>
          <p className="text-2xl font-bold mt-2">
            {jobs.filter((j: any) => j.status === 'on_the_way').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">In Progress</p>
          <p className="text-2xl font-bold mt-2">
            {jobs.filter((j: any) => j.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Arrived</p>
          <p className="text-2xl font-bold mt-2">
            {jobs.filter((j: any) => j.status === 'arrived').length}
          </p>
        </div>
      </div>
    </div>
  );
}
