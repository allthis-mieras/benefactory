import type { APIRoute } from 'astro';
import { getSupabaseClient } from '../../lib/supabaseClient';

export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		const supabase = getSupabaseClient();

		const { error } = await supabase.auth.getSession();

		if (error) {
			throw error;
		}

		return new Response(
			JSON.stringify({
				ok: true,
				message:
					'Supabase client initialized successfully. Replace this route with your own queries once your database is ready.',
			}),
			{
				headers: { 'content-type': 'application/json' },
			},
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return new Response(JSON.stringify({ ok: false, message }), {
			status: 500,
			headers: { 'content-type': 'application/json' },
		});
	}
};
