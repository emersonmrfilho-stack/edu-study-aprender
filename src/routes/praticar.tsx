import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dumbbell, Zap } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot, SpeechBubble } from "@/components/Mascot";
import { SUBJECTS, getGrade, subjectsForGrade } from "@/lib/curriculum";
import { nextLessonId } from "@/lib/progress";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/praticar")({
  head: () => ({
    meta: [
      { title: "Praticar — Edu Study" },
      {
        name: "description",
        content: "Treine com revisões rápidas das matérias do seu ano e ganhe XP extra no Edu Study.",
      },
      { property: "og:title", content: "Praticar — Edu Study" },
      { property: "og:description", content: "Revisões rápidas para fixar o conteúdo do seu ano escolar." },
    ],
  }),
  component: Praticar,
});

function Praticar() {
  const { state, ready, setSubject } = useStore();
  const navigate = useNavigate();

  if (!ready || !state.profile) return <div className="min-h-screen bg-background" />;
  const grade = getGrade(state.profile.gradeId);
  const subjects = subjectsForGrade(grade.id);

  function practice(subjectId: string) {
    setSubject(subjectId);
    const id = nextLessonId(state, grade.id, subjectId);
    if (id) navigate({ to: "/licao/$lessonId", params: { lessonId: id } });
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-start gap-3">
          <Mascot size={88} />
          <SpeechBubble>Bora treinar? Escolha uma matéria e eu preparo os exercícios!</SpeechBubble>
        </div>

        <h1 className="mt-6 text-2xl font-black">Praticar</h1>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {subjects.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => practice(s.id)}
                className="press lift card-soft flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{ backgroundColor: `var(--${s.color})` }}
                  aria-hidden
                >
                  {s.emoji}
                </span>
                <div className="flex-1">
                  <p className="font-black">{s.name}</p>
                  <p className="text-xs font-bold text-muted-foreground">Treino rápido · +15 XP</p>
                </div>
                <Zap className="h-5 w-5 text-streak" strokeWidth={3} />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-3xl border border-border bg-muted p-5">
          <div className="flex items-center gap-2 font-black">
            <Dumbbell className="h-5 w-5 text-primary" strokeWidth={3} /> Dica do Edu
          </div>
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            Estudar 10 minutos por dia mantém sua ofensiva viva e fixa o conteúdo muito melhor do que
            estudar tudo de uma vez.
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
