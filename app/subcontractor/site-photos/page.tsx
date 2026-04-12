'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type SitePhoto = {
  id: number;
  file_path: string;
  caption: string | null;
  uploaded_at: string;
};

export default function SubcontractorSitePhotosPage() {
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fileCountLabel = useMemo(() => {
    if (files.length === 0) return 'No files selected';
    if (files.length === 1) return files[0].name;
    return `${files.length} files selected`;
  }, [files]);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/site-photos');
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to load photos');
      } else {
        setPhotos(data.photos || []);
      }
    } catch {
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const setPickedFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setFiles(Array.from(fileList));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Select at least one image');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      if (caption.trim()) formData.append('caption', caption.trim());
      for (const f of files) {
        formData.append('photos', f);
      }

      const res = await fetch('/api/site-photos', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Upload failed');
      } else {
        setFiles([]);
        setCaption('');
        await loadPhotos();
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this photo?')) return;
    const res = await fetch(`/api/site-photos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadPhotos();
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Photos</h1>
          <p className="text-blue-300 text-sm mt-1">Upload work evidence for your contractor</p>
        </div>
        <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition">
          Upload Photos
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => setPickedFiles(e.target.files)}
          />
        </label>
      </div>

      <form onSubmit={handleUpload} className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
        <label
          className="block rounded-xl border border-dashed border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 transition p-5 text-center cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setPickedFiles(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => setPickedFiles(e.target.files)}
          />
          <p className="text-white font-medium">Drag and drop images here</p>
          <p className="text-blue-300 text-sm mt-1">or click to choose files (JPG, PNG, WEBP, GIF up to 10MB each)</p>
          <p className="text-blue-400 text-xs mt-3">{fileCountLabel}</p>
        </label>

        <div>
          <label className="text-xs text-blue-400 mb-1 block">Caption (optional)</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Example: First fix wiring complete in unit B"
            className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition"
        >
          {uploading ? 'Uploading...' : 'Submit Photos'}
        </button>
      </form>

      {loading ? (
        <p className="text-blue-300 text-sm">Loading photos...</p>
      ) : photos.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-white font-semibold">No photos uploaded yet</p>
          <p className="text-blue-400/70 text-sm mt-1">Upload progress photos as work evidence</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <article key={photo.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <img
                src={`/api/files?path=${encodeURIComponent(photo.file_path)}`}
                alt={photo.caption || 'Site photo'}
                className="w-full h-44 object-cover bg-black/30"
              />
              <div className="p-4">
                <p className="text-white text-sm min-h-10">{photo.caption?.trim() || 'No caption'}</p>
                <p className="text-blue-400 text-xs mt-2">{new Date(photo.uploaded_at).toLocaleString('en-GB')}</p>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="mt-3 text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
