'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Download, Filter, Edit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { analyticsApi } from '@/lib/api-client'

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const data = await analyticsApi.getCommissions().catch(() => [])
      setCommissions(data || [])
    } catch (error) {
      console.error('[v0] Failed to fetch commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCommissions = commissions.filter((c) =>
    c.provider.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-600 mt-1">Manage provider commissions and rates</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Total Commissions</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">₹25,760</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Paid Out</p>
          <p className="text-2xl font-bold text-green-600 mt-2">₹14,200</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">₹11,560</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Avg Rate</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">9.75%</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by provider name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Commissions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.map((commission) => (
                <tr key={commission.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{commission.provider}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{commission.bookings}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{commission.totalAmount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{commission.rate}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold">{commission.commission}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        commission.status === 'Paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {commission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm">
                      <Edit size={18} className="text-blue-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Commission Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Commission Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-gray-700 font-medium">Default Commission Rate (%)</label>
            <input type="number" defaultValue="10" className="w-full px-4 py-2 border rounded mt-2" />
          </div>
          <div>
            <label className="text-gray-700 font-medium">Min Commission Rate (%)</label>
            <input type="number" defaultValue="5" className="w-full px-4 py-2 border rounded mt-2" />
          </div>
          <div>
            <label className="text-gray-700 font-medium">Max Commission Rate (%)</label>
            <input type="number" defaultValue="20" className="w-full px-4 py-2 border rounded mt-2" />
          </div>
        </div>
        <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
          Save Settings
        </Button>
      </Card>
    </div>
  )
}
