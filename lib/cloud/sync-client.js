import { getSupabaseBrowserClient } from './supabase-browser.js';

function requireClient() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error('Supabase environment variables are not configured');
  return client;
}

async function requireUser(client) {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in before using cloud sync');
  return data.user;
}

export async function sendMagicLink(email) {
  const client = requireClient();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOutCloud() {
  const client = requireClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getCloudUser() {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user || null;
}

export function subscribeCloudAuth(callback) {
  const client = getSupabaseBrowserClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
  return () => data.subscription.unsubscribe();
}

export async function pushCloudState(payload) {
  const client = requireClient();
  const user = await requireUser(client);
  const row = {
    user_id: user.id,
    payload,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client
    .from('prompt_os_state')
    .upsert(row, { onConflict: 'user_id' })
    .select('updated_at')
    .single();
  if (error) throw error;
  return data;
}

export async function pullCloudState() {
  const client = requireClient();
  const user = await requireUser(client);
  const { data, error } = await client
    .from('prompt_os_state')
    .select('payload, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}
