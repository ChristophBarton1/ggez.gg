<script>
	import { onMount } from 'svelte';
	import { getLiveGame } from '$lib/api/riot.js';
	import { getAIRecommendations } from '$lib/api/openai.js';
	import { getItemIcon, optimizeRiotImage } from '$lib/utils/imageProxy.js';
	import { getChampionIcon } from '$lib/utils/imageOptimizer.js';

	export let summoner; // Summoner object with id, puuid, region
	export let isInLiveGame = false; // Export to parent to show live indicator
	
	let loading = true;
	let liveGame = null;
	let aiRecommendations = null;
	let error = null;
	let loadingAI = false;

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
			aiRecommendations = await getAIRecommendations(liveGame, summoner.puuid);
			console.log('✅ AI recommendations:', aiRecommendations);
		} catch (err) {
			console.error('AI error:', err);
			aiRecommendations = { error: err.message };
		}

		loadingAI = false;
	}

	// Find your participant (using puuid since that's more reliable)
	$: myParticipant = liveGame ? liveGame.participants.find(p => p.puuid === summoner?.puuid || p.summonerId === summoner?.id) : null;
	$: myTeam = liveGame && myParticipant ? liveGame.participants.filter(p => p.teamId === myParticipant.teamId) : [];
	$: enemyTeam = liveGame && myParticipant ? liveGame.participants.filter(p => p.teamId !== myParticipant.teamId) : [];

	// Game duration and phase
	$: gameLength = liveGame ? Math.floor((Date.now() - liveGame.gameStartTime) / 1000 / 60) : 0;
	$: isChampSelect = liveGame && liveGame.gameLength === 0;
	$: gamePhase = isChampSelect ? '📖 Champion Select' : `⏱️ ${gameLength} min`;

	// Helper: Get champion name from ID (COMPLETE LIST)
	function getChampionName(championId) {
		const champions = {
			1: 'Annie', 2: 'Olaf', 3: 'Galio', 4: 'TwistedFate', 5: 'XinZhao',
			6: 'Urgot', 7: 'LeBlanc', 8: 'Vladimir', 9: 'Fiddlesticks', 10: 'Kayle',
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
		return champions[championId] || 'Aatrox'; // Fallback to Aatrox if unknown
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
		// Rune tree backgrounds
		const treeMap = {
			'Precision': 'Precision',
			'Domination': 'Domination',
			'Sorcery': 'Sorcery',
			'Resolve': 'Resolve',
			'Inspiration': 'Inspiration'
		};
		
		const tree = treeMap[treeName] || 'Precision';
		return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${tree}/${tree}.png`;
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
			<p>Start a matchmaking game to see live recommendations!</p>
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
		<!-- LIVE GAME FOUND! -->
		<div class="live-game-content">
			
			<!-- Header -->
			<div class="live-header">
				<div class="live-indicator {isChampSelect ? 'champ-select' : 'in-game'}">
					<span class="pulse"></span>
					{isChampSelect ? 'CHAMP SELECT' : 'LIVE GAME'}
				</div>
				<div class="game-time">{gamePhase}</div>
				<button on:click={checkLiveGame} class="refresh-small" title="Refresh">🔄</button>
			</div>

			<!-- Teams Display - Glass Card Style -->
			<div class="teams-container-grid">
				<!-- Your Team (Blue) - Glass Card -->
				<div class="team-glass-card blue-side">
					<div class="team-header">
						<div class="team-label">🔵 YOUR TEAM</div>
					</div>
					<div class="team-players">
						{#each myTeam as player}
							<div class="player-row {player.puuid === summoner.puuid ? 'current-player' : ''}">
								<!-- Champion Icon -->
								<div class="player-champ-icon">
									<img 
										src={getChampionIcon(getChampionName(player.championId), 64)}
										alt={getChampionName(player.championId)}
										width="48"
										height="48"
									/>
								</div>
								<!-- Player Info -->
								<div class="player-details">
									<div class="player-summoner-name">
										{player.summonerName || player.riotId || 'Player'}
										{#if player.puuid === summoner.puuid}
											<span class="current-badge">YOU</span>
										{/if}
									</div>
									<div class="player-champion-name">{getChampionName(player.championId).replace(/([A-Z])/g, ' $1').trim()}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Enemy Team (Red) - Glass Card -->
				<div class="team-glass-card red-side">
					<div class="team-header">
						<div class="team-label">🔴 ENEMY TEAM</div>
					</div>
					<div class="team-players">
						{#each enemyTeam as player}
							<div class="player-row">
								<!-- Champion Icon -->
								<div class="player-champ-icon">
									<img 
										src={getChampionIcon(getChampionName(player.championId), 64)}
										alt={getChampionName(player.championId)}
										width="48"
										height="48"
									/>
								</div>
								<!-- Player Info -->
								<div class="player-details">
									<div class="player-summoner-name">{player.summonerName || player.riotId || 'Player'}</div>
									<div class="player-champion-name">{getChampionName(player.championId).replace(/([A-Z])/g, ' $1').trim()}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- AI RECOMMENDATIONS -->
			<div class="ai-recommendations">
				<div class="section-header">
					<h3>🤖 AI Coach Recommendations</h3>
					{#if !loadingAI && aiRecommendations}
						<button on:click={getAI} class="refresh-ai">🔄 Refresh</button>
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
						{#if aiRecommendations.error.includes('not configured')}
							<p class="setup-hint">
								Add to .env:<br>
								<code>VITE_OPENAI_API_KEY=sk-your-key-here</code>
							</p>
						{/if}
					</div>
				{:else if aiRecommendations}
					<!-- Items Recommendations -->
					<div class="recommendations-grid">
						<div class="rec-section items-section">
							<h4>📦 Recommended Items</h4>
							<div class="items-grid">
								{#each aiRecommendations.items as item}
									<div class="item-recommendation">
										<img 
											src={getItemIcon(item.id)}
											alt={item.name}
											class="item-img"
										/>
										<div class="item-details">
											<div class="item-name">{item.name}</div>
											<div class="item-reason">{item.reason}</div>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<!-- Runes Recommendations -->
						{#if aiRecommendations.runes}
							<div class="rec-section runes-section">
								<h4>🎯 Optimal Runes</h4>
								<div class="runes-display">
									<div class="rune-tree primary">
										<img 
											src={optimizeRiotImage(getTreeImageUrl(aiRecommendations.runes.primary), { width: 64 })}
											alt={aiRecommendations.runes.primary}
											class="tree-img"
										/>
										<div class="tree-info">
											<div class="tree-name">{aiRecommendations.runes.primary}</div>
											<div class="keystone">{aiRecommendations.runes.primaryRune}</div>
										</div>
									</div>
									<div class="rune-tree secondary">
										<img 
											src={optimizeRiotImage(getTreeImageUrl(aiRecommendations.runes.secondary), { width: 64 })}
											alt={aiRecommendations.runes.secondary}
											class="tree-img"
										/>
										<div class="tree-info">
											<div class="tree-name">{aiRecommendations.runes.secondary}</div>
										</div>
									</div>
								</div>
								<div class="rune-reason">
									💡 {aiRecommendations.runes.reason}
								</div>
							</div>
						{/if}
					</div>
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

	/* Live Header */
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

	@media (max-width: 768px) {
		.teams-container-grid {
			grid-template-columns: 1fr;
		}
		
		.runes-display {
			flex-direction: column;
		}
	}
</style>
