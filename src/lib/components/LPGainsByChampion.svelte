<script>
	export let championStats = [];
	export let summonerPuuid = '';

	let queueFilter = 'all'; // 'all', 'solo', 'flex'
	let roleFilter = 'all'; // 'all', 'TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'
	
	// Sorting state
	let sortBy = 'lpChange'; // Default sort by LP
	let sortDirection = 'desc'; // 'asc' or 'desc'
	
	// Pagination for lazy loading
	let displayLimit = 20;
	
	// Reset display limit when championStats changes
	$: if (championStats) {
		displayLimit = 20;
	}
	
	// Get total LP change across all champions
	$: totalLPChange = championStats.reduce((sum, champ) => sum + champ.lpChange, 0);
	$: totalGames = championStats.reduce((sum, champ) => sum + champ.games, 0);
	$: totalWins = championStats.reduce((sum, champ) => sum + champ.wins, 0);
	$: overallWinrate = totalGames > 0 ? (totalWins / totalGames * 100).toFixed(1) : 0;

	// Filter champions
	$: filteredChampions = championStats.filter(champ => {
		if (roleFilter !== 'all' && champ.role !== roleFilter) return false;
		return true;
	});

	// Sort champions
	$: sortedChampions = [...filteredChampions].sort((a, b) => {
		let aVal = a[sortBy];
		let bVal = b[sortBy];
		
		// Handle special cases
		if (sortBy === 'championName') {
			aVal = a.championName.toLowerCase();
			bVal = b.championName.toLowerCase();
			return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
		}
		
		// Numeric sorting
		const diff = sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
		return diff;
	});
	
	// Display limited champions for lazy loading
	$: displayedChampions = sortedChampions.slice(0, displayLimit);

	function setSortBy(column) {
		if (sortBy === column) {
			// Toggle direction if same column
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// New column, default to descending (except for name)
			sortBy = column;
			sortDirection = column === 'championName' ? 'asc' : 'desc';
		}
	}
	
	function loadMoreChampions() {
		displayLimit += 20;
	}

	function getLPChangeClass(lpChange) {
		if (lpChange > 0) return 'text-green-400 font-semibold';
		if (lpChange < 0) return 'text-red-400 font-semibold';
		return 'text-gray-400';
	}

	function getRoleIcon(role) {
		const icons = {
			'TOP': '⚔️',
			'JUNGLE': '🌲',
			'MIDDLE': '✨',
			'BOTTOM': '🎯',
			'UTILITY': '🛡️'
		};
		return icons[role] || '❓';
	}

	function getWinRateClass(winrate) {
		if (winrate >= 60) return 'text-hex-blue font-semibold';
		if (winrate >= 50) return 'text-green-400';
		if (winrate >= 40) return 'text-yellow-400';
		return 'text-red-400';
	}
</script>

<div class="lp-gains-container glass-card border border-hex-gold/30 p-6 rounded-lg mb-8">
	<div class="header mb-6 border-b border-hex-gold/20 pb-4">
		<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
			<div>
				<h2 class="font-cinzel text-2xl text-white tracking-wider">Champion Pool</h2>
				<p class="text-sm text-gray-400 mt-2">LP gains and performance by champion (Ranked games only)</p>
			</div>
			
			<!-- Filters -->
			<div class="flex gap-3">
				<!-- Role Filter -->
				<select 
					bind:value={roleFilter}
					class="bg-hex-darker/80 border border-hex-gold/30 text-white px-4 py-2 rounded font-semibold text-sm hover:border-hex-gold/50 transition-colors cursor-pointer"
				>
					<option value="all">All Roles</option>
					<option value="TOP">⚔️ Top</option>
					<option value="JUNGLE">🌲 Jungle</option>
					<option value="MIDDLE">✨ Mid</option>
					<option value="BOTTOM">🎯 ADC</option>
					<option value="UTILITY">🛡️ Support</option>
				</select>
			</div>
		</div>

		<!-- Summary Stats -->
		{#if totalGames > 0}
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-hex-gold/20">
				<div class="stat-box text-center">
					<div class="stat-label text-xs text-gray-500 uppercase tracking-wide mb-1">Total LP Change</div>
					<div class="stat-value text-2xl font-bold font-cinzel {totalLPChange >= 0 ? 'text-green-400' : 'text-red-400'}">
						{totalLPChange > 0 ? '+' : ''}{totalLPChange}
					</div>
				</div>
				<div class="stat-box text-center">
					<div class="stat-label text-xs text-gray-500 uppercase tracking-wide mb-1">Total Games</div>
					<div class="stat-value text-2xl font-bold font-cinzel text-white">
						{totalGames}
					</div>
				</div>
				<div class="stat-box text-center">
					<div class="stat-label text-xs text-gray-500 uppercase tracking-wide mb-1">Wins / Losses</div>
					<div class="stat-value text-lg font-bold text-white">
						<span class="text-green-400">{totalWins}W</span> / <span class="text-red-400">{totalGames - totalWins}L</span>
					</div>
				</div>
				<div class="stat-box text-center">
					<div class="stat-label text-xs text-gray-500 uppercase tracking-wide mb-1">Win Rate</div>
					<div class="stat-value text-2xl font-bold font-cinzel {overallWinrate >= 50 ? 'text-hex-blue' : 'text-yellow-400'}">
						{overallWinrate}%
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div class="overflow-x-auto">
		<table class="champion-pool-table w-full text-sm">
			<thead>
				<tr class="border-b border-hex-gold/20">
					<th class="text-left py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide">#</th>
					<th 
						class="sortable-header text-left py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-hex-gold transition-colors"
						on:click={() => setSortBy('championName')}
					>
						<div class="flex items-center gap-1">
							Champion
							{#if sortBy === 'championName'}
								<span class="text-hex-gold">{sortDirection === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</div>
					</th>
					<th 
						class="sortable-header text-center py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-hex-gold transition-colors"
						on:click={() => setSortBy('role')}
					>
						<div class="flex items-center justify-center gap-1">
							Role
							{#if sortBy === 'role'}
								<span class="text-hex-gold">{sortDirection === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</div>
					</th>
					<th 
						class="sortable-header text-center py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-hex-gold transition-colors"
						on:click={() => setSortBy('games')}
					>
						<div class="flex items-center justify-center gap-1">
							Games
							{#if sortBy === 'games'}
								<span class="text-hex-gold">{sortDirection === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</div>
					</th>
					<th 
						class="sortable-header text-center py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-hex-gold transition-colors"
						on:click={() => setSortBy('lpChange')}
					>
						<div class="flex items-center justify-center gap-1">
							LP
							{#if sortBy === 'lpChange'}
								<span class="text-hex-gold">{sortDirection === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</div>
					</th>
					<th 
						class="sortable-header text-center py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-hex-gold transition-colors"
						on:click={() => setSortBy('winrate')}
					>
						<div class="flex items-center justify-center gap-1">
							WR
							{#if sortBy === 'winrate'}
								<span class="text-hex-gold">{sortDirection === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</div>
					</th>
					<th 
						class="sortable-header text-center py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-hex-gold transition-colors"
						on:click={() => setSortBy('kda')}
					>
						<div class="flex items-center justify-center gap-1">
							KDA
							{#if sortBy === 'kda'}
								<span class="text-hex-gold">{sortDirection === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</div>
					</th>
					<th 
						class="sortable-header text-center py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-hex-gold transition-colors"
						on:click={() => setSortBy('csPerMin')}
					>
						<div class="flex items-center justify-center gap-1">
							CS/M
							{#if sortBy === 'csPerMin'}
								<span class="text-hex-gold">{sortDirection === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</div>
					</th>
					<th 
						class="sortable-header text-center py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-hex-gold transition-colors"
						on:click={() => setSortBy('avgGoldDiffAt15')}
					>
						<div class="flex items-center justify-center gap-1">
							GD@15
							{#if sortBy === 'avgGoldDiffAt15'}
								<span class="text-hex-gold">{sortDirection === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</div>
					</th>
					<th 
						class="sortable-header text-center py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-hex-gold transition-colors"
						on:click={() => setSortBy('dpm')}
					>
						<div class="flex items-center justify-center gap-1">
							DPM
							{#if sortBy === 'dpm'}
								<span class="text-hex-gold">{sortDirection === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</div>
					</th>
					<th 
						class="sortable-header text-center py-3 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wide cursor-pointer hover:text-hex-gold transition-colors"
						on:click={() => setSortBy('killParticipation')}
					>
						<div class="flex items-center justify-center gap-1">
							KP
							{#if sortBy === 'killParticipation'}
								<span class="text-hex-gold">{sortDirection === 'asc' ? '▲' : '▼'}</span>
							{/if}
						</div>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each displayedChampions as champion, index}
					<tr class="border-b border-white/5 hover:bg-hex-gold/5 transition-colors">
						<td class="py-4 px-3 text-gray-500 font-semibold">{index + 1}</td>
						<td class="py-4 px-3">
							<div class="flex items-center gap-3">
								<img 
									src="https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/{champion.championName}.png"
									alt={champion.championName}
									class="w-10 h-10 rounded-full border-2 border-hex-gold/30"
									loading="lazy"
								/>
								<span class="text-white font-medium">{champion.championName}</span>
							</div>
						</td>
						<td class="py-4 px-3 text-center text-lg">{getRoleIcon(champion.role)}</td>
						<td class="py-4 px-3 text-center text-white font-semibold">{champion.games}</td>
						<td class="py-4 px-3 text-center">
							<span class={getLPChangeClass(champion.lpChange)}>
								{champion.lpChange > 0 ? '+' : ''}{champion.lpChange}
							</span>
						</td>
						<td class="py-4 px-3 text-center">
							<span class={getWinRateClass(champion.winrate)}>
								{champion.winrate.toFixed(1)}%
							</span>
						</td>
						<td class="py-4 px-3 text-center">
							<span class="text-white">
								{champion.avgKills.toFixed(1)} / {champion.avgDeaths.toFixed(1)} / {champion.avgAssists.toFixed(1)}
							</span>
							<div class="text-xs text-gray-500 mt-1">
								{champion.kda.toFixed(2)} KDA
							</div>
						</td>
						<td class="py-4 px-3 text-center text-white">{champion.csPerMin.toFixed(1)}</td>
						<td class="py-4 px-3 text-center">
							<span class={champion.avgGoldDiffAt15 >= 0 ? 'text-green-400' : 'text-red-400'}>
								{champion.avgGoldDiffAt15 > 0 ? '+' : ''}{champion.avgGoldDiffAt15.toFixed(0)}
							</span>
						</td>
						<td class="py-4 px-3 text-center text-white">{champion.dpm.toFixed(0)}</td>
						<td class="py-4 px-3 text-center text-white">{champion.killParticipation.toFixed(1)}%</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Load More Button -->
	{#if displayedChampions.length < sortedChampions.length}
		<div class="flex justify-center mt-6">
			<button
				on:click={loadMoreChampions}
				class="load-more-champions-btn bg-hex-darker border border-hex-gold/30 text-hex-gold px-8 py-3 font-cinzel text-sm uppercase tracking-wider hover:bg-hex-gold/10 hover:border-hex-gold transition-all duration-300 rounded-lg"
			>
				Show More Champions ({sortedChampions.length - displayedChampions.length} remaining)
			</button>
		</div>
	{/if}

	{#if sortedChampions.length === 0}
		<div class="text-center py-12 text-gray-500">
			<p class="text-lg">No ranked games found in recent matches</p>
		</div>
	{/if}
</div>

<style>
	.champion-pool-table {
		min-width: 1000px;
	}

	.champion-pool-table thead th {
		white-space: nowrap;
	}

	.champion-pool-table tbody tr:last-child {
		border-bottom: none;
	}

	.sortable-header {
		user-select: none;
		position: relative;
	}

	.sortable-header:active {
		transform: scale(0.98);
	}

	.load-more-champions-btn {
		min-width: 280px;
	}

	.load-more-champions-btn:hover {
		box-shadow: 0 0 20px rgba(200, 170, 110, 0.3);
	}

	select {
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23C8AA6E' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 0.5rem center;
		background-repeat: no-repeat;
		background-size: 1.5em 1.5em;
		padding-right: 2.5rem;
		appearance: none;
	}

	select option {
		background-color: #0a0e27;
		color: white;
	}
</style>
