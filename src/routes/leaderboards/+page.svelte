<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { optimizeRiotImage } from '$lib/utils/imageProxy.js';

	let players = [];
	let filteredPlayers = [];
	let spotlightPlayers = [];
	let loading = true;
	let isInitialized = false; // Prevent loading screen flicker on first load
	let searchQuery = '';
	let selectedRole = 'all';
	let selectedRank = 'platinum_plus';
	let selectedRegion = 'euw'; // Default to EUW
	let selectedQueue = 'ranked_solo'; // Default to Ranked Solo
	let selectedPatch = 'current'; // Current patch
	let sortBy = 'lpGain'; // Default sort by LP gains
	let sortDirection = 'desc'; // asc or desc

	// Rank filters
	const ranks = [
		{ value: 'platinum_plus', label: 'Platinum+', icon: '💎' },
		{ value: 'diamond_plus', label: 'Diamond+', icon: '💠' },
		{ value: 'iron', label: 'Iron', icon: '🪨' },
		{ value: 'bronze', label: 'Bronze', icon: '🥉' },
		{ value: 'silver', label: 'Silver', icon: '🥈' },
		{ value: 'gold', label: 'Gold', icon: '🥇' },
		{ value: 'platinum', label: 'Platinum', icon: '💎' },
		{ value: 'diamond', label: 'Diamond', icon: '💠' },
		{ value: 'master', label: 'Master+', icon: '👑' }
	];
	
	// Region filters
	const regions = [
		{ value: 'all', label: 'All Regions', icon: '🌍' },
		{ value: 'euw', label: 'EUW', icon: '🇪🇺' },
		{ value: 'na', label: 'NA', icon: '🇺🇸' },
		{ value: 'kr', label: 'KR', icon: '🇰🇷' },
		{ value: 'eune', label: 'EUNE', icon: '🇪🇺' },
		{ value: 'br', label: 'BR', icon: '🇧🇷' },
		{ value: 'lan', label: 'LAN', icon: '🌎' },
		{ value: 'las', label: 'LAS', icon: '🌎' },
		{ value: 'oce', label: 'OCE', icon: '🇦🇺' },
		{ value: 'jp', label: 'JP', icon: '🇯🇵' },
		{ value: 'tr', label: 'TR', icon: '🇹🇷' }
	];
	
	// Queue Type filters
	const queueTypes = [
		{ value: 'ranked_solo', label: 'Ranked Solo/Duo', icon: '🏆' },
		{ value: 'ranked_flex', label: 'Ranked Flex', icon: '👥' },
		{ value: 'normal', label: 'Normal (Draft)', icon: '🎮' },
		{ value: 'aram', label: 'ARAM', icon: '❄️' },
		{ value: 'all', label: 'All Queues', icon: '🌐' }
	];
	
	// Patch filters (current + last 3 patches)
	const patches = [
		{ value: 'current', label: 'Patch 14.24', icon: '🆕' },
		{ value: '14.23', label: 'Patch 14.23', icon: '📊' },
		{ value: '14.22', label: 'Patch 14.22', icon: '📊' },
		{ value: '14.21', label: 'Patch 14.21', icon: '📊' }
	];

	// Role filters (matching LoLalytics lanes)
	const roles = [
		{ value: 'all', label: 'All Roles', icon: '🌐' },
		{ value: 'top', label: 'Top', icon: '⬆️' },
		{ value: 'jungle', label: 'Jungle', icon: '🌲' },
		{ value: 'mid', label: 'Mid', icon: '⭐' },
		{ value: 'adc', label: 'ADC', icon: '🎯' },
		{ value: 'support', label: 'Support', icon: '🛡️' }
	];

	let latestVersion = '';
	let championNames = {};

	onMount(async () => {
		await loadPlayers();
		isInitialized = true;
	});

	let loadPromise = null;
	
	async function loadPlayers() {
		if (loadPromise) return loadPromise;
		
		loadPromise = (async () => {
			try {
				loading = true;
				
				// Fetch version for champion images
				if (!latestVersion) {
					const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
					const versions = await versionRes.json();
					latestVersion = versions[0];
				}
				
				// Fetch champion names for most played
				if (Object.keys(championNames).length === 0) {
					const champDataRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
					const champData = await champDataRes.json();
					Object.values(champData.data).forEach(champ => {
						championNames[champ.key] = { id: champ.id, name: champ.name, key: champ.key };
					});
				}
				
				// Fetch players from API
				const res = await fetch(`/api/leaderboards?region=${selectedRegion}&role=${selectedRole}&timeframe=${selectedPatch}`);
				const data = await res.json();
				
				if (!data.success) throw new Error('Failed to fetch leaderboard');
				
				// Process players
				players = data.players.map((p, i) => ({
					rank: i + 1,
					summonerName: p.summonerName,
					tagLine: p.tagLine,
					soloQTier: p.tier,
					soloQLP: p.lp,
					flexTier: p.flexTier || 'Unranked',
					flexLP: p.flexLP || 0,
					lpGain: p.lpGain,
					winRate: p.winRate.toFixed(1),
					wins: p.wins,
					losses: p.losses,
					mainChampion: p.mainChampion,
					topChampions: p.topChampions || [p.mainChampion],
					profileIconId: p.profileIconId,
					// Main champ splash for spotlight
					splash: championNames[p.mainChampion] ? 
						optimizeRiotImage(`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championNames[p.mainChampion].id}_0.jpg`, { width: 400 }) : '',
					splashHero: championNames[p.mainChampion] ? 
						optimizeRiotImage(`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championNames[p.mainChampion].id}_0.jpg`, { width: 800 }) : ''
				}));
				
				// Top 5 for spotlight
				spotlightPlayers = players.slice(0, 5).map((p, i) => ({
					...p,
					tag: i === 0 ? `#1 ${p.soloQTier} • ${p.soloQLP} LP` : `#${i+1} ${p.soloQTier}`,
					tagColor: i === 0 ? '#c8aa6e' : ['#a855f7', '#3b82f6', '#10b981', '#e84057'][i - 1]
				}));
				
				filteredPlayers = players;
				loading = false;
				
				if (players.length > 0) {
					console.log(`✅ ${players.length} players - ${selectedRegion.toUpperCase()}`);
				}
			} catch (error) {
				console.error('❌ Error loading players:', error);
				loading = false;
			} finally {
				loadPromise = null;
			}
		})();
		
		return loadPromise;
	}
	
	// Debounced reload when filters change
	let filterTimeout;
	let previousFilters = '';
	$: {
		const currentFilters = `${selectedRole}-${selectedRegion}-${selectedPatch}`;
		if (isInitialized && previousFilters && currentFilters !== previousFilters) {
			clearTimeout(filterTimeout);
			filterTimeout = setTimeout(() => loadPlayers(), 500);
		}
		previousFilters = currentFilters;
	}

	// Search and sort
	$: {
		let result = players.filter(p => 
			p.summonerName.toLowerCase().includes(searchQuery.toLowerCase())
		);
		
		result.sort((a, b) => {
			const aVal = parseFloat(a[sortBy]) || 0;
			const bVal = parseFloat(b[sortBy]) || 0;
			return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
		});
		
		filteredPlayers = result.map((p, i) => ({ ...p, rank: i + 1 }));
	}
	
	// Toggle sort
	function toggleSort(column) {
		if (sortBy === column) {
			sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
		} else {
			sortBy = column;
			sortDirection = 'desc';
		}
	}

	function getTierClass(tier) {
		if (tier === 'S+' || tier === 'S') return 'tier-s';
		if (tier === 'A+' || tier === 'A') return 'tier-a';
		return 'tier-b';
	}
	
	function getRoleLabel(role) {
		const roleMap = { top: 'Top', jungle: 'Jungle', mid: 'Mid', adc: 'ADC', support: 'Support' };
		return roleMap[role] || role;
	}
</script>

<svelte:head>
	<title>Leaderboards - GGEZ.GG | Top Players Rankings</title>
	<meta name="description" content="View the top League of Legends players, fastest climbers, and regional leaderboards.">
</svelte:head>

<!-- Background with Grid Pattern -->
<div class="fixed inset-0 -z-50 bg-[#050508]">
	<div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
</div>

<!-- Navigation removed - now using global Navbar from layout -->

<div class="max-w-[1400px] mx-auto px-5 py-10">

	{#if loading && isInitialized}
		<!-- Show loading screen only after initial load -->
		<div class="flex flex-col items-center justify-center py-32 gap-4">
			<div class="w-16 h-16 border-4 border-[#0acbe6]/30 border-t-[#c8aa6e] rounded-full animate-spin"></div>
			<div class="font-cinzel text-[#c8aa6e] animate-pulse">Loading Meta Data...</div>
		</div>
	{:else if !loading}
		<!-- Header -->
		<div class="header-title mb-5">
			Top <span class="text-[#0acbe6]">Players</span>
		</div>

		<!-- Spotlight Grid (Top 5 Players) -->
		{#if spotlightPlayers.length >= 5}
		<div class="spotlight-grid mb-20">
			<!-- Hero Card -->
			<div class="spotlight-card spotlight-hero group cursor-pointer">
				<img 
					src={spotlightPlayers[0].splashHero} 
					alt={spotlightPlayers[0].summonerName} 
					class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					fetchpriority="high"
					loading="eager"
					decoding="async"
				>
				<div class="overlay">
					<div class="meta-tag">{spotlightPlayers[0].tag}</div>
					<div class="hero-name">{spotlightPlayers[0].summonerName}#{spotlightPlayers[0].tagLine}</div>
					<div class="hero-stat">
						<span>Win Rate: <b>{spotlightPlayers[0].winRate}%</b></span>
						<span>LP: <b class="text-hex-gold">{spotlightPlayers[0].soloQLP}</b></span>
					</div>
				</div>
			</div>

			<!-- Column 1 -->
			<div class="spotlight-col">
				<div class="spotlight-card spotlight-mini group cursor-pointer">
					<img src={spotlightPlayers[1].splash} alt={spotlightPlayers[1].summonerName} class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
					<div class="mini-info">
						<div class="meta-tag" style="background: {spotlightPlayers[1].tagColor}; color: white;">{spotlightPlayers[1].tag}</div>
						<div class="mini-name">{spotlightPlayers[1].summonerName}</div>
					</div>
				</div>
				<div class="spotlight-card spotlight-mini group cursor-pointer">
					<img src={spotlightPlayers[2].splash} alt={spotlightPlayers[2].summonerName} class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
					<div class="mini-info">
						<div class="meta-tag" style="background: {spotlightPlayers[2].tagColor}; color: white;">{spotlightPlayers[2].tag}</div>
						<div class="mini-name">{spotlightPlayers[2].summonerName}</div>
					</div>
				</div>
			</div>

			<!-- Column 2 -->
			<div class="spotlight-col">
				<div class="spotlight-card spotlight-mini group cursor-pointer">
					<img src={spotlightPlayers[3].splash} alt={spotlightPlayers[3].summonerName} class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
					<div class="mini-info">
						<div class="meta-tag" style="background: {spotlightPlayers[3].tagColor}; color: white;">{spotlightPlayers[3].tag}</div>
						<div class="mini-name">{spotlightPlayers[3].summonerName}</div>
					</div>
				</div>
				<div class="spotlight-card spotlight-mini group cursor-pointer">
					<img src={spotlightPlayers[4].splash} alt={spotlightPlayers[4].summonerName} class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
					<div class="mini-info">
						<div class="meta-tag" style="background: {spotlightPlayers[4].tagColor}; color: white;">{spotlightPlayers[4].tag}</div>
						<div class="mini-name">{spotlightPlayers[4].summonerName}</div>
					</div>
				</div>
			</div>
		</div>
		{/if}

		<!-- Statistics Section -->
		<div class="header-title mb-5" style="font-size: 1.5rem;">
			Player <span class="text-[#0acbe6]">Rankings</span>
		</div>

		<!-- Data Panel -->
		<div class="data-panel">
			<!-- Controls -->
			<div class="panel-controls">
				<!-- Rank Filter -->
				<div class="filter-group">
					<label class="filter-label" for="rank-select">Rank:</label>
					<select id="rank-select" bind:value={selectedRank} class="rank-select">
						{#each ranks as rank}
							<option value={rank.value}>{rank.icon} {rank.label}</option>
						{/each}
					</select>
				</div>
				
				<!-- Region Filter -->
				<div class="filter-group">
					<label class="filter-label" for="region-select">Region:</label>
					<select id="region-select" bind:value={selectedRegion} class="rank-select">
						{#each regions as region}
							<option value={region.value}>{region.icon} {region.label}</option>
						{/each}
					</select>
				</div>
				
				<!-- Queue Type Filter -->
				<div class="filter-group">
					<label class="filter-label" for="queue-select">Queue:</label>
					<select id="queue-select" bind:value={selectedQueue} class="rank-select">
						{#each queueTypes as queue}
							<option value={queue.value}>{queue.icon} {queue.label}</option>
						{/each}
					</select>
				</div>
				
				<!-- Patch Filter -->
				<div class="filter-group">
					<label class="filter-label" for="patch-select">Patch:</label>
					<select id="patch-select" bind:value={selectedPatch} class="rank-select">
						{#each patches as patch}
							<option value={patch.value}>{patch.icon} {patch.label}</option>
						{/each}
					</select>
				</div>
				
				<!-- Role Filters -->
				{#each roles as role}
					<button 
						class="filter-btn {selectedRole === role.value ? 'active' : ''}" 
						on:click={() => selectedRole = role.value}
					>
						<span class="role-icon">{role.icon}</span>
						{role.label}
					</button>
				{/each}
				
				<input 
					type="text" 
					placeholder="🔍 Search champion..." 
					bind:value={searchQuery}
					class="search-input"
				>
			</div>

			<!-- Table -->
			<div class="table-wrapper">
				<table class="champ-table">
					<thead>
						<tr>
							<th style="width: 50px;">#</th>
							<th>Summoner</th>
							<th class="sortable" on:click={() => toggleSort('soloQLP')}>
								Solo/Duo
								{#if sortBy === 'soloQLP'}
									<span class="sort-icon">{sortDirection === 'desc' ? '▼' : '▲'}</span>
								{/if}
							</th>
							<th class="sortable" on:click={() => toggleSort('flexLP')}>
								Flex
								{#if sortBy === 'flexLP'}
									<span class="sort-icon">{sortDirection === 'desc' ? '▼' : '▲'}</span>
								{/if}
							</th>
							<th class="sortable" on:click={() => toggleSort('winRate')}>
								Win Rate
								{#if sortBy === 'winRate'}
									<span class="sort-icon">{sortDirection === 'desc' ? '▼' : '▲'}</span>
								{/if}
							</th>
							<th class="sortable" on:click={() => toggleSort('lpGain')}>
								LP Gain (7d)
								{#if sortBy === 'lpGain'}
									<span class="sort-icon">{sortDirection === 'desc' ? '▼' : '▲'}</span>
								{/if}
							</th>
							<th>Top 5 Champions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredPlayers as player (player.summonerName + player.tagLine)}
							<tr class="table-row" transition:fade={{ duration: 200 }}>
								<td class="text-[#64748b] font-bold">{player.rank}</td>
								<td>
									<div class="col-champ">
										<img src="https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/{player.profileIconId}.png" alt={player.summonerName} width="40" height="40" style="border-radius: 50%;">
										<div class="champ-text">
											<div class="font-bold">{player.summonerName}#{player.tagLine}</div>
											<div class="text-xs text-gray-500">{player.wins}W {player.losses}L</div>
										</div>
									</div>
								</td>
								<td>
									<span class="tier-badge tier-s">{player.soloQTier}</span>
									<div class="text-xs text-hex-gold mt-1">{player.soloQLP} LP</div>
								</td>
								<td>
									<span class="tier-badge tier-a">{player.flexTier}</span>
									{#if player.flexLP > 0}
										<div class="text-xs text-gray-400 mt-1">{player.flexLP} LP</div>
									{/if}
								</td>
								<td class="winrate">{player.winRate}%</td>
								<td class="text-green-400 font-bold">+{player.lpGain} LP</td>
								<td>
									<div class="flex gap-1">
										{#each player.topChampions.slice(0, 5) as champKey}
											{#if championNames[champKey]}
												<img 
													src={optimizeRiotImage(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${championNames[champKey].id}.png`, { width: 32 })}
													alt={championNames[champKey].name}
													title={championNames[champKey].name}
													width="32"
													height="32"
													class="rounded"
												/>
											{/if}
										{/each}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="mt-8 text-center text-[#64748b] text-sm font-cinzel">
			Showing {filteredPlayers.length} of {players.length} Players
		</div>
	{/if}
</div>

<style>
	.header-title {
		font-family: 'Cinzel', serif;
		font-size: 2rem;
		color: white;
		margin-bottom: 20px;
		display: flex;
		align-items: center;
		gap: 15px;
	}

	/* Spotlight Grid */
	.spotlight-grid {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 20px;
		margin-bottom: 80px;
		height: 350px;
	}

	@media (max-width: 768px) {
		.spotlight-grid {
			grid-template-columns: 1fr;
			height: auto;
		}
		.spotlight-hero { height: 300px; }
		.spotlight-col { flex-direction: row; height: 150px; }
	}

	.spotlight-card {
		position: relative;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid rgba(255,255,255,0.05);
		background: #0f1118;
		transition: 0.3s;
		cursor: pointer;
	}
	.spotlight-card:hover {
		border-color: #0acbe6;
		box-shadow: 0 0 30px rgba(10, 203, 230, 0.1);
	}

	.overlay {
		position: absolute;
		bottom: 0; left: 0; right: 0;
		background: linear-gradient(to top, #050508 10%, transparent);
		padding: 30px;
		z-index: 2;
	}

	.meta-tag {
		background: #0acbe6;
		color: #000;
		font-weight: 800;
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 0.8rem;
		text-transform: uppercase;
		display: inline-block;
		margin-bottom: 10px;
	}

	.hero-name {
		font-family: 'Cinzel', serif;
		font-size: 3rem;
		font-weight: 900;
		line-height: 1;
		text-transform: uppercase;
		text-shadow: 0 5px 15px rgba(0,0,0,0.8);
	}

	.hero-stat {
		color: #64748b;
		font-size: 0.9rem;
		margin-top: 5px;
		display: flex;
		gap: 15px;
	}
	.hero-stat b { color: #c8aa6e; }

	.spotlight-col {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.spotlight-mini {
		flex: 1;
		position: relative;
	}

	.mini-info {
		position: absolute;
		bottom: 15px; left: 15px;
		pointer-events: none;
	}

	.mini-name {
		font-family: 'Cinzel';
		font-weight: 700;
		font-size: 1.2rem;
	}

	/* Data Panel */
	.data-panel {
		background: #0f1118;
		border: 1px solid rgba(255,255,255,0.05);
		border-radius: 12px;
		overflow: hidden;
	}

	.panel-controls {
		padding: 20px;
		display: flex;
		gap: 15px;
		border-bottom: 1px solid rgba(255,255,255,0.05);
		flex-wrap: wrap;
		align-items: center;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		background: rgba(10, 203, 230, 0.05);
		border: 1px solid rgba(10, 203, 230, 0.2);
		border-radius: 8px;
	}

	.filter-label {
		font-size: 0.85rem;
		color: #0acbe6;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.rank-select {
		background: transparent;
		border: none;
		color: white;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		outline: none;
		padding: 4px 8px;
	}
	.rank-select option {
		background: #1a1b23;
		color: white;
	}

	.filter-btn {
		background: transparent;
		border: 1px solid rgba(255,255,255,0.05);
		color: #64748b;
		padding: 8px 16px;
		border-radius: 6px;
		cursor: pointer;
		transition: 0.2s;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.filter-btn.active, .filter-btn:hover {
		background: rgba(10, 203, 230, 0.1);
		color: #0acbe6;
		border-color: #0acbe6;
	}
	
	.role-icon {
		font-size: 1rem;
	}

	.search-input {
		margin-left: auto;
		background: transparent;
		border: 1px solid #333;
		color: white;
		padding: 8px 16px;
		border-radius: 6px;
		outline: none;
		transition: 0.2s;
	}
	.search-input:focus {
		border-color: #0acbe6;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.champ-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.champ-table th {
		background: rgba(0,0,0,0.3);
		color: #64748b;
		font-size: 0.8rem;
		text-transform: uppercase;
		padding: 15px 20px;
		font-weight: 600;
		letter-spacing: 1px;
		border-bottom: 1px solid rgba(255,255,255,0.05);
	}

	.sortable {
		cursor: pointer;
		user-select: none;
		transition: 0.2s;
		position: relative;
	}
	.sortable:hover {
		color: #0acbe6;
		background: rgba(10, 203, 230, 0.05);
	}

	.sort-icon {
		margin-left: 5px;
		font-size: 0.7rem;
		color: #0acbe6;
	}

	.champ-table td {
		padding: 15px 20px;
		border-bottom: 1px solid rgba(255,255,255,0.05);
		color: white;
		font-size: 0.95rem;
		transition: 0.2s;
	}

	.table-row:hover td {
		background: rgba(255,255,255,0.03);
	}

	.col-champ {
		display: flex;
		align-items: center;
		gap: 15px;
	}
	.col-champ img {
		width: 40px; height: 40px;
		border-radius: 6px;
		object-fit: cover;
		border: 1px solid rgba(255,255,255,0.1);
	}

	.champ-text div:first-child { font-weight: 700; }
	.champ-text div:last-child { font-size: 0.8rem; color: #64748b; }

	.tier-badge {
		font-family: 'Cinzel', serif;
		font-weight: 900;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.9rem;
		display: inline-block;
		text-align: center;
		width: 40px;
	}
	.tier-s {
		background: linear-gradient(135deg, #FFD700, #B8860B);
		color: #000;
		box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
	}
	.tier-a {
		background: linear-gradient(135deg, #a855f7, #6b21a8);
		color: #fff;
	}
	.tier-b {
		background: linear-gradient(135deg, #3b82f6, #1e40af);
		color: #fff;
	}

	.winrate { color: #0acbe6; font-weight: 600; }
	.banrate { color: #64748b; }

	.trend-line {
		width: 60px;
		height: 20px;
		display: flex;
		align-items: flex-end;
		gap: 2px;
		opacity: 0.7;
	}
	.bar {
		width: 20%;
		background: #64748b;
		border-radius: 2px;
	}
	.bar.up { background: #0acbe6; }
	.bar.down { background: #e84057; }
</style>
