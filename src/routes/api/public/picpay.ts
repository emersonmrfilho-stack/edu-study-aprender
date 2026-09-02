import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook genérico para confirmação de pagamento PicPay.
 *
 * Links de pagamento pessoais do PicPay não enviam webhooks automáticos.
 * Este endpoint pode ser usado manualmente (via POST) ou conectado a uma
 * conta PicPay Empresas / API quando disponível.
 *
 * Corpo esperado:
 *   { purchase_id: string, status: "approved" | "rejected", secret: string }
 *
 * A secret deve ser configurada no projeto (PICPAY_WEBHOOK_SECRET).
 */
export const Route = createFileRoute("/api/public/picpay")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PICPAY_WEBHOOK_SECRET"];
        const authHeader = request.headers.get("x-picpay-secret");

        if (!secret || authHeader !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const { purchase_id, status } = body as { purchase_id?: string; status?: string };
        if (!purchase_id || (status !== "approved" && status !== "rejected")) {
          return new Response("Bad Request: purchase_id and status required", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("premium_purchases")
          .update({
            status,
            approved_at: status === "approved" ? new Date().toISOString() : null,
          })
          .eq("id", purchase_id);

        if (error) {
          console.error("[picpay webhook] update error", error);
          return new Response("Internal Server Error", { status: 500 });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
