import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendEmail, buildAdminInviteEmail } from '@/lib/email';
import crypto from 'crypto';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'contractor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const contractorId = (session.user as any).id;

  const members = db.prepare(
    `SELECT id, name, email, created_at FROM users WHERE parent_contractor_id = ? AND is_team_admin = 1`
  ).all(contractorId);

  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'contractor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const contractorId = (session.user as any).id;
  const contractor = db.prepare('SELECT * FROM users WHERE id = ?').get(contractorId) as any;
  if (!contractor) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });

  const { name, email } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  // Check if already a team member
  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND parent_contractor_id = ?').get(email, contractorId);
  if (existing) {
    return NextResponse.json({ error: 'This email is already a team member' }, { status: 400 });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO admin_invites (token, email, name, contractor_id, expires_at) VALUES (?, ?, ?, ?, ?)`
  ).run(token, email, name, contractorId, expiresAt);

  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://getclearclaim.co.uk';
  const inviteLink = `${appUrl}/register/admin?token=${token}`;

  try {
    await sendEmail({
      to: email,
      subject: `You've been invited to join ${contractor.company || contractor.name} on ClearClaim`,
      html: buildAdminInviteEmail({
        contractorCompany: contractor.company || contractor.name,
        inviterName: contractor.name,
        inviteLink,
      }),
    });
  } catch (err) {
    console.error('Failed to send admin invite email:', err);
  }

  return NextResponse.json({ success: true, token, inviteLink });
}
