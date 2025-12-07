<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let champions = [];
	let filteredChampions = [];
	let loading = true;
	let searchQuery = '';
	let selectedTag = 'all';
	let selectedDifficulty = 'all';
	let scrollY = 0;

	// Tag filters (Standard Riot Classes)
	const tags = [
		{ value: 'all', label: 'All', icon: '💠' },
		{ value: 'Fighter', label: 'Fighter', icon: '⚔️' },
		{ value: 'Tank', label: 'Tank', icon: '🛡️' },
		{ value: 'Mage', label: 'Mage', icon: '✨' },
		{ value: 'Assassin', label: 'Assassin', icon: '🗡️' },
		{ value: 'Marksman', label: 'Marksman', icon: '🏹' },
		{ value: 'Support', label: 'Support', icon: '💚' }
	];

	// Difficulty mapping
	const difficultyMap = {
		1: 'Easy', 2: 'Easy', 3: 'Easy',
		4: 'Medium', 5: 'Medium', 6: 'Medium',
		7: 'Hard', 8: 'Hard', 9: 'Severe', 10: 'Severe'
	};

	onMount(async () => {
		await loadChampions();
	});

	async function loadChampions() {
		try {
			// 1. Get Latest Version dynamically
			const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
			const versions = await versionRes.json();
			const latestVersion = versions[0];
			
			// 2. Fetch Data
			const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
			const data = await response.json();
			
			// 3. Process Data
			champions = Object.values(data.data).map(champ => ({
				id: champ.id, // Important: Use ID for images (e.g. 'MonkeyKing' not 'Wukong')
				name: champ.name,
				title: champ.title,
				tags: champ.tags,
				info: champ.info,
				difficulty: difficultyMap[champ.info.difficulty] || 'Medium',
				image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${champ.id}.png`
			}));

			// Sort alphabetically
			champions.sort((a, b) => a.name.localeCompare(b.name));

			filteredChampions = champions;
			loading = false;
		} catch (error) {
			console.error('Error loading champions:', error);
			loading = false;
		}
	}

	// Image Error Fallback (fixes broken new champs)
	function handleImageError(e) {
		e.target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png';
		e.target.classList.add('opacity-50', 'grayscale');
	}

	// Filter Logic
	$: {
		filteredChampions = champions.filter(champ => {
			const matchesSearch = champ.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTag = selectedTag === 'all' || champ.tags.includes(selectedTag);
			const matchesDifficulty = selectedDifficulty === 'all' || champ.difficulty === selectedDifficulty;
			return matchesSearch && matchesTag && matchesDifficulty;
		});
	}
</script>

<svelte:window bind:scrollY />

<svelte:head>
	<title>All Champions - ggez.gg</title>
	<meta name="description" content="Browse all League of Legends champions with stats, builds and guides.">
</svelte:head>

<!-- Background Ambience -->
<div class="fixed inset-0 -z-50 bg-[#050a14]">
	<div class="absolute inset-0 bg-gradient-to-b from-[#091428] via-[#0a1428] to-[#050a14]"></div>
	<!-- Hextech Glows -->
	<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-hex-blue/5 rounded-full blur-[120px]"></div>
</div>

<!-- Navigation (Simplified for this view) -->
<nav class="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between transition-all duration-300 {scrollY > 20 ? 'bg-[#091428]/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}">
	<a href="/" class="font-cinzel text-2xl text-hex-gold tracking-[3px] hover:text-white transition-colors drop-shadow-lg no-underline">
		GGEZ.GG
	</a>
	<div class="text-xs text-hex-blue/80 font-cinzel tracking-widest uppercase hidden sm:block">
		Champion Database
	</div>
</nav>

<div class="min-h-screen pt-24 pb-20 px-4 sm:px-8 max-w-[1800px] mx-auto">

	<!-- Hero Header -->
	<div class="text-center mb-12 sm:mb-16 relative">
		<h1 class="font-cinzel text-5xl sm:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-[#f0e6d2] to-[#c8aa6e] mb-4 tracking-wider drop-shadow-sm">
			ROSTER
		</h1>
		<div class="flex items-center justify-center gap-4 text-sm tracking-widest text-hex-blue/60 font-cinzel">
			<span class="h-[1px] w-12 bg-hex-blue/30"></span>
			<span>{champions.length} CHAMPIONS AVAILABLE</span>
			<span class="h-[1px] w-12 bg-hex-blue/30"></span>
		</div>
	</div>

	<!-- Sticky Control Bar -->
	<div class="sticky top-20 z-40 mb-10 transition-all duration-300 {scrollY > 100 ? '-translate-y-2' : ''}">
		<div class="glass-panel border border-white/10 rounded-2xl p-2 sm:p-3 shadow-2xl backdrop-blur-xl bg-[#091428]/80 flex flex-col md:flex-row gap-3 items-center justify-between max-w-5xl mx-auto ring-1 ring-white/5">
			
			<!-- Search -->
			<div class="relative w-full md:w-80 group">
				<div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 group-focus-within:text-hex-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Find a champion..."
					class="w-full bg-[#050a14]/60 border border-white/10 text-white text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-hex-gold/50 focus:ring-1 focus:ring-hex-gold/20 transition-all placeholder-gray-600"
				/>
			</div>

			<!-- Role Filters -->
			<div class="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
				{#each tags as tag}
					<button
						on:click={() => selectedTag = tag.value}
						class="flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap
						{selectedTag === tag.value 
							? 'bg-gradient-to-r from-hex-gold/20 to-hex-gold/10 text-hex-gold border border-hex-gold/30 shadow-[0_0_15px_rgba(200,170,110,0.1)]' 
							: 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}"
					>
						<span>{tag.icon}</span>
						<span>{tag.label}</span>
					</button>
				{/each}
			</div>

			<!-- Difficulty (Desktop only) -->
			<div class="hidden lg:block border-l border-white/10 pl-3 ml-2">
				<select
					bind:value={selectedDifficulty}
					class="bg-transparent text-gray-400 text-sm focus:outline-none cursor-pointer hover:text-white transition-colors"
				>
					<option value="all">Any Difficulty</option>
					<option value="Easy">Easy</option>
					<option value="Medium">Medium</option>
					<option value="Hard">Hard</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Results Grid -->
	{#if loading}
		<div class="flex flex-col items-center justify-center py-32 gap-4">
			<div class="w-16 h-16 border-4 border-hex-blue/30 border-t-hex-gold rounded-full animate-spin"></div>
			<div class="font-cinzel text-hex-gold animate-pulse">Summoning Champions...</div>
		</div>
	{:else if filteredChampions.length === 0}
		<div class="text-center py-32" in:fade>
			<div class="text-6xl mb-4 opacity-50">🌑</div>
			<h2 class="font-cinzel text-2xl text-white mb-2">No Champions Found</h2>
			<p class="text-gray-500">The void is empty. Try different filters.</p>
		</div>
	{:else}
		<div class="grid grid-cols-3 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-2 sm:gap-3 md:gap-4 px-1">
			{#each filteredChampions as champion, i (champion.id)}
				<div 
					class="group relative aspect-square bg-[#0c1626] rounded-xl overflow-hidden border border-[#1c2738] hover:border-hex-gold/50 hover:shadow-[0_0_20px_rgba(200,170,110,0.2)] hover:z-10 transition-all duration-300 cursor-pointer"
					in:fly={{ y: 20, duration: 400, delay: i < 20 ? i * 30 : 0 }}
				>
					<!-- Image -->
					<img 
						src={champion.image}
						alt={champion.name}
						width="120"
						height="120"
						on:error={handleImageError}
						loading={i < 24 ? 'eager' : 'lazy'}
						decoding="async"
						class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
					/>
					
					<!-- Inner Shadow / Vignette -->
					<div class="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none"></div>

					<!-- Hover Overlay (Gradient) -->
					<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

					<!-- Name Label -->
					<div class="absolute bottom-0 left-0 right-0 p-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
						<div class="text-[10px] sm:text-xs text-center font-bold text-[#f0e6d2] uppercase tracking-wide truncate drop-shadow-md group-hover:text-hex-gold">
							{champion.name}
						</div>
						<!-- Role Text (Visible on Hover) -->
						<div class="h-0 group-hover:h-auto overflow-hidden opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75">
							<div class="text-[9px] text-hex-blue text-center mt-0.5 font-medium tracking-wider uppercase">
								{champion.tags[0]}
							</div>
						</div>
					</div>
					
					<!-- Active Ring Effect -->
					<div class="absolute inset-0 border border-hex-gold/0 group-hover:border-hex-gold/30 rounded-xl transition-all duration-500 pointer-events-none"></div>
				</div>
			{/each}
		</div>
		
		<div class="mt-12 text-center text-gray-600 text-xs font-cinzel tracking-wider">
			Showing {filteredChampions.length} Champions
		</div>
	{/if}
</div>

<style>
	/* Custom Scrollbar hide for filter bar */
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	/* Glass Panel Utility */
	.glass-panel {
		background: linear-gradient(180deg, rgba(15, 25, 45, 0.7) 0%, rgba(9, 15, 30, 0.8) 100%);
		box-shadow: 
			0 4px 30px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}
</style>
