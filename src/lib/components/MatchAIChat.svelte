<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let match;
	export let summonerPuuid;
	export let isOpen = false;

	let messages = [];
	let inputText = '';
	let loading = false;
	let chatContainer;

	// Get player's participant data from match
	$: participant = match?.info?.participants?.find(p => p.puuid === summonerPuuid);
	
	// Initial analysis on open
	$: if (isOpen && messages.length === 0) {
		analyzeMatch();
	}

	async function analyzeMatch() {
		loading = true;
		
		// Add user's "trigger" message
		messages = [...messages, {
			role: 'system',
			content: 'Analyzing match...',
			timestamp: new Date()
		}];

		try {
			const response = await fetch('/api/ai/match-analysis', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					match,
					participant,
					summonerPuuid
				})
			});

			if (!response.ok) throw new Error('Analysis failed');

			const data = await response.json();
			
			// Replace system message with AI response
			messages = [
				{
					role: 'assistant',
					content: data.analysis,
					timestamp: new Date()
				}
			];

		} catch (error) {
			console.error('AI Analysis Error:', error);
			messages = [
				{
					role: 'assistant',
					content: '❌ Sorry, analysis failed. Please try again.',
					timestamp: new Date()
				}
			];
		} finally {
			loading = false;
			scrollToBottom();
		}
	}

	async function sendMessage() {
		if (!inputText.trim() || loading) return;

		const userMessage = inputText.trim();
		inputText = '';

		// Add user message
		messages = [...messages, {
			role: 'user',
			content: userMessage,
			timestamp: new Date()
		}];

		loading = true;
		scrollToBottom();

		try {
			const response = await fetch('/api/ai/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: messages.slice(-5), // Last 5 messages for context
					match,
					participant
				})
			});

			if (!response.ok) throw new Error('Chat failed');

			const data = await response.json();
			
			messages = [...messages, {
				role: 'assistant',
				content: data.response,
				timestamp: new Date()
			}];

		} catch (error) {
			console.error('Chat Error:', error);
			messages = [...messages, {
				role: 'assistant',
				content: '❌ Sorry, I couldn\'t process that. Try again?',
				timestamp: new Date()
			}];
		} finally {
			loading = false;
			scrollToBottom();
		}
	}

	function scrollToBottom() {
		setTimeout(() => {
			if (chatContainer) {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}
		}, 100);
	}

	function handleKeyPress(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function formatTimestamp(date) {
		return date.toLocaleTimeString('de-DE', { 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	}

	// Quick action buttons
	const quickActions = [
		{ icon: '📊', text: 'Build Analysis', prompt: 'Was my item build optimal?' },
		{ icon: '🎯', text: 'Key Mistakes', prompt: 'What were my biggest mistakes?' },
		{ icon: '💡', text: 'Pro Tips', prompt: 'Give me pro tips for this champion' },
		{ icon: '🔄', text: 'Similar Games', prompt: 'Show me similar games from pros' }
	];

	function sendQuickAction(prompt) {
		inputText = prompt;
		sendMessage();
	}
</script>

{#if isOpen}
	<div 
		class="fixed inset-y-0 right-0 w-full md:w-[480px] bg-hex-darker/95 backdrop-blur-xl border-l border-hex-blue/30 shadow-2xl z-50 flex flex-col"
		transition:fly={{ x: 480, duration: 300 }}
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-hex-blue/20 bg-hex-dark/50">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-full bg-gradient-to-br from-hex-blue to-hex-gold flex items-center justify-center">
					<span class="text-2xl">🤖</span>
				</div>
				<div>
					<h3 class="font-bold text-white">AI Match Coach</h3>
					<p class="text-xs text-gray-400">
						{participant?.championName} • {participant?.win ? 'Victory' : 'Defeat'}
					</p>
				</div>
			</div>
			<button 
				on:click={() => isOpen = false}
				class="w-8 h-8 rounded-lg hover:bg-hex-blue/20 transition-colors flex items-center justify-center text-gray-400 hover:text-white"
			>
				✕
			</button>
		</div>

		<!-- Chat Messages -->
		<div 
			bind:this={chatContainer}
			class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
		>
			{#each messages as message (message.timestamp)}
				<div 
					class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}"
					transition:fade={{ duration: 200 }}
				>
					<div class="flex gap-2 max-w-[85%] {message.role === 'user' ? 'flex-row-reverse' : ''}">
						<!-- Avatar -->
						<div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center {
							message.role === 'assistant' 
								? 'bg-gradient-to-br from-hex-blue to-hex-gold' 
								: 'bg-hex-blue/30'
						}">
							<span class="text-sm">
								{message.role === 'assistant' ? '🤖' : '👤'}
							</span>
						</div>

						<!-- Message Bubble -->
						<div class="flex flex-col {message.role === 'user' ? 'items-end' : 'items-start'}">
							<div class="rounded-2xl px-4 py-3 {
								message.role === 'assistant'
									? 'bg-hex-dark/80 border border-hex-blue/20'
									: 'bg-gradient-to-r from-hex-blue to-hex-gold'
							}">
								<div class="text-sm {message.role === 'assistant' ? 'text-gray-200' : 'text-white'} whitespace-pre-wrap">
									{message.content}
								</div>
							</div>
							<span class="text-xs text-gray-500 mt-1 px-2">
								{formatTimestamp(message.timestamp)}
							</span>
						</div>
					</div>
				</div>
			{/each}

			{#if loading}
				<div class="flex justify-start" transition:fade>
					<div class="flex gap-2 max-w-[85%]">
						<div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-hex-blue to-hex-gold">
							<span class="text-sm">🤖</span>
						</div>
						<div class="rounded-2xl px-4 py-3 bg-hex-dark/80 border border-hex-blue/20">
							<div class="flex gap-1">
								<span class="w-2 h-2 bg-hex-blue rounded-full animate-bounce" style="animation-delay: 0ms"></span>
								<span class="w-2 h-2 bg-hex-blue rounded-full animate-bounce" style="animation-delay: 150ms"></span>
								<span class="w-2 h-2 bg-hex-blue rounded-full animate-bounce" style="animation-delay: 300ms"></span>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if messages.length === 0 && !loading}
				<!-- Welcome Message -->
				<div class="text-center py-8">
					<div class="text-6xl mb-4">🤖</div>
					<h3 class="text-xl font-bold text-white mb-2">AI Coach Ready!</h3>
					<p class="text-gray-400 text-sm mb-6">
						I'll analyze this match and give you personalized tips to improve.
					</p>
					
					<!-- Quick Actions -->
					<div class="grid grid-cols-2 gap-2 max-w-xs mx-auto">
						{#each quickActions as action}
							<button
								on:click={() => sendQuickAction(action.prompt)}
								class="flex items-center gap-2 p-3 bg-hex-dark/50 hover:bg-hex-dark border border-hex-blue/20 hover:border-hex-blue/40 rounded-lg transition-all group"
							>
								<span class="text-xl">{action.icon}</span>
								<span class="text-xs text-gray-300 group-hover:text-white">{action.text}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Input Area -->
		<div class="p-4 border-t border-hex-blue/20 bg-hex-dark/50">
			<!-- Quick Actions (when chat started) -->
			{#if messages.length > 0}
				<div class="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
					{#each quickActions as action}
						<button
							on:click={() => sendQuickAction(action.prompt)}
							disabled={loading}
							class="flex items-center gap-2 px-3 py-2 bg-hex-dark/80 hover:bg-hex-dark border border-hex-blue/20 hover:border-hex-blue/40 rounded-lg transition-all whitespace-nowrap text-sm disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<span>{action.icon}</span>
							<span class="text-gray-300">{action.text}</span>
						</button>
					{/each}
				</div>
			{/if}

			<!-- Input Field -->
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={inputText}
					on:keypress={handleKeyPress}
					disabled={loading}
					placeholder="Ask anything about this match..."
					class="flex-1 px-4 py-3 bg-hex-dark border border-hex-blue/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-hex-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				/>
				<button
					on:click={sendMessage}
					disabled={!inputText.trim() || loading}
					class="px-6 py-3 bg-gradient-to-r from-hex-blue to-hex-gold hover:opacity-80 rounded-xl font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
				>
					<span class="text-xl">➤</span>
				</button>
			</div>

			<p class="text-xs text-gray-500 mt-2 text-center">
				Powered by GPT-4 • Always learning • Free for now 🎁
			</p>
		</div>
	</div>
{/if}

<style>
	/* Hide scrollbar but keep functionality */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	/* Smooth animations */
	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	.animate-bounce {
		animation: bounce 1s infinite;
	}
</style>
