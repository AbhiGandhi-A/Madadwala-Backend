'use client';

import useSWR from 'swr';
import { getPendingWithdrawals, approveWithdrawal, rejectWithdrawal } from '@/lib/api';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

const fetcher = () => getPendingWithdrawals().then((res) => res.data);

export default function WithdrawalsPage() {
  const { data: withdrawals = [], error, isLoading, mutate } = useSWR('withdrawals', fetcher, {
    revalidateOnFocus: false,
  });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin" />
      </div>
    );
  }

  const handleApprove = async (id: string) => {
    setLoadingAction(id);
    try {
      await approveWithdrawal(id);
      mutate();
      alert('Withdrawal approved successfully');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to approve withdrawal'));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingAction(id);
    try {
      await rejectWithdrawal(id, rejectReason || 'Rejected by admin');
      mutate();
      setShowRejectForm(null);
      setRejectReason('');
      alert('Withdrawal rejected successfully');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to reject withdrawal'));
    } finally {
      setLoadingAction(null);
    }
  };

  const totalAmount = withdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
        <p className="text-gray-600 mt-1">Manage provider withdrawal requests</p>
      </div>

      {/* Withdrawal Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Provider Name</th>
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Account Number</th>
                <th className="px-6 py-3 text-left font-semibold">IFSC Code</th>
                <th className="px-6 py-3 text-left font-semibold">Requested On</th>
                <th className="px-6 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No pending withdrawal requests
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal: any) => (
                  <tr key={withdrawal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{withdrawal.providerName || 'N/A'}</td>
                    <td className="px-6 py-4 font-bold text-lg">₹{withdrawal.amount}</td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {withdrawal.accountNumber?.slice(-4) ? `****${withdrawal.accountNumber.slice(-4)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{withdrawal.ifscCode || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(withdrawal._id)}
                          disabled={loadingAction === withdrawal._id}
                          className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => setShowRejectForm(withdrawal._id)}
                          disabled={loadingAction === withdrawal._id}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>

                      {/* Reject Form Modal */}
                      {showRejectForm === withdrawal._id && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Reject Withdrawal</h3>
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Enter rejection reason..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setShowRejectForm(null);
                                  setRejectReason('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReject(withdrawal._id)}
                                disabled={loadingAction === withdrawal._id}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Pending Requests</p>
          <p className="text-2xl font-bold mt-2">{withdrawals.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Amount</p>
          <p className="text-2xl font-bold mt-2">₹{totalAmount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Average Amount</p>
          <p className="text-2xl font-bold mt-2">
            ₹{withdrawals.length > 0 ? Math.round(totalAmount / withdrawals.length) : 0}
          </p>
        </div>
      </div>
    </div>
  );
}
