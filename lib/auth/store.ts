import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Pool } from 'pg';

export type AuthUser = { id: string; name: string; email: string };
type StoredUser = AuthUser & { password_salt: string; password_hash: string };
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;
const globalForAuth = globalThis as typeof globalThis & {
  skilltypeAuthDb?: DatabaseSync;
  skilltypeAuthPool?: Pool;
  skilltypeAuthSchema?: Promise<void>;
};

function sqliteDatabase() {
  if (!globalForAuth.skilltypeAuthDb) {
    if (process.env.NODE_ENV === 'production' && !process.env.AUTH_DATABASE_PATH?.trim()) {
      throw new Error('Set DATABASE_URL for hosted Postgres or AUTH_DATABASE_PATH for a persistent disk before enabling accounts in production.');
    }
    const dataDirectory = join(process.cwd(), '.data');
    const databasePath = resolve(process.env.AUTH_DATABASE_PATH?.trim() || join(dataDirectory, 'skilltype.sqlite'));
    mkdirSync(dirname(databasePath), { recursive: true });
    const db = new DatabaseSync(databasePath);
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);
    `);
    globalForAuth.skilltypeAuthDb = db;
  }
  return globalForAuth.skilltypeAuthDb;
}

async function postgresPool() {
  if (!process.env.DATABASE_URL?.trim()) throw new Error('DATABASE_URL is not configured.');
  if (!globalForAuth.skilltypeAuthPool) {
    globalForAuth.skilltypeAuthPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  }
  if (!globalForAuth.skilltypeAuthSchema) {
    globalForAuth.skilltypeAuthSchema = globalForAuth.skilltypeAuthPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions(user_id);
    `).then(() => undefined).catch(error => {
      globalForAuth.skilltypeAuthSchema = undefined;
      throw error;
    });
  }
  await globalForAuth.skilltypeAuthSchema;
  return globalForAuth.skilltypeAuthPool;
}

function usesPostgres() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function publicUser(user: StoredUser | undefined): AuthUser | null {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthUser> {
  const id = randomUUID();
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  const normalizedEmail = email.toLowerCase();
  if (usesPostgres()) {
    const pool = await postgresPool();
    const result = await pool.query<AuthUser>(
      'INSERT INTO users (id, name, email, password_salt, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email',
      [id, name, normalizedEmail, salt, hash, Date.now()],
    );
    return result.rows[0];
  }
  const db = sqliteDatabase();
  db.prepare('INSERT INTO users (id, name, email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, normalizedEmail, salt, hash, Date.now());
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id) as AuthUser | undefined;
  if (!user) throw new Error('Could not create account. Please try again.');
  return user;
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  let user: StoredUser | undefined;
  if (usesPostgres()) {
    const pool = await postgresPool();
    const result = await pool.query<StoredUser>(
      'SELECT id, name, email, password_salt, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()],
    );
    user = result.rows[0];
  } else {
    user = sqliteDatabase().prepare('SELECT id, name, email, password_salt, password_hash FROM users WHERE email = ? COLLATE NOCASE').get(email) as StoredUser | undefined;
  }
  if (!user) return null;
  const actual = scryptSync(password, user.password_salt, 64);
  const expected = Buffer.from(user.password_hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? publicUser(user) : null;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<{ token: string; maxAge: number }> {
  const token = randomBytes(32).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_LIFETIME_SECONDS;
  const tokenHash = hashToken(token);
  if (usesPostgres()) {
    const pool = await postgresPool();
    await pool.query('DELETE FROM sessions WHERE expires_at <= $1', [now]);
    await pool.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [tokenHash, userId, expiresAt]);
  } else {
    const db = sqliteDatabase();
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(tokenHash, userId, expiresAt);
  }
  return { token, maxAge: SESSION_LIFETIME_SECONDS };
}

export async function getSessionUser(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const tokenHash = hashToken(token);
  if (usesPostgres()) {
    const pool = await postgresPool();
    const result = await pool.query<AuthUser>(`
      SELECT users.id, users.name, users.email
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1 AND sessions.expires_at > $2
    `, [tokenHash, now]);
    return result.rows[0] || null;
  }
  const result = sqliteDatabase().prepare(`
    SELECT users.id, users.name, users.email
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash, now) as AuthUser | undefined;
  return result || null;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const tokenHash = hashToken(token);
  if (usesPostgres()) {
    const pool = await postgresPool();
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
  } else {
    sqliteDatabase().prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
  }
}
