import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function DELETE(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  if (!userId) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }

  const db = getDb();

  db.prepare(`UPDATE users SET
    name = 'Deleted User',
    email = 'deleted_' || id || '@deleted.invalid',
    password_hash = 'DELETED',
    company = 'Deleted',
    logo_path = NULL
    WHERE id = ?`).run(userId);

  db.prepare(`DELETE FROM notifications WHERE user_id = ?`).run(userId);

  return NextResponse.json({ success: true });
}
