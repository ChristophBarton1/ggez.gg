<script>
	import { onMount } from 'svelte';

	let champions = [];
	let filteredChampions = [];
	let loading = true;
	let searchQuery = '';
	let selectedTag = 'all';
	let selectedDifficulty = 'all';

	// Tag filters (based on actual Riot tags)
	const tags = [
		{ value: 'all', label: 'All Classes', icon: '🎮' },
		{ value: 'Fighter', label: 'Fighter', icon: '⚔️' },
		{ value: 'Tank', label: 'Tank', icon: '🛡️' },
		{ value: 'Mage', label: 'Mage', icon: '✨' },
		{ value: 'Assassin', label: 'Assassin', icon: '🗡️' },
		{ value: 'Marksman', label: 'Marksman', icon: '🏹' },
		{ value: 'Support', label: 'Support', icon: '💚' }
	];

	// Difficulty mapping
	const difficultyMap = {
		1: 'Easy',
		2: 'Easy',
		3: 'Easy',
		4: 'Average',
		5: 'Average',
		6: 'Average',
		7: 'Hard',
		8: 'Hard',
		9: 'Severe',
		10: 'Severe'
	};

	const difficultyColors = {
		'Easy': 'text-green-400',
		'Average': 'text-yellow-400',
		'Hard': 'text-orange-400',
		'Severe': 'text-red-400'
	};

	onMount(async () => {
		await loadChampions();
	});

	async function loadChampions() {
		try {
			// Use latest version for accurate champion count
			const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
			const versions = await versionRes.json();
			const latestVersion = versions[0];
			
			const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
			const data = await response.json();
			
			champions = Object.values(data.data).map(champ => ({
				id: champ.id,
				name: champ.name,
				title: champ.title,
				tags: champ.tags,
				info: champ.info,
				difficulty: difficultyMap[champ.info.difficulty] || 'Average'
			}));

			filteredChampions = champions;
			loading = false;
		} catch (error) {
			console.error('Error loading champions:', error);
			loading = false;
		}
	}

	// Get optimized champion image URL via CDN proxy (faster, sharper, cached)
	function getChampionTileUrl(championId) {
		// Use wsrv.nl CDN for optimized, cached images (WebP support, auto-resize)
		const riotUrl = `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/champion/${championId}.png`;
		return `https://wsrv.nl/?url=${encodeURIComponent(riotUrl)}&w=200&h=200&output=webp&q=85`;
	}

	// Filter champions based on search and filters
	$: {
		filteredChampions = champions.filter(champ => {
			const matchesSearch = champ.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTag = selectedTag === 'all' || champ.tags.includes(selectedTag);
			const matchesDifficulty = selectedDifficulty === 'all' || champ.difficulty === selectedDifficulty;
			
			return matchesSearch && matchesTag && matchesDifficulty;
		});
	}
</script>

<svelte:head>
	<title>All Champions - ggez.gg</title>
	<meta name="description" content="Browse all League of Legends champions with stats, builds and guides.">
</svelte:head>

<!-- Dynamic Background -->
<div class="hero-bg fixed inset-0 -z-50 bg-gradient-to-b from-hex-darker via-black to-hex-darker"></div>

<!-- Navigation -->
<nav class="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 backdrop-blur-xl border-b border-hex-gold/30 bg-hex-darker/95">
	<a href="/" class="font-cinzel text-2xl text-hex-gold tracking-[2px] no-underline hover:text-white transition-colors">
		GGEZ.GG
	</a>
</nav>

<div class="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
	
	<!-- Header -->
	<div class="text-center mb-8 sm:mb-12">
		<h1 class="font-cinzel text-4xl sm:text-5xl md:text-6xl text-white mb-4 tracking-wider">
			All League of Legends Champions
		</h1>
		<p class="text-gray-400 text-lg sm:text-xl">
			There are <span class="text-hex-gold font-bold">{champions.length} champions</span> in LoL
		</p>
	</div>

	<!-- Filters & Search -->
	<div class="glass-card border border-hex-gold/30 rounded-xl p-4 sm:p-6 mb-8 sm:mb-12">
		<div class="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
			
			<!-- Search -->
			<div class="flex-1">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by champion name..."
					class="w-full px-4 py-3 bg-hex-dark/50 border border-hex-gold/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-hex-blue transition-colors"
				/>
			</div>

			<!-- Class Filter -->
			<div class="flex gap-2 flex-wrap lg:flex-nowrap">
				{#each tags as tag}
					<button
						on:click={() => selectedTag = tag.value}
						class="px-3 py-2 rounded-lg border transition-all text-sm {selectedTag === tag.value 
							? 'bg-hex-gold text-black border-hex-gold' 
							: 'bg-hex-dark/50 text-gray-300 border-hex-gold/30 hover:border-hex-gold/50'}"
					>
						<span class="mr-1">{tag.icon}</span>
						<span class="hidden sm:inline">{tag.label}</span>
					</button>
				{/each}
			</div>

			<!-- Difficulty Filter -->
			<select
				bind:value={selectedDifficulty}
				class="px-4 py-3 bg-hex-dark/50 border border-hex-gold/30 rounded-lg text-white focus:outline-none focus:border-hex-blue transition-colors cursor-pointer"
			>
				<option value="all">All Difficulties</option>
				<option value="Easy">Easy</option>
				<option value="Average">Average</option>
				<option value="Hard">Hard</option>
				<option value="Severe">Severe</option>
			</select>
		</div>

		<!-- Results Count -->
		<div class="mt-4 text-center text-gray-400 text-sm">
			Showing <span class="text-hex-blue font-semibold">{filteredChampions.length}</span> champion{filteredChampions.length !== 1 ? 's' : ''}
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="text-hex-blue text-2xl font-cinzel animate-pulse">Loading Champions...</div>
		</div>
	{:else if filteredChampions.length === 0}
		<div class="text-center py-20">
			<div class="text-6xl mb-4">🔍</div>
			<h2 class="font-cinzel text-2xl text-white mb-2">No Champions Found</h2>
			<p class="text-gray-400">Try adjusting your filters or search query</p>
		</div>
	{:else}
		<!-- Champions Grid -->
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
			{#each filteredChampions as champion, i}
				<div class="champion-card group" style="--index: {i}">
					<div class="relative aspect-square glass-card border border-white/10 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:border-hex-gold hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
							<!-- Champion Image (CDN optimized, WebP, cached) -->
						<img 
							src={getChampionTileUrl(champion.id)}
							alt={champion.name}
							width="200"
							height="200"
							loading={i < 12 ? 'eager' : 'lazy'}
							decoding="async"
							fetchpriority={i < 6 ? 'high' : 'auto'}
							class="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
						/>
						
						<!-- Gradient Overlay -->
						<div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

						<!-- Difficulty Badge -->
						<div class="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10">
							<span class="text-xs {difficultyColors[champion.difficulty]} font-semibold">
								{champion.difficulty}
							</span>
						</div>

						<!-- Role Tags -->
						<div class="absolute top-2 left-2 flex gap-1">
							{#each champion.tags.slice(0, 2) as tag}
								<span class="px-2 py-1 bg-hex-blue/80 backdrop-blur-sm rounded text-[10px] text-white font-semibold uppercase">
									{tag}
								</span>
							{/each}
						</div>

						<!-- Champion Info -->
						<div class="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
							<h3 class="font-cinzel text-sm sm:text-base text-white mb-0.5 truncate leading-tight">
								{champion.name}
							</h3>
							<p class="text-[10px] sm:text-xs text-gray-400 truncate">
								{champion.title}
							</p>
						</div>

						<!-- Hover Overlay -->
						<div class="absolute inset-0 bg-gradient-to-t from-hex-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	select {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23C8AA6E' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 0.5rem center;
		background-repeat: no-repeat;
		background-size: 1.5em 1.5em;
		padding-right: 2.5rem;
		appearance: none;
	}

	.champion-card {
		animation: fadeInUp 0.4s ease forwards;
		opacity: 0;
	}

	.champion-card {
		animation-delay: calc(0.02s * var(--index, 0));
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
