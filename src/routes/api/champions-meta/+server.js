/**
 * Champions Meta API
 * Generates realistic meta stats that vary by region, rank, role, queue, and patch
 * 
 * Query params:
 * - region: all, euw, na, kr, eune, br, lan, las, oce, jp, tr (default: euw)
 * - rank: platinum_plus, diamond_plus, iron, bronze, silver, gold, platinum, diamond, master (default: platinum_plus)
 * - role: all, top, jungle, mid, adc, support (default: all)
 * - queue: ranked_solo, ranked_flex, normal, aram, all (default: ranked_solo)
 * - patch: current, 14.23, 14.22, 14.21 (default: current)
 * 
 * Features:
 * - Region-specific data (e.g., KR has more games played)
 * - Rank-specific stats (e.g., Master has tighter win rate distribution)
 * - Role-specific pick rates (e.g., Mid/Jungle more popular)
 * - Queue-specific data (e.g., ARAM has different champion viability)
 * - Patch-specific balance (different win rates per patch)
 * - Deterministic but unique per filter combination
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

// Champion role assignments (based on Riot API champion keys)
// These are the championId (key) from DDragon, not internal IDs
// Popular picks per role - champions can appear in multiple roles
const CHAMPION_ROLES = {
	// Top Lane: Bruisers, Tanks, Fighters
	top: [
		2, 23, 24, 266, 114, 86, 36, 41, 75, 420, 516, 85, 157, 203, 240, 27, 6, 58, 59,
		126, 10, 82, 68, 72, 13, 54, 78, 92, 17, 50, 122, 56, 14, 98, 48, 44, 83, 77
	],
	// Jungle: Junglers
	jungle: [
		28, 11, 77, 5, 427, 64, 106, 20, 60, 121, 141, 245, 30, 113, 35, 154, 131, 234,
		19, 76, 421, 203, 104, 120, 62, 79, 107, 80, 254, 59, 163, 102, 9, 72
	],
	// Mid Lane: Mages, Assassins
	mid: [
		1, 238, 103, 84, 166, 34, 166, 45, 38, 105, 3, 74, 134, 43, 61, 69, 131, 90, 127,
		142, 115, 268, 136, 163, 517, 101, 7, 157, 161, 4, 50, 112, 8, 143, 25, 55
	],
	// ADC: Marksmen
	adc: [
		22, 110, 51, 81, 119, 96, 222, 429, 145, 236, 21, 133, 18, 202, 498, 15, 523,
		29, 42, 67, 221, 360, 126
	],
	// Support: Enchanters, Tanks
	support: [
		12, 53, 201, 40, 432, 555, 223, 111, 117, 25, 267, 89, 37, 412, 235, 16, 43,
		526, 350, 147, 63, 101, 497, 143
	]
};

/**
 * Generate realistic champion stats
 * Uses seeded random for consistency - different stats per rank/role/region/queue/patch
 * Only returns champions that are viable in the selected role
 */
function generateChampionStats(rank, role, region, queue, patch) {
	const cacheKey = `${queue}_${patch}_${region}_${rank}_${role}`;
	
	// Check cache first
	const cached = cache.get(cacheKey);
	if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
		console.log('✅ Cache hit for:', cacheKey);
		return cached.data;
	}
	
	// Generate stats
	const champions = [];
	
	// Get champion IDs for the selected role, or all if 'all' is selected
	let championIds;
	if (role === 'all' || role === 'default') {
		// Show all champions if no specific role selected
		championIds = Array.from({ length: 172 }, (_, i) => i + 1);
	} else {
		// Get role-specific champions and add some flex picks
		const roleChamps = CHAMPION_ROLES[role] || [];
		// Add random champions as "off-meta" picks (20% more)
		const extraChamps = Array.from({ length: 172 }, (_, i) => i + 1)
			.filter(id => !roleChamps.includes(id))
			.slice(0, Math.floor(roleChamps.length * 0.2));
		championIds = [...roleChamps, ...extraChamps];
	}
	
	// Seed for deterministic "random" based on all filters
	// Different combinations produce different but consistent stats
	const seedString = `${queue}_${patch}_${region}_${rank}_${role}`;
	const seed = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	
	championIds.forEach((championId, index) => {
		// Multiple seeded pseudo-random values
		const random1 = Math.abs(Math.sin(seed + championId * 12.9898) * 43758.5453) % 1;
		const random2 = Math.abs(Math.sin(seed + championId * 78.233) * 43758.5453) % 1;
		const random3 = Math.abs(Math.sin(seed + championId * 45.164) * 43758.5453) % 1;
		const random4 = Math.abs(Math.sin(seed + championId * 31.421) * 43758.5453) % 1;
		
		// Check if this champion is "main role" or "off-meta"
		const isMainRole = (role === 'all' || role === 'default') || 
			(CHAMPION_ROLES[role] && CHAMPION_ROLES[role].includes(championId));
		
		// Realistic win rate range: 46-54%
		// Higher ranks have tighter win rate distribution
		// Off-meta champions have lower win rates
		let wrRange = 8;
		let wrBase = 46;
		
		// Rank adjustments
		if (rank === 'master' || rank === 'challenger') {
			wrRange = 6; // 47-53%
			wrBase = 47;
		} else if (rank === 'diamond' || rank === 'diamond_plus') {
			wrRange = 7; // 46.5-53.5%
			wrBase = 46.5;
		}
		
		// Queue Type adjustments
		if (queue === 'aram') {
			wrRange = 10; // ARAM has wider win rate spread (40-60%)
			wrBase = 40;
		} else if (queue === 'normal') {
			wrRange = 9; // Normals less balanced
			wrBase = 45;
		} else if (queue === 'ranked_solo') {
			// Most balanced - default values
			wrBase += 1; // Slightly higher base for ranked
		}
		
		// Patch adjustments (older patches may have different balance)
		if (patch === '14.23') wrBase -= 0.5;
		if (patch === '14.22') wrBase -= 1;
		if (patch === '14.21') wrBase -= 1.5;
		
		// Off-meta champions: lower win rates (2-3% penalty)
		if (!isMainRole) {
			wrBase -= 2.5;
		}
		
		const winRate = (wrBase + random1 * wrRange).toFixed(2);
		
		// Pick rate: 0.5% - 20% (varies by role popularity)
		let pickRateMultiplier = 1;
		if (role === 'mid' || role === 'jungle') pickRateMultiplier = 1.2; // More popular
		if (role === 'support') pickRateMultiplier = 0.8; // Less popular
		
		// Off-meta champions: much lower pick rates (60% reduction)
		if (!isMainRole) {
			pickRateMultiplier *= 0.4;
		}
		
		const pickRate = (0.5 + random2 * 19.5 * pickRateMultiplier).toFixed(2);
		
		// Ban rate: 0% - 50% (higher in lower elos)
		let banRateMultiplier = 1;
		if (rank === 'iron' || rank === 'bronze') banRateMultiplier = 1.3;
		if (rank === 'master' || rank === 'challenger') banRateMultiplier = 0.7;
		const banRate = (random3 * 50 * banRateMultiplier).toFixed(2);
		
		// Calculate tier
		let tier = 'B';
		const wr = parseFloat(winRate);
		if (wr >= 53) tier = 'S+';
		else if (wr >= 52) tier = 'S';
		else if (wr >= 51) tier = 'A+';
		else if (wr >= 50) tier = 'A';
		
		// Simulate games played (more games in popular regions/ranks)
		let gamesMultiplier = 1;
		if (region === 'kr') gamesMultiplier = 1.5; // Korea plays more
		if (region === 'euw' || region === 'na') gamesMultiplier = 1.2;
		if (rank === 'platinum_plus' || rank === 'diamond_plus') gamesMultiplier *= 1.3;
		const games = Math.floor(10000 * gamesMultiplier + random4 * 50000);
		
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
		const region = url.searchParams.get('region') || 'euw';
		const queue = url.searchParams.get('queue') || 'ranked_solo';
		const patch = url.searchParams.get('patch') || 'current';
		
		console.log('📊 Champions Meta Request:', { queue, patch, region, rank, role });
		
		// Generate champion stats with all filters
		const champions = generateChampionStats(rank, role, region, queue, patch);
		
		const cacheKey = `${queue}_${patch}_${region}_${rank}_${role}`;
		
		return new Response(JSON.stringify({
			success: true,
			queue,
			patch,
			region,
			rank,
			role,
			champions,
			count: champions.length,
			source: 'generated',
			cached: cache.has(cacheKey),
			note: 'Realistic simulated data. Stats vary by queue, patch, region, rank, and role.'
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
