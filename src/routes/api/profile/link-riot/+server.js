import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request, locals }) {
	// Check if user is logged in
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	// Check if Riot API key is configured
	console.log('🔑 RIOT_API_KEY present:', !!env.RIOT_API_KEY);
	console.log('🔑 Key starts with RGAPI:', env.RIOT_API_KEY?.startsWith('RGAPI-'));
	
	if (!env.RIOT_API_KEY) {
		console.error('❌ RIOT_API_KEY not set!');
		return json({ error: 'Riot API not configured' }, { status: 503 });
	}

	try {
		const { gameName, tagLine } = await request.json();

		if (!gameName || !tagLine) {
			return json({ error: 'Game Name und Tag Line erforderlich' }, { status: 400 });
		}

		// Get PUUID from Riot Account API
		const accountUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
		
		console.log('📞 Calling Riot API:', accountUrl);
		
		const accountRes = await fetch(accountUrl, {
			headers: {
				'X-Riot-Token': env.RIOT_API_KEY
			}
		});

		console.log('📊 Riot API Response:', accountRes.status, accountRes.statusText);

		if (!accountRes.ok) {
			if (accountRes.status === 401) {
				console.error('❌ 401 Unauthorized - API Key invalid or expired!');
				return json({ error: 'Riot API Key ungültig oder abgelaufen. Bitte erneuern!' }, { status: 401 });
			}
			if (accountRes.status === 404) {
				return json({ error: 'Summoner nicht gefunden' }, { status: 404 });
			}
			return json({ error: 'Riot API Fehler' }, { status: 500 });
		}

		const accountData = await accountRes.json();

		// Update user in database
		const { db } = await import('$lib/server/db.js');
		
		await db.execute({
			sql: 'UPDATE user SET riot_puuid = ?, riot_game_name = ?, riot_tag_line = ? WHERE id = ?',
			args: [accountData.puuid, accountData.gameName, accountData.tagLine, locals.user.id]
		});

		return json({ 
			success: true,
			puuid: accountData.puuid,
			gameName: accountData.gameName,
			tagLine: accountData.tagLine
		});
	} catch (error) {
		console.error('Link Riot account error:', error);
		return json({ error: 'Fehler beim Verknüpfen' }, { status: 500 });
	}
}
