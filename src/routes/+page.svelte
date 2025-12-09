<script>
	import { onMount } from 'svelte';
	import SummonerSearch from '$lib/components/SummonerSearch.svelte';

	let showVideo = false;
	let videoReady = false;
	let videoMuted = true;
	let videoElement;
	let isFullscreen = false;
	let isPageFullscreen = false;
	let mobileMenuOpen = false;

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
		
		// Track fullscreen changes
		const handleFullscreenChange = () => {
			isPageFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		
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
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
	<!-- Riot Client Layout -->
	<div class="min-h-screen flex flex-col">
		
		<!-- Top Nav Bar (Riot Style) -->
		<nav class="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-black/40 backdrop-blur-md border-b border-white/10">
			<!-- Logo + Mobile Burger -->
			<div class="flex items-center gap-3 md:gap-8">
				<!-- Mobile Burger Menu - ONLY VISIBLE ON MOBILE -->
				<button 
					on:click={() => mobileMenuOpen = !mobileMenuOpen}
					class="md:hidden icon-btn"
					title="Menu">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				
				<a href="/" class="font-cinzel text-lg md:text-2xl text-hex-gold tracking-[2px] hover:text-white transition-colors">
					GGEZ.GG
				</a>
				
				<!-- Nav Links - ONLY VISIBLE ON DESKTOP -->
				<div class="hidden md:flex items-center gap-2">
					<a href="/" class="nav-link">Home</a>
					<a href="/champions" class="nav-link">Champions</a>
				</div>
			</div>
			
			<!-- Right Icons -->
			<div class="flex items-center gap-2 md:gap-3">
				<!-- Notification Bell -->
				<button class="icon-btn" title="Notifications">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
					</svg>
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
				<button class="icon-btn" title="Profile">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</button>
				
				<!-- Settings -->
				<button class="icon-btn" title="Settings">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</button>
			</div>
		</nav>

		<!-- Mobile Menu Overlay - ONLY ON MOBILE -->
		{#if mobileMenuOpen}
			<div class="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-lg">
				<div class="flex flex-col h-full">
					<!-- Header -->
					<div class="flex items-center justify-between p-4 border-b border-white/10">
						<span class="font-cinzel text-2xl text-hex-gold tracking-[2px]">GGEZ.GG</span>
						<button 
							on:click={() => mobileMenuOpen = false}
							class="icon-btn"
							title="Close">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					
					<!-- Menu Items -->
					<nav class="flex-1 flex flex-col gap-2 p-6">
						<a href="/" on:click={() => mobileMenuOpen = false} class="mobile-menu-link">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
							</svg>
							<span>Home</span>
						</a>
						<a href="/champions" on:click={() => mobileMenuOpen = false} class="mobile-menu-link">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
							</svg>
							<span>Champions</span>
						</a>
						
						<div class="border-t border-white/10 my-4"></div>
						
						<a href="/impressum" on:click={() => mobileMenuOpen = false} class="mobile-menu-link-small">
							Impressum
						</a>
						<a href="/privacy" on:click={() => mobileMenuOpen = false} class="mobile-menu-link-small">
							Privacy Policy
						</a>
						<a href="/legal" on:click={() => mobileMenuOpen = false} class="mobile-menu-link-small">
							Legal Notice
						</a>
					</nav>
				</div>
			</div>
		{/if}

		<!-- Main Content - Riot Layout -->
		<div class="flex-1 flex flex-col p-4 md:p-8 max-w-[1600px] mx-auto w-full">
			
			<!-- Top: Title + Search Bar (Better Centered) -->
			<div class="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-4">
				<!-- Brand Title -->
				<h1 class="font-cinzel text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-3 md:mb-4 tracking-[3px] md:tracking-[5px] uppercase text-hex-gold text-center"
				    style="text-shadow: 0 10px 30px rgba(0,0,0,0.5);">
					GGEZ.GG
				</h1>
				
				<!-- Subtitle -->
				<div class="text-sm sm:text-base md:text-lg text-hex-blue mb-4 md:mb-8 tracking-[1px] md:tracking-[2px] uppercase text-center">
					Lightning-Fast Summoner Analytics
				</div>
				
				<!-- Search Bar -->
				<div class="w-full max-w-2xl mb-12 md:mb-0">
					<SummonerSearch />
				</div>
			</div>

			<!-- Bottom Section: Trailer + Cards -->
			<div class="mt-auto pb-4 md:pb-8">
				<!-- Trailer Info (LEFT BOTTOM) - Hidden on Mobile -->
				<div class="hidden md:block mb-6 md:mb-8 max-w-xl">
					<h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 md:mb-3">Season 2025: Summoner's Destiny</h2>
					<p class="text-gray-300 mb-4 md:mb-6 leading-relaxed text-xs sm:text-sm">
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

						<!-- Fullscreen Button (Desktop Only) -->
						<button 
							on:click={() => {
								if (document.fullscreenElement) {
									document.exitFullscreen();
								} else {
									document.documentElement.requestFullscreen();
								}
							}}
							class="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded transition-all text-white"
							title="{isPageFullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen (F11)'}">
							{#if isPageFullscreen}
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<!-- 4 Horizontal Cards (Riot Style with Champion Images) - Mobile Responsive -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
					
					<!-- Card 1: Champions - Yasuo (Optimized) -->
					<a href="/champions" class="video-card group">
						<div class="video-card-thumb">
							<img 
								src="https://wsrv.nl/?url=ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg&w=660&h=390&output=webp&q=80"
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

					<!-- Card 2: AI Coach - Zed (Optimized) -->
					<div class="video-card group">
						<div class="video-card-thumb">
							<img 
								src="https://wsrv.nl/?url=ddragon.leagueoflegends.com/cdn/img/champion/splash/Zed_0.jpg&w=660&h=390&output=webp&q=80"
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

					<!-- Card 3: Ranked - Akali (Optimized) -->
					<div class="video-card group">
						<div class="video-card-thumb">
							<img 
								src="https://wsrv.nl/?url=ddragon.leagueoflegends.com/cdn/img/champion/splash/Akali_0.jpg&w=660&h=390&output=webp&q=80"
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

					<!-- Card 4: Swiftplay - Jinx (Optimized) -->
					<div class="video-card group">
						<div class="video-card-thumb">
							<img 
								src="https://wsrv.nl/?url=ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg&w=660&h=390&output=webp&q=80"
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

	<!-- Footer Links (Legal) -->
	<footer class="fixed bottom-4 left-4 z-30 flex items-center gap-3 text-xs text-gray-500">
		<a href="/impressum" class="hover:text-hex-gold transition-colors">Impressum</a>
		<span>|</span>
		<a href="/privacy" class="hover:text-hex-gold transition-colors">Privacy</a>
		<span>|</span>
		<a href="/legal" class="hover:text-hex-gold transition-colors">Legal</a>
	</footer>
</div>

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

	/* Mobile Menu Links */
	.mobile-menu-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		color: rgba(255, 255, 255, 0.8);
		font-size: 1.125rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-radius: 0.5rem;
		transition: all 0.2s;
		background: transparent;
	}
	
	.mobile-menu-link:hover {
		color: var(--hex-gold);
		background: rgba(200, 170, 110, 0.1);
	}

	.mobile-menu-link-small {
		padding: 0.75rem 1.5rem;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.mobile-menu-link-small:hover {
		color: var(--hex-gold);
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
