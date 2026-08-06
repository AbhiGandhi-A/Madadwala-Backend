'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Plus, Download, Trash2, Edit } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const API_BASE = ''

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/offers`)
      const data = response.ok ? await response.json() : []
      setCoupons(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('[v0] Failed to fetch coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupons & Promotions</h1>
          <p className="text-gray-600 mt-1">Create and manage promotional coupons</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setAddModalOpen(true)}>
          <Plus size={20} />
          <span className="ml-2">Create Coupon</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Total Coupons</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{coupons.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {coupons.filter((c) => c.status === 'Active').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Total Usage</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {coupons.reduce((sum, c) => sum + c.used, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Utilization Rate</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">62%</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by coupon code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Coupons Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 font-mono">{coupon.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{coupon.discount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{coupon.maxUsage}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{coupon.used}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {coupon.maxUsage - coupon.used}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        coupon.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {coupon.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit size={18} className="text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 size={18} className="text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Coupon Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-700">Coupon Code</Label>
              <Input placeholder="e.g., SUMMER50" className="mt-2" />
            </div>
            <div>
              <Label className="text-gray-700">Discount Type</Label>
              <select className="w-full px-4 py-2 border rounded mt-2">
                <option>Percentage (%)</option>
                <option>Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-700">Discount Value</Label>
              <Input placeholder="e.g., 50" type="number" className="mt-2" />
            </div>
            <div>
              <Label className="text-gray-700">Max Usage</Label>
              <Input placeholder="e.g., 100" type="number" className="mt-2" />
            </div>
            <div>
              <Label className="text-gray-700">Expiry Date</Label>
              <Input type="date" className="mt-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
