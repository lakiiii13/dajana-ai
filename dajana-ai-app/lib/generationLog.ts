// ===========================================
// DAJANA AI - Generation log za statistiku u admin panelu
// Upis u tabelu generations (type image/video) da Statistika prikaže podatke
// ===========================================

import { supabase } from './supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(s: string | null | undefined): boolean {
  return typeof s === 'string' && UUID_REGEX.test(s.trim());
}

/**
 * Loguje uspešnu generaciju slike (try-on) u bazu.
 * Home "Slike" i Video izbor izvora čitaju iz generations (type = 'image').
 * Ako isti output_url već postoji za tog korisnika, ne ubacuje duplikat (svi korisnici, automatski).
 * Nikad ne baca — uvek pokušava da upiše red (retry sa minimalnim podacima).
 */
export async function logImageGeneration(
  userId: string,
  outfitId: string | null,
  outputUrl: string | null
): Promise<void> {
  if (!outputUrl?.trim()) return;

  const baseUrl = outputUrl.split('?')[0].trim().toLowerCase();
  const { data: existing } = await supabase
    .from('generations')
    .select('output_url')
    .eq('user_id', userId)
    .eq('type', 'image')
    .eq('status', 'completed')
    .not('output_url', 'is', null)
    .limit(500);

  const alreadyLogged =
    existing &&
    existing.some((row: { output_url: string | null }) => {
      const u = row.output_url;
      return u != null && u.split('?')[0].trim().toLowerCase() === baseUrl;
    });
  if (alreadyLogged) {
    console.log('[GenerationLog] Image already logged for this URL, skip duplicate');
    return;
  }

  const safeOutfitId = isValidUUID(outfitId) ? outfitId : null;
  const completedAt = new Date().toISOString();

  const row = {
    user_id: userId,
    type: 'image' as const,
    outfit_id: safeOutfitId,
    output_url: outputUrl,
    status: 'completed' as const,
    completed_at: completedAt,
  };

  let { error } = await supabase.from('generations').insert(row);

  if (error) {
    console.warn('[GenerationLog] Insert error, retrying without outfit_id:', error.message);
    const minimalRow = {
      user_id: userId,
      type: 'image' as const,
      output_url: outputUrl,
      status: 'completed' as const,
      completed_at: completedAt,
    };
    const retry = await supabase.from('generations').insert(minimalRow);
    error = retry.error;
  }

  if (error) {
    console.error('[GenerationLog] Insert failed after retry:', error.message, error.code);
    return;
  }

  console.log('[GenerationLog] Image generation logged OK');
}

/**
 * Loguje uspešnu generaciju videa u bazu.
 * Admin panel Statistika čita iz generations (type = 'video').
 */
export async function logVideoGeneration(
  userId: string,
  outputUrl: string | null
): Promise<void> {
  try {
    const { error } = await supabase.from('generations').insert({
      user_id: userId,
      type: 'video' as const,
      output_url: outputUrl,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[GenerationLog] Video insert error:', error.message, error.code);
    } else {
      console.log('[GenerationLog] Video generation logged OK');
    }
  } catch (e) {
    console.error('[GenerationLog] logVideoGeneration exception:', e);
  }
}
