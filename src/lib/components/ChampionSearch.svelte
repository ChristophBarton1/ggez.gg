<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { championNameToId } from '$lib/data/metaStats.js';
	
	let searchQuery = '';
	let searchResults = [];
	let showDropdown = false;
	let selectedIndex = -1;
	let latestVersion = '';
	let searchInput;
	
	$: {
		if (searchQuery.trim().length > 0) {
			const query = searchQuery.toLowerCase();
			searchResults = Object.entries(championNameToId)
				.filter(([name]) => name.toLowerCase().includes(query))
				.slice(0, 8)
				.map(([name, id]) => ({ name, id }));
			showDropdown = searchResults.length > 0;
		} else {
			searchResults = [];
			showDropdown = false;
		}
		selectedIndex = -1;
	}
	
	onMount(async () => {
		// Fetch latest version for champion images
		try {
			const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
			const versions = await res.json();
			latestVersion = versions[0];
		} catch (e) {
			console.error('Failed to fetch version:', e);
			latestVersion = '14.1.1'; // Fallback
		}
	});
	
	function selectChampion(champion) {
		goto(`/champion/${champion.name}`);
		searchQuery = '';
		showDropdown = false;
		if (searchInput) searchInput.blur();
	}
	
	function handleKeydown(e) {
		if (!showDropdown) return;
		
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
		} else if (e.key === 'Enter' && selectedIndex >= 0) {
			e.preventDefault();
			selectChampion(searchResults[selectedIndex]);
		} else if (e.key === 'Escape') {
			showDropdown = false;
			selectedIndex = -1;
		}
	}
	
	function handleBlur() {
		// Delay to allow click on dropdown item
		setTimeout(() => {
			showDropdown = false;
			selectedIndex = -1;
		}, 200);
	}
</script>

<div class="champion-search-wrapper">
	<div class="search-container">
		<svg xmlns="http://www.w3.org/2000/svg" class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
		<input
			bind:this={searchInput}
			bind:value={searchQuery}
			on:keydown={handleKeydown}
			on:blur={handleBlur}
			on:focus={() => { if (searchResults.length > 0) showDropdown = true; }}
			type="text"
			placeholder="Search Champion..."
			class="search-input"
		/>
	</div>
	
	{#if showDropdown}
		<div class="dropdown">
			{#each searchResults as champion, i}
				<button
					class="dropdown-item"
					class:selected={i === selectedIndex}
					on:click={() => selectChampion(champion)}
				>
					<img 
						src="https://ddragon.leagueoflegends.com/cdn/{latestVersion}/img/champion/{champion.name}.png"
						alt={champion.name}
						class="champion-icon"
					/>
					<span class="champion-name">{champion.name}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.champion-search-wrapper {
		position: relative;
		width: 100%;
	}
	
	.search-container {
		position: relative;
		width: 100%;
	}
	
	.search-icon {
		position: absolute;
		left: 0.875rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1.125rem;
		height: 1.125rem;
		color: rgba(255, 255, 255, 0.4);
		pointer-events: none;
		z-index: 1;
	}
	
	.search-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.75rem;
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: white;
		font-size: 0.875rem;
		transition: all 0.2s;
		outline: none;
	}
	
	.search-input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}
	
	.search-input:focus {
		border-color: rgba(200, 170, 110, 0.5);
		background: rgba(0, 0, 0, 0.7);
	}
	
	.dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		background: rgba(10, 14, 26, 0.98);
		border: 1px solid rgba(200, 170, 110, 0.3);
		border-radius: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
		z-index: 50;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
	}
	
	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		color: white;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}
	
	.dropdown-item:last-child {
		border-bottom: none;
	}
	
	.dropdown-item:hover,
	.dropdown-item.selected {
		background: rgba(200, 170, 110, 0.15);
	}
	
	.champion-icon {
		width: 36px;
		height: 36px;
		border-radius: 6px;
		border: 2px solid rgba(200, 170, 110, 0.4);
		flex-shrink: 0;
	}
	
	.champion-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: white;
		letter-spacing: 0.02em;
	}
	
	/* Scrollbar Styling */
	.dropdown::-webkit-scrollbar {
		width: 6px;
	}
	
	.dropdown::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 3px;
	}
	
	.dropdown::-webkit-scrollbar-thumb {
		background: rgba(200, 170, 110, 0.4);
		border-radius: 3px;
	}
	
	.dropdown::-webkit-scrollbar-thumb:hover {
		background: rgba(200, 170, 110, 0.6);
	}
</style>
