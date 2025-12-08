/**
 * 🤖 OpenAI API Integration
 * For AI-powered item and runes recommendations
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
	console.error('⚠️ OPENAI API KEY NOT CONFIGURED!');
	console.error('Add to .env: VITE_OPENAI_API_KEY=sk-your-key-here');
}

/**
 * 🎯 GET AI RECOMMENDATIONS for Live Game
 * @param {Object} gameData - Live game data from Riot API
 * @param {string} summonerPuuid - Your PUUID
 * @returns {Promise<Object>} - Items and Runes recommendations
 */
export async function getAIRecommendations(gameData, summonerPuuid) {
	if (!OPENAI_API_KEY) {
		return {
			error: 'OpenAI API key not configured',
			items: [],
			runes: null
		};
	}

	try {
		// Find your participant in the game
		const participant = gameData.participants.find(p => p.puuid === summonerPuuid);
		if (!participant) {
			throw new Error('Summoner not found in game');
		}

		// Find your team and enemy team
		const yourTeam = gameData.participants.filter(p => p.teamId === participant.teamId);
		const enemyTeam = gameData.participants.filter(p => p.teamId !== participant.teamId);

		// Build context for AI
		const context = buildGameContext(participant, yourTeam, enemyTeam, gameData);

		// Call OpenAI API
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini', // Faster + cheaper!
				messages: [
					{
						role: 'system',
						content: `You are a League of Legends expert coach. Analyze the live game and provide optimal item builds and runes.
						
						IMPORTANT: Respond ONLY with valid JSON in this exact format:
						{
							"items": [
								{"id": 3078, "name": "Trinity Force", "reason": "Great for split-pushing"},
								{"id": 3742, "name": "Dead Man's Plate", "reason": "Movement speed for roaming"}
							],
							"runes": {
								"primary": "Precision",
								"primaryRune": "Conqueror",
								"secondary": "Resolve",
								"reason": "Sustained damage in teamfights"
							}
						}`
					},
					{
						role: 'user',
						content: context
					}
				],
				temperature: 0.7,
				max_tokens: 1000
			})
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status}`);
		}

		const data = await response.json();
		const aiResponse = data.choices[0].message.content;

		console.log('🤖 AI Response:', aiResponse);

		// Parse JSON response
		const recommendations = JSON.parse(aiResponse);

		return {
			items: recommendations.items || [],
			runes: recommendations.runes || null,
			rawResponse: aiResponse
		};

	} catch (error) {
		console.error('❌ AI Recommendations error:', error);
		return {
			error: error.message,
			items: [],
			runes: null
		};
	}
}

/**
 * 📝 Build context string for AI
 */
function buildGameContext(participant, yourTeam, enemyTeam, gameData) {
	const yourChampion = participant.championId;
	const yourSummoners = `${participant.spell1Id}, ${participant.spell2Id}`;
	
	const yourTeamChamps = yourTeam.map(p => `${p.championId}`).join(', ');
	const enemyTeamChamps = enemyTeam.map(p => `${p.championId}`).join(', ');

	// Game mode
	const gameMode = getGameModeName(gameData.gameQueueConfigId);
	const gameLength = Math.floor((Date.now() - gameData.gameStartTime) / 1000 / 60); // minutes

	return `
	LIVE GAME ANALYSIS REQUEST:
	
	Your Champion: ${yourChampion}
	Your Summoner Spells: ${yourSummoners}
	Game Mode: ${gameMode}
	Game Time: ${gameLength} minutes
	
	YOUR TEAM:
	${yourTeamChamps}
	
	ENEMY TEAM:
	${enemyTeamChamps}
	
	TASK:
	1. Recommend 3-5 optimal items to buy next based on:
	   - Enemy team composition (tanks, assassins, etc.)
	   - Current game state (ahead/behind)
	   - Your champion's role and scaling
	
	2. Recommend the best runes setup:
	   - Primary tree and keystone
	   - Secondary tree
	   - Brief explanation why
	
	Respond with ONLY valid JSON (no markdown, no extra text).
	`.trim();
}

/**
 * Get human-readable game mode name
 */
function getGameModeName(queueId) {
	const queueNames = {
		420: 'Ranked Solo/Duo',
		440: 'Ranked Flex',
		400: 'Normal Draft',
		430: 'Normal Blind',
		450: 'ARAM',
		700: 'Clash',
		900: 'URF'
	};
	return queueNames[queueId] || 'Custom Game';
}
