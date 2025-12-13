import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Send welcome email (optional - only if RESEND_API_KEY is set)
async function sendWelcomeEmail(email, username) {
	if (!env.RESEND_API_KEY) {
		console.log('📧 Resend not configured - skipping welcome email');
		return;
	}

	try {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${env.RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				from: 'GGEZ.GG <noreply@ggez.gg>',
				to: email,
				subject: '🎮 Willkommen bei GGEZ.GG!',
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a1428; color: #fff; padding: 40px; border-radius: 10px;">
						<h1 style="color: #c8aa6e; font-size: 32px; margin-bottom: 20px;">Willkommen, ${username}! 🎉</h1>
						<p style="font-size: 16px; line-height: 1.6; color: #d1d5db;">
							Danke, dass du dich bei <strong style="color: #c8aa6e;">GGEZ.GG</strong> registriert hast!
						</p>
						<p style="font-size: 16px; line-height: 1.6; color: #d1d5db;">
							Deine Reise zum besseren League of Legends Spieler beginnt jetzt. Nutze unsere Tools:
						</p>
						<ul style="font-size: 16px; line-height: 1.8; color: #d1d5db;">
							<li>📊 <strong>Tier List</strong> - Die stärksten Champions</li>
							<li>🏆 <strong>Leaderboards</strong> - Top Spieler weltweit</li>
							<li>⚔️ <strong>Champion Stats</strong> - Detaillierte Builds & Guides</li>
							<li>🤖 <strong>AI Recommendations</strong> - Personalisierte Tipps</li>
						</ul>
						<a href="https://ggez.gg" style="display: inline-block; margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #c8aa6e 0%, #f0e6d2 100%); color: #000; text-decoration: none; border-radius: 5px; font-weight: bold;">
							Jetzt loslegen →
						</a>
						<p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
							Viel Erfolg auf der Kluft!<br>
							Dein GGEZ.GG Team
						</p>
					</div>
				`
			})
		});

		if (response.ok) {
			console.log('✅ Welcome email sent to', email);
		} else {
			console.error('❌ Email send failed:', await response.text());
		}
	} catch (error) {
		console.error('❌ Email error:', error);
	}
}

export async function POST({ request, cookies }) {
	// Check env vars FIRST
	if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
		console.error('❌ Turso env vars missing:', { 
			hasUrl: !!env.TURSO_DATABASE_URL, 
			hasToken: !!env.TURSO_AUTH_TOKEN 
		});
		return json({ 
			error: 'Database configuration error. Please check environment variables.' 
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
			error: 'Authentication system error: ' + err.message 
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
			path: '/',
			...sessionCookie.attributes
		});

		// Send welcome email (async, don't wait for it)
		sendWelcomeEmail(email, username).catch(err => 
			console.error('Welcome email failed:', err)
		);

		return json({ success: true, userId });
	} catch (error) {
		console.error('Registration error:', error);
		return json({ error: 'Registration failed: ' + error.message }, { status: 500 });
	}
}
