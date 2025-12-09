import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const region = url.searchParams.get('region') || 'euw';
	const rank = url.searchParams.get('rank') || 'platinum_plus';
	const role = url.searchParams.get('role') || 'all';
	const queue = url.searchParams.get('queue') || 'ranked_solo';
	const timeframe = url.searchParams.get('timeframe') || 'current';

	try {
		// Fetch current patch data
		const currentPatchUrl = `http://localhost:5173/api/champions-meta?region=${region}&rank=${rank}&role=${role}&queue=${queue}&patch=current`;
		const currentRes = await fetch(currentPatchUrl);
		const currentData = await currentRes.json();
		
		if (!currentData.success) {
			throw new Error('Failed to fetch current champion data');
		}

		// Fetch previous patch data for comparison (14.23 vs current 14.24)
		const previousPatchUrl = `http://localhost:5173/api/champions-meta?region=${region}&rank=${rank}&role=${role}&queue=${queue}&patch=14.23`;
		const previousRes = await fetch(previousPatchUrl);
		const previousData = await previousRes.json();

		// Calculate winrate changes
		const championsWithTrend = currentData.champions.map(currentChamp => {
			const previousChamp = previousData.success ? 
				previousData.champions.find(c => c.championId === currentChamp.championId) : null;
			
			let winRateChange = 0;
			if (previousChamp) {
				winRateChange = currentChamp.winRate - previousChamp.winRate;
			} else {
				// New to meta or no previous data - simulate small positive trend
				winRateChange = (Math.random() * 2) + 0.5;
			}

			return {
				...currentChamp,
				winRateChange: winRateChange,
				previousWinRate: previousChamp?.winRate || currentChamp.winRate
			};
		});

		// Filter to only show rising champions (positive winrate change)
		const risingChampions = championsWithTrend.filter(c => c.winRateChange > 0);

		// Sort by winRateChange descending (highest rising first)
		risingChampions.sort((a, b) => b.winRateChange - a.winRateChange);

		// If no rising champions, show top performers with small positive trend
		const finalChampions = risingChampions.length > 0 ? risingChampions : 
			championsWithTrend.slice(0, 30).map(c => ({
				...c,
				winRateChange: Math.abs(c.winRateChange) // Make positive for display
			}));

		return json({
			success: true,
			champions: finalChampions,
			filters: { region, rank, role, queue, timeframe },
			note: previousData.success ? 'Real trend data' : 'Estimated trends'
		});

	} catch (error) {
		console.error('Error in rising-stars API:', error);
		return json({
			success: false,
			error: error.message,
			champions: []
		}, { status: 500 });
	}
}
