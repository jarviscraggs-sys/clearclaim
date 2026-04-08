import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  if (!adminSession || adminSession.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const invoices = db.prepare(`
    SELECT
      i.id,
      i.invoice_number,
      i.amount,
      i.vat_amount,
      i.cis_amount,
      i.status,
      i.submitted_at,
      sub.name AS subcontractor_name,
      sub.company AS subcontractor_company,
      con.name AS contractor_name,
      con.company AS contractor_company
    FROM invoices i
    LEFT JOIN users sub ON i.subcontractor_id = sub.id
    LEFT JOIN invites inv ON inv.email = sub.email AND inv.contractor_id IS NOT NULL
    LEFT JOIN users con ON con.id = (
      SELECT contractor_id FROM invites WHERE email = sub.email LIMIT 1
    )
    ORDER BY i.submitted_at DESC
  `).all();

  const totalRevenue = (db.prepare(`SELECT COALESCE(SUM(amount), 0) as v FROM invoices`).get() as any).v;

  return NextResponse.json({ invoices, totalRevenue });
}
