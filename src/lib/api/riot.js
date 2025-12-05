/**
 * Riot API Integration
 * Docs: https://developer.riotgames.com/apis
 */

// Try multiple environment variable patterns
const RIOT_API_KEY = import.meta.env.VITE_RIOT_API_KEY 
	|| import.meta.env.PUBLIC_RIOT_API_KEY
	|| import.meta.env.RIOT_API_KEY;

// Debug: Show all available env vars with actual values
console.log('🔍 Environment check:', {
	VITE_RIOT_API_KEY: import.meta.env.VITE_RIOT_API_KEY || '❌ Missing',
	PUBLIC_RIOT_API_KEY: import.meta.env.PUBLIC_RIOT_API_KEY || '❌ Missing',
	RIOT_API_KEY: import.meta.env.RIOT_API_KEY || '❌ Missing',
	allEnvVars: import.meta.env
});

// Check if API key is loaded
if (!RIOT_API_KEY || RIOT_API_KEY === 'your_riot_api_key_here' || RIOT_API_KEY === '') {
	console.error('⚠️ RIOT API KEY NOT CONFIGURED!');
	console.error('Please add your key to .env file:');
	console.error('VITE_RIOT_API_KEY=RGAPI-your-key-here');
} else {
	console.log('✅ Riot API Key loaded:', RIOT_API_KEY.substring(0, 15) + '...');
}

// Region Mappings (Routing Values)
const REGION_ROUTING = {
	'EUW': 'europe',
	'EUW1': 'europe',
	'NA': 'americas',
	'NA1': 'americas',
	'BR1': 'americas',
	'LA1': 'americas',
	'LA2': 'americas',
	'KR': 'asia',
	'JP1': 'asia',
	'OC1': 'sea',
	'TR1': 'europe',
	'RU': 'europe'
};

// Platform IDs
const PLATFORM_IDS = {
	'EUW': 'euw1',
	'NA': 'na1',
	'KR': 'kr',
	'BR1': 'br1',
	'LA1': 'la1',
	'LA2': 'la2',
	'OC1': 'oc1',
	'JP1': 'jp1',
	'TR1': 'tr1',
	'RU': 'ru'
};

/**
 * Get summoner by name and tag
 * @param {string} gameName - Summoner name (e.g. "Hide on bush")
 * @param {string} tagLine - Tag (e.g. "KR1")
 * @param {string} region - Region code (e.g. "EUW")
 */
export async function getSummonerByRiotId(gameName, tagLine, region = 'EUW') {
	try {
		const routing = REGION_ROUTING[region] || 'europe';
		
		// Step 1: Get PUUID from Riot ID
		const accountUrl = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
		const accountRes = await fetch(accountUrl, {
			headers: { 'X-Riot-Token': RIOT_API_KEY }
		});

		if (!accountRes.ok) {
			if (accountRes.status === 404) {
				return { error: 'Summoner not found' };
			}
			throw new Error(`Account API error: ${accountRes.status}`);
		}

		const accountData = await accountRes.json();
		const { puuid, gameName: riotGameName, tagLine: riotTagLine } = accountData;

		// Step 2: Get Summoner data by PUUID
		const platform = PLATFORM_IDS[region] || 'euw1';
		const summonerUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
		const summonerRes = await fetch(summonerUrl, {
			headers: { 'X-Riot-Token': RIOT_API_KEY }
		});

		if (!summonerRes.ok) {
			throw new Error(`Summoner API error: ${summonerRes.status}`);
		}

		const summonerData = await summonerRes.json();

		// Step 3: Get Ranked data
		const rankedUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`;
		const rankedRes = await fetch(rankedUrl, {
			headers: { 'X-Riot-Token': RIOT_API_KEY }
		});

		let rankedData = [];
		if (rankedRes.ok) {
			rankedData = await rankedRes.json();
		}

		return {
			puuid,
			summonerId: summonerData.id,
			accountId: summonerData.accountId,
			name: riotGameName,
			tag: riotTagLine,
			profileIconId: summonerData.profileIconId,
			summonerLevel: summonerData.summonerLevel,
			ranked: rankedData,
			region,
			platform
		};

	} catch (error) {
		console.error('Riot API Error:', error);
		return { error: error.message };
	}
}

/**
 * Get match history for summoner
 * @param {string} puuid - Summoner PUUID
 * @param {string} region - Region code
 * @param {number} count - Number of matches (default 20)
 */
export async function getMatchHistory(puuid, region = 'EUW', count = 20) {
	try {
		const routing = REGION_ROUTING[region] || 'europe';
		
		// Get match IDs
		const matchListUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
		const matchListRes = await fetch(matchListUrl, {
			headers: { 'X-Riot-Token': RIOT_API_KEY }
		});

		if (!matchListRes.ok) {
			throw new Error(`Match list API error: ${matchListRes.status}`);
		}

		const matchIds = await matchListRes.json();

		// Get detailed match data (fetch first 5 for performance)
		const matches = await Promise.all(
			matchIds.slice(0, 5).map(async (matchId) => {
				const matchUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
				const matchRes = await fetch(matchUrl, {
					headers: { 'X-Riot-Token': RIOT_API_KEY }
				});
				
				if (matchRes.ok) {
					return await matchRes.json();
				}
				return null;
			})
		);

		return matches.filter(m => m !== null);

	} catch (error) {
		console.error('Match History Error:', error);
		return [];
	}
}

/**
 * Parse Summoner name input (e.g. "Hide on bush #KR1")
 * @param {string} input - User input
 * @returns {{gameName: string, tagLine: string} | null}
 */
export function parseSummonerInput(input) {
	const match = input.match(/^(.+?)\s*#\s*(.+)$/);
	if (match) {
		return {
			gameName: match[1].trim(),
			tagLine: match[2].trim()
		};
	}
	return null;
}
