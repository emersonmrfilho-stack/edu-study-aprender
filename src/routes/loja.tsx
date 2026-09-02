import { createFileRoute } from "@tanstack/react-router";
import { Check, Gem, Lock, Sparkles } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { AVATARS } from "@/lib/avatars";
import { useStore } from "@/lib/store";
import { playReward, playWrong } from "@/lib/sound";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/loja")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Loja de gemas — Edu Study" },
      {
        name: "description",
        content:
          "Use suas gemas para desbloquear fotos de perfil exclusivas do Edu e personalizar seu perfil de estudante.",
      },
      { property: "og:title", content: "Loja de gemas — Edu Study" },
      {
        property: "og:description",
        content: "Desbloqueie fotos de perfil exclusivas do Edu com as gemas conquistadas estudando.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Loja,
});

function Loja() {
  const { state, ready, buyAvatar, selectAvatar } = useStore();

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <header className="card-soft flex items-center gap-4 p-4 animate-rise">
          <Mascot size={84} avatarId={state.avatarId} className="animate-float" />
          <div className="min-w-0">
            <h1 className="text-xl font-black">Loja do Edu</h1>
            <p className="text-sm font-bold text-muted-foreground">
              Troque suas gemas por fotos de perfil exclusivas.
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-black text-gem">
              <Gem className="h-4 w-4" strokeWidth={3} /> {state.gems} gemas
            </p>
          </div>
        </header>

        <h2 className="mt-6 flex items-center gap-2 text-lg font-black">
          <Sparkles className="h-5 w-5 text-primary" strokeWidth={3} /> Fotos de perfil
        </h2>

        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {AVATARS.map((a) => {
            const owned = state.ownedAvatars.includes(a.id);
            const selected = state.avatarId === a.id;
            const canBuy = state.gems >= a.price;
            return (
              <li
                key={a.id}
                className={cn(
                  "card-soft flex flex-col items-center p-3 text-center transition",
                  selected && "border-primary ring-2 ring-primary/40",
                )}
              >
                <div
                  className={cn(
                    "flex h-24 w-24 items-center justify-center rounded-2xl bg-muted",
                    !owned && "opacity-60",
                  )}
                >
                  <img
                    src={a.src}
                    alt={a.name}
                    width={96}
                    height={96}
                    loading="lazy"
                    className="h-20 w-20 object-contain"
                  />
                </div>
                <p className="mt-2 text-sm font-black leading-tight">{a.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] font-bold text-muted-foreground">
                  {a.description}
                </p>

                {owned ? (
                  <button
                    onClick={() => selectAvatar(a.id)}
                    disabled={selected}
                    className={cn(
                      "press mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2 text-[11px] font-black uppercase tracking-wide",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground",
                    )}
                  >
                    {selected ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={3} /> Em uso
                      </>
                    ) : (
                      "Usar"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const ok = buyAvatar(a.id, a.price);
                      if (ok) playReward(state.soundEnabled);
                      else playWrong(state.soundEnabled);
                    }}
                    disabled={!canBuy}
                    className={cn(
                      "btn-3d mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-2 text-[11px] font-black uppercase tracking-wide",
                      canBuy
                        ? "border-gem/60 bg-gem text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {canBuy ? (
                      <Gem className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      <Lock className="h-3.5 w-3.5" strokeWidth={3} />
                    )}
                    {a.price}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-6 rounded-2xl border border-border bg-muted p-4 text-sm font-bold text-muted-foreground">
          Ganhe gemas concluindo lições, provas e desafios diários.
        </p>
      </main>
      <BottomNav />
    </div>
  );
}
