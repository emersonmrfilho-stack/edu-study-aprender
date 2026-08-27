import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles, Lightbulb, BookOpen, PencilLine, HelpCircle } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Mascot } from "@/components/Mascot";
import { getGrade, SUBJECTS } from "@/lib/curriculum";
import { useStore } from "@/lib/store";
import { useSfx } from "@/hooks/useSfx";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

type Search = { q?: string | undefined; materia?: string | undefined };

export const Route = createFileRoute("/edu-ia")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    materia: typeof search["materia"] === "string" ? search["materia"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "IA do Edu — tutor de estudos | Edu Study" },
      {
        name: "description",
        content:
          "Converse com a IA do Edu: explicações de matérias, ajuda nos erros, dicas de estudo e exercícios criados na hora.",
      },
      { property: "og:title", content: "IA do Edu — seu tutor particular" },
      {
        property: "og:description",
        content: "Tire dúvidas de qualquer matéria com o macaco Edu e receba exercícios sob medida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EduIA,
});

/** Markdown leve: **negrito** e quebras de linha. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="whitespace-pre-wrap text-[15px] font-semibold leading-relaxed">
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-black">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

function EduIA() {
  const { state } = useStore();
  const { q, materia } = Route.useSearch();
  const { play } = useSfx();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const grade = getGrade(state.profile?.gradeId ?? "f5a");
  const subject = SUBJECTS[materia ?? state.currentSubject] ?? SUBJECTS["matematica"]!;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || streaming) return;
    setError(null);
    play("send");
    const next: Msg[] = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/edu/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next,
          context: `Aluno: ${state.profile?.name ?? "estudante"}, série: ${grade.label}, matéria atual: ${subject.name}, nível de XP: ${state.xp}.`,
        }),
      });

      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "O Edu não conseguiu responder agora.");
      }

      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });
      }
      play("receive");
    } catch (e) {
      play("error");
      setError(e instanceof Error ? e.message : "Erro ao falar com o Edu.");
      setMessages((m) => (m[m.length - 1]?.role === "assistant" && !m[m.length - 1]?.content ? m.slice(0, -1) : m));
    } finally {
      setStreaming(false);
    }
  }

  // Pergunta vinda de outra tela (ex.: ajuda em um erro da lição)
  useEffect(() => {
    if (startedRef.current || !q) return;
    startedRef.current = true;
    void send(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const quick = [
    { Icon: BookOpen, label: `Explicar ${subject.name}`, text: `Me explique de forma simples o conteúdo principal de ${subject.name} do ${grade.label}.` },
    { Icon: PencilLine, label: "Criar exercícios", text: `Crie 3 exercícios de ${subject.name} para o ${grade.label}, com gabarito no final.` },
    { Icon: Lightbulb, label: "Dicas de estudo", text: `Me dê 3 dicas práticas para estudar melhor ${subject.name} no ${grade.label}.` },
    { Icon: HelpCircle, label: "Onde eu erro mais", text: `Quais são os erros mais comuns em ${subject.name} no ${grade.label} e como evitá-los?` },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar title="IA do Edu" />
      <main className="mx-auto flex max-w-2xl flex-col px-4 py-4">
        {messages.length === 0 && (
          <section className="gradient-hero animate-rise rounded-[28px] p-5 text-primary-foreground shadow-elevated">
            <div className="flex items-center gap-3">
              <Mascot size={84} className="animate-float" priority />
              <div className="min-w-0">
                <h1 className="flex items-center gap-1.5 text-lg font-black leading-tight">
                  <Sparkles className="h-5 w-5" strokeWidth={3} /> Fale com o Edu
                </h1>
                <p className="mt-1 text-xs font-bold opacity-90">
                  Explico matérias, ajudo nos seus erros, dou dicas e crio exercícios só pra você.
                </p>
              </div>
            </div>
          </section>
        )}

        {messages.length === 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {quick.map(({ Icon, label, text }) => (
              <button
                key={label}
                onClick={() => void send(text)}
                className="press card-soft flex items-center gap-3 p-3 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                  <Icon className="h-5 w-5" strokeWidth={3} />
                </span>
                <span className="truncate text-sm font-black">{label}</span>
              </button>
            ))}
          </div>
        )}

        <div ref={listRef} className="mt-4 grid gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "animate-rise max-w-[88%] rounded-3xl px-4 py-3",
                m.role === "user"
                  ? "self-end rounded-br-lg bg-primary text-primary-foreground shadow-soft"
                  : "self-start rounded-bl-lg border-2 border-border bg-card text-card-foreground shadow-soft",
              )}
            >
              {m.role === "assistant" && (
                <span className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Sparkles className="h-3 w-3" strokeWidth={3} /> Edu
                </span>
              )}
              <RichText text={m.content} />
            </div>
          ))}
          {streaming && messages[messages.length - 1]?.role === "user" && (
            <div className="self-start rounded-3xl rounded-bl-lg border-2 border-border bg-card px-4 py-3 shadow-soft">
              <span className="flex gap-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${d * 120}ms` }}
                  />
                ))}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-2xl border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            {error}
          </p>
        )}
      </main>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="fixed inset-x-0 bottom-[72px] z-30 border-t border-border bg-card/95 backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte qualquer coisa ao Edu…"
            className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-muted px-4 py-3 text-sm font-bold outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={streaming || input.trim().length === 0}
            aria-label="Enviar pergunta"
            className="press flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft disabled:opacity-50"
          >
            <Send className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>
      </form>

      <BottomNav />
    </div>
  );
}
