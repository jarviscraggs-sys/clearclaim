'use client';

import { useEffect, useState } from 'react';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (res.ok) setMembers(data.members || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setInviteLink('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send invite');
        return;
      }
      setSuccessMsg(`Invite sent to ${form.email}`);
      setInviteLink(data.inviteLink || '');
      setForm({ name: '', email: '' });
      setShowForm(false);
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: number, name: string) => {
    if (!confirm(`Remove ${name} from your team? They will lose access immediately.`)) return;
    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== id));
        setSuccessMsg(`${name} has been removed from your team.`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to remove team member');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="text-blue-300 mt-1 text-sm">Invite admin staff to access your account</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); setSuccessMsg(''); setInviteLink(''); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition"
        >
          👥 Invite Team Member
        </button>
      </div>

      {/* Stats */}
      <div className="bg-[#0f2044] border border-blue-900/30 rounded-xl p-4">
        <p className="text-blue-300 text-sm">
          <span className="text-white font-bold text-xl">{members.length}</span> team member{members.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-300 text-sm">
          ✅ {successMsg}
          {inviteLink && (
            <div className="mt-2">
              <p className="text-green-400 font-medium text-xs mb-1">Invite link (share if email fails):</p>
              <code className="block bg-green-900/20 px-3 py-2 rounded text-green-200 text-xs break-all">{inviteLink}</code>
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Invite Form */}
      {showForm && (
        <div className="bg-[#0f2044] border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Invite a Team Member</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. Jane Smith"
                  className="w-full px-4 py-2.5 bg-[#0a1628] border border-blue-900/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="jane@example.com"
                  className="w-full px-4 py-2.5 bg-[#0a1628] border border-blue-900/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                {submitting ? 'Sending...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Table */}
      <div className="bg-[#0f2044] border border-blue-900/30 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-900/30">
          <h2 className="text-white font-semibold">Current Team</h2>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-blue-300 text-sm">Loading team members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-400 text-sm">No team members yet.</p>
            <p className="text-gray-500 text-xs mt-1">Invite admin staff to give them full access to your account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-900/30 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-blue-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-blue-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-blue-400 uppercase tracking-wider">Added</th>
                  <th className="px-6 py-3 text-xs font-semibold text-blue-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/20">
                {members.map(member => (
                  <tr key={member.id} className="hover:bg-blue-900/10 transition">
                    <td className="px-6 py-4 text-white font-medium">{member.name}</td>
                    <td className="px-6 py-4 text-blue-200">{member.email}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(member.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRemove(member.id, member.name)}
                        className="px-3 py-1.5 bg-red-900/30 hover:bg-red-800/50 border border-red-700/30 text-red-400 hover:text-red-300 text-xs font-medium rounded-lg transition"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
