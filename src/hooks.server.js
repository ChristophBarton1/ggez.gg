// ⚡ SERVER-SIDE PERFORMANCE OPTIMIZATIONS
import { lucia } from '$lib/server/auth.js';
import { initDB } from '$lib/server/db.js';

// Lazy DB initialization for serverless
let dbInitialized = false;
let dbInitPromise = null;

async function ensureDBInitialized() {
	if (dbInitialized) return;
	if (dbInitPromise) return dbInitPromise;
	
	dbInitPromise = initDB().then(() => {
		dbInitialized = true;
		console.log('✅ Database initialized');
	}).catch(err => {
		console.warn('⚠️ Database init failed (auth disabled):', err.message);
		// Don't throw - allow app to work without auth
	});
	
	return dbInitPromise;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	// Auth middleware (lazy init, error-tolerant)
	try {
		await ensureDBInitialized();
		
		const sessionId = event.cookies.get(lucia.sessionCookieName);
		if (sessionId) {
			const { session, user } = await lucia.validateSession(sessionId);
			if (session && session.fresh) {
				const sessionCookie = lucia.createSessionCookie(session.id);
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes
				});
			}
			if (!session) {
				const sessionCookie = lucia.createBlankSessionCookie();
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '.',
					...sessionCookie.attributes
				});
			}
			event.locals.user = user;
			event.locals.session = session;
		}
	} catch (error) {
		// Auth failed - continue without auth
		console.warn('⚠️ Auth middleware error:', error.message);
		event.locals.user = null;
		event.locals.session = null;
	}
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
	} else if (url.pathname.startsWith('/api/image-proxy')) {
		// ⚡ IMAGE PROXY: 1-year cache (images never change!)
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	} else if (url.pathname.startsWith('/api/')) {
		// Other API responses: short cache with stale-while-revalidate
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
