<script>
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	
	export let data;
	
	onMount(() => {
		console.log('🎮 Dashboard loaded!');
		console.log('📊 Data:', {
			user: data.user?.riot_game_name,
			ranked: data.ranked?.length,
			matches: data.matches?.length,
			masteries: data.masteries?.length,
			error: data.error
		});
	});
	
	$: soloQueue = data.ranked?.find(r => r.queueType === 'RANKED_SOLO_5x5');
	$: flexQueue = data.ranked?.find(r => r.queueType === 'RANKED_FLEX_SR');
	
	function getRankColor(tier) {
		const colors = {
			'IRON': '#6B5D52',
			'BRONZE': '#8B5A3C',
			'SILVER': '#A8B8C4',
			'GOLD': '#c8aa6e',
			'PLATINUM': '#2ECC71',
			'EMERALD': '#10b981',
			'DIAMOND': '#3498DB',
			'MASTER': '#9B59B6',
			'GRANDMASTER': '#E74C3C',
			'CHALLENGER': '#F39C12'
		};
		return colors[tier] || '#fff';
	}
	
	function getRankEmoji(tier) {
		const emojis = {
			'IRON': '⚫',
			'BRONZE': '🟤',
			'SILVER': '⚪',
			'GOLD': '🥇',
			'PLATINUM': '💎',
			'EMERALD': '💚',
			'DIAMOND': '💠',
			'MASTER': '🔮',
			'GRANDMASTER': '👑',
			'CHALLENGER': '⭐'
		};
		return emojis[tier] || '🎮';
	}
	
	function formatWinRate(wins, losses) {
		const total = wins + losses;
		if (total === 0) return '0%';
		return Math.round((wins / total) * 100) + '%';
	}
	
	function getPlayerStats(match) {
		if (!match?.info?.participants) return null;
		return match.info.participants.find(p => p.puuid === data.user.riot_puuid);
	}
	
	function formatGameDuration(seconds) {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
	
	function formatTimestamp(timestamp) {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now - date;
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);
		
		if (diffHours < 24) return `vor ${diffHours}h`;
		if (diffDays === 1) return 'vor 1 Tag';
		return `vor ${diffDays} Tagen`;
	}
</script>

<svelte:head>
	<title>Dashboard - {data.user.riot_game_name}#{data.user.riot_tag_line}</title>
</svelte:head>

<div class="fixed inset-0 -z-50 bg-[#050508]">
	<div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
</div>

<div class="max-w-7xl mx-auto px-6 pt-28 pb-20" in:fly={{ y: 30, duration: 600, easing: quintOut }}>
	
	<!-- Header -->
	<div class="mb-12 border-b border-white/5 pb-8">
		<h1 class="text-5xl font-cinzel font-black text-white mb-2 tracking-wide drop-shadow-lg">
			DEIN <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#c8aa6e] to-[#f0e6d2]">DASHBOARD</span>
		</h1>
		<p class="text-2xl text-[#c8aa6e] font-semibold">
			{data.user.riot_game_name}#{data.user.riot_tag_line}
		</p>
	</div>

	{#if data.error}
		<div class="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-red-400">
			❌ {data.error}
		</div>
	{:else}

		<!-- Ranked Stats Grid -->
		<div class="grid md:grid-cols-2 gap-6 mb-8">
			<!-- Solo/Duo Queue -->
			{#if soloQueue}
				<div class="bg-[#0a1428]/80 backdrop-blur-md border border-white/10 rounded-xl p-8">
					<h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
						<span style="color: {getRankColor(soloQueue.tier)}">{getRankEmoji(soloQueue.tier)}</span>
						Ranked Solo/Duo
					</h3>
					
					<div class="space-y-4">
						<div class="text-center">
							<div class="text-4xl font-bold mb-2" style="color: {getRankColor(soloQueue.tier)}">
								{soloQueue.tier} {soloQueue.rank}
							</div>
							<div class="text-2xl text-white font-semibold">{soloQueue.leaguePoints} LP</div>
						</div>
						
						<div class="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
							<div class="text-center">
								<div class="text-2xl font-bold text-green-400">{soloQueue.wins}</div>
								<div class="text-xs text-gray-400">Siege</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-red-400">{soloQueue.losses}</div>
								<div class="text-xs text-gray-400">Niederlagen</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-[#c8aa6e]">
									{formatWinRate(soloQueue.wins, soloQueue.losses)}
								</div>
								<div class="text-xs text-gray-400">Win Rate</div>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="bg-[#0a1428]/80 backdrop-blur-md border border-white/10 rounded-xl p-8">
					<h3 class="text-xl font-bold text-white mb-6">Ranked Solo/Duo</h3>
					<p class="text-gray-400 text-center py-8">Unranked</p>
				</div>
			{/if}

			<!-- Flex Queue -->
			{#if flexQueue}
				<div class="bg-[#0a1428]/80 backdrop-blur-md border border-white/10 rounded-xl p-8">
					<h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
						<span style="color: {getRankColor(flexQueue.tier)}">{getRankEmoji(flexQueue.tier)}</span>
						Ranked Flex
					</h3>
					
					<div class="space-y-4">
						<div class="text-center">
							<div class="text-4xl font-bold mb-2" style="color: {getRankColor(flexQueue.tier)}">
								{flexQueue.tier} {flexQueue.rank}
							</div>
							<div class="text-2xl text-white font-semibold">{flexQueue.leaguePoints} LP</div>
						</div>
						
						<div class="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
							<div class="text-center">
								<div class="text-2xl font-bold text-green-400">{flexQueue.wins}</div>
								<div class="text-xs text-gray-400">Siege</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-red-400">{flexQueue.losses}</div>
								<div class="text-xs text-gray-400">Niederlagen</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-[#c8aa6e]">
									{formatWinRate(flexQueue.wins, flexQueue.losses)}
								</div>
								<div class="text-xs text-gray-400">Win Rate</div>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="bg-[#0a1428]/80 backdrop-blur-md border border-white/10 rounded-xl p-8">
					<h3 class="text-xl font-bold text-white mb-6">Ranked Flex</h3>
					<p class="text-gray-400 text-center py-8">Unranked</p>
				</div>
			{/if}
		</div>

		<!-- Top Champions (Mastery) -->
		{#if data.masteries && data.masteries.length > 0}
			<div class="bg-[#0a1428]/80 backdrop-blur-md border border-white/10 rounded-xl p-8 mb-8">
				<h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
					⭐ Top Champions (Mastery)
				</h3>
				<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
					{#each data.masteries as mastery}
						<div class="bg-black/50 rounded-lg p-4 border border-white/10 text-center">
							<div class="text-lg font-bold text-[#c8aa6e] mb-1">Champion #{mastery.championId}</div>
							<div class="text-sm text-gray-400 mb-2">Lvl {mastery.championLevel}</div>
							<div class="text-xs text-gray-500">{mastery.championPoints.toLocaleString()} pts</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Recent Matches -->
		{#if data.matches && data.matches.length > 0}
			<div class="bg-[#0a1428]/80 backdrop-blur-md border border-white/10 rounded-xl p-8">
				<h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-2">
					📊 Letzte Matches
				</h3>
				<div class="space-y-3">
					{#each data.matches as match}
						{@const playerStats = getPlayerStats(match)}
						{#if playerStats}
							{@const won = playerStats.win}
							<div class="bg-black/30 rounded-lg p-4 border-l-4 {won ? 'border-green-500' : 'border-red-500'}">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-4">
										<div class="text-center">
											<div class="text-2xl font-bold {won ? 'text-green-400' : 'text-red-400'}">
												{won ? 'SIEG' : 'NIEDERLAGE'}
											</div>
											<div class="text-xs text-gray-400">{match.info.gameMode}</div>
										</div>
										<div class="border-l border-white/10 pl-4">
											<div class="text-lg font-semibold text-white">
												{playerStats.championName}
											</div>
											<div class="text-sm text-gray-400">
												{playerStats.kills}/{playerStats.deaths}/{playerStats.assists}
											</div>
										</div>
									</div>
									<div class="text-right">
										<div class="text-sm text-gray-400">
											{formatGameDuration(match.info.gameDuration)}
										</div>
										<div class="text-xs text-gray-500">
											{formatTimestamp(match.info.gameCreation)}
										</div>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{:else}
			<div class="bg-[#0a1428]/80 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center">
				<p class="text-gray-400">Keine aktuellen Matches gefunden</p>
			</div>
		{/if}

	{/if}
</div>
