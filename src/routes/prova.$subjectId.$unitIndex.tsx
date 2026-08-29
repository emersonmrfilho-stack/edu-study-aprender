import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, X, Volume2, VolumeX } from "lucide-react";
import { ExerciseBody, canCheckExercise, evaluateExercise } from "@/components/ExerciseBody";
import { Mascot, SpeechBubble } from "@/components/Mascot";
import { SpeakButton } from "@/components/SpeakButton";
import { SUBJECTS, getGrade, unitsFor } from "@/lib/curriculum";
import { correctAnswerText, examExercises } from "@/lib/questions";
import { playAchievement, playCorrect, playWrong } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prova/$subjectId/$unitIndex")({
  head: () => ({
    meta: [
      { title: "Prova — Edu Study" },
      { name: "description", content: "Prove o que aprendeu na unidade no Edu Study." },
      { property: "og:title", content: "Prova — Edu Study" },
      { property: "og:description", content: "Avaliação de unidade do seu ano escolar." },
    ],
  }),
  component: ExamPage,
});

const PASS_PERCENT = 70;

function ExamPage() {
  const { subjectId, unitIndex: unitIndexRaw } = Route.useParams();
  const unitIndex = Number(unitIndexRaw);
  const navigate = useNavigate();
  const { state, ready, loseHeart, passExam, unlockAchievements, toggleSound } = useStore();

  const grade = state.profile ? getGrade(state.profile.gradeId) : null;
  const units = grade ? unitsFor(grade.id, subjectId) : [];
  const unit = units[unitIndex];
  const exercises = useMemo(() => (grade ? examExercises(grade.id, subjectId, unitIndex) : []), [grade, subjectId, unitIndex]);

  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [built, setBuilt] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  if (!ready || !state.profile || !grade || !unit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-black text-muted-foreground">Carregando prova...</p>
      </div>
    );
  }

  const subject = SUBJECTS[subjectId]!;
  const ex = exercises[index];
  const progress = ((index + (finished ? 1 : 0)) / exercises.length) * 100;

  if (!ex) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot size={140} />
        <p className="font-black">Essa prova ainda não está disponível.</p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="btn-3d rounded-2xl border-2 border-primary/60 bg-primary px-6 py-3 font-black uppercase text-primary-foreground"
        >
          Voltar
        </button>
      </div>
    );
  }

  const seed = `${subjectId}-${unitIndex}-${index}`;

  function check() {
    const ok = evaluateExercise(ex!, seed, answer, built);
    setChecked(ok);
    if (ok) {
      setScore((s) => s + 1);
      playCorrect(state.soundEnabled);
    } else {
      loseHeart();
      playWrong(state.soundEnabled);
    }
  }

  function next() {
    setChecked(null);
    setAnswer(null);
    setBuilt([]);
    if (index + 1 >= exercises.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  }

  if (finished) {
    const percent = Math.round((score / exercises.length) * 100);
    const pass = percent >= PASS_PERCENT;
    const key = `${grade.id}-${subjectId}-${unitIndex}`;
    const alreadyPassed = !!state.examsPassed[key];
    if (pass && !alreadyPassed) {
      passExam(key);
      const newAchievements = unlockAchievements(["exam-first"]);
      if (newAchievements.length > 0) playAchievement(state.soundEnabled);
    }

    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
        <Mascot size={160} />
        <h1 className="text-2xl font-black text-primary">Prova finalizada</h1>
        <p className="text-3xl font-black">
          {score}/{exercises.length} ({percent}%)
        </p>
        <p
          className={cn(
            "font-black",
            pass ? "text-correct-foreground" : "text-wrong-foreground",
          )}
        >
          {pass
            ? "Parabéns! Você passou e liberou a próxima unidade."
            : `Você precisa de ${PASS_PERCENT}% para passar. Tente novamente!`}
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="btn-3d w-full max-w-sm rounded-2xl border-2 border-primary/60 bg-primary px-6 py-4 font-black uppercase text-primary-foreground"
        >
          Voltar à trilha
        </button>
      </div>
    );
  }

  const canCheck = canCheckExercise(ex, answer, built);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-4">
        <button aria-label="Sair da prova" onClick={() => navigate({ to: "/" })}>
          <X className="h-7 w-7 text-muted-foreground" strokeWidth={3} />
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <button
          aria-label={state.soundEnabled ? "Desativar som" : "Ativar som"}
          onClick={toggleSound}
          className="text-muted-foreground"
        >
          {state.soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        </button>
        <span className="flex items-center gap-1 font-black text-heart">
          <Heart className="h-6 w-6 fill-heart" strokeWidth={2.5} />
          {state.premium ? "∞" : state.hearts}
        </span>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-52">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {subject.name} · {grade.short} · Prova: {unit.title}
        </p>
        <div className="mt-4 flex items-start gap-3">
          <Mascot size={72} />
          <SpeechBubble>{ex.prompt}</SpeechBubble>
          <SpeakButton text={ex.prompt} />
        </div>

        {ex.image && (
          <img
            src={ex.image}
            alt=""
            className="mt-5 w-full rounded-2xl border-2 border-border object-cover"
            loading="lazy"
          />
        )}

        <div className="mt-6">
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
            <div className="mb-3">
              <p
                className={cn(
                  "text-base font-black",
                  checked ? "text-correct-foreground" : "text-wrong-foreground",
                )}
              >
                {checked ? "Muito bem!" : `Resposta certa: ${correctAnswerText(ex, seed)}`}
              </p>
              {!checked && ex.explanation && (
                <p className="mt-1 text-sm font-bold text-wrong-foreground/90">{ex.explanation}</p>
              )}
            </div>
          )}
          <button
            disabled={checked === null && !canCheck}
            onClick={() => (checked === null ? check() : next())}
            className={cn(
              "btn-3d w-full rounded-2xl border-2 px-4 py-4 text-base font-black uppercase tracking-wide",
              checked === null && !canCheck
                ? "border-border bg-muted text-muted-foreground"
                : checked === false
                  ? "border-wrong-foreground bg-wrong-foreground text-primary-foreground"
                  : "border-primary/60 bg-primary text-primary-foreground",
            )}
          >
            {checked === null ? "Verificar" : index + 1 >= exercises.length ? "Finalizar prova" : "Continuar"}
          </button>
        </div>
      </footer>
    </div>
  );
}
