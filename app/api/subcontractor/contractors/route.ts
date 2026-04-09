import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

// GET — list all contractors this subcontractor is linked to
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (user.role !== 'subcontractor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDb();

  const contractors = db.prepare(`
    SELECT u.id, u.name, u.company, u.email, sc.cis_rate, sc.linked_at
    FROM subcontractor_contractors sc
    JOIN users u ON u.id = sc.contractor_id
    WHERE sc.subcontractor_id = ?
    ORDER BY u.company
  `).all(user.id);

  return NextResponse.json({ contractors });
}
