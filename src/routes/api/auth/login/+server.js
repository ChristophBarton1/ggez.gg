import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
	// Dynamic imports inside function to avoid serverless crashes
	let lucia, db, compare;
	try {
		const [authModule, dbModule, bcryptModule] = await Promise.all([
			import('$lib/server/auth.js'),
			import('$lib/server/db.js'),
			import('bcryptjs')
		]);
		lucia = authModule.lucia;
		db = dbModule.db;
		compare = bcryptModule.compare;
	} catch (err) {
		console.error('Auth system not available:', err.message);
		return json({ 
			error: 'Authentication system not configured. Please add Turso database credentials.' 
		}, { status: 503 });
	}

	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json({ error: 'Username and password required' }, { status: 400 });
		}

		// Find user
		const result = await db.execute({
			sql: 'SELECT * FROM user WHERE username = ? OR email = ?',
			args: [username, username]
		});

		if (result.rows.length === 0) {
			return json({ error: 'Invalid username or password' }, { status: 400 });
		}

		const user = result.rows[0];

		// Verify password
		const validPassword = await compare(password, user.password_hash);
		if (!validPassword) {
			return json({ error: 'Invalid username or password' }, { status: 400 });
		}

		// Create session
		const session = await lucia.createSession(user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return json({ 
			success: true, 
			user: {
				id: user.id,
				username: user.username,
				email: user.email
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Login failed' }, { status: 500 });
	}
}
