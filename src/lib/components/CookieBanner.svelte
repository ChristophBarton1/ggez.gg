<script>
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	
	let showBanner = false;
	let showDetails = false;
	
	onMount(() => {
		// Check if user has already accepted/rejected cookies
		const consent = localStorage.getItem('cookie-consent');
		if (!consent) {
			// Show banner after 1 second delay
			setTimeout(() => {
				showBanner = true;
			}, 1000);
		}
	});
	
	function acceptAll() {
		localStorage.setItem('cookie-consent', 'all');
		showBanner = false;
	}
	
	function acceptNecessary() {
		localStorage.setItem('cookie-consent', 'necessary');
		showBanner = false;
	}
	
	function toggleDetails() {
		showDetails = !showDetails;
	}
</script>

{#if showBanner}
	<!-- Minimal Cookie Banner - Bottom Right -->
	<div 
		class="fixed bottom-6 right-6 max-w-sm z-50"
		in:fly={{ y: 100, duration: 400 }}
		out:fly={{ y: 100, duration: 300 }}>
		
		<div class="bg-[#0a1428]/95 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-6">
			<!-- Header -->
			<div class="flex items-start gap-3 mb-4">
				<div class="w-10 h-10 rounded-full bg-[#c8aa6e]/20 flex items-center justify-center flex-shrink-0">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#c8aa6e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div>
					<h3 class="text-white font-bold text-sm mb-1">Cookie Einstellungen</h3>
					<p class="text-gray-400 text-xs leading-relaxed">
						Wir verwenden Cookies für Login-Sessions und Site-Funktionalität.
					</p>
				</div>
			</div>

			<!-- Details Toggle -->
			{#if showDetails}
				<div class="mb-4 p-3 bg-black/30 rounded-lg text-xs text-gray-300 space-y-2" transition:fly={{ y: -10, duration: 200 }}>
					<div>
						<strong class="text-white">Notwendige Cookies:</strong>
						<p class="text-gray-400 mt-1">Session Management, Login-Status, Sicherheit</p>
					</div>
					<div>
						<strong class="text-white">Analytics (Optional):</strong>
						<p class="text-gray-400 mt-1">Verbesserung der User Experience</p>
					</div>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex flex-col gap-2">
				<button
					on:click={acceptAll}
					class="w-full py-2.5 bg-gradient-to-r from-[#c8aa6e] to-[#f0e6d2] text-black font-bold rounded-lg text-sm hover:shadow-lg hover:shadow-[#c8aa6e]/30 transition-all">
					Alle Akzeptieren
				</button>
				
				<div class="flex gap-2">
					<button
						on:click={acceptNecessary}
						class="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg transition-colors">
						Nur Notwendige
					</button>
					
					<button
						on:click={toggleDetails}
						class="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg transition-colors">
						{showDetails ? 'Weniger' : 'Details'}
					</button>
				</div>
			</div>

			<!-- Legal Links -->
			<div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-2 text-xs">
				<a href="/privacy" class="text-gray-400 hover:text-[#c8aa6e] transition-colors">Datenschutz</a>
				<span class="text-gray-600">•</span>
				<a href="/impressum" class="text-gray-400 hover:text-[#c8aa6e] transition-colors">Impressum</a>
			</div>
		</div>
	</div>
{/if}
