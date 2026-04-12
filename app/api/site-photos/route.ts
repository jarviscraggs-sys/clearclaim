import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const db = getDb();

  let photos: any[] = [];
  if (user.role === 'contractor') {
    photos = db.prepare(`
      SELECT sp.*, u.name as subcontractor_name, u.company as subcontractor_company
      FROM site_photos sp
      JOIN users u ON u.id = sp.subcontractor_id
      WHERE sp.contractor_id = ?
      ORDER BY sp.uploaded_at DESC
    `).all(user.id) as any[];
  } else if (user.role === 'subcontractor') {
    photos = db.prepare(`
      SELECT sp.*, u.name as subcontractor_name, u.company as subcontractor_company
      FROM site_photos sp
      JOIN users u ON u.id = sp.subcontractor_id
      WHERE sp.subcontractor_id = ?
      ORDER BY sp.uploaded_at DESC
    `).all(user.id) as any[];
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.role !== 'subcontractor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();
  const link = db
    .prepare(`SELECT contractor_id FROM subcontractor_contractors WHERE subcontractor_id = ? LIMIT 1`)
    .get(user.id) as { contractor_id: number } | undefined;

  if (!link) return NextResponse.json({ error: 'No contractor linked' }, { status: 400 });

  const formData = await req.formData();
  const caption = ((formData.get('caption') as string) || '').trim();
  const invoiceId = formData.get('invoice_id') ? Number(formData.get('invoice_id')) : null;
  const projectId = formData.get('project_id') ? Number(formData.get('project_id')) : null;
  const files = formData.getAll('photos') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
  }

  const { writeFile, mkdir } = await import('fs/promises');
  const path = await import('path');
  const uploadDir = path.join(process.cwd(), 'uploads', 'site-photos', String(user.id));
  await mkdir(uploadDir, { recursive: true });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const inserted: Array<{ id: number; filename: string }> = [];

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) continue;
    if (file.size > 10 * 1024 * 1024) continue;

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const result = db.prepare(`
      INSERT INTO site_photos (subcontractor_id, contractor_id, invoice_id, project_id, filename, file_path, caption)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, link.contractor_id, invoiceId, projectId, filename, `uploads/site-photos/${user.id}/${filename}`, caption);

    inserted.push({ id: Number(result.lastInsertRowid), filename });
  }

  return NextResponse.json({ success: true, uploaded: inserted.length });
}
