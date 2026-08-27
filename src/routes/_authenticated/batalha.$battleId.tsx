import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Swords, Trophy, X } from "lucide-react";
import { Mascot, SpeechBubble } from "@/components/Mascot";
import { ExerciseBody, canCheckExercise, evaluateExercise } from "@/components/ExerciseBody";
import { SUBJECTS } from "@/lib/curriculum";
import { correctAnswerText } from "@/lib/questions";
import { BATTLE_SECONDS, battleExercises, battlePoints } from "@/lib/battle";
import { getBattle, submitBattleScore } from "@/lib/social.functions";
import { playCorrect, playWrong } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/batalha/$battleId")({
  head: () => ({
    meta: [
      { title: "Batalha — Edu Study" },
      { name: "description", content: "Desafie um amigo em uma batalha de perguntas rápidas." },
      { property: "og:title", content: "Batalha — Edu Study" },
      { property: "og:description", content: "Desafie um amigo em uma batalha de perguntas rápidas." },
    ],
  }),
  component: BattlePage,
});

function BattlePage() {
  const { battleId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { state, toggleSound } = useStore();
  const fetchBattle = useServerFn(getBattle);
  const submitScore = useServerFn(submitBattleScore);

  const { data, isLoading, error } = useQuery({
    queryKey: ["battle", battleId],
    queryFn: () => fetchBattle({ data: { battleId } }),
    refetchInterval: (q) => {
      const d = q.state.data;
      return d && !d.myTurnDone ? 5000 : false;
    },
  });

  const battle = data?.battle;
  const exercises = useMemo(
    () => (battle ? battleExercises(battle.grade_id, battle.subject_id, battle.seed, battle.question_count) : []),
    [battle],
  );

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [built, setBuilt] = useState<string[]>([]);
  const [checked, setChecked] = useState<null | "correct" | "wrong" | "timeout">(null);
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(BATTLE_SECONDS);
  const [finished, setFinished] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  useEffect(() => {
    if (!battle || finished || checked !== null) return;
    setSecondsLeft(BATTLE_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          stopTimer();
          setChecked("timeout");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return stopTimer;
  }, [battle, index, finished, checked, stopTimer]);

  const submitMutation = useMutation({
    mutationFn: (finalScore: number) => submitScore({ data: { battleId, score: finalScore } }),
    onSuccess: (b) => {
      setSubmitted(true);
      void qc.invalidateQueries({ queryKey: ["battles"] });
      void qc.invalidateQueries({ queryKey: ["battle", battleId] });
      setBattleResult(b);
    },
  });
  const [battleResult, setBattleResult] = useState<typeof battle | null>(null);

  const ex = exercises[index];

  function lockAnswer() {
    stopTimer();
    const ok = ex ? evaluateExercise(ex, `${battleId}-${index}`, answer, built) : false;
    if (ok) {
      setChecked("correct");
      setScore((s) => s + battlePoints(secondsLeft));
      playCorrect(state.soundEnabled);
    } else {
      setChecked("wrong");
      playWrong(state.soundEnabled);
    }
  }

  function nextQuestion() {
    setChecked(null);
    setAnswer(null);
    setBuilt([]);
    if (index + 1 >= exercises.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  // Submit once when finished and not yet submitted.
  useEffect(() => {
    if (finished && !submitted && battle) {
      submitMutation.mutate(score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, submitted, battle, score]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !battle || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot size={140} />
        <p className="font-black text-muted-foreground">
          {error instanceof Error ? error.message : "Batalha não encontrada."}
        </p>
        <button
          onClick={() => navigate({ to: "/amigos" })}
          className="btn-3d rounded-2xl border-2 border-primary/60 bg-primary px-6 py-3 font-black uppercase text-primary-foreground"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Already played this turn.
  if (data.myTurnDone && !submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot size={160} />
        <h1 className="text-2xl font-black text-primary">Você já jogou</h1>
        <p className="font-bold text-muted-foreground">
          Sua pontuação: {data.myScore}. Aguardando o adversário ({data.opponent?.display_name ?? "?"}).
        </p>
        <button
          onClick={() => navigate({ to: "/amigos" })}
          className="btn-3d w-full max-w-sm rounded-2xl border-2 border-primary/60 bg-primary px-6 py-4 font-black uppercase text-primary-foreground"
        >
          Voltar para amigos
        </button>
      </div>
    );
  }

  const subject = SUBJECTS[battle.subject_id];

  // Final screen.
  if (finished && submitted) {
    const result = battleResult ?? battle;
    const bothDone = result.status === "finished";
    const won = bothDone && result.winner_id === battle?.challenger_id
      ? data.iAmChallenger
      : bothDone && result.winner_id === battle?.opponent_id
        ? !data.iAmChallenger
        : false;
    const draw = bothDone && result.winner_id === null;
    const myFinal = data.iAmChallenger ? result.challenger_score : result.opponent_score;
    const theirFinal = data.iAmChallenger ? result.opponent_score : result.challenger_score;

    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex items-center gap-3">
          <Trophy className={cn("h-14 w-14", bothDone ? (won ? "text-gem" : "text-muted-foreground") : "text-primary")} strokeWidth={2.5} />
          <Mascot size={120} />
        </div>
        <h1 className="text-2xl font-black">
          {bothDone ? (draw ? "Empate!" : won ? "Você venceu! 🎉" : "Você perdeu") : "Sua vez acabou!"}
        </h1>
        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          <div className="rounded-2xl border-2 border-primary/60 bg-primary/10 p-4">
            <p className="text-xs font-black uppercase text-muted-foreground">Você</p>
            <p className="text-3xl font-black text-primary">{myFinal}</p>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-4">
            <p className="text-xs font-black uppercase text-muted-foreground">
              {data.opponent?.display_name ?? "Adversário"}
            </p>
            <p className="text-3xl font-black">{theirFinal}</p>
          </div>
        </div>
        {!bothDone && (
          <p className="font-bold text-muted-foreground">
            Aguardando {data.opponent?.display_name ?? "o adversário"} jogar.
          </p>
        )}
        <button
          onClick={() => navigate({ to: "/amigos" })}
          className="btn-3d w-full max-w-sm rounded-2xl border-2 border-primary/60 bg-primary px-6 py-4 font-black uppercase text-primary-foreground"
        >
          Voltar para amigos
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ex) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot size={140} />
        <p className="font-black text-muted-foreground">Esta batalha não tem perguntas.</p>
        <button
          onClick={() => navigate({ to: "/amigos" })}
          className="btn-3d rounded-2xl border-2 border-primary/60 bg-primary px-6 py-3 font-black uppercase text-primary-foreground"
        >
          Voltar
        </button>
      </div>
    );
  }

  const progress = ((index + (checked ? 1 : 0)) / exercises.length) * 100;
  const seed = `${battleId}-${index}`;
  const canCheck = canCheckExercise(ex, answer, built);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-4">
        <button aria-label="Sair da batalha" onClick={() => navigate({ to: "/amigos" })}>
          <X className="h-7 w-7 text-muted-foreground" strokeWidth={3} />
        </button>
        <div className="flex flex-1 items-center gap-2">
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gem transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="flex items-center gap-1 font-black text-gem">
            <Swords className="h-5 w-5" /> {index + 1}/{exercises.length}
          </span>
        </div>
        <button
          aria-label={state.soundEnabled ? "Desativar som" : "Ativar som"}
          onClick={toggleSound}
          className="text-sm font-black text-muted-foreground"
        >
          {secondsLeft}s
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-52">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {subject?.emoji ?? "📚"} {subject?.name ?? battle.subject_id} · vs {data.opponent?.display_name ?? "Adversário"}
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
            checked={checked === null ? null : checked === "correct"}
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
          checked === "correct" && "border-correct-foreground/30 bg-correct",
          (checked === "wrong" || checked === "timeout") && "border-wrong-foreground/30 bg-wrong",
        )}
      >
        <div className="mx-auto max-w-2xl">
          {checked !== null && (
            <div className="mb-3">
              <p
                className={cn(
                  "text-base font-black",
                  checked === "correct" ? "text-correct-foreground" : "text-wrong-foreground",
                )}
              >
                {checked === "correct"
                  ? `Muito bem! +${battlePoints(secondsLeft)} pontos 🎉`
                  : checked === "timeout"
                    ? "Tempo esgotado!"
                    : `Resposta certa: ${correctAnswerText(ex, seed)}`}
              </p>
              {(checked === "wrong" || checked === "timeout") && ex.explanation && (
                <p className="mt-1 text-sm font-bold text-wrong-foreground/90">{ex.explanation}</p>
              )}
            </div>
          )}
          <button
            disabled={checked === null && !canCheck}
            onClick={() => (checked === null ? lockAnswer() : nextQuestion())}
            className={cn(
              "btn-3d w-full rounded-2xl border-2 px-4 py-4 text-base font-black uppercase tracking-wide",
              checked === null && !canCheck
                ? "border-border bg-muted text-muted-foreground"
                : checked === "correct"
                  ? "border-correct-foreground bg-correct-foreground text-primary-foreground"
                  : checked === null
                    ? "border-primary/60 bg-primary text-primary-foreground"
                    : "border-wrong-foreground bg-wrong-foreground text-primary-foreground",
            )}
          >
            {checked === null
              ? "Responder"
              : index + 1 >= exercises.length
                ? "Ver resultado"
                : "Próxima pergunta"}
          </button>
        </div>
      </footer>
    </div>
  );
}
