<script>
	import SummonerSearch from '$lib/components/SummonerSearch.svelte';
	import { onMount } from 'svelte';
	import { getChampionLoading } from '$lib/utils/imageProxy.js';

	let showVideo = false;
	let videoReady = false;

	// Pre-compute champion images for better performance
	const jinxImg = getChampionLoading('Jinx');
	const threshImg = getChampionLoading('Thresh');
	const leeImg = getChampionLoading('LeeSin');

	onMount(() => {
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
			window.removeEventListener('scroll', preloadVideo);
			window.removeEventListener('mousemove', preloadVideo);
			window.removeEventListener('click', preloadVideo);
		};
	});
</script>

<svelte:head>
	<title>easygame.gg - The Fastest League Stats Site (2.5× faster than op.gg)</title>
	<meta name="description" content="easygame.gg is 2.5× faster than op.gg! Lightning-fast League of Legends stats with 96+ Lighthouse score. Track performance, analyze matches, and climb faster with the fastest LoL analytics platform.">
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
		<h1 class="font-cinzel text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-2 tracking-[3px] sm:tracking-[5px] uppercase gradient-text opacity-0 animate-fade-in-down"
		    style="text-shadow: 0 10px 30px rgba(0,0,0,0.5);">
			Easy Game
		</h1>

		<!-- Performance Badge -->
		<div class="flex justify-center mb-6 opacity-0 animate-fade-in-down delay-200">
			<div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-hex-blue/20 to-hex-gold/20 border border-hex-blue/30 rounded-full backdrop-blur-sm">
				<span class="text-2xl">⚡</span>
				<span class="text-sm font-semibold">
					<span class="text-hex-gold">2.5× faster</span>
					<span class="text-gray-400"> than op.gg</span>
				</span>
			</div>
		</div>

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
					src={jinxImg.src}
					srcset={jinxImg.srcset}
					sizes={jinxImg.sizes}
					alt="Jinx"
					width="174"
					height="316"
					loading="lazy"
					decoding="async"
					class="absolute inset-0 w-full h-full object-cover -z-10 grayscale-[0.5] transition-transform duration-500 group-hover:scale-110 group-hover:grayscale-0"
				/>
				<div class="p-4 bg-gradient-to-t from-black to-transparent">
					<div class="text-xs text-hex-blue uppercase">Highest Winrate</div>
					<div class="font-cinzel text-xl text-white">Jinx</div>
					<div class="text-sm text-hex-gold flex items-center gap-1">
						<span class="text-hex-blue">▲</span> 54.2% WR
					</div>
				</div>
			</div>

			<!-- Card 2: Most Picked -->
			<div class="trend-card w-44 h-60 relative glass-card border border-white/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-end clip-tech-card hover:-translate-y-2 hover:border-hex-gold hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
				<img 
					src={threshImg.src}
					srcset={threshImg.srcset}
					sizes={threshImg.sizes}
					alt="Thresh"
					width="174"
					height="316"
					loading="lazy"
					decoding="async"
					class="absolute inset-0 w-full h-full object-cover -z-10 grayscale-[0.5] transition-transform duration-500 group-hover:scale-110 group-hover:grayscale-0"
				/>
				<div class="p-4 bg-gradient-to-t from-black to-transparent">
					<div class="text-xs text-hex-blue uppercase">Most Picked</div>
					<div class="font-cinzel text-xl text-white">Thresh</div>
					<div class="text-sm text-hex-gold flex items-center gap-1">
						<span>●</span> 32% Pick
					</div>
				</div>
			</div>

			<!-- Card 3: Trending Pro -->
			<div class="trend-card w-44 h-60 relative glass-card border border-white/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-end clip-tech-card hover:-translate-y-2 hover:border-hex-gold hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group">
				<img 
					src={leeImg.src}
					srcset={leeImg.srcset}
					sizes={leeImg.sizes}
					alt="Lee Sin"
					width="174"
					height="316"
					loading="lazy"
					decoding="async"
					class="absolute inset-0 w-full h-full object-cover -z-10 grayscale-[0.5] transition-transform duration-500 group-hover:scale-110 group-hover:grayscale-0"
				/>
				<div class="p-4 bg-gradient-to-t from-black to-transparent">
					<div class="text-xs text-hex-blue uppercase">Trending Pro</div>
					<div class="font-cinzel text-xl text-white">Lee Sin</div>
					<div class="text-sm text-hex-gold flex items-center gap-1">
						<span class="text-red-500">▼</span> Banrate 45%
					</div>
				</div>
			</div>

		</div>

		<!-- Performance Comparison -->
		<div class="mt-16 sm:mt-20 md:mt-24 opacity-0 animate-fade-in-up delay-1200">
			<div class="text-xs text-gray-500 uppercase tracking-wider mb-4">Why Choose easygame.gg?</div>
			<div class="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
				<div class="glass-card border border-hex-blue/20 rounded-lg p-4 text-center hover:border-hex-blue/40 transition-colors">
					<div class="text-3xl mb-2">⚡</div>
					<div class="text-hex-gold font-bold text-2xl mb-1">96</div>
					<div class="text-xs text-gray-400">Lighthouse Score</div>
					<div class="text-xs text-hex-blue mt-1">vs op.gg: 39</div>
				</div>
				<div class="glass-card border border-hex-blue/20 rounded-lg p-4 text-center hover:border-hex-blue/40 transition-colors">
					<div class="text-3xl mb-2">🚀</div>
					<div class="text-hex-gold font-bold text-2xl mb-1">0.8s</div>
					<div class="text-xs text-gray-400">Load Time</div>
					<div class="text-xs text-hex-blue mt-1">vs op.gg: 3-5s</div>
				</div>
				<div class="glass-card border border-hex-blue/20 rounded-lg p-4 text-center hover:border-hex-blue/40 transition-colors">
					<div class="text-3xl mb-2">🤖</div>
					<div class="text-hex-gold font-bold text-2xl mb-1">AI</div>
					<div class="text-xs text-gray-400">Match Coach</div>
					<div class="text-xs text-hex-blue mt-1">Coming Soon</div>
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
