<script>
	import SummonerSearch from '$lib/components/SummonerSearch.svelte';
	import { onMount } from 'svelte';
	import { getChampionLoading } from '$lib/utils/imageProxy.js';

	let showVideo = false;
	let videoReady = false;

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

	onMount(() => {
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
	<!-- Performance: Preconnect to CDNs -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link rel="preconnect" href="https://wsrv.nl">
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
	<div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85"></div>
	<div class="absolute inset-0 bg-radial-sharp"></div>
</div>

<!-- 🎬 EPIC VIDEO BACKGROUND - "FAKE FULL-SCREEN" TRICK für Schärfe! -->
{#if showVideo}
	<div class="fixed inset-0 -z-20 flex items-center justify-center transition-opacity duration-1000"
		 class:opacity-0={!videoReady}>
		<video 
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
		<div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85"></div>
		
		<!-- Radial Gradient - Epic Depth + verdeckt Ränder -->
		<div class="absolute inset-0 bg-radial-sharp"></div>
	</div>
{/if}

<!-- Radial Gradient Overlay -->
<div class="fixed inset-0 -z-10 pointer-events-none bg-gradient-radial from-transparent via-transparent to-black"></div>

<!-- Main Container -->
<div class="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-8">
	<div class="text-center w-full max-w-3xl relative z-0">
		
		<!-- Brand Title -->
		<h1 class="font-cinzel text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 tracking-[3px] sm:tracking-[5px] uppercase gradient-text opacity-0 animate-fade-in-down"
		    style="text-shadow: 0 10px 30px rgba(0,0,0,0.5);">
			GGEZ.GG
		</h1>


		<!-- Subtitle -->
		<div class="text-sm sm:text-base md:text-lg text-hex-blue mb-8 sm:mb-12 md:mb-16 tracking-[1px] sm:tracking-[2px] uppercase opacity-0 animate-fade-in-down delay-400">
			Lightning-Fast Summoner Analytics
		</div>

		<!-- Search Input Container -->
		<div class="opacity-0 animate-fade-in-up delay-600 relative z-50">
			<SummonerSearch />
		</div>

		<!-- Trending Champions -->
		<div class="mt-12 sm:mt-16 md:mt-20 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center opacity-0 animate-fade-in-up delay-900 relative z-0">
			
			<!-- Card 1: Highest Winrate -->
			<div class="trend-card w-44 h-60 relative glass-card border border-white/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-end clip-tech-card hover:-translate-y-2 hover:border-hex-gold hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
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
				<div class="p-4 bg-gradient-to-t from-black to-transparent">
					<div class="text-xs text-hex-blue uppercase">Highest Winrate</div>
					<div class="font-cinzel text-xl text-white">{championStats.highestWinrate.championName}</div>
					<div class="text-sm text-hex-gold flex items-center gap-1">
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
			</div>

			<!-- Card 2: Most Picked -->
			<div class="trend-card w-44 h-60 relative glass-card border border-white/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-end clip-tech-card hover:-translate-y-2 hover:border-hex-gold hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
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
				<div class="p-4 bg-gradient-to-t from-black to-transparent">
					<div class="text-xs text-hex-blue uppercase">Most Picked</div>
					<div class="font-cinzel text-xl text-white">{championStats.mostPicked.championName}</div>
					<div class="text-sm text-hex-gold flex items-center gap-1">
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
			</div>

			<!-- Card 3: Trending -->
			<div class="trend-card w-44 h-60 relative glass-card border border-white/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-end clip-tech-card hover:-translate-y-2 hover:border-hex-gold hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
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
				<div class="p-4 bg-gradient-to-t from-black to-transparent">
					<div class="text-xs text-hex-blue uppercase">Trending</div>
					<div class="font-cinzel text-xl text-white">{championStats.trending.championName}</div>
					<div class="text-sm text-hex-gold flex items-center gap-1">
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
			</div>

		</div>

	</div>
</div>

<style>
	/* SHARP Vignette - verdeckt Ränder & fokussiert Center */
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
