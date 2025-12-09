<svelte:head>
	<title>Impressum - ggez.gg</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
	<div class="max-w-4xl mx-auto px-6 py-16">
		<!-- Back Button -->
		<a href="/" class="inline-flex items-center gap-2 text-hex-blue hover:text-hex-gold transition-colors mb-8">
			<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
			<span>Back to Home</span>
		</a>

		<!-- Header -->
		<h1 class="font-cinzel text-5xl text-hex-gold mb-8 tracking-wider">IMPRESSUM</h1>

		<div class="space-y-8 text-gray-300">
			<section>
				<h2 class="text-2xl font-bold text-white mb-4">Information according to § 5 TMG</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<p class="mb-2"><strong>Project:</strong> GGEZ.GG</p>
					<p class="mb-2"><strong>Type:</strong> League of Legends Stats Platform</p>
					<p class="mb-2"><strong>Status:</strong> Educational/Portfolio Project</p>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">Contact</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<p class="mb-2"><strong>Email:</strong> contact@ggez.gg</p>
					<p class="text-sm text-gray-400 mt-4">We generally respond within 24-48 hours</p>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">Disclaimer</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<p class="mb-4"><strong>External Links:</strong></p>
					<p class="text-sm leading-relaxed">
						Our website contains links to external websites. We have no influence on the content of these linked websites, 
						therefore we cannot assume any liability for them. The respective provider or operator is always responsible 
						for the content of the linked pages.
					</p>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">Riot Games Disclaimer</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<p class="text-sm leading-relaxed">
						GGEZ.GG is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games 
						or anyone officially involved in producing or managing Riot Games properties. Riot Games and 
						all associated properties are trademarks or registered trademarks of Riot Games, Inc.
					</p>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">Data Sources</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<p class="mb-2">We use the official Riot Games API to provide statistics and information.</p>
					<p class="text-sm text-gray-400">All game data is provided by Riot Games through their official Developer Portal.</p>
				</div>
			</section>
		</div>

		<!-- Footer Navigation -->
		<div class="mt-16 pt-8 border-t border-white/10 flex gap-4 text-sm text-gray-400">
			<a href="/privacy" class="hover:text-hex-gold transition-colors">Privacy Policy</a>
			<span>|</span>
			<a href="/legal" class="hover:text-hex-gold transition-colors">Legal Notice</a>
		</div>
	</div>
</div>
