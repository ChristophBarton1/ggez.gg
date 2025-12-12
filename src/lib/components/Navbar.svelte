<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import UnifiedSearch from '$lib/components/UnifiedSearch.svelte';
	import { user } from '$lib/stores/user.js';
	
	let mobileMenuOpen = false;
	let isPageFullscreen = false;
	let loginOverlayOpen = false;
	let registerMode = false;
	let settingsOverlayOpen = false;
	let showSaveToast = false;
	let authError = '';
	let authLoading = false;
	
	// Form fields
	let username = '';
	let email = '';
	let password = '';
	
	// Get user from page data
	export let data;
	
	// Settings (loaded from localStorage)
	let darkMode = true;
	let autoRefresh = false;
	let showRankEmblems = true;
	let animationsEnabled = true;
	let language = 'en';
	
	// Sync user from page data
	$: if (data?.user) {
		$user = data.user;
	}

	async function handleLogin(e) {
		e.preventDefault();
		authError = '';
		authLoading = true;

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			const data = await res.json();

			if (!res.ok) {
				authError = data.error || 'Login failed';
				return;
			}

			$user = data.user;
			loginOverlayOpen = false;
			username = '';
			password = '';
			window.location.reload();
		} catch (error) {
			authError = 'Connection error';
		} finally {
			authLoading = false;
		}
	}

	async function handleRegister(e) {
		e.preventDefault();
		authError = '';
		authLoading = true;

		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password })
			});

			const data = await res.json();

			if (!res.ok) {
				authError = data.error || 'Registration failed';
				return;
			}

			loginOverlayOpen = false;
			username = '';
			email = '';
			password = '';
			window.location.reload();
		} catch (error) {
			authError = 'Connection error';
		} finally {
			authLoading = false;
		}
	}

	async function handleLogout() {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			$user = null;
			window.location.reload();
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}

	function openLoginOverlay() {
		loginOverlayOpen = true;
		registerMode = false;
		authError = '';
	}

	function openRegisterOverlay() {
		loginOverlayOpen = true;
		registerMode = true;
		authError = '';
	}

	onMount(() => {
		// Load settings from localStorage
		const savedSettings = localStorage.getItem('ggez-settings');
		if (savedSettings) {
			const settings = JSON.parse(savedSettings);
			darkMode = settings.darkMode ?? true;
			autoRefresh = settings.autoRefresh ?? false;
			showRankEmblems = settings.showRankEmblems ?? true;
			animationsEnabled = settings.animationsEnabled ?? true;
			language = settings.language ?? 'en';
		}
		
		// Apply dark mode
		applyDarkMode();
		
		// Track fullscreen state (client-side only)
		const handleFullscreenChange = () => {
			isPageFullscreen = !!document.fullscreenElement;
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	});
	
	function applyDarkMode() {
		if (typeof document !== 'undefined') {
			if (darkMode) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}
	
	function saveSettings() {
		// Save to localStorage
		const settings = {
			darkMode,
			autoRefresh,
			showRankEmblems,
			animationsEnabled,
			language
		};
		localStorage.setItem('ggez-settings', JSON.stringify(settings));
		
		// Apply settings
		applyDarkMode();
		
		// Show toast
		showSaveToast = true;
		setTimeout(() => {
			showSaveToast = false;
		}, 3000);
		
		// Close overlay
		settingsOverlayOpen = false;
	}
	
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
<nav class="fixed top-0 left-0 right-0 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 bg-black backdrop-blur-md border-b border-white/10 z-40">
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
			<a href="/tierlist" class="nav-link">Tier List</a>
			<a href="/champions" class="nav-link">Champions</a>
			<a href="/leaderboards" class="nav-link">Leaderboards</a>
		</div>
	</div>
	
	<!-- Center Search (only on non-homepage) -->
	{#if !isHomepage}
		<div class="hidden md:block flex-1 max-w-xl mx-8">
			<UnifiedSearch showRegionSelector={false} placeholder="Search Summoner or Champion..." />
		</div>
	{/if}
	
	<!-- Right Icons (Reordered: Fullscreen, Settings, Profile) -->
	<div class="flex items-center gap-2 md:gap-3">
		<!-- Fullscreen Icon (LEFTMOST) -->
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
		
		<!-- Settings Icon (MIDDLE) -->
		<button 
			on:click={() => settingsOverlayOpen = !settingsOverlayOpen}
			class="icon-btn" 
			title="Settings">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
		</button>
		
		<!-- User/Profile Icon (RIGHTMOST) -->
		{#if $user}
			<div class="flex items-center gap-3">
				<span class="hidden md:block text-sm text-hex-gold font-semibold">{$user.username}</span>
				<button 
					on:click={handleLogout}
					class="icon-btn" 
					title="Logout">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
					</svg>
				</button>
			</div>
		{:else}
			<button 
				on:click={openLoginOverlay}
				class="icon-btn" 
				title="Login / Profile">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
			</button>
		{/if}
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
				<a href="/tierlist" on:click={() => mobileMenuOpen = false} class="mobile-menu-link">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
					</svg>
					<span>Tier List</span>
				</a>
				<a href="/champions" on:click={() => mobileMenuOpen = false} class="mobile-menu-link">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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

<!-- Login Overlay -->
{#if loginOverlayOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
		<div class="bg-hex-darker border border-hex-gold/30 rounded-xl p-8 max-w-md w-full mx-4 relative">
			<!-- Close Button -->
			<button 
				on:click={() => loginOverlayOpen = false}
				class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<!-- Login/Register Form -->
			<h2 class="font-cinzel text-2xl text-hex-gold mb-6 text-center tracking-wider">{registerMode ? 'REGISTER' : 'LOGIN'}</h2>
			
			{#if authError}
				<div class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
					{authError}
				</div>
			{/if}

			<form class="space-y-4" on:submit={registerMode ? handleRegister : handleLogin}>
				<div>
					<label for="username" class="block text-sm text-gray-400 mb-2">Username</label>
					<input 
						id="username"
						type="text" 
						bind:value={username}
						placeholder="Enter your username"
						required
						class="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-hex-gold focus:outline-none transition-colors"
					/>
				</div>
				
				{#if registerMode}
				<div>
					<label for="email" class="block text-sm text-gray-400 mb-2">Email</label>
					<input 
						id="email"
						type="email" 
						bind:value={email}
						placeholder="Enter your email"
						required
						class="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-hex-gold focus:outline-none transition-colors"
					/>
				</div>
				{/if}
				
				<div>
					<label for="password" class="block text-sm text-gray-400 mb-2">Password</label>
					<input 
						id="password"
						type="password" 
						bind:value={password}
						placeholder="Enter your password"
						required
						minlength="6"
						class="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:border-hex-gold focus:outline-none transition-colors"
					/>
				</div>

				<button 
					type="submit"
					disabled={authLoading}
					class="w-full py-3 bg-hex-gold text-black font-bold rounded-lg hover:bg-white transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed">
					{authLoading ? 'LOADING...' : (registerMode ? 'REGISTER' : 'LOGIN')}
				</button>
			</form>

			<div class="text-center mt-4 text-sm text-gray-500">
				{#if registerMode}
					Already have an account? <button on:click={() => registerMode = false} class="text-hex-gold hover:text-white transition-colors">Login</button>
				{:else}
					Don't have an account? <button on:click={openRegisterOverlay} class="text-hex-gold hover:text-white transition-colors">Sign up</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Settings Overlay -->
{#if settingsOverlayOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
		<div class="bg-hex-darker border border-hex-gold/30 rounded-xl p-8 max-w-lg w-full mx-4 relative">
			<!-- Close Button -->
			<button 
				on:click={() => settingsOverlayOpen = false}
				class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
				title="Close">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<!-- Settings Title -->
			<h2 class="font-cinzel text-2xl text-hex-gold mb-6 text-center tracking-wider">SETTINGS</h2>
			
			<!-- Settings Options -->
			<div class="space-y-5">
				<!-- Dark Mode Toggle -->
				<div class="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/5">
					<div>
						<div class="text-white font-semibold mb-1">Dark Mode</div>
						<div class="text-gray-400 text-xs">Toggle dark theme</div>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" bind:checked={darkMode} class="sr-only peer" />
						<div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-hex-gold"></div>
					</label>
				</div>

				<!-- Auto Refresh -->
				<div class="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/5">
					<div>
						<div class="text-white font-semibold mb-1">Auto Refresh</div>
						<div class="text-gray-400 text-xs">Automatically refresh match data</div>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" bind:checked={autoRefresh} class="sr-only peer" />
						<div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-hex-gold"></div>
					</label>
				</div>

				<!-- Show Rank Emblems -->
				<div class="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/5">
					<div>
						<div class="text-white font-semibold mb-1">Rank Emblems</div>
						<div class="text-gray-400 text-xs">Display animated rank emblems</div>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" bind:checked={showRankEmblems} class="sr-only peer" />
						<div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-hex-gold"></div>
					</label>
				</div>

				<!-- Animations -->
				<div class="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/5">
					<div>
						<div class="text-white font-semibold mb-1">Animations</div>
						<div class="text-gray-400 text-xs">Enable page animations</div>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" bind:checked={animationsEnabled} class="sr-only peer" />
						<div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-hex-gold"></div>
					</label>
				</div>

				<!-- Language Selection -->
				<div class="p-4 bg-black/30 rounded-lg border border-white/5">
					<div class="text-white font-semibold mb-3">Language</div>
					<select bind:value={language} class="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:border-hex-gold focus:outline-none transition-colors">
						<option value="en">🇬🇧 English</option>
						<option value="de">🇩🇪 Deutsch</option>
						<option value="fr">🇫🇷 Français</option>
						<option value="es">🇪🇸 Español</option>
						<option value="kr">🇰🇷 한국어</option>
					</select>
				</div>
			</div>

			<!-- Save Button -->
			<button 
				on:click={saveSettings}
				class="w-full py-3 bg-hex-gold text-black font-bold rounded-lg hover:bg-white transition-all mt-6">
				SAVE SETTINGS
			</button>
		</div>
	</div>
{/if}

<!-- Save Toast Notification -->
{#if showSaveToast}
	<div class="fixed top-24 right-4 z-50 animate-fade-in">
		<div class="bg-hex-gold text-black px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			<span class="font-semibold">Settings saved!</span>
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
