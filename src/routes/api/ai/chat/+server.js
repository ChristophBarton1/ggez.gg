import { json } from '@sveltejs/kit';
import { VITE_OPENAI_API_KEY } from '$env/static/private';

/**
 * AI Chat Endpoint
 * Handle follow-up questions about the match
 */
export async function POST({ request }) {
	try {
		const { messages, match, participant } = await request.json();

		if (!messages || messages.length === 0) {
			return json({ error: 'No messages provided' }, { status: 400 });
		}

		// Get the last user message
		const lastUserMessage = messages.filter(m => m.role === 'user').pop();
		if (!lastUserMessage) {
			return json({ error: 'No user message found' }, { status: 400 });
		}

		// Generate response based on the question
		const response = await generateChatResponse(lastUserMessage.content, match, participant, messages);

		return json({
			success: true,
			response
		});

	} catch (error) {
		console.error('AI Chat Error:', error);
		return json({ 
			error: 'Failed to generate response',
			details: error.message 
		}, { status: 500 });
	}
}

/**
 * Generate AI chat response
 */
async function generateChatResponse(userMessage, match, participant, conversationHistory) {
	// For MVP: Rule-based responses
	// TODO: Replace with OpenAI GPT-4 for natural conversations

	const message = userMessage.toLowerCase();

	// Build questions
	if (message.includes('build') || message.includes('item')) {
		return generateBuildAnalysis(participant);
	}

	// Mistake questions
	if (message.includes('mistake') || message.includes('wrong') || message.includes('bad')) {
		return generateMistakeAnalysis(participant, match);
	}

	// Pro tips
	if (message.includes('pro') || message.includes('tip') || message.includes('advice')) {
		return generateProTips(participant);
	}

	// Similar games
	if (message.includes('similar') || message.includes('pro player') || message.includes('compare')) {
		return `🔍 **Pro Player Comparison**\n\nI'm analyzing how professional players perform on ${participant.championName}...\n\n*This feature is coming soon! It will show:*\n• Similar games from Challenger/Pro players\n• Build comparisons\n• Playstyle differences\n• What they do differently\n\nFor now, check out:\n• op.gg/champions/${participant.championName}/statistics\n• u.gg/${participant.championName}/build`;
	}

	// Champion-specific questions
	if (message.includes('how to play') || message.includes('champion')) {
		return generateChampionGuide(participant);
	}

	// Rank questions
	if (message.includes('rank') || message.includes('climb') || message.includes('improve')) {
		return generateClimbingAdvice(participant, match);
	}

	// Generic helpful response
	return `I can help you with:\n\n💡 **"What were my biggest mistakes?"** - Detailed error analysis\n📊 **"Was my build optimal?"** - Item build review\n🎯 **"Give me pro tips"** - Champion-specific advice\n🔄 **"Show me similar pro games"** - Learn from the best\n⬆️ **"How can I climb faster?"** - Ranking strategies\n\nWhat would you like to know?`;
}

function generateBuildAnalysis(participant) {
	const items = [
		participant.item0, participant.item1, participant.item2,
		participant.item3, participant.item4, participant.item5, participant.item6
	].filter(i => i !== 0);

	const response = [];
	response.push(`📊 **Build Analysis for ${participant.championName}**\n\n`);
	response.push(`**Your Items:** ${items.length > 0 ? 'Item IDs: ' + items.join(', ') : 'No items'}\n\n`);
	
	// Generic build advice
	response.push(`**General Build Tips:**\n`);
	response.push(`• Build **Grievous Wounds** against healing (Morellonomicon, Thornmail, Chempunk Chainsword)\n`);
	response.push(`• Buy **Magic Resist** when enemy has 3+ AP champions\n`);
	response.push(`• Complete **Mythic item first** (usually best power spike)\n`);
	response.push(`• **Situational items** > Meta builds when needed\n\n`);

	response.push(`💡 **${participant.championName} Build Priority:**\n`);
	response.push(`1. Check current meta on u.gg or lolalytics\n`);
	response.push(`2. Adapt to enemy team comp\n`);
	response.push(`3. Consider your team's needs (tank, damage, utility)\n\n`);

	response.push(`*Detailed item-by-item analysis coming soon with full item names and recommendations!*`);

	return response.join('');
}

function generateMistakeAnalysis(participant, match) {
	const response = [];
	response.push(`🎯 **Key Mistakes Analysis**\n\n`);

	const mistakes = [];

	// Death analysis
	if (participant.deaths >= 7) {
		mistakes.push({
			severity: 'Critical',
			mistake: `Too Many Deaths (${participant.deaths})`,
			why: `Each death gives enemy gold AND removes you from the map for 20-60 seconds. That's missed CS, XP, and objectives.`,
			fix: `Before engaging, always ask: "Where is their team?" Use /mute all if teammates tilt you into bad fights.`
		});
	} else if (participant.deaths >= 5) {
		mistakes.push({
			severity: 'Medium',
			mistake: `Death Count Could Be Lower (${participant.deaths})`,
			why: `Pro players average 2-4 deaths per game. Each death is a mistake you can avoid.`,
			fix: `Review your deaths: Were you too aggressive? Out of position? Missing vision? Fix one pattern at a time.`
		});
	}

	// CS issues
	const duration = match.info.gameDuration / 60;
	const csPerMin = (participant.totalMinionsKilled + participant.neutralMinionsKilled) / duration;
	if (csPerMin < 5.5) {
		mistakes.push({
			severity: 'High',
			mistake: `Low CS/min (${csPerMin.toFixed(1)})`,
			why: `Every 15 CS = 1 kill in gold. You're leaving hundreds of gold on the map.`,
			fix: `Practice last-hitting in Practice Tool. Don't miss CS while poking. Catch side waves after laning phase.`
		});
	}

	// Vision
	if (participant.visionScore < duration * 1.5) {
		mistakes.push({
			severity: 'Medium',
			mistake: `Insufficient Vision (${participant.visionScore} score)`,
			why: `Vision wins games. You can't make good decisions without information.`,
			fix: `Buy 2 Control Wards EVERY back. Place wards before objectives. Clear enemy wards before Baron/Dragon.`
		});
	}

	// Kill Participation
	const team = match.info.participants.filter(p => p.teamId === participant.teamId);
	const teamKills = team.reduce((sum, p) => sum + p.kills, 0);
	const kp = teamKills > 0 ? ((participant.kills + participant.assists) / teamKills * 100) : 0;
	
	if (kp < 50) {
		mistakes.push({
			severity: 'Medium',
			mistake: `Low Kill Participation (${kp.toFixed(0)}%)`,
			why: `You're not involved in enough fights. Either you're farming while team fights, or positioning poorly.`,
			fix: `Watch minimap every 3 seconds. Ping when you can't join fights. Position better in teamfights to get assists.`
		});
	}

	// Output mistakes
	if (mistakes.length > 0) {
		mistakes.forEach(m => {
			response.push(`**${m.severity}: ${m.mistake}**\n`);
			response.push(`❓ Why it matters: ${m.why}\n`);
			response.push(`✅ How to fix: ${m.fix}\n\n`);
		});
	} else {
		response.push(`✅ No major mistakes detected! You played a clean game.\n\n`);
		response.push(`Small optimizations:\n`);
		response.push(`• Watch replays to spot minor positioning errors\n`);
		response.push(`• Track your CS at 10/20 mins (goal: 80/160+)\n`);
		response.push(`• Note your deaths and why they happened\n`);
	}

	return response.join('');
}

function generateProTips(participant) {
	const response = [];
	response.push(`🎯 **Pro Tips for ${participant.championName}**\n\n`);

	// Role-specific pro tips
	const role = participant.teamPosition || participant.individualPosition;
	
	response.push(`**${role} Role Mastery:**\n`);
	
	if (role === 'JUNGLE') {
		response.push(`• **Pathing**: Plan your route to end near next objective (Dragon/Herald)\n`);
		response.push(`• **Tracking**: Know enemy jungler position by their camps/ganks\n`);
		response.push(`• **Pressure**: Gank losing lanes less, winning lanes more (snowball!)\n`);
		response.push(`• **Vision**: Place wards at enemy jungle entrances before objectives\n\n`);
	} else if (role === 'SUPPORT') {
		response.push(`• **Roaming**: Leave ADC at 6-8 mins to impact mid/jungle\n`);
		response.push(`• **Vision**: Control Wards in pixel bush & river\n`);
		response.push(`• **Engage**: Don't force fights when your ADC is weak\n`);
		response.push(`• **Peel**: Know when to engage vs peel for carries\n\n`);
	} else if (role === 'MIDDLE') {
		response.push(`• **Wave**: Always push before roaming (deny CS & XP)\n`);
		response.push(`• **Roaming**: Ping 3x before roaming so team expects you\n`);
		response.push(`• **Priority**: Get lane prio to help jungle at Scuttle\n`);
		response.push(`• **Assassins**: If behind, farm and catch waves, don't force fights\n\n`);
	} else if (role === 'BOTTOM') {
		response.push(`• **Trading**: Auto attack after enemy uses spell (trade stance)\n`);
		response.push(`• **Positioning**: Stay in max range, kite back in teamfights\n`);
		response.push(`• **Farming**: Practice perfect CS, it's your #1 job\n`);
		response.push(`• **Scaling**: Play safe early, you outscale most champs\n\n`);
	} else if (role === 'TOP') {
		response.push(`• **Wave**: Freeze when ahead, push when behind (recall safety)\n`);
		response.push(`• **TP**: Save TP for drake fights (4v4/5v5 > 1 kill top)\n`);
		response.push(`• **Split**: When strong, split push and draw 2+ enemies\n`);
		response.push(`• **Tanks**: If tank, peel carries > engaging in teamfights\n\n`);
	}

	response.push(`**Universal Pro Tactics:**\n`);
	response.push(`• Die **3 times or less** per game = Challenger mindset\n`);
	response.push(`• **Watch minimap every 3 seconds** (set timer if needed)\n`);
	response.push(`• **Mute all** (/mute all) if you tilt from chat\n`);
	response.push(`• **Dodge** games with trolls in champ select (lose 3 LP > 20)\n`);
	response.push(`• **One-trick** 2-3 champions to climb faster\n\n`);

	response.push(`💡 Want champion-specific combos and tricks? Ask me: *"How do pros play ${participant.championName}?"*`);

	return response.join('');
}

function generateChampionGuide(participant) {
	const champ = participant.championName;
	return `📖 **How to Play ${champ}**\n\n` +
		`**Power Spikes:**\n` +
		`• Level 2-3 (skill combo unlocked)\n` +
		`• Level 6 (ultimate)\n` +
		`• First item completion\n` +
		`• Level 11 & 16 (ultimate upgrades)\n\n` +
		`**Win Condition:**\n` +
		`• Early Game: Farm safely, avoid deaths\n` +
		`• Mid Game: Rotate for objectives with team\n` +
		`• Late Game: Position perfectly in teamfights\n\n` +
		`**Common Mistakes:**\n` +
		`• Using ultimate at wrong time\n` +
		`• Overextending without vision\n` +
		`• Not respecting enemy power spikes\n\n` +
		`*Detailed ${champ} guide with combos & matchups coming soon!*\n\n` +
		`For now, check: **u.gg/${champ}** for builds & stats`;
}

function generateClimbingAdvice(participant, match) {
	const duration = match.info.gameDuration / 60;
	const csPerMin = (participant.totalMinionsKilled + participant.neutralMinionsKilled) / duration;

	return `⬆️ **How to Climb Faster**\n\n` +
		`**#1 Priority: Die Less**\n` +
		`Your deaths: ${participant.deaths}\n` +
		`Goal: 0-3 deaths per game\n` +
		`Each death = -300g for enemy, -20-60s off map for you\n\n` +
		`**#2 Priority: Farm Better**\n` +
		`Your CS/min: ${csPerMin.toFixed(1)}\n` +
		`Goal: 7+ CS/min\n` +
		`10 CS = 1 kill = faster items = more carry potential\n\n` +
		`**#3 Priority: One-Trick 2-3 Champs**\n` +
		`Master mechanics → Focus on macro\n` +
		`Learn matchups deeply\n` +
		`50+ games on one champ = muscle memory\n\n` +
		`**#4: Mental Game**\n` +
		`• /mute all every game (no exceptions)\n` +
		`• Take 10min break after loss\n` +
		`• Stop at 2 losses in a row\n` +
		`• Focus on YOUR play, not team\n\n` +
		`**Fastest Climb Formula:**\n` +
		`1. One-trick ${participant.championName}\n` +
		`2. Die max 3 times per game\n` +
		`3. Farm 7+ CS/min\n` +
		`4. Play 5 games/day, review 1 loss\n\n` +
		`Do this for 30 days = guaranteed climb! 💪`;
}

// TODO: Implement OpenAI GPT-4 for natural conversations
/*
async function callOpenAIChat(messages, match, participant) {
	const apiKey = VITE_OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error('OpenAI API key not configured');
	}

	// Prepare context about the match
	const matchContext = {
		champion: participant.championName,
		role: participant.teamPosition,
		result: participant.win ? 'Victory' : 'Defeat',
		kda: `${participant.kills}/${participant.deaths}/${participant.assists}`,
		duration: Math.round(match.info.gameDuration / 60),
		// ... more context
	};

	const systemMessage = {
		role: 'system',
		content: `You are an expert League of Legends coach. The player just played ${matchContext.champion} as ${matchContext.role} and got a ${matchContext.result}.
Their KDA was ${matchContext.kda} in a ${matchContext.duration} minute game.

Provide specific, actionable advice. Be encouraging and professional. Use emojis moderately.`
	};

	const chatMessages = [
		systemMessage,
		...messages.map(m => ({
			role: m.role === 'user' ? 'user' : 'assistant',
			content: m.content
		}))
	];

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'gpt-4-turbo-preview',
			messages: chatMessages,
			temperature: 0.7,
			max_tokens: 500
		})
	});

	if (!response.ok) {
		throw new Error(`OpenAI API error: ${response.statusText}`);
	}

	const data = await response.json();
	return data.choices[0].message.content;
}
*/
