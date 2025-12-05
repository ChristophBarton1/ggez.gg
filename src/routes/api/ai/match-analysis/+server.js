import { json } from '@sveltejs/kit';
import { VITE_OPENAI_API_KEY } from '$env/static/private';

/**
 * AI Match Analysis Endpoint
 * Initial analysis of a single match with personalized coaching
 */
export async function POST({ request }) {
	try {
		const { match, participant, summonerPuuid } = await request.json();

		if (!match || !participant) {
			return json({ error: 'Missing match data' }, { status: 400 });
		}

		// Extract detailed match statistics
		const matchStats = extractMatchStats(match, participant);

		// Generate AI analysis using OpenAI GPT-4
		const analysis = await generateAIAnalysis(matchStats, match, participant);

		return json({
			success: true,
			analysis,
			stats: matchStats
		});

	} catch (error) {
		console.error('AI Analysis Error:', error);
		return json({ 
			error: 'Failed to analyze match',
			details: error.message 
		}, { status: 500 });
	}
}

/**
 * Extract comprehensive match statistics
 */
function extractMatchStats(match, participant) {
	const duration = match.info.gameDuration / 60; // minutes
	const win = participant.win;

	// Calculate per-minute stats
	const csPerMin = (participant.totalMinionsKilled + participant.neutralMinionsKilled) / duration;
	const goldPerMin = participant.goldEarned / duration;
	const damagePerMin = participant.totalDamageDealtToChampions / duration;
	const visionPerMin = participant.visionScore / duration;

	// Calculate KDA
	const kda = (participant.kills + participant.assists) / Math.max(participant.deaths, 1);

	// Team stats
	const team = match.info.participants.filter(p => p.teamId === participant.teamId);
	const teamKills = team.reduce((sum, p) => sum + p.kills, 0);
	const killParticipation = teamKills > 0 ? ((participant.kills + participant.assists) / teamKills * 100) : 0;

	// Analyze early vs late game
	const earlyDeaths = 0; // TODO: Implement timeline analysis if available
	
	// Build analysis
	const items = [
		participant.item0, participant.item1, participant.item2,
		participant.item3, participant.item4, participant.item5, participant.item6
	].filter(i => i !== 0);

	return {
		// Basic info
		champion: participant.championName,
		role: participant.teamPosition || participant.individualPosition,
		win,
		duration: Math.round(duration),
		gameMode: match.info.gameMode,

		// Performance
		kills: participant.kills,
		deaths: participant.deaths,
		assists: participant.assists,
		kda: kda.toFixed(2),
		killParticipation: killParticipation.toFixed(1),

		// Farm
		cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
		csPerMin: csPerMin.toFixed(1),
		neutralMinionsKilled: participant.neutralMinionsKilled,

		// Gold & Damage
		goldEarned: participant.goldEarned,
		goldPerMin: Math.round(goldPerMin),
		totalDamage: participant.totalDamageDealtToChampions,
		damagePerMin: Math.round(damagePerMin),
		damageShare: 0, // TODO: Calculate team damage share

		// Vision
		visionScore: participant.visionScore,
		visionPerMin: visionPerMin.toFixed(1),
		wardsPlaced: participant.wardsPlaced,
		wardsKilled: participant.wardsKilled,
		controlWardsPlaced: participant.detectorWardsPlaced,

		// Combat
		largestMultiKill: participant.largestMultiKill,
		largestKillingSpree: participant.largestKillingSpree,
		doubleKills: participant.doubleKills,
		tripleKills: participant.tripleKills,
		quadraKills: participant.quadraKills,
		pentaKills: participant.pentaKills,

		// Objectives
		dragonKills: participant.dragonKills || 0,
		baronKills: participant.baronKills || 0,
		turretKills: participant.turretKills || 0,

		// Build
		items: items,
		summoner1: participant.summoner1Id,
		summoner2: participant.summoner2Id,
		
		// Advanced
		totalTimeCCDealt: participant.totalTimeCCDealt,
		totalHeal: participant.totalHeal,
		damageSelfMitigated: participant.damageSelfMitigated
	};
}

/**
 * Generate AI analysis using OpenAI GPT-4
 */
async function generateAIAnalysis(stats, match, participant) {
	// For MVP: Use rule-based analysis
	// TODO: Replace with actual OpenAI API call

	const sections = [];

	// Win/Loss context
	const result = stats.win ? 'Victory' : 'Defeat';
	const resultEmoji = stats.win ? '🎉' : '💪';

	// Overall summary
	sections.push(`${resultEmoji} **Match Summary**\n`);
	sections.push(`You played **${stats.champion}** as ${stats.role} and achieved a **${result}** in ${stats.duration} minutes.\n`);
	sections.push(`Final KDA: **${stats.kills}/${stats.deaths}/${stats.assists}** (${stats.kda} KDA ratio)\n\n`);

	// Performance analysis
	sections.push(`📊 **Performance Analysis**\n\n`);

	// Strengths
	const strengths = [];
	if (parseFloat(stats.kda) >= 4.0) strengths.push(`Excellent KDA of ${stats.kda}! You dominated this game.`);
	if (parseFloat(stats.csPerMin) >= 7.0) strengths.push(`Outstanding farming with ${stats.csPerMin} CS/min!`);
	if (parseFloat(stats.visionPerMin) >= 2.0) strengths.push(`Great vision control (${stats.visionScore} vision score).`);
	if (parseFloat(stats.killParticipation) >= 70) strengths.push(`High kill participation (${stats.killParticipation}%) - you were everywhere!`);
	if (stats.pentaKills > 0) strengths.push(`🔥 PENTAKILL! That's legendary!`);
	else if (stats.quadraKills > 0) strengths.push(`Amazing Quadra Kill!`);
	else if (stats.tripleKills > 0) strengths.push(`Nice Triple Kill!`);

	if (strengths.length > 0) {
		sections.push(`**✅ What You Did Well:**\n`);
		strengths.forEach(s => sections.push(`• ${s}\n`));
		sections.push(`\n`);
	}

	// Areas for Improvement
	const improvements = [];
	if (stats.deaths >= 7) improvements.push(`Too many deaths (${stats.deaths}). Focus on positioning and map awareness.`);
	else if (stats.deaths >= 5) improvements.push(`Death count (${stats.deaths}) could be lower. Try to die less than 4 times per game.`);
	
	if (parseFloat(stats.csPerMin) < 5.5) improvements.push(`CS/min is ${stats.csPerMin}. Aim for 6-7+ CS/min for better gold income.`);
	if (parseFloat(stats.visionPerMin) < 1.2) improvements.push(`Low vision score (${stats.visionScore}). Buy more Control Wards and place wards strategically.`);
	if (stats.wardsKilled < 3) improvements.push(`Only ${stats.wardsKilled} wards cleared. Deny enemy vision more!`);
	if (parseFloat(stats.killParticipation) < 50) improvements.push(`Kill participation is ${stats.killParticipation}%. Try to be more involved in team fights.`);

	if (improvements.length > 0) {
		sections.push(`**📈 Areas to Improve:**\n`);
		improvements.forEach(i => sections.push(`• ${i}\n`));
		sections.push(`\n`);
	}

	// Champion-specific tips
	sections.push(`**💡 Pro Tips for ${stats.champion}:**\n`);
	sections.push(getChampionTips(stats.champion, stats));
	sections.push(`\n\n`);

	// Conclusion
	if (stats.win) {
		sections.push(`**🎯 Keep it up!** You played well in this match. Focus on consistency to climb higher!\n`);
	} else {
		sections.push(`**💪 Don't give up!** Every game is a learning opportunity. Review your mistakes and come back stronger!\n`);
	}

	sections.push(`\n*Want specific advice? Ask me about your build, key mistakes, or how pros play ${stats.champion}!*`);

	return sections.join('');
}

/**
 * Get champion-specific tips
 */
function getChampionTips(champion, stats) {
	// Generic tips for now
	// TODO: Add comprehensive champion-specific database
	
	const tips = [];

	// Role-based tips
	if (stats.role === 'JUNGLE') {
		tips.push(`• As a jungler, aim for **60+ CS and 70+ vision score** by 20 minutes.`);
		tips.push(`• Secure **2+ dragons** and contest Baron when ahead.`);
		tips.push(`• Gank lanes with CC or low mobility enemies.`);
	} else if (stats.role === 'SUPPORT') {
		tips.push(`• As support, prioritize **80+ vision score** over kills.`);
		tips.push(`• Always buy **2+ Control Wards** per back.`);
		tips.push(`• Roam mid after level 6 to create pressure.`);
	} else if (stats.role === 'TOP' || stats.role === 'MIDDLE') {
		tips.push(`• Aim for **8+ CS/min** in lane.`);
		tips.push(`• Ward at **1:25** to spot jungle invades.`);
		tips.push(`• Push wave before backing to deny CS.`);
	} else if (stats.role === 'BOTTOM') {
		tips.push(`• As ADC, prioritize **9+ CS/min** and **low deaths**.`);
		tips.push(`• Position in backline during teamfights.`);
		tips.push(`• Build Grievous Wounds against healing champs.`);
	}

	// Add champion-specific tip
	tips.push(`• *${champion}-specific tips coming soon!*`);

	return tips.join('\n');
}

// TODO: Implement actual OpenAI GPT-4 integration
/*
async function callOpenAI(stats, match, participant) {
	const apiKey = VITE_OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error('OpenAI API key not configured');
	}

	const prompt = `You are a professional League of Legends coach. Analyze this match and provide personalized, actionable advice.

Match Data:
${JSON.stringify(stats, null, 2)}

Provide:
1. What they did well (be specific!)
2. What needs improvement (constructive criticism)
3. 3-5 actionable tips for next game
4. Champion-specific advice for ${stats.champion}

Be encouraging, specific, and professional. Use emojis moderately.`;

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'gpt-4-turbo-preview',
			messages: [
				{
					role: 'system',
					content: 'You are an expert League of Legends coach with deep knowledge of all champions, roles, and strategies. You provide specific, actionable advice.'
				},
				{
					role: 'user',
					content: prompt
				}
			],
			temperature: 0.7,
			max_tokens: 800
		})
	});

	if (!response.ok) {
		throw new Error(`OpenAI API error: ${response.statusText}`);
	}

	const data = await response.json();
	return data.choices[0].message.content;
}
*/
