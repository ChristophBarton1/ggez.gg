<script>
	import { goto } from '$app/navigation';
	import { parseSummonerInput, getSummonerByRiotId } from '$lib/api/riot.js';
	import { onMount } from 'svelte';

	export let placeholder = 'Search Summoner (e.g. Zykonos #EUW)';
	export let showRegionSelector = true;
	export let compact = false;

	let summonerName = '';
	let region = 'EUW';
	let searching = false;
	let showSuggestions = false;
	let suggestions = [];
	let inputFocused = false;
	let recentSearches = [];
	let prefetchTimeout = null;
	const prefetchedProfiles = new Set(); // Track what we've prefetched

	onMount(() => {
		// Load recent searches from localStorage
		const stored = localStorage.getItem('recentSearches');
		if (stored) {
			recentSearches = JSON.parse(stored);
		}
	});

	$: {
		if (summonerName.length > 0 && inputFocused) {
			updateSuggestions(summonerName);
		} else if (inputFocused && summonerName.length === 0) {
			// Show recent searches or popular summoners
			showRecentOrPopular();
		} else {
			showSuggestions = false;
		}
	}

	function showRecentOrPopular() {
		suggestions = [];

		// Show recent searches only if available
		if (recentSearches.length > 0) {
			suggestions.push({
				header: 'Recent Searches',
				type: 'header'
			});
			recentSearches.slice(0, 5).forEach(search => {
				suggestions.push({
					text: `${search.name} #${search.tag}`,
					type: 'recent',
					label: search.region,
					icon: '🕐'
				});
			});
		}

		showSuggestions = suggestions.length > 0;
	}

	function updateSuggestions(input) {
		const parsed = parseSummonerInput(input);
		suggestions = [];

		// Filter recent searches by input
		const filtered = recentSearches.filter(s => 
			s.name.toLowerCase().includes(input.toLowerCase())
		);

		if (filtered.length > 0 && !input.includes('#')) {
			suggestions.push({
				header: 'Recent Searches',
				type: 'header'
			});
			filtered.slice(0, 3).forEach(search => {
				suggestions.push({
					text: `${search.name} #${search.tag}`,
					type: 'recent',
					label: search.region,
					icon: '🕐'
				});
			});
		}

		// Show format hints if no #
		if (!input.includes('#')) {
			suggestions.push({
				header: 'Add Region Tag',
				type: 'header'
			});
			suggestions.push(
				{ text: `${input} #${region}`, type: 'hint', label: `Current region (${region})`, icon: '🌍' },
				{ text: `${input} #EUW`, type: 'hint', label: 'Europe West', icon: '🌍' },
				{ text: `${input} #NA`, type: 'hint', label: 'North America', icon: '🌍' },
				{ text: `${input} #KR`, type: 'hint', label: 'Korea', icon: '🌍' }
			);
		} else if (parsed) {
			// Valid format
			suggestions.push({
				text: `${parsed.gameName} #${parsed.tagLine}`,
				type: 'valid',
				label: 'Press Enter to search',
				icon: '✓'
			});
		}

		showSuggestions = suggestions.length > 0;
	}

	function selectSuggestion(suggestion) {
		if (suggestion.type === 'header') return;
		summonerName = suggestion.text;
		showSuggestions = false;
		handleSearch();
	}

	function saveSearch(name, tag, region) {
		const search = { name, tag, region, timestamp: Date.now() };
		recentSearches = [search, ...recentSearches.filter(s => 
			!(s.name === name && s.tag === tag)
		)].slice(0, 10); // Keep last 10
		localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
	}

	// 🚀 PREDICTIVE PREFETCH: Load data when user hovers
	async function prefetchProfile(suggestion) {
		if (suggestion.type === 'header') return;
		
		const parsed = parseSummonerInput(suggestion.text);
		if (!parsed) return;
		
		const cacheKey = `${region}_${parsed.gameName}_${parsed.tagLine}`;
		
		// Already prefetched? Skip
		if (prefetchedProfiles.has(cacheKey)) {
			console.log('⚡ Already prefetched:', cacheKey);
			return;
		}
		
		// Check if already in cache
		const cached = localStorage.getItem('ggez_profile_' + cacheKey);
		if (cached) {
			console.log('⚡ Already cached:', cacheKey);
			prefetchedProfiles.add(cacheKey);
			return;
		}
		
		console.log('🚀 Prefetching:', parsed.gameName, '#', parsed.tagLine);
		prefetchedProfiles.add(cacheKey);
		
		// Fetch in background (don't await)
		getSummonerByRiotId(parsed.gameName, parsed.tagLine, region).catch(err => {
			console.warn('Prefetch failed:', err);
			prefetchedProfiles.delete(cacheKey);
		});
	}

	// 🎯 Smart hover detection - wait 150ms to avoid prefetching on quick mouse movements
	function handleSuggestionHover(suggestion) {
		clearTimeout(prefetchTimeout);
		prefetchTimeout = setTimeout(() => {
			prefetchProfile(suggestion);
		}, 150);
	}

	function handleSuggestionLeave() {
		clearTimeout(prefetchTimeout);
	}

	async function handleSearch() {
		if (!summonerName) return;
		
		searching = true;
		showSuggestions = false;

		const parsed = parseSummonerInput(summonerName);
		
		setTimeout(() => {
			if (parsed) {
				saveSearch(parsed.gameName, parsed.tagLine, region);
				goto(`/${region}/${encodeURIComponent(parsed.gameName)}/${encodeURIComponent(parsed.tagLine)}`);
			} else {
				saveSearch(summonerName, region, region);
				goto(`/${region}/${encodeURIComponent(summonerName)}/${region}`);
			}
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
		if (summonerName.length === 0) {
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
			bind:value={summonerName}
			on:keypress={handleKeyPress}
			on:focus={handleFocus}
			on:blur={handleBlur}
			{placeholder}
			class="search-input w-full {showRegionSelector ? 'pl-16 sm:pl-24' : 'pl-4 sm:pl-6'} pr-14 sm:pr-16 py-4 sm:py-5 md:py-6 text-center text-base sm:text-lg md:text-xl font-inter text-white glass-card border border-hex-gold/50 rounded-xl outline-none transition-all duration-500 placeholder:text-gray-600 placeholder:font-light placeholder:text-xs sm:placeholder:text-sm md:placeholder:text-base focus:border-hex-blue focus:shadow-neon focus:scale-[1.02] focus:bg-opacity-85"
		/>

		<button 
			on:click={handleSearch}
			disabled={searching}
			aria-label="Search summoner"
			class="search-btn absolute right-2 sm:right-3 z-20 bg-hex-blue w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-none rounded-lg transition-all duration-300 hover:bg-white hover:shadow-neon-strong disabled:opacity-50 disabled:cursor-not-allowed">
			<svg viewBox="0 0 24 24" class="w-5 h-5 sm:w-6 sm:h-6 fill-black">
				<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
			</svg>
		</button>
	</div>

	<!-- Auto-Suggest Dropdown -->
	{#if showSuggestions && suggestions.length > 0}
		<div class="absolute top-full mt-2 w-full glass-card border border-hex-gold/30 rounded-lg overflow-hidden z-[100] animate-fade-in-up shadow-2xl max-h-[400px] overflow-y-auto">
			{#each suggestions as suggestion, i}
				{#if suggestion.type === 'header'}
					<div class="px-4 py-2 text-xs uppercase text-hex-gold font-cinzel bg-hex-darker/50 sticky top-0 z-10">
						{suggestion.header}
					</div>
				{:else}
					<button
						on:click={() => selectSuggestion(suggestion)}
						on:mouseenter={() => handleSuggestionHover(suggestion)}
						on:mouseleave={handleSuggestionLeave}
						class="w-full px-6 py-3 text-left flex items-center justify-between hover:bg-hex-gold/10 transition-colors duration-200 border-b border-hex-gold/5 last:border-b-0 group"
					>
						<div class="flex items-center gap-3">
							<span class="text-lg">{suggestion.icon}</span>
							<span class="text-white font-inter text-base group-hover:text-hex-blue transition-colors">{suggestion.text}</span>
						</div>
						<span class="text-gray-500 text-xs">{suggestion.label}</span>
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>
