import { Lucia } from 'lucia';
import { LibSQLAdapter } from '@lucia-auth/adapter-sqlite';
import { db } from './db.js';
import { dev } from '$app/environment';

// Create Lucia adapter
const adapter = new LibSQLAdapter(db, {
	user: 'user',
	session: 'session'
});

// Initialize Lucia
export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			email: attributes.email,
			riotPuuid: attributes.riot_puuid,
			riotGameName: attributes.riot_game_name,
			riotTagLine: attributes.riot_tag_line
		};
	}
});

// Type definitions for TypeScript support
export function getSessionUser(sessionId) {
	return lucia.validateSession(sessionId);
}
