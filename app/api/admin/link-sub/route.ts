import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  if (!adminSession || adminSession.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subcontractorId, contractorId, cisRate } = await req.json();
  const db = getDb();

  try {
    db.prepare(`
      INSERT OR IGNORE INTO subcontractor_contractors (subcontractor_id, contractor_id, cis_rate)
      VALUES (?, ?, ?)
    `).run(subcontractorId, contractorId, cisRate || 20);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
