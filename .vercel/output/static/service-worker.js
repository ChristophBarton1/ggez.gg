/**
 * 🚀 Service Worker for aggressive caching of external resources
 * Solves: 720 KB Cache TTL issue from Lighthouse
 * 
 * Caches:
 * - ddragon.leagueoflegends.com (champion images, items, icons)
 * - fonts.gstatic.com (Google Fonts)
 * - europe.api.riotgames.com (API responses for 5 min)
 */

const CACHE_NAME = 'easygame-v1';
const STATIC_CACHE = 'easygame-static-v1';
const IMAGE_CACHE = 'easygame-images-v1';
const API_CACHE = 'easygame-api-v1';

// Cache durations
const CACHE_DURATIONS = {
	images: 7 * 24 * 60 * 60 * 1000,      // 7 days for images
	api: 5 * 60 * 1000,                    // 5 minutes for API
	static: 30 * 24 * 60 * 60 * 1000      // 30 days for static assets
};

// Install event
self.addEventListener('install', (event) => {
	console.log('[Service Worker] Installing...');
	self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
	console.log('[Service Worker] Activating...');
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE && name !== IMAGE_CACHE && name !== API_CACHE)
					.map((name) => caches.delete(name))
			);
		})
	);
	return self.clients.claim();
});

// Fetch event with caching strategies
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Strategy 1: Cache-First for ddragon.leagueoflegends.com (images)
	if (url.hostname === 'ddragon.leagueoflegends.com') {
		event.respondWith(cacheFirstWithExpiry(event.request, IMAGE_CACHE, CACHE_DURATIONS.images));
		return;
	}

	// Strategy 2: Cache-First for Google Fonts
	if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
		event.respondWith(cacheFirstWithExpiry(event.request, STATIC_CACHE, CACHE_DURATIONS.static));
		return;
	}

	// Strategy 3: Network-First with short cache for Riot API
	if (url.hostname.includes('api.riotgames.com')) {
		event.respondWith(networkFirstWithCache(event.request, API_CACHE, CACHE_DURATIONS.api));
		return;
	}

	// Default: Network-First
	event.respondWith(fetch(event.request));
});

/**
 * Cache-First strategy with expiry
 * Perfect for images that rarely change
 */
async function cacheFirstWithExpiry(request, cacheName, maxAge) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);

	if (cached) {
		const cachedTime = new Date(cached.headers.get('sw-cache-time'));
		const now = new Date();
		
		// Check if cache is still valid
		if (now - cachedTime < maxAge) {
			console.log(`[SW] Cache HIT: ${request.url.substring(0, 50)}...`);
			return cached;
		} else {
			console.log(`[SW] Cache EXPIRED: ${request.url.substring(0, 50)}...`);
		}
	}

	// Fetch from network
	try {
		const response = await fetch(request);
		
		// Only cache successful responses
		if (response.status === 200) {
			const clonedResponse = response.clone();
			const headers = new Headers(clonedResponse.headers);
			headers.append('sw-cache-time', new Date().toISOString());
			
			const responseToCache = new Response(await clonedResponse.blob(), {
				status: clonedResponse.status,
				statusText: clonedResponse.statusText,
				headers: headers
			});
			
			cache.put(request, responseToCache);
			console.log(`[SW] Cache STORED: ${request.url.substring(0, 50)}...`);
		}
		
		return response;
	} catch (error) {
		console.error(`[SW] Fetch FAILED: ${request.url}`, error);
		
		// Return cached version even if expired
		if (cached) {
			console.log(`[SW] Returning expired cache as fallback`);
			return cached;
		}
		
		throw error;
	}
}

/**
 * Network-First strategy with cache fallback
 * Perfect for API calls that need fresh data
 */
async function networkFirstWithCache(request, cacheName, maxAge) {
	const cache = await caches.open(cacheName);
	
	try {
		const response = await fetch(request);
		
		// Cache successful responses
		if (response.status === 200) {
			const clonedResponse = response.clone();
			const headers = new Headers(clonedResponse.headers);
			headers.append('sw-cache-time', new Date().toISOString());
			
			const responseToCache = new Response(await clonedResponse.blob(), {
				status: clonedResponse.status,
				statusText: clonedResponse.statusText,
				headers: headers
			});
			
			cache.put(request, responseToCache);
		}
		
		return response;
	} catch (error) {
		// Network failed, try cache
		const cached = await cache.match(request);
		
		if (cached) {
			const cachedTime = new Date(cached.headers.get('sw-cache-time'));
			const now = new Date();
			
			// Return cache even if expired (offline fallback)
			if (now - cachedTime < maxAge * 10) { // Allow 10x expired for offline
				console.log(`[SW] Network FAILED, using cache: ${request.url.substring(0, 50)}...`);
				return cached;
			}
		}
		
		throw error;
	}
}

// Message handler for cache management
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'CLEAR_CACHE') {
		event.waitUntil(
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.map((name) => caches.delete(name))
				);
			})
		);
	}
});
