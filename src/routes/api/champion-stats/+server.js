/**
 * Champion Stats API
 * Returns trending champion statistics
 * Data sources: Community aggregated stats
 */

// For now, we'll use a curated list that updates periodically
// In production, this would fetch from a stats API like u.gg, op.gg, or lolalytics
// or maintain our own database of aggregated match stats

// Cache duration: 30 minutes
let statsCache = null;
let lastFetch = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get champion statistics
 * TODO: In production, fetch from real stats API
 * For now, returns curated data that should be updated regularly
 */
function getChampionStats() {
	// Check cache
	const now = Date.now();
	if (statsCache && (now - lastFetch) < CACHE_DURATION) {
		return statsCache;
	}

	// Real data would come from API here
	// For now, return current patch meta champions (manually curated)
	// TODO: Implement actual API fetching from lolalytics, u.gg, or op.gg
	
	const stats = {
		highestWinrate: {
			championName: 'Amumu',
			championId: 'Amumu',
			winrate: 53.8,
			tier: 'S',
			trend: 'up'
		},
		mostPicked: {
			championName: 'Lee Sin',
			championId: 'LeeSin',
			pickrate: 28.4,
			tier: 'A',
			trend: 'stable'
		},
		trending: {
			championName: 'Briar',
			championId: 'Briar',
			banrate: 42.1,
			tier: 'S+',
			trend: 'up'
		}
	};

	// Update cache
	statsCache = stats;
	lastFetch = now;

	return stats;
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	try {
		const stats = getChampionStats();

		return new Response(JSON.stringify(stats), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=1800' // 30 minutes
			}
		});
	} catch (error) {
		console.error('Champion Stats Error:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch champion stats' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
