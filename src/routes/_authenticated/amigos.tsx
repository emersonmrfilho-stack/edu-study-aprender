import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Search, Swords, UserPlus, Users, X } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { useStore } from "@/lib/store";
import { SUBJECTS, subjectsForGrade } from "@/lib/curriculum";
import {
  createBattle,
  getMyProfile,
  listBattles,
  listFriends,
  requestFriend,
  respondFriend,
  saveMyProfile,
  searchProfiles,
} from "@/lib/social.functions";

export const Route = createFileRoute("/_authenticated/amigos")({
  head: () => ({
    meta: [
      { title: "Amigos e batalhas — Edu Study" },
      {
        name: "description",
        content:
          "Adicione amigos pelo apelido e desafie eles em batalhas de perguntas rápidas no Edu Study.",
      },
      { property: "og:title", content: "Amigos e batalhas — Edu Study" },
      { property: "og:description", content: "Desafie seus amigos em batalhas de perguntas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AmigosPage,
});

function AmigosPage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(saveMyProfile);
  const search = useServerFn(searchProfiles);
  const fetchFriends = useServerFn(listFriends);
  const addFriend = useServerFn(requestFriend);
  const respond = useServerFn(respondFriend);
  const startBattle = useServerFn(createBattle);
  const fetchBattles = useServerFn(listBattles);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: fetchProfile,
  });
  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: fetchFriends,
    enabled: !!profile,
  });
  const { data: battles = [] } = useQuery({
    queryKey: ["battles"],
    queryFn: fetchBattles,
    enabled: !!profile,
    refetchInterval: 15000,
  });

  const [username, setUsername] = useState("");
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof search>>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile && state.profile?.name) {
      setUsername(
        state.profile.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9._]/g, "")
          .slice(0, 20),
      );
    }
  }, [profile, state.profile?.name]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveProfile({
        data: {
          username,
          displayName: state.profile?.name || username,
          gradeId: state.profile?.gradeId ?? null,
          xp: state.xp,
        },
      }),
    onSuccess: () => {
      setError(null);
      void qc.invalidateQueries({ queryKey: ["my-profile"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Não foi possível salvar."),
  });

  const searchMutation = useMutation({
    mutationFn: () => search({ data: { q: term } }),
    onSuccess: (rows) => setResults(rows),
    onError: (e) => setError(e instanceof Error ? e.message : "Erro na busca."),
  });

  const addMutation = useMutation({
    mutationFn: (userId: string) => addFriend({ data: { userId } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["friends"] }),
  });

  const respondMutation = useMutation({
    mutationFn: (v: { friendshipId: string; accept: boolean }) => respond({ data: v }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["friends"] }),
  });

  const battleMutation = useMutation({
    mutationFn: (opponentId: string) => {
      const gradeId = state.profile?.gradeId ?? "f5a";
      const available = subjectsForGrade(gradeId);
      const subjectId =
        available.find((s) => s.id === state.currentSubject)?.id ??
        available[0]?.id ??
        "matematica";
      return startBattle({ data: { opponentId, subjectId, gradeId } });
    },
    onSuccess: (b) => {
      void qc.invalidateQueries({ queryKey: ["battles"] });
      navigate({ to: "/batalha/$battleId", params: { battleId: b.id } });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Não foi possível criar a batalha."),
  });

  const accepted = friends.filter((f) => f.status === "accepted");
  const incoming = friends.filter((f) => f.incoming);
  const outgoing = friends.filter((f) => f.outgoing);

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3">
          <Mascot size={72} />
          <div>
            <h1 className="text-2xl font-black">Amigos</h1>
            <p className="text-sm font-bold text-muted-foreground">
              Ache colegas pelo nome de usuário e desafie em batalhas.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border-2 border-wrong-foreground/40 bg-wrong px-4 py-3 text-sm font-bold text-wrong-foreground">
            {error}
          </p>
        )}

        {!profile ? (
          <section className="mt-6 rounded-2xl border-2 border-accent/50 bg-accent/10 p-4">
            <h2 className="font-black text-accent">Escolha seu nome de usuário</h2>
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              Ele é único: ninguém mais pode usar o mesmo. Use letras, números, ponto ou _.
            </p>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="ex: edna.matematica"
              maxLength={20}
              className="mt-3 w-full rounded-xl border-2 border-border bg-card px-4 py-3 font-extrabold outline-none focus:border-accent"
            />
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || username.length < 3}
              className="btn-3d mt-3 w-full rounded-xl border-2 border-primary/60 bg-primary px-4 py-3 text-sm font-black uppercase tracking-wide text-primary-foreground disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
            >
              {saveMutation.isPending ? "Salvando..." : "Criar meu perfil"}
            </button>
          </section>
        ) : (
          <>
            <p className="mt-4 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
              Você é @{profile.username}
            </p>

            <section className="mt-4">
              <div className="flex gap-2">
                <input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && term.trim().length >= 2) searchMutation.mutate();
                  }}
                  placeholder="Buscar amigo por nome"
                  className="flex-1 rounded-xl border-2 border-border bg-card px-4 py-3 font-extrabold outline-none focus:border-accent"
                />
                <button
                  onClick={() => searchMutation.mutate()}
                  disabled={term.trim().length < 2 || searchMutation.isPending}
                  className="btn-3d rounded-xl border-2 border-accent/60 bg-accent px-4 py-3 text-accent-foreground disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                  aria-label="Buscar"
                >
                  {searchMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" strokeWidth={3} />
                  )}
                </button>
              </div>

              {results.length > 0 && (
                <ul className="mt-3 grid gap-2">
                  {results.map((p) => (
                    <li
                      key={p.user_id}
                      className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-black">{p.display_name}</p>
                        <p className="truncate text-xs font-bold text-muted-foreground">
                          @{p.username} · {p.xp} XP
                        </p>
                      </div>
                      <button
                        onClick={() => addMutation.mutate(p.user_id)}
                        disabled={addMutation.isPending}
                        className="btn-3d inline-flex items-center gap-1 rounded-xl border-2 border-primary/60 bg-primary px-3 py-2 text-xs font-black uppercase text-primary-foreground"
                      >
                        <UserPlus className="h-4 w-4" /> Adicionar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {searchMutation.isSuccess && results.length === 0 && (
                <p className="mt-3 text-sm font-bold text-muted-foreground">
                  Ninguém encontrado com esse nome.
                </p>
              )}
            </section>

            {incoming.length > 0 && (
              <section className="mt-6">
                <h2 className="text-lg font-black">Pedidos recebidos</h2>
                <ul className="mt-2 grid gap-2">
                  {incoming.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card p-3"
                    >
                      <p className="truncate font-black">
                        {f.profile?.display_name ?? "Aluno"}{" "}
                        <span className="text-xs font-bold text-muted-foreground">
                          @{f.profile?.username}
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            respondMutation.mutate({ friendshipId: f.id, accept: true })
                          }
                          className="btn-3d rounded-xl border-2 border-correct-foreground/60 bg-correct p-2 text-correct-foreground"
                          aria-label="Aceitar"
                        >
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </button>
                        <button
                          onClick={() =>
                            respondMutation.mutate({ friendshipId: f.id, accept: false })
                          }
                          className="rounded-xl border-2 border-wrong-foreground/60 bg-wrong p-2 text-wrong-foreground"
                          aria-label="Recusar"
                        >
                          <X className="h-4 w-4" strokeWidth={3} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-6">
              <h2 className="text-lg font-black">Meus amigos</h2>
              {accepted.length === 0 ? (
                <p className="mt-2 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <Users className="h-4 w-4" /> Você ainda não tem amigos por aqui.
                </p>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {accepted.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-black">{f.profile?.display_name ?? "Aluno"}</p>
                        <p className="truncate text-xs font-bold text-muted-foreground">
                          @{f.profile?.username} · {f.profile?.xp ?? 0} XP
                        </p>
                      </div>
                      <button
                        onClick={() => f.profile && battleMutation.mutate(f.profile.user_id)}
                        disabled={battleMutation.isPending}
                        className="btn-3d inline-flex items-center gap-1 rounded-xl border-2 border-gem/60 bg-gem px-3 py-2 text-xs font-black uppercase text-background"
                      >
                        <Swords className="h-4 w-4" /> Batalhar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {outgoing.length > 0 && (
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {outgoing.length} pedido(s) aguardando resposta
                </p>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-black">Batalhas</h2>
              {battles.length === 0 ? (
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  Nenhuma batalha ainda. Desafie um amigo!
                </p>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {battles.map((b) => {
                    const finished = b.battle.status === "finished";
                    const won = finished && b.battle.winner_id === b.opponent?.user_id === false;
                    return (
                      <li
                        key={b.battle.id}
                        className="rounded-2xl border-2 border-border bg-card p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-black">
                              vs {b.opponent?.display_name ?? "Aluno"}
                            </p>
                            <p className="text-xs font-bold text-muted-foreground">
                              {SUBJECTS[b.battle.subject_id]?.name ?? b.battle.subject_id} ·{" "}
                              {finished
                                ? b.battle.winner_id === null
                                  ? "Empate"
                                  : won
                                    ? "Você venceu!"
                                    : "Você perdeu"
                                : b.myTurnDone
                                  ? "Esperando o adversário"
                                  : "Sua vez de jogar"}
                            </p>
                            <p className="text-xs font-bold text-muted-foreground">
                              {b.myScore} × {b.theirScore}
                            </p>
                          </div>
                          {!b.myTurnDone && (
                            <button
                              onClick={() =>
                                navigate({
                                  to: "/batalha/$battleId",
                                  params: { battleId: b.battle.id },
                                })
                              }
                              className="btn-3d rounded-xl border-2 border-primary/60 bg-primary px-3 py-2 text-xs font-black uppercase text-primary-foreground"
                            >
                              Jogar
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
