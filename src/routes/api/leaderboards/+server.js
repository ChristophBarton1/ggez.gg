import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const region = url.searchParams.get('region') || 'euw';
	const role = url.searchParams.get('role') || 'all';
	const timeframe = url.searchParams.get('timeframe') || '7d';

	try {
		// Mock leaderboard data for now
		// In production: fetch from Riot API or database of top players
		const mockPlayers = [];
		const ranks = ['Challenger', 'Grandmaster', 'Master'];
		const names = ['Faker', 'Caps', 'Jankos', 'Rekkles', 'Perkz', 'Hans Sama', 'Upset', 'Elyoya', 'Humanoid', 'Comp'];
		
		for (let i = 0; i < 50; i++) {
			const lpGain = Math.floor(Math.random() * 300) + 50;
			mockPlayers.push({
				rank: i + 1,
				summonerName: i < 10 ? names[i] : `Player${i + 1}`,
				tagLine: `${region.toUpperCase()}1`,
				tier: ranks[Math.floor(i / 20)] || 'Master',
				lp: 1200 - (i * 15),
				lpGain: lpGain,
				winRate: 55 + (Math.random() * 15),
				wins: Math.floor(100 + Math.random() * 400),
				losses: Math.floor(80 + Math.random() * 300),
				mainChampion: ['Yasuo', 'Zed', 'Akali', 'LeBlanc', 'Sylas'][Math.floor(Math.random() * 5)],
				profileIconId: 29 // Faker icon
			});
		}

		return json({
			success: true,
			players: mockPlayers,
			filters: { region, role, timeframe }
		});

	} catch (error) {
		console.error('Error in leaderboards API:', error);
		return json({
			success: false,
			error: error.message,
			players: []
		}, { status: 500 });
	}
}
