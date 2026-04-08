'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface InviteData {
  name: string;
  email: string;
  contractorCompany: string;
}

function AdminRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    if (!token) {
      setError('No invite token provided.');
      setLoading(false);
      return;
    }

    fetch(`/api/auth/register-admin?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invalid or expired invite link.');
        } else {
          setInvite(data);
        }
      })
      .catch(() => setError('Failed to load invite. Please try again.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      router.push('/register/success');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ClearClaim</h1>
          <p className="text-blue-300 mt-1 text-sm">Admin registration</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-blue-200 text-sm">Loading your invite...</p>
            </div>
          ) : error && !invite ? (
            <div className="text-center py-4">
              <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">{error}</div>
              <p className="text-gray-400 text-sm mt-4">
                Need a new invite?{' '}
                <Link href="/login" className="text-blue-300 hover:text-blue-200 transition">Contact your contractor →</Link>
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Set up your admin account</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">{error}</div>
              )}
              {invite && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-xl space-y-2">
                  <p className="text-blue-200 text-sm font-medium">Your invite details</p>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p><span className="text-gray-400">Name:</span> {invite.name}</p>
                    <p><span className="text-gray-400">Email:</span> {invite.email}</p>
                    <p><span className="text-gray-400">Company:</span> {invite.contractorCompany}</p>
                  </div>
                  <p className="text-xs text-blue-300 mt-2 pt-2 border-t border-blue-400/20">
                    You&apos;ll have full admin access to {invite.contractorCompany}&apos;s ClearClaim account.
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                    placeholder="Repeat your password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/30"
                >
                  {submitting ? 'Creating account...' : 'Create account'}
                </button>
              </form>
              <p className="mt-4 text-center text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-300 hover:text-blue-200 transition">Sign in →</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminRegisterContent />
    </Suspense>
  );
}
