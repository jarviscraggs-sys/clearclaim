'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setStatus('error');
          setMessage(data.error);
        } else {
          setStatus('success');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <div>
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Verifying your email...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-slate-400 mb-6">Your ClearClaim account is now active. You can log in and get started.</p>
            <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition">
              Go to Login →
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-slate-400 mb-6">{message}</p>
            <Link href="/register/contractor" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition">
              Register Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
