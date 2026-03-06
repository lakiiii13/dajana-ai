// ===========================================
// DAJANA AI - Credit Service
// Manages user credit tracking for AI generations.
// Obnova: 31 dana od uplate (last_reset_date), ne kalendarski mesec.
// 3 tipa: Slike (50), Video (2), Analize (2) po periodu.
// ===========================================

import { supabase } from '@/lib/supabase';
import { CREDIT_LIMITS, CREDIT_PERIOD_DAYS } from '@/constants/credits';

export interface UserCredits {
  imageCreditsUsed: number;
  imageCreditsLimit: number;
  bonusImageCredits: number;
  imageCreditsRemaining: number;
}

export interface AllCredits {
  image: { used: number; limit: number; bonus: number; remaining: number };
  video: { used: number; limit: number; bonus: number; remaining: number };
  analysis: { used: number; limit: number; bonus: number; remaining: number };
  lastResetDate: string;
}

/**
 * Get ALL credits for a user (image, video, analysis).
 */
export async function getAllCredits(userId: string): Promise<AllCredits> {
  const defaults: AllCredits = {
    image: { used: 0, limit: CREDIT_LIMITS.monthly.images, bonus: 0, remaining: CREDIT_LIMITS.monthly.images },
    video: { used: 0, limit: CREDIT_LIMITS.monthly.videos, bonus: 0, remaining: CREDIT_LIMITS.monthly.videos },
    analysis: { used: 0, limit: CREDIT_LIMITS.monthly.analyses, bonus: 0, remaining: CREDIT_LIMITS.monthly.analyses },
    lastResetDate: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Red ne postoji (npr. trigger nije pokrenut) – kreiraj sa podrazumevanim kreditima
      const now = new Date().toISOString();
      const { data: newCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          image_credits_used: 0,
          image_credits_limit: CREDIT_LIMITS.monthly.images,
          video_credits_used: 0,
          video_credits_limit: CREDIT_LIMITS.monthly.videos,
          analysis_credits_used: 0,
          analysis_credits_limit: CREDIT_LIMITS.monthly.analyses,
          bonus_image_credits: 0,
          bonus_video_credits: 0,
          bonus_analysis_credits: 0,
          last_reset_date: now,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Credits] Creating row failed (RLS?):', insertError.code, insertError.message);
        return defaults;
      }

      return mapRowToAllCredits(newCredits);
    }

    if (error) {
      console.error('Error fetching credits:', error);
      return defaults;
    }

    // Obnova: 31 dana od last_reset_date (uplata), ne 1. u mesecu
    const lastReset = new Date(data.last_reset_date);
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceReset = (now.getTime() - lastReset.getTime()) / msPerDay;
    const needsReset = daysSinceReset >= CREDIT_PERIOD_DAYS;

    if (needsReset) {
      const { data: resetData, error: resetError } = await supabase
        .from('user_credits')
        .update({
          image_credits_used: 0,
          video_credits_used: 0,
          analysis_credits_used: 0,
          bonus_image_credits: 0,
          bonus_video_credits: 0,
          bonus_analysis_credits: 0,
          last_reset_date: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (resetError) console.error('Error resetting credits:', resetError);

      const row = resetData || data;
      return {
        image: { used: 0, limit: row.image_credits_limit, bonus: 0, remaining: row.image_credits_limit },
        video: { used: 0, limit: row.video_credits_limit, bonus: 0, remaining: row.video_credits_limit },
        analysis: { used: 0, limit: row.analysis_credits_limit, bonus: 0, remaining: row.analysis_credits_limit },
        lastResetDate: now.toISOString(),
      };
    }

    return mapRowToAllCredits(data);
  } catch (err) {
    console.error('[Credits] Unexpected error:', err);
    return defaults;
  }
}

function mapRowToAllCredits(row: any): AllCredits {
  return {
    image: {
      used: row.image_credits_used || 0,
      limit: row.image_credits_limit || CREDIT_LIMITS.monthly.images,
      bonus: row.bonus_image_credits || 0,
      remaining: (row.image_credits_limit || CREDIT_LIMITS.monthly.images) - (row.image_credits_used || 0) + (row.bonus_image_credits || 0),
    },
    video: {
      used: row.video_credits_used || 0,
      limit: row.video_credits_limit || CREDIT_LIMITS.monthly.videos,
      bonus: row.bonus_video_credits || 0,
      remaining: (row.video_credits_limit || CREDIT_LIMITS.monthly.videos) - (row.video_credits_used || 0) + (row.bonus_video_credits || 0),
    },
    analysis: {
      used: row.analysis_credits_used || 0,
      limit: row.analysis_credits_limit || CREDIT_LIMITS.monthly.analyses,
      bonus: row.bonus_analysis_credits || 0,
      remaining: (row.analysis_credits_limit || CREDIT_LIMITS.monthly.analyses) - (row.analysis_credits_used || 0) + (row.bonus_analysis_credits || 0),
    },
    lastResetDate: row.last_reset_date || new Date().toISOString(),
  };
}

/**
 * Get current user image credits (legacy — used by try-on flow).
 */
export async function getUserCredits(userId: string): Promise<UserCredits> {
  const all = await getAllCredits(userId);
  return {
    imageCreditsUsed: all.image.used,
    imageCreditsLimit: all.image.limit,
    bonusImageCredits: all.image.bonus,
    imageCreditsRemaining: all.image.remaining,
  };
}

/**
 * Check if user has available image / video / analysis credits.
 */
export async function hasImageCredits(userId: string): Promise<boolean> {
  const all = await getAllCredits(userId);
  return all.image.remaining > 0;
}

export async function hasVideoCredits(userId: string): Promise<boolean> {
  const all = await getAllCredits(userId);
  return all.video.remaining > 0;
}

export async function hasAnalysisCredits(userId: string): Promise<boolean> {
  const all = await getAllCredits(userId);
  return all.analysis.remaining > 0;
}

/**
 * Deduct one image credit after successful generation.
 */
export async function deductImageCredit(userId: string): Promise<UserCredits> {
  console.log('[Credits] deductImageCredit called for user:', userId);

  // First ensure the row exists by calling getAllCredits (which creates if needed)
  const allCredits = await getAllCredits(userId);
  const credits: UserCredits = {
    imageCreditsUsed: allCredits.image.used,
    imageCreditsLimit: allCredits.image.limit,
    bonusImageCredits: allCredits.image.bonus,
    imageCreditsRemaining: allCredits.image.remaining,
  };

  console.log('[Credits] Current state:', JSON.stringify(credits));

  if (credits.imageCreditsRemaining <= 0) {
    throw new Error('No image credits remaining');
  }

  let newBonusCredits = credits.bonusImageCredits;
  let newUsed = credits.imageCreditsUsed;

  if (newBonusCredits > 0) {
    newBonusCredits -= 1;
  } else {
    newUsed += 1;
  }

  console.log('[Credits] Updating: used', credits.imageCreditsUsed, '->', newUsed, 'bonus', credits.bonusImageCredits, '->', newBonusCredits);

  const { data, error } = await supabase
    .from('user_credits')
    .update({
      image_credits_used: newUsed,
      bonus_image_credits: newBonusCredits,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Credits] Deduction DB error:', error.code, error.message);
    throw new Error('Failed to deduct credit');
  }

  console.log('[Credits] Deduction success! DB row:', data?.image_credits_used);

  return {
    imageCreditsUsed: newUsed,
    imageCreditsLimit: credits.imageCreditsLimit,
    bonusImageCredits: newBonusCredits,
    imageCreditsRemaining: credits.imageCreditsLimit - newUsed + newBonusCredits,
  };
}

/**
 * Skida 1 video kredit nakon uspešnog pokretanja generisanja videa.
 */
export async function deductVideoCredit(userId: string): Promise<void> {
  const all = await getAllCredits(userId);
  if (all.video.remaining <= 0) throw new Error('Nemate dovoljno kredita za video.');

  let newBonus = all.video.bonus;
  let newUsed = all.video.used;
  if (newBonus > 0) newBonus -= 1;
  else newUsed += 1;

  const { error } = await supabase
    .from('user_credits')
    .update({
      video_credits_used: newUsed,
      bonus_video_credits: newBonus,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw new Error('Greška pri skidanju kredita.');
}

/**
 * Skida 1 kredit za analizu nakon uspešnog odgovora Dajane (chat).
 */
export async function deductAnalysisCredit(userId: string): Promise<void> {
  const all = await getAllCredits(userId);
  if (all.analysis.remaining <= 0) throw new Error('Nemate dovoljno kredita za analizu.');

  let newBonus = all.analysis.bonus;
  let newUsed = all.analysis.used;
  if (newBonus > 0) newBonus -= 1;
  else newUsed += 1;

  const { data, error } = await supabase
    .from('user_credits')
    .update({
      analysis_credits_used: newUsed,
      bonus_analysis_credits: newBonus,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Credits] deductAnalysisCredit error:', error.code, error.message);
    throw new Error('Greška pri skidanju kredita.');
  }
  if (!data) {
    console.error('[Credits] deductAnalysisCredit: nijedan red ažuriran (user_id=', userId, ')');
    throw new Error('Greška pri skidanju kredita.');
  }
}
