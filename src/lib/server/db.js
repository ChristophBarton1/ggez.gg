import { createClient } from '@libsql/client';
import { dev } from '$app/environment';

// Environment variables für Turso oder lokale SQLite
const url = dev ? 'file:local.db' : process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = dev ? undefined : process.env.TURSO_AUTH_TOKEN;

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
