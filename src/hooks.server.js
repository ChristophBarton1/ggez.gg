// ⚡ SERVER-SIDE PERFORMANCE OPTIMIZATIONS

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event, {
		// Enable HTTP/2 Server Push for critical resources
		preload: ({ type }) => type === 'js' || type === 'css',
		
		// Minify HTML in production
		transformPageChunk: ({ html }) => {
			if (process.env.NODE_ENV === 'production') {
				return html
					.replace(/>\s+</g, '><') // Remove whitespace between tags
					.replace(/\s{2,}/g, ' '); // Collapse multiple spaces
			}
			return html;
		}
	});

	// ⚡ AGGRESSIVE CACHING HEADERS
	const url = new URL(event.request.url);
	const isStatic = url.pathname.startsWith('/_app/') || 
	                 url.pathname.startsWith('/assets/') ||
	                 url.pathname.startsWith('/chunks/') ||
	                 url.pathname.match(/\.(js|css|woff2|png|jpg|webp|svg)$/);

	if (isStatic) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	} else if (url.pathname.startsWith('/api/')) {
		// API responses: short cache with stale-while-revalidate
		response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=600');
	} else {
		// HTML pages: revalidate but allow stale
		response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate, stale-while-revalidate=60');
	}

	// ⚡ SECURITY & PERFORMANCE HEADERS
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	
	// Enable compression hints for proxies
	response.headers.set('Vary', 'Accept-Encoding');

	return response;
}
