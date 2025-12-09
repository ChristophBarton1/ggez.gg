<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import SummonerSearch from '$lib/components/SummonerSearch.svelte';
	
	export let showSearchInNav = false;
	
	let mobileMenuOpen = false;
	let isPageFullscreen = false;
	
	onMount(() => {
		// Track fullscreen state (client-side only)
		const handleFullscreenChange = () => {
			isPageFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	});
	
	function toggleFullscreen() {
		if (typeof document !== 'undefined') {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				document.documentElement.requestFullscreen();
			}
		}
	}
	
	$: isHomepage = $page.url.pathname === '/';
</script>

<!-- Top Nav Bar (Riot Style) - Global -->
<nav class="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-black backdrop-blur-md border-b border-white/10 relative z-40">
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
	
	<!-- Center Search (only on non-homepage) -->
	{#if showSearchInNav && !isHomepage}
		<div class="hidden md:block flex-1 max-w-xl mx-8">
			<SummonerSearch />
		</div>
	{/if}
	
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
		
		<!-- Fullscreen Button (NEW!) -->
		<button 
			on:click={toggleFullscreen}
			class="icon-btn"
			title="{isPageFullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen (F11)'}">
			{#if isPageFullscreen}
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
				</svg>
			{/if}
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

<style>
	/* Nav Link */
	.nav-link {
		padding: 0.75rem 1.25rem;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.9rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-radius: 0.5rem;
		transition: all 0.2s;
		background: transparent;
	}
	
	.nav-link:hover {
		color: var(--hex-gold);
		background: rgba(200, 170, 110, 0.1);
	}
	
	/* Icon Button */
	.icon-btn {
		padding: 0.5rem;
		color: rgba(255, 255, 255, 0.6);
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

	/* Force hide burger menu on desktop */
	@media (min-width: 768px) {
		.md\:hidden {
			display: none !important;
		}
	}
</style>
