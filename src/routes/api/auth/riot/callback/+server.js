import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Riot Sign-On (RSO) OAuth - Callback Handler
 * 
 * Status: PREPARED (Not Active)
 * 
 * This route handles the OAuth callback from Riot after user authorization.
 * It exchanges the authorization code for an access token and fetches user data.
 * 
 * Prerequisites:
 * 1. RSO_CLIENT_ID and RSO_CLIENT_SECRET must be set
 * 2. Redirect URI must match exactly what's registered with Riot
 */

export async function GET({ url, locals }) {
	// TODO: Uncomment when RSO credentials are ready
	/*
	// Check if user is logged in
	if (!locals.user) {
		throw redirect(303, '/?login=required');
	}

	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	// Handle OAuth errors
	if (error) {
		console.error('❌ RSO Error:', error);
		throw redirect(303, `/profile?error=rso-${error}`);
	}

	if (!code) {
		throw redirect(303, '/profile?error=no-code');
	}

	const CLIENT_ID = env.RSO_CLIENT_ID;
	const CLIENT_SECRET = env.RSO_CLIENT_SECRET;
	const REDIRECT_URI = env.RSO_REDIRECT_URI || `${url.origin}/api/auth/riot/callback`;

	if (!CLIENT_ID || !CLIENT_SECRET) {
		throw redirect(303, '/profile?error=rso-not-configured');
	}

	try {
		// Step 1: Exchange authorization code for access token
		console.log('🔄 Exchanging code for access token...');
		
		const tokenResponse = await fetch('https://auth.riotgames.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: REDIRECT_URI,
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET
			})
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error('❌ Token exchange failed:', errorText);
			throw redirect(303, '/profile?error=token-exchange-failed');
		}

		const tokenData = await tokenResponse.json();
		const accessToken = tokenData.access_token;

		console.log('✅ Access token received');

		// Step 2: Get user account info using access token
		const accountResponse = await fetch('https://europe.api.riotgames.com/riot/account/v1/accounts/me', {
			headers: {
				'Authorization': `Bearer ${accessToken}`
			}
		});

		if (!accountResponse.ok) {
			console.error('❌ Failed to fetch account info');
			throw redirect(303, '/profile?error=account-fetch-failed');
		}

		const accountData = await accountResponse.json();
		
		console.log('✅ Account data received:', accountData.gameName);

		// Step 3: Update user in database
		const { db } = await import('$lib/server/db.js');
		
		await db.execute({
			sql: `UPDATE user 
				  SET riot_puuid = ?, 
				      riot_game_name = ?, 
				      riot_tag_line = ?,
				      riot_access_token = ?,
				      riot_token_expires_at = ?
				  WHERE id = ?`,
			args: [
				accountData.puuid,
				accountData.gameName,
				accountData.tagLine,
				accessToken,
				Date.now() + (tokenData.expires_in * 1000), // Convert to timestamp
				locals.user.id
			]
		});

		console.log('✅ User account linked successfully!');

		// Redirect to dashboard
		throw redirect(303, '/dashboard?linked=success');

	} catch (error) {
		console.error('❌ RSO Callback Error:', error);
		throw redirect(303, '/profile?error=rso-failed');
	}
	*/

	// Temporary redirect until RSO is configured
	throw redirect(303, '/profile?error=rso-not-ready');
}
