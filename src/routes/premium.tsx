import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Crown, Heart, Infinity as InfinityIcon, Sparkles, Zap, Loader2, ExternalLink } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { PREMIUM_PRICE_LABEL, useStore } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { getPicPayLink, createPurchase, getLatestPurchase } from "@/lib/payments.functions";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/premium")({
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
  const { state, ready, activatePremium, cancelPremium } = useStore();
  const navigate = useNavigate();
  if (!ready) return <div className="min-h-screen bg-background" />;

  const isPremium = state.premium;

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

        {!isPremium && (
          <div className="mt-6 rounded-3xl border-2 border-primary/60 bg-primary/10 p-5 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-primary">Plano Premium</p>
            <p className="mt-1 text-4xl font-black text-primary">{PREMIUM_PRICE_LABEL}</p>
            <p className="text-sm font-bold text-muted-foreground">por mês · cancele quando quiser</p>
            <button
              onClick={() => {
                activatePremium();
                navigate({ to: "/" });
              }}
              className="btn-3d mt-4 w-full rounded-2xl border-2 border-primary/60 bg-primary px-4 py-4 text-base font-black uppercase tracking-wide text-primary-foreground"
            >
              Ativar Premium
            </button>
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
