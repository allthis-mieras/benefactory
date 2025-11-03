import type { APIRoute } from 'astro';
import { getSupabaseClient } from '../../lib/supabaseClient';

export const prerender = false;

const supabase = getSupabaseClient();

export const GET: APIRoute = async ({ request }) => {
	try {
		const url = new URL(request.url);
		const householdId = url.searchParams.get('householdId');

		if (!householdId) {
			return new Response(JSON.stringify({ error: 'Missing householdId parameter' }), {
				status: 400,
				headers: { 'content-type': 'application/json' },
			});
		}

		const { data, error } = await supabase
			.from('donations')
			.select('id, charity_name, amount, frequency, annual_amount, created_at')
			.eq('household_id', householdId)
			.order('created_at', { ascending: true });

		if (error) {
			throw error;
		}

		return new Response(JSON.stringify({ donations: data ?? [] }), {
			headers: { 'content-type': 'application/json' },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { 'content-type': 'application/json' },
		});
	}
};

export const POST: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const householdId = String(body.householdId ?? '');
		const charityName = String(body.charityName ?? '').trim();
		const amount = Number(body.amount ?? NaN);
		const frequency = String(body.frequency ?? '').toLowerCase();

		if (!householdId || !charityName || Number.isNaN(amount)) {
			return new Response(JSON.stringify({ error: 'Invalid payload' }), {
				status: 400,
				headers: { 'content-type': 'application/json' },
			});
		}

		if (!['monthly', 'quarterly', 'yearly'].includes(frequency)) {
			return new Response(JSON.stringify({ error: 'Unsupported frequency' }), {
				status: 400,
				headers: { 'content-type': 'application/json' },
			});
		}

		const { error } = await supabase.from('donations').insert({
			household_id: householdId,
			charity_name: charityName,
			amount,
			frequency,
		});

		if (error) {
			throw error;
		}

		const { data: donations, error: fetchError } = await supabase
			.from('donations')
			.select('id, charity_name, amount, frequency, annual_amount, created_at')
			.eq('household_id', householdId)
			.order('created_at', { ascending: true });

		if (fetchError) {
			throw fetchError;
		}

		return new Response(JSON.stringify({ donations }), {
			status: 201,
			headers: { 'content-type': 'application/json' },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { 'content-type': 'application/json' },
		});
	}
};

export const DELETE: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const id = String(body.id ?? '');
		const householdId = String(body.householdId ?? '');

		if (!id || !householdId) {
			return new Response(JSON.stringify({ error: 'Invalid payload' }), {
				status: 400,
				headers: { 'content-type': 'application/json' },
			});
		}

		const { error } = await supabase
			.from('donations')
			.delete()
			.eq('id', id)
			.eq('household_id', householdId);

		if (error) {
			throw error;
		}

		return new Response(JSON.stringify({ success: true }), {
			headers: { 'content-type': 'application/json' },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: { 'content-type': 'application/json' },
		});
	}
};
