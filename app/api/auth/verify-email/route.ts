import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const db = getDb();
  const record = db.prepare(`
    SELECT * FROM email_verifications 
    WHERE token = ? AND used = 0 AND expires_at > datetime('now')
  `).get(token) as any;

  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired verification link. Please register again.' }, { status: 400 });
  }

  // Mark user as verified
  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(record.user_id);
  db.prepare('UPDATE email_verifications SET used = 1 WHERE id = ?').run(record.id);

  return NextResponse.json({ success: true });
}
