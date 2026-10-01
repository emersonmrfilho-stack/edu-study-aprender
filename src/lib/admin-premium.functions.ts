import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Tables, TablesInsert } from "@/integrations/supabase/types";

const PREMIUM_AMOUNT = 24.9;

type Purchase = Tables<"premium_purchases">;
type Profile = Pick<Tables<"profiles">, "user_id" | "display_name" | "username">;

export type AdminPurchase = Purchase & {
  profile: Profile | null;
};

async function assertAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error || !data) throw new Error("Acesso permitido apenas para administradores.");
}

export const listAdminPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: purchases, error: purchasesError }, { data: profiles, error: profilesError }] = await Promise.all([
      supabaseAdmin.from("premium_purchases").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("profiles").select("user_id, display_name, username").order("display_name").limit(1000),
    ]);
    if (purchasesError) throw new Error(purchasesError.message);
    if (profilesError) throw new Error(profilesError.message);
    const profilesById = new Map((profiles ?? []).map((profile) => [profile.user_id, profile as Profile]));
    return (purchases ?? []).map((purchase) => ({
      ...(purchase as Purchase),
      profile: profilesById.get(purchase.user_id) ?? null,
    })) satisfies AdminPurchase[];
  });

export const listPremiumTestUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, username")
      .order("display_name")
      .limit(1000);
    if (error) throw new Error(error.message);
    return (data ?? []) as Profile[];
  });

export const approvePremiumPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ purchaseId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: purchase, error } = await supabaseAdmin
      .from("premium_purchases")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: context.userId,
        release_source: "manual",
      })
      .eq("id", data.purchaseId)
      .eq("status", "pending")
      .is("test_mode", null)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!purchase) throw new Error("Esta compra não está pendente ou já foi processada.");
    return purchase as Purchase;
  });

export const createPremiumTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid(), mode: z.enum(["simulation", "real"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isReal = data.mode === "real";
    const insert: TablesInsert<"premium_purchases"> = {
      user_id: data.userId,
      provider: "admin_test",
      external_id: `test_${crypto.randomUUID()}`,
      amount: 0,
      status: isReal ? "approved" : "pending",
      approved_at: isReal ? new Date().toISOString() : null,
      approved_by: isReal ? context.userId : null,
      release_source: "test",
      test_mode: data.mode,
    };
    const { data: purchase, error } = await supabaseAdmin
      .from("premium_purchases")
      .insert(insert)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return purchase as Purchase;
  });