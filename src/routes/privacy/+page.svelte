<svelte:head>
	<title>Privacy Policy - ggez.gg</title>
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
		<h1 class="font-cinzel text-5xl text-hex-gold mb-8 tracking-wider">PRIVACY POLICY</h1>

		<div class="space-y-8 text-gray-300">
			<section>
				<h2 class="text-2xl font-bold text-white mb-4">Data Collection</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<p class="mb-4 leading-relaxed">
						GGEZ.GG uses publicly available data from the Riot Games API to display League of Legends statistics. 
						We collect and store only the minimum data necessary to provide our service.
					</p>
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">✓</span>
							<span><strong>Account Data:</strong> Username, email, encrypted password (für registrierte User)</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">✓</span>
							<span><strong>Riot Account:</strong> Game Name, Tag Line, PUUID (wenn verknüpft)</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">✓</span>
							<span><strong>Game Statistics:</strong> Summoner data, match history (öffentliche Riot API Daten)</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">✓</span>
							<span><strong>Session Data:</strong> Login-Sessions für Authentication</span>
						</li>
					</ul>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">How We Use Your Data</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<ul class="space-y-3 text-sm leading-relaxed">
						<li><strong class="text-white">Authentication:</strong> Sichere Login-Funktionalität und Session-Management</li>
						<li><strong class="text-white">Personal Dashboard:</strong> Anzeige deiner persönlichen Riot Account Stats</li>
						<li><strong class="text-white">Display Statistics:</strong> League of Legends Performance und Match History</li>
						<li><strong class="text-white">Improve Service:</strong> Analyse von Nutzungsmustern für bessere User Experience</li>
						<li><strong class="text-white">AI Features:</strong> Verarbeitung von Spieldaten für KI-gestützte Empfehlungen</li>
					</ul>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">Cookies & Local Storage</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<p class="mb-4 leading-relaxed">
						Wir verwenden Cookies und Local Storage für folgende Zwecke:
					</p>
					
					<div class="space-y-3 text-sm">
						<div class="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
							<strong class="text-green-400">Notwendige Cookies (Essential):</strong>
							<ul class="mt-2 space-y-1 ml-4">
								<li class="flex items-start gap-2">
									<span class="text-green-400 mt-1">•</span>
									<span><strong>Session Cookies:</strong> Login-Status und Authentifizierung</span>
								</li>
								<li class="flex items-start gap-2">
									<span class="text-green-400 mt-1">•</span>
									<span><strong>Security:</strong> CSRF-Schutz und Session-Validierung</span>
								</li>
								<li class="flex items-start gap-2">
									<span class="text-green-400 mt-1">•</span>
									<span><strong>Cookie Consent:</strong> Speicherung deiner Cookie-Präferenzen</span>
								</li>
							</ul>
						</div>
						
						<div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
							<strong class="text-blue-400">Funktionale Cookies (Optional):</strong>
							<ul class="mt-2 space-y-1 ml-4">
								<li class="flex items-start gap-2">
									<span class="text-blue-400 mt-1">•</span>
									<span>Letzte Summoner-Suchen</span>
								</li>
								<li class="flex items-start gap-2">
									<span class="text-blue-400 mt-1">•</span>
									<span>Einstellungen (Region, Theme, etc.)</span>
								</li>
								<li class="flex items-start gap-2">
									<span class="text-blue-400 mt-1">•</span>
									<span>Performance-Optimierung</span>
								</li>
							</ul>
						</div>
					</div>
					
					<p class="mt-4 text-xs text-gray-400">
						Du kannst deine Cookie-Einstellungen jederzeit über den Cookie-Banner ändern.
					</p>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<div class="space-y-4 text-sm leading-relaxed">
						<div>
							<strong class="text-white">Riot Games API:</strong>
							<p class="text-gray-400 mt-1">Offizielle Riot Games API für Spieldaten (öffentlich verfügbar)</p>
						</div>
						<div>
							<strong class="text-white">Turso Database:</strong>
							<p class="text-gray-400 mt-1">Sichere Speicherung von User-Accounts und Sessions (libSQL, DSGVO-konform)</p>
						</div>
						<div>
							<strong class="text-white">Hosting Provider:</strong>
							<p class="text-gray-400 mt-1">Vercel (EU-Region) - Siehe Vercel Privacy Policy für Details</p>
						</div>
					</div>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">Your Rights</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<p class="mb-4 leading-relaxed">You have the right to:</p>
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">→</span>
							<span>Request information about data we have collected</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">→</span>
							<span>Request deletion of your data from our caches</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">→</span>
							<span>Opt-out of data collection by not using our service</span>
						</li>
					</ul>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">Contact</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<p class="mb-2">For privacy-related inquiries, contact us at:</p>
					<p class="text-hex-gold">privacy@ggez.gg</p>
				</div>
			</section>

			<section>
				<h2 class="text-2xl font-bold text-white mb-4">DSGVO / GDPR Compliance</h2>
				<div class="bg-white/5 p-6 rounded-lg backdrop-blur-sm border border-white/10">
					<p class="mb-4 text-sm leading-relaxed">
						Wir halten uns an die EU-Datenschutz-Grundverordnung (DSGVO). Deine Daten werden:
					</p>
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">✓</span>
							<span>Nur in der EU gespeichert (Turso EU Database)</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">✓</span>
							<span>Mit modernster Verschlüsselung geschützt</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">✓</span>
							<span>Niemals an Dritte verkauft oder weitergegeben</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-hex-gold mt-1">✓</span>
							<span>Können jederzeit gelöscht werden (Kontakt: privacy@ggez.gg)</span>
						</li>
					</ul>
				</div>
			</section>

			<section>
				<p class="text-sm text-gray-500 italic">Letzte Aktualisierung: 13. Dezember 2024</p>
			</section>
		</div>

		<!-- Footer Navigation -->
		<div class="mt-16 pt-8 border-t border-white/10 flex gap-4 text-sm text-gray-400">
			<a href="/impressum" class="hover:text-hex-gold transition-colors">Impressum</a>
			<span>|</span>
			<a href="/legal" class="hover:text-hex-gold transition-colors">Legal Notice</a>
		</div>
	</div>
</div>
