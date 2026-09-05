import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Cloud,
  CloudCheck,
  Crown,
  Flame,
  Gem,
  Heart,
  LogOut,
  Moon,
  ShoppingBag,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { AchievementIcon } from "@/components/AchievementIcon";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { getGrade } from "@/lib/curriculum";
import { useStore } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/perfil")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Meu perfil — Edu Study" },
      {
        name: "description",
        content: "Acompanhe seu XP, ofensiva de dias, corações e o ano escolar do seu curso no Edu Study.",
      },
      { property: "og:title", content: "Meu perfil — Edu Study" },
      { property: "og:description", content: "Seu progresso, ofensiva e conquistas no Edu Study." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { state, ready, refillHearts, reset, toggleSound, toggleTheme } = useStore();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  if (!ready || !state.profile) return <div className="min-h-screen bg-background" />;
  const grade = getGrade(state.profile.gradeId);
  const lessons = Object.keys(state.completed).length;
  const unlocked = new Set(state.achievements);

  const stats = [
    { Icon: Flame, label: "Dias de ofensiva", value: state.streak, color: "text-streak" },
    { Icon: Trophy, label: "XP total", value: state.xp, color: "text-primary" },
    { Icon: Gem, label: "Gemas", value: state.gems, color: "text-gem" },
    {
      Icon: Heart,
      label: "Corações",
      value: state.premium ? "∞" : state.hearts,
      color: "text-heart",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-4">
          <Mascot size={96} />
          <div>
            <h1 className="text-2xl font-black">{state.profile.name}</h1>
            <p className="text-sm font-bold text-muted-foreground">{grade.label}</p>
            <p className="text-sm font-bold text-muted-foreground">{lessons} lições concluídas</p>
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3">
          {stats.map(({ Icon, label, value, color }) => (
            <li key={label} className="card-soft p-4">
              <Icon className={`h-6 w-6 ${color}`} strokeWidth={3} />
              <p className="mt-2 text-2xl font-black">{value}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
            </li>
          ))}
        </ul>

        <Link
          to="/premium"
          className="press lift mt-6 flex items-center gap-3 rounded-3xl border-2 border-gem/40 bg-gem/10 p-4"
        >
          <Crown className="h-7 w-7 shrink-0 text-gem" strokeWidth={3} />
          <div>
            <p className="font-black text-gem">
              {state.premium ? "Premium ativo" : "Premium · R$ 24,90/mês"}
            </p>
            <p className="text-sm font-bold text-muted-foreground">
              {state.premium
                ? "Corações ilimitados liberados. Toque para gerenciar."
                : "Remova o limite de corações e estude sem parar."}
            </p>
          </div>
        </Link>

        {authLoading ? null : user ? (
          <div className="mt-4 card-soft p-4">
            <div className="flex items-center gap-3">
              <CloudCheck className="h-7 w-7 shrink-0 text-correct-foreground" strokeWidth={3} />
              <div className="min-w-0">
                <p className="font-black">Progresso salvo na nuvem</p>
                <p className="truncate text-sm font-bold text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-muted-foreground"
            >
              <LogOut className="h-4 w-4" /> Sair da conta
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-accent/50 bg-accent/10 p-4"
          >
            <Cloud className="h-7 w-7 shrink-0 text-accent" strokeWidth={3} />
            <div>
              <p className="font-black text-accent">Salve seu progresso na nuvem</p>
              <p className="text-sm font-bold text-muted-foreground">
                Entre ou crie uma conta grátis para não perder nada e trocar de aparelho quando
                quiser.
              </p>
            </div>
          </Link>
        )}

        <Link
          to="/loja"
          className="press lift mt-4 flex items-center gap-3 rounded-3xl border-2 border-accent/40 bg-accent/10 p-4"
        >
          <ShoppingBag className="h-7 w-7 shrink-0 text-accent" strokeWidth={3} />
          <div>
            <p className="font-black text-accent">Loja de gemas</p>
            <p className="text-sm font-bold text-muted-foreground">
              Troque suas gemas por novas fotos de perfil do Edu.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/atividades"
          className="press lift mt-3 flex items-center gap-3 rounded-3xl border-2 border-border bg-card p-4"
        >
          <Settings className="h-7 w-7 shrink-0 text-primary" strokeWidth={3} />
          <div>
            <p className="font-black">Painel de atividades</p>
            <p className="text-sm font-bold text-muted-foreground">
              Crie, edite e exclua as atividades das lições.
            </p>
          </div>
        </Link>


        <div className="mt-4 grid gap-3">
          <button
            onClick={() => refillHearts()}
            disabled={state.premium || state.hearts >= 5 || state.gems < 350}
            className="btn-3d rounded-2xl border-2 border-primary/60 bg-primary px-4 py-4 text-sm font-black uppercase tracking-wide text-primary-foreground disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
          >
            {state.premium ? "Corações ilimitados (Premium)" : "Recarregar corações · 350 gemas"}
          </button>
          <button
            onClick={toggleSound}
            className="btn-3d flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-4 text-sm font-black uppercase tracking-wide text-foreground"
          >
            {state.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            Som {state.soundEnabled ? "ligado" : "desligado"}
          </button>
          <button
            onClick={toggleTheme}
            className="btn-3d flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-4 text-sm font-black uppercase tracking-wide text-foreground"
          >
            {state.theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Tema {state.theme === "dark" ? "escuro" : "claro"}
          </button>
          <button
            onClick={() => {
              if (confirm("Isso apaga todo o seu progresso. Continuar?")) reset();
            }}
            className="rounded-2xl border-2 border-border px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-muted-foreground"
          >
            Reiniciar curso
          </button>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-black">Conquistas</h2>
          <p className="text-sm font-bold text-muted-foreground">
            {unlocked.size} de {ACHIEVEMENTS.length} desbloqueadas
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {ACHIEVEMENTS.map((a) => {
              const isUnlocked = unlocked.has(a.id);
              return (
                <li
                  key={a.id}
                  className={cn(
                    "rounded-2xl border-2 p-4",
                    isUnlocked ? "border-primary bg-primary/10" : "border-border bg-card opacity-70",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                        isUnlocked ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <AchievementIcon id={a.id} />
                    </span>
                    <div>
                      <p className={cn("font-black", isUnlocked ? "text-primary" : "text-muted-foreground")}>
                        {a.title}
                      </p>
                      <p className="text-sm font-bold text-muted-foreground">{a.description}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
