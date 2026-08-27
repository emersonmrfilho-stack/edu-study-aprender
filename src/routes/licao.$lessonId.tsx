import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, X, Volume2, VolumeX } from "lucide-react";
import { ExerciseBody, canCheckExercise, evaluateExercise } from "@/components/ExerciseBody";
import { Mascot, SpeechBubble } from "@/components/Mascot";
import { SUBJECTS, getGrade, parseLessonId } from "@/lib/curriculum";
import { correctAnswerText, exercisesForLesson, lessonConcept } from "@/lib/questions";
import { playAchievement, playCorrect, playWrong } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/licao/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lição — Edu Study" },
      { name: "description", content: "Resolva exercícios curtos e ganhe XP na sua trilha do Edu Study." },
      { property: "og:title", content: "Lição — Edu Study" },
      { property: "og:description", content: "Exercícios interativos do seu ano escolar." },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId: raw } = Route.useParams();
  const lessonId = raw.includes("%") ? decodeURIComponent(raw) : raw;
  const navigate = useNavigate();
  const { state, ready, loseHeart, completeLesson, toggleSound } = useStore();

  const ref = parseLessonId(lessonId);
  const exercises = useMemo(() => exercisesForLesson(lessonId), [lessonId]);
  const concept = useMemo(() => lessonConcept(lessonId), [lessonId]);

  const [phase, setPhase] = useState<"teach" | "exercise" | "finished">("teach");
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [built, setBuilt] = useState<string[]>([]);

  if (!ready) return <div className="min-h-screen bg-background" />;
  const exCur = exercises[index];
  if (!ref || exercises.length === 0 || !exCur) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot size={140} />
        <p className="font-black">Essa lição ainda não está disponível.</p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="btn-3d rounded-2xl border-2 border-primary/60 bg-primary px-6 py-3 font-black uppercase text-primary-foreground"
        >
          Voltar
        </button>
      </div>
    );
  }

  const subject = SUBJECTS[ref.subjectId]!;
  const grade = getGrade(ref.gradeId);
  const ex = exCur;
  const progress = ((index + (phase === "finished" ? 1 : 0)) / exercises.length) * 100;

  const outOfHearts = !state.premium && state.hearts <= 0;
  const seed = lessonId + index;

  function check() {
    const ok = evaluateExercise(ex, seed, answer, built);
    setChecked(ok);
    if (ok) {
      setCorrectCount((c) => c + 1);
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
      const xp = 10 + correctCount * 2;
      completeLesson(lessonId, correctCount, xp);
      setPhase("finished");
    } else {
      setIndex(index + 1);
    }
  }

  function retry() {
    setChecked(null);
    setAnswer(null);
    setBuilt([]);
  }

  if (phase === "finished") {
    const xp = 10 + correctCount * 2;
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
        <Mascot size={180} />
        <h1 className="text-3xl font-black text-primary">Lição concluída!</h1>
        <div className="flex gap-3">
          <div className="rounded-2xl border-2 border-streak bg-streak/10 px-6 py-3">
            <p className="text-xs font-black uppercase text-streak">XP ganho</p>
            <p className="text-2xl font-black">{xp}</p>
          </div>
          <div className="rounded-2xl border-2 border-primary bg-primary/10 px-6 py-3">
            <p className="text-xs font-black uppercase text-primary">Acertos</p>
            <p className="text-2xl font-black">
              {correctCount}/{exercises.length}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate({ to: "/" })}
          className="btn-3d w-full max-w-sm rounded-2xl border-2 border-primary/60 bg-primary px-6 py-4 font-black uppercase tracking-wide text-primary-foreground"
        >
          Continuar
        </button>
      </div>
    );
  }

  if (phase === "teach") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-4">
          <button aria-label="Sair da lição" onClick={() => navigate({ to: "/" })}>
            <X className="h-7 w-7 text-muted-foreground" strokeWidth={3} />
          </button>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: "0%" }} />
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

        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-40">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {subject.emoji} {subject.name} · {grade.short} · {ref.unitTitle}
          </p>
          <div className="mt-4 flex items-start gap-3">
            <Mascot size={72} />
            <SpeechBubble>Vamos aprender antes de praticar!</SpeechBubble>
          </div>

          <div className="mt-6 rounded-2xl border-2 border-border bg-card p-5">
            <h2 className="text-xl font-black text-primary">{concept.title}</h2>
            {concept.image && (
              <img
                src={concept.image}
                alt=""
                className="mt-4 w-full rounded-xl border-2 border-border object-cover"
                loading="eager"
              />
            )}
            <p className="mt-4 text-base font-bold leading-relaxed text-foreground">{concept.explanation}</p>
            {concept.example && (
              <div className="mt-4 rounded-xl bg-muted p-4">
                <p className="text-sm font-black uppercase tracking-wide text-muted-foreground">Exemplo</p>
                <p className="mt-1 font-bold text-foreground">{concept.example}</p>
              </div>
            )}
          </div>
        </main>

        <footer className="fixed inset-x-0 bottom-0 border-t-2 border-border bg-card px-4 py-4">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => setPhase("exercise")}
              className="btn-3d w-full rounded-2xl border-2 border-primary/60 bg-primary px-4 py-4 text-base font-black uppercase tracking-wide text-primary-foreground"
            >
              Começar exercícios
            </button>
          </div>
        </footer>
      </div>
    );
  }

  if (outOfHearts && checked === null) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-5 px-6 text-center">
        <Mascot size={160} />
        <h1 className="text-2xl font-black">Você ficou sem corações!</h1>
        <p className="font-bold text-muted-foreground">
          Os corações voltam com o tempo (1 a cada 20 minutos) ou você pode recarregar com gemas no
          perfil.
        </p>
        <button
          onClick={() => navigate({ to: "/premium" })}
          className="btn-3d w-full max-w-sm rounded-2xl border-2 border-primary/60 bg-primary px-6 py-4 font-black uppercase text-primary-foreground"
        >
          Corações ilimitados · Premium
        </button>
        <button
          onClick={() => navigate({ to: "/perfil" })}
          className="font-extrabold uppercase text-muted-foreground"
        >
          Ir para o perfil
        </button>
        <button onClick={() => navigate({ to: "/" })} className="font-extrabold uppercase text-muted-foreground">
          Voltar à trilha
        </button>
      </div>
    );
  }

  const canCheck = canCheckExercise(ex, answer, built);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-4">
        <button aria-label="Sair da lição" onClick={() => navigate({ to: "/" })}>
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
          {subject.emoji} {subject.name} · {grade.short} · {ref.unitTitle}
        </p>
        <div className="mt-4 flex items-start gap-3">
          <Mascot size={72} />
          <SpeechBubble>{ex.prompt}</SpeechBubble>
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
                {checked ? "Muito bem! 🎉" : `Resposta certa: ${correctAnswerText(ex, seed)}`}
              </p>
              {!checked && ex.explanation && (
                <p className="mt-1 text-sm font-bold text-wrong-foreground/90">{ex.explanation}</p>
              )}
              {!checked && (
                <Link
                  to="/edu-ia"
                  search={{
                    materia: ref.subjectId,
                    q: `Errei esta questão de ${subject.name} do ${grade.label}: "${ex.prompt}". A resposta certa é "${correctAnswerText(ex, seed)}". Me explique passo a passo por que é essa e como não errar de novo.`,
                  }}
                  className="press mt-2 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-primary"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={3} /> Pedir ajuda ao Edu
                </Link>
              )}
            </div>
          )}
          <button
            disabled={checked === null && !canCheck}
            onClick={() => (checked === null ? check() : checked ? next() : retry())}
            className={cn(
              "btn-3d w-full rounded-2xl border-2 px-4 py-4 text-base font-black uppercase tracking-wide",
              checked === null && !canCheck
                ? "border-border bg-muted text-muted-foreground"
                : checked === false
                  ? "border-wrong-foreground bg-wrong-foreground text-primary-foreground"
                  : "border-primary/60 bg-primary text-primary-foreground",
            )}
          >
            {checked === null ? "Verificar" : checked ? "Continuar" : "Tentar de novo"}
          </button>
        </div>
      </footer>
    </div>
  );
}

