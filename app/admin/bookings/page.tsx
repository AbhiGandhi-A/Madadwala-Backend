'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Eye, Download, Filter, Calendar, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { bookingsApi } from '@/lib/api-client'

interface Booking {
  _id: string
  id: string
  customerName: string
  providerName: string
  serviceName: string
  status: string
  address: string
  scheduledTime: string
  totalAmount: number
  paymentStatus: string
  createdAt: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-blue-100 text-blue-700',
  on_the_way: 'bg-purple-100 text-purple-700',
  arrived: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-cyan-100 text-cyan-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    let filtered = bookings

    if (filterStatus !== 'all') {
      filtered = filtered.filter((b) => b.status === filterStatus)
    }

    filtered = filtered.filter(
      (b) =>
        b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    setFilteredBookings(filtered)
  }, [searchTerm, filterStatus, bookings])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const [data, statsData] = await Promise.all([
        bookingsApi.getAll().catch(() => []),
        bookingsApi.getStats().catch(() => ({})),
      ])
      setBookings(data || [])
      setStats(statsData || {})
    } catch (error) {
      console.error('[v0] Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setViewModalOpen(true)
  }

  const getStatusBadgeClass = (status: string) => {
    return statusColors[status] || 'bg-gray-100 text-gray-700'
  }

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all service bookings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: stats.totalBookings || 0, color: 'bg-blue-100 text-blue-700' },
          { label: 'Completed', value: stats.completed || 0, color: 'bg-green-100 text-green-700' },
          { label: 'In Progress', value: stats.inProgress || 0, color: 'bg-cyan-100 text-cyan-700' },
          { label: 'Cancelled', value: stats.cancelled || 0, color: 'bg-red-100 text-red-700' },
        ].map((stat, idx) => (
          <Card key={idx} className="p-4">
            <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by customer, provider, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="on_the_way">On the Way</option>
            <option value="arrived">Arrived</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline">
            <Filter size={20} />
            <span className="ml-2">Filter</span>
          </Button>
          <Button variant="outline">
            <Download size={20} />
            <span className="ml-2">Export</span>
          </Button>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{booking.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{booking.providerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{booking.serviceName}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                      {formatStatus(booking.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{booking.totalAmount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{booking.scheduledTime}</td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewBooking(booking)}
                      title="View"
                    >
                      <Eye size={18} className="text-blue-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Booking Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600 text-sm">Booking ID</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedBooking.id}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Status</Label>
                  <p className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusBadgeClass(selectedBooking.status)}`}>
                      {formatStatus(selectedBooking.status)}
                    </span>
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Customer</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Provider</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedBooking.providerName}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Service</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedBooking.serviceName}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Amount</Label>
                  <p className="mt-1 text-gray-900 font-medium">₹{selectedBooking.totalAmount}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Scheduled Time</Label>
                  <p className="mt-1 text-gray-900 font-medium flex items-center gap-2">
                    <Calendar size={16} />
                    {selectedBooking.scheduledTime}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Payment Status</Label>
                  <p className="mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                        selectedBooking.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {selectedBooking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-600 text-sm">Address</Label>
                <p className="mt-1 text-gray-900 flex items-center gap-2">
                  <MapPin size={16} className="text-gray-600" />
                  {selectedBooking.address}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
