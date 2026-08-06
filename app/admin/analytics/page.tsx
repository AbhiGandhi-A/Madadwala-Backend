'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Download, Filter } from 'lucide-react'
import { analyticsApi } from '@/lib/api-client'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const data = await analyticsApi.getAll()
      setAnalytics(data || {})
    } catch (error) {
      console.error('[v0] Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const metrics = [
    { label: 'Total Revenue', value: `₹${analytics.totalRevenue || 0}`, trend: `${analytics.revenueTrend || 0}%`, color: 'bg-green-100 text-green-700' },
    { label: 'Avg Booking Value', value: `₹${analytics.avgBookingValue || 0}`, trend: `${analytics.bookingTrend || 0}%`, color: 'bg-blue-100 text-blue-700' },
    { label: 'Conversion Rate', value: `${analytics.conversionRate || 0}%`, trend: `${analytics.conversionTrend || 0}%`, color: 'bg-purple-100 text-purple-700' },
    { label: 'Customer Satisfaction', value: `${analytics.satisfaction || 0}/5`, trend: `${analytics.satisfactionTrend || 0}`, color: 'bg-orange-100 text-orange-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Track detailed business metrics and performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter size={20} />
            <span className="ml-2">Filter</span>
          </Button>
          <Button variant="outline">
            <Download size={20} />
            <span className="ml-2">Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="p-6">
            <p className="text-gray-600 text-sm font-medium">{metric.label}</p>
            <div className="mt-2">
              <h3 className={`text-2xl font-bold ${metric.color}`}>{metric.value}</h3>
              <p className="text-green-600 text-sm mt-2">📈 {metric.trend} vs last month</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart will be integrated with real data</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Service Category Breakdown</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart will be integrated with real data</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp size={48} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart will be integrated with real data</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Status Distribution</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart will be integrated with real data</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Providers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Rahul Electrician', bookings: 156, revenue: '₹78,000', rating: '4.9' },
                { name: 'Expert Painter', bookings: 143, revenue: '₹71,500', rating: '4.8' },
                { name: 'Sharma Plumber', bookings: 128, revenue: '₹64,000', rating: '4.6' },
              ].map((provider, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{provider.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{provider.bookings}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{provider.revenue}</td>
                  <td className="px-6 py-4 text-sm">⭐ {provider.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
