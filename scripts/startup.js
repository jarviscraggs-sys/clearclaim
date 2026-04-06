// Startup script — initialises SQLite DB and seeds demo accounts on Railway
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(process.cwd(), 'clearclaim.db');
console.log('[ClearClaim] Startup — DB path:', DB_PATH);

try {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create full schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      company TEXT,
      role TEXT NOT NULL DEFAULT 'subcontractor',
      logo_path TEXT,
      employee_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subcontractor_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      vat_amount REAL NOT NULL DEFAULT 0,
      work_from TEXT NOT NULL DEFAULT '',
      work_to TEXT NOT NULL DEFAULT '',
      cost_code TEXT,
      po_reference TEXT,
      notes TEXT,
      job_description TEXT,
      cis_rate INTEGER NOT NULL DEFAULT 0,
      cis_amount REAL NOT NULL DEFAULT 0,
      retention_rate REAL DEFAULT 5.0,
      retention_amount REAL DEFAULT 0,
      retention_released REAL DEFAULT 0,
      retention_release_date TEXT,
      application_number INTEGER DEFAULT 1,
      cumulative_value REAL DEFAULT 0,
      previous_certified REAL DEFAULT 0,
      this_application REAL DEFAULT 0,
      project_id INTEGER,
      paid INTEGER DEFAULT 0,
      paid_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT,
      reviewer_comment TEXT,
      FOREIGN KEY (subcontractor_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS ai_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      matched_invoice_id INTEGER NOT NULL,
      flag_type TEXT NOT NULL,
      confidence_score INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      job_code TEXT NOT NULL,
      area TEXT NOT NULL,
      description TEXT NOT NULL,
      line_value REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER,
      name TEXT NOT NULL,
      reference TEXT,
      address TEXT,
      contract_value REAL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER,
      user_id INTEGER,
      user_name TEXT,
      action TEXT,
      detail TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      cis_rate INTEGER DEFAULT 20,
      contractor_id INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER NOT NULL,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      hourly_rate REAL DEFAULT 0,
      weekly_hours REAL DEFAULT 40,
      holiday_allowance INTEGER DEFAULT 28,
      holiday_used INTEGER DEFAULT 0,
      start_date TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      week_starting TEXT NOT NULL,
      project_id INTEGER,
      mon_hours REAL DEFAULT 0,
      tue_hours REAL DEFAULT 0,
      wed_hours REAL DEFAULT 0,
      thu_hours REAL DEFAULT 0,
      fri_hours REAL DEFAULT 0,
      sat_hours REAL DEFAULT 0,
      sun_hours REAL DEFAULT 0,
      total_hours REAL DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      reviewer_comment TEXT,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS holiday_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days_requested REAL NOT NULL,
      type TEXT DEFAULT 'annual',
      notes TEXT,
      status TEXT DEFAULT 'pending',
      reviewer_comment TEXT,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS subcontractor_compliance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subcontractor_id INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      document_name TEXT NOT NULL,
      expiry_date TEXT,
      notes TEXT,
      status TEXT DEFAULT 'valid',
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS variations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      invoice_id INTEGER,
      subcontractor_id INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      variation_number TEXT NOT NULL,
      description TEXT NOT NULL,
      value REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT,
      reviewer_comment TEXT
    );
    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      raised_by INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      subcontractor_id INTEGER NOT NULL,
      dispute_type TEXT DEFAULT 'payment',
      description TEXT NOT NULL,
      amount_disputed REAL,
      status TEXT DEFAULT 'open',
      pay_less_notice_date TEXT,
      payment_due_date TEXT,
      resolution_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );
    CREATE TABLE IF NOT EXISTS dispute_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispute_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS contractor_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contractor_id INTEGER UNIQUE NOT NULL,
      max_holidays_per_day INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS employee_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      employee_id INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cis_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subcontractor_id INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      verified_date TEXT NOT NULL,
      hmrc_reference TEXT,
      confirmed_rate INTEGER NOT NULL,
      verified_by TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS project_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      contractor_id INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      mime_type TEXT,
      category TEXT DEFAULT 'general',
      description TEXT,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed demo accounts if no users exist
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
  console.log('[ClearClaim] Users in DB:', userCount.c);

  if (userCount.c === 0) {
    console.log('[ClearClaim] Seeding demo accounts...');
    const hash = bcrypt.hashSync('demo123', 10);

    const contractorId = db.prepare(
      `INSERT INTO users (email, password_hash, name, company, role) VALUES (?, ?, ?, ?, ?)`
    ).run('contractor@getclearclaim.co.uk', hash, 'Demo Contractor', 'Demo Construction Ltd', 'contractor').lastInsertRowid;

    db.prepare(
      `INSERT INTO users (email, password_hash, name, company, role) VALUES (?, ?, ?, ?, ?)`
    ).run('sub1@getclearclaim.co.uk', hash, 'Dave Smith', 'Smith Electrical Ltd', 'subcontractor');

    db.prepare(
      `INSERT INTO users (email, password_hash, name, company, role) VALUES (?, ?, ?, ?, ?)`
    ).run('sub2@getclearclaim.co.uk', hash, 'Tom Jones', 'Jones Groundworks', 'subcontractor');

    // Contractor settings
    db.prepare(`INSERT OR IGNORE INTO contractor_settings (contractor_id) VALUES (?)`).run(contractorId);

    console.log('[ClearClaim] Demo accounts created.');
    console.log('[ClearClaim] Login: contractor@getclearclaim.co.uk / demo123');
  }

  db.close();
  console.log('[ClearClaim] Startup complete.');
} catch (e) {
  console.error('[ClearClaim] Startup error:', e.message);
  console.error('[ClearClaim] Stack:', e.stack);
  console.error('[ClearClaim] Node version:', process.version);
  console.error('[ClearClaim] Platform:', process.platform, process.arch);
  console.error('[ClearClaim] CWD:', process.cwd());
  // Don't exit — let Next.js start anyway
}
