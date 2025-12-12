import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ locals, cookies }) {
	// Check env vars FIRST
	if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
		return json({ 
			error: 'Logout failed. Database not configured.' 
		}, { status: 503 });
	}

	// Only import if env is configured
	let lucia;
	try {
		const authModule = await import('$lib/server/auth.js');
		lucia = authModule.lucia;
	} catch (err) {
		console.error('❌ Auth import failed:', err);
		return json({ 
			error: 'Logout failed. Please try again.' 
		}, { status: 500 });
	}

	try {
		if (!locals.session) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		await lucia.invalidateSession(locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return json({ success: true });
	} catch (error) {
		console.error('Logout error:', error);
		return json({ error: 'Logout failed' }, { status: 500 });
	}
}
