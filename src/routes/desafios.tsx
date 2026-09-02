import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Flame, Gem, Gift, Target } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot, SpeechBubble } from "@/components/Mascot";
import { activeChallenges, PERIOD_LABEL, progressFor } from "@/lib/challenges";
import { useStore } from "@/lib/store";
import { useSfx } from "@/hooks/useSfx";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/desafios")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Desafios diários, semanais e mensais — Edu Study" },
      {
        name: "description",
        content:
          "Cumpra desafios diários, semanais e mensais no Edu Study, ganhe gemas e recupere sua ofensiva perdida.",
      },
      { property: "og:title", content: "Desafios do Edu Study" },
      {
        property: "og:description",
        content: "Metas de estudo todo dia, toda semana e todo mês — com recompensas em gemas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Desafios,
});

function Desafios() {
  const { state, ready, claimChallenge } = useStore();
  const { play } = useSfx();
  const challenges = useMemo(() => activeChallenges(), []);

  if (!ready) return <div className="min-h-screen bg-background" />;

  const groups = (["daily", "weekly", "monthly"] as const).map((period) => ({
    period,
    items: challenges.filter((c) => c.period === period),
  }));

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar title="Desafios" />
      <main className="mx-auto max-w-2xl px-4 py-4">
        {state.lostStreak ? (
          <section className="animate-rise rounded-[28px] border-2 border-streak/40 bg-streak/10 p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <Mascot size={72} />
              <SpeechBubble>
                Você perdeu sua ofensiva de <strong>{state.lostStreak.value} dias</strong>! Faça o desafio de
                resgate e recupere tudo — se errar 60% ou mais, a ofensiva vai embora.
              </SpeechBubble>
            </div>
            <Link
              to="/recuperar-ofensiva"
              className="press mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-streak px-4 py-3.5 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-soft"
            >
              <Flame className="h-5 w-5" strokeWidth={3} /> Recuperar ofensiva
            </Link>
          </section>
        ) : (
          <section className="gradient-hero animate-rise rounded-[28px] p-5 text-primary-foreground shadow-elevated">
            <p className="text-[11px] font-black uppercase tracking-widest opacity-85">Ofensiva atual</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-black leading-none">{state.streak}</span>
              <span className="pb-0.5 text-sm font-black opacity-85">dias seguidos</span>
            </div>
            <p className="mt-1 text-xs font-bold opacity-85">
              Estude todo dia para manter a chama acesa e completar seus desafios.
            </p>
          </section>
        )}

        {groups.map(({ period, items }) => (
          <section key={period} className="mt-6">
            <h2 className="flex items-center gap-1.5 text-[15px] font-black tracking-tight">
              <Target className="h-4 w-4 text-primary" strokeWidth={3} /> {PERIOD_LABEL[period]}
            </h2>
            <ul className="mt-3 grid gap-2">
              {items.map((c) => {
                const value = progressFor(c, state.activity);
                const done = value >= c.goal;
                const claimed = state.claimedChallenges.includes(c.id);
                const percent = Math.min(100, Math.round((value / c.goal) * 100));
                return (
                  <li key={c.id} className="card-soft animate-rise p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{c.title}</p>
                        <p className="mt-0.5 text-xs font-bold text-muted-foreground">{c.description}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-sm font-black text-gem">
                        <Gem className="h-4 w-4" strokeWidth={3} />
                        {c.reward}
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <span
                        className={cn(
                          "block h-full rounded-full transition-all",
                          done ? "bg-correct-foreground" : "bg-primary",
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                        {Math.min(value, c.goal)} / {c.goal}
                      </span>
                      <button
                        disabled={!done || claimed}
                        onClick={() => {
                          if (claimChallenge(c.id, c.reward)) play("reward");
                        }}
                        className={cn(
                          "press flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-wide",
                          claimed
                            ? "bg-muted text-muted-foreground"
                            : done
                              ? "bg-primary text-primary-foreground shadow-soft"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Gift className="h-4 w-4" strokeWidth={3} />
                        {claimed ? "Resgatado" : done ? "Resgatar" : "Em progresso"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
