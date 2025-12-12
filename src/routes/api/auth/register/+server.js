import { json } from '@sveltejs/kit';

// Auth system temporarily disabled - will be enabled once Turso is configured
export async function POST() {
	return json({ 
		error: 'Registration is temporarily disabled. Coming soon!' 
	}, { status: 503 });
}
