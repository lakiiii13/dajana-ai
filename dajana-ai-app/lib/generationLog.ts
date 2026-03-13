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
 * Nikad ne baca — uvek pokušava da upiše red (retry sa minimalnim podacima).
 */
export async function logImageGeneration(
  userId: string,
  outfitId: string | null,
  outputUrl: string | null
): Promise<void> {
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
