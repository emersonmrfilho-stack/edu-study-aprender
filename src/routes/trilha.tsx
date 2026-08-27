import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Star, Lock, Trophy, FileCheck } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { PageSkeleton } from "@/components/Feedback";
import { SUBJECTS, getGrade, subjectsForGrade, unitsFor } from "@/lib/curriculum";
import { examStatus, lessonStatus } from "@/lib/progress";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trilha")({
  head: () => ({
    meta: [
      { title: "Trilha de lições — Edu Study" },
      {
        name: "description",
        content:
          "Siga a trilha de lições da sua matéria, do primeiro exercício até a prova da unidade, com o macaco Edu.",
      },
      { property: "og:title", content: "Trilha de lições — Edu Study" },
      {
        property: "og:description",
        content: "Lições curtas em sequência e provas de unidade para dominar cada matéria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Trilha,
});

function Trilha() {
  const { state, ready, setSubject } = useStore();

  if (!ready || !state.profile?.onboarded) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <PageSkeleton />
      </div>
    );
  }

  const grade = getGrade(state.profile.gradeId);
  const subjects = subjectsForGrade(grade.id);
  const subjectId = subjects.some((s) => s.id === state.currentSubject)
    ? state.currentSubject
    : subjects[0]!.id;
  const subject = SUBJECTS[subjectId]!;
  const units = unitsFor(grade.id, subjectId);

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar />

      <div className="no-scrollbar sticky top-[49px] z-20 overflow-x-auto border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2 px-4 py-2.5">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubject(s.id)}
              className={cn(
                "press flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-[13px] font-extrabold",
                s.id === subjectId && "border-transparent bg-primary text-primary-foreground shadow-soft",
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
          <section key={unit.index} className="pb-2">
            <div
              className="mt-5 overflow-hidden rounded-3xl px-5 py-4 text-primary-foreground shadow-soft animate-rise"
              style={{ backgroundColor: `var(--${subject.color})` }}
            >
              <p className="text-[11px] font-black uppercase tracking-widest opacity-85">
                Unidade {unit.index + 1} · {grade.short}
              </p>
              <p className="text-lg font-black leading-tight">{unit.title}</p>
            </div>

            <div className="flex flex-col items-center gap-4 overflow-x-clip py-6">
              {unit.lessons.map((lesson, i) => {
                const status = lessonStatus(state, grade.id, subjectId, unit.index, i);
                const offset = [0, 40, 58, 40, 0, -40, -58, -40][i % 8];
                return (
                  <div
                    key={lesson.id}
                    className="flex w-full justify-center"
                    style={{ transform: `translateX(${offset}px)` }}
                  >
                    <LessonNode lessonId={lesson.id} status={status} color={subject.color} />
                  </div>
                );
              })}
              <div
                className="flex w-full justify-center"
                style={{
                  transform: `translateX(${[0, 40, 58, 40, 0, -40, -58, -40][unit.lessons.length % 8]}px)`,
                }}
              >
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
          <Mascot size={110} className="animate-float" />
          <p className="max-w-xs text-sm font-bold text-muted-foreground">
            Fim do curso de {subject.name} do {grade.short}. Escolha outra matéria e continue
            subindo!
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
}: {
  lessonId: string;
  status: "done" | "current" | "locked" | "skipped";
  color: string;
}) {
  const navigate = useNavigate();
  const locked = status === "locked";
  const Icon = status === "done" ? Check : status === "skipped" ? Star : locked ? Lock : Star;

  return (
    <div className="relative flex flex-col items-center">
      {status === "current" && (
        <span className="mb-2 animate-bounce rounded-full bg-card px-3 py-1 text-[10px] font-black uppercase tracking-wide text-primary shadow-soft">
          Começar
        </span>
      )}
      <button
        aria-label={locked ? "Lição bloqueada" : "Abrir lição"}
        disabled={locked}
        onClick={() => navigate({ to: "/licao/$lessonId", params: { lessonId } })}
        className={cn(
          "btn-3d press flex h-[64px] w-[64px] items-center justify-center rounded-full border-2",
          locked ? "border-border bg-locked text-muted-foreground" : "text-primary-foreground shadow-soft",
          status === "current" && "ring-4 ring-primary/25",
        )}
        style={
          locked
            ? undefined
            : {
                backgroundColor: `var(--${color})`,
                borderColor: `var(--${color})`,
                filter: status === "skipped" ? "saturate(0.5)" : undefined,
              }
        }
      >
        <Icon className="h-7 w-7" strokeWidth={3} />
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
        <span className="mb-2 animate-bounce rounded-full bg-card px-3 py-1 text-[10px] font-black uppercase tracking-wide text-primary shadow-soft">
          Prova
        </span>
      )}
      <button
        aria-label={locked ? "Prova bloqueada" : "Fazer prova da unidade"}
        disabled={locked}
        onClick={() =>
          navigate({
            to: "/prova/$subjectId/$unitIndex",
            params: { subjectId, unitIndex: String(unitIndex) },
          })
        }
        className={cn(
          "btn-3d press flex h-[64px] w-[64px] items-center justify-center rounded-full border-2",
          locked ? "border-border bg-locked text-muted-foreground" : "text-primary-foreground shadow-soft",
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
        <Icon className="h-7 w-7" strokeWidth={3} />
      </button>
    </div>
  );
}
