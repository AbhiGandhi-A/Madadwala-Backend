'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Trash2, Check, X, Eye, Plus, Filter, Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const API_BASE = ''

interface Provider {
  _id: string
  uid: string
  name: string
  email: string
  category: string
  rating: number
  reviewCount: number
  isVerified: boolean
  isAvailable: boolean
  createdAt: string
  startingPrice: number
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingProviders, setPendingProviders] = useState<string[]>([])

  useEffect(() => {
    fetchProviders()
  }, [])

  useEffect(() => {
    let filtered = providers

    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) =>
        filterStatus === 'verified' ? p.isVerified : !p.isVerified
      )
    }

    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    setFilteredProviders(filtered)
  }, [searchTerm, filterStatus, providers])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const [allProvidersResponse, pendingResponse] = await Promise.all([
        fetch(`${API_BASE}/api/providers`),
        fetch(`${API_BASE}/api/admin/pending-providers`),
      ])
      const allProviders = allProvidersResponse.ok ? await allProvidersResponse.json() : []
      const pending = pendingResponse.ok ? await pendingResponse.json() : []
      setProviders(Array.isArray(allProviders) ? allProviders : [])
      setPendingProviders(Array.isArray(pending) ? pending.map((p: any) => p.uid) : [])
    } catch (error) {
      console.error('[v0] Failed to fetch providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProvider = (provider: Provider) => {
    setSelectedProvider(provider)
    setViewModalOpen(true)
  }

  const handleApproveProvider = (providerId: string) => {
    setSelectedProvider(providers.find((p) => p.uid === providerId) || null)
    setApproveConfirmOpen(true)
  }

  const handleRejectProvider = (providerId: string) => {
    setSelectedProvider(providers.find((p) => p.uid === providerId) || null)
    setRejectConfirmOpen(true)
  }

  const handleDeleteProvider = (providerId: string) => {
    setSelectedProvider(providers.find((p) => p.uid === providerId) || null)
    setDeleteConfirmOpen(true)
  }

  const confirmApprove = async () => {
    if (selectedProvider) {
      try {
        await fetch(`${API_BASE}/api/admin/approve-provider`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: selectedProvider.uid }),
        })
        await fetchProviders()
        setApproveConfirmOpen(false)
      } catch (error) {
        console.error('[v0] Failed to approve provider:', error)
      }
    }
  }

  const confirmDelete = async () => {
    if (selectedProvider) {
      try {
        await fetch(`${API_BASE}/api/providers/${selectedProvider.uid}`, { method: 'DELETE' })
        await fetchProviders()
        setDeleteConfirmOpen(false)
      } catch (error) {
        console.error('[v0] Failed to delete provider:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Provider Management</h1>
          <p className="text-gray-600 mt-1">
            Manage service providers and approvals ({pendingProviders.length} pending)
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus size={20} />
          <span className="ml-2">Add Provider</span>
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, email, or category..."
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
            <option value="all">All Providers</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Approval</option>
          </select>
          <Button variant="outline">
            <Filter size={20} />
            <span className="ml-2">More Filters</span>
          </Button>
        </div>
      </Card>

      {/* Providers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.map((provider) => (
                <tr key={provider._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{provider.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{provider.category}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{provider.rating}</span>
                      <span className="text-gray-500">({provider.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pendingProviders.includes(provider.uid)
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {pendingProviders.includes(provider.uid) ? 'Pending' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        provider.isAvailable
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {provider.isAvailable ? 'Available' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        provider.isVerified
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {provider.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{provider.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewProvider(provider)}
                        title="View"
                      >
                        <Eye size={18} className="text-blue-600" />
                      </Button>
                      {pendingProviders.includes(provider.uid) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApproveProvider(provider.uid)}
                            title="Approve"
                          >
                            <Check size={18} className="text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRejectProvider(provider.uid)}
                            title="Reject"
                          >
                            <X size={18} className="text-red-600" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProvider(provider.uid)}
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Provider Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Provider Details</DialogTitle>
          </DialogHeader>
          {selectedProvider && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Name</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedProvider.name}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedProvider.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Category</Label>
                  <p className="mt-1 text-gray-900 font-medium">{selectedProvider.category}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Rating</Label>
                  <p className="mt-1 text-gray-900 font-medium">
                    {selectedProvider.rating} / 5 ({selectedProvider.reviewCount} reviews)
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Starting Price</Label>
                  <p className="mt-1 text-gray-900 font-medium">₹{selectedProvider.startingPrice}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Verified</Label>
                  <p className="mt-1 text-gray-900 font-medium">
                    {selectedProvider.isVerified ? 'Yes' : 'No'}
                  </p>
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

      {/* Approve Confirmation Modal */}
      <Dialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Provider</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to approve {selectedProvider?.name}? They will be able to accept bookings.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmApprove}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Provider</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to reject {selectedProvider?.name}? They will not be able to access the platform.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectConfirmOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white">Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete {selectedProvider?.name}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
