// Startup script — initialises the SQLite database and seeds demo accounts if empty
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'clearclaim.db');

console.log('[ClearClaim] Startup check — DB path:', DB_PATH);

try {
  const Database = require('better-sqlite3');
  const bcrypt = require('bcryptjs');

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Check if users table exists and has data
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  
  if (!tableExists) {
    console.log('[ClearClaim] Fresh database detected — running schema init...');
    // Schema will be created by lib/db.ts on first request
    // Just log and continue
    console.log('[ClearClaim] Schema will be initialised on first request.');
  } else {
    const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get();
    console.log('[ClearClaim] Database ready —', userCount.c, 'users found.');
    
    if (userCount.c === 0) {
      console.log('[ClearClaim] No users found — seeding demo accounts...');
      seedDemoAccounts(db, bcrypt);
    }
  }

  db.close();
  console.log('[ClearClaim] Startup complete.');
} catch (e) {
  console.error('[ClearClaim] Startup error (non-fatal):', e.message);
}

function seedDemoAccounts(db, bcrypt) {
  const hash = bcrypt.hashSync('demo123', 10);
  
  try {
    db.prepare(`INSERT OR IGNORE INTO users (email, password_hash, name, company, role) VALUES (?, ?, ?, ?, ?)`).run(
      'contractor@getclearclaim.co.uk', hash, 'Demo Contractor', 'Demo Construction Ltd', 'contractor'
    );
    db.prepare(`INSERT OR IGNORE INTO users (email, password_hash, name, company, role) VALUES (?, ?, ?, ?, ?)`).run(
      'sub1@getclearclaim.co.uk', hash, 'Demo Subcontractor', 'Demo Electrical Ltd', 'subcontractor'
    );
    console.log('[ClearClaim] Demo accounts seeded.');
  } catch (e) {
    console.log('[ClearClaim] Seed skipped (tables may not exist yet):', e.message);
  }
}
