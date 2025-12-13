import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	// Redirect to home if not logged in
	if (!locals.user) {
		throw redirect(303, '/?login=required');
	}

	return {
		user: locals.user
	};
}
