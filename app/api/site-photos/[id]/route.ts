import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const { id } = await params;
  const photoId = Number(id);
  if (!Number.isFinite(photoId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const db = getDb();
  const photo = db.prepare(`SELECT * FROM site_photos WHERE id = ?`).get(photoId) as any;
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (photo.subcontractor_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  db.prepare(`DELETE FROM site_photos WHERE id = ?`).run(photoId);
  return NextResponse.json({ success: true });
}
