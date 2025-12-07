import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				passes: 2, // More aggressive compression
				pure_funcs: ['console.log', 'console.info', 'console.debug']
			},
			mangle: {
				toplevel: true
			}
		},
		cssMinify: 'lightningcss', // Faster than default
		target: 'es2020', // Modern browsers only = smaller bundle
		reportCompressedSize: false, // Faster builds
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				// ⚡ AGGRESSIVE CODE SPLITTING for faster initial load
				manualChunks: (id) => {
					// Vendor libraries
					if (id.includes('node_modules')) {
						if (id.includes('svelte')) return 'vendor-svelte';
						return 'vendor-other';
					}
					
					// Route-based splitting
					if (id.includes('src/routes/champions')) return 'route-champions';
					if (id.includes('src/routes/[region]')) return 'route-profile';
					
					// Component splitting
					if (id.includes('src/lib/components')) return 'components';
					if (id.includes('src/lib/api')) return 'api';
				},
				// Optimize chunk names for better caching
				chunkFileNames: 'chunks/[name].[hash].js',
				entryFileNames: 'entries/[name].[hash].js',
				assetFileNames: 'assets/[name].[hash][extname]'
			}
		}
	},
	// ⚡ Development speed optimizations
	server: {
		fs: {
			strict: false
		}
	},
	optimizeDeps: {
		include: ['svelte'] // Pre-bundle dependencies
	}
});
