import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  if (!adminSession || adminSession.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, role, company } = await req.json();

  const allowedRoles = ['contractor', 'subcontractor', 'employee'];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const db = getDb();
  
  // Update role
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  
  // Update company if provided
  if (company) {
    db.prepare('UPDATE users SET company = ? WHERE id = ?').run(company, userId);
  }

  // If promoting to contractor, create contractor_settings
  if (role === 'contractor') {
    db.prepare('INSERT OR IGNORE INTO contractor_settings (contractor_id) VALUES (?)').run(userId);
  }

  const user = db.prepare('SELECT id, name, company, email, role FROM users WHERE id = ?').get(userId);
  return NextResponse.json({ success: true, user });
}
