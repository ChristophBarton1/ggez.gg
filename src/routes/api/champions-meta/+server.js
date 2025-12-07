/**
 * Champions Meta API
 * Generates realistic meta stats based on champion data
 * 
 * Query params:
 * - rank: iron, bronze, silver, gold, platinum, diamond, master, challenger (default: platinum_plus)
 * - role: top, jungle, mid, adc, support (default: all)
 * 
 * Note: Uses realistic simulated data until we aggregate from Riot API matches
 */

// Cache for API responses (10 minutes for faster updates)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

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
 * Generate realistic champion stats
 * Uses seeded random for consistency within same rank/role
 */
function generateChampionStats(rank, role) {
	const cacheKey = `${rank}_${role}`;
	
	// Check cache first
	const cached = cache.get(cacheKey);
	if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
		console.log('✅ Cache hit for:', cacheKey);
		return cached.data;
	}
	
	// Generate stats for all champion IDs (Riot uses numeric IDs)
	const champions = [];
	
	// Common champion IDs from Riot API
	const championIds = Array.from({ length: 172 }, (_, i) => i + 1);
	
	// Seed for deterministic "random" based on rank+role
	const seed = `${rank}_${role}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	
	championIds.forEach((championId, index) => {
		// Seeded pseudo-random
		const random1 = Math.abs(Math.sin(seed + championId * 12.9898) * 43758.5453) % 1;
		const random2 = Math.abs(Math.sin(seed + championId * 78.233) * 43758.5453) % 1;
		const random3 = Math.abs(Math.sin(seed + championId * 45.164) * 43758.5453) % 1;
		
		// Realistic win rate range: 47-54%
		const winRate = (47 + random1 * 7).toFixed(2);
		
		// Pick rate: 0.5% - 20%
		const pickRate = (0.5 + random2 * 19.5).toFixed(2);
		
		// Ban rate: 0% - 50%
		const banRate = (random3 * 50).toFixed(2);
		
		// Calculate tier
		let tier = 'B';
		const wr = parseFloat(winRate);
		if (wr >= 53) tier = 'S+';
		else if (wr >= 52) tier = 'S';
		else if (wr >= 51) tier = 'A+';
		else if (wr >= 50) tier = 'A';
		
		// Simulate games played
		const games = Math.floor(10000 + random1 * 50000);
		
		champions.push({
			championId,
			winRate,
			pickRate,
			banRate,
			games,
			tier
		});
	});
	
	// Sort by win rate (descending)
	champions.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
	
	// Cache the result
	cache.set(cacheKey, {
		data: champions,
		timestamp: Date.now()
	});
	
	console.log('✅ Generated stats for', champions.length, 'champions:', cacheKey);
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
		
		// Generate champion stats
		const champions = generateChampionStats(rank, role);
		
		return new Response(JSON.stringify({
			success: true,
			rank,
			role,
			champions,
			count: champions.length,
			source: 'generated',
			cached: cache.has(`${rank}_${role}`),
			note: 'Using realistic simulated data. Real aggregation coming soon.'
		}), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=600' // 10 minutes
			}
		});
		
	} catch (error) {
		console.error('❌ Champions Meta API Error:', error);
		
		return new Response(JSON.stringify({
			success: false,
			error: error.message
		}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
}
