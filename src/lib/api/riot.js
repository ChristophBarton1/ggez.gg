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
 * Get routing value by region
 */
function getRoutingByRegion(region) {
	return REGION_ROUTING[region] || REGION_ROUTING[region.toUpperCase()] || 'europe';
}

/**
 * Get platform by region
 */
function getPlatformByRegion(region) {
	return PLATFORM_IDS[region] || PLATFORM_IDS[region.toUpperCase()] || 'euw1';
}

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

		// ⚡ PARALLEL LOADING: Steps 2 & 3 can run simultaneously!
		const platform = PLATFORM_IDS[region] || 'euw1';
		
		const [summonerRes, rankedRes] = await Promise.all([
			// Step 2: Get Summoner data by PUUID
			fetch(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, {
				headers: { 'X-Riot-Token': RIOT_API_KEY }
			}),
			// Step 3: Get Ranked data (parallel!)
			fetch(`https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, {
				headers: { 'X-Riot-Token': RIOT_API_KEY }
			})
		]);

		if (!summonerRes.ok) {
			throw new Error(`Summoner API error: ${summonerRes.status}`);
		}

		const summonerData = await summonerRes.json();
	
		// 🔍 DEBUG: Check what Riot API returns
		console.log('🔍 Summoner API Response:', summonerData);
		console.log('🔍 summonerData.id:', summonerData.id);

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

		const returnData = {
			puuid,
			id: summonerData.id, // encryptedSummonerId for Spectator API
			summonerId: summonerData.id, // Alias for compatibility
			accountId: summonerData.accountId,
			name: riotGameName,
			tag: riotTagLine,
			profileIconId: summonerData.profileIconId,
			summonerLevel: summonerData.summonerLevel,
			ranked: rankedData,
			region,
			platform
		};
	
		console.log('📤 Returning summoner object:', returnData);
		console.log('📤 returnData.id:', returnData.id);
		console.log('📤 returnData.summonerId:', returnData.summonerId);
	
		return returnData;

	} catch (error) {
		console.error('Riot API Error:', error);
		return { error: error.message };
	}
}

/**
 * Utility function to delay execution (for rate limiting)
 */
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch matches in batches to respect rate limits
 * Development Key: 20 requests/second, 100 requests/2 minutes
 * OPTIMIZED: Larger batches, shorter delays for lightning-fast loading
 */
async function fetchMatchesInBatches(matchIds, routingValue, batchSize = 10, delayMs = 200) {
	const matches = [];
	
	for (let i = 0; i < matchIds.length; i += batchSize) {
		const batch = matchIds.slice(i, i + batchSize);
		
		console.log(`⚡ Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(matchIds.length / batchSize)}...`);
		
		const batchPromises = batch.map(async (matchId) => {
			const matchUrl = `https://${routingValue}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
			
			try {
				const matchRes = await fetch(matchUrl, {
					headers: { 'X-Riot-Token': RIOT_API_KEY }
				});
				
				if (!matchRes.ok) {
					if (matchRes.status === 429) {
						console.warn(`⚠️ Rate limit hit for match ${matchId}, waiting 3 seconds...`);
						await delay(3000); // Wait 3 seconds on rate limit
						// Retry once
						const retryRes = await fetch(matchUrl, {
							headers: { 'X-Riot-Token': RIOT_API_KEY }
						});
						if (retryRes.ok) {
							return await retryRes.json();
						}
						return null;
					}
					console.error(`Match ${matchId} API error:`, matchRes.status);
					return null;
				}
				
				return await matchRes.json();
			} catch (error) {
				console.error(`Error fetching match ${matchId}:`, error);
				return null;
			}
		});
		
		const batchResults = await Promise.all(batchPromises);
		matches.push(...batchResults.filter(m => m !== null));
		
		// Delay between batches to avoid rate limits
		if (i + batchSize < matchIds.length) {
			await delay(delayMs);
		}
	}
	
	return matches;
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
		console.log(`Fetching ${matchIds.length} matches...`);
		
		// Fetch matches in batches with rate limiting
		const matches = await fetchMatchesInBatches(matchIds, routingValue);
		
		console.log(`Successfully loaded ${matches.length}/${matchIds.length} matches`);
		return matches;
		
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
 * Analyze LP gains by champion (Ranked games only)
 */
export function analyzeChampionLPGains(matches, puuid) {
	const championStats = {};
	
	// Ranked queue IDs
	const rankedQueues = [420, 440]; // Solo/Duo and Flex
	
	matches.forEach(match => {
		// Only analyze ranked games
		if (!rankedQueues.includes(match.info.queueId)) return;
		
		const participant = match.info.participants.find(p => p.puuid === puuid);
		if (!participant) return;
		
		const championName = participant.championName;
		const gameDuration = match.info.gameDuration; // in seconds
		
		if (!championStats[championName]) {
			championStats[championName] = {
				championName,
				championId: participant.championId,
				role: participant.teamPosition || 'UNKNOWN',
				games: 0,
				wins: 0,
				lpChange: 0,
				kills: 0,
				deaths: 0,
				assists: 0,
				totalCS: 0,
				totalDamage: 0,
				totalDamageTaken: 0,
				totalGold: 0,
				totalKills: 0, // Team kills for KP calculation
				totalGameDuration: 0,
				goldDiffAt15: 0,
				csDiffAt15: 0,
				gamesWithGoldDiff: 0,
				gamesWithCSDiff: 0
			};
		}
		
		const stats = championStats[championName];
		stats.games++;
		
		// Estimate LP change based on performance (more realistic)
		// Base LP: +20 for win, -18 for loss
		// Modified by performance factors
		let lpChange = participant.win ? 20 : -18;
		
		// Performance modifiers
		const kda = participant.deaths === 0 ? 
			(participant.kills + participant.assists) : 
			(participant.kills + participant.assists) / participant.deaths;
		
		if (participant.win) {
			// Bonus LP for exceptional performance
			if (kda > 5) lpChange += 2;
			if (participant.kills > 15) lpChange += 1;
		} else {
			// Reduced LP loss for good performance in a loss
			if (kda > 3) lpChange += 2;
		}
		
		stats.lpChange += lpChange;
		if (participant.win) stats.wins++;
		stats.kills += participant.kills;
		stats.deaths += participant.deaths;
		stats.assists += participant.assists;
		stats.totalCS += (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);
		stats.totalDamage += participant.totalDamageDealtToChampions || 0;
		stats.totalDamageTaken += participant.totalDamageTaken || 0;
		stats.totalGold += participant.goldEarned || 0;
		stats.totalGameDuration += gameDuration;
		
		// Gold and CS diff at 15 (if available in timeline data)
		if (participant.challenges) {
			if (participant.challenges.goldPerMinute) {
				stats.goldDiffAt15 += (participant.challenges.goldPerMinute * 15) - 3000; // Estimate
				stats.gamesWithGoldDiff++;
			}
		}
		
		// Calculate team kills for kill participation
		const teamParticipants = match.info.participants.filter(p => p.teamId === participant.teamId);
		const teamKills = teamParticipants.reduce((sum, p) => sum + p.kills, 0);
		stats.totalKills += teamKills;
	});
	
	// Calculate averages and stats
	const championArray = Object.values(championStats).map(stats => {
		const avgGameDuration = stats.totalGameDuration / stats.games / 60; // in minutes
		const killParticipation = stats.totalKills > 0 ? 
			((stats.kills + stats.assists) / stats.totalKills) * 100 : 0;
		
		return {
			...stats,
			winrate: (stats.wins / stats.games) * 100,
			avgKills: stats.kills / stats.games,
			avgDeaths: stats.deaths / stats.games,
			avgAssists: stats.assists / stats.games,
			kda: stats.deaths === 0 ? (stats.kills + stats.assists) : (stats.kills + stats.assists) / stats.deaths,
			csPerMin: stats.totalCS / (stats.totalGameDuration / 60),
			dpm: (stats.totalDamage / (stats.totalGameDuration / 60)),
			goldPerMin: (stats.totalGold / (stats.totalGameDuration / 60)),
			killParticipation: killParticipation,
			avgGoldDiffAt15: stats.gamesWithGoldDiff > 0 ? stats.goldDiffAt15 / stats.gamesWithGoldDiff : 0
		};
	});
	
	// Sort by LP gained
	return championArray.sort((a, b) => b.lpChange - a.lpChange);
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

/**
 * GET LIVE GAME DATA (Spectator API v5)
 * Check if summoner is currently in a game and get all player info
 * @param {string} encryptedPUUID - The summoner's PUUID (NOT summoner ID!)
 * @param {string} region - Region code (e.g. 'EUW')
 */
export async function getLiveGame(encryptedPUUID, region = 'EUW') {
	try {
		const platform = PLATFORM_IDS[region] || 'euw1';
		const url = `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encryptedPUUID}`;
		
		console.log(' Fetching live game for PUUID:', encryptedPUUID);
		console.log(' URL:', url);
		
		const res = await fetch(url, {
			headers: { 'X-Riot-Token': RIOT_API_KEY }
		});
		
		console.log('📡 API Response Status:', res.status, res.statusText);
		
		if (res.status === 404) {
			// Not in game
			console.log('❌ Not in game (404 - No active game found)');
			return { inGame: false };
		}
		
		if (!res.ok) {
			const errorBody = await res.text();
			console.error('❌ API Error:', res.status, res.statusText);
			console.error('❌ Error Body:', errorBody);
			throw new Error(`Live Game API error: ${res.status} - ${errorBody}`);
		}
		
		const gameData = await res.json();
		
		console.log('✅ Live game found!');
		console.log('📊 Game Type:', gameData.gameType);
		console.log('📊 Game Mode:', gameData.gameMode);
		console.log('📊 Queue ID:', gameData.gameQueueConfigId);
		console.log('📊 Full Data:', gameData);
		
		return {
			inGame: true,
			gameData
		};
		
	} catch (error) {
		console.error('Live game fetch error:', error);
		return { inGame: false, error: error.message };
	}
}
