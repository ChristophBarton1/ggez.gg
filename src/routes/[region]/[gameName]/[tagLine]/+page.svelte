<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getSummonerByRiotId, getMatchHistory, analyzeChampionPerformance, analyzeChampionLPGains } from '$lib/api/riot.js';
	import SummonerSearch from '$lib/components/SummonerSearch.svelte';
	import MatchAIChat from '$lib/components/MatchAIChat.svelte';
	import ChampionPerformanceChart from '$lib/components/ChampionPerformanceChart.svelte';
	import LPGainsByChampion from '$lib/components/LPGainsByChampion.svelte';
	import LiveGameTab from '$lib/components/LiveGameTab.svelte';
	import { getChampionSplashSrcset, getChampionSplash, getItemIcon, getProfileIcon } from '$lib/utils/imageProxy.js';
	import { getRankEmblem, getChampionIcon } from '$lib/utils/imageOptimizer.js';

	// Route params - reactive
	$: region = $page.params.region;
	$: gameName = decodeURIComponent($page.params.gameName);
	$: tagLine = decodeURIComponent($page.params.tagLine);

	let summoner = null;
	let matches = [];
	let allMatches = []; // For LP stats (100+ matches)
	let championPerformance = [];
	let championLPGains = [];
	let loading = true;
	let refreshing = false; // Background refresh indicator
	let loadingLPStats = false;
	let loadingFullSeason = false;
	let lpStatsLoaded = false; // Track if LP stats have been loaded
	let error = null;
	let currentBgImage = '';
	
	// AI Coach state
	let selectedMatch = null;
	let aiChatOpen = false;
	
	// Tab state
	let activeTab = 'matchHistory';
	
	// Track which data has been loaded
	let championStatsCalculated = false;
	
	// Watch for tab changes to load data on demand
	$: if (activeTab === 'championStats' && !championStatsCalculated && matches.length > 0 && summoner) {
		championPerformance = analyzeChampionPerformance(matches, summoner.puuid);
		championStatsCalculated = true;
	}
	
	$: if (activeTab === 'lpGains' && !lpStatsLoaded && summoner) {
		loadLPStatistics(summoner.puuid, region);
		lpStatsLoaded = true;
	}
	
	// Match History pagination
	let matchHistoryLimit = 7;
	let loadingMoreMatches = false;
	let maxMatchesLoaded = 20; // Current max loaded

	// Reactive: Load data when params change
	$: if (gameName && tagLine && region) {
		loadSummonerData(gameName, tagLine, region);
	}

	// 🚀 INSTANT LOADING: Multi-layer cache strategy
	const memoryCache = new Map(); // L1: In-memory (fastest)
	const CACHE_KEY_PREFIX = 'ggez_profile_';
	const CACHE_DURATION_FRESH = 2 * 60 * 1000; // 2 min = fresh
	const CACHE_DURATION_STALE = 10 * 60 * 1000; // 10 min = usable
	
	// 🚀 Load from LocalStorage (L2 cache)
	function loadFromLocalStorage(cacheKey) {
		try {
			const cached = localStorage.getItem(CACHE_KEY_PREFIX + cacheKey);
			if (cached) {
				return JSON.parse(cached);
			}
		} catch (e) {
			console.warn('LocalStorage read error:', e);
		}
		return null;
	}
	
	// 💾 Save to LocalStorage
	function saveToLocalStorage(cacheKey, data) {
		try {
			localStorage.setItem(CACHE_KEY_PREFIX + cacheKey, JSON.stringify(data));
		} catch (e) {
			console.warn('LocalStorage write error (quota?):', e);
		}
	}
	
	// ⚡ INSTANT: Optimistic UI with stale-while-revalidate
	async function loadSummonerData(name, tag, reg) {
		const cacheKey = `${reg}_${name}_${tag}`;
		let showedStaleData = false;
		
		// 🚀 PHASE 1: Check L1 cache (memory) - INSTANT!
		if (memoryCache.has(cacheKey)) {
			const cached = memoryCache.get(cacheKey);
			const age = Date.now() - cached.timestamp;
			
			// Fresh data? Show immediately, no loading!
			if (age < CACHE_DURATION_FRESH) {
				console.log('⚡ INSTANT: Memory cache (fresh)');
				summoner = cached.summoner;
				matches = cached.matches;
				maxMatchesLoaded = cached.matches.length;
				if (cached.bgImage) currentBgImage = cached.bgImage;
				loading = false;
				return; // Done! No API call needed
			}
			
			// Stale but usable? Show immediately, refresh in background!
			if (age < CACHE_DURATION_STALE) {
				console.log('⚡ INSTANT: Showing stale data, refreshing in background...');
				summoner = cached.summoner;
				matches = cached.matches;
				maxMatchesLoaded = cached.matches.length;
				if (cached.bgImage) currentBgImage = cached.bgImage;
				loading = false; // ← NO LOADING STATE!
				refreshing = true; // Show subtle refresh indicator
				showedStaleData = true;
				// Continue to fetch fresh data below...
			}
		}
		
		// 🚀 PHASE 2: Check L2 cache (localStorage) - Still fast!
		if (!showedStaleData && !summoner) {
			const localData = loadFromLocalStorage(cacheKey);
			if (localData) {
				const age = Date.now() - localData.timestamp;
				
				if (age < CACHE_DURATION_STALE) {
					console.log('⚡ INSTANT: LocalStorage cache');
					summoner = localData.summoner;
					matches = localData.matches;
					maxMatchesLoaded = localData.matches.length;
					if (localData.bgImage) currentBgImage = localData.bgImage;
					loading = false;
					refreshing = true;
					showedStaleData = true;
					// Continue to refresh...
				}
			}
		}
		
		// 📡 PHASE 3: Fetch fresh data (only if no cache OR refreshing stale)
		if (!showedStaleData) {
			loading = true; // Only show loading if no cached data
		}
		
		error = null;
		matchHistoryLimit = 7;
		lpStatsLoaded = false;
		championStatsCalculated = false;
		
		try {
			// Fetch fresh data
			const summonerData = await getSummonerByRiotId(name, tag, reg);
			
			if (summonerData.error) {
				// If we showed stale data, keep it; otherwise show error
				if (!showedStaleData) {
					error = summonerData.error;
					loading = false;
				}
				return;
			}

			// Fetch matches
			const matchData = await getMatchHistory(summonerData.puuid, reg, 5);

			// Background image (Full HD for sharp display!)
			let bgImage = '';
			if (matchData.length > 0) {
				const firstMatch = matchData[0];
				const participant = firstMatch.info.participants.find(p => p.puuid === summonerData.puuid);
				if (participant) {
					// Use 'large' (1200px) for sharp backgrounds!
					bgImage = getChampionSplash(participant.championName, 'large');
				}
			}
			
			const cacheData = {
				summoner: summonerData,
				matches: matchData,
				bgImage,
				timestamp: Date.now()
			};
			
			// Update both caches
			memoryCache.set(cacheKey, cacheData);
			saveToLocalStorage(cacheKey, cacheData);
			
			// Update UI with fresh data
			summoner = summonerData;
			matches = matchData;
			maxMatchesLoaded = matchData.length;
			if (bgImage) currentBgImage = bgImage;
			
			if (showedStaleData) {
				console.log('✅ Background refresh complete');
				refreshing = false;
			} else {
				console.log('⚡ Fresh data loaded');
			}

		} catch (err) {
			console.error('Load error:', err);
			if (!showedStaleData) {
				error = err.message;
			}
		}
		
		loading = false;
	}

	async function loadLPStatistics(puuid, reg) {
		loadingLPStats = true;
		
		// Strategy: Load matches progressively to avoid rate limits
		// Start with 100, then optionally load more in the background
		console.log('Loading extended match data for LP statistics...');
		
		// Initial load: 100 matches (covers ~2-3 weeks of active play)
		let extendedMatches = await getMatchHistory(puuid, reg, 100);
		
		console.log(`Loaded ${extendedMatches.length} matches for LP statistics`);
		
		allMatches = extendedMatches;
		
		// Calculate LP gains with extended data
		if (extendedMatches.length > 0) {
			championLPGains = analyzeChampionLPGains(extendedMatches, puuid);
			console.log('LP Statistics calculated with', extendedMatches.length, 'matches');
		}
		
		loadingLPStats = false;
		
		// Optional: Load even more data in background for full season (200+ matches)
		// This happens after initial data is shown to user
		loadFullSeasonData(puuid, reg);
	}

	async function loadFullSeasonData(puuid, reg) {
		// Wait 3 seconds before loading more to spread out API requests
		await new Promise(resolve => setTimeout(resolve, 3000));
		
		loadingFullSeason = true;
		console.log('Loading full season data in background...');
		
		// Load up to 200 matches for comprehensive season stats
		const fullSeasonMatches = await getMatchHistory(puuid, reg, 200);
		
		if (fullSeasonMatches.length > allMatches.length) {
			console.log(`Extended to ${fullSeasonMatches.length} matches for full season data`);
			allMatches = fullSeasonMatches;
			
			// Recalculate LP gains with full season data
			championLPGains = analyzeChampionLPGains(fullSeasonMatches, puuid);
		}
		
		loadingFullSeason = false;
	}

	function handleMatchHover(match) {
		const participant = match.info.participants.find(p => p.puuid === summoner.puuid);
		if (participant) {
			// Use 'large' (1200px) for sharp backgrounds!
			currentBgImage = getChampionSplash(participant.championName, 'large');
		}
	}

	function getRankedData(type = 'RANKED_SOLO_5x5') {
		if (!summoner?.ranked) return null;
		return summoner.ranked.find(r => r.queueType === type);
	}

	function getQueueName(queueType) {
		const names = {
			'RANKED_SOLO_5x5': 'Ranked Solo/Duo',
			'RANKED_FLEX_SR': 'Ranked Flex',
			'RANKED_FLEX_TT': 'Ranked Flex 3v3'
		};
		return names[queueType] || queueType;
	}

	function getTierIcon(tier) {
		// ⚡ Use optimized WebP version (256px, ~70% smaller!)
		return getRankEmblem(tier, 256);
	}

	function formatKDA(kills, deaths, assists) {
		const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
		return kda.toFixed(1);
	}

	function getQueueTypeName(queueId) {
		const queueTypes = {
			420: 'Ranked Solo',
			440: 'Ranked Flex',
			400: 'Normal Draft',
			430: 'Normal Blind',
			450: 'ARAM',
			700: 'Clash',
			900: 'URF',
			1020: 'One For All',
			1300: 'Nexus Blitz',
			1700: 'Arena'
		};
		return queueTypes[queueId] || 'Custom Game';
	}

	function openAICoach(match) {
		selectedMatch = match;
		aiChatOpen = true;
	}

	async function loadMoreMatches() {
		if (loadingMoreMatches || !summoner) return;
		
		loadingMoreMatches = true;
		
		// Load more matches for match history display (e.g., next 50)
		const newCount = maxMatchesLoaded + 50;
		const newMatches = await getMatchHistory(summoner.puuid, region, newCount);
		
		matches = newMatches;
		maxMatchesLoaded = newCount;
		
		// Update champion performance chart with new data if it was already calculated
		if (matches.length > 0 && championStatsCalculated) {
			championPerformance = analyzeChampionPerformance(matches, summoner.puuid);
		}
		
		// Note: LP gains already uses allMatches (100 matches) so no need to recalculate
		
		loadingMoreMatches = false;
	}

	function showMoreMatchHistory() {
		matchHistoryLimit = matches.length;
	}
</script>

<svelte:head>
	<title>{gameName} #{tagLine} - ggez.gg</title>
	<meta name="description" content="View detailed League of Legends stats, match history, and performance analytics for {gameName} #{tagLine}. Track KDA, win rate, champion mastery and more.">
	
	<!-- ⚡ PERFORMANCE: Preconnect to CDNs -->
	<link rel="preconnect" href="https://ddragon.leagueoflegends.com" crossorigin>
	<link rel="preconnect" href="https://raw.communitydragon.org" crossorigin>
	<link rel="dns-prefetch" href="https://ddragon.leagueoflegends.com">
	<link rel="dns-prefetch" href="https://raw.communitydragon.org">
	
	<!-- ⚡ PERFORMANCE: Preload LCP-critical rank emblems (optimized WebP!) -->
	<link rel="preload" as="image" href={getRankEmblem('diamond', 256)} fetchpriority="high" type="image/webp">
	<link rel="preload" as="image" href={getRankEmblem('emerald', 256)} fetchpriority="high" type="image/webp">
	<link rel="preload" as="image" href={getRankEmblem('platinum', 256)} type="image/webp">
</svelte:head>

<!-- Dynamic Background -->
<div class="hero-bg" style="background-image: url('{currentBgImage}');"></div>
<div class="overlay"></div>

<!-- Navigation -->
<nav class="sticky top-0 z-50 flex flex-col sm:grid sm:grid-cols-[150px_1fr_150px] md:grid-cols-[200px_1fr_200px] items-center gap-3 sm:gap-0 px-4 sm:px-6 md:px-10 py-3 sm:py-5 backdrop-blur-xl border-b border-hex-gold/30 bg-hex-darker/95">
	<div class="flex items-center gap-2">
		<a href="/" class="font-cinzel text-xl sm:text-2xl text-hex-gold tracking-[1px] sm:tracking-[2px] no-underline hover:text-white transition-colors">
			EASY GAME
		</a>
		{#if refreshing}
			<div class="flex items-center gap-1 text-hex-blue text-xs animate-pulse">
				<svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<span class="hidden sm:inline">Refreshing...</span>
			</div>
		{/if}
	</div>
	<div class="flex justify-center w-full order-3 sm:order-none">
		<div class="w-full max-w-2xl">
			<SummonerSearch showRegionSelector={true} />
		</div>
	</div>
	<button class="hidden sm:flex justify-self-end bg-transparent border border-hex-gold text-hex-gold px-4 md:px-8 py-2 font-cinzel cursor-pointer rounded-lg transition-all duration-300 hover:bg-hex-gold hover:text-black text-sm md:text-base">
		LOGIN
	</button>
</nav>

{#if loading}
	<!-- ⚡ INSTANT SKELETON LOADER - Appears immediately for perceived speed -->
	<div class="dashboard-grid max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 sm:gap-8 lg:gap-10 my-6 sm:my-8 lg:my-12 px-4 sm:px-6 lg:px-10 pb-12 sm:pb-24 animate-fade-in">
		<!-- LEFT - Profile Skeleton -->
		<div class="shard-card glass-card border border-hex-gold/30 p-8 rounded-xl">
			<div class="w-28 h-28 rounded-full bg-hex-gold/20 animate-pulse mb-5"></div>
			<div class="h-10 w-48 bg-hex-gold/20 animate-pulse mb-2 rounded"></div>
			<div class="h-5 w-24 bg-hex-gold/10 animate-pulse mb-6 rounded"></div>
			<div class="h-4 w-32 bg-hex-gold/10 animate-pulse mb-4 rounded"></div>
			<div class="space-y-3 mt-6 pt-6 border-t border-hex-gold/20">
				<div class="h-20 bg-hex-gold/10 animate-pulse rounded"></div>
				<div class="h-20 bg-hex-gold/10 animate-pulse rounded"></div>
			</div>
		</div>
		
		<!-- RIGHT - Content Skeleton -->
		<div class="space-y-6">
			<div class="shard-card glass-card border border-hex-gold/30 p-6 rounded-xl">
				<div class="h-8 w-40 bg-hex-gold/20 animate-pulse mb-6 rounded"></div>
				<div class="space-y-4">
					<div class="h-24 bg-hex-gold/10 animate-pulse rounded"></div>
					<div class="h-24 bg-hex-gold/10 animate-pulse rounded"></div>
					<div class="h-24 bg-hex-gold/10 animate-pulse rounded"></div>
				</div>
			</div>
		</div>
		
		<!-- Loading Text -->
		<div class="lg:col-span-2 text-center">
			<div class="text-hex-blue text-xl font-cinzel animate-pulse">⚡ Loading {gameName}#{tagLine}...</div>
		</div>
	</div>
{:else if error}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-hex-red text-2xl font-cinzel">{error}</div>
	</div>
{:else if summoner}
	<!-- Dashboard Grid -->
	<div class="dashboard-grid max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 sm:gap-8 lg:gap-10 my-6 sm:my-8 lg:my-12 px-4 sm:px-6 lg:px-10 pb-12 sm:pb-24 animate-fade-in-up">
		
		<!-- LEFT COLUMN - Profile Card -->
		<div class="shard-card glass-card border border-hex-gold/30 p-8 rounded-xl">
			<!-- Summoner Icon -->
			<div class="summoner-icon w-28 h-28 rounded-full border-3 border-hex-gold shadow-[0_0_25px_rgba(200,170,110,0.4)] mb-5 bg-cover"
				 style="background-image: url('{getProfileIcon(summoner.profileIconId)}');">
			</div>
			
			<!-- Name & Tag -->
			<h1 class="font-cinzel text-4xl mb-0 text-white leading-none">{summoner.name}</h1>
			<span class="text-gray-500 text-base mb-6 block tracking-[2px]">#{summoner.tag}</span>

			<!-- Level -->
			<div class="text-sm text-gray-400 mt-4 mb-6">
				Level: <span class="text-white font-bold">{summoner.summonerLevel}</span>
			</div>

			<!-- Personal Ratings Section -->
			{#if summoner.ranked && summoner.ranked.length > 0}
				<div class="mt-6 pt-6 border-t border-hex-gold/20">
					<h3 class="font-cinzel text-hex-gold text-sm uppercase tracking-wider mb-4">Personal Ratings</h3>
					
					<!-- Ranked Queues -->
					<div class="space-y-4">
						{#each summoner.ranked as rankedQueue}
							{@const winrate = ((rankedQueue.wins / (rankedQueue.wins + rankedQueue.losses)) * 100).toFixed(1)}
							
							<div class="glass-card border border-hex-gold/20 p-5 rounded-lg hover:border-hex-gold/50 hover:shadow-[0_0_25px_rgba(200,170,110,0.2)] transition-all duration-300 text-center">
								<!-- Queue Name Header -->
								<div class="text-xs text-hex-blue uppercase tracking-wide mb-4 font-semibold">
									{getQueueName(rankedQueue.queueType)}
								</div>
								
								<!-- Centered Column Layout -->
								<div class="flex flex-col items-center">
									<!-- MASSIVE Tier Icon on TOP -->
									<div class="mb-4 relative w-64 h-64 flex items-center justify-center">
										<img 
											src={getTierIcon(rankedQueue.tier)} 
											alt={rankedQueue.tier}
											width="256"
											height="256"
											fetchpriority="high"
											loading="eager"
											decoding="sync"
											class="w-full h-full object-contain scale-150 drop-shadow-[0_0_30px_rgba(200,170,110,0.6)] hover:scale-[1.6] transition-transform duration-300"
										/>
									</div>
									
									<!-- Rank Info BELOW Icon -->
									<div class="w-full">
										<!-- Rank & Division - BIG -->
										<div class="font-cinzel text-white text-2xl mb-2 tracking-wide">
											{rankedQueue.tier} {rankedQueue.rank}
										</div>
										
										<!-- LP - Emphasized -->
										<div class="text-base text-gray-300 mb-3">
											<span class="text-hex-gold font-bold text-xl">{rankedQueue.leaguePoints}</span>
											<span class="text-sm text-gray-400 ml-1">LP</span>
										</div>
										
										<!-- Stats Row -->
										<div class="flex items-center justify-center gap-4 text-sm">
											<div class="text-gray-400">
												<span class="text-green-400 font-semibold">{rankedQueue.wins}W</span>
												<span class="text-gray-500"> / </span>
												<span class="text-red-400 font-semibold">{rankedQueue.losses}L</span>
											</div>
											<div class="h-4 w-px bg-gray-600"></div>
											<div class="text-hex-blue font-semibold">
												{winrate}% WR
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- RIGHT COLUMN - Content -->
		<div class="content-col">
			
			<!-- Tab Navigation -->
			<div class="tabs-nav flex gap-4 mb-8 border-b border-hex-gold/20 pb-0">
				<button 
					class="tab-btn font-cinzel text-lg px-6 py-3 transition-all duration-300 border-b-2 {activeTab === 'liveGame' ? 'border-hex-gold text-hex-gold' : 'border-transparent text-gray-400 hover:text-white'}"
					on:click={() => activeTab = 'liveGame'}
				>
					🔴 Live Game
				</button>
				<button 
					class="tab-btn font-cinzel text-lg px-6 py-3 transition-all duration-300 border-b-2 {activeTab === 'matchHistory' ? 'border-hex-gold text-hex-gold' : 'border-transparent text-gray-400 hover:text-white'}"
					on:click={() => activeTab = 'matchHistory'}
				>
					Match History
				</button>
				<button 
					class="tab-btn font-cinzel text-lg px-6 py-3 transition-all duration-300 border-b-2 {activeTab === 'championStats' ? 'border-hex-gold text-hex-gold' : 'border-transparent text-gray-400 hover:text-white'}"
					on:click={() => activeTab = 'championStats'}
				>
					Champion Stats
				</button>
				<button 
					class="tab-btn font-cinzel text-lg px-6 py-3 transition-all duration-300 border-b-2 {activeTab === 'lpGains' ? 'border-hex-gold text-hex-gold' : 'border-transparent text-gray-400 hover:text-white'}"
					on:click={() => activeTab = 'lpGains'}
				>
					LP Gains
				</button>
			</div>

			<!-- Tab Content -->
			{#if activeTab === 'liveGame'}
				<!-- 🎮 LIVE GAME TAB -->
				<LiveGameTab summoner={{...summoner, region}} />
			{:else if activeTab === 'matchHistory'}
				<!-- Match History Tab -->
				<h2 class="history-title font-cinzel text-3xl mb-5 text-white border-b border-hex-gold/30 pb-2 inline-block">
					Recent Matches
				</h2>

				<div class="match-list flex flex-col gap-4">
				{#each matches.slice(0, matchHistoryLimit) as match, i}
					{@const participant = match.info.participants.find(p => p.puuid === summoner.puuid)}
					{@const win = participant?.win}
					{@const duration = Math.floor(match.info.gameDuration / 60)}
					{@const kda = formatKDA(participant.kills, participant.deaths, participant.assists)}
					{@const champImg = getChampionSplashSrcset(participant.championName)}
				
				<div 
					class="match-row {win ? 'win' : 'loss'} flex flex-col sm:flex-row h-auto sm:h-32 glass-card border border-white/5 backdrop-blur-sm transition-all duration-300 relative overflow-hidden cursor-pointer rounded-lg hover:scale-[1.02] hover:border-hex-gold hover:bg-opacity-85 hover:z-10"
					on:mouseenter={() => handleMatchHover(match)}
					role="button"
					tabindex="0"
				>
					<!-- Win/Loss Indicator -->
					<div class="match-indicator w-2 h-full {win ? 'bg-hex-blue shadow-neon' : 'bg-hex-red shadow-[0_0_20px_rgba(255,78,80,0.5)]'}"></div>
					
					<!-- Champion Image - WebP optimized via proxy (70% smaller!) -->
					<img 
						src={champImg.src}
						srcset={champImg.srcset}
						sizes={champImg.sizes}
						alt={participant.championName}
						width="214"
						height="126"
						fetchpriority={i === 0 ? 'high' : 'auto'}
						loading={i < 2 ? 'eager' : 'lazy'}
						decoding="async"
						class="match-champ-img w-full sm:w-44 h-32 sm:h-full object-cover"
						style="mask-image: linear-gradient(to right, black 40%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 50%, transparent 100%);"
					/>
					
					<!-- Match Details -->
					<div class="match-details flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-4 sm:px-10 py-4 sm:py-0 sm:pl-3">
						<div>
							<div class="result-text font-cinzel text-xl font-bold mb-1 {win ? 'text-hex-blue' : 'text-hex-red'}">
								{win ? 'VICTORY' : 'DEFEAT'}
							</div>
							<div class="text-sm text-gray-400">{getQueueTypeName(match.info.queueId)} • {duration}m</div>
						</div>
						
						<div class="kda-box">
							<div class="kda-main text-3xl font-bold text-white tracking-wider">
								{participant.kills} / {participant.deaths} / {participant.assists}
							</div>
							<div class="kda-sub text-sm text-gray-500 mt-1">
								{kda} KDA {#if participant.challenges?.kda > 5}<span class="text-hex-gold">• MVP</span>{/if}
							</div>
						</div>
						
						<!-- Items -->
						<div class="items-box flex gap-1 flex-wrap sm:flex-nowrap">
							{#each [participant.item0, participant.item1, participant.item2, participant.item3, participant.item4, participant.item5, participant.item6] as itemId}
								{#if itemId && itemId > 0}
									<img 
										src={getItemIcon(itemId)}
										alt="Item {itemId}"
										class="item-icon w-8 h-8 sm:w-10 sm:h-10 bg-[#111] border border-gray-700 rounded object-cover"
										loading="lazy"
										width="40"
										height="40"
										on:error={(e) => e.target.style.display = 'none'}
									/>
								{:else}
									<div class="item-icon w-8 h-8 sm:w-10 sm:h-10 bg-[#0a0a0a] border border-gray-800 rounded opacity-30"></div>
								{/if}
							{/each}
						</div>
						
						<!-- AI Coach Button -->
						<button
							on:click|stopPropagation={() => openAICoach(match)}
							class="ai-coach-btn flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-hex-blue/20 to-hex-gold/20 hover:from-hex-blue/30 hover:to-hex-gold/30 border border-hex-blue/30 hover:border-hex-gold/50 rounded-lg transition-all duration-300 group"
							title="Ask AI about this match"
						>
							<span class="text-2xl group-hover:scale-110 transition-transform">🤖</span>
							<span class="text-xs sm:text-sm font-semibold text-hex-blue group-hover:text-hex-gold transition-colors">
								Ask AI
							</span>
						</button>
					</div>
				</div>
				{/each}
				</div>

				<!-- Show More Buttons -->
				<div class="flex flex-col gap-3 mt-6 items-center">
					{#if matchHistoryLimit < matches.length}
						<button
							on:click={showMoreMatchHistory}
							class="show-more-btn bg-hex-darker border border-hex-gold/30 text-hex-gold px-8 py-3 font-cinzel text-sm uppercase tracking-wider hover:bg-hex-gold/10 hover:border-hex-gold transition-all duration-300 rounded-lg"
						>
							Show More Matches ({matches.length - matchHistoryLimit} remaining)
						</button>
					{/if}
					
					{#if matches.length >= maxMatchesLoaded}
						<button
							on:click={loadMoreMatches}
							disabled={loadingMoreMatches}
							class="load-more-btn bg-gradient-to-r from-hex-blue/20 to-hex-gold/20 border border-hex-blue/30 text-white px-8 py-3 font-cinzel text-sm uppercase tracking-wider hover:from-hex-blue/30 hover:to-hex-gold/30 hover:border-hex-gold transition-all duration-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if loadingMoreMatches}
								Loading More Matches...
							{:else}
								Load More from API (50+ matches)
							{/if}
						</button>
					{/if}
				</div>
			{:else if activeTab === 'championStats'}
				<!-- Champion Stats Tab -->
				<h2 class="history-title font-cinzel text-3xl mb-5 text-white border-b border-hex-gold/30 pb-2 inline-block">
					Champion Performance
				</h2>
				{#if championPerformance.length > 0}
					<ChampionPerformanceChart championStats={championPerformance} />
				{:else}
					<div class="text-center py-12 text-gray-500">
						<p class="text-lg">No champion data available</p>
					</div>
				{/if}
			{:else if activeTab === 'lpGains'}
				<!-- LP Gains Tab -->
				<div class="flex items-center justify-between mb-5 border-b border-hex-gold/30 pb-2">
					<h2 class="history-title font-cinzel text-3xl text-white">
						LP Gains by Champion
					</h2>
					{#if loadingLPStats}
						<div class="flex items-center gap-2 text-hex-gold">
							<div class="animate-spin h-5 w-5 border-2 border-hex-gold border-t-transparent rounded-full"></div>
							<span class="text-sm font-semibold">Loading extended stats...</span>
						</div>
					{:else if loadingFullSeason}
						<div class="flex items-center gap-2 text-hex-blue">
							<div class="animate-spin h-4 w-4 border-2 border-hex-blue border-t-transparent rounded-full"></div>
							<span class="text-xs font-semibold">Loading full season data...</span>
						</div>
					{:else if allMatches.length > 0}
						<span class="text-sm text-gray-400">
							Based on {allMatches.length} matches
						</span>
					{/if}
				</div>
				
				{#if loadingLPStats && championLPGains.length === 0}
					<div class="text-center py-12 text-gray-400">
						<div class="animate-pulse">
							<div class="text-2xl mb-4">⏳</div>
							<p class="text-lg">Loading comprehensive LP statistics...</p>
							<p class="text-sm mt-2">Fetching 100 matches for accurate data</p>
						</div>
					</div>
				{:else if championLPGains.length > 0}
					<LPGainsByChampion championStats={championLPGains} summonerPuuid={summoner.puuid} />
				{:else}
					<div class="text-center py-12 text-gray-500">
						<p class="text-lg">No ranked games found in recent matches</p>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<!-- AI Match Coach Component -->
{#if selectedMatch}
	<MatchAIChat 
		bind:isOpen={aiChatOpen}
		match={selectedMatch}
		summonerPuuid={summoner.puuid}
	/>
{/if}

<style>
	.hero-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		z-index: -2;
		background-size: cover;
		background-position: center;
		filter: brightness(0.35);
		transition: all 0.5s ease;
		pointer-events: none;
	}

	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle at 70% 50%, transparent 10%, #010a13 95%);
		z-index: -1;
		pointer-events: none;
	}

	.match-champ-img {
		-webkit-mask-image: linear-gradient(to right, black 50%, transparent 100%);
		mask-image: linear-gradient(to right, black 40%, transparent 100%);
	}

	/* Tab Navigation Styles */
	.tabs-nav {
		position: relative;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.tabs-nav::-webkit-scrollbar {
		display: none;
	}

	.tab-btn {
		position: relative;
		background: transparent;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.3s ease;
	}

	.tab-btn:hover {
		transform: translateY(-2px);
	}

	/* Button Styles */
	.show-more-btn,
	.load-more-btn {
		min-width: 250px;
	}

	.show-more-btn:hover {
		box-shadow: 0 0 20px rgba(200, 170, 110, 0.3);
	}

	.load-more-btn:hover:not(:disabled) {
		box-shadow: 0 0 20px rgba(66, 138, 255, 0.3);
	}

	/* Fix mobile scrolling */
	:global(body) {
		overflow-y: auto !important;
		overflow-x: hidden;
		min-height: 100vh;
	}
</style>
