<script>
	import { onMount } from 'svelte';
	
	export let match;
	export let summoner;
	export let onHover;
	export let onClick;
	
	let isVisible = false;
	let cardElement;
	
	// 🚀 Intersection Observer - Only render when visible
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						isVisible = true;
						observer.unobserve(entry.target);
					}
				});
			},
			{
				rootMargin: '100px', // Load 100px before visible
				threshold: 0.01
			}
		);
		
		if (cardElement) {
			observer.observe(cardElement);
		}
		
		return () => {
			if (cardElement) {
				observer.unobserve(cardElement);
			}
		};
	});
	
	// Extract participant data
	$: participant = match?.info?.participants?.find(p => p.puuid === summoner?.puuid);
	$: won = participant?.win || false;
	$: championName = participant?.championName || 'Unknown';
	$: kills = participant?.kills || 0;
	$: deaths = participant?.deaths || 0;
	$: assists = participant?.assists || 0;
	$: kda = deaths === 0 ? (kills + assists) : ((kills + assists) / deaths).toFixed(1);
	$: gameDuration = Math.floor((match?.info?.gameDuration || 0) / 60);
	$: gameDate = new Date(match?.info?.gameCreation || Date.now());
</script>

<div 
	bind:this={cardElement}
	class="match-card-wrapper min-h-[80px]"
	on:mouseenter={onHover ? () => onHover(match) : null}
>
	{#if isVisible}
		<!-- Actual match card content -->
		<button
			on:click={onClick ? () => onClick(match) : null}
			class="w-full text-left p-4 rounded-lg transition-all duration-200 {won ? 'bg-green-900/20 hover:bg-green-900/30 border border-green-500/30' : 'bg-red-900/20 hover:bg-red-900/30 border border-red-500/30'}"
		>
			<div class="flex items-center gap-4">
				<!-- Champion Icon -->
				<img 
					src="https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/{championName}.png"
					alt={championName}
					class="w-12 h-12 rounded-lg"
					loading="lazy"
					width="48"
					height="48"
				/>
				
				<!-- Match Info -->
				<div class="flex-1">
					<div class="flex items-center gap-2 mb-1">
						<span class="font-cinzel text-white text-sm">{championName}</span>
						<span class="text-xs text-gray-400">•</span>
						<span class="text-xs text-gray-400">{gameDuration}m</span>
					</div>
					
					<div class="flex items-center gap-2">
						<span class="text-sm {won ? 'text-green-400' : 'text-red-400'} font-semibold">
							{won ? 'Victory' : 'Defeat'}
						</span>
						<span class="text-xs text-gray-400">•</span>
						<span class="text-sm text-gray-300">
							{kills}/{deaths}/{assists}
						</span>
						<span class="text-xs text-hex-gold">
							{kda} KDA
						</span>
					</div>
				</div>
				
				<!-- Time ago -->
				<div class="text-xs text-gray-500">
					{gameDate.toLocaleDateString()}
				</div>
			</div>
		</button>
	{:else}
		<!-- Placeholder skeleton -->
		<div class="w-full p-4 rounded-lg bg-hex-darker/50 animate-pulse">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-lg bg-hex-gold/10"></div>
				<div class="flex-1 space-y-2">
					<div class="h-4 w-32 bg-hex-gold/10 rounded"></div>
					<div class="h-3 w-48 bg-hex-gold/10 rounded"></div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.match-card-wrapper {
		will-change: contents;
	}
</style>
