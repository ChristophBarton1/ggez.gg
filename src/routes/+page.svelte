<script>
	import { onMount } from 'svelte';
	import SummonerSearch from '$lib/components/SummonerSearch.svelte';

	let showVideo = false;
	let videoReady = false;
	let videoMuted = true;
	let videoElement;
	let isFullscreen = false;

	function toggleMute() {
		if (videoElement) {
			videoMuted = !videoMuted;
			videoElement.muted = videoMuted;
		}
	}

	function watchNow() {
		isFullscreen = true;
		if (videoElement) {
			videoMuted = false;
			videoElement.muted = false;
		}
	}

	function exitFullscreen() {
		isFullscreen = false;
		if (videoElement) {
			videoMuted = true;
			videoElement.muted = true;
		}
	}

	onMount(() => {
		// Load fonts
		const fontLink = document.createElement('link');
		fontLink.rel = 'stylesheet';
		fontLink.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap';
		document.head.appendChild(fontLink);
		
		// Preload video
		const preloadVideo = () => {
			showVideo = true;
			window.removeEventListener('scroll', preloadVideo);
			window.removeEventListener('mousemove', preloadVideo);
			window.removeEventListener('click', preloadVideo);
		};

		window.addEventListener('scroll', preloadVideo, { once: true, passive: true });
		window.addEventListener('mousemove', preloadVideo, { once: true, passive: true });
		window.addEventListener('click', preloadVideo, { once: true, passive: true });
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

<!-- Video Background -->
<div class="fixed inset-0 -z-20 bg-black">
	{#if showVideo}
		<video 
			bind:this={videoElement}
			autoplay 
			muted={videoMuted}
			loop 
			playsinline
			on:canplay={() => videoReady = true}
			class="w-full h-full object-cover {isFullscreen ? 'opacity-100' : 'opacity-60'}">
			<source src="/background.mp4" type="video/mp4">
		</video>
	{/if}
	<div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
</div>

<!-- Fullscreen Video Mode -->
{#if isFullscreen}
	<div class="fixed inset-0 z-50 bg-black flex items-center justify-center">
		<button 
			on:click={exitFullscreen}
			class="absolute top-6 right-6 z-50 text-white hover:text-hex-gold transition-colors">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
{:else}
	<!-- Riot Client Layout -->
	<div class="min-h-screen flex flex-col">
		
		<!-- Top Nav Bar (Riot Style) -->
		<nav class="flex items-center justify-between px-8 py-4 bg-black/40 backdrop-blur-md border-b border-white/10">
			<!-- Logo -->
			<div class="flex items-center gap-8">
				<a href="/" class="font-cinzel text-2xl text-hex-gold tracking-[2px] hover:text-white transition-colors">
					GGEZ.GG
				</a>
				
				<!-- Nav Links -->
				<div class="hidden md:flex items-center gap-1">
					<a href="/" class="nav-link">Overview</a>
					<a href="/champions" class="nav-link">Champions</a>
					<a href="/" class="nav-link">Stats</a>
					<a href="/" class="nav-link">Esports</a>
				</div>
			</div>
			
			<!-- Right Icons -->
			<div class="flex items-center gap-4">
				<!-- Notification Bell -->
				<button class="icon-btn relative">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
					</svg>
					<span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
				</button>
				
				<!-- Currency -->
				<div class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
					<span class="text-yellow-400 text-sm">💰</span>
					<span class="text-white text-sm font-bold">0</span>
				</div>
				
				<!-- RP -->
				<div class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
					<span class="text-hex-gold text-sm">⚡</span>
					<span class="text-white text-sm font-bold">15</span>
				</div>
				
				<!-- Profile -->
				<button class="icon-btn">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</button>
				
				<!-- Settings -->
				<button class="icon-btn">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</button>
			</div>
		</nav>

		<!-- Main Content - Riot Layout -->
		<div class="flex-1 flex flex-col p-8 max-w-[1600px] mx-auto w-full">
			
			<!-- Top: Title + Search Bar (Centered) -->
			<div class="flex flex-col items-center justify-center mb-auto pt-12">
				<!-- Brand Title -->
				<h1 class="font-cinzel text-5xl md:text-6xl lg:text-7xl mb-3 tracking-[5px] uppercase text-hex-gold"
				    style="text-shadow: 0 10px 30px rgba(0,0,0,0.5);">
					GGEZ.GG
				</h1>
				
				<!-- Subtitle -->
				<div class="text-base md:text-lg text-hex-blue mb-8 tracking-[2px] uppercase">
					Lightning-Fast Summoner Analytics
				</div>
				
				<!-- Search Bar -->
				<div class="w-full max-w-2xl">
					<SummonerSearch />
				</div>
			</div>

			<!-- Bottom Section: Trailer + Cards -->
			<div class="mt-auto pb-8">
				<!-- Trailer Info (LEFT BOTTOM) -->
				<div class="mb-8 max-w-xl">
					<h2 class="text-3xl font-bold text-white mb-3">Season 2025: Summoner's Destiny</h2>
					<p class="text-gray-300 mb-6 leading-relaxed text-sm">
						Centuries ago, Zaahen made a choice. Now, Xin Zhao must make his own.
					</p>
					<div class="flex items-center gap-4">
						<button 
							on:click={watchNow}
							class="px-8 py-3 bg-white/90 hover:bg-white text-black font-bold rounded transition-all">
							Watch Now
						</button>
						<button 
							on:click={toggleMute}
							class="p-3 bg-white/10 hover:bg-white/20 rounded transition-all text-white"
							title="{videoMuted ? 'Unmute' : 'Mute'} video">
							{#if videoMuted}
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<!-- 4 Horizontal Cards (Riot Style) -->
				<div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
					
					<!-- Card 1 -->
					<a href="/champions" class="video-card group">
						<div class="video-card-thumb">
							<div class="video-thumbnail-placeholder" style="background: linear-gradient(135deg, rgba(200, 170, 110, 0.3) 0%, rgba(139, 69, 19, 0.4) 100%);">
								<div class="text-center">
									<div class="text-6xl mb-2">🏆</div>
									<div class="text-sm text-white/60 font-semibold">CHAMPIONS</div>
								</div>
							</div>
							<span class="video-badge time">2:45</span>
						</div>
						<div class="video-card-title">
							Champions: 2025 Meta Picks
						</div>
					</a>

					<!-- Card 2 -->
					<div class="video-card group">
						<div class="video-card-thumb">
							<div class="video-thumbnail-placeholder" style="background: linear-gradient(135deg, rgba(66, 135, 245, 0.3) 0%, rgba(0, 100, 255, 0.4) 100%);">
								<div class="text-center">
									<div class="text-6xl mb-2">🤖</div>
									<div class="text-sm text-white/60 font-semibold">AI COACH</div>
								</div>
							</div>
							<span class="video-badge dev">DEV</span>
						</div>
						<div class="video-card-title">
							/dev: AI Coach Preview
						</div>
					</div>

					<!-- Card 3 -->
					<div class="video-card group">
						<div class="video-card-thumb">
							<div class="video-thumbnail-placeholder" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.4) 100%);">
								<div class="text-center">
									<div class="text-6xl mb-2">📊</div>
									<div class="text-sm text-white/60 font-semibold">RANKED</div>
								</div>
							</div>
							<span class="video-badge dev">DEV</span>
						</div>
						<div class="video-card-title">
							/dev: Ranked 2026
						</div>
					</div>

					<!-- Card 4 -->
					<div class="video-card group">
						<div class="video-card-thumb">
							<div class="video-thumbnail-placeholder" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.4) 100%);">
								<div class="text-center">
									<div class="text-6xl mb-2">⚡</div>
									<div class="text-sm text-white/60 font-semibold">SWIFTPLAY</div>
								</div>
							</div>
							<span class="video-badge dev">DEV</span>
						</div>
						<div class="video-card-title">
							/dev: A Swifter Swiftplay
						</div>
					</div>

				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Nav Link */
	.nav-link {
		padding: 0.75rem 1.25rem;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-radius: 0.375rem;
		transition: all 0.2s;
		background: transparent;
	}
	
	.nav-link:hover {
		color: white;
		background: rgba(255, 255, 255, 0.05);
	}

	/* Icon Button */
	.icon-btn {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.7);
		border-radius: 0.5rem;
		transition: all 0.2s;
		background: transparent;
	}
	
	.icon-btn:hover {
		color: white;
		background: rgba(255, 255, 255, 0.1);
	}

	/* Video Card Style (Riot Client) */
	.video-card {
		position: relative;
		background: rgba(0, 0, 0, 0.6);
		border-radius: 8px;
		overflow: hidden;
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.video-card:hover {
		transform: scale(1.03);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
	}

	.video-card-thumb {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: linear-gradient(135deg, rgba(20, 30, 40, 0.9) 0%, rgba(10, 15, 20, 0.95) 100%);
		border-radius: 8px 8px 0 0;
		overflow: hidden;
	}

	.video-thumbnail-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(200, 170, 110, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%);
	}

	.video-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		background: rgba(0, 0, 0, 0.8);
		color: white;
	}

	.video-badge.dev {
		background: rgba(0, 0, 0, 0.9);
		color: white;
	}

	.video-badge.time {
		background: rgba(0, 0, 0, 0.8);
		color: white;
	}

	.video-card-title {
		padding: 12px;
		color: white;
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1.3;
		background: rgba(0, 0, 0, 0.5);
	}
</style>
