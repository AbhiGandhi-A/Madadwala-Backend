'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Check, X, Eye, Filter, Download, CreditCard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { withdrawalsApi } from '@/lib/api-client'

interface Withdrawal {
  _id: string
  id: string
  providerName: string
  amount: number
  status: string
  accountNumber: string
  ifscCode: string
  createdAt: string
  holderName: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  failed: 'bg-orange-100 text-orange-700',
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  useEffect(() => {
    let filtered = withdrawals

    if (filterStatus !== 'all') {
      filtered = filtered.filter((w) => w.status === filterStatus)
    }

    filtered = filtered.filter(
      (w) =>
        w.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.accountNumber?.includes(searchTerm)
    )

    setFilteredWithdrawals(filtered)
  }, [searchTerm, filterStatus, withdrawals])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      const data = await withdrawalsApi.getPending()
      setWithdrawals(data || [])
    } catch (error) {
      console.error('[v0] Failed to fetch withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewWithdrawal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setViewModalOpen(true)
  }

  const handleApprove = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setApproveModalOpen(true)
  }

  const handleReject = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setRejectModalOpen(true)
  }

  const confirmApprove = async () => {
    if (selectedWithdrawal) {
      try {
        await withdrawalsApi.approve(selectedWithdrawal._id, {})
        await fetchWithdrawals()
        setApproveModalOpen(false)
      } catch (error) {
        console.error('[v0] Failed to approve withdrawal:', error)
      }
    }
  }

  const confirmReject = async () => {
    if (selectedWithdrawal && rejectionReason) {
      try {
        await withdrawalsApi.reject(selectedWithdrawal._id, rejectionReason)
        await fetchWithdrawals()
        setRejectModalOpen(false)
        setRejectionReason('')
      } catch (error) {
        console.error('[v0] Failed to reject withdrawal:', error)
      }
    }
  }

  const getStatusBadgeClass = (status: string) => {
    return statusColors[status] || 'bg-gray-100 text-gray-700'
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Calculate summary stats
  const stats = {
    pending: withdrawals.filter((w) => w.status === 'pending').length,
    approved: withdrawals.filter((w) => w.status === 'approved').length,
    paid: withdrawals.filter((w) => w.status === 'paid').length,
    total: withdrawals.reduce((sum, w) => sum + w.amount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
          <p className="text-gray-600 mt-1">Manage provider withdrawal requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-gray-600 text-sm font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm font-medium">Approved</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{stats.approved}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm font-medium">Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{stats.paid}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm font-medium">Total Amount</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">₹{(stats.total / 1000).toFixed(1)}K</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by provider name or account..."
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
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
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

      {/* Withdrawals Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{withdrawal.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{withdrawal.providerName}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{withdrawal.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="text-xs">
                      <p className="font-medium">{withdrawal.holderName}</p>
                      <p>{withdrawal.accountNumber}</p>
                      <p>{withdrawal.ifscCode}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(withdrawal.status)}`}>
                      {formatStatus(withdrawal.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{withdrawal.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewWithdrawal(withdrawal)}
                        title="View"
                      >
                        <Eye size={18} className="text-blue-600" />
                      </Button>
                      {withdrawal.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(withdrawal)}
                            title="Approve"
                          >
                            <Check size={18} className="text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(withdrawal)}
                            title="Reject"
                          >
                            <X size={18} className="text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Withdrawal Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600 text-sm">Request ID</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedWithdrawal.id}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Status</Label>
                  <p className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getStatusBadgeClass(selectedWithdrawal.status)}`}>
                      {formatStatus(selectedWithdrawal.status)}
                    </span>
                  </p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-600 text-sm">Provider</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedWithdrawal.providerName}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-600 text-sm">Amount</Label>
                  <p className="mt-1 text-gray-900 text-2xl font-bold">₹{selectedWithdrawal.amount}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Account Holder</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedWithdrawal.holderName}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Account Number</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedWithdrawal.accountNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">IFSC Code</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedWithdrawal.ifscCode}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-sm">Date</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedWithdrawal.createdAt}</p>
                </div>
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

      {/* Approve Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Withdrawal</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to approve this withdrawal of ₹{selectedWithdrawal?.amount}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmApprove}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Please provide a reason for rejecting this withdrawal request.
            </p>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="h-24"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
              onClick={confirmReject}
              disabled={!rejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
