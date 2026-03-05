// ===========================================
// DAJANA AI Admin - Database Types
// ===========================================
// Ovo je kopija iz mobile app-a za type safety

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BodyType = 'pear' | 'apple' | 'hourglass' | 'rectangle' | 'inverted_triangle';

export type Season =
  | 'light_spring'
  | 'warm_spring'
  | 'clear_spring'
  | 'light_summer'
  | 'cool_summer'
  | 'soft_summer'
  | 'soft_autumn'
  | 'warm_autumn'
  | 'deep_autumn'
  | 'deep_winter'
  | 'cool_winter'
  | 'clear_winter';

export type CreditType = 'image' | 'video' | 'analysis';
export type GenerationType = 'image' | 'video' | 'analysis';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired';
export type PlanType = 'monthly' | 'yearly';
export type TransactionType = 'subscription_payment' | 'credit_purchase' | 'refund';
export type TransactionStatus = 'pending' | 'succeeded' | 'failed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          bust_cm: number | null;
          waist_cm: number | null;
          hips_cm: number | null;
          body_type: BodyType | null;
          has_dajana_analysis: boolean;
          season: Season | null;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      user_credits: {
        Row: {
          user_id: string;
          image_credits_used: number;
          image_credits_limit: number;
          video_credits_used: number;
          video_credits_limit: number;
          analysis_credits_used: number;
          analysis_credits_limit: number;
          bonus_image_credits: number;
          bonus_video_credits: number;
          bonus_analysis_credits: number;
          last_reset_date: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_credits']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['user_credits']['Row']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          status: SubscriptionStatus;
          plan_type: PlanType;
          current_period_start: string | null;
          current_period_end: string | null;
          canceled_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']> & {
          user_id: string;
          status: SubscriptionStatus;
          plan_type: PlanType;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>;
      };
      outfits: {
        Row: {
          id: string;
          image_url: string;
          title: string | null;
          description: string | null;
          body_types: BodyType[];
          seasons: Season[];
          tags: string[] | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['outfits']['Row']> & {
          image_url: string;
          body_types: BodyType[];
          seasons: Season[];
        };
        Update: Partial<Database['public']['Tables']['outfits']['Row']>;
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          type: GenerationType;
          outfit_id: string | null;
          input_image_url: string | null;
          output_url: string | null;
          ai_response: string | null;
          prompt: string | null;
          status: GenerationStatus;
          error_message: string | null;
          api_cost_cents: number;
          processing_time_ms: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['generations']['Row']> & {
          user_id: string;
          type: GenerationType;
        };
        Update: Partial<Database['public']['Tables']['generations']['Row']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string | null;
          type: TransactionType;
          stripe_payment_intent_id: string | null;
          amount_cents: number;
          currency: string;
          status: TransactionStatus;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['transactions']['Row']> & {
          type: TransactionType;
          amount_cents: number;
          status: TransactionStatus;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Row']>;
      };
      push_tokens: {
        Row: {
          user_id: string;
          token: string;
          platform: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          token: string;
          platform?: string | null;
        };
        Update: Partial<Database['public']['Tables']['push_tokens']['Row']>;
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string | null;
          role: string;
          is_active: boolean;
        };
        Insert: {
          email: string;
          password_hash: string;
          name?: string | null;
          role?: string;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['admin_users']['Row']>;
      };
      user_notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'video' | 'advice' | 'system' | 'outfit';
          title: string;
          body: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'video' | 'advice' | 'system' | 'outfit';
          title: string;
          body: string;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_notifications']['Row']>;
      };
    };
    Functions: {
      check_and_use_credit: {
        Args: { p_user_id: string; p_credit_type: CreditType };
        Returns: Json;
      };
      rollback_credit: {
        Args: { p_user_id: string; p_credit_type: CreditType; p_used_bonus: boolean };
        Returns: void;
      };
      add_bonus_credits: {
        Args: { p_user_id: string };
        Returns: void;
      };
    };
  };
}
