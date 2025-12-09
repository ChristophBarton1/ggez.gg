import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const regionsParam = url.searchParams.get('regions');
	const regions = regionsParam ? regionsParam.split(',') : ['euw', 'kr'];
	const rank = url.searchParams.get('rank') || 'platinum_plus';
	const role = url.searchParams.get('role') || 'all';
	const queue = url.searchParams.get('queue') || 'ranked_solo';
	const patch = url.searchParams.get('patch') || 'current';

	try {
		// Fetch data for each region in parallel
		const regionPromises = regions.map(region =>
			fetch(`http://localhost:5173/api/champions-meta?region=${region}&rank=${rank}&role=${role}&queue=${queue}&patch=${patch}`)
				.then(res => res.json())
				.then(data => ({ region, data: data.success ? data.champions : [] }))
				.catch(() => ({ region, data: [] }))
		);

		const regionResults = await Promise.all(regionPromises);
		
		// Build regionData object
		const regionData = {};
		regionResults.forEach(({ region, data }) => {
			regionData[region] = data;
		});

		// Find differences between regions
		const differences = [];
		
		if (regions.length >= 2) {
			const region1 = regions[0];
			const region2 = regions[1];
			
			const champs1 = regionData[region1] || [];
			const champs2 = regionData[region2] || [];
			
			// Create a map for faster lookup
			const champs2Map = new Map(champs2.map(c => [c.championId, c]));
			
			// Find champions with significant differences
			champs1.forEach(champ1 => {
				const champ2 = champs2Map.get(champ1.championId);
				
				if (champ2) {
					const wrDiff = champ1.winRate - champ2.winRate;
					const prDiff = champ1.pickRate - champ2.pickRate;
					const brDiff = champ1.banRate - champ2.banRate;
					
					// Show if winrate diff > 1.5% OR pickrate diff > 3% OR banrate diff > 3%
					if (Math.abs(wrDiff) > 1.5 || Math.abs(prDiff) > 3 || Math.abs(brDiff) > 3) {
						differences.push({
							championId: champ1.championId,
							tier: champ1.tier,
							name: champ1.name || 'Unknown',
							[region1]: {
								winRate: champ1.winRate,
								pickRate: champ1.pickRate,
								banRate: champ1.banRate,
								games: champ1.games,
								tier: champ1.tier
							},
							[region2]: {
								winRate: champ2.winRate,
								pickRate: champ2.pickRate,
								banRate: champ2.banRate,
								games: champ2.games,
								tier: champ2.tier
							},
							winRateDiff: wrDiff,
							pickRateDiff: prDiff,
							banRateDiff: brDiff,
							totalDiff: Math.abs(wrDiff) + Math.abs(prDiff) + Math.abs(brDiff)
						});
					}
				}
			});
			
			// Sort by total difference (combination of all metrics)
			differences.sort((a, b) => b.totalDiff - a.totalDiff);
		}

		return json({
			success: true,
			regionData,
			differences: differences.slice(0, 30), // Top 30 differences
			filters: { regions, rank, role, queue, patch },
			comparisonRegions: regions.length >= 2 ? [regions[0], regions[1]] : []
		});

	} catch (error) {
		console.error('Error in regional-meta API:', error);
		return json({
			success: false,
			error: error.message,
			regionData: {},
			differences: []
		}, { status: 500 });
	}
}
