import { json } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth.js';

export async function POST({ locals, cookies }) {
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
