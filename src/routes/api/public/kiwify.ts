import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

const customerSchema = z
  .object({
    email: z.string().email().max(320).optional(),
  })
  .passthrough();

const kiwifyPayloadSchema = z
  .object({
    webhook_event_type: z.string().max(100).optional(),
    order_status: z.string().max(100).optional(),
    order_id: z.string().min(1).max(200).optional(),
    Customer: customerSchema.optional(),
    customer: customerSchema.optional(),
  })
  .passthrough();

const approvedEvents = new Set(["compra_aprovada", "subscription_renewed"]);
const revokedEvents = new Set([
  "compra_reembolsada",
  "chargeback",
  "subscription_canceled",
  "subscription_late",
]);
const approvedStatuses = new Set(["paid", "approved"]);
const revokedStatuses = new Set(["refunded", "canceled", "cancelled", "chargeback"]);

function secureEqual(received: string, expected: string): boolean {
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

function receivedToken(request: Request): string {
  const urlToken = new URL(request.url).searchParams.get("token");
  const headerToken = request.headers.get("x-kiwify-token");
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  return urlToken ?? headerToken ?? bearerToken ?? "";
}

async function findUserIdByEmail(
  admin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  email: string,
): Promise<string | null> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}

export const Route = createFileRoute("/api/public/kiwify")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => Response.json({ ok: true, service: "kiwify-webhook" }),
      POST: async ({ request }) => {
        const secret = process.env["KIWIFY_WEBHOOK_TOKEN"];
        if (!secret) {
          console.error("[kiwify webhook] KIWIFY_WEBHOOK_TOKEN is not configured");
          return new Response("Webhook not configured", { status: 503 });
        }

        if (!secureEqual(receivedToken(request), secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let rawPayload: unknown;
        try {
          rawPayload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const parsed = kiwifyPayloadSchema.safeParse(rawPayload);
        if (!parsed.success) {
          return new Response("Invalid payload", { status: 400 });
        }

        const payload = parsed.data;
        const event = payload.webhook_event_type?.toLowerCase() ?? "";
        const orderStatus = payload.order_status?.toLowerCase() ?? "";
        const status =
          approvedEvents.has(event) || approvedStatuses.has(orderStatus)
            ? "approved"
            : revokedEvents.has(event) || revokedStatuses.has(orderStatus)
              ? "rejected"
              : null;

        if (!status) return Response.json({ ok: true, ignored: true });

        const email = (payload.Customer?.email ?? payload.customer?.email)?.toLowerCase();
        const orderId = payload.order_id;
        if (!email || !orderId) {
          return new Response("Customer email and order_id are required", { status: 400 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const userId = await findUserIdByEmail(supabaseAdmin, email);
          if (!userId) {
            console.warn("[kiwify webhook] no Edu Study account matches the purchase email");
            return Response.json({ ok: true, unmatched: true });
          }

          const now = new Date().toISOString();
          const { data: existing, error: lookupError } = await supabaseAdmin
            .from("premium_purchases")
            .select("id")
            .eq("provider", "kiwify")
            .eq("external_id", orderId)
            .maybeSingle();
          if (lookupError) throw lookupError;

          const purchase = {
            user_id: userId,
            provider: "kiwify",
            external_id: orderId,
            amount: 24.9,
            status,
            approved_at: status === "approved" ? now : null,
            approved_by: null,
          } as const;

          const write = existing
            ? await supabaseAdmin.from("premium_purchases").update(purchase).eq("id", existing.id)
            : await supabaseAdmin.from("premium_purchases").insert(purchase);
          if (write.error) throw write.error;

          return Response.json({ ok: true });
        } catch (error) {
          console.error("[kiwify webhook] processing failed", error);
          return new Response("Internal Server Error", { status: 500 });
        }
      },
    },
  },
});