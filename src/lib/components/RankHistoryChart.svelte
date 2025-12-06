<script>
	import { onMount } from 'svelte';
	
	export let currentTier = 'SILVER';
	export let currentRank = 'II';
	export let currentLP = 91;
	
	// Generate realistic demo data based on current rank
	function generateDemoData() {
		const tierValues = {
			'IRON': 0,
			'BRONZE': 400,
			'SILVER': 800,
			'GOLD': 1200,
			'PLATINUM': 1600,
			'EMERALD': 2000,
			'DIAMOND': 2400,
			'MASTER': 2800,
			'GRANDMASTER': 3200,
			'CHALLENGER': 3600
		};
		
		const rankValues = {
			'IV': 0,
			'III': 100,
			'II': 200,
			'I': 300
		};
		
		const currentValue = tierValues[currentTier] + rankValues[currentRank] + currentLP;
		
		// Generate 6 months of data with realistic progression
		const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
		const data = [];
		
		for (let i = 0; i < 6; i++) {
			// Start lower, progress upward with some variance
			const variance = Math.random() * 200 - 100; // +/- 100 LP
			const progress = (currentValue - 400) + (i * 80) + variance;
			const value = Math.max(0, Math.min(3600, progress));
			
			data.push({
				month: months[i],
				value: Math.round(value),
				lp: Math.round((value % 400))
			});
		}
		
		// Ensure current month matches current LP
		data[5].value = currentValue;
		data[5].lp = currentLP;
		
		return data;
	}
	
	let chartData = [];
	let maxValue = 0;
	let minValue = 0;
	
	onMount(() => {
		chartData = generateDemoData();
		maxValue = Math.max(...chartData.map(d => d.value)) + 100;
		minValue = Math.max(0, Math.min(...chartData.map(d => d.value)) - 100);
	});
	
	function getYPosition(value, index) {
		const range = maxValue - minValue;
		const normalized = (value - minValue) / range;
		return 150 - (normalized * 130); // Chart height is 150, leave margin
	}
	
	function getTierFromValue(value) {
		if (value >= 3200) return 'CHALLENGER';
		if (value >= 2800) return 'GRANDMASTER';
		if (value >= 2400) return 'MASTER';
		if (value >= 2000) return 'DIAMOND';
		if (value >= 1600) return 'EMERALD';
		if (value >= 1200) return 'PLATINUM';
		if (value >= 800) return 'GOLD';
		if (value >= 400) return 'SILVER';
		if (value >= 0) return 'BRONZE';
		return 'IRON';
	}
	
	function generatePathD(data) {
		return data.map((point, i) => {
			const x = 50 + i * 60;
			const y = getYPosition(point.value, i);
			return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
		}).join(' ');
	}
	
	function generateAreaPath(data) {
		const linePath = data.map((point, i) => {
			const x = 50 + i * 60;
			const y = getYPosition(point.value, i);
			return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
		}).join(' ');
		
		const lastX = 50 + (data.length - 1) * 60;
		return `${linePath} L ${lastX} 170 L 50 170 Z`;
	}
</script>

<div class="rank-history-chart glass-card border border-hex-gold/20 p-6 rounded-lg mt-4 mb-8">
	<div class="flex items-center justify-between mb-6">
		<h3 class="font-cinzel text-hex-gold text-base uppercase tracking-wider">Rank History - Last 6 Months</h3>
		<span class="text-xs text-gray-500 italic">Demo Data - Real tracking coming soon</span>
	</div>
	
	{#if chartData.length > 0}
		<svg viewBox="0 0 800 240" class="w-full h-60">
			<!-- Grid lines -->
			<line x1="0" y1="20" x2="400" y2="20" stroke="rgba(200,170,110,0.1)" stroke-width="1" />
			<line x1="0" y1="70" x2="400" y2="70" stroke="rgba(200,170,110,0.1)" stroke-width="1" />
			<line x1="0" y1="120" x2="400" y2="120" stroke="rgba(200,170,110,0.1)" stroke-width="1" />
			<line x1="0" y1="170" x2="400" y2="170" stroke="rgba(200,170,110,0.1)" stroke-width="1" />
			
			<!-- Line Path -->
			<path 
				d={generatePathD(chartData)}
				fill="none"
				stroke="url(#lineGradient)"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			
			<!-- Area under curve -->
			<path 
				d={generateAreaPath(chartData)}
				fill="url(#areaGradient)"
				opacity="0.2"
			/>
			
			<!-- Data Points -->
			{#each chartData as point, i}
				<g>
					<!-- Glow effect -->
					<circle 
						cx={50 + i * 60} 
						cy={getYPosition(point.value, i)} 
						r="8"
						fill="rgba(10, 200, 185, 0.3)"
						class="animate-pulse"
					/>
					<!-- Main point -->
					<circle 
						cx={50 + i * 60} 
						cy={getYPosition(point.value, i)} 
						r="5"
						fill="#0ac8b9"
						stroke="white"
						stroke-width="2"
						class="hover:r-7 transition-all cursor-pointer"
					>
						<title>{point.month}: {getTierFromValue(point.value)} - {point.lp} LP</title>
					</circle>
				</g>
			{/each}
			
			<!-- Month labels -->
			{#each chartData as point, i}
				<text 
					x={50 + i * 60} 
					y="175" 
					text-anchor="middle" 
					fill="rgba(200,170,110,0.6)" 
					font-size="10"
					font-family="Inter, sans-serif"
				>
					{point.month}
				</text>
			{/each}
			
			<!-- Gradients -->
			<defs>
				<linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" style="stop-color:#0ac8b9;stop-opacity:1" />
					<stop offset="100%" style="stop-color:#c8aa6e;stop-opacity:1" />
				</linearGradient>
				<linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" style="stop-color:#0ac8b9;stop-opacity:0.5" />
					<stop offset="100%" style="stop-color:#0ac8b9;stop-opacity:0" />
				</linearGradient>
			</defs>
		</svg>
		
		<!-- Legend -->
		<div class="flex justify-between items-center mt-3 text-xs">
			<div class="text-gray-500">
				<span class="text-hex-blue">↗</span> Climbing
			</div>
			<div class="text-gray-500 text-center">
				Last 6 Months Progress
			</div>
			<div class="text-gray-500">
				<span class="text-hex-gold">★</span> Current
			</div>
		</div>
	{/if}
</div>

<style>
	svg {
		overflow: visible;
	}
	
	circle:hover {
		r: 7;
	}
</style>
