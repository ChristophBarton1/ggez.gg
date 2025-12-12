import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request, cookies }) {
	// Check env vars FIRST before any imports
	if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
		console.warn('⚠️ Turso database not configured');
		return json({ 
			error: 'Registration is currently disabled. Database not configured.' 
		}, { status: 503 });
	}

	// Only import if env is configured
	let lucia, db, hash, generateId;
	try {
		const [authModule, dbModule, bcryptModule, luciaModule] = await Promise.all([
			import('$lib/server/auth.js'),
			import('$lib/server/db.js'),
			import('bcryptjs'),
			import('lucia')
		]);
		lucia = authModule.lucia;
		db = dbModule.db;
		hash = bcryptModule.hash;
		generateId = luciaModule.generateId;
	} catch (err) {
		console.error('❌ Auth import failed:', err);
		return json({ 
			error: 'Authentication system error. Please try again later.' 
		}, { status: 500 });
	}

	try {
		const { username, email, password } = await request.json();

		// Validation
		if (!username || username.length < 3 || username.length > 31) {
			return json({ error: 'Username must be between 3 and 31 characters' }, { status: 400 });
		}

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return json({ error: 'Invalid email address' }, { status: 400 });
		}

		if (!password || password.length < 6 || password.length > 255) {
			return json({ error: 'Password must be between 6 and 255 characters' }, { status: 400 });
		}

		// Check if user already exists
		const existingUser = await db.execute({
			sql: 'SELECT id FROM user WHERE username = ? OR email = ?',
			args: [username, email]
		});

		if (existingUser.rows.length > 0) {
			return json({ error: 'Username or email already taken' }, { status: 400 });
		}

		// Hash password
		const passwordHash = await hash(password, 10);
		const userId = generateId(15);

		// Insert user
		await db.execute({
			sql: 'INSERT INTO user (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
			args: [userId, username, email, passwordHash, Date.now()]
		});

		// Create session
		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return json({ success: true, userId });
	} catch (error) {
		console.error('Registration error:', error);
		return json({ error: 'Registration failed' }, { status: 500 });
	}
}
