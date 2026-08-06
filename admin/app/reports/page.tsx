'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader, Eye, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const fetcher = () => api.get('/admin/reports').then((res) => res.data);

export default function ReportsPage() {
  const { data: reports = [], error, isLoading, mutate } = useSWR('admin/reports', fetcher, {
    revalidateOnFocus: false,
  });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin" />
      </div>
    );
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    setLoadingAction(id);
    try {
      await api.patch(`/admin/reports/${id}`, { status });
      mutate();
      setSelectedReport(null);
      alert('Report status updated');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to update report'));
    } finally {
      setLoadingAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Reports</h1>
        <p className="text-gray-600 mt-1">Manage reported users and violations</p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            No reports found
          </div>
        ) : (
          reports.map((report: any) => (
            <div
              key={report._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">Report ID</h3>
                  <p className="text-xs text-gray-500 font-mono">{report._id?.slice(-8)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Reporter</p>
                  <p className="font-medium">{report.reporterUid || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Reported User</p>
                  <p className="font-medium">{report.reportedUid || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Reason</p>
                  <p className="font-medium">{report.reason || 'N/A'}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedReport(report)}
                className="w-full px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Eye size={16} />
                View Details
              </button>
            </div>
          ))
        )}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold">Report Details</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Report ID</p>
                <p className="font-mono text-sm font-medium">{selectedReport._id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Reporter UID</p>
                  <p className="font-medium">{selectedReport.reporterUid}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Reported UID</p>
                  <p className="font-medium">{selectedReport.reportedUid}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Reason</p>
                <p className="font-medium">{selectedReport.reason}</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Description</p>
                <p className="font-medium">{selectedReport.description || 'N/A'}</p>
              </div>

              {selectedReport.evidenceUrls?.length > 0 && (
                <div>
                  <p className="text-gray-600 text-sm mb-2">Evidence</p>
                  <div className="space-y-1">
                    {selectedReport.evidenceUrls.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm block"
                      >
                        Evidence {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <p className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(selectedReport.status)}`}>
                  {selectedReport.status}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() =>
                    handleUpdateStatus(selectedReport._id, 'reviewed')
                  }
                  disabled={loadingAction === selectedReport._id}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Mark as Reviewed
                </button>
                <button
                  onClick={() =>
                    handleUpdateStatus(selectedReport._id, 'resolved')
                  }
                  disabled={loadingAction === selectedReport._id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Resolve
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Reports</p>
          <p className="text-2xl font-bold mt-2">{reports.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-2xl font-bold mt-2">
            {reports.filter((r: any) => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Resolved</p>
          <p className="text-2xl font-bold mt-2">
            {reports.filter((r: any) => r.status === 'resolved').length}
          </p>
        </div>
      </div>
    </div>
  );
}
