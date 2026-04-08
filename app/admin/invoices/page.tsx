'use client';

import { useEffect, useState } from 'react';

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  vat_amount: number;
  cis_amount: number;
  status: string;
  submitted_at: string;
  subcontractor_name: string;
  subcontractor_company: string;
  contractor_name: string;
  contractor_company: string;
}

function statusBadge(status: string) {
  const colours: Record<string, string> = {
    pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    approved: 'bg-green-600/20 text-green-400 border-green-600/30',
    rejected: 'bg-red-600/20 text-red-400 border-red-600/30',
    queried: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
  };
  return colours[status] || 'bg-slate-600/20 text-slate-400 border-slate-600/30';
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/invoices')
      .then((r) => r.json())
      .then((d) => {
        setInvoices(d.invoices || []);
        setTotalRevenue(d.totalRevenue || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter === 'all' ? invoices : invoices.filter((i) => i.status === statusFilter);

  const statuses = ['all', 'pending', 'approved', 'rejected', 'queried'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <p className="text-slate-400 mt-1">All invoices across the platform</p>
      </div>

      {/* Total revenue card */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6 inline-block">
        <p className="text-slate-400 text-sm mb-1">Total Revenue Processed</p>
        <p className="text-3xl font-bold text-white">
          £{totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Status filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
              statusFilter === s
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Subcontractor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Contractor</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">VAT</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">CIS</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Net</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">No invoices found</td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  const net = inv.amount - inv.cis_amount;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-4 text-white text-sm font-medium">{inv.invoice_number}</td>
                      <td className="px-4 py-4 text-slate-300 text-sm">
                        <div>{inv.subcontractor_name || '—'}</div>
                        {inv.subcontractor_company && (
                          <div className="text-xs text-slate-500">{inv.subcontractor_company}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-300 text-sm">
                        <div>{inv.contractor_name || '—'}</div>
                        {inv.contractor_company && (
                          <div className="text-xs text-slate-500">{inv.contractor_company}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-white text-sm text-right">
                        £{inv.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-slate-300 text-sm text-right">
                        £{inv.vat_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-red-400 text-sm text-right">
                        £{inv.cis_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-green-400 text-sm text-right font-medium">
                        £{net.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs border capitalize ${statusBadge(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-sm">
                        {new Date(inv.submitted_at).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="px-6 py-3 border-t border-slate-700 text-slate-400 text-sm">
            Showing {filtered.length} of {invoices.length} invoices
          </div>
        )}
      </div>
    </div>
  );
}
