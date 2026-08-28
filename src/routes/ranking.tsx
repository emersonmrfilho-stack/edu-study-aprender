import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Medal, Trophy, Users } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/Feedback";
import { getLeaderboard } from "@/lib/social.functions";
import { levelInfo } from "@/lib/level";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking de estudantes — Edu Study" },
      {
        name: "description",
        content:
          "Veja o ranking de XP dos estudantes do Edu Study, acompanhe sua posição e dispute o topo com seus amigos.",
      },
      { property: "og:title", content: "Ranking de estudantes — Edu Study" },
      {
        property: "og:description",
        content: "Suba no ranking de XP estudando todo dia com o macaco Edu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ranking,
});

function Ranking() {
  const { state } = useStore();
  const { user, loading } = useAuth();
  const fetchBoard = useServerFn(getLeaderboard);
  const lvl = levelInfo(state.xp);

  const query = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchBoard({ data: undefined }),
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar title="Ranking" />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <section className="gradient-hero rounded-[28px] p-5 text-primary-foreground shadow-elevated animate-rise">
          <p className="text-[11px] font-black uppercase tracking-widest opacity-85">Sua pontuação</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-3xl font-black leading-none">{state.xp}</span>
            <span className="pb-0.5 text-sm font-black opacity-85">XP</span>
          </div>
          <p className="mt-1 text-xs font-bold opacity-85">
            Nível {lvl.level} · {lvl.title} · faltam {lvl.xpToNext} XP para subir
          </p>
        </section>

        <div className="mt-5 flex items-center justify-between">
          <h1 className="text-[15px] font-black tracking-tight">Melhores estudantes</h1>
          <Link
            to="/amigos"
            className="press flex items-center gap-1 rounded-full bg-primary/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-primary"
          >
            <Users className="h-4 w-4" strokeWidth={3} /> Amigos
          </Link>
        </div>

        <div className="mt-3">
          {loading || (user && query.isLoading) ? (
            <ListSkeleton rows={5} />
          ) : !user ? (
            <EmptyState
              title="Entre para disputar o ranking"
              description="Crie sua conta grátis para salvar seu XP na nuvem e aparecer no ranking com os outros estudantes."
              action={
                <Link
                  to="/auth"
                  className="press rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-soft"
                >
                  Entrar ou criar conta
                </Link>
              }
            />
          ) : query.isError ? (
            <ErrorState onRetry={() => query.refetch()} />
          ) : (query.data?.rows.length ?? 0) === 0 ? (
            <EmptyState
              title="O ranking está vazio"
              description="Seja o primeiro! Complete lições para ganhar XP e ocupar o topo da lista."
              icon={<Trophy className="h-8 w-8" strokeWidth={2.5} />}
            />
          ) : (
            <ul className="grid gap-2">
              {query.data!.rows.map((p, i) => {
                const isMe = p.user_id === query.data!.me;
                return (
                  <li
                    key={p.user_id}
                    className={cn(
                      "card-soft flex items-center gap-3 p-3 animate-rise",
                      isMe && "border-primary bg-primary/8",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black",
                        i === 0 && "bg-streak/20 text-streak",
                        i === 1 && "bg-muted text-muted-foreground",
                        i === 2 && "bg-accent/20 text-accent-foreground",
                        i > 2 && "bg-muted text-muted-foreground",
                      )}
                    >
                      {i === 0 ? (
                        <Crown className="h-5 w-5" strokeWidth={3} />
                      ) : i < 3 ? (
                        <Medal className="h-5 w-5" strokeWidth={3} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">
                        {p.display_name}
                        {isMe && <span className="ml-1 text-primary">(você)</span>}
                      </p>
                      <p className="truncate text-[11px] font-bold text-muted-foreground">
                        @{p.username} · nível {levelInfo(p.xp).level}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-black text-primary">
                      <Trophy className="h-4 w-4" strokeWidth={3} />
                      {p.xp}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
