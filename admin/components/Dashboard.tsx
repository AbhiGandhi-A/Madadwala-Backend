'use client';

import useSWR from 'swr';
import { getAnalytics } from '@/lib/api';
import { Users, Briefcase, TrendingUp, DollarSign, Loader } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const fetcher = () => getAnalytics().then((res) => res.data);

export default function Dashboard() {
  const { data, error, isLoading } = useSWR('analytics', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader size={32} className="animate-spin text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load analytics data</p>
      </div>
    );
  }

  const stats = data || {};

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold mt-2">{value || 0}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  const categoryData = stats.categories?.map((cat: any) => ({
    name: cat.name,
    value: Math.round(cat.ratio * 100),
  })) || [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your platform overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Customers"
          value={stats.totalUsers}
          color="bg-blue-600"
        />
        <StatCard
          icon={Briefcase}
          label="Verified Providers"
          value={stats.totalProviders}
          color="bg-green-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Bookings"
          value={stats.totalBookings}
          color="bg-yellow-600"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`₹${stats.totalRevenue ? Math.round(stats.totalRevenue) : 0}`}
          color="bg-purple-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Provider Distribution by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No provider data available</p>
          )}
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Platform Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-gray-600">Avg Revenue per Booking</span>
              <span className="font-semibold">
                ₹
                {stats.totalBookings
                  ? Math.round(stats.totalRevenue / stats.totalBookings)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-gray-600">Customer to Provider Ratio</span>
              <span className="font-semibold">
                {stats.totalProviders
                  ? Math.round(stats.totalUsers / stats.totalProviders)
                  : 0}
                :1
              </span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-gray-600">Conversion Rate (Bookings/Customers)</span>
              <span className="font-semibold">
                {stats.totalUsers
                  ? Math.round((stats.totalBookings / stats.totalUsers) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Categories</span>
              <span className="font-semibold">{categoryData.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            <p className="font-medium text-blue-600">View Providers</p>
            <p className="text-sm text-gray-600 mt-1">Manage pending approvals</p>
          </button>
          <button className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors">
            <p className="font-medium text-green-600">View Bookings</p>
            <p className="text-sm text-gray-600 mt-1">Check active jobs</p>
          </button>
          <button className="p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors">
            <p className="font-medium text-yellow-600">Withdrawals</p>
            <p className="text-sm text-gray-600 mt-1">Process payments</p>
          </button>
          <button className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
            <p className="font-medium text-purple-600">Support</p>
            <p className="text-sm text-gray-600 mt-1">View support tickets</p>
          </button>
        </div>
      </div>
    </div>
  );
}
