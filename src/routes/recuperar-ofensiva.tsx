import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, X } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { Mascot, SpeechBubble } from "@/components/Mascot";
import { ExerciseBody, canCheckExercise, evaluateExercise } from "@/components/ExerciseBody";
import { correctAnswerText, examExercises } from "@/lib/questions";
import { RESCUE_QUESTIONS, rescueSucceeded } from "@/lib/challenges";
import { useStore } from "@/lib/store";
import { useSfx } from "@/hooks/useSfx";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recuperar-ofensiva")({
  head: () => ({
    meta: [
      { title: "Desafio de recuperação de ofensiva — Edu Study" },
      {
        name: "description",
        content:
          "Perdeu a ofensiva? Acerte o desafio de resgate do Edu Study e recupere seus dias seguidos de estudo.",
      },
      { property: "og:title", content: "Recupere sua ofensiva — Edu Study" },
      {
        property: "og:description",
        content: "Um desafio rápido de 5 questões para salvar sua sequência de estudos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Rescue,
});

function Rescue() {
  const { state, ready, restoreStreak, dropLostStreak } = useStore();
  const navigate = useNavigate();
  const { play } = useSfx();

  const exercises = useMemo(
    () =>
      examExercises(state.profile?.gradeId ?? "f5a", state.currentSubject, 0).slice(0, RESCUE_QUESTIONS),
    [state.profile?.gradeId, state.currentSubject],
  );

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [built, setBuilt] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  if (!ready) return <div className="min-h-screen bg-background" />;

  const lost = state.lostStreak;
  const ex = exercises[index];

  if (!lost || !ex) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Mascot size={130} />
        <p className="text-base font-black">
          {lost ? "Não há questões disponíveis agora." : "Você não tem ofensiva para recuperar."}
        </p>
        <Link
          to="/desafios"
          className="press rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-soft"
        >
          Ver desafios
        </Link>
      </div>
    );
  }

  const seed = `rescue-${lost.day}-${index}`;
  const canCheck = canCheckExercise(ex, answer, built);

  function check() {
    const ok = evaluateExercise(ex!, seed, answer, built);
    setChecked(ok);
    if (ok) {
      setCorrect((c) => c + 1);
      play("correct");
    } else {
      play("wrong");
    }
  }

  function next() {
    const total = exercises.length;
    if (index + 1 >= total) {
      const won = rescueSucceeded(correct, total);
      if (won) {
        restoreStreak();
        play("levelUp");
      } else {
        dropLostStreak();
        play("timeout");
      }
      setFinished(true);
      return;
    }
    setChecked(null);
    setAnswer(null);
    setBuilt([]);
    setIndex((i) => i + 1);
  }

  if (finished) {
    const won = rescueSucceeded(correct, exercises.length);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <Mascot size={150} className="animate-float" priority />
        <SpeechBubble>
          {won
            ? `Boa! Você acertou ${correct} de ${exercises.length} e recuperou sua ofensiva de ${lost.value} dias. 🔥`
            : `Você acertou ${correct} de ${exercises.length}. Dessa vez a ofensiva se perdeu, mas hoje começa uma nova!`}
        </SpeechBubble>
        <Link
          to="/trilha"
          className="press w-full max-w-xs rounded-2xl bg-primary px-6 py-4 text-sm font-black uppercase tracking-wide text-primary-foreground shadow-soft"
        >
          Continuar estudando
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <TopBar title="Resgate de ofensiva" />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/desafios" })}
            aria-label="Sair do desafio"
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="h-5 w-5" strokeWidth={3} />
          </button>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-streak transition-all"
              style={{ width: `${(index / exercises.length) * 100}%` }}
            />
          </div>
          <span className="flex items-center gap-1 text-sm font-black text-streak">
            <Flame className="h-4 w-4" strokeWidth={3} />
            {lost.value}
          </span>
        </div>

        <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          Questão {index + 1} de {exercises.length} · acerte pelo menos 3
        </p>
        <h1 className="mt-1 text-xl font-black leading-tight">{ex.prompt}</h1>

        <div className="mt-5">
          <ExerciseBody
            ex={ex}
            seed={seed}
            checked={checked}
            answer={answer}
            setAnswer={setAnswer}
            built={built}
            setBuilt={setBuilt}
          />
        </div>
      </main>

      <footer
        className={cn(
          "fixed inset-x-0 bottom-0 border-t-2 border-border bg-card px-4 py-4",
          checked === true && "border-correct-foreground/30 bg-correct",
          checked === false && "border-wrong-foreground/30 bg-wrong",
        )}
      >
        <div className="mx-auto max-w-2xl">
          {checked !== null && (
            <p
              className={cn(
                "mb-3 text-base font-black",
                checked ? "text-correct-foreground" : "text-wrong-foreground",
              )}
            >
              {checked ? "Isso aí! 🎉" : `Resposta certa: ${correctAnswerText(ex, seed)}`}
            </p>
          )}
          <button
            disabled={checked === null && !canCheck}
            onClick={() => (checked === null ? check() : next())}
            className={cn(
              "press w-full rounded-2xl px-4 py-4 text-base font-black uppercase tracking-wide",
              checked === null && !canCheck
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground shadow-soft",
            )}
          >
            {checked === null ? "Verificar" : index + 1 >= exercises.length ? "Ver resultado" : "Continuar"}
          </button>
        </div>
      </footer>
    </div>
  );
}
