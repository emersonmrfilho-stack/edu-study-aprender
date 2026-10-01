import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

const PICPAY_LINK = "https://link.picpay.com/p/17876661506a8d9ee6bbcca";
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


