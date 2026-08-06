'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { Loader, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';

const getAllTransactions = () =>
  api.get('/admin/transactions').then((res) => res.data);

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useSWR('transactions', getAllTransactions, {
    revalidateOnFocus: false,
  });
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin" />
      </div>
    );
  }

  const filteredTransactions = transactions.filter((tx: any) =>
    tx.title?.toLowerCase().includes(search.toLowerCase()) ||
    tx.userUid?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCredit = transactions.reduce(
    (sum: number, tx: any) => sum + (tx.type === 'credit' ? tx.amount : 0),
    0
  );

  const totalDebit = transactions.reduce(
    (sum: number, tx: any) => sum + (tx.type === 'debit' ? tx.amount : 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-gray-600 mt-1">View all wallet transactions and movements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-gray-600 text-sm">Total Transactions</p>
          <p className="text-2xl font-bold mt-2">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Credits</p>
              <p className="text-2xl font-bold mt-2 text-green-600">₹{totalCredit}</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Debits</p>
              <p className="text-2xl font-bold mt-2 text-red-600">₹{totalDebit}</p>
            </div>
            <TrendingDown className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search by user or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none flex-1"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">User ID</th>
                <th className="px-6 py-3 text-left font-semibold">Type</th>
                <th className="px-6 py-3 text-left font-semibold">Title</th>
                <th className="px-6 py-3 text-left font-semibold">Description</th>
                <th className="px-6 py-3 text-left font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">{tx.userUid?.slice(-6) || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'credit'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{tx.title}</td>
                    <td className="px-6 py-4 text-gray-600">{tx.description || 'N/A'}</td>
                    <td className={`px-6 py-4 font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
