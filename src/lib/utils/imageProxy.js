/**
 * 🖼️ Image Proxy für automatische WebP Konvertierung & Responsive Sizing
 * 
 * Nutzt wsrv.nl (kostenloses CDN) für:
 * - Automatisches WebP/AVIF
 * - Responsive sizing
 * - Aggressive caching
 * 
 * Savings: ~70% kleinere Bilder für First Visit!
 */

/**
 * Optimiere Riot CDN Image via wsrv.nl
 * @param {string} riotUrl - Original Riot CDN URL
 * @param {object} options - Width, height, quality
 * @returns {string} - Optimized image URL
 */
export function optimizeRiotImage(riotUrl, options = {}) {
	const {
		width = null,
		height = null,
		quality = 85,
		format = 'auto' // auto = WebP for supporting browsers, fallback to original
	} = options;

	// wsrv.nl: Free image CDN with WebP support
	// Docs: https://wsrv.nl/docs/
	const params = new URLSearchParams();
	
	// Encode the Riot URL
	params.append('url', riotUrl);
	
	// Responsive width
	if (width) params.append('w', width);
	if (height) params.append('h', height);
	
	// Quality (1-100)
	params.append('q', quality);
	
	// Output format (webp, avif, auto)
	if (format === 'auto') {
		params.append('output', 'webp');
		params.append('default', riotUrl); // Fallback to original
	}
	
	// Optimization options
	params.append('maxage', '7d'); // Cache for 7 days
	params.append('fit', 'cover'); // Crop to fit
	
	return `https://wsrv.nl/?${params.toString()}`;
}

/**
 * Champion Splash Image (optimiert für Match History)
 * Display: 214×126 → Request: 400×300 (2× retina)
 */
export function getChampionSplash(championName, size = 'small') {
	const baseUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_0.jpg`;
	
	const sizes = {
		small: { width: 400, height: 300 },  // für Match History
		medium: { width: 800, height: 600 }, // für Hover/Preview
		large: { width: 1200, height: 900 }  // für Hero Background
	};
	
	const dimensions = sizes[size] || sizes.small;
	
	return optimizeRiotImage(baseUrl, {
		width: dimensions.width,
		height: dimensions.height,
		quality: 85
	});
}

/**
 * Responsive srcset für Champion Splash
 * Für <img srcset="..." sizes="...">
 */
export function getChampionSplashSrcset(championName) {
	const baseUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_0.jpg`;
	
	return {
		// Original als fallback
		src: optimizeRiotImage(baseUrl, { width: 400, quality: 85 }),
		
		// Responsive srcset
		srcset: [
			`${optimizeRiotImage(baseUrl, { width: 214, quality: 80 })} 214w`,
			`${optimizeRiotImage(baseUrl, { width: 400, quality: 85 })} 400w`,
			`${optimizeRiotImage(baseUrl, { width: 600, quality: 85 })} 600w`
		].join(', '),
		
		// Sizes (CSS media queries)
		sizes: '(max-width: 640px) 100vw, 214px'
	};
}

/**
 * Item Icon (optimiert)
 */
export function getItemIcon(itemId, version = '14.1.1') {
	const baseUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
	
	return optimizeRiotImage(baseUrl, {
		width: 64,
		height: 64,
		quality: 90
	});
}

/**
 * Profile Icon (optimiert)
 */
export function getProfileIcon(iconId, version = '14.1.1') {
	const baseUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
	
	return optimizeRiotImage(baseUrl, {
		width: 128,
		height: 128,
		quality: 90
	});
}

/**
 * Homepage Champion Cards (für trending champions)
 * Lighthouse-optimiert: Lädt nur die tatsächlich benötigte Größe (174x316)
 */
export function getChampionLoading(championName) {
	const baseUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championName}_0.jpg`;
	
	// Responsive srcset für verschiedene Bildschirmgrößen
	return {
		// Default src für alte Browser (Lighthouse optimierte Größe!)
		src: optimizeRiotImage(baseUrl, { width: 174, quality: 80 }),
		
		// Responsive srcset
		srcset: [
			`${optimizeRiotImage(baseUrl, { width: 174, quality: 80 })} 174w`,  // Mobile/Desktop default
			`${optimizeRiotImage(baseUrl, { width: 308, quality: 85 })} 308w`,  // Retina/High-DPI
			`${optimizeRiotImage(baseUrl, { width: 400, quality: 85 })} 400w`   // Large screens
		].join(', '),
		
		// Sizes (CSS media queries) - matched to actual display size!
		sizes: '(max-width: 640px) 50vw, 174px'
	};
}

/**
 * Background Image (für Homepage Hero)
 * Nur für statisches Bild, nicht für Video!
 */
export function getBackgroundImage(imageUrl) {
	return optimizeRiotImage(imageUrl, {
		width: 1920,
		height: 1080,
		quality: 80
	});
}

/**
 * Preload critical images (für LCP optimization)
 * Usage: In <svelte:head>
 */
export function preloadChampionSplash(championName) {
	const url = getChampionSplash(championName, 'small');
	return `<link rel="preload" as="image" href="${url}" fetchpriority="high">`;
}
