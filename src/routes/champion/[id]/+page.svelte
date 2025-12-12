<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { getChampionStats, getAllChampionStats } from '$lib/data/metaStats.js';
	import { getChampionBuildDetails } from '$lib/data/championDetails.js';

	let champion = null;
	let loading = true;
	let latestVersion = '';
	let runesData = [];
	let summonersData = {};
	let championIdToName = {};
	let selectedAbility = 0;
	let scrollY = 0;
	let particles = [];
	let ticking = false;
	
	// Champion Spotlight Video IDs (Official Riot Games YouTube)
	const championSpotlights = {
		'Aatrox': { videoId: 'cVLo02IQ3WA', abilities: { P: 0, Q: 45, W: 75, E: 95, R: 115 } },
		'Ahri': { videoId: '5Xn5LDfkVZk', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Akali': { videoId: 'hcsNVVzSeYA', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 100 } },
		'Akshan': { videoId: 'pLte1JrFLqE', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Alistar': { videoId: 'f-Ld-P8VnHs', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Amumu': { videoId: '5WGVE1dXkYE', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Anivia': { videoId: 'rkS9s3IOIPU', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Annie': { videoId: 'aUTU-GnxVuM', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Aphelios': { videoId: 'gSMLa5xkvPE', abilities: { P: 0, Q: 45, W: 70, E: 95, R: 120 } },
		'Ashe': { videoId: 'ImE-2t4eP10', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Aurelion Sol': { videoId: 'CAyKcJHi1so', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Azir': { videoId: 'zqH4AA-KEgQ', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Bard': { videoId: 'CX8iSobsKTY', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 105 } },
		'Bel\'Veth': { videoId: 'HwMPDjXv0Qw', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Blitzcrank': { videoId: 'aDVKpgazVfs', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Brand': { videoId: 'X1n9i7F1j-0', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Braum': { videoId: 'B4-BgDEy2AE', abilities: { P: 0, Q: 35, W: 50, E: 70, R: 90 } },
		'Briar': { videoId: 'r4bYXGC2W24', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Caitlyn': { videoId: 'H3dJiH0Bpoc', abilities: { P: 0, Q: 30, W: 45, E: 65, R: 85 } },
		'Camille': { videoId: 'VJ6MfkCfq4c', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Cassiopeia': { videoId: 'kkZh-BStpgg', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Cho\'Gath': { videoId: 'T2VGhgVwKYk', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Corki': { videoId: 'PX_E7S4ibBw', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Darius': { videoId: 'o-HwuWCBDJk', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Diana': { videoId: 'H7WSLWcACiw', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Dr. Mundo': { videoId: 'MfdHU-E-C_Y', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Draven': { videoId: 'XuKfmfV0zd8', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Ekko': { videoId: 'FtEpp9lkfxA', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Elise': { videoId: 'GNmYkLHSHYU', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 95 } },
		'Evelynn': { videoId: '2e1Fk4DKQWM', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Ezreal': { videoId: 'xLIjMBfmXpc', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Fiddlesticks': { videoId: 'u-Wf0P-PLA8', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Fiora': { videoId: 'wnVuZcLor7E', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Fizz': { videoId: 'TdPu6sQ9l4g', abilities: { P: 0, Q: 30, W: 45, E: 65, R: 85 } },
		'Galio': { videoId: 'f-Kx4cf8tWk', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Gangplank': { videoId: 'OLmViiNBPjk', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 95 } },
		'Garen': { videoId: 'hBJjT2BPN24', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Gnar': { videoId: 'Oq-oLJJax9g', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Gragas': { videoId: 'PnPJ1UpYjqs', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Graves': { videoId: 'Qb-g0xtQSNw', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Gwen': { videoId: 'FLm_Vq7wfPQ', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Hecarim': { videoId: 'V1GZaVABhcA', abilities: { P: 0, Q: 30, W: 45, E: 65, R: 85 } },
		'Heimerdinger': { videoId: 'BDVFmPKhLbc', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Hwei': { videoId: 'XdN67NuhMW4', abilities: { P: 0, Q: 45, W: 70, E: 100, R: 130 } },
		'Illaoi': { videoId: 'i_Hm6dLjbWE', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 105 } },
		'Irelia': { videoId: 'pUcRmS2caJ0', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Ivern': { videoId: 'X5uD8EFdaH0', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Janna': { videoId: 'LYjfwzRbOoU', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Jarvan IV': { videoId: 'wGndfrfvALU', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Jax': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Jayce': { videoId: 'p0gevRqLdQY', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 95 } },
		'Jhin': { videoId: 'QwQ3i9L0j74', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Jinx': { videoId: 'KN3OYwP8nHE', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'K\'Sante': { videoId: 'Wq0eT-QPKFQ', abilities: { P: 0, Q: 40, W: 65, E: 90, R: 115 } },
		'Kai\'Sa': { videoId: 'fB8TyLTD7EE', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 105 } },
		'Kalista': { videoId: 'GnT8jVCyh_E', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 105 } },
		'Karma': { videoId: 'J4FXPKjjF-o', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Karthus': { videoId: 'dOc1y-6GhXc', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Kassadin': { videoId: 'y2R29wOcPkk', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Katarina': { videoId: 'ON5FKCmt8Lo', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Kayle': { videoId: 'P0FJZ-zcA5w', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Kayn': { videoId: 'oGnZk-_R0KQ', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Kennen': { videoId: '3HEcMR5lYdU', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Kha\'Zix': { videoId: 'jJqYLkIqbz4', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Kindred': { videoId: 'h0Pwn576-hs', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Kled': { videoId: 'Nt-JkLpwu7U', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Kog\'Maw': { videoId: 'V5Xp5ZfWkLU', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'LeBlanc': { videoId: 'we5LawDUcCM', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Lee Sin': { videoId: 'CXxcpaCr1hw', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Leona': { videoId: 'fgeCtVJrOR4', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Lillia': { videoId: 'Oo_NaRDjKgM', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Lissandra': { videoId: 'M3cSPaKwLOs', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Lucian': { videoId: 'qX4YF17Cs9U', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Lulu': { videoId: 'RXO8zPCgfzw', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Lux': { videoId: 'oMJvPbkawds', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Malphite': { videoId: 'n8Lfbg4hCqs', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Malzahar': { videoId: 'cTyAaT9PPA8', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Maokai': { videoId: 'pwXsJLJnvSA', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Master Yi': { videoId: 'vp3ZrRJz-ZY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Milio': { videoId: 'hgNlKcC5hWY', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Miss Fortune': { videoId: '3jKl8FNryWM', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Mordekaiser': { videoId: 'eWbKfDmyrHE', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Morgana': { videoId: 'dlYvfqNQuqU', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Naafiri': { videoId: 'Lh1hEVqfRxY', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Nami': { videoId: 'zmjJdHzfxgA', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Nasus': { videoId: 'gG1fvJSBBME', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Nautilus': { videoId: 'DLAtZU6IvJk', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Neeko': { videoId: 'FrBcnNi6rT4', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 105 } },
		'Nidalee': { videoId: 'a4lobRuSic4', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Nilah': { videoId: 'TQJW2JBB6xQ', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Nocturne': { videoId: 'LHpGasllBLA', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Nunu & Willump': { videoId: 'fsnDbealN9E', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 105 } },
		'Olaf': { videoId: 'BPNtkoN2kOc', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Orianna': { videoId: 'VXe1mcwjwrk', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Ornn': { videoId: 'aUGMjHgHqM0', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Pantheon': { videoId: 'wkGW2v8pvtY', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Poppy': { videoId: 'yjbpMWLWcTE', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Pyke': { videoId: 'QvQhXVlr_ys', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 105 } },
		'Qiyana': { videoId: 'l-WpYPqhxPU', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Quinn': { videoId: 'vlYt_Wg8Bdk', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Rakan': { videoId: 'IOq_gvwEfJE', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Rammus': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Rek\'Sai': { videoId: 'qOxPHx-G1GI', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 105 } },
		'Rell': { videoId: 'u-Wf0P-PLA8', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Renata Glasc': { videoId: 'Oe-FLkGJrqk', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Renekton': { videoId: 'YLx2FMhFjQA', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Rengar': { videoId: 'vP7KaS_U0GI', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Riven': { videoId: 'hcJGRq1UZGM', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Rumble': { videoId: 'bIwMYGkLrFk', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Ryze': { videoId: 'IoZGmGqhXCM', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Samira': { videoId: 'ujEHICyWp8Q', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Sejuani': { videoId: 'BiQpP4R8Pzw', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Senna': { videoId: 'qlDuS2lMQfY', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Seraphine': { videoId: 'Qk2Qa3BWGM4', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Sett': { videoId: 'j886cJSLthc', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Shaco': { videoId: 'EXehXuPzgFI', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Shen': { videoId: 'Kvr0VKYdkzQ', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Shyvana': { videoId: 'Zt-3-VMPUpM', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Singed': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Sion': { videoId: 'JBcKxuHWdYM', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Sivir': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Skarner': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Smolder': { videoId: 'xT0FfCqnyrg', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Sona': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Soraka': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Swain': { videoId: 'wLJBtl1fYdU', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Sylas': { videoId: 'LMhr0mS7KWk', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Syndra': { videoId: 'MiC4kWh0hzE', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Tahm Kench': { videoId: 'ILlBvsFvdvc', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 105 } },
		'Taliyah': { videoId: 'LbTf1xcLGj0', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Talon': { videoId: 'Ss_k5a2kjZg', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Taric': { videoId: 'YWDQB_KgJTo', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Teemo': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Thresh': { videoId: 'J-V1Gx4a02U', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Tristana': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Trundle': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Tryndamere': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Twisted Fate': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Twitch': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Udyr': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Urgot': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Varus': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Vayne': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Veigar': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 70 } },
		'Vel\'Koz': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Vex': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Vi': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Viego': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Viktor': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Vladimir': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Volibear': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Warwick': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Wukong': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Xayah': { videoId: 'IOq_gvwEfJE', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Xerath': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } },
		'Xin Zhao': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Yasuo': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Yone': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Yorick': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 35, W: 55, E: 75, R: 100 } },
		'Yuumi': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 35, W: 55, E: 80, R: 105 } },
		'Zac': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Zed': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 30, W: 50, E: 70, R: 90 } },
		'Zeri': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Ziggs': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 30, W: 45, E: 60, R: 80 } },
		'Zilean': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 25, W: 40, E: 55, R: 75 } },
		'Zoe': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 40, W: 60, E: 85, R: 110 } },
		'Zyra': { videoId: 'Xpe-JoGyPsY', abilities: { P: 0, Q: 30, W: 50, E: 65, R: 85 } }
	};

	// Get champion ID from URL
	$: championId = $page.params.id;

	// Parallax effect - smoother calculation
	$: parallaxOffset = scrollY * 0.4;

	onMount(async () => {
		await loadChampionData();
		generateParticles();
		
		// Scroll listener for parallax with RAF for smoothness
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	function handleScroll() {
		if (!ticking) {
			window.requestAnimationFrame(() => {
				scrollY = window.scrollY;
				ticking = false;
			});
			ticking = true;
		}
	}

	function generateParticles() {
		particles = Array.from({ length: 40 }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			y: Math.random() * 120 + 20, // Start slightly below viewport
			size: Math.random() * 4 + 1.5,
			duration: Math.random() * 15 + 10,
			delay: Math.random() * 8,
			opacity: Math.random() * 0.6 + 0.3
		}));
	}

	async function loadChampionData() {
		try {
			loading = true;
			
			// Prepare ID mapping
			const allStats = getAllChampionStats();
			championIdToName = {};
			allStats.forEach(s => {
				if (s.championId && s.name) championIdToName[s.championId] = s.name;
			});
			
			// Fetch latest version
			const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
			const versions = await versionRes.json();
			latestVersion = versions[0];
			
			// Fetch data in parallel
			const [championRes, runesRes, summonerRes] = await Promise.all([
				fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion/${championId}.json`),
				fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/runesReforged.json`),
				fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/summoner.json`)
			]);

			const championData = await championRes.json();
			runesData = await runesRes.json();
			const summonerJson = await summonerRes.json();
			summonersData = summonerJson.data;
			
			// Extract champion info
			const champInfo = championData.data[championId];
			
			// Get realistic meta stats
			const metaStats = getChampionStats(champInfo.name);
			
			// Get detailed build stats
			const buildStats = getChampionBuildDetails(champInfo.key, champInfo.tags[0], champInfo.name);

			// Process Runes
			const primaryTree = runesData.find(t => t.id === buildStats.runes.primary);
			const secondaryTree = runesData.find(t => t.id === buildStats.runes.secondary);
			
			const keystone = primaryTree ? primaryTree.slots[0].runes.find(r => r.id === buildStats.runes.keystone) : null;
			const primaryRunes = primaryTree ? buildStats.runes.primaryRunes.map(id => {
				for (const slot of primaryTree.slots) {
					const rune = slot.runes.find(r => r.id === id);
					if (rune) return rune;
				}
			}).filter(Boolean) : [];
			
			const secondaryRunes = secondaryTree ? buildStats.runes.secondaryRunes.map(id => {
				for (const slot of secondaryTree.slots) {
					const rune = slot.runes.find(r => r.id === id);
					if (rune) return rune;
				}
			}).filter(Boolean) : [];
			
			// Process Summoners
			const summonerSpells = buildStats.summoners.map(id => {
				return Object.values(summonersData).find(s => s.key == id);
			}).filter(Boolean);
			
			// Process Matchups
			const matchups = buildStats.matchups.map(m => {
				const name = championIdToName[m.championId] || 'Unknown';
				return {
					...m,
					name,
					image: name !== 'Unknown' ? `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${name}.png` : ''
				};
			}).filter(m => m.name !== 'Unknown');
			
			// Generate realistic stats
			champion = {
				id: champInfo.id,
				name: champInfo.name,
				title: champInfo.title,
				lore: champInfo.lore,
				tags: champInfo.tags,
				info: champInfo.info,
				stats: champInfo.stats,
				
				// Meta Stats (Static Snapshot)
				winRate: metaStats.winRate,
				pickRate: metaStats.pickRate,
				banRate: metaStats.banRate,
				tier: metaStats.tier,
				
				// Build Details
				runes: {
					primary: primaryTree,
					secondary: secondaryTree,
					keystone,
					primaryRunes,
					secondaryRunes,
					shards: buildStats.runes.shards
				},
				summoners: summonerSpells,
				skillPriority: buildStats.skillPriority,
				skillPath: buildStats.skillPath,
				matchups,
				
				// Images
				splashArt: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_0.jpg`,
				icon: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${championId}.png`,
				
				// Abilities
				passive: {
					name: champInfo.passive.name,
					description: champInfo.passive.description,
					image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/passive/${champInfo.passive.image.full}`
				},
				spells: champInfo.spells.map(spell => ({
					id: spell.id,
					name: spell.name,
					description: spell.description,
					image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${spell.image.full}`,
					cooldown: spell.cooldownBurn,
					cost: spell.costBurn
				})),
				
				// Skins
				skins: champInfo.skins.map(skin => ({
					id: skin.id,
					num: skin.num,
					name: skin.name,
					splashArt: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_${skin.num}.jpg`,
					loading: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championId}_${skin.num}.jpg`
				})),
				
				// Recommended build items (popular items for most champions)
				recommendedBuild: getRecommendedBuild(champInfo.tags)
			};
			
			loading = false;
			
		} catch (error) {
			console.error('❌ Error loading champion:', error);
			loading = false;
		}
	}

	function formatNumber(num) {
		if (num >= 1000000) {
			return `${(num / 1000000).toFixed(2)}M`;
		}
		if (num >= 1000) {
			return `${(num / 1000).toFixed(0)}K`;
		}
		return num.toString();
	}

	function getDifficultyLabel(difficulty) {
		if (difficulty <= 3) return 'EASY';
		if (difficulty <= 6) return 'MODERATE';
		return 'HIGH';
	}

	function stripHtml(html) {
		return html.replace(/<[^>]*>/g, '');
	}
	
	// Simple YouTube redirect function
	function openYouTubeVideo(championName, abilityKey) {
		const spotlight = championSpotlights[championName];
		if (spotlight) {
			const keyMap = { 'Passive': 'P', 'Q': 'Q', 'W': 'W', 'E': 'E', 'R': 'R' };
			const mappedKey = keyMap[abilityKey] || 'P';
			const timestamp = spotlight.abilities[mappedKey] || 0;
			window.open(`https://www.youtube.com/watch?v=${spotlight.videoId}&t=${timestamp}s`, '_blank');
		} else {
			// Fallback: YouTube search
			const query = encodeURIComponent(`${championName} ${abilityKey} ability spotlight`);
			window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
		}
	}
	
	function openSkinSpotlight(championName, skinName) {
		const query = encodeURIComponent(`${skinName} Skin Spotlight`);
		window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
	}

	function getRecommendedBuild(tags) {
		// Item builds based on champion role
		const builds = {
			Mage: ['3157', '3135', '3089', '3020', '3102', '3165'], // Zhonya's, Void Staff, Rabadon's, Sorc Shoes, Banshee's, Morello
			Fighter: ['3074', '3053', '3071', '3047', '3143', '3156'], // Ravenous Hydra, Sterak's, Black Cleaver, Plated Steelcaps, Randuin's, Maw
			Tank: ['3068', '3001', '3065', '3047', '3143', '3075'], // Sunfire, Abyssal Mask, Spirit Visage, Plated Steelcaps, Randuin's, Thornmail
			Marksman: ['3031', '3094', '3085', '3006', '3036', '3072'], // IE, Rapid Firecannon, Runaan's, Berserker's, Lord Dominik's, Bloodthirster
			Assassin: ['3142', '6691', '3814', '3156', '3181', '3036'], // Youmuu's, Duskblade, Edge of Night, Maw, Hullbreaker, Lord Dominik's
			Support: ['3107', '3504', '3020', '3222', '3190', '3114'], // Redemption, Ardent, Sorc Shoes, Mikael's, Locket, Forbidden Idol
		};
		
		// Return build based on first tag
		const primaryTag = tags[0];
		return builds[primaryTag] || builds.Mage;
	}
</script>

<svelte:head>
	<title>{champion ? `${champion.name} - The ${champion.title}` : 'Loading...'} | ggez.gg</title>
</svelte:head>

<!-- Background -->
<div class="fixed inset-0 -z-50 bg-[#0a0e1a]">
	<div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
	
	<!-- Animated Particles -->
	{#if !loading}
		<div class="particles-container">
			{#each particles as particle (particle.id)}
				<div 
					class="particle"
					style="
						left: {particle.x}%;
						top: {particle.y}%;
						width: {particle.size}px;
						height: {particle.size}px;
						animation-duration: {particle.duration}s;
						animation-delay: {particle.delay}s;
						--particle-opacity: {particle.opacity};
					"
				></div>
			{/each}
		</div>
	{/if}
</div>

{#if loading}
	<!-- Loading State -->
	<div class="flex flex-col items-center justify-center min-h-screen gap-4">
		<div class="w-16 h-16 border-4 border-[#c8aa6e]/30 border-t-[#c8aa6e] rounded-full animate-spin"></div>
		<div class="font-cinzel text-[#c8aa6e] animate-pulse">Loading Champion...</div>
	</div>
{:else if champion}
	<!-- Hero Section -->
	<div class="hero-section">
		<!-- Background Splash Art with Parallax -->
		<div class="hero-bg" style="transform: translateY({parallaxOffset}px)">
			<img src={champion.splashArt} alt={champion.name} class="hero-bg-image" />
			<div class="hero-overlay"></div>
		</div>
		
		<!-- Breadcrumb -->
		<div class="breadcrumb" in:fade={{ duration: 400 }}>
			<a href="/">COLLECTION</a>
			<span class="separator">›</span>
			<a href="/tierlist">CHAMPIONS</a>
			<span class="separator">›</span>
			<span class="active">{champion.name.toUpperCase()}</span>
		</div>
		
		<!-- Hero Content -->
		<div class="hero-content">
			<!-- Left Side - Champion Info -->
			<div class="hero-info" in:fly={{ x: -50, duration: 800, easing: quintOut }}>
				<!-- Role Badge -->
				<div class="role-badge">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
					<span>{champion.tags[0].toUpperCase()}</span>
				</div>
				
				<!-- Champion Name -->
				<h1 class="hero-title">{champion.name}</h1>
				<p class="hero-subtitle">"{champion.title}"</p>
				
				<!-- Action Buttons -->
				<div class="hero-buttons">
					<a 
						href="https://www.youtube.com/results?search_query={champion.name}+guide+season+14" 
						target="_blank" 
						rel="noopener noreferrer"
						class="btn-primary"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						WATCH TUTORIAL
					</a>
					<a 
						href="https://www.youtube.com/results?search_query=SkinSpotlights+{champion.name}+All+Skins" 
						target="_blank" 
						rel="noopener noreferrer"
						class="btn-secondary"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						ALL SKINS VIDEO
					</a>
				</div>
			</div>
			
			<!-- Right Side - Stats Card -->
			<div class="stats-card" in:fly={{ x: 50, duration: 800, delay: 200, easing: quintOut }}>
				<div class="stats-grid">
					<div class="stat-item">
						<div class="stat-value text-[#c8aa6e]">{champion.tier}</div>
						<div class="stat-label">TIER</div>
					</div>
					<div class="stat-item">
						<div class="stat-value" style="color: {parseFloat(champion.winRate) >= 50 ? '#10b981' : '#ef4444'}">{champion.winRate}%</div>
						<div class="stat-label">WIN RATE</div>
					</div>
					<div class="stat-item">
						<div class="stat-value">{champion.pickRate}%</div>
						<div class="stat-label">PICK RATE</div>
					</div>
					<div class="stat-item">
						<div class="stat-value">{champion.banRate}%</div>
						<div class="stat-label">BAN RATE</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="content-wrapper">
		<div class="content-container-grid">
			
			<!-- Column 1: Build, Runes & Summoners -->
			<div class="grid-column">
				
				<!-- Recommended Build -->
				<section class="section-card compact" in:fly={{ y: 30, duration: 600, delay: 400, easing: quintOut }}>
					<h2 class="section-title">RECOMMENDED BUILD</h2>
					<div class="build-items">
						{#each champion.recommendedBuild as itemId, index}
							<div class="build-item" in:fly={{ y: 20, duration: 400, delay: 450 + (index * 50), easing: quintOut }}>
								<img 
									src={`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${itemId}.png`}
									alt="Item {index + 1}"
									class="item-image"
									loading="lazy"
								/>
							</div>
						{/each}
					</div>
				</section>

				<!-- Runes & Summoner Spells -->
				{#if champion.runes && champion.summoners}
				<section class="section-card compact" in:fly={{ y: 30, duration: 600, delay: 500, easing: quintOut }}>
					<h2 class="section-title">RECOMMENDED RUNES</h2>
					<div class="runes-container">
						<!-- Primary Tree -->
						{#if champion.runes.primary}
						<div class="rune-tree">
							<div class="tree-header">
								<img src="https://ddragon.leagueoflegends.com/cdn/img/{champion.runes.primary.icon}" alt={champion.runes.primary.name} class="tree-icon" />
								<span class="tree-name">{champion.runes.primary.name}</span>
							</div>
							{#if champion.runes.keystone}
							<div class="keystone-rune">
								<img src="https://ddragon.leagueoflegends.com/cdn/img/{champion.runes.keystone.icon}" alt={champion.runes.keystone.name} title={champion.runes.keystone.name} />
							</div>
							{/if}
							<div class="minor-runes">
								{#each champion.runes.primaryRunes as rune}
								<img src="https://ddragon.leagueoflegends.com/cdn/img/{rune.icon}" alt={rune.name} title={rune.name} />
								{/each}
							</div>
						</div>
						{/if}
						
						<!-- Secondary Tree -->
						{#if champion.runes.secondary}
						<div class="rune-tree secondary">
							<div class="tree-header">
								<img src="https://ddragon.leagueoflegends.com/cdn/img/{champion.runes.secondary.icon}" alt={champion.runes.secondary.name} class="tree-icon" />
								<span class="tree-name">{champion.runes.secondary.name}</span>
							</div>
							<div class="minor-runes">
								{#each champion.runes.secondaryRunes as rune}
								<img src="https://ddragon.leagueoflegends.com/cdn/img/{rune.icon}" alt={rune.name} title={rune.name} />
								{/each}
							</div>
						</div>
						{/if}
					</div>
					
					<!-- Summoner Spells -->
					<h2 class="section-title mt-4">SUMMONER SPELLS</h2>
					<div class="summoner-spells compact">
						{#each champion.summoners as spell}
						<div class="summoner-spell">
							<img src="https://ddragon.leagueoflegends.com/cdn/{latestVersion}/img/spell/{spell.image.full}" alt={spell.name} title={spell.name} />
						</div>
						{/each}
					</div>
					<div class="win-rate-badge">{champion.winRate}% WR</div>
				</section>
				{/if}

				<!-- Biography -->
				<section class="section-card compact" in:fly={{ y: 30, duration: 600, delay: 600, easing: quintOut }}>
					<h2 class="section-title">BIOGRAPHY</h2>
					<p class="lore-text">{champion.lore}</p>
				</section>
				
			</div>

			<!-- Column 2: Skills, Abilities -->
			<div class="grid-column">
				
				<!-- Skill Priority & Path -->
				{#if champion.skillPriority && champion.skillPath}
				<section class="section-card compact" in:fly={{ y: 30, duration: 600, delay: 400, easing: quintOut }}>
					<h2 class="section-title">SKILL PRIORITY</h2>
					<div class="skill-priority">
						{#each champion.skillPriority as skill, i}
						<div class="priority-skill">
							{#if champion.spells[['Q','W','E'].indexOf(skill)]}
							<img src={champion.spells[['Q','W','E'].indexOf(skill)].image} alt={skill} />
							{/if}
							<span>{skill}</span>
						</div>
						{#if i < champion.skillPriority.length - 1}
						<span class="arrow">→</span>
						{/if}
						{/each}
					</div>
					
					<h2 class="section-title mt-4">SKILL PATH</h2>
					<div class="skill-path-grid">
						{#each champion.skillPath as skill, level}
						<div class="skill-level" class:ultimate={skill === 4}>
							<span class="level-number">{level + 1}</span>
							<span class="skill-letter">{['Q','W','E','R'][skill - 1]}</span>
						</div>
						{/each}
					</div>
				</section>
				{/if}

				<!-- Abilities Section -->
				<section class="section-card" in:fly={{ y: 30, duration: 600, delay: 500, easing: quintOut }}>
					<h2 class="section-title">ABILITIES</h2>
					
					<!-- Ability Icons -->
					<div class="ability-icons">
						<button 
							class="ability-icon"
							class:active={selectedAbility === -1}
							on:click={() => selectedAbility = -1}
							on:dblclick={() => openYouTubeVideo(champion.name, 'Passive')}
							title="Double-click to watch video"
						>
							<img src={champion.passive.image} alt={champion.passive.name} />
							<div class="video-hint">▶</div>
						</button>
						{#each champion.spells as spell, i}
							{@const abilityKey = ['Q', 'W', 'E', 'R'][i]}
							<button 
								class="ability-icon"
								class:active={selectedAbility === i}
								on:click={() => selectedAbility = i}
								on:dblclick={() => openYouTubeVideo(champion.name, abilityKey)}
								title="Double-click to watch video"
							>
								<img src={spell.image} alt={spell.name} />
								<div class="video-hint">▶</div>
							</button>
						{/each}
					</div>
					
					<!-- Watch Video Button -->
					<button 
						class="watch-video-btn"
						on:click={() => openYouTubeVideo(champion.name, selectedAbility === -1 ? 'Passive' : ['Q', 'W', 'E', 'R'][selectedAbility])}
					>
						<span>▶</span> Watch Ability Video
					</button>
					
					<!-- Selected Ability Details -->
					<div class="ability-details">
						{#if selectedAbility === -1}
							<h3 class="ability-name">{champion.passive.name}</h3>
							<span class="ability-type">PASSIVE</span>
							<p class="ability-description">{stripHtml(champion.passive.description)}</p>
						{:else}
							{@const spell = champion.spells[selectedAbility]}
							<h3 class="ability-name">{spell.name}</h3>
							<div class="ability-meta">
								<span class="ability-type">ACTIVE</span>
								{#if spell.cooldown !== '0'}
									<span class="ability-cooldown">CD: {spell.cooldown}s</span>
								{/if}
							</div>
							<p class="ability-description">{stripHtml(spell.description)}</p>
						{/if}
					</div>
				</section>

			</div>

			<!-- Column 3: Matchups, Combat Analysis -->
			<div class="grid-column">

				<!-- Toughest Matchups -->
				{#if champion.matchups && champion.matchups.length > 0}
				<section class="section-card compact" in:fly={{ y: 30, duration: 600, delay: 400, easing: quintOut }}>
					<h2 class="section-title">TOUGHEST MATCHUPS</h2>
					<div class="matchups-list">
						{#each champion.matchups as matchup}
						<div class="matchup-item">
							<img src={matchup.image} alt={matchup.name} class="matchup-icon" />
							<div class="matchup-info">
								<span class="matchup-name">{matchup.name}</span>
								<span class="matchup-wr" style="color: {parseFloat(matchup.winRate) >= 50 ? '#10b981' : '#ef4444'}">{matchup.winRate}% WR</span>
							</div>
							<span class="matchup-matches">{matchup.matches} Matches</span>
						</div>
						{/each}
					</div>
				</section>
				{/if}

				<!-- Combat Analysis -->
				<section class="section-card compact" in:fly={{ y: 30, duration: 600, delay: 500, easing: quintOut }}>
					<h2 class="section-title">COMBAT ANALYSIS</h2>
					<div class="combat-stats">
						<div class="combat-stat">
							<div class="combat-stat-header">
								<span class="combat-stat-name">DAMAGE</span>
								<span class="combat-stat-value">{getDifficultyLabel(champion.info.attack)}</span>
							</div>
							<div class="progress-bar">
								<div class="progress-fill" style="width: {champion.info.attack * 10}%"></div>
							</div>
						</div>
						
						<div class="combat-stat">
							<div class="combat-stat-header">
								<span class="combat-stat-name">MOBILITY</span>
								<span class="combat-stat-value">{getDifficultyLabel(champion.info.defense)}</span>
							</div>
							<div class="progress-bar">
								<div class="progress-fill" style="width: {champion.info.defense * 10}%"></div>
							</div>
						</div>
						
						<div class="combat-stat">
							<div class="combat-stat-header">
								<span class="combat-stat-name">UTILITY</span>
								<span class="combat-stat-value">{getDifficultyLabel(champion.info.magic)}</span>
							</div>
							<div class="progress-bar">
								<div class="progress-fill" style="width: {champion.info.magic * 10}%"></div>
							</div>
						</div>
						
						<div class="combat-stat">
							<div class="combat-stat-header">
								<span class="combat-stat-name">DIFFICULTY</span>
								<span class="combat-stat-value">{getDifficultyLabel(champion.info.difficulty)}</span>
							</div>
							<div class="progress-bar">
								<div class="progress-fill difficulty" style="width: {champion.info.difficulty * 10}%"></div>
							</div>
						</div>
					</div>
				</section>

			</div>
		</div>

		<!-- Full Width Skins Section -->
		<div class="skins-full-width">
				<section class="section-card" in:fly={{ y: 30, duration: 600, delay: 800, easing: quintOut }}>
					<div class="section-header mb-6">
						<h2 class="section-title">SKINS</h2>
						<span class="available-label">AVAILABLE LOOKS</span>
					</div>
					
					<!-- Scroll Container -->
					<div class="skins-gallery-container">
						<div class="skins-track">
							{#each champion.skins.filter(s => s.num !== 0) as skin}
								<div 
									class="skin-card-gallery"
									on:click={() => openSkinSpotlight(champion.name, skin.name)}
									on:keydown={(e) => e.key === 'Enter' && openSkinSpotlight(champion.name, skin.name)}
									role="button"
									tabindex="0"
									title="Click to watch skin spotlight"
								>
									<div class="skin-image-wrapper">
										<img 
											src={skin.loading} 
											alt={skin.name}
											class="skin-image"
											loading="lazy"
										/>
										<div class="skin-info-overlay">
											<h3 class="skin-name">{skin.name.replace(champion.name, '').trim() || 'Classic'}</h3>
											<span class="skin-sub">▶ WATCH SPOTLIGHT</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</section>
		</div>
	</div>
{/if}

<style>
	/* Hero Section */
	.hero-section {
		position: relative;
		min-height: 45vh;
		display: flex;
		flex-direction: column;
		padding: 5rem 2rem 1rem;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		z-index: -1;
		will-change: transform;
		transform: translateZ(0); /* GPU acceleration */
	}

	.hero-bg-image {
		width: 100%;
		height: 120%; /* Extra height for parallax scroll */
		object-fit: cover;
		object-position: center 25%;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			rgba(10, 14, 26, 0.4) 0%,
			rgba(10, 14, 26, 0.6) 60%,
			rgba(10, 14, 26, 1) 100%
		);
	}

	/* Breadcrumb */
	.breadcrumb {
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		margin-bottom: 2rem;
	}

	.breadcrumb a {
		color: rgba(255, 255, 255, 0.5);
		transition: color 0.2s;
	}

	.breadcrumb a:hover {
		color: #c8aa6e;
	}

	.breadcrumb .separator {
		color: rgba(255, 255, 255, 0.3);
	}

	.breadcrumb .active {
		color: #c8aa6e;
	}

	/* Hero Content */
	.hero-content {
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 3rem;
		flex: 1;
	}

	/* Hero Info */
	.hero-info {
		flex: 1;
		max-width: 600px;
	}

	.role-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(200, 170, 110, 0.15);
		border: 1px solid rgba(200, 170, 110, 0.3);
		border-radius: 0.5rem;
		color: #c8aa6e;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		margin-bottom: 1.5rem;
	}

	.hero-title {
		font-family: 'Cinzel', serif;
		font-size: clamp(3rem, 8vw, 6rem);
		font-weight: 900;
		color: white;
		line-height: 1;
		margin-bottom: 1rem;
		text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
	}

	.hero-subtitle {
		font-family: 'Cinzel', serif;
		font-size: clamp(1.25rem, 2.5vw, 1.75rem);
		color: rgba(200, 170, 110, 0.9);
		font-style: italic;
		margin-bottom: 1.5rem;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
	}

	/* Hero Buttons */
	.hero-buttons {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.btn-primary {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 2rem;
		background: #c8aa6e;
		color: #0a0e1a;
		font-weight: 700;
		font-size: 0.875rem;
		letter-spacing: 0.1em;
		border-radius: 0.5rem;
		border: none;
		cursor: pointer;
		transition: all 0.3s;
	}

	.btn-primary:hover {
		background: white;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(200, 170, 110, 0.3);
	}

	.btn-secondary {
		padding: 1rem 2rem;
		background: transparent;
		color: white;
		font-weight: 700;
		font-size: 0.875rem;
		letter-spacing: 0.1em;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.3s;
	}

	.btn-secondary:hover {
		border-color: #c8aa6e;
		color: #c8aa6e;
		background: rgba(200, 170, 110, 0.1);
	}

	/* Stats Card */
	.stats-card {
		background: linear-gradient(135deg, rgba(20, 25, 40, 0.95) 0%, rgba(10, 14, 26, 0.98) 100%);
		border: 1px solid rgba(200, 170, 110, 0.2);
		border-radius: 1rem;
		padding: 2rem;
		backdrop-filter: blur(10px);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2rem;
	}

	.stat-item {
		text-align: center;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 900;
		color: #c8aa6e;
		font-family: 'Cinzel', serif;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.5);
		font-weight: 600;
		letter-spacing: 0.1em;
	}

	/* Content Wrapper */
	.content-wrapper {
		background: #0a0e1a;
		padding: 2rem 1rem;
	}

	.content-container-grid {
		max-width: 1600px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		align-items: start;
		grid-auto-rows: 1fr;
	}

	.grid-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		align-items: stretch;
		height: 100%;
	}

	.skins-full-width {
		max-width: 1600px;
		margin: 0 auto;
		margin-top: 1.5rem;
	}

	@media (max-width: 1200px) {
		.content-container-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 768px) {
		.content-container-grid {
			grid-template-columns: 1fr;
		}
		
		.hero-content {
			flex-direction: column;
			align-items: flex-start;
		}
	}

	/* Section Cards */
	.section-card {
		background: linear-gradient(135deg, rgba(15, 20, 35, 0.8) 0%, rgba(10, 14, 26, 0.9) 100%);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.section-card.compact {
		padding: 1rem;
	}

	.section-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.15em;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.section-title::before {
		content: '';
		width: 3px;
		height: 1rem;
		background: #c8aa6e;
	}

	/* Biography */
	.lore-text {
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.8;
		font-size: 0.9rem;
	}

	/* Combat Stats */
	.combat-stats {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.combat-stat-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.combat-stat-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.1em;
	}

	.combat-stat-value {
		font-size: 0.75rem;
		font-weight: 700;
		color: #c8aa6e;
		letter-spacing: 0.05em;
	}

	.progress-bar {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #c8aa6e 0%, #d4b87a 100%);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.progress-fill.difficulty {
		background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
	}

	/* Build Items */
	.build-items {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.build-item {
		aspect-ratio: 1;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 2px solid rgba(200, 170, 110, 0.2);
		transition: all 0.3s;
		cursor: pointer;
	}

	.build-item:hover {
		border-color: #c8aa6e;
		transform: translateY(-4px) scale(1.05);
		box-shadow: 0 8px 20px rgba(200, 170, 110, 0.3);
	}

	.item-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s;
	}

	.build-item:hover .item-image {
		transform: scale(1.1);
	}

	.build-note {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(200, 170, 110, 0.1);
		border-left: 3px solid #c8aa6e;
		border-radius: 0.375rem;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.build-note svg {
		flex-shrink: 0;
		color: #c8aa6e;
	}

	/* Abilities */
	.ability-icons {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	.ability-icon {
		position: relative;
		width: 60px;
		height: 60px;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 2px solid rgba(255, 255, 255, 0.1);
		cursor: pointer;
		transition: all 0.3s;
		background: rgba(0, 0, 0, 0.3);
	}

	.ability-icon:hover {
		border-color: rgba(200, 170, 110, 0.5);
		transform: translateY(-4px);
	}

	.ability-icon.active {
		border-color: #c8aa6e;
		box-shadow: 0 0 20px rgba(200, 170, 110, 0.3);
	}

	.ability-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.ability-details {
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.75rem;
	}

	.ability-name {
		font-size: 1.25rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.5rem;
	}

	.ability-meta {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.ability-type {
		font-size: 0.7rem;
		font-weight: 700;
		color: #c8aa6e;
		letter-spacing: 0.1em;
	}

	.ability-cooldown {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.ability-description {
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.6;
		font-size: 0.875rem;
	}

	/* Skins */
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.available-label {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		letter-spacing: 0.1em;
		font-weight: 600;
	}

	.skins-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.skin-card {
		border-radius: 0.75rem;
		overflow: hidden;
		cursor: pointer;
		transition: transform 0.3s;
	}

	.skin-card:hover {
		transform: translateY(-8px);
	}

	.skin-image-wrapper {
		position: relative;
		aspect-ratio: 9/16;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.3);
	}

	.skin-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s;
	}

	.skin-card:hover .skin-image {
		transform: scale(1.1);
	}

	.skin-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
	}

	.skin-name {
		font-size: 0.875rem;
		font-weight: 700;
		color: white;
		text-align: center;
	}

	/* Skins Gallery */
	.skins-gallery-container {
		width: 100%;
		overflow-x: auto;
		padding-bottom: 1.5rem;
		/* Enable scrollbar but style it */
		scrollbar-width: thin;
		scrollbar-color: #c8aa6e rgba(255, 255, 255, 0.1);
		scroll-behavior: smooth;
	}

	.skins-gallery-container::-webkit-scrollbar {
		height: 6px;
	}

	.skins-gallery-container::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
	}

	.skins-gallery-container::-webkit-scrollbar-thumb {
		background-color: #c8aa6e;
		border-radius: 3px;
	}

	.skins-track {
		display: flex;
		gap: 1.5rem;
		padding: 0.5rem 0.5rem 1rem 0.5rem;
		width: max-content; /* Ensure items don't wrap */
	}

	.skin-card-gallery {
		min-width: 260px;
		width: 260px;
		height: 400px;
		flex-shrink: 0;
		position: relative;
		border-radius: 0.25rem;
		overflow: hidden;
		background: #000;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
	}

	.skin-card-gallery:hover {
		transform: translateY(-8px);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
		border-color: #c8aa6e;
	}

	.skin-card-gallery .skin-image-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.skin-card-gallery .skin-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.skin-card-gallery:hover .skin-image {
		transform: scale(1.1);
	}

	.skin-info-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 4rem 1.5rem 1.5rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 60%, transparent 100%);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.skin-card-gallery .skin-name {
		font-family: 'Cinzel', serif;
		font-size: 1rem;
		font-weight: 700;
		color: white;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-align: left;
		text-shadow: 0 2px 4px rgba(0,0,0,0.8);
	}

	.skin-sub {
		font-size: 0.65rem;
		color: rgba(200, 170, 110, 0.8);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		font-weight: 600;
	}

	/* Particles */
	.particles-container {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.particle {
		position: absolute;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(200, 170, 110, 0.9) 0%, rgba(200, 170, 110, 0.4) 40%, transparent 100%);
		filter: blur(2px);
		animation: float infinite ease-in-out;
		opacity: 0;
		box-shadow: 0 0 10px rgba(200, 170, 110, 0.5);
	}

	@keyframes float {
		0% {
			transform: translateY(0) translateX(0) scale(0.5);
			opacity: 0;
		}
		10% {
			opacity: var(--particle-opacity, 0.8);
			transform: translateY(-10vh) translateX(10px) scale(1);
		}
		50% {
			opacity: var(--particle-opacity, 0.8);
			transform: translateY(-50vh) translateX(-20px) scale(1.2);
		}
		90% {
			opacity: var(--particle-opacity, 0.8);
			transform: translateY(-90vh) translateX(15px) scale(0.8);
		}
		100% {
			transform: translateY(-110vh) translateX(0) scale(0.3);
			opacity: 0;
		}
	}

	/* Animations */
	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Runes Section */
	.runes-container {
		display: flex;
		gap: 1.5rem;
		margin-top: 1rem;
	}

	.rune-tree {
		flex: 1;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 1rem;
	}

	.tree-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.tree-icon {
		width: 32px;
		height: 32px;
	}

	.tree-name {
		font-size: 0.9rem;
		font-weight: 700;
		color: #c8aa6e;
		text-transform: uppercase;
	}

	.keystone-rune {
		display: flex;
		justify-content: center;
		margin-bottom: 0.75rem;
	}

	.keystone-rune img {
		width: 40px;
		height: 40px;
		border: 2px solid #c8aa6e;
		border-radius: 6px;
	}

	.minor-runes {
		display: flex;
		gap: 0.4rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.minor-runes img {
		width: 30px;
		height: 30px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
	}

	.summoner-spells {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.summoner-spells.compact {
		gap: 0.5rem;
	}

	.summoner-spell {
		width: 48px;
		height: 48px;
		border: 2px solid rgba(200, 170, 110, 0.4);
		border-radius: 6px;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.3);
	}

	.summoner-spell img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.win-rate-badge {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: rgba(200, 170, 110, 0.1);
		border: 1px solid rgba(200, 170, 110, 0.3);
		border-radius: 6px;
		text-align: center;
		font-weight: 700;
		color: #c8aa6e;
	}

	/* Skill Priority */
	.skill-priority {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.priority-skill {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.priority-skill img {
		width: 40px;
		height: 40px;
		border: 2px solid rgba(200, 170, 110, 0.4);
		border-radius: 6px;
	}

	.priority-skill span {
		font-size: 0.85rem;
		font-weight: 700;
		color: #c8aa6e;
	}

	.arrow {
		font-size: 1.5rem;
		color: rgba(200, 170, 110, 0.6);
	}

	/* Skill Path Grid */
	.skill-path-grid {
		display: grid;
		grid-template-columns: repeat(9, 1fr);
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.skill-level {
		aspect-ratio: 1;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.125rem;
		font-size: 0.7rem;
		transition: all 0.2s;
	}

	.skill-level.ultimate {
		background: rgba(200, 170, 110, 0.2);
		border-color: rgba(200, 170, 110, 0.5);
	}

	.level-number {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.6rem;
	}

	.skill-letter {
		font-weight: 700;
		color: #c8aa6e;
		font-size: 0.85rem;
	}

	/* Matchups */
	.matchups-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.matchup-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		transition: all 0.2s;
	}

	.matchup-item:hover {
		background: rgba(0, 0, 0, 0.5);
		border-color: rgba(200, 170, 110, 0.3);
	}

	.matchup-icon {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 2px solid rgba(200, 170, 110, 0.4);
	}

	.matchup-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.matchup-name {
		font-size: 0.9rem;
		font-weight: 700;
		color: white;
	}

	.matchup-wr {
		font-size: 0.8rem;
		font-weight: 600;
	}

	.matchup-matches {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.mt-4 {
		margin-top: 1rem;
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	/* Video Hint on Ability Icons */
	.video-hint {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 16px;
		height: 16px;
		background: rgba(200, 170, 110, 0.9);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 8px;
		color: #000;
		opacity: 0;
		transform: scale(0.8);
		transition: all 0.2s ease;
		pointer-events: none;
	}

	.ability-icon:hover .video-hint {
		opacity: 1;
		transform: scale(1);
	}

	/* Watch Video Button */
	.watch-video-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.25rem;
		margin-bottom: 1.5rem;
		background: linear-gradient(135deg, rgba(200, 170, 110, 0.15), rgba(200, 170, 110, 0.05));
		border: 1px solid rgba(200, 170, 110, 0.4);
		border-radius: 8px;
		color: #c8aa6e;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.watch-video-btn:hover {
		background: linear-gradient(135deg, rgba(200, 170, 110, 0.25), rgba(200, 170, 110, 0.1));
		border-color: #c8aa6e;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(200, 170, 110, 0.2);
	}

	.watch-video-btn span {
		font-size: 1rem;
	}
</style>
