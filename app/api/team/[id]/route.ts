import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'contractor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const contractorId = (session.user as any).id;
  const { id } = await params;
  const memberId = parseInt(id, 10);

  if (isNaN(memberId)) {
    return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
  }

  const member = db.prepare(
    'SELECT id FROM users WHERE id = ? AND parent_contractor_id = ? AND is_team_admin = 1'
  ).get(memberId, contractorId);

  if (!member) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(memberId);

  return NextResponse.json({ success: true });
}
