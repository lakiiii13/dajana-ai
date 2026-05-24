// ===========================================
// DAJANA AI - Edge Function: RevenueCat Webhook
// Ažurira subscriptions, user_credits i transactions
// ===========================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CREDIT_LIMITS = {
  images: 50,
  videos: 2,
  analyses: 2,
};

const PRODUCT_IDS = {
  monthly: "dajana_monthly",
  yearly: "dajana_yearly",
  topup: "dajana_topup_5",
} as const;

type RcEvent = {
  type?: string;
  app_user_id?: string;
  product_id?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  price_in_purchased_currency?: number;
  currency?: string;
  expiration_at_ms?: number;
};

function periodDaysForProduct(productId: string): number {
  return productId === PRODUCT_IDS.yearly ? 365 : 31;
}

function planTypeForProduct(productId: string): "monthly" | "yearly" | null {
  if (productId === PRODUCT_IDS.monthly) return "monthly";
  if (productId === PRODUCT_IDS.yearly) return "yearly";
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function transactionExists(supabaseAdmin: any, storeTxId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("stripe_payment_intent_id", storeTxId)
    .maybeSingle();
  return !!data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordTransaction(
  supabaseAdmin: any,
  userId: string,
  type: "subscription_payment" | "credit_purchase",
  amountCents: number,
  storeTxId: string,
  currency = "eur"
) {
  await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type,
    stripe_payment_intent_id: storeTxId,
    amount_cents: amountCents,
    currency,
    status: "succeeded",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applySubscriptionPurchase(
  supabaseAdmin: any,
  userId: string,
  planType: "monthly" | "yearly",
  periodEndIso?: string | null
) {
  const now = new Date();
  const periodEnd = periodEndIso
    ? new Date(periodEndIso)
    : new Date(
        now.getTime() +
          periodDaysForProduct(planType === "yearly" ? PRODUCT_IDS.yearly : PRODUCT_IDS.monthly) * 86400000
      );

  await supabaseAdmin.from("user_credits").upsert(
    {
      user_id: userId,
      image_credits_used: 0,
      image_credits_limit: CREDIT_LIMITS.images,
      video_credits_used: 0,
      video_credits_limit: CREDIT_LIMITS.videos,
      analysis_credits_used: 0,
      analysis_credits_limit: CREDIT_LIMITS.analyses,
      bonus_image_credits: 0,
      bonus_video_credits: 0,
      bonus_analysis_credits: 0,
      last_reset_date: now.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );

  const { data: existingSubscription } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscriptionPayload = {
    status: "active",
    plan_type: planType,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    canceled_at: null,
  };

  if (existingSubscription?.id) {
    await supabaseAdmin.from("subscriptions").update(subscriptionPayload).eq("id", existingSubscription.id);
  } else {
    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      ...subscriptionPayload,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function expireSubscription(supabaseAdmin: any, userId: string) {
  const { data: existingSubscription } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSubscription?.id) {
    await supabaseAdmin.from("subscriptions").update({ status: "expired" }).eq("id", existingSubscription.id);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePurchaseEvent(supabaseAdmin: any, event: RcEvent) {
  const userId = event.app_user_id?.trim();
  const productId = event.product_id?.trim();
  const storeTxId = (event.transaction_id || event.original_transaction_id || "").trim();

  if (!userId || !productId || !storeTxId) {
    console.warn("[revenuecat-webhook] Missing userId/productId/transactionId", event);
    return;
  }

  if (await transactionExists(supabaseAdmin, storeTxId)) {
    console.log("[revenuecat-webhook] Duplicate transaction skipped:", storeTxId);
    return;
  }

  const amountCents = Math.round((event.price_in_purchased_currency ?? 0) * 100);
  const currency = (event.currency ?? "eur").toLowerCase();
  const periodEndIso = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

  if (productId === PRODUCT_IDS.topup) {
    await recordTransaction(supabaseAdmin, userId, "credit_purchase", amountCents || 500, storeTxId, currency);
    await supabaseAdmin.rpc("add_bonus_credits", { p_user_id: userId });
    return;
  }

  const planType = planTypeForProduct(productId);
  if (planType) {
    await recordTransaction(supabaseAdmin, userId, "subscription_payment", amountCents, storeTxId, currency);
    await applySubscriptionPurchase(supabaseAdmin, userId, planType, periodEndIso);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    if (webhookSecret) {
      const auth = req.headers.get("Authorization") ?? "";
      if (auth !== `Bearer ${webhookSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const event: RcEvent = body?.event ?? body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const eventType = event.type ?? "";
    const userId = event.app_user_id?.trim();

    switch (eventType) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "NON_RENEWING_PURCHASE":
      case "PRODUCT_CHANGE":
        await handlePurchaseEvent(supabaseAdmin, event);
        break;
      case "CANCELLATION":
        console.log("[revenuecat-webhook] Cancellation noted for", userId);
        break;
      case "EXPIRATION":
        if (userId) await expireSubscription(supabaseAdmin, userId);
        break;
      default:
        console.log("[revenuecat-webhook] Ignored event type:", eventType);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[revenuecat-webhook] Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
