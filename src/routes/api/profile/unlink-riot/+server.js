import { json } from '@sveltejs/kit';

export async function POST({ locals }) {
	// Check if user is logged in
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		// Update user in database - remove Riot info
		const { db } = await import('$lib/server/db.js');
		
		await db.execute({
			sql: 'UPDATE user SET riot_puuid = NULL, riot_game_name = NULL, riot_tag_line = NULL WHERE id = ?',
			args: [locals.user.id]
		});

		return json({ success: true });
	} catch (error) {
		console.error('Unlink Riot account error:', error);
		return json({ error: 'Fehler beim Entfernen' }, { status: 500 });
	}
}
