'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Briefcase, Calendar, CreditCard, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import { analyticsApi, jobsApi, providersApi } from '@/lib/api-client'

interface DashboardStats {
  totalUsers: number
  totalProviders: number
  totalBookings: number
  totalWithdrawals: number
  revenue: number
  pendingApprovals: number
  activeBookings: number
  userGrowth: number
  providerGrowth: number
  bookingGrowth: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    totalWithdrawals: 0,
    revenue: 0,
    pendingApprovals: 0,
    activeBookings: 0,
    userGrowth: 0,
    providerGrowth: 0,
    bookingGrowth: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [analyticsData, activeJobs, pendingProviders] = await Promise.all([
          analyticsApi.getAll().catch(() => ({})),
          jobsApi.getActive().catch(() => []),
          providersApi.getPending().catch(() => []),
        ])

        setStats((prev) => ({
          ...prev,
          ...analyticsData,
          activeBookings: activeJobs.length || 0,
          pendingApprovals: pendingProviders.length || 0,
        }))
      } catch (err) {
        console.error('[v0] Failed to fetch stats:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const StatCard = ({
    icon: Icon,
    title,
    value,
    growth,
    color,
  }: {
    icon: any
    title: string
    value: number | string
    growth?: number
    color: string
  }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">
            {typeof value === 'number' && value > 1000
              ? `${(value / 1000).toFixed(1)}K`
              : value}
          </h3>
          {growth !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {growth > 0 ? (
                <>
                  <ArrowUp size={16} className="text-green-500" />
                  <span className="text-sm text-green-600">{growth}%</span>
                </>
              ) : (
                <>
                  <ArrowDown size={16} className="text-red-500" />
                  <span className="text-sm text-red-600">{Math.abs(growth)}%</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <h2 className="text-3xl font-bold">Welcome to Admin Dashboard</h2>
        <p className="text-blue-100 mt-2">Here's what's happening with your business today</p>
        {loading && <p className="text-blue-100 text-sm mt-2">Loading data...</p>}
        {error && <p className="text-red-200 text-sm mt-2">⚠️ {error}</p>}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Users"
          value={stats.totalUsers}
          growth={stats.userGrowth}
          color="bg-blue-500"
        />
        <StatCard
          icon={Briefcase}
          title="Total Providers"
          value={stats.totalProviders}
          growth={stats.providerGrowth}
          color="bg-purple-500"
        />
        <StatCard
          icon={Calendar}
          title="Total Bookings"
          value={stats.totalBookings}
          growth={stats.bookingGrowth}
          color="bg-green-500"
        />
        <StatCard
          icon={CreditCard}
          title="Revenue"
          value={`₹${stats.revenue}`}
          color="bg-orange-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Approvals</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingApprovals}</h3>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <Briefcase size={24} className="text-yellow-600" />
            </div>
          </div>
          <Button className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 text-white">
            Review Providers
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Bookings</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.activeBookings}</h3>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <Calendar size={24} className="text-green-600" />
            </div>
          </div>
          <Button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white">
            View Bookings
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Withdrawals</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                ₹{(stats.totalWithdrawals / 1000).toFixed(1)}K
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <CreditCard size={24} className="text-blue-600" />
            </div>
          </div>
          <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white">
            Manage Withdrawals
          </Button>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button className="h-12 bg-blue-600 hover:bg-blue-700 text-white">
            Add User
          </Button>
          <Button className="h-12 bg-purple-600 hover:bg-purple-700 text-white">
            Add Provider
          </Button>
          <Button className="h-12 bg-green-600 hover:bg-green-700 text-white">
            Create Offer
          </Button>
          <Button className="h-12 bg-orange-600 hover:bg-orange-700 text-white">
            Add Category
          </Button>
        </div>
      </div>
    </div>
  )
}
