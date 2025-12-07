<script>
	import { onMount } from 'svelte';
	
	export let src;
	export let alt = '';
	export let width = undefined;
	export let height = undefined;
	export let priority = 'low'; // 'high', 'low', 'auto'
	export let className = '';
	
	let loaded = false;
	let error = false;
	let imgElement;
	
	// 🎨 Generate tiny placeholder (blur-up effect)
	const placeholderColor = '#1a1a2e'; // Dark blue-ish
	
	onMount(() => {
		if (!imgElement) return;
		
		// 🚀 Use Intersection Observer for lazy loading (unless priority=high)
		if (priority !== 'high') {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach(entry => {
						if (entry.isIntersecting) {
							loadImage();
							observer.unobserve(entry.target);
						}
					});
				},
				{
					rootMargin: '200px', // Start loading 200px before visible
					threshold: 0.01
				}
			);
			
			observer.observe(imgElement);
			
			return () => observer.disconnect();
		} else {
			// High priority = load immediately
			loadImage();
		}
	});
	
	function loadImage() {
		if (!imgElement || loaded || error) return;
		
		const img = new Image();
		img.src = src;
		
		img.onload = () => {
			loaded = true;
		};
		
		img.onerror = () => {
			error = true;
			console.warn('Image load failed:', src);
		};
	}
</script>

<div 
	bind:this={imgElement}
	class="progressive-image {className}"
	style="background-color: {placeholderColor}; aspect-ratio: {width && height ? `${width}/${height}` : 'auto'};"
>
	{#if loaded}
		<img 
			{src} 
			{alt}
			{width}
			{height}
			class="progressive-image__img loaded"
			loading={priority === 'high' ? 'eager' : 'lazy'}
			decoding={priority === 'high' ? 'sync' : 'async'}
			fetchpriority={priority}
		/>
	{:else if error}
		<div class="progressive-image__error">
			<span>❌</span>
		</div>
	{:else}
		<!-- Skeleton loader with shimmer effect -->
		<div class="progressive-image__skeleton">
			<div class="shimmer"></div>
		</div>
	{/if}
</div>

<style>
	.progressive-image {
		position: relative;
		overflow: hidden;
		width: 100%;
		height: 100%;
	}
	
	.progressive-image__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.3s ease-in-out;
	}
	
	.progressive-image__img.loaded {
		opacity: 1;
	}
	
	.progressive-image__error {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-size: 2rem;
	}
	
	.progressive-image__skeleton {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0.03) 0%,
			rgba(255, 255, 255, 0.08) 50%,
			rgba(255, 255, 255, 0.03) 100%
		);
		animation: shimmer 2s infinite;
	}
	
	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}
	
	.shimmer {
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.1) 50%,
			transparent 100%
		);
		animation: shimmer 2s infinite;
	}
</style>
