import { json } from '@sveltejs/kit';
import { RIOT_API_KEY } from '$env/static/private';

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

	// Debug: Check if API key is loaded
	console.log('🔑 API Key loaded:', RIOT_API_KEY ? `${RIOT_API_KEY.substring(0, 15)}...` : 'NOT FOUND');
	console.log('🌍 Platform:', platform, '| Regional:', regional);

	try {
		// Fetch Challenger, Grandmaster, and Master players
		const [challengerRes, grandmasterRes, masterRes] = await Promise.all([
			fetch(`https://${platform}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${RIOT_API_KEY}`),
			fetch(`https://${platform}.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${RIOT_API_KEY}`),
			fetch(`https://${platform}.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=${RIOT_API_KEY}`)
		]);

		if (!challengerRes.ok || !grandmasterRes.ok || !masterRes.ok) {
			const errors = [];
			if (!challengerRes.ok) errors.push(`Challenger: ${challengerRes.status} ${challengerRes.statusText}`);
			if (!grandmasterRes.ok) errors.push(`Grandmaster: ${grandmasterRes.status} ${grandmasterRes.statusText}`);
			if (!masterRes.ok) errors.push(`Master: ${masterRes.status} ${masterRes.statusText}`);
			console.error('❌ Riot API Error:', errors.join(', '));
			throw new Error(`Failed to fetch ladder data: ${errors.join(', ')}`);
		}

		const challenger = await challengerRes.json();
		const grandmaster = await grandmasterRes.json();
		const master = await masterRes.json();

		// Combine all players
		let allPlayers = [
			...challenger.entries.map(e => ({ ...e, tier: 'Challenger' })),
			...grandmaster.entries.map(e => ({ ...e, tier: 'Grandmaster' })),
			...master.entries.slice(0, 100).map(e => ({ ...e, tier: 'Master' })) // Limit Master to top 100
		];

		// Sort by LP descending
		allPlayers.sort((a, b) => b.leaguePoints - a.leaguePoints);

		// Take top 10 for simplicity
		allPlayers = allPlayers.slice(0, 10);

		// Different default champions for variety in spotlight
		const defaultChampions = ['157', '238', '84', '777', '141', '555', '11', '64', '103', '245'];
		
		// Fetch detailed summoner info for each player (in parallel)
		const playerDetailsPromises = allPlayers.map(async (p, i) => {
			try {
				// Fetch summoner details to get PUUID
				const summonerRes = await fetch(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/${p.summonerId}?api_key=${RIOT_API_KEY}`);
				
				if (!summonerRes.ok) {
					throw new Error('Failed to fetch summoner');
				}
				
				const summoner = await summonerRes.json();
				
				// Fetch RiotID (gameName#tagLine) using Account-v1 API
				let gameName = p.summonerName || summoner.name || `Player${i + 1}`;
				let tagLine = region.toUpperCase();
				
				try {
					const accountRes = await fetch(`https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${summoner.puuid}?api_key=${RIOT_API_KEY}`);
					if (accountRes.ok) {
						const account = await accountRes.json();
						gameName = account.gameName || gameName;
						tagLine = account.tagLine || tagLine;
					}
				} catch (e) {
					// Fallback to old name if Account API fails
					console.warn(`Account API failed for ${summoner.puuid}`);
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
					mainChampion: defaultChampions[i % defaultChampions.length],
					topChampions: [
						defaultChampions[i % defaultChampions.length],
						defaultChampions[(i + 1) % defaultChampions.length],
						defaultChampions[(i + 2) % defaultChampions.length],
						defaultChampions[(i + 3) % defaultChampions.length],
						defaultChampions[(i + 4) % defaultChampions.length]
					],
					profileIconId: summoner.profileIconId || 29,
					summonerId: p.summonerId,
					puuid: summoner.puuid
				};
			} catch (error) {
				console.error(`Error fetching player ${i}:`, error);
				// Fallback
				return {
					rank: i + 1,
					summonerName: p.summonerName || `Player${i + 1}`,
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
					summonerId: p.summonerId
				};
			}
		});

		const players = await Promise.all(playerDetailsPromises);

		return json({
			success: true,
			players,
			filters: { region, role, timeframe }
		});

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
