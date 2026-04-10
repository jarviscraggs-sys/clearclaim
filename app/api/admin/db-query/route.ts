import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session');
  if (!adminSession || adminSession.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const table = searchParams.get('table') || 'users';

  const allowedTables = ['users', 'invoices', 'projects', 'invites', 'employees'];
  if (!allowedTables.includes(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 });
  }

  const db = getDb();

  let rows;
  if (table === 'users') {
    rows = db.prepare(`SELECT id, name, company, email, role, created_at FROM users ORDER BY created_at DESC`).all();
  } else if (table === 'invoices') {
    rows = db.prepare(`SELECT i.id, i.invoice_number, i.description, i.amount, i.status, i.submitted_at, u.name as subcontractor_name, u.company FROM invoices i LEFT JOIN users u ON u.id = i.subcontractor_id ORDER BY i.submitted_at DESC`).all();
  } else if (table === 'projects') {
    rows = db.prepare(`SELECT p.*, u.company as contractor_company FROM projects p LEFT JOIN users u ON u.id = p.contractor_id ORDER BY p.created_at DESC`).all();
  } else if (table === 'invites') {
    rows = db.prepare(`SELECT i.*, u.company as contractor_company FROM invites i LEFT JOIN users u ON u.id = i.contractor_id ORDER BY i.created_at DESC`).all();
  } else if (table === 'employees') {
    rows = db.prepare(`SELECT e.*, u.company as contractor_company FROM employees e LEFT JOIN users u ON u.id = e.contractor_id ORDER BY e.created_at DESC`).all();
  }

  return NextResponse.json({ table, count: (rows as any[]).length, rows });
}
