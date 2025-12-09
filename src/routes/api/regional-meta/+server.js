import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const regions = url.searchParams.get('regions')?.split(',') || ['euw', 'kr'];
	const rank = url.searchParams.get('rank') || 'platinum_plus';
	const role = url.searchParams.get('role') || 'all';
	const queue = url.searchParams.get('queue') || 'ranked_solo';
	const patch = url.searchParams.get('patch') || 'current';

	try {
		// Fetch data for each region
		const regionData = {};
		
		for (const region of regions) {
			const response = await fetch(`http://localhost:5173/api/champions-meta?region=${region}&rank=${rank}&role=${role}&queue=${queue}&patch=${patch}`);
			const data = await response.json();
			
			if (data.success) {
				regionData[region] = data.champions;
			}
		}

		// Find differences between regions
		const differences = [];
		if (regions.length >= 2) {
			const region1 = regions[0];
			const region2 = regions[1];
			
			const champs1 = regionData[region1] || [];
			const champs2 = regionData[region2] || [];
			
			// Find champions with biggest winrate differences
			champs1.forEach(champ1 => {
				const champ2 = champs2.find(c => c.championId === champ1.championId);
				if (champ2) {
					const wrDiff = Math.abs(champ1.winRate - champ2.winRate);
					const prDiff = Math.abs(champ1.pickRate - champ2.pickRate);
					
					if (wrDiff > 2 || prDiff > 5) {
						differences.push({
							championId: champ1.championId,
							[region1]: {
								winRate: champ1.winRate,
								pickRate: champ1.pickRate,
								banRate: champ1.banRate
							},
							[region2]: {
								winRate: champ2.winRate,
								pickRate: champ2.pickRate,
								banRate: champ2.banRate
							},
							winRateDiff: champ1.winRate - champ2.winRate,
							pickRateDiff: champ1.pickRate - champ2.pickRate
						});
					}
				}
			});
			
			// Sort by biggest differences
			differences.sort((a, b) => Math.abs(b.winRateDiff) - Math.abs(a.winRateDiff));
		}

		return json({
			success: true,
			regionData,
			differences: differences.slice(0, 20),
			filters: { regions, rank, role, queue, patch }
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
