import { json } from '@sveltejs/kit';
import { RIOT_API_KEY } from '$env/static/private';

// Cache for individual player champions (1 hour TTL)
const championCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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
	'tr': { platform: 'tr1', routing: 'europe', regional: 'europe' },
	'ru': { platform: 'ru', routing: 'europe', regional: 'europe' }
};

// Helper: Fetch top 5 champions for a player from match history
async function getTopChampions(puuid, regional, apiKey) {
	try {
		console.log(`🔍 Loading champions for ${puuid.substring(0, 10)}...`);
		
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
		
		// Fetch match details SEQUENTIALLY to avoid rate limiting
		const matches = [];
		for (let i = 0; i < Math.min(8, matchIds.length); i++) {
			try {
				await new Promise(resolve => setTimeout(resolve, 150));
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
		
		console.log(`✅ Found ${topChampions.length} champions`);
		return topChampions.length > 0 ? topChampions : null;
	} catch (error) {
		console.error('Error fetching top champions:', error.message);
		return null;
	}
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const puuid = url.searchParams.get('puuid');
	const region = url.searchParams.get('region') || 'euw';
	
	if (!puuid) {
		return json({ success: false, error: 'Missing puuid' }, { status: 400 });
	}
	
	// Check cache first
	const cacheKey = `${puuid}-${region}`;
	const cached = championCache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		console.log(`📦 Returning cached champions for ${puuid.substring(0, 10)}`);
		return json({ 
			success: true, 
			champions: cached.data,
			cached: true 
		});
	}
	
	const routing = REGION_ROUTING[region.toLowerCase()] || REGION_ROUTING['euw'];
	const { regional } = routing;
	
	const champions = await getTopChampions(puuid, regional, RIOT_API_KEY);
	
	if (champions) {
		// Cache the result
		championCache.set(cacheKey, {
			data: champions,
			timestamp: Date.now()
		});
		
		return json({ 
			success: true, 
			champions,
			cached: false 
		});
	}
	
	return json({ 
		success: false, 
		error: 'Could not fetch champions',
		champions: null 
	});
}
