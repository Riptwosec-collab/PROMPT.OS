import { createClient } from '@supabase/supabase-js';

export async function verifySupabaseAccessToken(accessToken) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error('Supabase server authentication is not configured');
  }

  const client = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data?.user) {
    throw new Error('Invalid or expired Supabase access token');
  }
  return data.user;
}
