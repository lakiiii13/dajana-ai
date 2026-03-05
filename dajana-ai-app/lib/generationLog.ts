// ===========================================
// DAJANA AI - Generation log za statistiku u admin panelu
// Upis u tabelu generations (type image/video) da Statistika prikaže podatke
// ===========================================

import { supabase } from './supabase';

/**
 * Loguje uspešnu generaciju slike (try-on) u bazu.
 * Admin panel Statistika čita iz generations (type = 'image').
 */
export async function logImageGeneration(
  userId: string,
  outfitId: string | null,
  outputUrl: string | null
): Promise<void> {
  try {
    await supabase.from('generations').insert({
      user_id: userId,
      type: 'image',
      outfit_id: outfitId,
      output_url: outputUrl,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[GenerationLog] logImageGeneration failed:', e);
  }
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
    await supabase.from('generations').insert({
      user_id: userId,
      type: 'video',
      output_url: outputUrl,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[GenerationLog] logVideoGeneration failed:', e);
  }
}
