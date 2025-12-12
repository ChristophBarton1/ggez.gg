import { createClient } from '@libsql/client';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

// Environment variables für Turso oder lokale SQLite
const url = dev ? 'file:local.db' : (env.TURSO_DATABASE_URL || 'file:local.db');
// Strip "Bearer " prefix if present (common mistake when copying from Turso dashboard)
const rawToken = dev ? undefined : env.TURSO_AUTH_TOKEN;
const authToken = rawToken?.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;

console.log('🔧 Database config:', {
	url: url?.substring(0, 30) + '...',
	hasToken: !!authToken,
	tokenStart: authToken?.substring(0, 20) + '...'
});

export const db = createClient({
	url,
	authToken
});

// Initialize database schema
export async function initDB() {
	await db.execute(`
		CREATE TABLE IF NOT EXISTS user (
			id TEXT PRIMARY KEY,
			username TEXT NOT NULL UNIQUE,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			riot_puuid TEXT,
			riot_game_name TEXT,
			riot_tag_line TEXT
		)
	`);

	await db.execute(`
		CREATE TABLE IF NOT EXISTS session (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			expires_at INTEGER NOT NULL,
			FOREIGN KEY (user_id) REFERENCES user(id)
		)
	`);

	console.log('✅ Database initialized');
}
