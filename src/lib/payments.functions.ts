import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

const PICPAY_LINK = "https://link.picpay.com/p/17875940486a8c854012968";
const PREMIUM_AMOUNT = 24.9;

export const getPicPayLink = createServerFn({ method: "GET" }).handler(async () => {
  return { link: PICPAY_LINK, amount: PREMIUM_AMOUNT };
});

export const createPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        provider: z.enum(["picpay"]).default("picpay"),
        externalId: z.string().nullable().default(null),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const insert: TablesInsert<"premium_purchases"> = {
      user_id: context.userId,
      provider: data.provider,
      external_id: data.externalId ?? null,
      amount: PREMIUM_AMOUNT,
      status: "pending",
    };
    const { data: row, error } = await context.supabase
      .from("premium_purchases")
      .insert(insert)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as Tables<"premium_purchases">;
  });

export const getLatestPurchase = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("premium_purchases")
      .select()
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Tables<"premium_purchases"> | null) ?? null;
  });

export const approvePurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        purchaseId: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: adminErr } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (adminErr || !isAdmin) {
      throw new Error("Apenas administradores podem aprovar pagamentos.");
    }
    const update: TablesUpdate<"premium_purchases"> = {
      status: data.status,
      approved_at: data.status === "approved" ? new Date().toISOString() : null,
      approved_by: context.userId,
    };
    const { data: row, error } = await context.supabase
      .from("premium_purchases")
      .update(update)
      .eq("id", data.purchaseId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as Tables<"premium_purchases">;
  });

export const listPendingPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: adminErr } = await context.supabase.rpc("is_admin", {
      _user_id: context.userId,
    });
    if (adminErr || !isAdmin) {
      throw new Error("Apenas administradores podem listar pagamentos pendentes.");
    }
    const { data, error } = await context.supabase
      .from("premium_purchases")
      .select()
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Tables<"premium_purchases">[]) ?? [];
  });
