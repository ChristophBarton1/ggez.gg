<script>
	export let championStats = [];
	
	// Max games for bar width calculation
	$: maxGames = championStats.length > 0 ? Math.max(...championStats.map(c => c.games)) : 1;
	
	function getWinrateColor(winrate) {
		if (winrate >= 60) return 'from-green-500 to-green-600';
		if (winrate >= 50) return 'from-blue-500 to-blue-600';
		if (winrate >= 40) return 'from-yellow-500 to-yellow-600';
		return 'from-red-500 to-red-600';
	}
	
	function getChampionIcon(championId) {
		return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${getChampionNameById(championId)}.png`;
	}
	
	function getChampionNameById(championId) {
		// Map common champion IDs to names (simplified)
		// In production, use Data Dragon champions.json
		return championId.toString();
	}
</script>

<div class="champion-performance glass-card border border-hex-gold/20 p-6 rounded-lg mt-4 mb-8">
	<div class="mb-6">
		<h3 class="font-cinzel text-hex-gold text-base uppercase tracking-wider">Recent Match Performance - Last 20 Games</h3>
		<p class="text-xs text-gray-500 mt-1">Champion stats from your recent matches</p>
	</div>
	
	{#if championStats.length > 0}
		<div class="space-y-3">
			{#each championStats.slice(0, 10) as champion}
				<div class="champion-row flex items-center gap-4 p-3 glass-card border border-white/5 rounded-lg hover:border-hex-blue/30 transition-all group">
					<!-- Champion Icon -->
					<div class="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 border-hex-gold/30 group-hover:border-hex-blue/50 transition-colors">
						<img 
							src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.championName}.png`}
							alt={champion.championName}
							class="w-full h-full object-cover"
							on:error={(e) => e.target.src = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/29.png'}
						/>
					</div>
					
					<!-- Champion Name -->
					<div class="flex-shrink-0 w-24">
						<div class="font-semibold text-white text-sm">{champion.championName}</div>
						<div class="text-xs text-gray-500">{champion.games} game{champion.games !== 1 ? 's' : ''}</div>
					</div>
					
					<!-- Performance Bar -->
					<div class="flex-1 min-w-0">
						<!-- Winrate Bar -->
						<div class="relative h-8 bg-black/40 rounded-lg overflow-hidden border border-white/10">
							<div 
								class="absolute inset-y-0 left-0 bg-gradient-to-r {getWinrateColor(champion.winrate)} transition-all duration-500"
								style="width: {champion.winrate}%"
							></div>
							<div class="absolute inset-0 flex items-center justify-center">
								<span class="text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
									{champion.winrate.toFixed(1)}% WR
								</span>
							</div>
						</div>
					</div>
					
					<!-- Stats -->
					<div class="flex-shrink-0 flex items-center gap-4 text-xs">
						<!-- W/L -->
						<div class="text-center">
							<div class="text-gray-400">W/L</div>
							<div class="font-semibold">
								<span class="text-green-400">{champion.wins}</span>
								<span class="text-gray-600">/</span>
								<span class="text-red-400">{champion.games - champion.wins}</span>
							</div>
						</div>
						
						<!-- KDA -->
						<div class="text-center min-w-[60px]">
							<div class="text-gray-400">KDA</div>
							<div class="font-semibold text-hex-blue">{champion.kda.toFixed(2)}</div>
						</div>
						
						<!-- Avg Stats -->
						<div class="text-center min-w-[80px]">
							<div class="text-gray-400">K/D/A</div>
							<div class="font-semibold text-gray-300">
								{champion.avgKills.toFixed(1)}/{champion.avgDeaths.toFixed(1)}/{champion.avgAssists.toFixed(1)}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
		
		<!-- Legend -->
		<div class="mt-6 pt-4 border-t border-hex-gold/10 flex justify-between items-center text-xs text-gray-500">
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-green-600"></div>
					<span>60%+ WR</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-blue-600"></div>
					<span>50-59% WR</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
					<span>40-49% WR</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded bg-gradient-to-r from-red-500 to-red-600"></div>
					<span>&lt;40% WR</span>
				</div>
			</div>
			<div class="italic">
				Showing top {Math.min(10, championStats.length)} most played champions
			</div>
		</div>
	{:else}
		<div class="text-center py-12 text-gray-500">
			<p>No recent match data available</p>
		</div>
	{/if}
</div>

<style>
	.champion-row:hover {
		transform: translateX(4px);
	}
</style>
