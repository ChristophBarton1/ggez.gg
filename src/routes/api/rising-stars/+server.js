import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const region = url.searchParams.get('region') || 'euw';
	const rank = url.searchParams.get('rank') || 'platinum_plus';
	const role = url.searchParams.get('role') || 'all';
	const queue = url.searchParams.get('queue') || 'ranked_solo';
	const timeframe = url.searchParams.get('timeframe') || 'current';

	try {
		// For now, we'll reuse champions-meta API and add fake winRateChange data
		// In production, you'd calculate actual trends from historical data
		const response = await fetch(`http://localhost:5173/api/champions-meta?region=${region}&rank=${rank}&role=${role}&queue=${queue}&patch=${timeframe}`);
		const data = await response.json();
		
		if (!data.success) {
			throw new Error('Failed to fetch champion data');
		}

		// Add fake winRateChange for now (in production: compare with previous week/patch)
		const championsWithTrend = data.champions.map(champ => ({
			...champ,
			// Simulate rising champions with positive winrate changes
			winRateChange: (Math.random() * 4) + 0.5  // Random between +0.5% and +4.5%
		}));

		// Sort by winRateChange descending (highest rising first)
		championsWithTrend.sort((a, b) => b.winRateChange - a.winRateChange);

		return json({
			success: true,
			champions: championsWithTrend,
			filters: { region, rank, role, queue, timeframe }
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
