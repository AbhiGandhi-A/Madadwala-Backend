'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Download, Filter, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { analyticsApi } from '@/lib/api-client'

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await analyticsApi.getActivityLogs().catch(() => [])
      setLogs(data || [])
    } catch (error) {
      console.error('[v0] Failed to fetch activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewLog = (log: any) => {
    setSelectedLog(log)
    setViewModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-1">Track all system activities and user actions</p>
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
          <p className="text-gray-600 text-sm">Total Activities</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">5,234</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Today</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">234</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">This Week</p>
          <p className="text-2xl font-bold text-green-600 mt-2">1,456</p>
        </Card>
        <Card className="p-4">
          <p className="text-gray-600 text-sm">Success Rate</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">99.8%</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by action, user, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{log.timestamp}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.user}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.description}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{log.ip}</td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewLog(log)}
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

      {/* View Log Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Timestamp</p>
                  <p className="mt-1 text-gray-900 font-medium">{selectedLog.timestamp}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">User</p>
                  <p className="mt-1 text-gray-900 font-medium">{selectedLog.user}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Action</p>
                  <p className="mt-1 text-gray-900 font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <p className="mt-1 text-gray-900 font-medium">{selectedLog.status}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 text-sm">Description</p>
                  <p className="mt-1 text-gray-900">{selectedLog.description}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600 text-sm">IP Address</p>
                  <p className="mt-1 text-gray-900 font-mono">{selectedLog.ip}</p>
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
    </div>
  )
}
