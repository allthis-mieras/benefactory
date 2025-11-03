import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | undefined;

/**
 * Returns a singleton Supabase client configured with PUBLIC_* environment variables.
 * Throws when required environment variables are missing so issues surface early in development.
 */
export function getSupabaseClient(): SupabaseClient {
	const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			'Missing Supabase configuration. Define PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in your environment.',
		);
	}

	if (!cachedClient) {
		cachedClient = createClient(supabaseUrl, supabaseAnonKey);
	}

	return cachedClient;
}
