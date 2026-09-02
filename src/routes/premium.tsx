import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Crown, Heart, Infinity as InfinityIcon, Sparkles, Zap, Loader2, ExternalLink, Upload, Clock, FileCheck2 } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { PREMIUM_PRICE_LABEL, useStore } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { getPicPayLink, createPurchase, getLatestPurchase, attachReceipt } from "@/lib/payments.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";


export const Route = createFileRoute("/premium")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Premium — corações ilimitados | Edu Study" },
      {
        name: "description",
        content:
          "Assine o Edu Study Premium por R$ 24,90 e estude sem limite de corações: erre, aprenda e continue sem esperar.",
      },
      { property: "og:title", content: "Edu Study Premium — corações ilimitados" },
      {
        property: "og:description",
        content: "Por R$ 24,90 você remove o limite de corações e estuda quando quiser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Premium,
});

const BENEFITS = [
  { Icon: InfinityIcon, title: "Corações ilimitados", text: "Erre quantas vezes precisar e continue estudando." },
  { Icon: Zap, title: "Sem espera", text: "Nunca mais aguarde 20 minutos para voltar às lições." },
  { Icon: Sparkles, title: "Provas liberadas", text: "Faça provas e revisões sem medo de perder vidas." },
  { Icon: Heart, title: "Foco no aprendizado", text: "Sem interrupções: o erro passa a ser só aprendizado." },
];

function Premium() {
  const { state, ready, cancelPremium, syncPremium } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [polling, setPolling] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchLink = useServerFn(getPicPayLink);
  const create = useServerFn(createPurchase);
  const fetchLatest = useServerFn(getLatestPurchase);
  const attach = useServerFn(attachReceipt);

  const { data: picpay } = useQuery({
    queryKey: ["picpay-link"],
    queryFn: fetchLink,
  });

  const { data: latestPurchase, refetch: refetchLatest } = useQuery({
    queryKey: ["latest-purchase"],
    queryFn: fetchLatest,
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return create({ data: { provider: "picpay" } });
    },
    onSuccess: () => {
      void refetchLatest();
    },
  });

  const isPremium = state.premium;
  const pending = latestPurchase?.status === "pending";
  const rejected = latestPurchase?.status === "rejected";

  async function handleUpload(file: File) {
    if (!user || !latestPurchase) return;
    setUploadError(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${latestPurchase.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("comprovantes").upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw new Error(error.message);
      await attach({ data: { purchaseId: latestPurchase.id, receiptPath: path } });
      await refetchLatest();
      setPolling(true);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Não foi possível enviar o comprovante.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!polling && !pending) return;
    const id = setInterval(() => {
      void refetchLatest().then(({ data: purchase }) => {
        if (purchase?.status === "approved") {
          clearInterval(id);
          setPolling(false);
          void syncPremium();
          navigate({ to: "/" });
        }
      });
    }, 8000);
    return () => clearInterval(id);
  }, [polling, pending, refetchLatest, syncPremium, navigate]);

  if (!ready) return <div className="min-h-screen bg-background" />;


  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-4">
          <Mascot size={96} />
          <div>
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-gem/50 bg-gem/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-gem">
              <Crown className="h-4 w-4" strokeWidth={3} /> Premium
            </span>
            <h1 className="mt-2 text-2xl font-black leading-tight">
              {isPremium ? "Você é Premium!" : "Estude sem limite de corações"}
            </h1>
            <p className="text-sm font-bold text-muted-foreground">
              {isPremium
                ? "Seus corações são ilimitados. Bons estudos!"
                : `Apenas ${PREMIUM_PRICE_LABEL} por mês`}
            </p>
          </div>
        </div>

        <ul className="mt-6 grid gap-3">
          {BENEFITS.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-2xl border-2 border-border bg-card p-4">
              <Icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" strokeWidth={3} />
              <div>
                <p className="font-black">{title}</p>
                <p className="text-sm font-bold text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        {!isPremium && !pending && (
          <div className="mt-6 rounded-3xl border-2 border-primary/60 bg-primary/10 p-5 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-primary">Plano Premium</p>
            <p className="mt-1 text-4xl font-black text-primary">{PREMIUM_PRICE_LABEL}</p>
            <p className="text-sm font-bold text-muted-foreground">pagamento único via PicPay</p>
            <button
              disabled={createMutation.isPending || !user}
              onClick={async () => {
                await createMutation.mutateAsync();
                window.open(picpay?.link || "https://link.picpay.com/p/17876661506a8d9ee6bbcca", "_blank");
                setPolling(true);
              }}
              className="btn-3d mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/60 bg-primary px-4 py-4 text-base font-black uppercase tracking-wide text-primary-foreground disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Pagar pelo PicPay <ExternalLink className="h-5 w-5" />
                </>
              )}
            </button>
            {!user && (
              <p className="mt-2 text-xs font-bold text-muted-foreground">
                Faça login para ativar o Premium.
              </p>
            )}
            <p className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-border bg-card p-3 text-left text-xs font-bold text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} />
              Após pagar, anexe o comprovante aqui. A liberação é feita por{" "}
              <strong className="font-black">aprovação manual da nossa equipe</strong>, então pode
              demorar um pouco (normalmente até 24h).
            </p>
            {rejected && (
              <p className="mt-2 text-xs font-black text-wrong-foreground">
                Seu último comprovante foi recusado. Envie um novo pagamento e comprovante válidos.
              </p>
            )}
          </div>
        )}

        {!isPremium && pending && (
          <div className="mt-6 rounded-3xl border-2 border-gem/50 bg-gem/10 p-5 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gem" />
            <p className="mt-3 font-black text-gem">
              {latestPurchase?.receipt_path ? "Comprovante em análise..." : "Aguardando comprovante"}
            </p>
            <p className="text-sm font-bold text-muted-foreground">
              {latestPurchase?.receipt_path
                ? "Recebemos seu comprovante! A aprovação é manual, feita por uma pessoa da nossa equipe, e pode demorar um pouco (normalmente até 24h). Assim que aprovado, o Premium libera automaticamente."
                : "Já pagou? Anexe o comprovante abaixo para que possamos conferir. A aprovação é manual e pode demorar um pouco."}
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = "";
              }}
            />
            <button
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="btn-3d mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/60 bg-primary px-4 py-4 text-sm font-black uppercase tracking-wide text-primary-foreground disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : latestPurchase?.receipt_path ? (
                <>
                  <FileCheck2 className="h-5 w-5" /> Enviar outro comprovante
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" /> Anexar comprovante
                </>
              )}
            </button>
            <p className="mt-2 text-xs font-bold text-muted-foreground">
              Aceitamos imagem (print do PicPay) ou PDF, até 10 MB.
            </p>
            {uploadError && (
              <p className="mt-2 text-xs font-black text-wrong-foreground">{uploadError}</p>
            )}

            <a
              href={picpay?.link || "https://link.picpay.com/p/17876661506a8d9ee6bbcca"}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-primary"
            >
              Abrir PicPay novamente <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}


        {isPremium && (
          <div className="mt-6 grid gap-3">
            <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-correct-foreground/40 bg-correct px-4 py-4 font-black uppercase tracking-wide text-correct-foreground">
              <Check className="h-5 w-5" strokeWidth={3} /> Premium ativo
            </div>
            <button
              onClick={() => {
                if (confirm("Deseja cancelar o Premium? Os limites de corações voltam.")) cancelPremium();
              }}
              className="rounded-2xl border-2 border-border px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-muted-foreground"
            >
              Cancelar Premium
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
