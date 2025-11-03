import type { APIRoute } from 'astro';
import { getSupabaseClient } from '../../lib/supabaseClient';

const supabase = getSupabaseClient();

async function fetchHousehold(id: string) {
	const { data: household, error: householdError } = await supabase
		.from('households')
		.select('id, alias, annual_income, created_at, updated_at')
		.eq('id', id)
		.maybeSingle();

	if (householdError) {
		throw householdError;
	}

	const { data: donations, error: donationsError } = await supabase
		.from('donations')
		.select('id, charity_name, amount, frequency, annual_amount, created_at')
		.eq('household_id', id)
		.order('created_at', { ascending: true });

	if (donationsError) {
		throw donationsError;
	}

	return { household, donations };
}

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const id = url.searchParams.get('id');

	if (!id) {
		return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
			status: 400,
			headers: { 'content-type': 'application/json' },
		});
	}

	try {
		const payload = await fetchHousehold(id);
		return new Response(JSON.stringify(payload), {
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
		const alias: string | null = body.alias ?? null;
		const annualIncome = Number(body.annualIncome ?? 0);

		const { data, error } = await supabase
			.from('households')
			.insert({ alias, annual_income: annualIncome })
			.select('id')
			.single();

		if (error) {
			throw error;
		}

		const payload = await fetchHousehold(data.id);
		return new Response(JSON.stringify(payload), {
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

export const PUT: APIRoute = async ({ request }) => {
	try {
		const body = await request.json();
		const id = String(body.id ?? '');
		const annualIncome = Number(body.annualIncome ?? NaN);

		if (!id || Number.isNaN(annualIncome)) {
			return new Response(JSON.stringify({ error: 'Invalid payload' }), {
				status: 400,
				headers: { 'content-type': 'application/json' },
			});
		}

		const { error } = await supabase
			.from('households')
			.update({ annual_income: annualIncome })
			.eq('id', id);

		if (error) {
			throw error;
		}

		const payload = await fetchHousehold(id);
		return new Response(JSON.stringify(payload), {
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
