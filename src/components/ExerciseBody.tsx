import { cn } from "@/lib/utils";
import { normalize, scrambleWords, shuffledOptions, type Exercise } from "@/lib/questions";

export function ExerciseBody({
  ex,
  seed,
  checked,
  answer,
  setAnswer,
  built,
  setBuilt,
}: {
  ex: Exercise;
  seed: string;
  checked: boolean | null;
  answer: string | number | null;
  setAnswer: (v: string | number | null) => void;
  built: string[];
  setBuilt: (v: string[]) => void;
}) {
  if (ex.kind === "select" || ex.kind === "truefalse") {
    const data =
      ex.kind === "select"
        ? shuffledOptions(ex, seed)
        : { options: ["Verdadeiro", "Falso"], answer: ex.answer ? 0 : 1 };
    return (
      <div className="grid gap-3">
        {data.options.map((opt, i) => (
          <button
            key={String(opt) + i}
            disabled={checked !== null}
            onClick={() => setAnswer(i)}
            className={cn(
              "btn-3d rounded-2xl border-2 border-border bg-card px-4 py-4 text-left text-base font-extrabold",
              answer === i && checked === null && "border-accent bg-accent/10 text-accent",
              checked !== null && i === data.answer && "border-correct-foreground bg-correct text-correct-foreground",
              checked === false && answer === i && i !== data.answer && "border-wrong-foreground bg-wrong text-wrong-foreground",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (ex.kind === "type") {
    return (
      <input
        value={String(answer ?? "")}
        disabled={checked !== null}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Digite sua resposta"
        className="w-full rounded-2xl border-2 border-border bg-muted px-4 py-4 text-lg font-bold outline-none focus:border-accent"
      />
    );
  }

  const pool = scrambleWords(ex.sentence, seed);
  const used = [...built];
  return (
    <div>
      <div className="min-h-[64px] rounded-2xl border-2 border-dashed border-border p-3">
        <div className="flex flex-wrap gap-2">
          {built.map((w, i) => (
            <button
              key={w + i}
              disabled={checked !== null}
              onClick={() => setBuilt(built.filter((_, j) => j !== i))}
              className="btn-3d rounded-xl border-2 border-border bg-card px-3 py-2 text-sm font-extrabold"
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {pool.map((w, i) => {
          const idx = used.indexOf(w);
          const isUsed = idx !== -1;
          if (isUsed) used.splice(idx, 1);
          return (
            <button
              key={w + i}
              disabled={isUsed || checked !== null}
              onClick={() => setBuilt([...built, w])}
              className={cn(
                "btn-3d rounded-xl border-2 border-border bg-card px-3 py-2 text-sm font-extrabold",
                isUsed && "border-transparent bg-muted text-transparent",
              )}
            >
              {w}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function evaluateExercise(ex: Exercise, seed: string, answer: string | number | null, built: string[]): boolean {
  if (ex.kind === "select") {
    const s = shuffledOptions(ex, seed);
    return answer === s.answer;
  }
  if (ex.kind === "truefalse") return (answer === 0) === ex.answer;
  if (ex.kind === "type") return normalize(String(answer ?? "")) === normalize(ex.answer);
  return normalize(built.join(" ")) === normalize(ex.sentence);
}

export function canCheckExercise(ex: Exercise, answer: string | number | null, built: string[]): boolean {
  if (ex.kind === "assemble") return built.length > 0;
  if (ex.kind === "type") return String(answer ?? "").trim().length > 0;
  return answer !== null;
}
