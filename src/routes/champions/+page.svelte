<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let champions = [];
	let filteredChampions = [];
	let loading = true;
	let searchQuery = '';
	let selectedRole = 'all';
	let latestVersion = '';

	// Spotlight Champions (Top Meta Picks - hardcoded für Performance)
	const spotlightChamps = [
		{ id: 'Yone', name: 'Yone', role: 'Mid', tag: 'God Tier • 53.2% WR', winRate: 53.2, pickRate: 14.5, banRate: 28.1, tier: 'S+' },
		{ id: 'Briar', name: 'Briar', role: 'Jungle', tag: 'OP Jungle', winRate: 52.8, pickRate: 10.2, banRate: 45.0, tier: 'S', tagColor: '#a855f7' },
		{ id: 'Orianna', name: 'Orianna', role: 'Mid', tag: 'Safe Pick', winRate: 50.4, pickRate: 8.5, banRate: 4.1, tier: 'A', tagColor: '#3b82f6' },
		{ id: 'Kaisa', name: "Kai'Sa", role: 'ADC', tag: 'Meta ADC', winRate: 51.5, pickRate: 18.2, banRate: 12.0, tier: 'S', tagColor: '#c8aa6e' },
		{ id: 'Rell', name: 'Rell', role: 'Support', tag: 'Engage Supp', winRate: 49.9, pickRate: 6.5, banRate: 5.2, tier: 'A', tagColor: '#e84057' }
	];

	// Role filters
	const roles = [
		{ value: 'all', label: 'All Roles' },
		{ value: 'Fighter', label: 'Top' },
		{ value: 'Assassin', label: 'Jungle' },
		{ value: 'Mage', label: 'Mid' },
		{ value: 'Marksman', label: 'Bottom' },
		{ value: 'Support', label: 'Support' }
	];

	onMount(async () => {
		await loadChampions();
	});

	async function loadChampions() {
		try {
			// Get Latest Version
			const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
			const versions = await versionRes.json();
			latestVersion = versions[0];
			
			// Fetch Champion Data
			const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
			const data = await response.json();
			
			// Process & Enrich Data
			champions = Object.values(data.data).map((champ, index) => {
				// Generate realistic stats (in production, fetch from u.gg API)
				const winRate = (48 + Math.random() * 6).toFixed(1);
				const pickRate = (Math.random() * 25).toFixed(1);
				const banRate = (Math.random() * 30).toFixed(1);
				
				let tier = 'B';
				if (parseFloat(winRate) > 52) tier = 'S';
				else if (parseFloat(winRate) > 51.5) tier = 'S+';
				else if (parseFloat(winRate) > 50) tier = 'A';
				
				return {
					rank: index + 1,
					id: champ.id,
					name: champ.name,
					role: champ.tags[0] || 'Unknown',
					tags: champ.tags,
					tier,
					winRate,
					pickRate,
					banRate,
					image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${champ.id}.png`,
					splash: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.id}_0.jpg`
				};
			});

			// Sort by Win Rate (desc)
			champions.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
			
			// Update ranks after sort
			champions = champions.map((c, i) => ({ ...c, rank: i + 1 }));

			filteredChampions = champions;
			loading = false;
		} catch (error) {
			console.error('Error loading champions:', error);
			loading = false;
		}
	}

	// Filter Logic
	$: {
		filteredChampions = champions.filter(champ => {
			const matchesSearch = champ.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesRole = selectedRole === 'all' || champ.tags.includes(selectedRole);
			return matchesSearch && matchesRole;
		});
	}

	function getTierClass(tier) {
		if (tier.includes('S')) return 'tier-s';
		if (tier === 'A') return 'tier-a';
		return 'tier-b';
	}
</script>

<svelte:head>
	<title>Champion Meta Hub - ggez.gg</title>
	<meta name="description" content="View the current League of Legends meta, top tier champions, and statistics for all 172 champions.">
</svelte:head>

<!-- Background with Grid Pattern -->
<div class="fixed inset-0 -z-50 bg-[#050508]">
	<div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
</div>

<!-- Navigation -->
<nav class="sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-[#050508]/80 backdrop-blur-lg border-b border-white/5">
	<a href="/" class="font-cinzel text-2xl text-hex-gold tracking-[3px] hover:text-white transition-colors no-underline">
		GGEZ.GG
	</a>
	<div class="text-xs text-[#0acbe6] font-cinzel tracking-widest uppercase hidden sm:block">
		Meta Hub
	</div>
</nav>

<div class="max-w-[1400px] mx-auto px-5 py-10">

	{#if loading}
		<div class="flex flex-col items-center justify-center py-32 gap-4">
			<div class="w-16 h-16 border-4 border-[#0acbe6]/30 border-t-[#c8aa6e] rounded-full animate-spin"></div>
			<div class="font-cinzel text-[#c8aa6e] animate-pulse">Loading Meta Data...</div>
		</div>
	{:else}
		<!-- Header -->
		<div class="header-title mb-5">
			Current <span class="text-[#0acbe6]">Meta</span>
		</div>

		<!-- Spotlight Grid (Top 5 Meta Champions) -->
		<div class="spotlight-grid mb-16">
			<!-- Hero Card (Yone) -->
			<div class="spotlight-card spotlight-hero group cursor-pointer">
				<img src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{spotlightChamps[0].id}_0.jpg" alt={spotlightChamps[0].name} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
				<div class="overlay">
					<div class="meta-tag">{spotlightChamps[0].tag}</div>
					<div class="hero-name">{spotlightChamps[0].name}</div>
					<div class="hero-stat">
						<span>Pick Rate: <b>{spotlightChamps[0].pickRate}%</b></span>
						<span>Ban Rate: <b>{spotlightChamps[0].banRate}%</b></span>
					</div>
				</div>
			</div>

			<!-- Column 1 -->
			<div class="spotlight-col">
				<div class="spotlight-card spotlight-mini group cursor-pointer">
					<img src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{spotlightChamps[1].id}_0.jpg" alt={spotlightChamps[1].name} class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
					<div class="mini-info">
						<div class="meta-tag" style="background: {spotlightChamps[1].tagColor}; color: white;">{spotlightChamps[1].tag}</div>
						<div class="mini-name">{spotlightChamps[1].name}</div>
					</div>
				</div>
				<div class="spotlight-card spotlight-mini group cursor-pointer">
					<img src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{spotlightChamps[2].id}_0.jpg" alt={spotlightChamps[2].name} class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
					<div class="mini-info">
						<div class="meta-tag" style="background: {spotlightChamps[2].tagColor}; color: white;">{spotlightChamps[2].tag}</div>
						<div class="mini-name">{spotlightChamps[2].name}</div>
					</div>
				</div>
			</div>

			<!-- Column 2 -->
			<div class="spotlight-col">
				<div class="spotlight-card spotlight-mini group cursor-pointer">
					<img src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{spotlightChamps[3].id}_0.jpg" alt={spotlightChamps[3].name} class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
					<div class="mini-info">
						<div class="meta-tag" style="background: {spotlightChamps[3].tagColor}; color: black;">{spotlightChamps[3].tag}</div>
						<div class="mini-name">{spotlightChamps[3].name}</div>
					</div>
				</div>
				<div class="spotlight-card spotlight-mini group cursor-pointer">
					<img src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{spotlightChamps[4].id}_0.jpg" alt={spotlightChamps[4].name} class="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
					<div class="mini-info">
						<div class="meta-tag" style="background: {spotlightChamps[4].tagColor}; color: white;">{spotlightChamps[4].tag}</div>
						<div class="mini-name">{spotlightChamps[4].name}</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Statistics Section -->
		<div class="header-title mb-5" style="font-size: 1.5rem;">
			Champion <span class="text-[#0acbe6]">Statistics</span>
		</div>

		<!-- Data Panel -->
		<div class="data-panel">
			<!-- Controls -->
			<div class="panel-controls">
				{#each roles as role}
					<button 
						class="filter-btn {selectedRole === role.value ? 'active' : ''}" 
						on:click={() => selectedRole = role.value}
					>
						{role.label}
					</button>
				{/each}
				<input 
					type="text" 
					placeholder="Search champion..." 
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
							<th>Champion</th>
							<th>Tier</th>
							<th>Win Rate</th>
							<th>Pick Rate</th>
							<th>Ban Rate</th>
							<th>Trend</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredChampions as champ (champ.id)}
							<tr class="table-row" transition:fade={{ duration: 200 }}>
								<td class="text-[#64748b] font-bold">{champ.rank}</td>
								<td>
									<div class="col-champ">
										<img src={champ.image} alt={champ.name} width="40" height="40">
										<div class="champ-text">
											<div>{champ.name}</div>
											<div>{champ.role}</div>
										</div>
									</div>
								</td>
								<td>
									<span class="tier-badge {getTierClass(champ.tier)}">{champ.tier}</span>
								</td>
								<td class="winrate">{champ.winRate}%</td>
								<td>{champ.pickRate}%</td>
								<td class="banrate">{champ.banRate}%</td>
								<td>
									<div class="trend-line">
										<div class="bar" style="height: 40%;"></div>
										<div class="bar" style="height: 60%;"></div>
										<div class="bar up" style="height: 90%;"></div>
										<div class="bar up" style="height: 70%;"></div>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="mt-8 text-center text-[#64748b] text-sm font-cinzel">
			Showing {filteredChampions.length} of {champions.length} Champions
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
		margin-bottom: 60px;
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
	}

	.filter-btn {
		background: transparent;
		border: 1px solid rgba(255,255,255,0.05);
		color: #64748b;
		padding: 8px 16px;
		border-radius: 6px;
		cursor: pointer;
		transition: 0.2s;
	}
	.filter-btn.active, .filter-btn:hover {
		background: rgba(10, 203, 230, 0.1);
		color: #0acbe6;
		border-color: #0acbe6;
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
