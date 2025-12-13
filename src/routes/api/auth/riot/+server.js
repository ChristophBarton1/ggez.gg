import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Riot Sign-On (RSO) OAuth - Initiate Flow
 * 
 * Status: PREPARED (Not Active)
 * 
 * This route initiates the Riot OAuth flow by redirecting users to Riot's authorization page.
 * 
 * Prerequisites:
 * 1. Register app at https://developer.riotgames.com/
 * 2. Get RSO_CLIENT_ID and RSO_CLIENT_SECRET
 * 3. Add to environment variables
 * 4. Uncomment code below and deploy
 */

export async function GET({ locals, url }) {
	// TODO: Uncomment when RSO credentials are ready
	/*
	// Check if user is logged in
	if (!locals.user) {
		throw redirect(303, '/?login=required');
	}

	const CLIENT_ID = env.RSO_CLIENT_ID;
	const REDIRECT_URI = env.RSO_REDIRECT_URI || `${url.origin}/api/auth/riot/callback`;

	if (!CLIENT_ID) {
		throw redirect(303, '/profile?error=rso-not-configured');
	}

	// Build Riot OAuth authorization URL
	const authUrl = new URL('https://auth.riotgames.com/authorize');
	authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
	authUrl.searchParams.set('client_id', CLIENT_ID);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('scope', 'openid summoner'); // Add 'email' if needed

	// Optional: Save state for CSRF protection
	// const state = generateRandomString();
	// authUrl.searchParams.set('state', state);
	// Store state in session/cookie

	console.log('🔐 Redirecting to Riot OAuth:', authUrl.toString());

	// Redirect to Riot's OAuth page
	throw redirect(303, authUrl.toString());
	*/

	// Temporary redirect until RSO is configured
	throw redirect(303, '/profile?error=rso-not-ready');
}
