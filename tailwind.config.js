/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'hex-gold': '#c8aa6e',
				'hex-blue': '#0ac8b9',
				'hex-dark': '#091428',
				'hex-darker': '#000',
			},
			fontFamily: {
				'cinzel': ['Cinzel', 'serif'],
				'inter': ['Inter', 'sans-serif'],
			},
			boxShadow: {
				'neon': '0 0 20px rgba(10, 200, 185, 0.3)',
				'neon-strong': '0 0 40px rgba(10, 200, 185, 0.5)',
			}
		}
	},
	plugins: []
};
