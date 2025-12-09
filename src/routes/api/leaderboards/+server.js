import { json } from '@sveltejs/kit';
import { RIOT_API_KEY } from '$env/static/private';

const REGION_ROUTING = {
	'euw': { platform: 'euw1', routing: 'europe' },
	'eune': { platform: 'eun1', routing: 'europe' },
	'na': { platform: 'na1', routing: 'americas' },
	'br': { platform: 'br1', routing: 'americas' },
	'lan': { platform: 'la1', routing: 'americas' },
	'las': { platform: 'la2', routing: 'americas' },
	'kr': { platform: 'kr', routing: 'asia' },
	'jp': { platform: 'jp1', routing: 'asia' },
	'oce': { platform: 'oc1', routing: 'sea' },
	'tr': { platform: 'tr1', routing: 'europe' }
};

export async function GET({ url }) {
	const region = url.searchParams.get('region') || 'euw';
	const role = url.searchParams.get('role') || 'all';
	const timeframe = url.searchParams.get('timeframe') || '7d';

	const { platform } = REGION_ROUTING[region] || REGION_ROUTING['euw'];

	try {
		// Fetch Challenger, Grandmaster, and Master players
		const [challengerRes, grandmasterRes, masterRes] = await Promise.all([
			fetch(`https://${platform}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${RIOT_API_KEY}`),
			fetch(`https://${platform}.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${RIOT_API_KEY}`),
			fetch(`https://${platform}.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=${RIOT_API_KEY}`)
		]);

		if (!challengerRes.ok || !grandmasterRes.ok || !masterRes.ok) {
			throw new Error('Failed to fetch ladder data from Riot API');
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

		// Fetch detailed summoner info for each player (in parallel)
		const playerDetailsPromises = allPlayers.map(async (p, i) => {
			try {
				// Fetch summoner details to get PUUID
				const summonerRes = await fetch(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/${p.summonerId}?api_key=${RIOT_API_KEY}`);
				
				if (!summonerRes.ok) {
					throw new Error('Failed to fetch summoner');
				}
				
				const summoner = await summonerRes.json();
				
				// Use summonerName from league entry, fallback to summoner.name
				const displayName = p.summonerName || summoner.name || `Player${i + 1}`;
				
				return {
					rank: i + 1,
					summonerName: displayName,
					tagLine: region.toUpperCase(),
					tier: p.tier,
					lp: p.leaguePoints,
					flexTier: 'Unranked',
					flexLP: 0,
					lpGain: p.hotStreak ? Math.floor(Math.random() * 200) + 100 : Math.floor(Math.random() * 100),
					winRate: ((p.wins / (p.wins + p.losses)) * 100).toFixed(1),
					wins: p.wins,
					losses: p.losses,
					mainChampion: '157', // Default Yasuo
					topChampions: ['157', '238', '84', '7', '64'],
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
					mainChampion: '157',
					topChampions: ['157', '238', '84', '7', '64'],
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
		const champPool = ['157', '238', '84', '7', '64'];
		
		for (let i = 0; i < 10; i++) {
			const randomChamps = [...champPool].sort(() => 0.5 - Math.random()).slice(0, 5);
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
				losses: Math.floor(80 + Math.random() * 300),
				mainChampion: randomChamps[0],
				topChampions: randomChamps,
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
