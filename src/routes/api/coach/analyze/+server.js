import { json } from '@sveltejs/kit';
import { VITE_OPENAI_API_KEY } from '$env/static/private';

/**
 * AI Coach Analysis Endpoint
 * Analyzes player's recent matches and provides personalized coaching
 */
export async function POST({ request }) {
	try {
		const { matches, summonerInfo } = await request.json();

		if (!matches || matches.length === 0) {
			return json({ error: 'No matches provided' }, { status: 400 });
		}

		// Extract key statistics from matches
		const stats = analyzeMatches(matches, summonerInfo);

		// Generate AI coaching insights
		const coaching = await generateCoaching(stats, summonerInfo);

		return json({
			success: true,
			analysis: {
				stats,
				coaching,
				timestamp: new Date().toISOString()
			}
		});

	} catch (error) {
		console.error('AI Coach Error:', error);
		return json({ 
			error: 'Failed to generate coaching insights',
			details: error.message 
		}, { status: 500 });
	}
}

/**
 * Analyze match data to extract key patterns
 */
function analyzeMatches(matches, summonerInfo) {
	const playerStats = {
		totalGames: matches.length,
		wins: 0,
		losses: 0,
		kills: [],
		deaths: [],
		assists: [],
		cs: [],
		visionScore: [],
		gameDuration: [],
		goldPerMinute: [],
		damagePerMinute: [],
		earlyDeaths: 0, // Deaths before 10min
		lateGamePerformance: { wins: 0, games: 0 },
		championPool: {},
		rolePerformance: {}
	};

	matches.forEach(match => {
		const participant = match.info.participants.find(
			p => p.puuid === summonerInfo.puuid
		);

		if (!participant) return;

		// Basic stats
		const win = participant.win;
		playerStats.wins += win ? 1 : 0;
		playerStats.losses += win ? 0 : 1;

		playerStats.kills.push(participant.kills);
		playerStats.deaths.push(participant.deaths);
		playerStats.assists.push(participant.assists);
		playerStats.cs.push(participant.totalMinionsKilled + participant.neutralMinionsKilled);
		playerStats.visionScore.push(participant.visionScore);

		const duration = match.info.gameDuration / 60; // in minutes
		playerStats.gameDuration.push(duration);
		playerStats.goldPerMinute.push(participant.goldEarned / duration);
		playerStats.damagePerMinute.push(participant.totalDamageDealtToChampions / duration);

		// Champion pool
		const champ = participant.championName;
		if (!playerStats.championPool[champ]) {
			playerStats.championPool[champ] = { games: 0, wins: 0 };
		}
		playerStats.championPool[champ].games++;
		if (win) playerStats.championPool[champ].wins++;

		// Late game performance (games over 30min)
		if (duration > 30) {
			playerStats.lateGamePerformance.games++;
			if (win) playerStats.lateGamePerformance.wins++;
		}

		// Role performance
		const role = participant.teamPosition || 'UNKNOWN';
		if (!playerStats.rolePerformance[role]) {
			playerStats.rolePerformance[role] = { games: 0, wins: 0 };
		}
		playerStats.rolePerformance[role].games++;
		if (win) playerStats.rolePerformance[role].wins++;
	});

	// Calculate averages
	const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

	return {
		winRate: (playerStats.wins / playerStats.totalGames * 100).toFixed(1),
		totalGames: playerStats.totalGames,
		wins: playerStats.wins,
		losses: playerStats.losses,
		avgKills: avg(playerStats.kills).toFixed(1),
		avgDeaths: avg(playerStats.deaths).toFixed(1),
		avgAssists: avg(playerStats.assists).toFixed(1),
		kda: ((avg(playerStats.kills) + avg(playerStats.assists)) / Math.max(avg(playerStats.deaths), 1)).toFixed(2),
		avgCS: avg(playerStats.cs).toFixed(0),
		avgVisionScore: avg(playerStats.visionScore).toFixed(1),
		avgGameDuration: avg(playerStats.gameDuration).toFixed(1),
		avgGoldPerMin: avg(playerStats.goldPerMinute).toFixed(0),
		avgDamagePerMin: avg(playerStats.damagePerMinute).toFixed(0),
		lateGameWinRate: playerStats.lateGamePerformance.games > 0 
			? (playerStats.lateGamePerformance.wins / playerStats.lateGamePerformance.games * 100).toFixed(1)
			: 0,
		championPool: playerStats.championPool,
		rolePerformance: playerStats.rolePerformance
	};
}

/**
 * Generate AI coaching insights using OpenAI GPT-4
 */
async function generateCoaching(stats, summonerInfo) {
	// For MVP: Simple rule-based coaching
	// Later: Replace with OpenAI API for advanced AI insights
	
	const insights = [];

	// Death analysis
	if (parseFloat(stats.avgDeaths) > 6) {
		insights.push({
			category: 'Survival',
			severity: 'high',
			title: 'Too Many Deaths',
			description: `You're dying ${stats.avgDeaths} times per game. Focus on positioning and map awareness.`,
			tip: 'Before engaging, ask yourself: "Where is their team?" Play safer when you don\'t have vision.',
			impact: 'Reducing deaths by 2 per game can increase your winrate by 10-15%!'
		});
	}

	// Vision score
	if (parseFloat(stats.avgVisionScore) < 20) {
		insights.push({
			category: 'Vision',
			severity: 'medium',
			title: 'Low Vision Score',
			description: `Your vision score (${stats.avgVisionScore}) is below average.`,
			tip: 'Buy more Control Wards and place wards in key locations: Dragon pit, Baron pit, river brushes.',
			impact: 'Better vision = Better decisions = More wins!'
		});
	}

	// CS analysis
	const csPerMin = parseFloat(stats.avgCS) / parseFloat(stats.avgGameDuration);
	if (csPerMin < 5.5) {
		insights.push({
			category: 'Farming',
			severity: 'medium',
			title: 'CS Could Be Better',
			description: `You're averaging ${csPerMin.toFixed(1)} CS/min. Aim for 6-7 CS/min.`,
			tip: 'Practice last-hitting in Practice Tool. Every 15 CS = 1 kill in gold!',
			impact: 'Improving CS by 20% gives you significant gold advantage.'
		});
	}

	// Late game performance
	if (stats.lateGameWinRate < stats.winRate - 10) {
		insights.push({
			category: 'Late Game',
			severity: 'medium',
			title: 'Weak Late Game',
			description: `Your late game winrate (${stats.lateGameWinRate}%) is lower than your overall winrate.`,
			tip: 'Focus on objectives in late game. One Baron = Win. Don\'t throw by getting caught!',
			impact: 'Better late game decisions can win you games you\'re ahead in.'
		});
	}

	// Champion pool analysis
	const bestChamp = Object.entries(stats.championPool)
		.filter(([_, data]) => data.games >= 3)
		.sort((a, b) => (b[1].wins / b[1].games) - (a[1].wins / a[1].games))[0];

	if (bestChamp) {
		const [champName, champData] = bestChamp;
		const champWR = (champData.wins / champData.games * 100).toFixed(1);
		
		if (champWR > parseFloat(stats.winRate) + 10) {
			insights.push({
				category: 'Champion Pool',
				severity: 'low',
				title: `${champName} Is Your Best Pick!`,
				description: `You have ${champWR}% winrate on ${champName} (${champData.games} games).`,
				tip: `One-trick ${champName} to climb faster! You clearly understand this champion.`,
				impact: 'Playing your best champions more often = Faster climbing!'
			});
		}
	}

	// Overall performance summary
	const summary = {
		overall: parseFloat(stats.winRate) >= 55 ? 'Excellent' : 
		         parseFloat(stats.winRate) >= 50 ? 'Good' : 
		         parseFloat(stats.winRate) >= 45 ? 'Needs Improvement' : 'Focus Required',
		strengths: [],
		improvements: []
	};

	// Identify strengths
	if (parseFloat(stats.avgDeaths) < 4) summary.strengths.push('Great survival instinct');
	if (parseFloat(stats.avgVisionScore) > 30) summary.strengths.push('Excellent vision control');
	if (csPerMin > 6.5) summary.strengths.push('Strong farming');
	if (parseFloat(stats.lateGameWinRate) > 60) summary.strengths.push('Late game master');

	// Identify improvements
	if (parseFloat(stats.avgDeaths) > 6) summary.improvements.push('Reduce deaths');
	if (parseFloat(stats.avgVisionScore) < 20) summary.improvements.push('Improve vision score');
	if (csPerMin < 5.5) summary.improvements.push('Farm more efficiently');

	return {
		insights,
		summary,
		stats
	};
}

// TODO: Integrate OpenAI for advanced AI insights
/*
async function generateAICoaching(stats, summonerInfo) {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${VITE_OPENAI_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'gpt-4',
			messages: [
				{
					role: 'system',
					content: 'You are a professional League of Legends coach. Analyze player statistics and provide actionable, specific coaching advice.'
				},
				{
					role: 'user',
					content: `Analyze this player's performance and provide coaching:\n${JSON.stringify(stats, null, 2)}`
				}
			],
			temperature: 0.7,
			max_tokens: 500
		})
	});

	const data = await response.json();
	return data.choices[0].message.content;
}
*/
