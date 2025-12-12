// ⚡ IMAGE OPTIMIZER: Route all external images through our proxy
// Fixes: DDragon cache issues, PNG → WebP, Size optimization

/**
 * Optimizes an image URL by routing through our proxy
 * @param {string} url - Original image URL
 * @param {Object} options - Optimization options
 * @param {number} options.width - Target width (maintains aspect ratio)
 * @param {string} options.format - Target format ('webp', 'avif', 'png')
 * @returns {string} - Proxied & optimized image URL
 */
export function optimizeImage(url, options = {}) {
	if (!url) return '';
	
	const { width, format = 'webp' } = options;
	
	// Build proxy URL
	const params = new URLSearchParams();
	params.set('url', encodeURIComponent(url));
	if (width) params.set('w', width);
	params.set('format', format);
	
	return `/api/image-proxy?${params.toString()}`;
}

/**
 * Get optimized champion splash art
 * @param {string} championName - Champion name (e.g., 'Aatrox')
 * @param {number} skinNum - Skin number (default: 0)
 * @param {number} width - Target width
 */
export function getChampionSplash(championName, skinNum = 0, width = 1920) {
	const url = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_${skinNum}.jpg`;
	return optimizeImage(url, { width, format: 'webp' });
}

/**
 * Get optimized champion icon
 * @param {string} championName - Champion name
 * @param {number} size - Target size (default: 120)
 */
export function getChampionIcon(championName, size = 120) {
	// Direct DDragon URL without proxy for crisp images
	return `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${championName}.png`;
}

/**
 * Get optimized item icon
 * @param {number} itemId - Item ID
 * @param {number} size - Target size (default: 30)
 */
export function getItemIcon(itemId, size = 64) {
	// Direct DDragon URL without proxy for crisp images
	return `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/${itemId}.png`;
}

/**
 * Get optimized summoner spell icon
 * @param {string} spellName - Spell name (e.g., 'SummonerFlash')
 * @param {number} size - Target size (default: 30)
 */
export function getSummonerSpellIcon(spellName, size = 48) {
	// Direct DDragon URL without proxy for crisp images
	return `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/spell/${spellName}.png`;
}

/**
 * Get optimized profile icon
 * @param {number} iconId - Profile icon ID
 * @param {number} size - Target size (default: 96)
 */
export function getProfileIcon(iconId, size = 96) {
	// Direct DDragon URL without proxy for crisp images
	return `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${iconId}.png`;
}

/**
 * Get optimized rank emblem (CommunityDragon)
 * @param {string} tier - Tier name (e.g., 'diamond')
 * @param {number} size - Target size (default: 256)
 */
export function getRankEmblem(tier, size = 256) {
	const url = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/emblem-${tier.toLowerCase()}.png`;
	return optimizeImage(url, { width: size, format: 'webp' });
}

/**
 * Get responsive srcset for an image
 * @param {string} url - Original image URL
 * @param {number[]} widths - Array of widths to generate
 * @returns {string} - srcset string
 */
export function getResponsiveSrcset(url, widths = [256, 512, 1024, 1920]) {
	return widths
		.map(w => `${optimizeImage(url, { width: w, format: 'webp' })} ${w}w`)
		.join(', ');
}

/**
 * Preload a critical image
 * @param {string} url - Image URL
 * @param {number} width - Target width
 */
export function preloadImage(url, width) {
	if (typeof window === 'undefined') return;
	
	const link = document.createElement('link');
	link.rel = 'preload';
	link.as = 'image';
	link.href = optimizeImage(url, { width, format: 'webp' });
	link.fetchpriority = 'high';
	document.head.appendChild(link);
}
