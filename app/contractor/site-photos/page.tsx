'use client';

import { useEffect, useMemo, useState } from 'react';

type SitePhoto = {
  id: number;
  file_path: string;
  caption: string | null;
  uploaded_at: string;
  subcontractor_id: number;
  subcontractor_name: string;
  subcontractor_company: string | null;
};

export default function ContractorSitePhotosPage() {
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [subcontractorFilter, setSubcontractorFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/site-photos');
        const data = await res.json();
        if (res.ok) {
          setPhotos(data.photos || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const subcontractors = useMemo(() => {
    const byId = new Map<number, { id: number; label: string }>();
    for (const p of photos) {
      if (!byId.has(p.subcontractor_id)) {
        byId.set(p.subcontractor_id, {
          id: p.subcontractor_id,
          label: p.subcontractor_company || p.subcontractor_name,
        });
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [photos]);

  const filtered = useMemo(() => {
    if (subcontractorFilter === 'all') return photos;
    return photos.filter((p) => String(p.subcontractor_id) === subcontractorFilter);
  }, [photos, subcontractorFilter]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Site Photos - Work Evidence</h1>
        <p className="text-blue-300 text-sm mt-1">Review on-site progress submitted by subcontractors</p>
      </div>

      <div className="mb-6 bg-[#0a1628] border border-blue-900/30 rounded-2xl p-4">
        <label className="block text-xs text-blue-400 mb-1">Filter by subcontractor</label>
        <select
          value={subcontractorFilter}
          onChange={(e) => setSubcontractorFilter(e.target.value)}
          className="bg-white/10 border border-white/20 text-white text-sm rounded-xl px-3 py-2 min-w-[260px] focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="all">All subcontractors</option>
          {subcontractors.map((sub) => (
            <option key={sub.id} value={String(sub.id)}>
              {sub.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-blue-300 text-sm">Loading photos...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0a1628] border border-blue-900/30 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-blue-200">No site photos found for this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((photo) => (
            <article key={photo.id} className="bg-[#0a1628] border border-blue-900/30 rounded-2xl overflow-hidden">
              <img
                src={`/api/files?path=${encodeURIComponent(photo.file_path)}`}
                alt={photo.caption || 'Site photo evidence'}
                className="w-full h-44 object-cover bg-black/30"
              />
              <div className="p-4">
                <p className="text-white text-sm min-h-10">{photo.caption?.trim() || 'No caption'}</p>
                <p className="text-blue-300 text-xs mt-2">
                  {photo.subcontractor_name}
                  {photo.subcontractor_company ? ` - ${photo.subcontractor_company}` : ''}
                </p>
                <p className="text-blue-500 text-xs mt-1">{new Date(photo.uploaded_at).toLocaleString('en-GB')}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
