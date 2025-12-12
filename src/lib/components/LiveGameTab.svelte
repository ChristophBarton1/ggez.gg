<script>
	import { onMount, onDestroy } from 'svelte';
	import { getLiveGame } from '$lib/api/riot.js';
	import { getItemIcon, optimizeRiotImage } from '$lib/utils/imageProxy.js';
	import { getChampionIcon, getProfileIcon, getSummonerSpellIcon, getRankEmblem } from '$lib/utils/imageOptimizer.js';

	export let summoner; // Summoner object with id, puuid, region
	export let isInLiveGame = false; // Export to parent to show live indicator
	
	let loading = true;
	let liveGame = null;
	let aiRecommendations = null;
	let error = null;
	let loadingAI = false;
	let playerStats = {}; // Store ranked stats for each player
	let loadingStats = false;

	// Spell ID to Name mapping
	const SPELL_MAP = {
		1: 'SummonerBoost',
		3: 'SummonerExhaust',
		4: 'SummonerFlash',
		6: 'SummonerHaste',
		7: 'SummonerHeal',
		11: 'SummonerSmite',
		12: 'SummonerTeleport',
		13: 'SummonerMana',
		14: 'SummonerDot', // Ignite
		21: 'SummonerBarrier',
		30: 'SummonerPoroRecall',
		31: 'SummonerPoroThrow',
		32: 'SummonerSnowball',
		39: 'SummonerSnowURFSnowball_Mark'
	};

	function getSpellName(spellId) {
		return SPELL_MAP[spellId] || SPELL_MAP[Number(spellId)] || 'SummonerFlash';
	}

	onMount(async () => {
		await checkLiveGame();
	});

	async function checkLiveGame() {
		loading = true;
		error = null;

		try {
			console.log('🎮 Full summoner object:', summoner);
			console.log('🎮 summoner.puuid:', summoner.puuid);
			
			// Spectator API v5 uses PUUID, not Summoner ID!
			if (!summoner.puuid) {
				throw new Error('Summoner PUUID is missing');
			}
			
			console.log('🎮 Calling getLiveGame with PUUID:', summoner.puuid);
			
			const result = await getLiveGame(summoner.puuid, summoner.region || 'EUW');
		
			if (result.inGame) {
				liveGame = result.gameData;
				isInLiveGame = true; // Update parent state
				console.log('✅ Live game found!', liveGame);
				
				// Auto-fetch AI recommendations
				await getAI();
			} else {
				liveGame = null;
				isInLiveGame = false; // Update parent state
				console.log('❌ Not in game');
			}
		} catch (err) {
			console.error('Live game check error:', err);
			error = err.message;
			isInLiveGame = false; // Update parent state on error
		}

		loading = false;
	}

	async function getAI() {
		if (!liveGame) return;

		loadingAI = true;
		
		try {
			console.log('🤖 Fetching AI recommendations...');
			
			// Call server-side API route
			const response = await fetch('/api/ai-recommendations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					gameData: liveGame,
					summonerPuuid: summoner.puuid
				})
			});

			const data = await response.json();
			
			if (data.success) {
				aiRecommendations = {
					items: data.items || [],
					runes: data.runes || null
				};
				console.log('✅ AI recommendations:', aiRecommendations);
			} else {
				aiRecommendations = { error: data.error || 'Failed to get recommendations' };
			}
		} catch (err) {
			console.error('AI error:', err);
			aiRecommendations = { error: err.message };
		}

		loadingAI = false;
	}

	// Find your participant (using puuid since that's more reliable)
	$: myParticipant = liveGame ? liveGame.participants.find(p => p.puuid === summoner?.puuid) : null;
	$: myTeam = liveGame && myParticipant ? liveGame.participants.filter(p => p.teamId === myParticipant.teamId) : [];
	$: enemyTeam = liveGame && myParticipant ? liveGame.participants.filter(p => p.teamId !== myParticipant.teamId) : [];

	// Debug participant finding
	$: if (liveGame && !myParticipant) {
		console.warn('⚠️ Could not find current player in participants list!');
		console.log('My PUUID:', summoner?.puuid);
		console.log('Participants:', liveGame.participants.map(p => ({name: p.riotId || p.summonerName, puuid: p.puuid})));
	}

	// Load ranked stats when live game changes
	$: if (liveGame && !loadingStats && Object.keys(playerStats).length === 0) {
		loadPlayerStats();
	}

	// Calculate win probability based on ranked stats
	$: blueWinRate = calculateTeamWinRate(myTeam);
	$: redWinRate = calculateTeamWinRate(enemyTeam);
	$: winProbability = calculateWinProbability(blueWinRate, redWinRate);

	// Game duration and phase
	$: gameLength = liveGame ? Math.floor((Date.now() - liveGame.gameStartTime) / 1000 / 60) : 0;
	$: isChampSelect = liveGame && liveGame.gameLength === 0;
	$: gamePhase = isChampSelect ? '📖 Champion Select' : `⏱️ ${gameLength} min`;
	
	// Format game timer for display (MM:SS) - Live ticker
	$: {
		if (liveGame) {
			const totalSeconds = Math.floor((Date.now() - liveGame.gameStartTime) / 1000);
			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60;
			gameTimer = `${minutes}:${String(seconds).padStart(2, '0')}`;
		} else {
			gameTimer = '0:00';
		}
	}
	let gameTimer = '0:00';
	
	// Update timer every second
	let timerInterval;
	$: if (liveGame) {
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			const totalSeconds = Math.floor((Date.now() - liveGame.gameStartTime) / 1000);
			const minutes = Math.floor(totalSeconds / 60);
			const seconds = totalSeconds % 60;
			gameTimer = `${minutes}:${String(seconds).padStart(2, '0')}`;
		}, 1000);
	} else if (timerInterval) {
		clearInterval(timerInterval);
	}
	
	// Load ranked stats for all players with throttling
	async function loadPlayerStats() {
		if (!liveGame || loadingStats) return;
		loadingStats = true;
		console.log('📊 Loading player stats for', liveGame.participants.length, 'players...');

		try {
			const stats = {};
			const queueType = liveGame.gameQueueConfigId === 420 ? 'RANKED_SOLO_5x5' : 'RANKED_FLEX_SR';

			// Load stats for all players SEQUENTIALLY with massive delay to avoid Rate Limits (429)
			// Development Key Limit: 20 requests every 1 second(s) AND 100 requests every 2 minutes
			// 10 players * 2 requests (summoner + league) = 20 requests per game load!
			// We need to be VERY slow. 
			
			for (const player of liveGame.participants) {
				const playerName = player.riotId || player.summonerName || 'Unknown';
				
				// Huge delay: 1.2 seconds between players to be safe
				await new Promise(r => setTimeout(r, 1200));

				try {
					// Use encoded PUUID directly if available, otherwise raw
					const puuid = player.puuid; 
					// console.log(`📊 Fetching stats for ${playerName}...`);
					
					if (!puuid) {
						continue;
					}

					const response = await fetch(`/api/summoner/${puuid}/ranked?region=${summoner.region}`);
					
					if (response.ok) {
						const data = await response.json();
						
						// Handle both array and error responses
						if (Array.isArray(data) && data.length > 0) {
							const rankedData = data.find(q => q.queueType === queueType) || data.find(q => q.queueType === 'RANKED_SOLO_5x5') || data[0];
							if (rankedData) {
								const totalGames = rankedData.wins + rankedData.losses;
								const winRate = totalGames > 0 ? (rankedData.wins / totalGames) * 100 : 0;
								
								stats[player.puuid] = {
									tier: rankedData.tier,
									rank: rankedData.rank,
									lp: rankedData.leaguePoints || 0,
									wins: rankedData.wins,
									losses: rankedData.losses,
									winRate: winRate,
									games: totalGames
								};
							}
						} 
						
						// If still no stats, set default
						if (!stats[player.puuid]) {
							stats[player.puuid] = { tier: 'UNRANKED', rank: '', lp: 0, wins: 0, losses: 0, winRate: 50, games: 0 };
						}
					} else {
						// console.error(`❌ Failed to fetch stats for ${playerName}: ${response.status}`);
						stats[player.puuid] = { tier: 'UNRANKED', rank: '', lp: 0, wins: 0, losses: 0, winRate: 50, games: 0 };
					}
				} catch (err) {
					console.error(`❌ Error loading stats for ${playerName}:`, err);
					stats[player.puuid] = { tier: 'UNRANKED', rank: '', lp: 0, wins: 0, losses: 0, winRate: 50, games: 0 };
				}
				
				// Update UI incrementally
				playerStats = { ...stats };
			}

			console.log('✅ All player stats loaded');
		} catch (err) {
			console.error('❌ Failed to load player stats:', err);
		} finally {
			loadingStats = false;
		}
	}

	// Calculate average win rate for a team
	function calculateTeamWinRate(team) {
		if (!team || team.length === 0) return 50;
		const rates = team.map(p => playerStats[p.puuid]?.winRate || 50);
		const avg = rates.reduce((sum, wr) => sum + wr, 0) / rates.length;
		return avg;
	}

	// Calculate win probability from two team win rates
	function calculateWinProbability(blueWR, redWR) {
		// Normalize so they add up to 100%
		const total = blueWR + redWR;
		const blueProbability = (blueWR / total) * 100;
		return {
			blue: Math.round(blueProbability),
			red: Math.round(100 - blueProbability)
		};
	}

	// Get average rank for display
	function getAverageRank() {
		const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
		const allStats = Object.values(playerStats);
		if (allStats.length === 0) return 'Loading...';
		
		const tierValues = allStats.map(s => {
			const idx = tiers.indexOf(s.tier);
			return idx >= 0 ? idx : 3; // Default to GOLD
		});
		const avgTier = Math.round(tierValues.reduce((a, b) => a + b, 0) / tierValues.length);
		return tiers[avgTier] || 'GOLD';
	}

	// Get queue type name
	function getQueueName(queueId) {
		const queues = {
			420: 'RANKED SOLO/DUO',
			440: 'RANKED FLEX',
			400: 'NORMAL DRAFT',
			430: 'NORMAL BLIND',
			450: 'ARAM',
			700: 'CLASH',
			900: 'URF'
		};
		return queues[queueId] || 'CUSTOM GAME';
	}

	// Helper: Get champion name from ID (COMPLETE LIST - Riot DDragon Format)
	function getChampionName(championId) {
		const champions = {
			1: 'Annie', 2: 'Olaf', 3: 'Galio', 4: 'TwistedFate', 5: 'XinZhao',
			6: 'Urgot', 7: 'Leblanc', 8: 'Vladimir', 9: 'Fiddlesticks', 10: 'Kayle',
			11: 'MasterYi', 12: 'Alistar', 13: 'Ryze', 14: 'Sion', 15: 'Sivir',
			16: 'Soraka', 17: 'Teemo', 18: 'Tristana', 19: 'Warwick', 20: 'Nunu',
			21: 'MissFortune', 22: 'Ashe', 23: 'Tryndamere', 24: 'Jax', 25: 'Morgana',
			26: 'Zilean', 27: 'Singed', 28: 'Evelynn', 29: 'Twitch', 30: 'Karthus',
			31: 'Chogath', 32: 'Amumu', 33: 'Rammus', 34: 'Anivia', 35: 'Shaco',
			36: 'DrMundo', 37: 'Sona', 38: 'Kassadin', 39: 'Irelia', 40: 'Janna',
			41: 'Gangplank', 42: 'Corki', 43: 'Karma', 44: 'Taric', 45: 'Veigar',
			48: 'Trundle', 50: 'Swain', 51: 'Caitlyn', 53: 'Blitzcrank', 54: 'Malphite',
			55: 'Katarina', 56: 'Nocturne', 57: 'Maokai', 58: 'Renekton', 59: 'JarvanIV',
			60: 'Elise', 61: 'Orianna', 62: 'MonkeyKing', 63: 'Brand', 64: 'LeeSin',
			67: 'Vayne', 68: 'Rumble', 69: 'Cassiopeia', 72: 'Skarner', 74: 'Heimerdinger',
			75: 'Nasus', 76: 'Nidalee', 77: 'Udyr', 78: 'Poppy', 79: 'Gragas',
			80: 'Pantheon', 81: 'Ezreal', 82: 'Mordekaiser', 83: 'Yorick', 84: 'Akali',
			85: 'Kennen', 86: 'Garen', 89: 'Leona', 90: 'Malzahar', 91: 'Talon',
			92: 'Riven', 96: 'KogMaw', 98: 'Shen', 99: 'Lux', 101: 'Xerath',
			102: 'Shyvana', 103: 'Ahri', 104: 'Graves', 105: 'Fizz', 106: 'Volibear',
			107: 'Rengar', 110: 'Varus', 111: 'Nautilus', 112: 'Viktor', 113: 'Sejuani',
			114: 'Fiora', 115: 'Ziggs', 117: 'Lulu', 119: 'Draven', 120: 'Hecarim',
			121: 'Khazix', 122: 'Darius', 126: 'Jayce', 127: 'Lissandra', 131: 'Diana',
			133: 'Quinn', 134: 'Syndra', 136: 'AurelionSol', 141: 'Kayn', 142: 'Zoe',
			143: 'Zyra', 145: 'Kaisa', 147: 'Seraphine', 150: 'Gnar', 154: 'Zac',
			157: 'Yasuo', 161: 'Velkoz', 163: 'Taliyah', 164: 'Camille', 166: 'Akshan',
			200: 'Belveth', 201: 'Braum', 202: 'Jhin', 203: 'Kindred', 221: 'Zeri',
			222: 'Jinx', 223: 'TahmKench', 234: 'Viego', 235: 'Senna', 236: 'Lucian',
			238: 'Zed', 240: 'Kled', 245: 'Ekko', 246: 'Qiyana', 254: 'Vi',
			266: 'Aatrox', 267: 'Nami', 268: 'Azir', 350: 'Yuumi', 360: 'Samira',
			412: 'Thresh', 420: 'Illaoi', 421: 'RekSai', 427: 'Ivern', 429: 'Kalista',
			432: 'Bard', 497: 'Rakan', 498: 'Xayah', 516: 'Ornn', 517: 'Sylas',
			518: 'Neeko', 523: 'Aphelios', 526: 'Rell', 555: 'Pyke', 711: 'Vex',
			777: 'Yone', 875: 'Sett', 876: 'Lillia', 887: 'Gwen', 888: 'Renata',
			895: 'Nilah', 897: 'KSante', 901: 'Smolder', 902: 'Milio', 910: 'Hwei',
			950: 'Naafiri', 980: 'Briar'
		};
		const name = champions[championId] || 'Aatrox';
		console.log(`Champion ID ${championId} → ${name}`); // Debug
		return name;
	}

	function getRuneImageUrl(runeName) {
		// Map rune names to DDragon rune IDs
		const runeMap = {
			'Conqueror': '8010',
			'Press the Attack': '8005',
			'Electrocute': '8112',
			'Dark Harvest': '8128',
			'Grasp of the Undying': '8437',
			'Aftershock': '8439'
			// Add more as needed
		};
		
		const runeId = runeMap[runeName] || '8000';
		return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Resolve/GraspOfTheUndying/${runeId}.png`;
	}

	function getTreeImageUrl(treeName) {
		// Use simple DDragon URLs for rune tree icons
		const treeIcons = {
			'Precision': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/7201_Precision.png',
			'Domination': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/7200_Domination.png',
			'Sorcery': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/7202_Sorcery.png',
			'Resolve': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/7204_Resolve.png',
			'Inspiration': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/7203_Inspiration.png'
		};
		
		return treeIcons[treeName] || treeIcons['Precision'];
	}

	function getKeystoneUrl(keystoneName) {
		// Map keystone names to their DDragon URLs
		const keystones = {
			// Precision
			'Press the Attack': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
			'Lethal Tempo': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png',
			'Fleet Footwork': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png',
			'Conqueror': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/Conqueror/Conqueror.png',
			// Domination
			'Electrocute': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Domination/Electrocute/Electrocute.png',
			'Predator': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Domination/Predator/Predator.png',
			'Dark Harvest': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png',
			'Hail of Blades': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png',
			// Sorcery
			'Summon Aery': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Sorcery/SummonAery/SummonAery.png',
			'Arcane Comet': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png',
			'Phase Rush': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png',
			// Resolve
			'Grasp of the Undying': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png',
			'Aftershock': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png',
			'Guardian': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Resolve/Guardian/Guardian.png',
			// Inspiration
			'Glacial Augment': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png',
			'Unsealed Spellbook': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png',
			'First Strike': 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png'
		};
		
		return keystones[keystoneName] || 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/Conqueror/Conqueror.png';
	}
</script>

<div class="live-game-container">
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Checking for live game...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>❌ {error}</p>
			<button on:click={checkLiveGame} class="retry-btn">Retry</button>
		</div>
	{:else if !liveGame}
		<div class="no-game-state">
			<div class="icon">🎮</div>
			<h3>Not Currently in Game</h3>
			<p>Spieler: <strong>{summoner?.gameName}#{summoner?.tagLine}</strong></p>
			<p>Region: <strong>{summoner?.region}</strong></p>
			<p>PUUID: <code style="font-size: 0.7rem; color: #888;">{summoner?.puuid?.substring(0, 20)}...</code></p>
			<div class="supported-modes">
				<p class="modes-label">✅ Supported Game Types:</p>
				<ul class="modes-list">
					<li>Ranked (Solo/Duo, Flex)</li>
					<li>Normal (Draft, Blind)</li>
					<li>ARAM</li>
					<li>Arena (2v2, when available)</li>
					<li>URF & Featured Modes</li>
				</ul>
				<p class="modes-note">⚠️ Custom Games & Practice Tool are not supported by Riot's API</p>
			</div>
			<button on:click={checkLiveGame} class="refresh-btn">🔄 Refresh</button>
		</div>
	{:else}
		<!-- LIVE GAME FOUND! - GGEZ Style -->
		<div class="live-game-content">
			
			<!-- Header Bar -->
			<div class="ggez-header">
				<div class="header-left">
					<img src={getChampionIcon(getChampionName(myParticipant?.championId || 266), 64)} alt="" class="header-champ-icon" />
					<div class="header-info">
						<div class="queue-name">{getQueueName(liveGame.gameQueueConfigId)}</div>
						<div class="map-patch">SUMMONER'S RIFT • PATCH 14.24</div>
					</div>
				</div>
				<div class="header-center">
					<div class="live-dot"></div>
					<div class="game-time-display">{gameTimer}</div>
					<div class="avg-mmr">AVERAGE MMR: {getAverageRank()}</div>
				</div>
				<div class="header-right">
					<div class="win-prob-label">WIN PROBABILITY</div>
					<div class="win-prob-display">
						<span class="prob-blue">{winProbability.blue}%</span>
						<div class="prob-bar">
							<div class="prob-fill-blue" style="width: {winProbability.blue}%"></div>
							<div class="prob-fill-red" style="width: {winProbability.red}%"></div>
						</div>
						<span class="prob-red">{winProbability.red}%</span>
					</div>
				</div>
			</div>

			<!-- Teams Container -->
			<div class="teams-wrapper">
				<!-- Blue Team Header -->
				<div class="team-header-row">
					<div class="team-side blue">
						<div class="team-title">BLUE TEAM</div>
						<div class="team-subtitle">{winProbability.blue > 50 ? 'VICTORY LIKELY' : 'UNDERDOG'}</div>
					</div>
					<div class="bans-section">
						<span class="bans-label">BANS:</span>
						<div class="ban-icons">
							{#each (liveGame.bannedChampions || []).filter(b => b.teamId === myParticipant?.teamId).slice(0, 5) as ban}
								<img src={getChampionIcon(getChampionName(ban.championId), 32)} alt="" class="ban-icon" />
							{/each}
						</div>
					</div>
					<div class="bans-section">
						<div class="ban-icons">
							{#each (liveGame.bannedChampions || []).filter(b => b.teamId !== myParticipant?.teamId).slice(0, 5) as ban}
								<img src={getChampionIcon(getChampionName(ban.championId), 32)} alt="" class="ban-icon" />
							{/each}
						</div>
						<span class="bans-label">:BANS</span>
					</div>
					<div class="team-side red">
						<div class="team-title">RED TEAM</div>
						<div class="team-subtitle">{winProbability.red > 50 ? 'HIGH THREAT' : 'UNDERDOG'}</div>
					</div>
				</div>

				<!-- Players List - Horizontal Matchup Style -->
				{#each myTeam as player, i}
					<div class="matchup-row {player.puuid === summoner.puuid ? 'current-player-row' : ''}">
						<!-- Blue Player (Left) -->
						<div class="player-card blue-card">
							<div class="team-indicator blue"></div>
							
							<!-- Champion & Spells -->
							<div class="champion-section">
								<div class="champ-wrapper">
									<img src={getChampionIcon(getChampionName(player.championId), 64)} alt="" class="champ-icon" />
									<div class="spells-wrapper">
										<img src={getSummonerSpellIcon(getSpellName(player.spell1Id))} alt="" class="spell-icon" />
										<img src={getSummonerSpellIcon(getSpellName(player.spell2Id))} alt="" class="spell-icon" />
									</div>
								</div>
							</div>

							<!-- Info -->
							<div class="player-info">
								<div class="name-row">
									<span class="summoner-name">{player.riotId || player.summonerName || 'Player'}</span>
									{#if player.puuid === summoner.puuid}
										<span class="you-badge">YOU</span>
									{/if}
								</div>
								<div class="rank-row">
									<img src={getRankEmblem(playerStats[player.puuid]?.tier || 'UNRANKED', 32)} alt="" class="rank-emblem-tiny" />
									<span class="rank-text">
										{#if playerStats[player.puuid]}
											{playerStats[player.puuid].tier} {playerStats[player.puuid].rank}
										{:else}
											Loading...
										{/if}
									</span>
									<span class="lp-text">• {playerStats[player.puuid]?.lp || 0} LP</span>
								</div>
							</div>

							<!-- Stats -->
							<div class="player-stats-right">
								{#if playerStats[player.puuid]}
									<div class="wr-value {playerStats[player.puuid].winRate >= 50 ? 'positive' : 'negative'}">
										{Math.round(playerStats[player.puuid].winRate)}% WR
									</div>
									<div class="games-count">{playerStats[player.puuid].games} GAMES</div>
								{:else}
									<div class="stat-loading">...</div>
								{/if}
							</div>
						</div>

						<!-- Red Player (Right) -->
						{#if enemyTeam[i]}
							<div class="player-card red-card">
								<!-- Stats (Left aligned for red side) -->
								<div class="player-stats-left">
									{#if playerStats[enemyTeam[i].puuid]}
										<div class="wr-value {playerStats[enemyTeam[i].puuid].winRate >= 50 ? 'positive' : 'negative'}">
											{Math.round(playerStats[enemyTeam[i].puuid].winRate)}% WR
										</div>
										<div class="games-count">{playerStats[enemyTeam[i].puuid].games} GAMES</div>
									{:else}
										<div class="stat-loading">...</div>
									{/if}
								</div>

								<!-- Info (Right aligned) -->
								<div class="player-info right-align">
									<div class="name-row right">
										<span class="summoner-name">{enemyTeam[i].riotId || enemyTeam[i].summonerName || 'Player'}</span>
									</div>
									<div class="rank-row right">
										<span class="lp-text">{playerStats[enemyTeam[i].puuid]?.lp || 0} LP •</span>
										<span class="rank-text">
											{#if playerStats[enemyTeam[i].puuid]}
												{playerStats[enemyTeam[i].puuid].tier} {playerStats[enemyTeam[i].puuid].rank}
											{:else}
												Loading...
											{/if}
										</span>
										<img src={getRankEmblem(playerStats[enemyTeam[i].puuid]?.tier || 'UNRANKED', 32)} alt="" class="rank-emblem-tiny" />
									</div>
								</div>

								<!-- Champion & Spells -->
								<div class="champion-section">
									<div class="champ-wrapper">
										<div class="spells-wrapper left-side">
											<img src={getSummonerSpellIcon(getSpellName(enemyTeam[i].spell1Id))} alt="" class="spell-icon" />
											<img src={getSummonerSpellIcon(getSpellName(enemyTeam[i].spell2Id))} alt="" class="spell-icon" />
										</div>
										<img src={getChampionIcon(getChampionName(enemyTeam[i].championId), 64)} alt="" class="champ-icon" />
									</div>
								</div>

								<div class="team-indicator red"></div>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- PROFESSIONAL AI RECOMMENDATIONS -->
			<div class="ai-coach-section">
				<div class="section-title-bar">
					<h3 class="section-title">AI COACH ANALYSIS</h3>
					{#if !loadingAI && aiRecommendations}
						<button on:click={getAI} class="section-refresh-btn" aria-label="Refresh AI recommendations">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</button>
					{/if}
				</div>

				{#if loadingAI}
					<div class="ai-loading">
						<div class="spinner-small"></div>
						<p>Analyzing game...</p>
					</div>
				{:else if aiRecommendations?.error}
					<div class="ai-error">
						<p>⚠️ {aiRecommendations.error}</p>
						<p class="setup-hint">
							Stelle sicher dass in der .env Datei steht:<br>
							<code>OPENAI_API_KEY=sk-...</code><br>
							<small>(OHNE "VITE_" Prefix!) und Server neu starten!</small>
						</p>
					</div>
				{:else if aiRecommendations}
					<!-- HIGHEST WINRATE BUILD - Professional Design -->
					<div class="build-section">
						<div class="build-header">
							<span class="build-dash">—</span>
							<h4 class="build-title">HIGHEST WINRATE BUILD</h4>
						</div>
						<div class="items-showcase">
							{#each aiRecommendations.items as item}
								<div class="item-card">
									<img 
										src={getItemIcon(item.id)}
										alt={item.name}
										class="item-icon"
										loading="lazy"
										on:error={(e) => e.target.style.opacity = '0.3'}
									/>
								</div>
							{/each}
						</div>
					</div>

					<!-- Runes Recommendations -->
					{#if aiRecommendations.runes}
						<div class="runes-section">
							<div class="build-header">
								<span class="build-dash">—</span>
								<h4 class="build-title">OPTIMAL RUNES</h4>
							</div>
							<div class="runes-trees-container">
								<!-- Primary Tree -->
								<div class="rune-tree-card primary-tree">
									<div class="tree-header">
										<img 
											src={getTreeImageUrl(aiRecommendations.runes.primary)}
											alt={aiRecommendations.runes.primary}
											class="tree-icon"
											on:error={(e) => { e.target.src = 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/Precision.png'; }}
										/>
										<span class="tree-label">{aiRecommendations.runes.primary}</span>
									</div>
									<div class="keystone-row">
										<div class="keystone-icon-wrapper">
											<img 
												src={getKeystoneUrl(aiRecommendations.runes.primaryRune)}
												alt={aiRecommendations.runes.primaryRune}
												class="keystone-icon"
												on:error={(e) => { e.target.style.opacity = '0.3'; }}
											/>
										</div>
										<span class="keystone-name">{aiRecommendations.runes.primaryRune}</span>
									</div>
								</div>

								<!-- Secondary Tree -->
								<div class="rune-tree-card secondary-tree">
									<div class="tree-header">
										<img 
											src={getTreeImageUrl(aiRecommendations.runes.secondary)}
											alt={aiRecommendations.runes.secondary}
											class="tree-icon"
											on:error={(e) => { e.target.src = 'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Sorcery/Sorcery.png'; }}
										/>
										<span class="tree-label">{aiRecommendations.runes.secondary}</span>
									</div>
								</div>
							</div>
							<div class="rune-reason">
								💡 {aiRecommendations.runes.reason}
							</div>
						</div>
					{/if}
					{:else}
						<button on:click={getAI} class="get-ai-btn">🤖 Get AI Recommendations</button>
					{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.live-game-container {
		width: 100%;
		min-height: 400px;
	}

	/* Loading States */
	.loading-state, .error-state, .no-game-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		text-align: center;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid rgba(200, 170, 110, 0.2);
		border-top-color: #c8aa6e;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.no-game-state .icon {
		font-size: 4rem;
		margin-bottom: 20px;
		opacity: 0.5;
	}

	.no-game-state h3 {
		font-family: 'Cinzel', serif;
		color: white;
		margin-bottom: 10px;
	}

	.no-game-state p {
		color: #888;
		margin-bottom: 20px;
	}

	.supported-modes {
		background: rgba(200, 170, 110, 0.1);
		border: 1px solid rgba(200, 170, 110, 0.3);
		border-radius: 8px;
		padding: 20px;
		margin: 20px 0;
		max-width: 400px;
	}

	.modes-label {
		color: #c8aa6e;
		font-weight: bold;
		margin-bottom: 10px;
		font-size: 0.95rem;
	}

	.modes-list {
		list-style: none;
		padding: 0;
		margin: 10px 0;
		color: #fff;
	}

	.modes-list li {
		padding: 5px 0;
		padding-left: 20px;
		position: relative;
	}

	.modes-list li:before {
		content: "•";
		position: absolute;
		left: 5px;
		color: #c8aa6e;
	}

	.modes-note {
		color: #ff9800;
		font-size: 0.85rem;
		margin-top: 15px;
		padding-top: 15px;
		border-top: 1px solid rgba(255, 152, 0, 0.2);
	}

	/* ========== RUNES SECTION ========== */
	.runes-section {
		margin-top: 25px;
	}

	.runes-trees-container {
		display: flex;
		gap: 30px;
		margin-top: 15px;
	}

	.rune-tree-card {
		background: rgba(30, 35, 45, 0.8);
		border: 1px solid rgba(200, 170, 110, 0.2);
		border-radius: 12px;
		padding: 20px;
		min-width: 200px;
	}

	.rune-tree-card.primary-tree {
		border-color: rgba(200, 170, 110, 0.4);
	}

	.tree-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 15px;
	}

	.tree-icon {
		width: 40px;
		height: 40px;
		filter: drop-shadow(0 0 8px rgba(200, 170, 110, 0.5));
	}

	.tree-label {
		font-size: 1rem;
		font-weight: 700;
		color: #c8aa6e;
		letter-spacing: 0.5px;
	}

	.keystone-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
	}

	.keystone-icon-wrapper {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(200, 170, 110, 0.3), rgba(100, 80, 50, 0.3));
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid rgba(200, 170, 110, 0.5);
	}

	.keystone-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
	}

	.keystone-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: #fff;
	}

	.rune-reason {
		margin-top: 15px;
		padding: 12px 15px;
		background: rgba(200, 170, 110, 0.1);
		border-left: 3px solid #c8aa6e;
		border-radius: 0 8px 8px 0;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.5;
	}

	/* ========== GGEZ STYLE ========== */
	.ggez-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 30px;
		background: linear-gradient(135deg, rgba(30, 40, 50, 0.95), rgba(20, 25, 35, 0.98));
		border: 1px solid rgba(200, 170, 110, 0.2);
		border-radius: 12px;
		margin-bottom: 20px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.header-champ-icon {
		width: 56px;
		height: 56px;
		border-radius: 12px;
		border: 2px solid rgba(200, 170, 110, 0.5);
	}

	.header-info .queue-name {
		font-size: 1.3rem;
		font-weight: 800;
		color: #fff;
		letter-spacing: 1px;
	}

	.header-info .map-patch {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.5px;
	}

	.header-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
	}

	.live-dot {
		width: 10px;
		height: 10px;
		background: #ff4444;
		border-radius: 50%;
		animation: pulse-live 1.5s infinite;
		box-shadow: 0 0 10px #ff4444;
	}

	@keyframes pulse-live {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.6; transform: scale(1.1); }
	}

	.game-time-display {
		font-size: 2.5rem;
		font-weight: 900;
		color: #fff;
		font-family: 'Cinzel', serif;
	}

	.avg-mmr {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		letter-spacing: 1px;
	}

	.header-right {
		text-align: right;
	}

	.win-prob-label {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 1px;
		margin-bottom: 8px;
	}

	.win-prob-display {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.win-prob-display .prob-blue {
		color: #4aa8ff;
		font-weight: 800;
		font-size: 1rem;
	}

	.win-prob-display .prob-red {
		color: #ff6b6b;
		font-weight: 800;
		font-size: 1rem;
	}

	.prob-bar {
		width: 120px;
		height: 8px;
		background: #1a1a2e;
		border-radius: 4px;
		display: flex;
		overflow: hidden;
	}

	.prob-fill-blue {
		background: linear-gradient(90deg, #4aa8ff, #2d7dd2);
		height: 100%;
	}

	.prob-fill-red {
		background: linear-gradient(90deg, #d63031, #ff6b6b);
		height: 100%;
	}

	/* Teams Wrapper */
	.teams-wrapper {
		background: rgba(15, 20, 30, 0.8);
		border: 1px solid rgba(200, 170, 110, 0.15);
		border-radius: 12px;
		overflow: hidden;
	}

	.team-header-row {
		display: grid;
		grid-template-columns: 1fr auto auto 1fr;
		align-items: center;
		padding: 15px 25px;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(200, 170, 110, 0.1);
	}

	.team-side {
		display: flex;
		flex-direction: column;
	}

	.team-side.blue {
		align-items: flex-start;
	}

	.team-side.red {
		align-items: flex-end;
	}

	.team-title {
		font-size: 1rem;
		font-weight: 800;
		letter-spacing: 2px;
	}

	.team-side.blue .team-title {
		color: #4aa8ff;
	}

	.team-side.red .team-title {
		color: #ff6b6b;
	}

	.team-subtitle {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		letter-spacing: 1px;
	}

	.bans-section {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 20px;
	}

	.bans-label {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		letter-spacing: 1px;
	}

	.ban-icons {
		display: flex;
		gap: 4px;
	}

	.ban-icon {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		opacity: 0.6;
		filter: grayscale(50%);
	}

	/* Player Cards */
	.matchup-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin-bottom: 8px;
	}

	.player-card {
		display: flex;
		align-items: center;
		padding: 10px 15px;
		background: rgba(16, 20, 30, 0.6);
		border-radius: 4px;
		position: relative;
		height: 72px;
		transition: background 0.2s;
	}

	.matchup-row.current-player-row .player-card.blue-card {
		background: linear-gradient(90deg, rgba(200, 170, 110, 0.15), rgba(16, 20, 30, 0.6));
		border: 1px solid rgba(200, 170, 110, 0.3);
	}

	/* Team Indicators (Vertical Bars) */
	.team-indicator {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 4px;
		border-radius: 2px 0 0 2px;
	}

	.team-indicator.blue {
		left: 0;
		background-color: #0acbe6; /* Cyan for Blue Team */
		box-shadow: 0 0 8px rgba(10, 203, 230, 0.4);
	}

	.team-indicator.red {
		right: 0;
		background-color: #ff4444; /* Red for Red Team */
		border-radius: 0 2px 2px 0;
		box-shadow: 0 0 8px rgba(255, 68, 68, 0.4);
	}

	/* Champion Section */
	.champion-section {
		display: flex;
		align-items: center;
		margin: 0 12px;
	}

	.champ-wrapper {
		position: relative;
		width: 48px;
		height: 48px;
	}

	.champ-icon {
		width: 48px;
		height: 48px;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.spells-wrapper {
		position: absolute;
		bottom: -4px;
		right: -4px;
		display: flex;
		flex-direction: column;
		gap: 1px;
		z-index: 2;
	}

	.spells-wrapper.left-side {
		right: auto;
		left: -4px;
		bottom: -4px;
	}

	.spell-icon {
		width: 18px;
		height: 18px;
		border-radius: 3px;
		border: 1px solid #000;
	}

	/* Player Info */
	.player-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2px;
		min-width: 0;
	}

	.player-info.right-align {
		align-items: flex-end;
		text-align: right;
	}

	.name-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.name-row.right {
		justify-content: flex-end;
	}

	.summoner-name {
		color: #fff;
		font-weight: 700;
		font-size: 0.9rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.you-badge {
		background: #c8aa6e;
		color: #000;
		font-size: 0.65rem;
		padding: 1px 4px;
		border-radius: 3px;
		font-weight: 800;
	}

	.rank-row {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #888;
		font-size: 0.75rem;
	}

	.rank-row.right {
		justify-content: flex-end;
	}

	.rank-emblem-tiny {
		width: 16px;
		height: 16px;
	}

	.rank-text {
		color: #ccc;
	}

	.lp-text {
		color: #666;
	}

	/* Stats */
	.player-stats-right, .player-stats-left {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: center;
		min-width: 70px;
	}

	.player-stats-left {
		align-items: flex-start;
	}

	.wr-value {
		font-size: 1rem;
		font-weight: 800;
	}

	.wr-value.positive { color: #0acbe6; } /* Cyan for good WR */
	.wr-value.negative { color: #ff4444; }

	.games-count {
		font-size: 0.65rem;
		color: #666;
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.stat-loading {
		font-size: 0.8rem;
		color: #444;
	}

	/* Live Header Adjustments */
	.ggez-header {
		height: 80px;
		padding: 0 30px;
	}

	.header-champ-icon {
		width: 50px;
		height: 50px;
		border: 2px solid #c8aa6e;
	}

	/* Live Header - OLD */
	.live-header {
		display: flex;
		align-items: center;
		gap: 20px;
		margin-bottom: 30px;
		padding: 15px 20px;
		background: rgba(255, 0, 0, 0.1);
		border: 1px solid rgba(255, 0, 0, 0.3);
		border-radius: 8px;
	}

	.live-indicator {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: bold;
		font-family: 'Cinzel', serif;
	}

	.live-indicator.champ-select {
		color: #c8aa6e; /* Gold for Champion Select */
	}

	.live-indicator.in-game {
		color: #ff4444; /* Red for Live Game */
	}

	.pulse {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.champ-select .pulse {
		background: #c8aa6e; /* Gold pulse */
	}

	.in-game .pulse {
		background: #ff4444; /* Red pulse */
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}

	.game-time {
		color: #c8aa6e;
		font-weight: bold;
	}

	/* Teams - Glass Card Grid */
	.teams-container-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin-bottom: 40px;
	}

	.team-glass-card {
		background: rgba(1, 10, 19, 0.6);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(200, 170, 110, 0.2);
		border-radius: 12px;
		padding: 20px;
		transition: all 0.3s ease;
	}

	.team-glass-card:hover {
		border-color: rgba(200, 170, 110, 0.4);
		box-shadow: 0 0 25px rgba(200, 170, 110, 0.15);
	}

	.team-glass-card.blue-side {
		border-top: 3px solid #0acbe6;
	}

	.team-glass-card.red-side {
		border-top: 3px solid #ff4444;
	}

	.team-header {
		margin-bottom: 15px;
		padding-bottom: 10px;
		border-bottom: 1px solid rgba(200, 170, 110, 0.2);
	}

	.team-label {
		font-family: 'Cinzel', serif;
		font-size: 0.9rem;
		font-weight: bold;
		letter-spacing: 1px;
		color: #c8aa6e;
	}

	.team-players {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.player-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		border: 1px solid transparent;
		transition: all 0.2s ease;
	}

	.player-row:hover {
		background: rgba(0, 0, 0, 0.5);
		border-color: rgba(200, 170, 110, 0.3);
	}

	.player-row.current-player {
		background: rgba(200, 170, 110, 0.15);
		border-color: rgba(200, 170, 110, 0.5);
		box-shadow: 0 0 15px rgba(200, 170, 110, 0.2);
	}

	.player-champ-icon {
		flex-shrink: 0;
	}

	.player-champ-icon img {
		width: 48px;
		height: 48px;
		border-radius: 8px;
		border: 2px solid rgba(200, 170, 110, 0.3);
		transition: border-color 0.2s;
	}

	.player-row:hover .player-champ-icon img {
		border-color: rgba(200, 170, 110, 0.6);
	}

	.player-details {
		flex: 1;
		min-width: 0;
	}

	.player-summoner-name {
		color: white;
		font-weight: 600;
		font-size: 0.95rem;
		margin-bottom: 4px;
		display: flex;
		align-items: center;
		gap: 8px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.current-badge {
		font-size: 0.65rem;
		background: linear-gradient(135deg, #c8aa6e, #a67c52);
		color: #000;
		padding: 2px 8px;
		border-radius: 4px;
		font-weight: 900;
		letter-spacing: 0.5px;
		box-shadow: 0 2px 8px rgba(200, 170, 110, 0.3);
	}

	.player-champion-name {
		font-size: 0.85rem;
		color: #888;
		font-weight: 500;
	}

	/* AI Recommendations */
	.ai-recommendations {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(200, 170, 110, 0.3);
		border-radius: 12px;
		padding: 30px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.section-header h3 {
		font-family: 'Cinzel', serif;
		color: #c8aa6e;
		margin: 0;
	}

	.recommendations-grid {
		display: grid;
		gap: 30px;
	}

	.rec-section h4 {
		color: white;
		margin-bottom: 15px;
		font-family: 'Cinzel', serif;
	}

	/* Items */
	.items-grid {
		display: grid;
		gap: 12px;
	}

	.item-recommendation {
		display: flex;
		align-items: center;
		gap: 15px;
		padding: 12px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.item-img {
		width: 40px;
		height: 40px;
		border-radius: 6px;
	}

	.item-details {
		flex: 1;
	}

	.item-name {
		color: #c8aa6e;
		font-weight: bold;
		margin-bottom: 4px;
	}

	.item-reason {
		color: #aaa;
		font-size: 0.9rem;
	}

	/* Runes */
	.runes-display {
		display: flex;
		gap: 20px;
		margin-bottom: 15px;
	}

	.rune-tree {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 15px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		flex: 1;
	}

	.tree-img {
		width: 64px;
		height: 64px;
		object-fit: contain;
		filter: drop-shadow(0 0 10px rgba(200, 170, 110, 0.4));
	}

	.tree-name {
		color: #c8aa6e;
		font-weight: bold;
	}

	.keystone {
		color: white;
		font-size: 0.9rem;
	}

	.rune-reason {
		padding: 15px;
		background: rgba(200, 170, 110, 0.1);
		border-radius: 8px;
		color: #ddd;
	}

	/* Buttons */
	button {
		padding: 10px 20px;
		background: #c8aa6e;
		color: black;
		border: none;
		border-radius: 6px;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		font-family: 'Cinzel', serif;
	}

	button:hover {
		background: #d4b675;
		transform: translateY(-2px);
	}

	.refresh-btn {
		margin-top: 20px;
	}

	.refresh-small, .refresh-ai {
		padding: 8px 12px;
		font-size: 0.9rem;
	}

	.setup-hint {
		margin-top: 15px;
		padding: 15px;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 8px;
	}

	.setup-hint code {
		color: #c8aa6e;
		background: rgba(0, 0, 0, 0.5);
		padding: 4px 8px;
		border-radius: 4px;
		display: inline-block;
		margin-top: 8px;
	}

	.spinner-small {
		width: 30px;
		height: 30px;
		border: 3px solid rgba(200, 170, 110, 0.2);
		border-top-color: #c8aa6e;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 20px auto;
	}

	.ai-loading, .ai-error {
		text-align: center;
		padding: 40px 20px;
		color: #aaa;
	}

	/* Professional Header Styles */
	.professional-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 25px;
		background: rgba(5, 5, 8, 0.8);
		border-radius: 12px;
		border: 1px solid rgba(200, 170, 110, 0.2);
		margin-bottom: 30px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 25px;
	}

	.live-status {
		display: flex;
		align-items: center;
		gap: 10px;
		font-family: 'Cinzel', serif;
		font-weight: 700;
		font-size: 0.9rem;
		letter-spacing: 1px;
	}

	.live-status.in-game {
		color: #ff4444;
	}

	.live-status.champ-select {
		color: #c8aa6e;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		animation: pulse-dot 2s infinite;
	}

	.in-game .status-dot {
		background: #ff4444;
		box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
	}

	.champ-select .status-dot {
		background: #c8aa6e;
		box-shadow: 0 0 10px rgba(200, 170, 110, 0.5);
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(1.2); }
	}

	.game-duration {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
		font-weight: 600;
	}

	.refresh-button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 18px;
		background: rgba(200, 170, 110, 0.1);
		border: 1px solid rgba(200, 170, 110, 0.3);
		color: #c8aa6e;
		border-radius: 8px;
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s;
	}

	.refresh-button:hover {
		background: rgba(200, 170, 110, 0.2);
		border-color: #c8aa6e;
		transform: translateY(-2px);
	}

	.refresh-button svg {
		width: 16px;
		height: 16px;
	}

	/* AI Coach Section */
	.ai-coach-section {
		background: rgba(5, 5, 8, 0.6);
		border: 1px solid rgba(200, 170, 110, 0.2);
		border-radius: 12px;
		padding: 30px;
	}

	.section-title-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
		padding-bottom: 20px;
		border-bottom: 1px solid rgba(200, 170, 110, 0.2);
	}

	.section-title {
		font-family: 'Cinzel', serif;
		font-size: 1.1rem;
		font-weight: 700;
		letter-spacing: 2px;
		color: #c8aa6e;
		margin: 0;
	}

	.section-refresh-btn {
		padding: 8px;
		background: rgba(200, 170, 110, 0.1);
		border: 1px solid rgba(200, 170, 110, 0.3);
		border-radius: 6px;
		color: #c8aa6e;
		cursor: pointer;
		transition: all 0.3s;
	}

	.section-refresh-btn:hover {
		background: rgba(200, 170, 110, 0.2);
		border-color: #c8aa6e;
	}

	.section-refresh-btn svg {
		width: 16px;
		height: 16px;
	}

	/* Build Section - Professional Design */
	.build-section {
		margin: 0 0 30px 0;
		padding: 25px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 12px;
		border: 1px solid rgba(200, 170, 110, 0.15);
	}

	.build-header {
		display: flex;
		align-items: center;
		gap: 15px;
		margin-bottom: 25px;
	}

	.build-dash {
		color: rgba(200, 170, 110, 0.5);
		font-size: 1.5rem;
		font-weight: 300;
	}

	.build-title {
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 2.5px;
		color: white;
		text-transform: uppercase;
		margin: 0;
	}

	.items-showcase {
		display: flex;
		gap: 15px;
		flex-wrap: wrap;
	}

	.item-card {
		width: 64px;
		height: 64px;
		border: 2px solid rgba(200, 170, 110, 0.3);
		border-radius: 10px;
		overflow: hidden;
		transition: all 0.3s;
		cursor: pointer;
		background: rgba(0, 0, 0, 0.5);
	}

	.item-card:hover {
		border-color: #c8aa6e;
		transform: translateY(-4px);
		box-shadow: 0 8px 20px rgba(200, 170, 110, 0.3);
	}

	.item-icon {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s;
	}

	.item-card:hover .item-icon {
		transform: scale(1.1);
	}

	/* Match Header - Like in Image */
	.match-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 30px;
		background: rgba(10, 15, 25, 0.95);
		border-radius: 12px 12px 0 0;
		border-bottom: 1px solid rgba(200, 170, 110, 0.2);
	}

	.match-header-left .queue-type {
		font-family: 'Cinzel', serif;
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 1.5px;
		color: white;
		margin-bottom: 5px;
	}

	.match-header-left .summoner-rank {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.match-header-center {
		text-align: center;
	}

	.game-timer {
		font-size: 2rem;
		font-weight: 700;
		font-family: 'Cinzel', serif;
		color: white;
		margin-bottom: 5px;
	}

	.avg-rank {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 1px;
	}

	.match-header-right {
		text-align: right;
	}

	.win-prob-label {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 1px;
		margin-bottom: 8px;
	}

	.win-prob-bar {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.prob-blue, .prob-red {
		font-size: 0.9rem;
		font-weight: 700;
		min-width: 45px;
	}

	.prob-blue {
		color: #0acbe6;
		text-align: right;
	}

	.prob-red {
		color: #ff4444;
		text-align: left;
	}

	.prob-bar-container {
		width: 150px;
		height: 6px;
		background: rgba(255, 68, 68, 0.3);
		border-radius: 3px;
		overflow: hidden;
	}

	.prob-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, #0acbe6, #0acbe6);
		border-radius: 3px;
	}

	/* Matchup Container */
	.matchup-container {
		background: rgba(5, 8, 15, 0.95);
		border-radius: 0 0 12px 12px;
		padding: 20px 30px 30px;
	}

	.champions-icons-row {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 30px;
		margin-bottom: 20px;
		padding: 15px 0;
	}

	.team-icons {
		display: flex;
		gap: 10px;
	}

	.champ-icon-small {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		border: 2px solid rgba(200, 170, 110, 0.3);
	}

	.vs-divider {
		font-size: 1.2rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.3);
		font-family: 'Cinzel', serif;
	}

	.team-labels {
		display: flex;
		justify-content: space-between;
		margin-bottom: 25px;
		padding: 0 20px;
	}

	.team-label-blue, .team-label-red {
		font-family: 'Cinzel', serif;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 2px;
	}

	.team-label-blue {
		color: #0acbe6;
	}

	.team-label-red {
		color: #ff4444;
		text-align: right;
	}

	.threat-level {
		display: block;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 1px;
		color: rgba(16, 185, 129, 0.8);
		margin-top: 5px;
	}

	.threat-level-red {
		display: block;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 1px;
		color: rgba(239, 68, 68, 0.8);
		margin-top: 5px;
	}

	/* Matchup Row - Horizontal Player Display */
	.matchup-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 15px;
		padding: 15px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 10px;
		border: 1px solid transparent;
		transition: all 0.3s;
	}

	.matchup-row:hover {
		border-color: rgba(200, 170, 110, 0.3);
		background: rgba(0, 0, 0, 0.5);
	}

	.matchup-row.current-player-row {
		background: linear-gradient(90deg, rgba(200, 170, 110, 0.15), transparent 50%);
		border-color: rgba(200, 170, 110, 0.5);
		box-shadow: 0 0 20px rgba(200, 170, 110, 0.2);
	}

	.player-side {
		display: flex;
		align-items: center;
		gap: 15px;
		flex: 1;
	}

	.blue-player {
		justify-content: flex-start;
	}

	.red-player {
		justify-content: flex-end;
	}

	.player-avatar-group {
		display: flex;
		gap: 8px;
		align-items: center;
		position: relative;
	}

	.summoner-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 2px solid rgba(200, 170, 110, 0.3);
		object-fit: cover;
	}

	.champ-portrait {
		width: 56px;
		height: 56px;
		border-radius: 10px;
		border: 2px solid rgba(200, 170, 110, 0.4);
		object-fit: cover;
	}

	.player-info-group {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.player-info-group.right {
		align-items: flex-end;
	}

	.player-name {
		font-size: 0.95rem;
		font-weight: 700;
		color: white;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.you-badge {
		font-size: 0.65rem;
		background: linear-gradient(135deg, #c8aa6e, #a67c52);
		color: #000;
		padding: 2px 8px;
		border-radius: 4px;
		font-weight: 900;
		letter-spacing: 0.5px;
	}

	.player-rank {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.champion-name-label {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.player-stats {
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.stat-item {
		display: flex;
		align-items: center;
	}

	.stat-rank {
		font-size: 0.75rem;
		font-weight: 700;
		color: #c8aa6e;
		text-transform: uppercase;
	}

	.stat-wr {
		font-size: 0.75rem;
		font-weight: 700;
	}

	.stat-games {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.stat-loading {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.stat-badge {
		font-size: 0.65rem;
		padding: 4px 10px;
		border-radius: 4px;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-transform: uppercase;
	}

	.stat-badge.hot-streak {
		background: rgba(239, 68, 68, 0.2);
		color: #ff4444;
		border: 1px solid rgba(239, 68, 68, 0.5);
	}

	.stat-badge.mvp {
		background: rgba(200, 170, 110, 0.2);
		color: #c8aa6e;
		border: 1px solid rgba(200, 170, 110, 0.5);
	}

	.wr-stat {
		font-size: 0.85rem;
		font-weight: 700;
		text-align: center;
		line-height: 1.3;
	}

	.wr-stat.blue-wr {
		color: #0acbe6;
	}

	.wr-stat.red-wr {
		color: #ff4444;
	}

	.games-count {
		font-size: 0.65rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.4);
	}

	@media (max-width: 768px) {
		.matchup-row {
			flex-direction: column;
			gap: 20px;
		}
		
		.runes-display {
			flex-direction: column;
		}
		
		.match-header {
			flex-direction: column;
			gap: 20px;
			text-align: center;
		}
	}
</style>
