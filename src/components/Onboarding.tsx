import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { GRADES, getGrade } from "@/lib/curriculum";
import { placementQuestions, shuffledOptions, type Exercise } from "@/lib/questions";
import { useStore } from "@/lib/store";
import { Mascot, SpeechBubble } from "./Mascot";
import { cn } from "@/lib/utils";

export function Onboarding() {
  const { setProfile } = useStore();
  const [step, setStep] = useState<"welcome" | "name" | "grade" | "test" | "result">("welcome");
  const [name, setName] = useState("");
  const [gradeId, setGradeId] = useState<string>("f6a");
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const questions = placementQuestions(gradeId).filter(
    (q) => q.kind === "select" || q.kind === "truefalse",
  );
  const q = questions[qIndex];

  const startUnit = score >= 6 ? 3 : score >= 4 ? 2 : score >= 2 ? 1 : 0;

  function finish(su: number) {
    setProfile({
      name: name.trim() || "Estudante",
      gradeId,
      startUnit: su,
      placementScore: score,
      onboarded: true,
    });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 pb-8 pt-10">
      {step === "welcome" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Mascot size={200} priority />
          <h1 className="text-3xl font-black tracking-tight text-primary">Edu Study</h1>
          <p className="max-w-sm text-base font-bold text-muted-foreground">
            Oi! Eu sou o Edu. Vou te ensinar todas as matérias da escola, do 1º ano até o 3º ano do
            Ensino Médio — de um jeito divertido.
          </p>
          <PrimaryButton onClick={() => setStep("name")}>Começar</PrimaryButton>
          <Link
            to="/auth"
            className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground"
          >
            Já tenho uma conta
          </Link>
        </div>
      )}

      {step === "name" && (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex items-start gap-3 pt-6">
            <Mascot size={92} />
            <SpeechBubble>Como você se chama?</SpeechBubble>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="w-full rounded-2xl border-2 border-border bg-muted px-4 py-4 text-lg font-bold outline-none focus:border-accent"
          />
          <div className="mt-auto">
            <PrimaryButton onClick={() => setStep("grade")}>Continuar</PrimaryButton>
          </div>
        </div>
      )}

      {step === "grade" && (
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex items-start gap-3">
            <Mascot size={84} />
            <SpeechBubble>Em que ano escolar você está?</SpeechBubble>
          </div>
          <div className="grid gap-3">
            {GRADES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGradeId(g.id)}
                className={cn(
                  "btn-3d flex items-center justify-between rounded-2xl border-2 border-border bg-card px-4 py-4 text-left text-base font-extrabold",
                  gradeId === g.id && "border-accent bg-accent/10 text-accent",
                )}
              >
                {g.label}
                <span className="text-sm text-muted-foreground">{g.short}</span>
              </button>
            ))}
          </div>
          <div className="sticky bottom-4 mt-4 bg-background pt-2">
            <PrimaryButton
              onClick={() => {
                setQIndex(0);
                setScore(0);
                setPicked(null);
                setStep("test");
              }}
            >
              Fazer teste de nivelamento
            </PrimaryButton>
            <button
              onClick={() => finish(0)}
              className="mt-3 w-full rounded-2xl px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-muted-foreground"
            >
              Sou iniciante, começar do zero
            </button>
          </div>
        </div>
      )}

      {step === "test" && q && (
        <PlacementQuestion
          key={qIndex}
          index={qIndex}
          total={questions.length}
          exercise={q}
          picked={picked}
          setPicked={setPicked}
          onNext={(correct) => {
            const s = score + (correct ? 1 : 0);
            setScore(s);
            setPicked(null);
            if (qIndex + 1 >= questions.length) setStep("result");
            else setQIndex(qIndex + 1);
          }}
        />
      )}

      {step === "result" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Mascot size={180} />
          <h2 className="text-2xl font-black">Você acertou {score} de {questions.length}!</h2>
          <p className="max-w-sm font-bold text-muted-foreground">
            Vamos começar seu curso do {getGrade(gradeId).label} na unidade {startUnit + 1}. O
            conteúdo é adequado para o seu ano e vai ficando mais desafiador aos poucos.
          </p>
          <PrimaryButton onClick={() => finish(startUnit)}>Começar meu curso</PrimaryButton>
        </div>
      )}
    </div>
  );
}

function PlacementQuestion({
  index,
  total,
  exercise,
  picked,
  setPicked,
  onNext,
}: {
  index: number;
  total: number;
  exercise: Exercise;
  picked: number | null;
  setPicked: (n: number | null) => void;
  onNext: (correct: boolean) => void;
}) {
  const [checked, setChecked] = useState(false);
  const normalized =
    exercise.kind === "select"
      ? shuffledOptions(exercise, `placement-${index}`)
      : exercise.kind === "truefalse"
        ? { options: ["Verdadeiro", "Falso"], answer: exercise.answer ? 0 : 1 }
        : { options: [], answer: 0 };

  const isCorrect = picked === normalized.answer;

  return (
    <div className="flex flex-1 flex-col gap-5 pt-2">
      <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>
      <h2 className="text-xl font-black">{exercise.prompt}</h2>
      <div className="grid gap-3">
        {normalized.options.map((opt, i) => (
          <button
            key={String(opt) + i}
            disabled={checked}
            onClick={() => setPicked(i)}
            className={cn(
              "btn-3d rounded-2xl border-2 border-border bg-card px-4 py-4 text-left text-base font-extrabold",
              picked === i && !checked && "border-accent bg-accent/10 text-accent",
              checked && i === normalized.answer && "border-correct-foreground bg-correct text-correct-foreground",
              checked && picked === i && i !== normalized.answer && "border-wrong-foreground bg-wrong text-wrong-foreground",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="mt-auto pt-6">
        <PrimaryButton
          disabled={picked === null}
          onClick={() => {
            if (!checked) setChecked(true);
            else onNext(isCorrect);
          }}
        >
          {checked ? "Continuar" : "Verificar"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "btn-3d w-full rounded-2xl border-2 border-primary/60 bg-primary px-4 py-4 text-base font-black uppercase tracking-wide text-primary-foreground",
        disabled && "cursor-not-allowed border-border bg-muted text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
