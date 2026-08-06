'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, MessageCircle, Plus, Download, Filter, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { supportApi } from '@/lib/api-client'

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('open')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      setLoading(true)
      const data = await supportApi.getChats()
      setTickets(data || [])
    } catch (error) {
      console.error('[v0] Failed to fetch support chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket)
    setViewModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-700'
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700'
      case 'Resolved':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support & Help Desk</h1>
          <p className="text-gray-600 mt-1">Manage user support tickets and inquiries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download size={20} />
            <span className="ml-2">Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Total Tickets</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{tickets.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Open</p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {tickets.filter((t) => t.status === 'Open').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {tickets.filter((t) => t.status === 'In Progress').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Resolved</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {tickets.filter((t) => t.status === 'Resolved').length}
          </p>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by subject or user..."
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
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{ticket.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ticket.user}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ticket.subject}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        ticket.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : ticket.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ticket.createdAt}</td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewTicket(ticket)}
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

      {/* View Ticket Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-96 flex flex-col">
          <DialogHeader>
            <DialogTitle>Support Ticket {selectedTicket?.id}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b">
              <div>
                <p className="text-gray-600 text-sm">User</p>
                <p className="mt-1 text-gray-900 font-medium">{selectedTicket?.user}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket?.status)}`}>
                    {selectedTicket?.status}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <p className="text-gray-600 text-sm">Subject</p>
              <p className="mt-1 text-gray-900 font-medium">{selectedTicket?.subject}</p>
            </div>

            <div>
              <p className="text-gray-600 text-sm mb-2">Conversation</p>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                {selectedTicket?.messages.map((msg: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'Admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        msg.sender === 'Admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-xs opacity-75 mb-1">{msg.sender} - {msg.timestamp}</p>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-gray-600 text-sm mb-2">Reply</p>
              <Textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <MessageCircle size={18} />
              <span className="ml-2">Send Reply</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
