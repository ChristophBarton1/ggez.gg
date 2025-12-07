<script>
	import SummonerSearch from '$lib/components/SummonerSearch.svelte';
	import { onMount } from 'svelte';
	import { getChampionLoading } from '$lib/utils/imageProxy.js';

	let showVideo = false;
	let videoReady = false;
	let videoMuted = true;
	let videoElement;

	// Champion stats (loaded dynamically)
	let championStats = {
		highestWinrate: { championName: 'Amumu', championId: 'Amumu', winrate: 53.8, trend: 'up' },
		mostPicked: { championName: 'Lee Sin', championId: 'LeeSin', pickrate: 28.4, trend: 'stable' },
		trending: { championName: 'Briar', championId: 'Briar', banrate: 42.1, trend: 'up' }
	};

	// Champion images (reactive)
	$: highestWinrateImg = getChampionLoading(championStats.highestWinrate.championId);
	$: mostPickedImg = getChampionLoading(championStats.mostPicked.championId);
	$: trendingImg = getChampionLoading(championStats.trending.championId);

	// Fetch real champion stats
	async function loadChampionStats() {
		try {
			const res = await fetch('/api/champion-stats');
			if (res.ok) {
				championStats = await res.json();
			}
		} catch (error) {
			console.error('Failed to load champion stats:', error);
			// Keep default fallback data
		}
	}

	function toggleMute() {
		if (videoElement) {
			videoMuted = !videoMuted;
			videoElement.muted = videoMuted;
		}
	}

	onMount(() => {
		// ⚡ Async font loading
		const fontLink = document.createElement('link');
		fontLink.rel = 'stylesheet';
		fontLink.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap';
		document.head.appendChild(fontLink);
		
		// Load champion stats
		loadChampionStats();
		
		// Refresh every 30 minutes
		const refreshInterval = setInterval(loadChampionStats, 30 * 60 * 1000);
		
		// Preload video in background AFTER page is interactive
		const preloadVideo = () => {
			showVideo = true;
			window.removeEventListener('scroll', preloadVideo);
			window.removeEventListener('mousemove', preloadVideo);
			window.removeEventListener('click', preloadVideo);
		};

		// Start video load on ANY user interaction
		window.addEventListener('scroll', preloadVideo, { once: true, passive: true });
		window.addEventListener('mousemove', preloadVideo, { once: true, passive: true });
		window.addEventListener('click', preloadVideo, { once: true, passive: true });

		// Fallback: Load after 1 second if user doesn't interact
		const fallback = setTimeout(preloadVideo, 1000);

		return () => {
			clearTimeout(fallback);
			clearInterval(refreshInterval);
			window.removeEventListener('scroll', preloadVideo);
			window.removeEventListener('mousemove', preloadVideo);
			window.removeEventListener('click', preloadVideo);
		};
	});
</script>

<svelte:head>
	<title>ggez.gg - Lightning-Fast League of Legends Stats</title>
	<meta name="description" content="ggez.gg - The fastest way to check your League of Legends stats. Track performance, analyze matches, and climb faster with real-time summoner analytics.">
	
	<!-- ⚡ PERFORMANCE: Early DNS resolution -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link rel="preconnect" href="https://ddragon.leagueoflegends.com" crossorigin>
	<link rel="preconnect" href="https://raw.communitydragon.org" crossorigin>
	<link rel="dns-prefetch" href="https://wsrv.nl">
	<!-- Font wird async in onMount() geladen -->
</svelte:head>

<!-- 
	🚀 PERFORMANCE-OPTIMIZED BACKGROUND
	Strategy: Static image first, then video after user interaction
	✅ Initial LCP: < 1s with static image
	✅ Video loads after scroll/click/3s for epic experience
-->

<!-- Black Background for Cinema Effect -->
<div class="fixed inset-0 -z-30 bg-black"></div>

<!-- Static Background (Initial Load for LCP <1s) - "Fake Full-Screen" -->
<div 
	class="fixed inset-0 -z-20 flex items-center justify-center transition-opacity duration-1000"
	class:opacity-0={showVideo && videoReady}>
	<img 
		src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect width='1920' height='1080' fill='%23000'/%3E%3C/svg%3E"
		alt="Background"
		fetchpriority="high"
		loading="eager"
		decoding="sync"
		class="object-cover"
		style="width: 100%; height: 100%;"
	/>
	
	<!-- Vignette Overlay (matches video) -->
	<div class="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80"></div>
	<div class="absolute inset-0 bg-gradient-to-b from-black/20 sm:from-black/60 via-transparent to-black/85"></div>
	<div class="absolute inset-0 bg-radial-sharp-mobile sm:bg-radial-sharp"></div>
</div>

<!-- 🎬 EPIC VIDEO BACKGROUND - "FAKE FULL-SCREEN" TRICK für Schärfe! -->
{#if showVideo}
	<div class="fixed inset-0 -z-20 flex items-center justify-center transition-opacity duration-1000"
		 class:opacity-0={!videoReady}>
		<video 
			bind:this={videoElement}
			autoplay 
			muted 
			loop 
			playsinline
			on:canplay={() => videoReady = true}
			class="object-cover"
			style="width: 96%; height: 96%; max-width: 2400px;">
			<!-- 
				✅ CLEVER TRICK für SCHÄRFE!
				- Video ist nur 96% groß (weniger Skalierung = schärfer!)
				- Aber durch starke Vignette wirkt es Full-Screen
				- Beste Balance zwischen Schärfe & Epic Look! 🔥
			-->
			<source src="/background.mp4" type="video/mp4">
			
			<!-- Fallback wenn Video nicht lädt -->
			<img 
				src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect width='1920' height='1080' fill='%23000'/%3E%3C/svg%3E"
				alt="Background"
				class="w-full h-full object-cover"
			/>
		</video>
		
		<!-- STARKE Vignette - verdeckt dass Video kleiner ist! -->
		<div class="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80"></div>
		<div class="absolute inset-0 bg-gradient-to-b from-black/20 sm:from-black/60 via-transparent to-black/85"></div>
		
		<!-- Radial Gradient - Epic Depth + verdeckt Ränder -->
		<div class="absolute inset-0 bg-radial-sharp-mobile sm:bg-radial-sharp"></div>
	</div>
{/if}

<!-- Radial Gradient Overlay -->
<div class="fixed inset-0 -z-10 pointer-events-none bg-gradient-radial from-transparent via-transparent to-black"></div>

<!-- Main Container -->
<div class="h-screen sm:min-h-screen flex flex-col items-center justify-center sm:justify-center justify-start pt-16 sm:pt-0 px-4 sm:px-6 md:px-8 overflow-hidden sm:overflow-visible">
	<div class="text-center w-full max-w-3xl relative z-0">
		
		<!-- Brand Title - LCP Element (immediately visible) -->
		<h1 class="font-cinzel text-3xl sm:text-5xl md:text-6xl lg:text-7xl mb-2 sm:mb-4 tracking-[2px] sm:tracking-[5px] uppercase gradient-text"
		    style="text-shadow: 0 10px 30px rgba(0,0,0,0.5);">
			GGEZ.GG
		</h1>


		<!-- Subtitle -->
		<div class="text-xs sm:text-base md:text-lg text-hex-blue mb-5 sm:mb-12 md:mb-16 tracking-[1px] sm:tracking-[2px] uppercase opacity-0 animate-fade-in-down delay-400">
			Lightning-Fast Summoner Analytics
		</div>

		<!-- Search Input Container -->
		<div class="opacity-0 animate-fade-in-up delay-200 relative z-50">
			<SummonerSearch />
		</div>

		<!-- Trending Champions -->
		<div class="mt-5 sm:mt-16 md:mt-20 flex flex-row gap-2 sm:gap-5 justify-center items-center opacity-0 animate-fade-in-up delay-900 relative z-0">
			
			<!-- Card 1: Highest Winrate -->
			<a href="/champions" class="trend-card w-24 h-36 sm:w-44 sm:h-60 relative glass-card border border-white/10 rounded-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-end hover:-translate-y-2 hover:border-hex-gold hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
				<img 
					src={highestWinrateImg.src}
					srcset={highestWinrateImg.srcset}
					sizes={highestWinrateImg.sizes}
					alt={championStats.highestWinrate.championName}
					width="174"
					height="316"
					loading="lazy"
					decoding="async"
					class="absolute inset-0 w-full h-full object-cover -z-10 grayscale-[0.5] transition-transform duration-500 group-hover:scale-110 group-hover:grayscale-0"
				/>
				<div class="p-1.5 sm:p-4 bg-gradient-to-t from-black to-transparent">
					<div class="text-[7px] sm:text-xs text-hex-blue uppercase leading-tight">WR</div>
					<div class="font-cinzel text-[10px] sm:text-xl text-white truncate leading-tight">{championStats.highestWinrate.championName}</div>
					<div class="text-[9px] sm:text-sm text-hex-gold flex items-center gap-0.5">
						{#if championStats.highestWinrate.trend === 'up'}
							<span class="text-hex-blue">▲</span>
						{:else if championStats.highestWinrate.trend === 'down'}
							<span class="text-red-500">▼</span>
						{:else}
							<span>●</span>
						{/if}
						{championStats.highestWinrate.winrate}% WR
					</div>
				</div>
			</a>

			<!-- Card 2: Most Picked -->
			<a href="/champions" class="trend-card w-24 h-36 sm:w-44 sm:h-60 relative glass-card border border-white/10 rounded-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-end hover:-translate-y-2 hover:border-hex-gold hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
				<img 
					src={mostPickedImg.src}
					srcset={mostPickedImg.srcset}
					sizes={mostPickedImg.sizes}
					alt={championStats.mostPicked.championName}
					width="174"
					height="316"
					loading="lazy"
					decoding="async"
					class="absolute inset-0 w-full h-full object-cover -z-10 grayscale-[0.5] transition-transform duration-500 group-hover:scale-110 group-hover:grayscale-0"
				/>
				<div class="p-1.5 sm:p-4 bg-gradient-to-t from-black to-transparent">
					<div class="text-[7px] sm:text-xs text-hex-blue uppercase leading-tight">Pick</div>
					<div class="font-cinzel text-[10px] sm:text-xl text-white truncate leading-tight">{championStats.mostPicked.championName}</div>
					<div class="text-[9px] sm:text-sm text-hex-gold flex items-center gap-0.5">
						{#if championStats.mostPicked.trend === 'up'}
							<span class="text-hex-blue">▲</span>
						{:else if championStats.mostPicked.trend === 'down'}
							<span class="text-red-500">▼</span>
						{:else}
							<span>●</span>
						{/if}
						{championStats.mostPicked.pickrate}% Pick
					</div>
				</div>
			</a>

			<!-- Card 3: Trending -->
			<a href="/champions" class="trend-card w-24 h-36 sm:w-44 sm:h-60 relative glass-card border border-white/10 rounded-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-end hover:-translate-y-2 hover:border-hex-gold hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
				<img 
					src={trendingImg.src}
					srcset={trendingImg.srcset}
					sizes={trendingImg.sizes}
					alt={championStats.trending.championName}
					width="174"
					height="316"
					loading="lazy"
					decoding="async"
					class="absolute inset-0 w-full h-full object-cover -z-10 grayscale-[0.5] transition-transform duration-500 group-hover:scale-110 group-hover:grayscale-0"
				/>
				<div class="p-1.5 sm:p-4 bg-gradient-to-t from-black to-transparent">
					<div class="text-[7px] sm:text-xs text-hex-blue uppercase leading-tight">Hot</div>
					<div class="font-cinzel text-[10px] sm:text-xl text-white truncate leading-tight">{championStats.trending.championName}</div>
					<div class="text-[9px] sm:text-sm text-hex-gold flex items-center gap-0.5">
						{#if championStats.trending.trend === 'up'}
							<span class="text-red-500">▲</span>
						{:else if championStats.trending.trend === 'down'}
							<span class="text-hex-blue">▼</span>
						{:else}
							<span>●</span>
						{/if}
						{championStats.trending.banrate}% Ban
					</div>
				</div>
			</a>

		</div>

	</div>
</div>

<!-- Audio Toggle Button (Desktop only) -->
{#if showVideo && videoReady}
	<button
		on:click={toggleMute}
		class="hidden sm:flex fixed bottom-6 right-6 z-50 w-10 h-10 items-center justify-center glass-card border border-hex-gold/30 rounded-full hover:border-hex-gold hover:bg-hex-gold/10 hover:scale-110 transition-all duration-300 group shadow-lg shadow-hex-gold/20"
		aria-label={videoMuted ? 'Unmute video' : 'Mute video'}
	>
		{#if videoMuted}
			<!-- Muted Icon -->
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-hex-gold group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
			</svg>
		{:else}
			<!-- Unmuted Icon -->
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-hex-gold group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
			</svg>
		{/if}
	</button>
{/if}

<style>
	/* Mobile: Lighter Vignette - mehr vom Video sichtbar */
	.bg-radial-sharp-mobile {
		background: radial-gradient(
			ellipse at center,
			transparent 0%,
			transparent 35%,
			rgba(0, 0, 0, 0.2) 60%,
			rgba(0, 0, 0, 0.7) 100%
		);
	}

	/* Desktop: SHARP Vignette - verdeckt Ränder & fokussiert Center */
	.bg-radial-sharp {
		background: radial-gradient(
			ellipse at center,
			transparent 0%,
			transparent 25%,
			rgba(0, 0, 0, 0.4) 50%,
			rgba(0, 0, 0, 0.85) 100%
		);
	}
	
	/* Soft radial vignette (for static image) */
	.bg-radial-dark {
		background: radial-gradient(
			ellipse at center,
			transparent 0%,
			rgba(0, 0, 0, 0.3) 40%,
			rgba(0, 0, 0, 0.8) 100%
		);
	}
	
	/* Fallback gradient */
	.bg-gradient-radial {
		background: radial-gradient(circle, transparent 0%, #000 90%);
	}
</style>
