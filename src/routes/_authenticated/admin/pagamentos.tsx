import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2, Crown, ArrowLeft } from "lucide-react";
import { listPendingPurchases, approvePurchase } from "@/lib/payments.functions";
import { useServerFn } from "@tanstack/react-start";
import { Mascot } from "@/components/Mascot";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/pagamentos")({
  head: () => ({
    meta: [
      { title: "Admin — aprovar pagamentos | Edu Study" },
      { name: "description", content: "Aprovação manual de pagamentos Premium do Edu Study." },
    ],
  }),
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const fetchPending = useServerFn(listPendingPurchases);
  const approve = useServerFn(approvePurchase);

  const { data: purchases = [], isLoading, error } = useQuery({
    queryKey: ["pending-purchases"],
    queryFn: fetchPending,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      return approve({ data: { purchaseId: id, status } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pending-purchases"] }),
  });

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Mascot size={64} />
          <div>
            <h1 className="text-xl font-black">Pagamentos pendentes</h1>
            <p className="text-sm font-bold text-muted-foreground">Aprove ou rejeite compras Premium.</p>
          </div>
        </div>

        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-sm font-extrabold uppercase text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border-2 border-wrong-foreground/40 bg-wrong px-4 py-4 text-sm font-bold text-wrong-foreground">
            {error instanceof Error ? error.message : "Erro ao carregar pagamentos."}
          </div>
        )}

        {!isLoading && purchases.length === 0 && (
          <div className="rounded-2xl border-2 border-border bg-card p-6 text-center">
            <Crown className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 font-black text-muted-foreground">Nenhum pagamento pendente.</p>
          </div>
        )}

        <div className="grid gap-3">
          {purchases.map((p: Tables<"premium_purchases">) => (
            <div
              key={p.id}
              className="rounded-2xl border-2 border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                    {p.provider} · {new Date(p.created_at).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 font-black">R$ {p.amount.toFixed(2).replace(".", ",")}</p>
                  <p className="text-xs font-bold text-muted-foreground">ID: {p.id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: p.id, status: "approved" })}
                    className="btn-3d inline-flex items-center gap-1 rounded-xl border-2 border-correct-foreground/60 bg-correct px-3 py-2 text-sm font-black text-correct-foreground"
                  >
                    <Check className="h-4 w-4" /> Aprovar
                  </button>
                  <button
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: p.id, status: "rejected" })}
                    className="inline-flex items-center gap-1 rounded-xl border-2 border-wrong-foreground/60 bg-wrong px-3 py-2 text-sm font-black text-wrong-foreground"
                  >
                    <X className="h-4 w-4" /> Rejeitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
