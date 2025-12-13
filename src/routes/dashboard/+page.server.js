import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function load({ locals }) {
	// Redirect to home if not logged in
	if (!locals.user) {
		throw redirect(303, '/?login=required');
	}

	// If no Riot account linked, redirect to profile
	if (!locals.user.riot_puuid) {
		throw redirect(303, '/profile?error=no-riot-account');
	}

	const RIOT_API_KEY = env.RIOT_API_KEY;
	const puuid = locals.user.riot_puuid;

	try {
		// Fetch all data in parallel
		const [rankedData, matchListData, masteryData] = await Promise.all([
			// Ranked stats
			fetch(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, {
				headers: { 'X-Riot-Token': RIOT_API_KEY }
			}).then(res => res.ok ? res.json() : []),

			// Recent matches
			fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`, {
				headers: { 'X-Riot-Token': RIOT_API_KEY }
			}).then(res => res.ok ? res.json() : []),

			// Champion masteries
			fetch(`https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=5`, {
				headers: { 'X-Riot-Token': RIOT_API_KEY }
			}).then(res => res.ok ? res.json() : [])
		]);

		// Fetch match details
		const matchDetails = await Promise.all(
			matchListData.slice(0, 5).map(matchId =>
				fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`, {
					headers: { 'X-Riot-Token': RIOT_API_KEY }
				}).then(res => res.ok ? res.json() : null)
			)
		);

		console.log('✅ Dashboard data loaded:', {
			ranked: rankedData.length,
			matches: matchDetails.filter(m => m !== null).length,
			masteries: masteryData.length
		});
		
		return {
			user: locals.user,
			ranked: rankedData,
			matches: matchDetails.filter(m => m !== null),
			masteries: masteryData
		};
	} catch (error) {
		console.error('Dashboard data fetch error:', error);
		return {
			user: locals.user,
			ranked: [],
			matches: [],
			masteries: [],
			error: 'Fehler beim Laden der Daten'
		};
	}
}
