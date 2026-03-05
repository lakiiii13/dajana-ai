// ===========================================
// DAJANA AI - Subscription status
// ===========================================

import { supabase } from '@/lib/supabase';
import type { SubscriptionStatus, PlanType } from '@/types/database';

export interface SubscriptionInfo {
  active: boolean;
  status: SubscriptionStatus;
  planType: PlanType | null;
  currentPeriodEnd: string | null;
}

/**
 * Fetch current subscription for user.
 * active === true only when status === 'active'.
 * Kad pretplata istekne: korisnica vidi sačuvane slike/videe/savete, ali ne može generisati novo.
 */
export async function getSubscription(userId: string): Promise<SubscriptionInfo> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan_type, current_period_end')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[Subscription] fetch error:', error);
    return { active: false, status: 'expired', planType: null, currentPeriodEnd: null };
  }

  if (!data) {
    return { active: false, status: 'expired', planType: null, currentPeriodEnd: null };
  }

  const active = data.status === 'active';
  return {
    active,
    status: data.status as SubscriptionStatus,
    planType: data.plan_type as PlanType,
    currentPeriodEnd: data.current_period_end,
  };
}
