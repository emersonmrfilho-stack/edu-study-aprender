import { createFileRoute, Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import { ChevronRight, Crown, Dumbbell, Flame, Play, Swords, Trophy, Zap } from "lucide-react";
import { Onboarding } from "@/components/Onboarding";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { PageSkeleton } from "@/components/Feedback";
import { SUBJECTS, getGrade, subjectsForGrade, totalLessons, unitsFor } from "@/lib/curriculum";
import { nextLessonId, subjectProgress } from "@/lib/progress";
import { levelInfo } from "@/lib/level";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Edu Study — curso escolar completo com o macaco Edu" },
      {
        name: "description",
        content:
          "Aprenda todas as matérias da escola, do 1º ano ao 3º ano do Ensino Médio, em lições curtas e divertidas com o macaco Edu.",
      },
      { property: "og:title", content: "Edu Study — curso escolar completo" },
      {
        property: "og:description",
        content: "Trilha de lições diárias de todas as matérias, do Fundamental ao Ensino Médio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { state, ready, setSubject } = useStore();
  const navigate = useNavigate();

  if (!ready) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <PageSkeleton />
      </div>
    );
  }
  if (!state.profile?.onboarded) return <Onboarding />;

  const grade = getGrade(state.profile.gradeId);
  const subjects = subjectsForGrade(grade.id);
  const subjectId = subjects.some((s) => s.id === state.currentSubject)
    ? state.currentSubject
    : subjects[0]!.id;
  const subject = SUBJECTS[subjectId]!;
  const lvl = levelInfo(state.xp);
  const progress = subjectProgress(state, grade.id, subjectId);
  const nextId = nextLessonId(state, grade.id, subjectId);
  const units = unitsFor(grade.id, subjectId);
  const currentUnit =
    units.find((u) => u.lessons.some((l) => l.id === nextId)) ?? units[0];

  function continueStudying() {
    if (nextId) navigate({ to: "/licao/$lessonId", params: { lessonId: nextId } });
    else navigate({ to: "/trilha" });
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar />

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-4">
        {/* Herói: Edu + nível */}
        <section className="gradient-hero relative overflow-hidden rounded-[28px] p-5 text-primary-foreground shadow-elevated animate-rise">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10"
          />
          <div className="relative flex items-center gap-3">
            <Mascot size={84} priority className="animate-float shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-widest opacity-85">
                Olá, {state.profile.name.split(" ")[0]}!
              </p>
              <h1 className="truncate text-xl font-black leading-tight">
                Nível {lvl.level} · {lvl.title}
              </h1>
              <p className="text-xs font-bold opacity-85">{grade.label}</p>
            </div>
          </div>

          <div className="relative mt-4">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wide opacity-90">
              <span>{state.xp} XP</span>
              <span>faltam {lvl.xpToNext} XP</span>
            </div>
            <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-white/90 transition-all duration-700"
                style={{ width: `${Math.max(4, lvl.percent)}%` }}
              />
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniStat icon={<Flame className="h-4 w-4" />} value={state.streak} label="Ofensiva" />
            <MiniStat
              icon={<Zap className="h-4 w-4" />}
              value={Object.keys(state.completed).length}
              label="Lições"
            />
            <MiniStat icon={<Trophy className="h-4 w-4" />} value={state.achievements.length} label="Conquistas" />
          </div>
        </section>

        {/* Continuar estudando */}
        <section className="animate-rise">
          <SectionTitle title="Continuar estudando" />
          <button
            onClick={continueStudying}
            className="press lift card-soft mt-3 flex w-full items-center gap-3 p-4 text-left"
          >
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-soft"
              style={{ backgroundColor: `var(--${subject.color})` }}
              aria-hidden
            >
              {subject.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-black">{subject.name}</span>
              <span className="block truncate text-xs font-bold text-muted-foreground">
                {currentUnit ? `Unidade ${currentUnit.index + 1} · ${currentUnit.title}` : grade.label}
              </span>
              <span className="mt-2 flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progress.percent}%`,
                      backgroundColor: `var(--${subject.color})`,
                    }}
                  />
                </span>
                <span className="text-[11px] font-black text-muted-foreground">
                  {progress.percent}%
                </span>
              </span>
            </span>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
              <Play className="h-5 w-5 fill-current" strokeWidth={3} />
            </span>
          </button>
        </section>

        {/* Ações rápidas */}
        <section className="animate-rise">
          <SectionTitle title="Atividades" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ActionCard
              to="/praticar"
              icon={<Dumbbell className="h-5 w-5" strokeWidth={3} />}
              title="Praticar"
              subtitle="Treino rápido"
              tone="bg-primary/12 text-primary"
            />
            <ActionCard
              to="/amigos"
              icon={<Swords className="h-5 w-5" strokeWidth={3} />}
              title="Batalhar"
              subtitle="Desafie amigos"
              tone="bg-heart/12 text-heart"
            />
            <ActionCard
              to="/ranking"
              icon={<Trophy className="h-5 w-5" strokeWidth={3} />}
              title="Ranking"
              subtitle="Veja sua posição"
              tone="bg-streak/12 text-streak"
            />
            <ActionCard
              to="/premium"
              icon={<Crown className="h-5 w-5" strokeWidth={3} />}
              title={state.premium ? "Premium" : "Ser Premium"}
              subtitle={state.premium ? "Ativo" : "Corações ∞"}
              tone="bg-gem/12 text-gem"
            />
          </div>
        </section>

        {/* Matérias */}
        <section className="animate-rise">
          <div className="flex items-center justify-between">
            <SectionTitle title="Suas matérias" />
            <Link
              to="/materias"
              className="press flex items-center gap-0.5 text-xs font-black uppercase tracking-wide text-primary"
            >
              Ver tudo <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
            {subjects.map((s) => {
              const p = subjectProgress(state, grade.id, s.id);
              return (
                <li key={s.id} className="w-[150px] shrink-0 snap-start">
                  <button
                    onClick={() => {
                      setSubject(s.id);
                      navigate({ to: "/trilha" });
                    }}
                    className="press lift card-soft flex h-full w-full flex-col items-start gap-2 p-3.5 text-left"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: `color-mix(in oklab, var(--${s.color}) 18%, transparent)` }}
                      aria-hidden
                    >
                      {s.emoji}
                    </span>
                    <span className="line-clamp-2 text-sm font-black leading-tight">{s.name}</span>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {p.done}/{totalLessons(grade.id, s.id)} lições
                    </span>
                    <span className="mt-auto h-2 w-full overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full transition-all duration-700"
                        style={{ width: `${p.percent}%`, backgroundColor: `var(--${s.color})` }}
                      />
                    </span>
                  </button>
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

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-[15px] font-black tracking-tight">{title}</h2>;
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-black/15 px-2 py-2">
      <div className="flex items-center justify-center gap-1 text-sm font-black">
        {icon}
        {value}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-85">{label}</p>
    </div>
  );
}

function ActionCard({
  to,
  icon,
  title,
  subtitle,
  tone,
}: {
  to: NonNullable<LinkProps["to"]>;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: string;
}) {
  return (
    <Link
      to={to}
      className="press lift card-soft flex flex-col gap-2 p-4"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <span className="text-sm font-black leading-tight">{title}</span>
      <span className="text-[11px] font-bold text-muted-foreground">{subtitle}</span>
    </Link>
  );
}
