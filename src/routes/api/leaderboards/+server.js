import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	const region = url.searchParams.get('region') || 'euw';
	const role = url.searchParams.get('role') || 'all';
	const timeframe = url.searchParams.get('timeframe') || '7d';

	try {
		// Mock leaderboard data
		const mockPlayers = [];
		const ranks = ['Challenger', 'Grandmaster', 'Master'];
		const flexRanks = ['Challenger', 'Grandmaster', 'Master', 'Diamond', 'Unranked'];
		const names = ['Faker', 'Caps', 'Jankos', 'Rekkles', 'Perkz', 'Hans Sama', 'Upset', 'Elyoya', 'Humanoid', 'Comp'];
		const champPool = ['157', '238', '84', '7', '64', '105', '112', '23', '92', '55', '131', '145', '10', '81'];
		
		for (let i = 0; i < 50; i++) {
			const lpGain = Math.floor(Math.random() * 300) + 50;
			const randomChamps = [...champPool].sort(() => 0.5 - Math.random()).slice(0, 5);
			
			mockPlayers.push({
				rank: i + 1,
				summonerName: i < 10 ? names[i] : `Player${i + 1}`,
				tagLine: `${region.toUpperCase()}1`,
				tier: ranks[Math.floor(i / 20)] || 'Master',
				lp: 1200 - (i * 15),
				flexTier: flexRanks[Math.floor(Math.random() * flexRanks.length)],
				flexLP: Math.floor(Math.random() * 1000),
				lpGain: lpGain,
				winRate: 55 + (Math.random() * 15),
				wins: Math.floor(100 + Math.random() * 400),
				losses: Math.floor(80 + Math.random() * 300),
				mainChampion: randomChamps[0],
				topChampions: randomChamps,
				profileIconId: 29
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
