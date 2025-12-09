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
		
		// Fullscreen tracking removed (now in global Navbar)
		
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
			class="w-full h-full object-cover transition-opacity duration-1000 {isFullscreen ? 'opacity-100' : 'opacity-60'}">
			<source src="/background.mp4" type="video/mp4">
		</video>
	{/if}
	<div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 transition-opacity duration-1000 {isFullscreen ? 'opacity-0' : 'opacity-100'}"></div>
</div>

<!-- Video Controls (YouTube-Style) - Only in fullscreen mode -->
{#if isFullscreen}
	<div class="fixed inset-0 z-50 flex flex-col">
		<!-- Top Bar -->
		<div class="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
			<button 
				on:click={exitFullscreen}
				class="flex items-center gap-2 text-white hover:text-hex-gold transition-all px-4 py-2 rounded"
				title="Back to Home">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
				<span class="font-semibold">Back</span>
			</button>
			<h2 class="text-white text-xl font-bold">Season 2025: Summoner's Destiny</h2>
			<div class="w-24"></div>
		</div>

		<!-- Bottom Controls Bar -->
		<div class="mt-auto p-6 bg-gradient-to-t from-black/80 to-transparent">
			<div class="flex items-center justify-between max-w-4xl mx-auto">
				<!-- Left: Play/Pause + Mute -->
				<div class="flex items-center gap-4">
					<!-- Play/Pause Button -->
					<button 
						on:click={() => {
							if (videoElement) {
								if (videoElement.paused) {
									videoElement.play();
								} else {
									videoElement.pause();
								}
							}
						}}
						class="text-white hover:text-hex-gold transition-all p-2"
						title="Play/Pause">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</button>

					<!-- Mute Button -->
					<button 
						on:click={toggleMute}
						class="text-white hover:text-hex-gold transition-all p-2"
						title="{videoMuted ? 'Unmute' : 'Mute'}">
						{#if videoMuted}
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
							</svg>
						{/if}
					</button>

					<!-- Volume Slider -->
					<input 
						type="range" 
						min="0" 
						max="100" 
						value="{videoMuted ? 0 : 100}"
						on:input={(e) => {
							if (videoElement) {
								videoElement.volume = e.target.value / 100;
								if (e.target.value > 0) {
									videoMuted = false;
									videoElement.muted = false;
								} else {
									videoMuted = true;
									videoElement.muted = true;
								}
							}
						}}
						class="w-24 accent-hex-gold"
					/>
				</div>

				<!-- Right: Fullscreen Toggle -->
				<button 
					on:click={() => {
						if (document.fullscreenElement) {
							document.exitFullscreen();
						} else {
							document.documentElement.requestFullscreen();
						}
					}}
					class="text-white hover:text-hex-gold transition-all p-2"
					title="Fullscreen">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Main UI (fades out in fullscreen) -->
<div class="transition-opacity duration-1000 {isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}">
	<!-- Riot Client Layout - Account for navbar height -->
	<div class="flex flex-col md:overflow-hidden page-container" style="padding-top: 60px;">
		<!-- Main Content - Riot Layout -->
		<div class="flex-1 flex flex-col p-4 md:p-4 max-w-[1600px] mx-auto w-full">
			
			<!-- Top: Title + Search Bar (Centered) -->
			<div class="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-4">
				<!-- Brand Title -->
				<h1 class="font-cinzel text-4xl sm:text-5xl md:text-5xl mb-2 tracking-[3px] md:tracking-[5px] uppercase text-hex-gold text-center"
				    style="text-shadow: 0 10px 30px rgba(0,0,0,0.5);">
					GGEZ.GG
				</h1>
				
				<!-- Subtitle -->
				<div class="text-sm sm:text-base md:text-base text-hex-blue mb-2 md:mb-3 tracking-[1px] md:tracking-[2px] uppercase text-center">
					Lightning-Fast Summoner Analytics
				</div>
				
				<!-- Search Bar -->
				<div class="w-full max-w-2xl mb-3 md:mb-4">
					<SummonerSearch />
				</div>
			</div>

			<!-- Bottom Section: Trailer + Cards -->
			<div class="mt-auto pb-2 md:pb-3">
				<!-- Trailer Info (LEFT BOTTOM) - Hidden on Mobile -->
				<div class="hidden md:block mb-3 md:mb-4 max-w-xl">
					<h2 class="text-xl sm:text-2xl md:text-2xl font-bold text-white mb-2">Season 2025: Summoner's Destiny</h2>
					<p class="text-gray-300 mb-3 leading-relaxed text-sm">
						Centuries ago, Zaahen made a choice. Now, Xin Zhao must make his own.
					</p>
					<div class="flex items-center gap-3 md:gap-4 flex-wrap">
						<button 
							on:click={watchNow}
							class="px-6 md:px-8 py-2 md:py-3 bg-white/90 hover:bg-white text-black font-bold rounded transition-all text-sm md:text-base">
							Watch Now
						</button>
						
						<!-- Mute Button -->
						<button 
							on:click={toggleMute}
							class="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded transition-all text-white"
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

				<!-- 4 Horizontal Cards (Riot Style with Champion Images) - Mobile Responsive -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
					
					<!-- Card 1: Champions - Yasuo (WebP 95%) -->
					<a href="/champions" class="video-card group">
						<div class="video-card-thumb">
							<img 
								src="https://wsrv.nl/?url=ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg&w=660&h=390&output=webp&q=95"
								alt="Yasuo Champion Splash"
								loading="lazy"
								decoding="async"
								width="660"
								height="390"
								class="video-thumbnail-img"
							/>
							<div class="video-thumbnail-overlay"></div>
							<span class="video-badge time">2:45</span>
						</div>
						<div class="video-card-title">
							Champions: 2025 Meta Picks
						</div>
					</a>

					<!-- Card 2: AI Coach - Zed (WebP 95%) -->
					<div class="video-card group">
						<div class="video-card-thumb">
							<img 
								src="https://wsrv.nl/?url=ddragon.leagueoflegends.com/cdn/img/champion/splash/Zed_0.jpg&w=660&h=390&output=webp&q=95"
								alt="Zed Champion Splash"
								loading="lazy"
								decoding="async"
								width="660"
								height="390"
								class="video-thumbnail-img"
							/>
							<div class="video-thumbnail-overlay"></div>
							<span class="video-badge dev">DEV</span>
						</div>
						<div class="video-card-title">
							/dev: AI Coach Preview
						</div>
					</div>

					<!-- Card 3: Ranked - Akali (WebP 95%) -->
					<div class="video-card group">
						<div class="video-card-thumb">
							<img 
								src="https://wsrv.nl/?url=ddragon.leagueoflegends.com/cdn/img/champion/splash/Akali_0.jpg&w=660&h=390&output=webp&q=95"
								alt="Akali Champion Splash"
								loading="lazy"
								decoding="async"
								width="660"
								height="390"
								class="video-thumbnail-img"
							/>
							<div class="video-thumbnail-overlay"></div>
							<span class="video-badge dev">DEV</span>
						</div>
						<div class="video-card-title">
							/dev: Ranked 2026
						</div>
					</div>

					<!-- Card 4: Swiftplay - Jinx (WebP 95%) -->
					<div class="video-card group">
						<div class="video-card-thumb">
							<img 
								src="https://wsrv.nl/?url=ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg&w=660&h=390&output=webp&q=95"
								alt="Jinx Champion Splash"
								loading="lazy"
								decoding="async"
								width="660"
								height="390"
								class="video-thumbnail-img"
							/>
							<div class="video-thumbnail-overlay"></div>
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

	<!-- Footer Links (Legal) - Fixed only on Desktop -->
	<footer class="md:fixed bottom-4 left-4 z-30 flex items-center justify-center gap-3 text-xs text-gray-500 pb-4 md:pb-0">
		<a href="/impressum" class="hover:text-hex-gold transition-colors">Impressum</a>
		<span>|</span>
		<a href="/privacy" class="hover:text-hex-gold transition-colors">Privacy</a>
		<span>|</span>
		<a href="/legal" class="hover:text-hex-gold transition-colors">Legal</a>
	</footer>
</div>

<style>
	/* Page container: scrollable on mobile, fixed height on desktop */
	.page-container {
		min-height: 100vh;
	}
	
	@media (min-width: 768px) {
		.page-container {
			height: 100vh;
			min-height: auto;
		}
	}

	/* Remove bottom padding on desktop to fit everything */
	@media (min-width: 768px) {
		.md\:pb-3 {
			padding-bottom: 0.5rem !important;
		}
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

	.video-thumbnail-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 20%;
	}

	.video-thumbnail-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
		pointer-events: none;
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
