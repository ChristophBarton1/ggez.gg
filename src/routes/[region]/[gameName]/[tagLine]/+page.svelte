<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getSummonerByRiotId, getMatchHistory } from '$lib/api/riot.js';
	import SummonerSearch from '$lib/components/SummonerSearch.svelte';
	import MatchAIChat from '$lib/components/MatchAIChat.svelte';
	import RankHistoryChart from '$lib/components/RankHistoryChart.svelte';
	import { getChampionSplashSrcset, getItemIcon, getProfileIcon } from '$lib/utils/imageProxy.js';

	// Route params - reactive
	$: region = $page.params.region;
	$: gameName = decodeURIComponent($page.params.gameName);
	$: tagLine = decodeURIComponent($page.params.tagLine);

	let summoner = null;
	let matches = [];
	let loading = true;
	let error = null;
	let currentBgImage = '';
	
	// AI Coach state
	let selectedMatch = null;
	let aiChatOpen = false;

	// Reactive: Load data when params change
	$: if (gameName && tagLine && region) {
		loadSummonerData(gameName, tagLine, region);
	}

	async function loadSummonerData(name, tag, reg) {
		loading = true;
		error = null;
		summoner = null;
		matches = [];
		
		// Fetch summoner data
		const summonerData = await getSummonerByRiotId(name, tag, reg);
		
		if (summonerData.error) {
			error = summonerData.error;
			loading = false;
			return;
		}

		summoner = summonerData;

		// Fetch match history
		const matchData = await getMatchHistory(summoner.puuid, reg);
		matches = matchData;

		// Set initial background
		if (matches.length > 0) {
			const firstMatch = matches[0];
			const participant = firstMatch.info.participants.find(p => p.puuid === summoner.puuid);
			if (participant) {
				currentBgImage = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${participant.championName}_0.jpg`;
			}
		}

		loading = false;
	}

	function handleMatchHover(match) {
		const participant = match.info.participants.find(p => p.puuid === summoner.puuid);
		if (participant) {
			currentBgImage = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${participant.championName}_0.jpg`;
		}
	}

	function getRankedData(type = 'RANKED_SOLO_5x5') {
		if (!summoner?.ranked) return null;
		return summoner.ranked.find(r => r.queueType === type);
	}

	function getQueueName(queueType) {
		const names = {
			'RANKED_SOLO_5x5': 'Ranked Solo/Duo',
			'RANKED_FLEX_SR': 'Ranked Flex',
			'RANKED_FLEX_TT': 'Ranked Flex 3v3'
		};
		return names[queueType] || queueType;
	}

	function getTierIcon(tier) {
		return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${tier.toLowerCase()}.png`;
	}

	function formatKDA(kills, deaths, assists) {
		const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
		return kda.toFixed(1);
	}

	function getQueueTypeName(queueId) {
		const queueTypes = {
			420: 'Ranked Solo',
			440: 'Ranked Flex',
			400: 'Normal Draft',
			430: 'Normal Blind',
			450: 'ARAM',
			700: 'Clash',
			900: 'URF',
			1020: 'One For All',
			1300: 'Nexus Blitz',
			1700: 'Arena'
		};
		return queueTypes[queueId] || 'Custom Game';
	}

	function openAICoach(match) {
		selectedMatch = match;
		aiChatOpen = true;
	}
</script>

<svelte:head>
	<title>{gameName} #{tagLine} - League of Legends Stats | easygame.gg</title>
	<meta name="description" content="View detailed League of Legends stats, match history, and performance analytics for {gameName} #{tagLine}. Track KDA, win rate, champion mastery and more.">
	<!-- Performance: Preconnect to CDNs -->
	<link rel="preconnect" href="https://ddragon.leagueoflegends.com">
	<link rel="dns-prefetch" href="https://ddragon.leagueoflegends.com">
</svelte:head>

<!-- Dynamic Background -->
<div class="hero-bg" style="background-image: url('{currentBgImage}');"></div>
<div class="overlay"></div>

<!-- Navigation -->
<nav class="sticky top-0 z-50 flex flex-col sm:grid sm:grid-cols-[150px_1fr_150px] md:grid-cols-[200px_1fr_200px] items-center gap-3 sm:gap-0 px-4 sm:px-6 md:px-10 py-3 sm:py-5 backdrop-blur-xl border-b border-hex-gold/30 bg-hex-darker/95">
	<a href="/" class="font-cinzel text-xl sm:text-2xl text-hex-gold tracking-[1px] sm:tracking-[2px] no-underline hover:text-white transition-colors">
		EASY GAME
	</a>
	<div class="flex justify-center w-full order-3 sm:order-none">
		<div class="w-full max-w-2xl">
			<SummonerSearch showRegionSelector={true} />
		</div>
	</div>
	<button class="hidden sm:flex justify-self-end bg-transparent border border-hex-gold text-hex-gold px-4 md:px-8 py-2 font-cinzel cursor-pointer clip-tech-btn transition-all duration-300 hover:bg-hex-gold hover:text-black text-sm md:text-base">
		LOGIN
	</button>
</nav>

{#if loading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-hex-blue text-2xl font-cinzel animate-pulse">Loading Summoner Data...</div>
	</div>
{:else if error}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-hex-red text-2xl font-cinzel">{error}</div>
	</div>
{:else if summoner}
	<!-- Dashboard Grid -->
	<div class="dashboard-grid max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 sm:gap-8 lg:gap-10 my-6 sm:my-8 lg:my-12 px-4 sm:px-6 lg:px-10 pb-12 sm:pb-24 animate-fade-in-up">
		
		<!-- LEFT COLUMN - Profile Card -->
		<div class="shard-card glass-card border border-hex-gold/30 p-8 clip-tech-input">
			<!-- Summoner Icon -->
			<div class="summoner-icon w-28 h-28 rounded-full border-3 border-hex-gold shadow-[0_0_25px_rgba(200,170,110,0.4)] mb-5 bg-cover"
				 style="background-image: url('https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/{summoner.profileIconId}.png');">
			</div>
			
			<!-- Name & Tag -->
			<h1 class="font-cinzel text-4xl mb-0 text-white leading-none">{summoner.name}</h1>
			<span class="text-gray-500 text-base mb-6 block tracking-[2px]">#{summoner.tag}</span>

			<!-- Level -->
			<div class="text-sm text-gray-400 mt-4 mb-6">
				Level: <span class="text-white font-bold">{summoner.summonerLevel}</span>
			</div>

			<!-- Personal Ratings Section -->
			{#if summoner.ranked && summoner.ranked.length > 0}
				<div class="mt-6 pt-6 border-t border-hex-gold/20">
					<h3 class="font-cinzel text-hex-gold text-sm uppercase tracking-wider mb-4">Personal Ratings</h3>
					
					<!-- Ranked Queues -->
					<div class="space-y-4">
						{#each summoner.ranked as rankedQueue}
							{@const winrate = ((rankedQueue.wins / (rankedQueue.wins + rankedQueue.losses)) * 100).toFixed(1)}
							
							<div class="glass-card border border-hex-gold/20 p-5 rounded-lg hover:border-hex-gold/50 hover:shadow-[0_0_25px_rgba(200,170,110,0.2)] transition-all duration-300">
								<!-- Queue Name Header -->
								<div class="text-xs text-hex-blue uppercase tracking-wide mb-3 font-semibold">
									{getQueueName(rankedQueue.queueType)}
								</div>
								
								<div class="flex items-center gap-5">
									<!-- HUGE Tier Icon -->
									<div class="flex-shrink-0">
										<img 
											src={getTierIcon(rankedQueue.tier)} 
											alt={rankedQueue.tier}
											class="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(200,170,110,0.5)] hover:scale-110 transition-transform duration-300"
										/>
									</div>
									
									<!-- Rank Info -->
									<div class="flex-1">
										<!-- Rank & Division - BIG -->
										<div class="font-cinzel text-white text-2xl mb-2 tracking-wide">
											{rankedQueue.tier} {rankedQueue.rank}
										</div>
										
										<!-- LP - Emphasized -->
										<div class="text-base text-gray-300 mb-2">
											<span class="text-hex-gold font-bold text-xl">{rankedQueue.leaguePoints}</span>
											<span class="text-sm text-gray-400 ml-1">LP</span>
										</div>
										
										<!-- Stats Row -->
										<div class="flex items-center gap-4 text-sm">
											<div class="text-gray-400">
												<span class="text-green-400 font-semibold">{rankedQueue.wins}W</span>
												<span class="text-gray-500"> / </span>
												<span class="text-red-400 font-semibold">{rankedQueue.losses}L</span>
											</div>
											<div class="h-4 w-px bg-gray-600"></div>
											<div class="text-hex-blue font-semibold">
												{winrate}% WR
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
					
					<!-- Rank History Chart -->
					{#if summoner.ranked && summoner.ranked.length > 0}
						{@const mainRanked = summoner.ranked[0]}
						<RankHistoryChart 
							currentTier={mainRanked.tier}
							currentRank={mainRanked.rank}
							currentLP={mainRanked.leaguePoints}
						/>
					{/if}
				</div>
			{/if}
		</div>

		<!-- RIGHT COLUMN - Content -->
		<div class="content-col">
			
			<!-- Stats Row -->
			<div class="stats-row grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6 sm:mb-8">
				{#if getRankedData()}
					{@const ranked = getRankedData()}
					{@const winrate = ((ranked.wins / (ranked.wins + ranked.losses)) * 100).toFixed(0)}
					
					<div class="stat-shard glass-card border border-white/10 p-6 clip-tech-card">
						<h4 class="m-0 mb-2 text-hex-gold text-xs uppercase tracking-wider">Winrate</h4>
						<div class="text-5xl font-bold text-hex-blue">{winrate}%</div>
						<div class="text-xs text-gray-500 mt-1">{ranked.wins + ranked.losses} Games</div>
					</div>

					<div class="stat-shard glass-card border border-white/10 p-6 clip-tech-card">
						<h4 class="m-0 mb-2 text-hex-gold text-xs uppercase tracking-wider">Rank</h4>
						<div class="text-3xl font-bold text-white font-cinzel">{ranked.tier} {ranked.rank}</div>
						<div class="text-xs text-gray-500 mt-1">{ranked.leaguePoints} LP</div>
					</div>

					<div class="stat-shard glass-card border border-white/10 p-6 clip-tech-card">
						<h4 class="m-0 mb-2 text-hex-gold text-xs uppercase tracking-wider">Games</h4>
						<div class="text-5xl font-bold text-white">{ranked.wins + ranked.losses}</div>
						<div class="text-xs text-gray-500 mt-1">{ranked.wins}W {ranked.losses}L</div>
					</div>
				{/if}
			</div>

			<!-- Match History -->
			<h2 class="history-title font-cinzel text-3xl mb-5 text-white border-b border-hex-gold/30 pb-2 inline-block">
				Combat Record
			</h2>

			<div class="match-list flex flex-col gap-4">
				{#each matches as match, i}
					{@const participant = match.info.participants.find(p => p.puuid === summoner.puuid)}
					{@const win = participant?.win}
					{@const duration = Math.floor(match.info.gameDuration / 60)}
					{@const kda = formatKDA(participant.kills, participant.deaths, participant.assists)}
					{@const champImg = getChampionSplashSrcset(participant.championName)}
				
				<div 
					class="match-row {win ? 'win' : 'loss'} flex flex-col sm:flex-row h-auto sm:h-32 glass-card border border-white/5 backdrop-blur-sm transition-all duration-300 relative overflow-hidden cursor-pointer clip-tech-card hover:scale-[1.02] hover:border-hex-gold hover:bg-opacity-85 hover:z-10"
					on:mouseenter={() => handleMatchHover(match)}
					role="button"
					tabindex="0"
				>
					<!-- Win/Loss Indicator -->
					<div class="match-indicator w-2 h-full {win ? 'bg-hex-blue shadow-neon' : 'bg-hex-red shadow-[0_0_20px_rgba(255,78,80,0.5)]'}"></div>
					
					<!-- Champion Image - WebP optimized via proxy (70% smaller!) -->
					<img 
						src={champImg.src}
						srcset={champImg.srcset}
						sizes={champImg.sizes}
						alt={participant.championName}
						width="214"
						height="126"
						fetchpriority={i === 0 ? 'high' : 'auto'}
						loading={i < 2 ? 'eager' : 'lazy'}
						decoding="async"
						class="match-champ-img w-full sm:w-44 h-32 sm:h-full object-cover"
						style="mask-image: linear-gradient(to right, black 40%, transparent 100%); -webkit-mask-image: linear-gradient(to right, black 50%, transparent 100%);"
					/>
					
					<!-- Match Details -->
					<div class="match-details flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-4 sm:px-10 py-4 sm:py-0 sm:pl-3">
						<div>
							<div class="result-text font-cinzel text-xl font-bold mb-1 {win ? 'text-hex-blue' : 'text-hex-red'}">
								{win ? 'VICTORY' : 'DEFEAT'}
							</div>
							<div class="text-sm text-gray-400">{getQueueTypeName(match.info.queueId)} • {duration}m</div>
						</div>
						
						<div class="kda-box">
							<div class="kda-main text-3xl font-bold text-white tracking-wider">
								{participant.kills} / {participant.deaths} / {participant.assists}
							</div>
							<div class="kda-sub text-sm text-gray-500 mt-1">
								{kda} KDA {#if participant.challenges?.kda > 5}<span class="text-hex-gold">• MVP</span>{/if}
							</div>
						</div>
						
						<!-- Items -->
						<div class="items-box flex gap-1 flex-wrap sm:flex-nowrap">
							{#each [participant.item0, participant.item1, participant.item2, participant.item3, participant.item4, participant.item5, participant.item6] as itemId}
								{#if itemId && itemId > 0}
									<img 
										src="https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/{itemId}.png"
										alt="Item {itemId}"
										class="item-icon w-8 h-8 sm:w-10 sm:h-10 bg-[#111] border border-gray-700 rounded object-cover"
										loading="lazy"
										on:error={(e) => e.target.style.display = 'none'}
									/>
								{:else}
									<div class="item-icon w-8 h-8 sm:w-10 sm:h-10 bg-[#0a0a0a] border border-gray-800 rounded opacity-30"></div>
								{/if}
							{/each}
						</div>
						
						<!-- AI Coach Button -->
						<button
							on:click|stopPropagation={() => openAICoach(match)}
							class="ai-coach-btn flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-hex-blue/20 to-hex-gold/20 hover:from-hex-blue/30 hover:to-hex-gold/30 border border-hex-blue/30 hover:border-hex-gold/50 rounded-lg transition-all duration-300 group"
							title="Ask AI about this match"
						>
							<span class="text-2xl group-hover:scale-110 transition-transform">🤖</span>
							<span class="text-xs sm:text-sm font-semibold text-hex-blue group-hover:text-hex-gold transition-colors">
								Ask AI
							</span>
						</button>
					</div>
				</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- AI Match Coach Component -->
{#if selectedMatch}
	<MatchAIChat 
		bind:isOpen={aiChatOpen}
		match={selectedMatch}
		summonerPuuid={summoner.puuid}
	/>
{/if}

<style>
	.hero-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		z-index: -2;
		background-size: cover;
		background-position: center;
		filter: brightness(0.35);
		transition: all 0.5s ease;
		pointer-events: none;
	}

	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle at 70% 50%, transparent 10%, #010a13 95%);
		z-index: -1;
		pointer-events: none;
	}

	.match-champ-img {
		-webkit-mask-image: linear-gradient(to right, black 50%, transparent 100%);
		mask-image: linear-gradient(to right, black 40%, transparent 100%);
	}

	/* Fix mobile scrolling */
	:global(body) {
		overflow-y: auto !important;
		overflow-x: hidden;
		min-height: 100vh;
	}
</style>
