<script>
	import { onMount } from 'svelte';
	import { optimizeRiotImage } from '$lib/utils/imageProxy.js';
	import { getChampionStats } from '$lib/data/metaStats.js';
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

	let champions = [];
	let filteredChampions = [];
	let loading = true;
	let searchQuery = '';
	let selectedRole = 'ALL';
	let latestVersion = '';
	let sortBy = 'winRate'; // Sort by Win Rate

	// Role filters - matching the screenshot
	const roles = [
		{ value: 'ALL', label: 'ALL', icon: '🌐' },
		{ value: 'FIGHTER', label: 'FIGHTER', icon: '⚔️' },
		{ value: 'MAGE', label: 'MAGE', icon: '🔮' },
		{ value: 'ASSASSIN', label: 'ASSASSIN', icon: '🗡️' },
		{ value: 'MARKSMAN', label: 'MARKSMAN', icon: '🎯' },
		{ value: 'SUPPORT', label: 'SUPPORT', icon: '🛡️' },
		{ value: 'TANK', label: 'TANK', icon: '🛡️' }
	];

	onMount(async () => {
		await loadChampions();
	});

	async function loadChampions() {
		try {
			loading = true;
			
			// Fetch latest version
			const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
			const versions = await versionRes.json();
			latestVersion = versions[0];
			
			// Fetch all champions data
			const champDataRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
			const champData = await champDataRes.json();
			
			// Build champions array with all data
			champions = Object.values(champData.data).map(champ => {
				// Get primary role (tags[0])
				const primaryRole = champ.tags[0]?.toUpperCase() || 'FIGHTER';
				
				// Get realistic meta stats
				const stats = getChampionStats(champ.name);
				
				return {
					id: champ.id,
					name: champ.name,
					title: champ.title,
					role: primaryRole,
					tags: champ.tags.map(t => t.toUpperCase()),
					winRate: stats.winRate,
					pickRate: stats.pickRate,
					tier: stats.tier,
					// Use centered splash art (loading screen art)
					splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champ.id}_0.jpg`,
					// Square icon as fallback
					icon: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${champ.id}.png`
				};
			});
			
			// Sort by Win Rate by default (descending)
			champions.sort((a, b) => b.winRate - a.winRate);
			
			filteredChampions = champions;
			loading = false;
			
		} catch (error) {
			console.error('❌ Error loading champions:', error);
			loading = false;
		}
	}

	// Filter champions by role and search
	$: {
		let result = champions;
		
		// Filter by role
		if (selectedRole !== 'ALL') {
			result = result.filter(champ => champ.tags.includes(selectedRole));
		}
		
		// Filter by search query
		if (searchQuery) {
			result = result.filter(champ => 
				champ.name.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
		
		filteredChampions = result;
	}

	function getWinRateColor(winRate) {
		const wr = parseFloat(winRate);
		if (wr >= 52) return '#10b981'; // Green (S-Tier)
		if (wr >= 50) return '#3b82f6'; // Blue (A-Tier)
		if (wr >= 48) return '#f59e0b'; // Orange (B-Tier)
		return '#ef4444'; // Red (C-Tier)
	}
</script>

<svelte:head>
	<title>Champions - ggez.gg</title>
	<meta name="description" content="League of Legends Champion Gallery with all 172 champions, their roles, and mastery statistics.">
</svelte:head>

<!-- Background with Grid Pattern -->
<div class="fixed inset-0 -z-50 bg-[#050508]">
	<div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
</div>

<div class="max-w-[1600px] mx-auto px-6 pt-28 pb-20 relative z-10">
	
	{#if loading}
		<!-- Loading State - Epic -->
		<div class="flex flex-col items-center justify-center min-h-[60vh] gap-6">
			<div class="relative">
				<div class="w-20 h-20 border-4 border-[#0acbe6]/20 border-t-[#c8aa6e] rounded-full animate-spin"></div>
				<div class="absolute inset-0 border-4 border-[#c8aa6e]/20 border-b-[#0acbe6] rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
			</div>
			<div class="font-cinzel text-2xl text-[#c8aa6e] tracking-[0.2em] animate-pulse text-shadow-gold">SUMMONING CHAMPIONS...</div>
		</div>
	{:else}
		
		<!-- Header - Epic -->
		<div class="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-8" in:fly={{ y: -30, duration: 800, easing: quintOut }}>
			<div class="relative">
				<div class="absolute -left-4 -top-4 w-20 h-20 bg-[#c8aa6e]/20 blur-xl rounded-full"></div>
				<h1 class="text-5xl md:text-6xl font-cinzel font-black text-white mb-2 tracking-wide relative z-10 drop-shadow-lg">
					CHAMPION <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#c8aa6e] to-[#f0e6d2]">GALLERY</span>
				</h1>
				<p class="text-gray-400 text-lg font-light tracking-wider flex items-center gap-2">
					<span class="w-2 h-2 bg-[#c8aa6e] rounded-full"></span>
					PATCH 14.23 SNAPSHOT
					<span class="w-2 h-2 bg-[#c8aa6e] rounded-full"></span>
				</p>
			</div>
			
			<!-- Stats Counter -->
			<div class="text-right hidden md:block">
				<div class="text-4xl font-bold text-white font-cinzel">{filteredChampions.length}</div>
				<div class="text-xs text-[#c8aa6e] tracking-[0.2em] uppercase">Champions Found</div>
			</div>
		</div>

		<!-- Controls Bar (Search + Filter) -->
		<div class="sticky top-20 z-40 bg-[#0a1428]/80 backdrop-blur-md border border-white/5 rounded-xl p-4 mb-10 shadow-2xl" in:fly={{ y: 20, duration: 800, delay: 200, easing: quintOut }}>
			<div class="flex flex-col md:flex-row gap-6 items-center justify-between">
				<!-- Search -->
				<div class="relative w-full md:w-96 group">
					<div class="absolute inset-0 bg-gradient-to-r from-[#c8aa6e] to-[#0acbe6] rounded-lg opacity-0 group-focus-within:opacity-20 transition-opacity blur"></div>
					<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#c8aa6e] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<input 
						type="text" 
						bind:value={searchQuery}
						placeholder="Search for a champion..."
						class="w-full pl-12 pr-4 py-3 bg-[#0f1923] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#c8aa6e]/50 focus:outline-none transition-all"
					/>
				</div>

				<!-- Role Filters -->
				<div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide w-full md:w-auto">
					{#each roles as role}
						<button
							on:click={() => selectedRole = role.value}
							class="role-filter-btn group"
							class:active={selectedRole === role.value}
						>
							<div class="absolute inset-0 bg-gradient-to-br from-[#c8aa6e]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
							<span class="text-lg relative z-10">{role.icon}</span>
							<span class="font-bold text-xs tracking-widest relative z-10">{role.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Champions Grid -->
		<div class="champions-grid">
			{#each filteredChampions as champion (champion.id)}
				<a 
					href="/champion/{champion.id}"
					class="champion-card group"
				>
					<!-- Champion Image -->
					<div class="champion-image-container">
						<img 
							src={champion.splash}
							alt={champion.name}
							class="champion-image"
							loading="lazy"
							on:error={(e) => { e.target.src = champion.icon; }}
						/>
						<div class="champion-overlay"></div>
						<!-- Hover Glow -->
						<div class="absolute inset-0 bg-gradient-to-t from-[#c8aa6e]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
						
						<!-- Tier Badge -->
						<div class="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur border border-white/10 rounded text-xs font-bold text-white">
							{champion.tier}-TIER
						</div>
					</div>
					
					<!-- Champion Info -->
					<div class="champion-info">
						<div class="flex justify-between items-start mb-1">
							<div class="champion-name">{champion.name}</div>
							<!-- Role Icon Mini -->
							<div class="text-[10px] text-gray-500 border border-white/10 px-1 rounded uppercase tracking-wider">{champion.role}</div>
						</div>
						<div class="champion-title">{champion.title}</div>
						
						<!-- Winrate Meter -->
						<div class="mt-3 flex items-center gap-2">
							<div class="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
								<div class="h-full rounded-full transition-all duration-500" 
									 style="width: {(champion.winRate - 40) * 5}%; background-color: {getWinRateColor(champion.winRate)}"></div>
							</div>
							<span class="text-[10px] font-bold" style="color: {getWinRateColor(champion.winRate)}">{champion.winRate}% WR</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
		
		{#if filteredChampions.length === 0}
			<div class="flex flex-col items-center justify-center py-32 text-gray-500">
				<div class="text-6xl mb-4 opacity-20">⚔️</div>
				<p class="text-2xl font-cinzel text-white mb-2">No Champions Found</p>
				<p class="text-sm">Try summoning another query.</p>
			</div>
		{/if}
		
	{/if}
</div>

<style>
	/* Role Filter Buttons - Epic */
	.role-filter-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.75rem 1.25rem;
		min-width: 80px;
		background: rgba(15, 25, 35, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}

	.role-filter-btn:hover {
		background: rgba(15, 25, 35, 0.8);
		border-color: rgba(200, 170, 110, 0.3);
		color: #c8aa6e;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.role-filter-btn.active {
		background: linear-gradient(135deg, rgba(200, 170, 110, 0.15), rgba(15, 25, 35, 0.8));
		border-color: #c8aa6e;
		color: #c8aa6e;
		box-shadow: 0 0 15px rgba(200, 170, 110, 0.15);
	}

	.text-shadow-gold {
		text-shadow: 0 0 10px rgba(200, 170, 110, 0.5);
	}

	/* Champions Grid - 7 columns like in screenshot */
	.champions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1.25rem;
	}

	@media (min-width: 1400px) {
		.champions-grid {
			grid-template-columns: repeat(6, 1fr);
		}
	}

	@media (max-width: 768px) {
		.champions-grid {
			grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
			gap: 0.75rem;
		}
	}

	/* Champion Card - Epic */
	.champion-card {
		position: relative;
		background: rgba(15, 20, 28, 0.6);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 1rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
	}

	.champion-card:hover {
		transform: translateY(-8px) scale(1.02);
		border-color: #c8aa6e;
		box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.6), 0 0 20px rgba(200, 170, 110, 0.2);
		z-index: 10;
	}

	/* Champion Image Container */
	.champion-image-container {
		position: relative;
		width: 100%;
		padding-top: 130%; /* Taller aspect ratio */
		overflow: hidden;
		background: #0f1923;
	}

	.champion-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
		filter: saturate(0.9);
	}

	.champion-card:hover .champion-image {
		transform: scale(1.1);
		filter: saturate(1.1);
	}

	.champion-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, transparent 40%, rgba(10, 20, 30, 0.95) 100%);
		opacity: 0.8;
		transition: opacity 0.3s;
	}

	/* Champion Info */
	.champion-info {
		padding: 1rem;
		position: relative;
		background: linear-gradient(to bottom, transparent, rgba(10, 20, 30, 0.8));
		margin-top: -3rem; /* Overlap image */
	}

	.champion-name {
		font-size: 1rem;
		font-weight: 800;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-shadow: 0 2px 4px rgba(0,0,0,0.8);
	}

	.champion-title {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-bottom: 0.5rem;
	}

	/* Hide scrollbar but keep functionality */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Loading animation */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
