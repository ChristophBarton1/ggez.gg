import { json } from '@sveltejs/kit';

let lucia;
try {
	const authModule = await import('$lib/server/auth.js');
	lucia = authModule.lucia;
} catch (err) {
	console.error('Auth system not configured:', err.message);
}

export async function POST({ locals, cookies }) {
	// Check if auth is available
	if (!lucia) {
		return json({ 
			error: 'Authentication system not configured.' 
		}, { status: 503 });
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
