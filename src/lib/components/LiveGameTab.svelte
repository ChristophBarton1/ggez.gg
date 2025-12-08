<script>
	import { onMount } from 'svelte';
	import { getLiveGame } from '$lib/api/riot.js';
	import { getAIRecommendations } from '$lib/api/openai.js';
	import { getItemIcon, optimizeRiotImage } from '$lib/utils/imageProxy.js';
	import { getChampionIcon } from '$lib/utils/imageOptimizer.js';

	export let summoner; // Summoner object with id, puuid, region
	
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
				console.log('✅ Live game found!', liveGame);
				
				// Auto-fetch AI recommendations
				await getAI();
			} else {
				liveGame = null;
				console.log('❌ Not in game');
			}
		} catch (err) {
			console.error('Live game check error:', err);
			error = err.message;
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

	// Helper: Get champion name from ID
	function getChampionName(championId) {
		const champions = {
			1: 'Annie', 2: 'Olaf', 3: 'Galio', 4: 'Twisted Fate', 5: 'Xin Zhao',
			11: 'Master Yi', 22: 'Ashe', 51: 'Caitlyn', 64: 'Lee Sin', 81: 'Ezreal',
			84: 'Akali', 103: 'Ahri', 157: 'Yasuo', 163: 'Taliyah', 222: 'Jinx',
			236: 'Lucian', 412: 'Thresh'
			// More added dynamically via fallback
		};
		return champions[championId] || `Champion ${championId}`;
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

			<!-- Teams Display -->
			<div class="teams-container">
				<!-- Your Team (Blue) -->
				<div class="team blue-team">
					<h4 class="team-title">🔵 Your Team</h4>
					<div class="players-list">
						{#each myTeam as player}
							<div class="player-card {player.puuid === summoner.puuid ? 'you' : ''}">
								<img 
									src={getChampionIcon(player.championId, 64)}
									alt={getChampionName(player.championId)}
									class="champ-icon"
								/>
								<div class="player-info">
									<div class="summoner-name">
										{player.summonerName || player.riotId || 'Player'}
										{#if player.puuid === summoner.puuid}
											<span class="you-badge">YOU</span>
										{/if}
									</div>
									<div class="champion-name">{getChampionName(player.championId)}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Enemy Team (Red) -->
				<div class="team red-team">
					<h4 class="team-title">🔴 Enemy Team</h4>
					<div class="players-list">
						{#each enemyTeam as player}
							<div class="player-card">
								<img 
									src={getChampionIcon(player.championId, 64)}
									alt={getChampionName(player.championId)}
									class="champ-icon"
								/>
								<div class="player-info">
									<div class="summoner-name">{player.summonerName || player.riotId || 'Player'}</div>
									<div class="champion-name">{getChampionName(player.championId)}</div>
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

	/* Teams */
	.teams-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin-bottom: 40px;
	}

	.team {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 20px;
	}

	.team h4 {
		margin-bottom: 15px;
		font-family: 'Cinzel', serif;
		color: white;
	}

	.blue-team h4 {
		color: #0acbe6;
	}

	.red-team h4 {
		color: #ff4444;
	}

	.players-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.player-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		transition: all 0.2s;
	}

	.player-card:hover {
		background: rgba(0, 0, 0, 0.5);
	}

	.player-card.you {
		background: rgba(200, 170, 110, 0.2);
		border: 1px solid rgba(200, 170, 110, 0.5);
	}

	.champ-icon {
		width: 48px;
		height: 48px;
		border-radius: 8px;
		border: 2px solid rgba(255, 255, 255, 0.2);
	}

	.player-info {
		flex: 1;
	}

	.summoner-name {
		color: white;
		font-weight: bold;
		margin-bottom: 2px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.you-badge {
		font-size: 0.7rem;
		background: #c8aa6e;
		color: black;
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: 900;
	}

	.champion-name {
		font-size: 0.85rem;
		color: #888;
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
		.teams-container {
			grid-template-columns: 1fr;
		}
		
		.runes-display {
			flex-direction: column;
		}
	}
</style>
