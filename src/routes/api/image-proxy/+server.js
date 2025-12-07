// ⚡ IMAGE PROXY: WebP conversion + aggressive caching for DDragon/CommunityDragon
// Fixes: Cache TTL = None, PNG → WebP conversion, Size optimization

import sharp from 'sharp';

const CACHE_DURATION = 31536000; // 1 year in seconds (365 days)
const imageCache = new Map(); // In-memory cache

/**
 * GET /api/image-proxy?url=<encoded-url>&w=<width>&format=<webp|png>
 * 
 * Proxies images from DDragon/CommunityDragon with:
 * - WebP conversion (80% quality)
 * - Resizing to exact dimensions
 * - 1-year browser cache
 * - In-memory server cache
 */
export async function GET({ url }) {
	try {
		const imageUrl = url.searchParams.get('url');
		const width = parseInt(url.searchParams.get('w')) || null;
		const format = url.searchParams.get('format') || 'webp';
		
		if (!imageUrl) {
			return new Response('Missing url parameter', { status: 400 });
		}
		
		// Decode URL
		const decodedUrl = decodeURIComponent(imageUrl);
		
		// Cache key
		const cacheKey = `${decodedUrl}_${width}_${format}`;
		
		// Check in-memory cache first
		if (imageCache.has(cacheKey)) {
			const cached = imageCache.get(cacheKey);
			return new Response(cached.buffer, {
				headers: {
					'Content-Type': cached.contentType,
					'Cache-Control': `public, max-age=${CACHE_DURATION}, immutable`,
					'X-Cache': 'HIT'
				}
			});
		}
		
		// Fetch original image
		const response = await fetch(decodedUrl);
		if (!response.ok) {
			return new Response('Image not found', { status: 404 });
		}
		
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		
		// Process with sharp
		let pipeline = sharp(buffer);
		
		// Resize if width specified
		if (width) {
			pipeline = pipeline.resize(width, null, {
				fit: 'inside',
				withoutEnlargement: true
			});
		}
		
		// Convert to specified format
		if (format === 'webp') {
			pipeline = pipeline.webp({ quality: 80, effort: 4 });
		} else if (format === 'avif') {
			pipeline = pipeline.avif({ quality: 80, effort: 4 });
		} else {
			pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
		}
		
		// Execute pipeline
		const optimizedBuffer = await pipeline.toBuffer();
		
		// Store in cache (limit to 100 images to prevent memory issues)
		if (imageCache.size > 100) {
			const firstKey = imageCache.keys().next().value;
			imageCache.delete(firstKey);
		}
		
		const contentType = format === 'webp' ? 'image/webp' : 
		                   format === 'avif' ? 'image/avif' : 'image/png';
		
		imageCache.set(cacheKey, {
			buffer: optimizedBuffer,
			contentType
		});
		
		console.log(`📸 Image optimized: ${decodedUrl.slice(-50)} (${buffer.length} → ${optimizedBuffer.length} bytes, -${Math.round((1 - optimizedBuffer.length/buffer.length) * 100)}%)`);
		
		return new Response(optimizedBuffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': `public, max-age=${CACHE_DURATION}, immutable`,
				'X-Cache': 'MISS'
			}
		});
		
	} catch (error) {
		console.error('Image proxy error:', error);
		return new Response('Internal server error', { status: 500 });
	}
}
