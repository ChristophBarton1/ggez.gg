<script>
	import { onMount } from 'svelte';

	export let puuid;
	export let region;
	export let summonerName;

	let loading = false;
	let analysis = null;
	let error = null;

	async function analyzePlayer() {
		if (!puuid || !region) {
			error = 'Missing player information';
			return;
		}

		loading = true;
		error = null;

		try {
			// Fetch recent matches (you'll need to implement this API route)
			const matchesResponse = await fetch(`/api/matches/${puuid}?region=${region}&count=20`);
			if (!matchesResponse.ok) throw new Error('Failed to fetch matches');
			
			const matches = await matchesResponse.json();

			// Analyze with AI Coach
			const analysisResponse = await fetch('/api/coach/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					matches: matches.matches,
					summonerInfo: { puuid, name: summonerName }
				})
			});

			if (!analysisResponse.ok) throw new Error('Failed to analyze');

			const result = await analysisResponse.json();
			analysis = result.analysis;

		} catch (err) {
			error = err.message;
			console.error('Analysis error:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (puuid && region) {
			analyzePlayer();
		}
	});

	// Severity colors
	const severityColors = {
		high: 'text-red-400 bg-red-500/10 border-red-500/20',
		medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
		low: 'text-green-400 bg-green-500/10 border-green-500/20'
	};

	// Category icons (using text emoji for MVP)
	const categoryIcons = {
		'Survival': '🛡️',
		'Vision': '👁️',
		'Farming': '🌾',
		'Late Game': '⏰',
		'Champion Pool': '🎮'
	};
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-3 mb-2">
			<div class="text-4xl">🤖</div>
			<div>
				<h1 class="text-3xl font-bold bg-gradient-to-r from-hex-blue to-hex-gold bg-clip-text text-transparent">
					AI Coach Analysis
				</h1>
				<p class="text-gray-400 mt-1">
					Personalized insights to improve your gameplay
				</p>
			</div>
		</div>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="flex flex-col items-center justify-center py-20">
			<div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-hex-blue mb-4"></div>
			<p class="text-gray-400">Analyzing your last 20 games...</p>
			<p class="text-sm text-gray-500 mt-2">This may take a few seconds</p>
		</div>

	{:else if error}
		<!-- Error State -->
		<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
			<div class="text-4xl mb-3">❌</div>
			<p class="text-red-400 font-medium mb-2">Analysis Failed</p>
			<p class="text-gray-400 text-sm">{error}</p>
			<button 
				on:click={analyzePlayer}
				class="mt-4 px-4 py-2 bg-hex-blue hover:bg-hex-blue/80 rounded-lg transition-colors"
			>
				Try Again
			</button>
		</div>

	{:else if analysis}
		<!-- Analysis Results -->
		<div class="space-y-6">
			
			<!-- Overall Summary Card -->
			<div class="bg-gradient-to-br from-hex-blue/5 to-hex-gold/5 border border-hex-blue/20 rounded-xl p-6 backdrop-blur-sm">
				<div class="flex items-start justify-between mb-4">
					<div>
						<h2 class="text-2xl font-bold text-white mb-2">
							Overall Performance: <span class="text-hex-blue">{analysis.coaching.summary.overall}</span>
						</h2>
						<p class="text-gray-400">Based on {analysis.stats.totalGames} recent games</p>
					</div>
					<div class="text-right">
						<div class="text-3xl font-bold text-hex-gold">{analysis.stats.winRate}%</div>
						<div class="text-sm text-gray-400">Win Rate</div>
					</div>
				</div>

				<!-- Key Stats Grid -->
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
					<div class="bg-black/20 rounded-lg p-4">
						<div class="text-2xl font-bold text-hex-blue">{analysis.stats.kda}</div>
						<div class="text-sm text-gray-400">KDA Ratio</div>
						<div class="text-xs text-gray-500 mt-1">
							{analysis.stats.avgKills}/{analysis.stats.avgDeaths}/{analysis.stats.avgAssists}
						</div>
					</div>
					<div class="bg-black/20 rounded-lg p-4">
						<div class="text-2xl font-bold text-hex-gold">{analysis.stats.avgCS}</div>
						<div class="text-sm text-gray-400">Avg CS</div>
						<div class="text-xs text-gray-500 mt-1">
							{(analysis.stats.avgCS / analysis.stats.avgGameDuration).toFixed(1)}/min
						</div>
					</div>
					<div class="bg-black/20 rounded-lg p-4">
						<div class="text-2xl font-bold text-purple-400">{analysis.stats.avgVisionScore}</div>
						<div class="text-sm text-gray-400">Vision Score</div>
					</div>
					<div class="bg-black/20 rounded-lg p-4">
						<div class="text-2xl font-bold text-green-400">{analysis.stats.avgGoldPerMin}</div>
						<div class="text-sm text-gray-400">Gold/Min</div>
					</div>
				</div>

				<!-- Strengths & Improvements -->
				<div class="grid md:grid-cols-2 gap-4 mt-6">
					{#if analysis.coaching.summary.strengths.length > 0}
						<div class="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
							<h3 class="text-green-400 font-semibold mb-2 flex items-center gap-2">
								<span>✅</span> Your Strengths
							</h3>
							<ul class="space-y-1">
								{#each analysis.coaching.summary.strengths as strength}
									<li class="text-gray-300 text-sm">• {strength}</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if analysis.coaching.summary.improvements.length > 0}
						<div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
							<h3 class="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
								<span>📈</span> Focus Areas
							</h3>
							<ul class="space-y-1">
								{#each analysis.coaching.summary.improvements as improvement}
									<li class="text-gray-300 text-sm">• {improvement}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			</div>

			<!-- Coaching Insights -->
			<div>
				<h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
					<span>💡</span> Coaching Insights
				</h2>
				
				<div class="grid gap-4">
					{#each analysis.coaching.insights as insight}
						<div class="bg-hex-dark/50 border {severityColors[insight.severity]} rounded-xl p-6 backdrop-blur-sm hover:scale-[1.02] transition-transform">
							<div class="flex items-start gap-4">
								<div class="text-3xl">{categoryIcons[insight.category] || '📊'}</div>
								<div class="flex-1">
									<div class="flex items-center justify-between mb-2">
										<h3 class="text-xl font-bold text-white">{insight.title}</h3>
										<span class="text-xs px-2 py-1 rounded {severityColors[insight.severity]}">
											{insight.category}
										</span>
									</div>
									<p class="text-gray-300 mb-3">{insight.description}</p>
									
									<div class="bg-black/30 rounded-lg p-4 mb-3">
										<div class="text-sm text-hex-blue font-semibold mb-1">💡 Coach's Tip:</div>
										<p class="text-gray-300 text-sm">{insight.tip}</p>
									</div>

									<div class="text-sm text-gray-400 italic">
										⚡ {insight.impact}
									</div>
								</div>
							</div>
						</div>
					{/each}

					{#if analysis.coaching.insights.length === 0}
						<div class="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center">
							<div class="text-5xl mb-4">🌟</div>
							<h3 class="text-2xl font-bold text-green-400 mb-2">Excellent Performance!</h3>
							<p class="text-gray-300">
								No major issues detected. Keep up the great work!
							</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Champion Pool Analysis -->
			{#if Object.keys(analysis.stats.championPool).length > 0}
				<div>
					<h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
						<span>🎮</span> Champion Pool
					</h2>
					
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each Object.entries(analysis.stats.championPool).sort((a, b) => b[1].games - a[1].games).slice(0, 6) as [champ, data]}
							{@const winrate = (data.wins / data.games * 100).toFixed(1)}
							{@const isGood = parseFloat(winrate) >= 55}
							<div class="bg-hex-dark/50 border border-hex-blue/20 rounded-lg p-4 hover:border-hex-blue/40 transition-colors">
								<div class="flex items-center justify-between mb-2">
									<h3 class="font-bold text-white">{champ}</h3>
									<span class="text-sm {isGood ? 'text-green-400' : 'text-gray-400'} font-bold">
										{winrate}%
									</span>
								</div>
								<div class="text-sm text-gray-400">
									{data.wins}W - {data.games - data.wins}L ({data.games} games)
								</div>
								<div class="mt-2 w-full bg-gray-700 rounded-full h-2">
									<div 
										class="h-2 rounded-full {isGood ? 'bg-green-500' : 'bg-red-500'}"
										style="width: {winrate}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Refresh Button -->
			<div class="text-center pt-4">
				<button 
					on:click={analyzePlayer}
					class="px-6 py-3 bg-gradient-to-r from-hex-blue to-hex-gold hover:opacity-80 rounded-lg font-semibold transition-opacity"
				>
					Refresh Analysis
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Animation for insights */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	div {
		animation: fadeIn 0.5s ease-out;
	}
</style>
