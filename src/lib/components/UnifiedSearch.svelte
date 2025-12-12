<script>
	import { goto } from '$app/navigation';
	import { parseSummonerInput } from '$lib/api/riot.js';
	import { championNameToId } from '$lib/data/metaStats.js';
	import { onMount } from 'svelte';

	export let placeholder = 'Search Summoner or Champion...';
	export let showRegionSelector = true;

	let searchQuery = '';
	let region = 'EUW';
	let searching = false;
	let showSuggestions = false;
	let suggestions = [];
	let inputFocused = false;
	let recentSearches = [];
	let latestVersion = '';

	onMount(async () => {
		// Load recent searches
		const stored = localStorage.getItem('recentSearches');
		if (stored) {
			recentSearches = JSON.parse(stored);
		}

		// Fetch DDragon version for champion images
		try {
			const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
			const versions = await res.json();
			latestVersion = versions[0];
		} catch (e) {
			latestVersion = '14.1.1';
		}
	});

	$: {
		if (searchQuery.length > 0 && inputFocused) {
			updateSuggestions(searchQuery);
		} else if (inputFocused && searchQuery.length === 0) {
			showRecentOrPopular();
		} else {
			showSuggestions = false;
		}
	}

	function showRecentOrPopular() {
		suggestions = [];

		if (recentSearches.length > 0) {
			suggestions.push({ header: 'Recent Searches', type: 'header' });
			recentSearches.slice(0, 5).forEach(search => {
				suggestions.push({
					text: `${search.name} #${search.tag}`,
					type: 'summoner-recent',
					label: search.region,
					icon: '🕐',
					data: search
				});
			});
		}

		showSuggestions = suggestions.length > 0;
	}

	function updateSuggestions(input) {
		suggestions = [];

		// Search Champions
		const championMatches = Object.entries(championNameToId)
			.filter(([name]) => name.toLowerCase().includes(input.toLowerCase()))
			.slice(0, 5)
			.map(([name, id]) => ({ name, id }));

		if (championMatches.length > 0) {
			suggestions.push({ header: 'Champions', type: 'header' });
			championMatches.forEach(champ => {
				suggestions.push({
					text: champ.name,
					type: 'champion',
					label: 'View Champion',
					icon: '🛡️',
					data: champ
				});
			});
		}

		// Search Summoners
		const parsed = parseSummonerInput(input);
		
		// Filter recent searches
		const filteredRecent = recentSearches.filter(s => 
			s.name.toLowerCase().includes(input.toLowerCase())
		);

		if (filteredRecent.length > 0 && !input.includes('#')) {
			suggestions.push({ header: 'Recent Summoners', type: 'header' });
			filteredRecent.slice(0, 3).forEach(search => {
				suggestions.push({
					text: `${search.name} #${search.tag}`,
					type: 'summoner-recent',
					label: search.region,
					icon: '🕐',
					data: search
				});
			});
		}

		// Show format hints if no #
		if (!input.includes('#') && championMatches.length === 0) {
			suggestions.push({ header: 'Search Summoner', type: 'header' });
			suggestions.push(
				{ text: `${input} #${region}`, type: 'summoner-hint', label: `Add region tag (${region})`, icon: '👤' },
				{ text: `${input} #EUW`, type: 'summoner-hint', label: 'Europe West', icon: '👤' },
				{ text: `${input} #NA`, type: 'summoner-hint', label: 'North America', icon: '👤' }
			);
		} else if (parsed) {
			suggestions.push({
				text: `${parsed.gameName} #${parsed.tagLine}`,
				type: 'summoner-valid',
				label: 'Search Summoner',
				icon: '✓',
				data: parsed
			});
		}

		showSuggestions = suggestions.length > 0;
	}

	function selectSuggestion(suggestion) {
		if (suggestion.type === 'header') return;
		
		if (suggestion.type === 'champion') {
			goto(`/champion/${suggestion.data.name}`);
			searchQuery = '';
			showSuggestions = false;
		} else {
			searchQuery = suggestion.text;
			showSuggestions = false;
			handleSearch();
		}
	}

	function saveSearch(name, tag, region) {
		const search = { name, tag, region, timestamp: Date.now() };
		recentSearches = [search, ...recentSearches.filter(s => 
			!(s.name === name && s.tag === tag)
		)].slice(0, 10);
		localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
	}

	async function handleSearch() {
		if (!searchQuery) return;
		
		// Check if it's a champion name
		const championMatch = Object.keys(championNameToId).find(
			name => name.toLowerCase() === searchQuery.toLowerCase().trim()
		);
		
		if (championMatch) {
			goto(`/champion/${championMatch}`);
			searchQuery = '';
			showSuggestions = false;
			return;
		}

		// Otherwise treat as summoner search
		searching = true;
		showSuggestions = false;

		const parsed = parseSummonerInput(searchQuery);
		
		setTimeout(() => {
			if (parsed) {
				saveSearch(parsed.gameName, parsed.tagLine, region);
				goto(`/${region}/${encodeURIComponent(parsed.gameName)}/${encodeURIComponent(parsed.tagLine)}`);
			} else {
				saveSearch(searchQuery, region, region);
				goto(`/${region}/${encodeURIComponent(searchQuery)}/${region}`);
			}
			searchQuery = '';
			searching = false;
		}, 300);
	}

	function handleKeyPress(e) {
		if (e.key === 'Enter') {
			handleSearch();
		} else if (e.key === 'Escape') {
			showSuggestions = false;
			inputFocused = false;
		}
	}

	function handleFocus() {
		inputFocused = true;
		if (searchQuery.length === 0) {
			showRecentOrPopular();
		}
	}

	function handleBlur() {
		setTimeout(() => {
			inputFocused = false;
			showSuggestions = false;
		}, 200);
	}
</script>

<div class="relative w-full">
	<div class="relative flex items-center">
		{#if showRegionSelector}
			<select 
				bind:value={region}
				id="region-select"
				aria-label="Select region"
				class="absolute left-2 sm:left-3 z-20 bg-transparent border-none text-hex-gold font-cinzel text-sm sm:text-base cursor-pointer px-1 sm:px-2 py-2 outline-none">
				<option value="EUW" class="bg-hex-dark">EUW</option>
				<option value="NA" class="bg-hex-dark">NA</option>
				<option value="KR" class="bg-hex-dark">KR</option>
				<option value="EUW1" class="bg-hex-dark">EUW1</option>
				<option value="BR1" class="bg-hex-dark">BR1</option>
				<option value="LA1" class="bg-hex-dark">LA1</option>
				<option value="LA2" class="bg-hex-dark">LA2</option>
				<option value="OC1" class="bg-hex-dark">OC1</option>
				<option value="RU" class="bg-hex-dark">RU</option>
				<option value="TR1" class="bg-hex-dark">TR1</option>
				<option value="JP1" class="bg-hex-dark">JP1</option>
			</select>
		{/if}

		<input 
			type="text" 
			bind:value={searchQuery}
			on:keypress={handleKeyPress}
			on:focus={handleFocus}
			on:blur={handleBlur}
			{placeholder}
			class="search-input w-full {showRegionSelector ? 'pl-16 sm:pl-24' : 'pl-4 sm:pl-6'} pr-14 sm:pr-16 py-4 sm:py-5 md:py-6 text-center text-base sm:text-lg md:text-xl font-inter text-white glass-card border border-hex-gold/50 rounded-xl outline-none transition-all duration-500 placeholder:text-gray-600 placeholder:font-light placeholder:text-xs sm:placeholder:text-sm md:placeholder:text-base focus:border-hex-blue focus:shadow-neon focus:scale-[1.02] focus:bg-opacity-85"
		/>

		<button 
			on:click={handleSearch}
			disabled={searching}
			aria-label="Search"
			class="search-btn absolute right-2 sm:right-3 z-20 bg-hex-blue w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-none rounded-lg transition-all duration-300 hover:bg-white hover:shadow-neon-strong disabled:opacity-50 disabled:cursor-not-allowed">
			<svg viewBox="0 0 24 24" class="w-5 h-5 sm:w-6 sm:h-6 fill-black">
				<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
			</svg>
		</button>
	</div>

	<!-- Auto-Suggest Dropdown -->
	{#if showSuggestions && suggestions.length > 0}
		<div class="absolute top-full mt-2 w-full glass-card border border-hex-gold/30 rounded-lg overflow-hidden z-[100] animate-fade-in-up shadow-2xl max-h-[400px] overflow-y-auto">
			{#each suggestions as suggestion}
				{#if suggestion.type === 'header'}
					<div class="px-4 py-2 text-xs uppercase text-hex-gold font-cinzel bg-hex-darker/50 sticky top-0 z-10">
						{suggestion.header}
					</div>
				{:else}
					<button
						on:click={() => selectSuggestion(suggestion)}
						class="w-full px-6 py-3 text-left flex items-center justify-between hover:bg-hex-gold/10 transition-colors duration-200 border-b border-hex-gold/5 last:border-b-0 group"
					>
						<div class="flex items-center gap-3">
							{#if suggestion.type === 'champion' && latestVersion}
								<img 
									src="https://ddragon.leagueoflegends.com/cdn/{latestVersion}/img/champion/{suggestion.data.name}.png"
									alt={suggestion.data.name}
									class="w-8 h-8 rounded border border-hex-gold/30"
								/>
							{:else}
								<span class="text-lg">{suggestion.icon}</span>
							{/if}
							<span class="text-white font-inter text-base group-hover:text-hex-blue transition-colors">{suggestion.text}</span>
						</div>
						<span class="text-gray-500 text-xs">{suggestion.label}</span>
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>
