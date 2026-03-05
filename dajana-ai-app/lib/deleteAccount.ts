// ===========================================
// DAJANA AI - Delete account (Edge Function)
// ===========================================

import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export async function deleteMyAccount(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('Not signed in');
  }

  const url = `${SUPABASE_URL}/functions/v1/delete-account`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      'X-User-JWT': token,
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error ?? `Request failed: ${res.status}`);
  }
}
