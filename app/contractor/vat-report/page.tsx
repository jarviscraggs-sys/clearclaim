'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MonthData {
  month: string;
  sales_ex_vat: number;
  vat_charged: number;
  total_inc_vat: number;
}

interface VatData {
  monthly: MonthData[];
  rolling12Month: number;
}

export default function VatReportPage() {
  const [data, setData] = useState<VatData | null>(null);
  const [loading, setLoading] = useState(true);

  const VAT_THRESHOLD = 90000;

  useEffect(() => {
    fetch('/api/contractor/vat-report')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const rolling = data?.rolling12Month || 0;
  const pct = Math.min((rolling / VAT_THRESHOLD) * 100, 100);
  const nearThreshold = rolling >= VAT_THRESHOLD - 10000 && rolling < VAT_THRESHOLD;
  const overThreshold = rolling >= VAT_THRESHOLD;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/contractor" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">VAT Threshold Tracker</h1>
        <p className="text-slate-400 mt-1">Rolling 12-month sales vs £90,000 VAT registration threshold</p>
      </div>

      {/* Threshold card */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Rolling 12-Month Sales (ex VAT)</p>
            <p className="text-3xl font-bold text-white mt-1">£{rolling.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">VAT Threshold</p>
            <p className="text-xl font-semibold text-slate-300">£90,000</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>£0</span>
            <span>{pct.toFixed(1)}% of threshold</span>
            <span>£90,000</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${overThreshold ? 'bg-red-500' : nearThreshold ? 'bg-amber-500' : 'bg-blue-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Warning banners */}
        {overThreshold && (
          <div className="bg-red-900/40 border border-red-600 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="text-red-300 font-semibold">VAT Threshold Exceeded</p>
              <p className="text-red-400 text-sm mt-1">Your rolling 12-month sales have exceeded £90,000. You must register for VAT immediately. Contact HMRC or your accountant now.</p>
              <a href="https://www.gov.uk/vat-registration" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-sm text-red-300 underline hover:text-red-200">Register for VAT on GOV.UK →</a>
            </div>
          </div>
        )}
        {nearThreshold && !overThreshold && (
          <div className="bg-amber-900/40 border border-amber-600 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-amber-300 font-semibold">Approaching VAT Threshold</p>
              <p className="text-amber-400 text-sm mt-1">You are within £{(VAT_THRESHOLD - rolling).toLocaleString('en-GB', { minimumFractionDigits: 2 })} of the £90,000 VAT registration threshold. Consider speaking to your accountant.</p>
            </div>
          </div>
        )}
      </div>

      {/* Monthly breakdown */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Monthly Sales Breakdown</h2>
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : !data?.monthly?.length ? (
          <p className="text-slate-400">No invoice data found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-2 pr-4">Month</th>
                  <th className="text-right py-2 pr-4">Sales (ex VAT)</th>
                  <th className="text-right py-2 pr-4">VAT Charged</th>
                  <th className="text-right py-2">Total (inc VAT)</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly.map((row, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-2 pr-4 text-white">{row.month}</td>
                    <td className="py-2 pr-4 text-right text-slate-300">£{row.sales_ex_vat.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 pr-4 text-right text-slate-300">£{row.vat_charged.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 text-right text-slate-300">£{row.total_inc_vat.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-600">
                  <td className="py-3 pr-4 text-white font-semibold">12-Month Total</td>
                  <td className="py-3 pr-4 text-right text-white font-semibold">£{rolling.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 pr-4 text-right text-slate-300">—</td>
                  <td className="py-3 text-right text-slate-300">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
