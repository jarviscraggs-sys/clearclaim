import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const db = getDb();
  const invite = db.prepare(
    `SELECT ai.*, u.company as contractor_company, u.name as contractor_name
     FROM admin_invites ai
     JOIN users u ON u.id = ai.contractor_id
     WHERE ai.token = ? AND ai.used = 0 AND ai.expires_at > datetime('now')`
  ).get(token) as any;

  if (!invite) {
    return NextResponse.json({ error: 'Invalid or expired invite link.' }, { status: 400 });
  }

  return NextResponse.json({
    name: invite.name,
    email: invite.email,
    contractorCompany: invite.contractor_company,
  });
}

export async function POST(req: NextRequest) {
  const { token, password, confirmPassword } = await req.json();

  if (!token || !password || !confirmPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const db = getDb();
  const invite = db.prepare(
    `SELECT ai.*, u.company as contractor_company
     FROM admin_invites ai
     JOIN users u ON u.id = ai.contractor_id
     WHERE ai.token = ? AND ai.used = 0 AND ai.expires_at > datetime('now')`
  ).get(token) as any;

  if (!invite) {
    return NextResponse.json({ error: 'Invalid or expired invite link.' }, { status: 400 });
  }

  // Check if email already registered
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(invite.email);
  if (existingUser) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = db.prepare(
    `INSERT INTO users (email, password_hash, name, company, role, is_team_admin, parent_contractor_id)
     VALUES (?, ?, ?, ?, 'contractor', 1, ?)`
  ).run(invite.email, passwordHash, invite.name, invite.contractor_company, invite.contractor_id);

  // Add to contractor_team table
  db.prepare(
    `INSERT INTO contractor_team (contractor_id, user_id, name, email) VALUES (?, ?, ?, ?)`
  ).run(invite.contractor_id, result.lastInsertRowid, invite.name, invite.email);

  // Mark invite as used
  db.prepare('UPDATE admin_invites SET used = 1 WHERE token = ?').run(token);

  return NextResponse.json({ success: true });
}
