/**
 * 🤖 Server-side AI Recommendations API
 * Avoids CORS issues by calling OpenAI from server
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Common item IDs for reference
const ITEM_DATABASE = {
	// Mythics/Core Items
	'Trinity Force': 3078,
	'Divine Sunderer': 6632,
	'Kraken Slayer': 3124,
	'Galeforce': 6671,
	'Immortal Shieldbow': 6673,
	'Eclipse': 6692,
	'Duskblade of Draktharr': 6691,
	'Prowlers Claw': 6693,
	'Liandrys Anguish': 6653,
	'Ludens Tempest': 6655,
	'Everfrost': 6656,
	'Crown of the Shattered Queen': 4644,
	'Riftmaker': 4633,
	'Night Harvester': 4636,
	'Hextech Rocketbelt': 3152,
	'Sunfire Aegis': 3068,
	'Frostfire Gauntlet': 6662,
	'Turbo Chemtank': 6664,
	'Goredrinker': 6630,
	'Stridebreaker': 6631,
	'Jak\'Sho, The Protean': 6665,
	// Boots
	'Berserkers Greaves': 3006,
	'Plated Steelcaps': 3047,
	'Mercury Treads': 3111,
	'Sorcerers Shoes': 3020,
	'Ionian Boots of Lucidity': 3158,
	'Boots of Swiftness': 3009,
	// Legendary Items
	'Blade of the Ruined King': 3153,
	'Infinity Edge': 3031,
	'Bloodthirster': 3072,
	'Phantom Dancer': 3046,
	'Rapid Firecannon': 3094,
	'Mortal Reminder': 3033,
	'Lord Dominiks Regards': 3036,
	'Guardian Angel': 3026,
	'Deaths Dance': 6333,
	'Maw of Malmortius': 3156,
	'Black Cleaver': 3071,
	'Steraks Gage': 3053,
	'Titanic Hydra': 3748,
	'Ravenous Hydra': 3074,
	'Nashors Tooth': 3115,
	'Rabadons Deathcap': 3089,
	'Void Staff': 3135,
	'Zhonyas Hourglass': 3157,
	'Banshees Veil': 3102,
	'Cosmic Drive': 4629,
	'Shadowflame': 4645,
	'Horizon Focus': 4628,
	'Demonic Embrace': 4637,
	'Thornmail': 3075,
	'Randuins Omen': 3143,
	'Dead Mans Plate': 3742,
	'Force of Nature': 4401,
	'Spirit Visage': 3065,
	'Warmogs Armor': 3083,
	'Gargoyle Stoneplate': 3193,
	'Redemption': 3107,
	'Zekes Convergence': 3050,
	'Knights Vow': 3109,
	'Locket of the Iron Solari': 3190,
	'Shurelyas Battlesong': 2065,
	'Moonstone Renewer': 6617,
	'Imperial Mandate': 4005,
	// New Season Items
	'Stormsurge': 6657,
	'Cryptbloom': 3137,
	'Opportunity': 6701,
	'Voltaic Cyclosword': 6610,
	'Profane Hydra': 6698,
	'Hubris': 6697,
	'Axiom Arc': 6696,
	'Collector': 6676,
	'Essence Reaver': 3508,
	'Navori Quickblades': 6675,
	'Statikk Shiv': 3087,
	'Experimental Hexplate': 6695,
	'Terminus': 3302,
	'Sundered Sky': 6694,
	'Spear of Shojin': 6632,
	'Hullbreaker': 3181,
	'Overlords Bloodmail': 6621,
	'Heartsteel': 3084,
	'Hollow Radiance': 6664,
	'Unending Despair': 6667,
	'Kaenic Rookern': 6668,
	'Abyssal Mask': 8020,
	'Trailblazer': 6699,
	'Celestial Opposition': 6620,
	'Solstice Sleigh': 6619,
	'Dream Maker': 6618,
	'Staff of Flowing Water': 6616,
	'Ardent Censer': 3504,
	'Chemtech Putrifier': 3011,
	'Mikaels Blessing': 3222,
	'Echoes of Helia': 6617
};

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		const { gameData, summonerPuuid } = await request.json();

		const OPENAI_API_KEY = env.OPENAI_API_KEY;
		
		if (!OPENAI_API_KEY) {
			return json({
				success: false,
				error: 'OpenAI API key not configured',
				items: [],
				runes: null
			});
		}

		// Find player's participant
		const participant = gameData.participants.find(p => p.puuid === summonerPuuid);
		if (!participant) {
			throw new Error('Summoner not found in game');
		}

		// Build teams
		const yourTeam = gameData.participants.filter(p => p.teamId === participant.teamId);
		const enemyTeam = gameData.participants.filter(p => p.teamId !== participant.teamId);

		// Build context
		const context = buildGameContext(participant, yourTeam, enemyTeam, gameData);

		// Call OpenAI
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: `You are a League of Legends expert coach for Season 14. Analyze the live game and provide optimal item builds and runes.

CRITICAL: You MUST use EXACT item names from this list (Season 14 items):
- Boots: Berserkers Greaves (3006), Plated Steelcaps (3047), Mercury Treads (3111), Sorcerers Shoes (3020), Ionian Boots of Lucidity (3158)
- AD Items: Infinity Edge (3031), Bloodthirster (3072), Blade of the Ruined King (3153), Deaths Dance (6333), Black Cleaver (3071), Collector (6676), Lord Dominiks Regards (3036), Mortal Reminder (3033), Essence Reaver (3508), Navori Quickblades (6675), Phantom Dancer (3046), Rapid Firecannon (3094), Statikk Shiv (3087), Guardian Angel (3026), Maw of Malmortius (3156), Steraks Gage (3053), Spear of Shojin (6632), Hubris (6697), Opportunity (6701), Profane Hydra (6698), Voltaic Cyclosword (6610), Sundered Sky (6694), Experimental Hexplate (6695), Terminus (3302)
- AP Items: Rabadons Deathcap (3089), Void Staff (3135), Zhonyas Hourglass (3157), Banshees Veil (3102), Nashors Tooth (3115), Lich Bane (3100), Cosmic Drive (4629), Shadowflame (4645), Horizon Focus (4628), Stormsurge (6657), Cryptbloom (3137), Hextech Rocketbelt (3152), Ludens Companion (6655), Malignance (4636), Rod of Ages (3003), Seraphs Embrace (3040)
- Tank Items: Sunfire Aegis (3068), Thornmail (3075), Randuins Omen (3143), Dead Mans Plate (3742), Force of Nature (4401), Spirit Visage (3065), Warmogs Armor (3083), Gargoyle Stoneplate (3193), Jak Sho The Protean (6665), Heartsteel (3084), Hollow Radiance (6664), Unending Despair (6667), Kaenic Rookern (6668)
- Support Items: Redemption (3107), Zekes Convergence (3050), Knights Vow (3109), Locket of the Iron Solari (3190), Staff of Flowing Water (6616), Ardent Censer (3504), Mikaels Blessing (3222), Echoes of Helia (6617)

Respond ONLY with valid JSON in this exact format:
{
	"items": [
		{"id": 3031, "name": "Infinity Edge", "reason": "Core crit damage"},
		{"id": 3094, "name": "Rapid Firecannon", "reason": "Extended range for poke"},
		{"id": 3036, "name": "Lord Dominiks Regards", "reason": "Tank shred"},
		{"id": 3006, "name": "Berserkers Greaves", "reason": "Attack speed boots"},
		{"id": 3072, "name": "Bloodthirster", "reason": "Sustain and shield"}
	],
	"runes": {
		"primary": "Precision",
		"primaryRune": "Lethal Tempo",
		"secondary": "Domination",
		"reason": "Maximum DPS for ADC"
	}
}

IMPORTANT:
- Recommend exactly 5-6 items including boots
- Use the EXACT item names and IDs from the list above
- Match the champion's damage type (AD/AP/Tank/Support)
- Consider enemy team composition for defensive items`
					},
					{
						role: 'user',
						content: context
					}
				],
				temperature: 0.5,
				max_tokens: 1000
			})
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status}`);
		}

		const data = await response.json();
		let aiResponse = data.choices[0].message.content;
		
		// Clean up response - remove markdown code blocks if present
		aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

		// Parse JSON response
		const recommendations = JSON.parse(aiResponse);
		
		// Validate and fix item IDs
		const validatedItems = (recommendations.items || []).map(item => {
			// Try to find correct ID from our database
			const normalizedName = item.name.replace(/['']/g, "'").replace(/\s+/g, ' ').trim();
			const dbId = ITEM_DATABASE[normalizedName.replace(/\s/g, '')] || 
			             ITEM_DATABASE[normalizedName] ||
			             item.id;
			return {
				...item,
				id: dbId || item.id
			};
		});

		return json({
			success: true,
			items: validatedItems,
			runes: recommendations.runes || null
		});

	} catch (error) {
		console.error('❌ AI Recommendations error:', error);
		return json({
			success: false,
			error: error.message,
			items: [],
			runes: null
		});
	}
}

/**
 * Build context string for AI
 */
function buildGameContext(participant, yourTeam, enemyTeam, gameData) {
	const yourChampionName = getChampionNameFromId(participant.championId);
	const yourSummoners = getSummonerSpellNames(participant.spell1Id, participant.spell2Id);
	
	const yourTeamChamps = yourTeam.map(p => getChampionNameFromId(p.championId)).join(', ');
	const enemyTeamChamps = enemyTeam.map(p => getChampionNameFromId(p.championId)).join(', ');

	const gameLength = Math.floor((Date.now() - gameData.gameStartTime) / 1000 / 60);
	const gamePhase = gameLength < 10 ? 'Early Game' : gameLength < 25 ? 'Mid Game' : 'Late Game';

	return `
LIVE GAME ANALYSIS REQUEST:

YOU ARE PLAYING: ${yourChampionName}
Summoner Spells: ${yourSummoners}
Game Phase: ${gamePhase} (${gameLength} minutes)

YOUR TEAM COMPOSITION:
${yourTeamChamps}

ENEMY TEAM COMPOSITION:
${enemyTeamChamps}

IMPORTANT INSTRUCTIONS:
1. Recommend 3-5 optimal items for ${yourChampionName}
2. Recommend optimal runes (Primary + Secondary tree)
3. Match ${yourChampionName}'s damage type (AP/AD/Tank)

Respond with ONLY valid JSON (no markdown).
`.trim();
}

/**
 * Get champion name from ID
 */
function getChampionNameFromId(championId) {
	const championNames = {
		1: 'Annie', 2: 'Olaf', 3: 'Galio', 4: 'Twisted Fate', 5: 'Xin Zhao',
		11: 'Master Yi', 12: 'Alistar', 13: 'Ryze', 17: 'Teemo', 18: 'Tristana',
		21: 'Miss Fortune', 22: 'Ashe', 23: 'Tryndamere', 24: 'Jax', 25: 'Morgana',
		40: 'Janna', 51: 'Caitlyn', 64: 'Lee Sin', 67: 'Vayne', 81: 'Ezreal',
		86: 'Garen', 89: 'Leona', 91: 'Talon', 92: 'Riven', 99: 'Lux',
		103: 'Ahri', 104: 'Graves', 157: 'Yasuo', 202: 'Jhin', 222: 'Jinx',
		236: 'Lucian', 238: 'Zed', 412: 'Thresh', 498: 'Xayah', 777: 'Yone'
	};
	return championNames[championId] || `Champion ${championId}`;
}

/**
 * Get summoner spell names
 */
function getSummonerSpellNames(spell1Id, spell2Id) {
	const spellNames = {
		1: 'Cleanse', 3: 'Exhaust', 4: 'Flash', 6: 'Ghost', 7: 'Heal',
		11: 'Smite', 12: 'Teleport', 14: 'Ignite', 21: 'Barrier'
	};
	return `${spellNames[spell1Id] || spell1Id} + ${spellNames[spell2Id] || spell2Id}`;
}
