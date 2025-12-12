/**
 * Champions Meta API
 * Returns snapshot champion stats from metaStats.js.
 *
 * IMPORTANT:
 * - The snapshot is a single dataset (e.g. Platinum+ global, single patch).
 * - We only apply the role filter server-side.
 * - Other filters (region/rank/queue/patch) are acknowledged but marked as ignored.
 */

import { getAllChampionStats } from '$lib/data/metaStats.js';

// Cache with 1 hour TTL (snapshot data; mostly to avoid repeated work)
const cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000;

// Snapshot metadata (what this dataset actually represents)
const SNAPSHOT = {
	patch: '14.23',
	rank: 'platinum_plus',
	region: 'world',
	queue: 'ranked_solo',
	source: 'metaStats.js'
};

// Role mapping (based on DDragon champion numeric keys)
const CHAMPION_ROLES = {
	top: [2, 23, 24, 266, 114, 86, 36, 41, 75, 420, 516, 85, 157, 203, 240, 27, 6, 58, 59, 126, 10, 82, 68, 72, 13, 54, 78, 92, 17, 50, 122, 56, 14, 98, 48, 44, 83, 77],
	jungle: [28, 11, 77, 5, 427, 64, 106, 20, 60, 121, 141, 245, 30, 113, 35, 154, 131, 234, 19, 76, 421, 203, 104, 120, 62, 79, 107, 80, 254, 59, 163, 102, 9, 72],
	mid: [1, 238, 103, 84, 166, 34, 45, 38, 105, 3, 74, 134, 43, 61, 69, 131, 90, 127, 142, 115, 268, 136, 163, 517, 101, 7, 157, 161, 4, 50, 112, 8, 143, 25, 55],
	adc: [22, 110, 51, 81, 119, 96, 222, 429, 145, 236, 21, 133, 18, 202, 498, 15, 523, 29, 42, 67, 221, 360, 126],
	support: [12, 53, 201, 40, 432, 555, 223, 111, 117, 25, 267, 89, 37, 412, 235, 16, 43, 526, 350, 147, 63, 101, 497, 143]
};

function getSnapshotChampions(role) {
	const cacheKey = `snapshot_${role || 'all'}`;
	const cached = cache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return cached.data;
	}

	const allStats = getAllChampionStats().filter((s) => s.championId && s.championId !== 0);
	let filtered = allStats;
	if (role && role !== 'all') {
		const roleIds = CHAMPION_ROLES[role] || [];
		filtered = allStats.filter((s) => roleIds.includes(s.championId));
	}

	filtered.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

	cache.set(cacheKey, { data: filtered, timestamp: Date.now() });
	return filtered;
}

function buildFilterMeta({ region, rank, role, queue, patch }) {
	const requested = { region, rank, role, queue, patch };
	const applied = { role };
	const ignored = [];

	if (region && region !== SNAPSHOT.region && region !== 'all') ignored.push('region');
	if (rank && rank !== SNAPSHOT.rank && rank !== 'all') ignored.push('rank');
	if (queue && queue !== SNAPSHOT.queue && queue !== 'all') ignored.push('queue');
	if (patch && patch !== SNAPSHOT.patch && patch !== 'current') ignored.push('patch');

	return {
		requested,
		applied,
		ignored,
		note:
			ignored.length > 0
				? `Using snapshot data (${SNAPSHOT.patch}, ${SNAPSHOT.rank}, ${SNAPSHOT.region}, ${SNAPSHOT.queue}). Only role filter is applied.`
				: `Using snapshot data (${SNAPSHOT.patch}, ${SNAPSHOT.rank}, ${SNAPSHOT.region}, ${SNAPSHOT.queue}).`
	};
}

/**
 * GET handler
 */
export async function GET({ url }) {
	try {
		const rank = url.searchParams.get('rank') || SNAPSHOT.rank;
		const role = url.searchParams.get('role') || 'all';
		const region = url.searchParams.get('region') || SNAPSHOT.region;
		const queue = url.searchParams.get('queue') || SNAPSHOT.queue;
		const patch = url.searchParams.get('patch') || 'current';

		const filterMeta = buildFilterMeta({ region, rank, role, queue, patch });
		console.log('📊 Champions Meta Request (snapshot):', filterMeta.requested);

		const champions = getSnapshotChampions(role);

		return new Response(JSON.stringify({
			success: true,
			champions,
			count: champions.length,
			source: SNAPSHOT.source,
			snapshot: SNAPSHOT,
			filters: filterMeta,
			lastUpdate: new Date().toISOString()
		}), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=3600'
			}
		});
		
	} catch (error) {
		console.error('❌ Champions Meta API Error:', error);
		
		return new Response(JSON.stringify({
			success: false,
			error: error.message,
			note: 'Failed to fetch snapshot data.'
		}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
}
