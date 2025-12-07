/**
 * Champions Meta API - Powered by LoLalytics
 * Fetches real win rates, pick rates, ban rates by rank and role
 * 
 * Query params:
 * - rank: iron, bronze, silver, gold, platinum, diamond, master, challenger (default: platinum_plus)
 * - role: top, jungle, mid, adc, support (default: all)
 */

// Cache for API responses (30 minutes)
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Rank mapping to LoLalytics tiers
const RANK_MAPPING = {
	'iron': 'iron',
	'bronze': 'bronze',
	'silver': 'silver',
	'gold': 'gold',
	'platinum': 'platinum',
	'diamond': 'diamond',
	'master': 'master',
	'challenger': 'challenger',
	'platinum_plus': 'platinum_plus', // Most popular
	'diamond_plus': 'diamond_plus',
	'all': 'platinum_plus' // Default
};

// Role mapping to LoLalytics lanes
const ROLE_MAPPING = {
	'top': 'top',
	'jungle': 'jungle',
	'mid': 'middle',
	'adc': 'adc',
	'support': 'support',
	'all': 'default'
};

/**
 * Fetch champion stats from LoLalytics
 */
async function fetchLoLalyticsData(rank, role) {
	const cacheKey = `${rank}_${role}`;
	
	// Check cache
	const cached = cache.get(cacheKey);
	if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
		console.log('✅ Cache hit for:', cacheKey);
		return cached.data;
	}
	
	try {
		// LoLalytics endpoint
		const tier = RANK_MAPPING[rank] || 'platinum_plus';
		const lane = ROLE_MAPPING[role] || 'default';
		
		// Fetch from LoLalytics - they aggregate all champions
		// Format: https://axe.lolalytics.com/tierlist/1/?tier={tier}&patch=30&lane={lane}
		const url = `https://axe.lolalytics.com/tierlist/1/?tier=${tier}&patch=30&lane=${lane}`;
		
		console.log('🔍 Fetching LoLalytics:', url);
		
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				'Accept': 'application/json'
			}
		});
		
		if (!response.ok) {
			throw new Error(`LoLalytics API error: ${response.status}`);
		}
		
		const data = await response.json();
		
		// Cache the result
		cache.set(cacheKey, {
			data,
			timestamp: Date.now()
		});
		
		console.log('✅ LoLalytics data fetched:', Object.keys(data).length, 'champions');
		return data;
		
	} catch (error) {
		console.error('❌ LoLalytics fetch error:', error);
		throw error;
	}
}

/**
 * Parse LoLalytics data to our format
 */
function parseLoLalyticsData(rawData) {
	if (!rawData || !rawData.cid) {
		return [];
	}
	
	const champions = [];
	
	// LoLalytics format: { cid: { championId: [stats array] } }
	Object.entries(rawData.cid).forEach(([championId, stats]) => {
		if (!stats || stats.length < 8) return;
		
		// Stats format: [wins, games, banRate, ...]
		const wins = stats[0] || 0;
		const games = stats[1] || 1;
		const banRate = stats[2] || 0;
		const winRate = games > 0 ? (wins / games) * 100 : 0;
		const pickRate = stats[3] || 0;
		
		// Calculate tier based on win rate
		let tier = 'B';
		if (winRate >= 53) tier = 'S+';
		else if (winRate >= 52) tier = 'S';
		else if (winRate >= 51) tier = 'A+';
		else if (winRate >= 50) tier = 'A';
		
		champions.push({
			championId: parseInt(championId),
			winRate: winRate.toFixed(2),
			pickRate: pickRate.toFixed(2),
			banRate: banRate.toFixed(2),
			games: games,
			tier
		});
	});
	
	// Sort by win rate
	champions.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
	
	return champions;
}

/**
 * GET handler
 */
export async function GET({ url }) {
	try {
		const rank = url.searchParams.get('rank') || 'platinum_plus';
		const role = url.searchParams.get('role') || 'all';
		
		console.log('📊 Champions Meta Request:', { rank, role });
		
		// Fetch from LoLalytics
		const rawData = await fetchLoLalyticsData(rank, role);
		
		// Parse to our format
		const champions = parseLoLalyticsData(rawData);
		
		return new Response(JSON.stringify({
			success: true,
			rank,
			role,
			champions,
			count: champions.length,
			source: 'lolalytics',
			cached: cache.has(`${rank}_${role}`)
		}), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=1800' // 30 minutes
			}
		});
		
	} catch (error) {
		console.error('❌ Champions Meta API Error:', error);
		
		return new Response(JSON.stringify({
			success: false,
			error: error.message,
			fallback: true
		}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
}
