// ===========================================
// DAJANA AI - Edge Function: Delete account
// Korisnik šalje JWT; brišemo SVE podatke (public tabele + Auth)
// ===========================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-jwt",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userJwt = req.headers.get("X-User-JWT");
    if (!userJwt?.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing X-User-JWT header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${userJwt}` } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token or user not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Redosled: prvo tabele koje referenciraju user_id, na kraju profiles (transactions nema CASCADE pa mora eksplicitno)
    const tablesToDelete: { table: string; column: string }[] = [
      { table: "push_tokens", column: "user_id" },
      { table: "user_notifications", column: "user_id" },
      { table: "advice_chats", column: "user_id" },
      { table: "outfit_compositions", column: "user_id" },
      { table: "generations", column: "user_id" },
      { table: "transactions", column: "user_id" },
      { table: "user_credits", column: "user_id" },
      { table: "subscriptions", column: "user_id" },
      { table: "saved_outfits", column: "user_id" },
      { table: "profiles", column: "id" },
    ];

    for (const { table, column } of tablesToDelete) {
      try {
        const { error } = await supabaseAdmin.from(table).delete().eq(column, userId);
        if (error) console.warn("[delete-account] Table", table, error.message);
      } catch (e) {
        console.warn("[delete-account] Table", table, e);
      }
    }

    // 2. Na kraju obriši korisnika iz Auth (auth.users)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("[delete-account] Admin delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const message = e?.message ?? String(e);
    console.error("[delete-account] Error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
