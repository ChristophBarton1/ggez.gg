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

		// Step 3: Get Ranked data (using by-puuid for better results)
		console.log('🔍 Fetching ranked data for PUUID:', puuid);
		console.log('🔍 Platform:', platform);
		const rankedUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
		console.log('🔍 Ranked URL:', rankedUrl);
		
		const rankedRes = await fetch(rankedUrl, {
			headers: { 'X-Riot-Token': RIOT_API_KEY }
		});

		let rankedData = [];
		console.log('🔍 Ranked API Status:', rankedRes.status);
		
		if (rankedRes.ok) {
			rankedData = await rankedRes.json();
			console.log('✅ Ranked Data:', JSON.stringify(rankedData, null, 2));
			console.log('✅ Ranked Data Length:', rankedData.length);
		} else {
			const errorText = await rankedRes.text();
			console.error('⚠️ Ranked API Error:', rankedRes.status);
			console.error('⚠️ Error Response:', errorText);
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
export async function getMatchHistory(puuid, region, count = 20) {
	try {
		const routingValue = getRoutingByRegion(region);
		
		// Get match IDs
		const matchIdsUrl = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
		const matchIdsRes = await fetch(matchIdsUrl, {
			headers: { 'X-Riot-Token': RIOT_API_KEY }
		});
		
		if (!matchIdsRes.ok) {
			console.error('Match IDs API error:', matchIdsRes.status);
			return [];
		}
		
		const matchIds = await matchIdsRes.json();
		
		// Fetch details for each match
		const matchPromises = matchIds.map(async (matchId) => {
			const matchUrl = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
			const matchRes = await fetch(matchUrl, {
				headers: { 'X-Riot-Token': RIOT_API_KEY }
			});
			
			if (!matchRes.ok) {
				console.error(`Match ${matchId} API error:`, matchRes.status);
				return null;
			}
			
			return await matchRes.json();
		});
		
		const matches = await Promise.all(matchPromises);
		return matches.filter(m => m !== null);
		
	} catch (error) {
		console.error('Match History Error:', error);
		return [];
	}
}

/**
 * Analyze recent match performance by champion
 */
export function analyzeChampionPerformance(matches, puuid) {
	const championStats = {};
	
	matches.forEach(match => {
		const participant = match.info.participants.find(p => p.puuid === puuid);
		if (!participant) return;
		
		const championName = participant.championName;
		
		if (!championStats[championName]) {
			championStats[championName] = {
				championName,
				championId: participant.championId,
				games: 0,
				wins: 0,
				kills: 0,
				deaths: 0,
				assists: 0
			};
		}
		
		const stats = championStats[championName];
		stats.games++;
		if (participant.win) stats.wins++;
		stats.kills += participant.kills;
		stats.deaths += participant.deaths;
		stats.assists += participant.assists;
	});
	
	// Calculate averages and winrates
	const championArray = Object.values(championStats).map(stats => ({
		...stats,
		winrate: (stats.wins / stats.games) * 100,
		avgKills: stats.kills / stats.games,
		avgDeaths: stats.deaths / stats.games,
		avgAssists: stats.assists / stats.games,
		kda: stats.deaths === 0 ? (stats.kills + stats.assists) : (stats.kills + stats.assists) / stats.deaths
	}));
	
	// Sort by games played
	return championArray.sort((a, b) => b.games - a.games);
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
