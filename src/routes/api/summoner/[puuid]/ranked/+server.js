/**
 * API Route: Get Ranked Stats for a Summoner by PUUID
 */

import { json } from '@sveltejs/kit';
import { RIOT_API_KEY } from '$env/static/private';

const REGION_MAP = {
	'NA': 'na1',
	'EUW': 'euw1',
	'EUNE': 'eun1',
	'KR': 'kr',
	'BR': 'br1',
	'JP': 'jp1',
	'RU': 'ru',
	'OCE': 'oc1',
	'TR': 'tr1',
	'LAN': 'la1',
	'LAS': 'la2',
	'PH': 'ph2',
	'SG': 'sg2',
	'TH': 'th2',
	'TW': 'tw2',
	'VN': 'vn2'
};

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, url }) {
	const { puuid } = params;
	const region = url.searchParams.get('region') || 'EUW';
	const platformId = REGION_MAP[region.toUpperCase()] || 'euw1';

	// 1. Check API Key
	if (!RIOT_API_KEY) {
		console.error('❌ API Error: RIOT_API_KEY is missing in server environment!');
		return json({ error: 'Server configuration error' }, { status: 500 });
	}

	try {
		// 2. Get Summoner ID from PUUID
		// We need the encrypted summonerId to fetch league stats
		const summonerUrl = `https://${platformId}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
		// console.log(`🔍 Fetching summoner ID for PUUID: ${puuid.substring(0, 10)}... on ${platformId}`);
		
		const summonerResponse = await fetch(summonerUrl, {
			headers: { 'X-Riot-Token': RIOT_API_KEY }
		});

		if (!summonerResponse.ok) {
			console.error(`❌ Summoner API Error (${summonerResponse.status}): ${summonerUrl}`);
			if (summonerResponse.status === 404) {
				return json({ error: 'Summoner not found' }, { status: 404 });
			}
			return json({ error: `Riot API Error: ${summonerResponse.status}` }, { status: summonerResponse.status });
		}

		const summonerData = await summonerResponse.json();
		// console.log('Summoner Data:', summonerData); // Debug
		const encryptedSummonerId = summonerData.id;

		if (!encryptedSummonerId) {
			console.error('❌ Error: No summoner ID found in response', summonerData);
			return json({ error: 'No summoner ID found' }, { status: 500 });
		}

		// 3. Get Ranked Stats using Summoner ID
		const leagueUrl = `https://${platformId}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`;
		// console.log(`🔍 Fetching league stats for ID: ${encryptedSummonerId.substring(0, 10)}...`);

		const leagueResponse = await fetch(leagueUrl, {
			headers: { 'X-Riot-Token': RIOT_API_KEY }
		});

		if (!leagueResponse.ok) {
			console.error(`❌ League API Error (${leagueResponse.status}): ${leagueUrl}`);
			return json({ error: `League API Error: ${leagueResponse.status}` }, { status: leagueResponse.status });
		}

		const leagueData = await leagueResponse.json();
		
		// Success!
		return json(leagueData);

	} catch (error) {
		console.error('❌ Critical Server Error in ranked stats route:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
