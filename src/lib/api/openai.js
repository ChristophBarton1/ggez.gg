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
 * 📝 Build context string for AI with champion names
 */
function buildGameContext(participant, yourTeam, enemyTeam, gameData) {
	// Get champion name from summoner name or use ID as fallback
	const yourChampionName = getChampionNameFromId(participant.championId);
	const yourSummoners = getSummonerSpellNames(participant.spell1Id, participant.spell2Id);
	
	// Map teams to readable champion names
	const yourTeamChamps = yourTeam.map(p => getChampionNameFromId(p.championId)).join(', ');
	const enemyTeamChamps = enemyTeam.map(p => getChampionNameFromId(p.championId)).join(', ');

	// Game mode and time
	const gameMode = getGameModeName(gameData.gameQueueConfigId);
	const gameLength = Math.floor((Date.now() - gameData.gameStartTime) / 1000 / 60); // minutes
	const gamePhase = gameLength < 10 ? 'Early Game' : gameLength < 25 ? 'Mid Game' : 'Late Game';

	return `
LIVE GAME ANALYSIS REQUEST:

YOU ARE PLAYING: ${yourChampionName}
Summoner Spells: ${yourSummoners}
Game Mode: ${gameMode}
Game Phase: ${gamePhase} (${gameLength} minutes)

YOUR TEAM COMPOSITION:
${yourTeamChamps}

ENEMY TEAM COMPOSITION:
${enemyTeamChamps}

IMPORTANT INSTRUCTIONS:
1. Recommend 3-5 optimal items for ${yourChampionName} based on:
   - ${yourChampionName}'s PRIMARY damage type (AP/AD/Tank/Support)
   - Enemy team composition (tanks, burst, poke, etc.)
   - Current game phase (${gamePhase})
   - Core items for ${yourChampionName}'s playstyle

2. Recommend optimal runes:
   - Primary tree and keystone rune that fits ${yourChampionName}
   - Secondary tree
   - Explain why these runes work for this matchup

CRITICAL: Make sure items match ${yourChampionName}'s damage type!
- If ${yourChampionName} is AP: Recommend AP items (Luden's, Shadowflame, etc.)
- If ${yourChampionName} is AD: Recommend AD items (IE, BT, etc.)
- If ${yourChampionName} is Tank: Recommend Tank items (Sunfire, Thornmail, etc.)

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

/**
 * Get champion name from champion ID
 * Falls back to "Champion {id}" if not found
 */
function getChampionNameFromId(championId) {
	// Common champions mapping (add more as needed)
	const championNames = {
		1: 'Annie', 2: 'Olaf', 3: 'Galio', 4: 'Twisted Fate', 5: 'Xin Zhao',
		6: 'Urgot', 7: 'LeBlanc', 8: 'Vladimir', 9: 'Fiddlesticks', 10: 'Kayle',
		11: 'Master Yi', 12: 'Alistar', 13: 'Ryze', 14: 'Sion', 15: 'Sivir',
		16: 'Soraka', 17: 'Teemo', 18: 'Tristana', 19: 'Warwick', 20: 'Nunu',
		21: 'Miss Fortune', 22: 'Ashe', 23: 'Tryndamere', 24: 'Jax', 25: 'Morgana',
		26: 'Zilean', 27: 'Singed', 28: 'Evelynn', 29: 'Twitch', 30: 'Karthus',
		31: "Cho'Gath", 32: 'Amumu', 33: 'Rammus', 34: 'Anivia', 35: 'Shaco',
		36: 'Dr. Mundo', 37: 'Sona', 38: 'Kassadin', 39: 'Irelia', 40: 'Janna',
		41: 'Gangplank', 42: 'Corki', 43: 'Karma', 44: 'Taric', 45: 'Veigar',
		48: 'Trundle', 50: 'Swain', 51: 'Caitlyn', 53: 'Blitzcrank', 54: 'Malphite',
		55: 'Katarina', 56: 'Nocturne', 57: 'Maokai', 58: 'Renekton', 59: 'Jarvan IV',
		60: 'Elise', 61: 'Orianna', 62: 'Wukong', 63: 'Brand', 64: 'Lee Sin',
		67: 'Vayne', 68: 'Rumble', 69: 'Cassiopeia', 72: 'Skarner', 74: 'Heimerdinger',
		75: 'Nasus', 76: 'Nidalee', 77: 'Udyr', 78: 'Poppy', 79: 'Gragas',
		80: 'Pantheon', 81: 'Ezreal', 82: 'Mordekaiser', 83: 'Yorick', 84: 'Akali',
		85: 'Kennen', 86: 'Garen', 89: 'Leona', 90: 'Malzahar', 91: 'Talon',
		92: 'Riven', 96: "Kog'Maw", 98: 'Shen', 99: 'Lux', 101: 'Xerath',
		102: 'Shyvana', 103: 'Ahri', 104: 'Graves', 105: 'Fizz', 106: 'Volibear',
		107: 'Rengar', 110: 'Varus', 111: 'Nautilus', 112: 'Viktor', 113: 'Sejuani',
		114: 'Fiora', 115: 'Ziggs', 117: 'Lulu', 119: 'Draven', 120: 'Hecarim',
		121: "Kha'Zix", 122: 'Darius', 126: 'Jayce', 127: 'Lissandra', 131: 'Diana',
		133: 'Quinn', 134: 'Syndra', 136: 'Aurelion Sol', 141: 'Kayn', 142: 'Zoe',
		143: 'Zyra', 145: "Kai'Sa", 147: "Seraphine", 150: 'Gnar', 154: 'Zac',
		157: 'Yasuo', 161: "Vel'Koz", 163: 'Taliyah', 164: 'Camille', 166: 'Akshan',
		200: "Bel'Veth", 201: 'Braum', 202: 'Jhin', 203: 'Kindred', 221: 'Zeri',
		222: 'Jinx', 223: 'Tahm Kench', 234: 'Viego', 235: 'Senna', 236: 'Lucian',
		238: 'Zed', 240: 'Kled', 245: 'Ekko', 246: 'Qiyana', 254: 'Vi',
		266: 'Aatrox', 267: 'Nami', 268: 'Azir', 350: 'Yuumi', 360: 'Samira',
		412: 'Thresh', 420: 'Illaoi', 421: "Rek'Sai", 427: 'Ivern', 429: 'Kalista',
		432: 'Bard', 497: 'Rakan', 498: 'Xayah', 516: 'Ornn', 517: 'Sylas',
		518: 'Neeko', 523: 'Aphelios', 526: 'Rell', 555: 'Pyke', 711: "Vex",
		777: 'Yone', 875: "Sett", 876: "Lillia", 887: "Gwen", 888: "Renata Glasc",
		895: "Nilah", 897: "K'Sante", 901: "Smolder", 902: "Milio", 910: "Hwei",
		950: "Naafiri", 980: "Briar"
	};
	return championNames[championId] || `Champion ${championId}`;
}

/**
 * Get summoner spell names
 */
function getSummonerSpellNames(spell1Id, spell2Id) {
	const spellNames = {
		1: 'Cleanse', 3: 'Exhaust', 4: 'Flash', 6: 'Ghost', 7: 'Heal',
		11: 'Smite', 12: 'Teleport', 13: 'Clarity', 14: 'Ignite', 21: 'Barrier',
		32: 'Mark/Dash'
	};
	return `${spellNames[spell1Id] || spell1Id} + ${spellNames[spell2Id] || spell2Id}`;
}
