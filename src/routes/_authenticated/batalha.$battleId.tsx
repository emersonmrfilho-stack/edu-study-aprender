import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Circle, Diamond, Loader2, Square, Swords, Triangle, Trophy, X } from "lucide-react";
import { Mascot, SpeechBubble } from "@/components/Mascot";
import { SpeakButton } from "@/components/SpeakButton";
import { ExerciseBody, canCheckExercise, evaluateExercise } from "@/components/ExerciseBody";
import { SubjectIcon } from "@/components/SubjectIcon";
import { SUBJECTS } from "@/lib/curriculum";
import { correctAnswerText, shuffledOptions, type Exercise } from "@/lib/questions";
import { BATTLE_SECONDS, battleExercises, battlePoints } from "@/lib/battle";
import { createBattle, getBattle, submitBattleScore } from "@/lib/social.functions";
import { playCorrect, playDefeat, playStart, playTick, playVictory, playWrong } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/batalha/$battleId")({
  staticData: { sitemap: false },
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

/** Blocos coloridos estilo Kahoot, com as cores do Edu. */
const BLOCKS = [
  { bg: "bg-primary", border: "border-primary", Icon: Triangle },
  { bg: "bg-accent", border: "border-accent", Icon: Diamond },
  { bg: "bg-gem", border: "border-gem", Icon: Circle },
  { bg: "bg-streak", border: "border-streak", Icon: Square },
];

function CircularTimer({ secondsLeft }: { secondsLeft: number }) {
  const pct = Math.max(0, Math.min(1, secondsLeft / BATTLE_SECONDS));
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} className="stroke-muted" strokeWidth="6" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={r}
          className={cn("transition-all duration-1000", secondsLeft <= 5 ? "stroke-heart" : "stroke-gem")}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-black">
        {secondsLeft}
      </span>
    </div>
  );
}

function KahootOptions({
  ex,
  seed,
  checked,
  answer,
  setAnswer,
}: {
  ex: Exercise;
  seed: string;
  checked: null | "correct" | "wrong" | "timeout";
  answer: string | number | null;
  setAnswer: (v: number) => void;
}) {
  const data =
    ex.kind === "select"
      ? shuffledOptions(ex, seed)
      : { options: ["Verdadeiro", "Falso"], answer: (ex as { answer: boolean }).answer ? 0 : 1 };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.options.map((opt, i) => {
        const block = BLOCKS[i % BLOCKS.length]!;
        const Icon = block.Icon;
        const isRight = checked !== null && i === data.answer;
        const isWrongPick = checked !== null && answer === i && i !== data.answer;
        const dimmed = checked !== null && !isRight && !isWrongPick;
        return (
          <button
            key={String(opt) + i}
            disabled={checked !== null}
            onClick={() => setAnswer(i)}
            className={cn(
              "btn-3d flex min-h-[86px] items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-base font-black text-primary-foreground transition-all",
              block.bg,
              block.border,
              answer === i && checked === null && "ring-4 ring-foreground/20",
              isRight && "ring-4 ring-foreground/40",
              dimmed && "opacity-40",
              isWrongPick && "opacity-90 grayscale",
            )}
          >
            <Icon aria-hidden className="h-6 w-6 shrink-0 fill-current" strokeWidth={3} />
            <span className="min-w-0 break-words">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function BattlePage() {
  const { battleId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { state } = useStore();
  const fetchBattle = useServerFn(getBattle);
  const submitScore = useServerFn(submitBattleScore);
  const newBattle = useServerFn(createBattle);

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

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [built, setBuilt] = useState<string[]>([]);
  const [checked, setChecked] = useState<null | "correct" | "wrong" | "timeout">(null);
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(BATTLE_SECONDS);
  const [finished, setFinished] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [battleResult, setBattleResult] = useState<typeof battle | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  useEffect(() => {
    if (!battle || !started || finished || checked !== null) return;
    setSecondsLeft(BATTLE_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          stopTimer();
          setChecked("timeout");
          return 0;
        }
        if (s <= 6) playTick(state.soundEnabled);
        return s - 1;
      });
    }, 1000);
    return stopTimer;
  }, [battle, started, index, finished, checked, stopTimer, state.soundEnabled]);

  const submitMutation = useMutation({
    mutationFn: (finalScore: number) => submitScore({ data: { battleId, score: finalScore } }),
    onSuccess: (b) => {
      setSubmitted(true);
      void qc.invalidateQueries({ queryKey: ["battles"] });
      void qc.invalidateQueries({ queryKey: ["battle", battleId] });
      setBattleResult(b);
    },
  });

  const rematch = useMutation({
    mutationFn: () =>
      newBattle({
        data: {
          opponentId: data!.opponent!.user_id,
          subjectId: battle!.subject_id,
          gradeId: battle!.grade_id,
        },
      }),
    onSuccess: (b) => {
      void qc.invalidateQueries({ queryKey: ["battles"] });
      navigate({ to: "/batalha/$battleId", params: { battleId: b.id } });
    },
  });

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

  // Envia o placar uma única vez ao terminar.
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

  const subject = SUBJECTS[battle.subject_id];
  const opponentName = data.opponent?.display_name ?? "Adversário";

  // Já jogou esta rodada.
  if (data.myTurnDone && !submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot size={160} />
        <h1 className="text-2xl font-black text-primary">Você já jogou</h1>
        <p className="font-bold text-muted-foreground">
          Sua pontuação: {data.myScore}. Aguardando o adversário ({opponentName}).
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

  // Tela final.
  if (finished && submitted) {
    const result = battleResult ?? battle;
    const bothDone = result.status === "finished";
    const won =
      bothDone && result.winner_id === battle.challenger_id
        ? data.iAmChallenger
        : bothDone && result.winner_id === battle.opponent_id
          ? !data.iAmChallenger
          : false;
    const draw = bothDone && result.winner_id === null;
    const myFinal = data.iAmChallenger ? result.challenger_score : result.opponent_score;
    const theirFinal = data.iAmChallenger ? result.opponent_score : result.challenger_score;

    return <FinalScreen {...{ bothDone, won, draw, myFinal, theirFinal, opponentName, state, rematch, navigate }} />;
  }

  if (finished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Lobby: mostra os dois jogadores antes de começar.
  if (!started) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="flex items-center gap-2 rounded-full border-2 border-gem/40 bg-gem/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-gem">
          <SubjectIcon subjectId={battle.subject_id} className="h-4 w-4" />
          {subject?.name ?? battle.subject_id}
        </span>
        <h1 className="text-3xl font-black">Batalha do Edu</h1>
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="card-soft flex flex-col items-center gap-2 p-4">
            <Mascot size={96} className="animate-float" priority />
            <p className="truncate text-sm font-black">{state.profile?.name ?? "Você"}</p>
            <p className="text-xs font-bold uppercase text-muted-foreground">Você</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Swords className="h-8 w-8 text-gem" strokeWidth={3} />
            <span className="text-xs font-black uppercase text-muted-foreground">vs</span>
          </div>
          <div className="card-soft flex flex-col items-center gap-2 p-4">
            <Mascot size={96} avatarId="classico" />
            <p className="truncate text-sm font-black">{opponentName}</p>
            <p className="text-xs font-bold uppercase text-muted-foreground">Adversário</p>
          </div>
        </div>
        <p className="text-sm font-bold text-muted-foreground">
          {exercises.length} perguntas · {BATTLE_SECONDS}s cada · responda rápido para ganhar mais pontos.
        </p>
        <button
          onClick={() => {
            playStart(state.soundEnabled);
            setStarted(true);
          }}
          className="btn-3d w-full max-w-sm rounded-2xl border-2 border-primary/60 bg-primary px-6 py-4 text-base font-black uppercase tracking-wide text-primary-foreground"
        >
          Começar batalha
        </button>
        <button
          onClick={() => navigate({ to: "/amigos" })}
          className="text-sm font-black uppercase tracking-wide text-muted-foreground"
        >
          Voltar
        </button>
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
  const isQuiz = ex.kind === "select" || ex.kind === "truefalse";

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
        <CircularTimer secondsLeft={secondsLeft} />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-52">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
            <SubjectIcon subjectId={battle.subject_id} className="h-4 w-4" />
            {subject?.name ?? battle.subject_id} · vs {opponentName}
          </p>
          <span className="rounded-full bg-gem/10 px-3 py-1 text-xs font-black text-gem">{score} pts</span>
        </div>
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
          {isQuiz ? (
            <KahootOptions ex={ex} seed={seed} checked={checked} answer={answer} setAnswer={setAnswer} />
          ) : (
            <ExerciseBody
              ex={ex}
              seed={seed}
              checked={checked === null ? null : checked === "correct"}
              answer={answer}
              setAnswer={setAnswer}
              built={built}
              setBuilt={setBuilt}
            />
          )}
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
                  ? `Muito bem! +${battlePoints(secondsLeft)} pontos`
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

function FinalScreen({
  bothDone,
  won,
  draw,
  myFinal,
  theirFinal,
  opponentName,
  state,
  rematch,
  navigate,
}: {
  bothDone: boolean;
  won: boolean;
  draw: boolean;
  myFinal: number;
  theirFinal: number;
  opponentName: string;
  state: { soundEnabled: boolean };
  rematch: { mutate: () => void; isPending: boolean };
  navigate: ReturnType<typeof useNavigate>;
}) {
  useEffect(() => {
    if (!bothDone || draw) return;
    if (won) playVictory(state.soundEnabled);
    else playDefeat(state.soundEnabled);
  }, [bothDone, draw, won, state.soundEnabled]);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex items-center gap-3">
        <Trophy
          className={cn("h-14 w-14", bothDone ? (won ? "text-gem" : "text-muted-foreground") : "text-primary")}
          strokeWidth={2.5}
        />
        <Mascot size={120} className={won ? "animate-float" : ""} />
      </div>
      <h1 className="text-2xl font-black">
        {bothDone ? (draw ? "Empate!" : won ? "Você venceu!" : "Você perdeu") : "Sua vez acabou!"}
      </h1>
      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-primary/60 bg-primary/10 p-4">
          <p className="text-xs font-black uppercase text-muted-foreground">Você</p>
          <p className="text-3xl font-black text-primary">{myFinal}</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <p className="truncate text-xs font-black uppercase text-muted-foreground">{opponentName}</p>
          <p className="text-3xl font-black">{theirFinal}</p>
        </div>
      </div>
      {!bothDone && (
        <p className="font-bold text-muted-foreground">Aguardando {opponentName} jogar.</p>
      )}
      <div className="grid w-full max-w-sm gap-3">
        <button
          disabled={rematch.isPending}
          onClick={() => rematch.mutate()}
          className="btn-3d rounded-2xl border-2 border-gem/60 bg-gem px-6 py-4 font-black uppercase text-primary-foreground disabled:opacity-60"
        >
          {rematch.isPending ? "Criando..." : "Jogar de novo"}
        </button>
        <button
          onClick={() => navigate({ to: "/amigos" })}
          className="btn-3d rounded-2xl border-2 border-primary/60 bg-primary px-6 py-4 font-black uppercase text-primary-foreground"
        >
          Voltar para amigos
        </button>
      </div>
    </div>
  );
}
