import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Star, Lock, Trophy, FileCheck } from "lucide-react";
import { Onboarding } from "@/components/Onboarding";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { SUBJECTS, getGrade, subjectsForGrade, unitsFor } from "@/lib/curriculum";
import { examStatus, lessonStatus } from "@/lib/progress";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

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
    ],
  }),
  component: Home,
});

function Home() {
  const { state, ready, setSubject } = useStore();

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!state.profile?.onboarded) return <Onboarding />;

  const grade = getGrade(state.profile.gradeId);
  const subjects = subjectsForGrade(grade.id);
  const subjectId = subjects.some((s) => s.id === state.currentSubject)
    ? state.currentSubject
    : subjects[0]!.id;
  const subject = SUBJECTS[subjectId]!;
  const units = unitsFor(grade.id, subjectId);

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />

      <div className="no-scrollbar sticky top-[57px] z-20 overflow-x-auto border-b-2 border-border bg-background">
        <div className="mx-auto flex max-w-2xl gap-2 px-4 py-3">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubject(s.id)}
              className={cn(
                "btn-3d flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-border bg-card px-3 py-2 text-sm font-extrabold",
                s.id === subjectId && "border-primary bg-primary/10 text-primary",
              )}
            >
              <span aria-hidden>{s.emoji}</span>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4">
        <h1 className="sr-only">
          {subject.name} — {grade.label}
        </h1>
        {units.map((unit) => (
          <section key={unit.index} className="pb-4">
            <div
              className="mt-6 rounded-2xl border-2 px-4 py-4 text-primary-foreground"
              style={{
                backgroundColor: `var(--${subject.color})`,
                borderColor: `var(--${subject.color})`,
              }}
            >
              <p className="text-xs font-black uppercase tracking-widest opacity-90">
                Unidade {unit.index + 1} · {grade.short}
              </p>
              <p className="text-xl font-black">{unit.title}</p>
            </div>

            <div className="flex flex-col items-center gap-4 py-6">
              {unit.lessons.map((lesson, i) => {
                const status = lessonStatus(state, grade.id, subjectId, unit.index, i);
                const offset = [0, 44, 66, 44, 0, -44, -66, -44][i % 8];
                return (
                  <div key={lesson.id} className="flex w-full justify-center" style={{ transform: `translateX(${offset}px)` }}>
                    <LessonNode
                      lessonId={lesson.id}
                      status={status}
                      color={subject.color}
                      last={false}
                    />
                  </div>
                );
              })}
              <div className="flex w-full justify-center" style={{ transform: `translateX(${[0, 44, 66, 44, 0, -44, -66, -44][unit.lessons.length % 8]}px)` }}>
                <ExamNode
                  subjectId={subjectId}
                  unitIndex={unit.index}
                  color={subject.color}
                  status={examStatus(state, grade.id, subjectId, unit.index)}
                />
              </div>
            </div>
          </section>
        ))}

        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Mascot size={120} />
          <p className="text-sm font-bold text-muted-foreground">
            Fim do curso de {subject.name} do {grade.short}. Escolha outra matéria e continue subindo!
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function LessonNode({
  lessonId,
  status,
  color,
  last,
}: {
  lessonId: string;
  status: "done" | "current" | "locked" | "skipped";
  color: string;
  last: boolean;
}) {
  const navigate = useNavigate();
  const locked = status === "locked";
  const Icon = last ? Trophy : status === "done" ? Check : status === "skipped" ? Star : locked ? Lock : Star;

  return (
    <div className="relative flex flex-col items-center">
      {status === "current" && (
        <span className="mb-2 animate-bounce rounded-xl border-2 border-border bg-card px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary">
          Começar
        </span>
      )}
      <button
        aria-label={locked ? "Lição bloqueada" : "Abrir lição"}
        disabled={locked}
        onClick={() => navigate({ to: "/licao/$lessonId", params: { lessonId } })}
        className={cn(
          "btn-3d flex h-[68px] w-[68px] items-center justify-center rounded-full border-2",
          locked ? "border-border bg-locked text-muted-foreground" : "text-primary-foreground",
        )}
        style={
          locked
            ? undefined
            : {
                backgroundColor: status === "done" || status === "skipped" ? `var(--${color})` : `var(--${color})`,
                borderColor: `var(--${color})`,
                filter: status === "skipped" ? "saturate(0.5)" : undefined,
              }
        }
      >
        <Icon className="h-8 w-8" strokeWidth={3} />
      </button>
    </div>
  );
}

function ExamNode({
  subjectId,
  unitIndex,
  color,
  status,
}: {
  subjectId: string;
  unitIndex: number;
  color: string;
  status: "locked" | "available" | "passed";
}) {
  const navigate = useNavigate();
  const locked = status === "locked";
  const Icon = status === "passed" ? Trophy : status === "available" ? FileCheck : Lock;

  return (
    <div className="relative flex flex-col items-center">
      {status === "available" && (
        <span className="mb-2 animate-bounce rounded-xl border-2 border-border bg-card px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary">
          Prova
        </span>
      )}
      <button
        aria-label={locked ? "Prova bloqueada" : "Fazer prova da unidade"}
        disabled={locked}
        onClick={() => navigate({ to: "/prova/$subjectId/$unitIndex", params: { subjectId, unitIndex: String(unitIndex) } })}
        className={cn(
          "btn-3d flex h-[68px] w-[68px] items-center justify-center rounded-full border-2",
          locked ? "border-border bg-locked text-muted-foreground" : "text-primary-foreground",
        )}
        style={
          locked
            ? undefined
            : {
                backgroundColor: `var(--${color})`,
                borderColor: `var(--${color})`,
                filter: status === "passed" ? "saturate(0.5)" : undefined,
              }
        }
      >
        <Icon className="h-8 w-8" strokeWidth={3} />
      </button>
    </div>
  );
}
