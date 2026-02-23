// ===========================================
// DAJANA AI - API Service with Error Handling
// ===========================================

import { supabase } from './supabase';
import { t } from './i18n';
import { Database, BodyType, Season } from '@/types/database';

type Outfit = Database['public']['Tables']['outfits']['Row'];
type SavedOutfit = Database['public']['Tables']['saved_outfits']['Row'];

// ===========================================
// Error Types
// ===========================================

export class ApiError extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

// ===========================================
// Get Translated Error Message
// ===========================================

function getErrorMessage(code: string): string {
  switch (code) {
    case ERROR_CODES.NETWORK_ERROR:
      return t('errors.network');
    case ERROR_CODES.TIMEOUT:
      return t('errors.timeout');
    case ERROR_CODES.NOT_FOUND:
      return t('errors.not_found');
    case ERROR_CODES.UNAUTHORIZED:
      return t('errors.unauthorized');
    case ERROR_CODES.SERVER_ERROR:
      return t('errors.server');
    default:
      return t('errors.unknown');
  }
}

// ===========================================
// Retry Logic
// ===========================================

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoff?: boolean;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on auth errors or not found
      if (error instanceof ApiError) {
        if (error.code === ERROR_CODES.UNAUTHORIZED || 
            error.code === ERROR_CODES.NOT_FOUND) {
          throw error;
        }
      }
      
      // If we've exhausted retries, throw
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries}`);
    }
  }
  
  throw lastError;
}

// ===========================================
// Error Handler
// ===========================================

function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error);
  
  let errorCode = ERROR_CODES.UNKNOWN;
  let statusCode: number | undefined;
  
  if (!error) {
    throw new ApiError(getErrorMessage(ERROR_CODES.UNKNOWN), ERROR_CODES.UNKNOWN);
  }
  
  // Network error
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    errorCode = ERROR_CODES.NETWORK_ERROR;
  }
  // Auth error
  else if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
    errorCode = ERROR_CODES.UNAUTHORIZED;
    statusCode = 401;
  }
  // Not found
  else if (error.code === 'PGRST116') {
    errorCode = ERROR_CODES.NOT_FOUND;
    statusCode = 404;
  }
  // Server error
  else if (error.code?.startsWith('5') || error.status >= 500) {
    errorCode = ERROR_CODES.SERVER_ERROR;
    statusCode = 500;
  }
  
  throw new ApiError(getErrorMessage(errorCode), errorCode, statusCode);
}

// ===========================================
// Outfit API
// ===========================================

export interface OutfitFilters {
  bodyType?: BodyType;
  season?: Season;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface OutfitWithSaved extends Outfit {
  is_saved?: boolean;
}

/**
 * Fetch outfits with optional filters
 */
export async function fetchOutfits(
  filters: OutfitFilters = {},
  userId?: string
): Promise<OutfitWithSaved[]> {
  return withRetry(async () => {
    let query = supabase
      .from('outfits')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Apply filters
    if (filters.bodyType) {
      query = query.contains('body_types', [filters.bodyType]);
    }
    
    if (filters.season) {
      query = query.contains('seasons', [filters.season]);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data, error } = await query;
    
    if (error) handleSupabaseError(error);
    
    // If user is logged in, check which outfits are saved
    if (userId && data) {
      const { data: savedData } = await supabase
        .from('saved_outfits')
        .select('outfit_id')
        .eq('user_id', userId);
      
      const savedIds = new Set(savedData?.map(s => s.outfit_id) || []);
      
      return data.map(outfit => ({
        ...outfit,
        is_saved: savedIds.has(outfit.id),
      }));
    }
    
    return data || [];
  });
}

/**
 * Fetch a single outfit by ID
 */
export async function fetchOutfitById(
  outfitId: string,
  userId?: string
): Promise<OutfitWithSaved | null> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('id', outfitId)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      handleSupabaseError(error);
    }
    
    // Check if saved
    if (userId && data) {
      const { data: savedData } = await supabase
        .from('saved_outfits')
        .select('id')
        .eq('user_id', userId)
        .eq('outfit_id', outfitId)
        .single();
      
      return { ...data, is_saved: !!savedData };
    }
    
    return data;
  });
}

// ===========================================
// Saved Outfits API
// ===========================================

/**
 * Get user's saved outfits
 */
export async function fetchSavedOutfits(userId: string): Promise<Outfit[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('saved_outfits')
      .select(`
        outfit_id,
        outfits (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) handleSupabaseError(error);
    
    // Extract outfit data from join
    return (data || [])
      .map((item: any) => item.outfits)
      .filter(Boolean);
  });
}

/**
 * Save an outfit to favorites
 */
export async function saveOutfit(
  userId: string,
  outfitId: string
): Promise<void> {
  return withRetry(async () => {
    const { error } = await supabase
      .from('saved_outfits')
      .insert({
        user_id: userId,
        outfit_id: outfitId,
      });
    
    // Ignore duplicate error (already saved)
    if (error && error.code !== '23505') {
      handleSupabaseError(error);
    }
  }, { maxRetries: 2 });
}

/**
 * Remove an outfit from favorites
 */
export async function unsaveOutfit(
  userId: string,
  outfitId: string
): Promise<void> {
  return withRetry(async () => {
    const { error } = await supabase
      .from('saved_outfits')
      .delete()
      .eq('user_id', userId)
      .eq('outfit_id', outfitId);
    
    if (error) handleSupabaseError(error);
  }, { maxRetries: 2 });
}

/**
 * Toggle save/unsave outfit
 */
export async function toggleSaveOutfit(
  userId: string,
  outfitId: string,
  currentlySaved: boolean
): Promise<boolean> {
  if (currentlySaved) {
    await unsaveOutfit(userId, outfitId);
    return false;
  } else {
    await saveOutfit(userId, outfitId);
    return true;
  }
}

// ===========================================
// Helper to check if saved
// ===========================================

export async function isOutfitSaved(
  userId: string,
  outfitId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('saved_outfits')
    .select('id')
    .eq('user_id', userId)
    .eq('outfit_id', outfitId)
    .single();
  
  return !!data;
}
