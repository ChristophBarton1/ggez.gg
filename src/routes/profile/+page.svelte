<script>
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	
	export let data;
	
	let gameName = data.user.riot_game_name || '';
	let tagLine = data.user.riot_tag_line || '';
	let loading = false;
	let message = '';
	let messageType = ''; // 'success' or 'error'
	
	$: isLinked = !!data.user.riot_puuid;
	
	async function handleLinkAccount() {
		if (!gameName || !tagLine) {
			message = 'Bitte Game Name und Tag eingeben';
			messageType = 'error';
			return;
		}
		
		loading = true;
		message = '';
		
		try {
			const res = await fetch('/api/profile/link-riot', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ gameName, tagLine })
			});
			
			const result = await res.json();
			
			if (!res.ok) {
				message = result.error || 'Fehler beim Verknüpfen';
				messageType = 'error';
				return;
			}
			
			message = '✅ Riot Account erfolgreich verknüpft!';
			messageType = 'success';
			
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} catch (error) {
			message = 'Verbindungsfehler';
			messageType = 'error';
		} finally {
			loading = false;
		}
	}
	
	async function handleUnlink() {
		if (!confirm('Riot Account Verknüpfung entfernen?')) return;
		
		loading = true;
		try {
			await fetch('/api/profile/unlink-riot', { method: 'POST' });
			window.location.reload();
		} catch (error) {
			message = 'Fehler beim Entfernen';
			messageType = 'error';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Profil Einstellungen - ggez.gg</title>
</svelte:head>

<div class="fixed inset-0 -z-50 bg-[#050508]">
	<div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
</div>

<div class="max-w-4xl mx-auto px-6 pt-28 pb-20" in:fly={{ y: 30, duration: 600, easing: quintOut }}>
	
	<!-- Header -->
	<div class="mb-12 border-b border-white/5 pb-8">
		<h1 class="text-5xl font-cinzel font-black text-white mb-2 tracking-wide drop-shadow-lg">
			PROFIL <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#c8aa6e] to-[#f0e6d2]">EINSTELLUNGEN</span>
		</h1>
		<p class="text-gray-400 text-lg font-light tracking-wider">
			Verknüpfe deinen Riot Account für personalisierte Stats
		</p>
	</div>

	<!-- User Info Card -->
	<div class="bg-[#0a1428]/80 backdrop-blur-md border border-white/10 rounded-xl p-8 mb-8">
		<div class="flex items-center gap-6">
			<div class="w-20 h-20 rounded-full bg-gradient-to-br from-[#c8aa6e] to-[#f0e6d2] flex items-center justify-center">
				<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
			</div>
			<div>
				<h2 class="text-2xl font-bold text-white mb-1">{data.user.username}</h2>
				<p class="text-gray-400">{data.user.email}</p>
			</div>
		</div>
	</div>

	<!-- Riot Account Section -->
	<div class="bg-[#0a1428]/80 backdrop-blur-md border border-white/10 rounded-xl p-8">
		<div class="flex items-center gap-3 mb-6">
			<svg class="w-8 h-8 text-[#c8aa6e]" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
			</svg>
			<h3 class="text-2xl font-bold text-white">Riot Account</h3>
		</div>

		{#if isLinked}
			<!-- Linked State -->
			<div class="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-green-400 font-semibold mb-2">✓ Account Verknüpft</p>
						<p class="text-2xl font-bold text-white">{data.user.riot_game_name}#{data.user.riot_tag_line}</p>
						<p class="text-xs text-gray-500 mt-2 font-mono">PUUID: {data.user.riot_puuid?.substring(0, 20)}...</p>
					</div>
					<button 
						on:click={handleUnlink}
						disabled={loading}
						class="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50">
						Entfernen
					</button>
				</div>
			</div>
		{:else}
			<!-- Not Linked State -->
			<div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
				<p class="text-yellow-400">⚠️ Kein Riot Account verknüpft</p>
				<p class="text-gray-400 text-sm mt-2">Verknüpfe deinen Account um deine Stats im Dashboard zu sehen</p>
			</div>

			<div class="space-y-4">
				<div>
					<label class="block text-sm font-semibold text-gray-300 mb-2">Game Name</label>
					<input 
						type="text" 
						bind:value={gameName}
						placeholder="z.B. HideOnBush"
						disabled={loading}
						class="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#c8aa6e] focus:outline-none transition-colors disabled:opacity-50">
				</div>

				<div>
					<label class="block text-sm font-semibold text-gray-300 mb-2">Tag Line</label>
					<input 
						type="text" 
						bind:value={tagLine}
						placeholder="z.B. KR1"
						disabled={loading}
						class="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#c8aa6e] focus:outline-none transition-colors disabled:opacity-50">
				</div>

				<button 
					on:click={handleLinkAccount}
					disabled={loading || !gameName || !tagLine}
					class="w-full py-4 bg-gradient-to-r from-[#c8aa6e] to-[#f0e6d2] text-black font-bold rounded-lg hover:shadow-lg hover:shadow-[#c8aa6e]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
					{#if loading}
						Verknüpfe...
					{:else}
						Riot Account Verknüpfen
					{/if}
				</button>
			</div>
		{/if}

		{#if message}
			<div class="mt-6 p-4 rounded-lg {messageType === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}">
				{message}
			</div>
		{/if}

		<!-- Info Box -->
		<div class="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
			<p class="text-sm text-blue-300">
				<strong>ℹ️ Info:</strong> Dein Riot Account wird benötigt um:
			</p>
			<ul class="text-sm text-gray-400 mt-2 space-y-1 ml-4">
				<li>• Ranked Stats im Dashboard anzuzeigen</li>
				<li>• Match History zu tracken</li>
				<li>• Champion Mastery zu sehen</li>
				<li>• Personalisierte Empfehlungen zu erhalten</li>
			</ul>
		</div>
	</div>
</div>
