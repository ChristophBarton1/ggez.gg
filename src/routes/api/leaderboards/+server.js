import { json } from '@sveltejs/kit';
import { RIOT_API_KEY } from '$env/static/private';

// Simple in-memory cache (1 hour TTL)
// Note: Cache is cleared on server restart
let cache = {
	data: null,
	timestamp: 0,
	TTL: 60 * 60 * 1000 // 1 hour in milliseconds
};

// Helper: Fetch top 5 champions for a player from match history
async function getTopChampions(puuid, regional, platform, apiKey) {
	try {
		// Add delay before fetching to respect rate limits
		await new Promise(resolve => setTimeout(resolve, 200));
		
		// Fetch last 20 ranked solo/duo games
		const matchListUrl = `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=20&api_key=${apiKey}`;
		const matchListRes = await fetch(matchListUrl);
		
		if (!matchListRes.ok) {
			console.warn(`⚠️ Match list failed: ${matchListRes.status}`);
			return null;
		}
		
		const matchIds = await matchListRes.json();
		
		if (!matchIds || matchIds.length === 0) {
			return null;
		}
		
		// Fetch match details SEQUENTIALLY (one at a time) to avoid rate limiting
		const matches = [];
		for (let i = 0; i < Math.min(8, matchIds.length); i++) {
			try {
				await new Promise(resolve => setTimeout(resolve, 150)); // 150ms delay between each match
				const matchUrl = `https://${regional}.api.riotgames.com/lol/match/v5/matches/${matchIds[i]}?api_key=${apiKey}`;
				const matchRes = await fetch(matchUrl);
				if (matchRes.ok) {
					matches.push(await matchRes.json());
				}
			} catch (e) {
				// Continue with next match
			}
		}
		
		// Count champion frequency
		const championCounts = {};
		matches.forEach(match => {
			const participant = match.info.participants.find(p => p.puuid === puuid);
			if (participant) {
				const champId = participant.championId.toString();
				championCounts[champId] = (championCounts[champId] || 0) + 1;
			}
		});
		
		// Get top 5 champions sorted by play count
		const topChampions = Object.entries(championCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([champId]) => champId);
		
		return topChampions.length > 0 ? topChampions : null;
	} catch (error) {
		console.error('Error fetching top champions:', error.message);
		return null;
	}
}

const REGION_ROUTING = {
	'euw': { platform: 'euw1', routing: 'europe', regional: 'europe' },
	'eune': { platform: 'eun1', routing: 'europe', regional: 'europe' },
	'na': { platform: 'na1', routing: 'americas', regional: 'americas' },
	'br': { platform: 'br1', routing: 'americas', regional: 'americas' },
	'lan': { platform: 'la1', routing: 'americas', regional: 'americas' },
	'las': { platform: 'la2', routing: 'americas', regional: 'americas' },
	'kr': { platform: 'kr', routing: 'asia', regional: 'asia' },
	'jp': { platform: 'jp1', routing: 'asia', regional: 'asia' },
	'oce': { platform: 'oc1', routing: 'sea', regional: 'sea' },
	'tr': { platform: 'tr1', routing: 'europe', regional: 'europe' }
};

export async function GET({ url }) {
	const region = url.searchParams.get('region') || 'euw';
	const role = url.searchParams.get('role') || 'all';
	const timeframe = url.searchParams.get('timeframe') || '7d';

	const { platform, regional } = REGION_ROUTING[region] || REGION_ROUTING['euw'];

	// Check cache first
	const now = Date.now();
	const cacheKey = `${region}-${role}-${timeframe}`;
	if (cache.data && cache.timestamp > 0 && (now - cache.timestamp) < cache.TTL && cache.data.cacheKey === cacheKey) {
		const age = Math.floor((now - cache.timestamp) / 1000 / 60); // minutes
		console.log(`📦 Returning cached data (${age} minutes old)`);
		return json({
			...cache.data,
			cached: true,
			cacheAge: age
		});
	}

	// Debug: Check if API key is loaded
	console.log('🔑 API Key loaded:', RIOT_API_KEY ? `${RIOT_API_KEY.substring(0, 15)}...` : 'NOT FOUND');
	console.log('🌍 Platform:', platform, '| Regional:', regional);
	console.log('⏰ Request time:', new Date().toLocaleTimeString());
	console.log('🆕 NEW CODE LOADED!');

	try {
		// Fetch Challenger and Grandmaster players (Master is too slow/large)
		const [challengerRes, grandmasterRes] = await Promise.all([
			fetch(`https://${platform}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${RIOT_API_KEY}`),
			fetch(`https://${platform}.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${RIOT_API_KEY}`)
		]);

		if (!challengerRes.ok || !grandmasterRes.ok) {
			const errors = [];
			if (!challengerRes.ok) errors.push(`Challenger: ${challengerRes.status} ${challengerRes.statusText}`);
			if (!grandmasterRes.ok) errors.push(`Grandmaster: ${grandmasterRes.status} ${grandmasterRes.statusText}`);
			console.error('❌ Riot API Error:', errors.join(', '));
			throw new Error(`Failed to fetch ladder data: ${errors.join(', ')}`);
		}

		const challenger = await challengerRes.json();
		const grandmaster = await grandmasterRes.json();
		
		console.log(`✅ Fetched ${challenger.entries.length} Challenger + ${grandmaster.entries.length} Grandmaster players`);

		// Combine all players
		let allPlayers = [
			...challenger.entries.map(e => ({ ...e, tier: 'Challenger' })),
			...grandmaster.entries.map(e => ({ ...e, tier: 'Grandmaster' }))
		];

		// Sort by LP descending
		allPlayers.sort((a, b) => b.leaguePoints - a.leaguePoints);

		// Take top 10 for simplicity
		allPlayers = allPlayers.slice(0, 10);
		
		// Debug: Check what fields we have
		console.log('🔍 Sample player data:', JSON.stringify(allPlayers[0], null, 2));

		// Different default champions for variety in spotlight
		const defaultChampions = ['157', '238', '84', '777', '141', '555', '11', '64', '103', '245'];
		
		// Fetch detailed summoner info for each player (with rate limiting)
		const playerDetailsPromises = allPlayers.map(async (p, i) => {
			// Add delay to avoid rate limiting (100ms between each player)
			await new Promise(resolve => setTimeout(resolve, i * 100));
			
			try {
				// We already have PUUID from League API! Use it directly for Account API
				let gameName = `Player${i + 1}`;
				let tagLine = region.toUpperCase();
				let profileIconId = 29;
				
				// Fetch RiotID (gameName#tagLine) using Account-v1 API with PUUID
				try {
					const accountRes = await fetch(`https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${p.puuid}?api_key=${RIOT_API_KEY}`);
					if (accountRes.ok) {
						const account = await accountRes.json();
						gameName = account.gameName || gameName;
						tagLine = account.tagLine || tagLine;
						console.log(`✅ Got name: ${gameName}#${tagLine}`);
					} else {
						console.warn(`⚠️ Account API failed for player ${i}: ${accountRes.status}`);
					}
				} catch (e) {
					console.warn(`⚠️ Account API error for player ${i}:`, e.message);
				}
				
				// Optionally fetch summoner for profileIconId (not critical)
				try {
					const summonerRes = await fetch(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${p.puuid}?api_key=${RIOT_API_KEY}`);
					if (summonerRes.ok) {
						const summoner = await summonerRes.json();
						profileIconId = summoner.profileIconId || 29;
					}
				} catch (e) {
					// Profile icon not critical, use default
				}
				
				// 🎮 For TOP 3 players: Fetch real champions from match history!
				let topChampions = [
					defaultChampions[i % defaultChampions.length],
					defaultChampions[(i + 1) % defaultChampions.length],
					defaultChampions[(i + 2) % defaultChampions.length],
					defaultChampions[(i + 3) % defaultChampions.length],
					defaultChampions[(i + 4) % defaultChampions.length]
				];
				
				if (i < 3) {
					console.log(`🔍 Fetching match history for top ${i + 1} player: ${gameName}...`);
					const realChampions = await getTopChampions(p.puuid, regional, platform, RIOT_API_KEY);
					if (realChampions && realChampions.length > 0) {
						topChampions = realChampions;
						console.log(`✅ Got real champions for ${gameName}:`, topChampions);
					} else {
						console.warn(`⚠️ Could not fetch champions for ${gameName}, using defaults`);
					}
				}
				
				return {
					rank: i + 1,
					summonerName: gameName,
					tagLine: tagLine,
					tier: p.tier,
					lp: p.leaguePoints,
					flexTier: 'Unranked',
					flexLP: 0,
					lpGain: p.hotStreak ? Math.floor(Math.random() * 200) + 100 : Math.floor(Math.random() * 100),
					winRate: ((p.wins / (p.wins + p.losses)) * 100).toFixed(1),
					wins: p.wins,
					losses: p.losses,
					mainChampion: topChampions[0],
					topChampions: topChampions,
					profileIconId: profileIconId,
					puuid: p.puuid
				};
			} catch (error) {
				console.error(`⚠️ Error fetching player ${i}:`, error.message);
				// Return fallback data instead of failing completely
				return {
					rank: i + 1,
					summonerName: `Player${i + 1}`,
					tagLine: region.toUpperCase(),
					tier: p.tier,
					lp: p.leaguePoints,
					flexTier: 'Unranked',
					flexLP: 0,
					lpGain: p.hotStreak ? 150 : 75,
					winRate: ((p.wins / (p.wins + p.losses)) * 100).toFixed(1),
					wins: p.wins,
					losses: p.losses,
					mainChampion: defaultChampions[i % defaultChampions.length],
					topChampions: [
						defaultChampions[i % defaultChampions.length],
						defaultChampions[(i + 1) % defaultChampions.length],
						defaultChampions[(i + 2) % defaultChampions.length],
						defaultChampions[(i + 3) % defaultChampions.length],
						defaultChampions[(i + 4) % defaultChampions.length]
					],
					profileIconId: 29,
					puuid: p.puuid
				};
			}
		});

		const players = await Promise.all(playerDetailsPromises);

		// Prepare response
		const responseData = {
			success: true,
			players,
			filters: { region, role, timeframe },
			cacheKey: cacheKey
		};

		// Cache the response
		cache.data = responseData;
		cache.timestamp = Date.now();
		console.log('💾 Data cached for 1 hour');

		return json(responseData);

	} catch (error) {
		console.error('Error in leaderboards API:', error);
		
		// Fallback to mock data if API fails
		const mockPlayers = [];
		const ranks = ['Challenger', 'Grandmaster', 'Master'];
		const names = ['Faker', 'Caps', 'Jankos', 'Rekkles', 'Perkz', 'Hans Sama', 'Upset', 'Elyoya', 'Humanoid', 'Comp'];
		const defaultChampions = ['157', '238', '84', '777', '141', '555', '11', '64', '103', '245'];
		
		for (let i = 0; i < 10; i++) {
			mockPlayers.push({
				rank: i + 1,
				summonerName: i < 5 ? names[i] : `Player${i + 1}`,
				tagLine: `${region.toUpperCase()}`,
				tier: ranks[Math.floor(i / 20)] || 'Master',
				lp: 1200 - (i * 15),
				flexTier: 'Unranked',
				flexLP: 0,
				lpGain: Math.floor(Math.random() * 200),
				winRate: (55 + (Math.random() * 15)).toFixed(1),
				wins: Math.floor(100 + Math.random() * 400),
				losses: Math.floor(50 + Math.random() * 200),
				mainChampion: defaultChampions[i % defaultChampions.length],
				topChampions: [
					defaultChampions[i % defaultChampions.length],
					defaultChampions[(i + 1) % defaultChampions.length],
					defaultChampions[(i + 2) % defaultChampions.length],
					defaultChampions[(i + 3) % defaultChampions.length],
					defaultChampions[(i + 4) % defaultChampions.length]
				],
				profileIconId: 29
			});
		}

		return json({
			success: true,
			players: mockPlayers,
			filters: { region, role, timeframe },
			note: 'Using fallback data - Riot API unavailable'
		});
	}
}
