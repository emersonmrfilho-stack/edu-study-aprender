import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Pencil, ArrowLeft } from "lucide-react";
import { GRADES, SUBJECTS, subjectsForGrade, unitsFor } from "@/lib/curriculum";
import {
  createActivity,
  deleteActivity,
  listActivities,
  updateActivity,
  type CustomActivity,
} from "@/lib/activities";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/atividades")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Gerenciar atividades — Edu Study" },
      { name: "description", content: "Crie, edite e exclua atividades personalizadas das lições do Edu Study." },
      { property: "og:title", content: "Gerenciar atividades — Edu Study" },
      { property: "og:description", content: "Painel de atividades personalizadas do Edu Study." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AtividadesPage,
});

type Draft = {
  kind: "select" | "truefalse" | "type" | "assemble";
  prompt: string;
  options: string[];
  answer_index: number;
  answer_text: string;
  answer_bool: boolean;
  explanation: string;
};

const emptyDraft: Draft = {
  kind: "select",
  prompt: "",
  options: ["", "", "", ""],
  answer_index: 0,
  answer_text: "",
  answer_bool: true,
  explanation: "",
};

function AtividadesPage() {
  const [gradeId, setGradeId] = useState(GRADES[0]!.id);
  const [subjectId, setSubjectId] = useState("matematica");
  const [unitIndex, setUnitIndex] = useState(0);
  const [items, setItems] = useState<CustomActivity[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subjects = subjectsForGrade(gradeId);
  const units = unitsFor(gradeId, subjectId);

  useEffect(() => {
    if (!subjects.some((s) => s.id === subjectId)) setSubjectId(subjects[0]?.id ?? "matematica");
  }, [gradeId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function reload() {
    setLoading(true);
    try {
      setItems(await listActivities({ gradeId, subjectId, unitIndex }));
    } catch {
      setMsg("Não foi possível carregar as atividades.");
    }
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, [gradeId, subjectId, unitIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetForm() {
    setDraft(emptyDraft);
    setEditingId(null);
  }

  async function save() {
    if (!draft.prompt.trim()) {
      setMsg("Escreva o enunciado da atividade.");
      return;
    }
    const payload = {
      grade_id: gradeId,
      subject_id: subjectId,
      unit_index: unitIndex,
      kind: draft.kind,
      prompt: draft.prompt.trim(),
      options: draft.kind === "select" ? draft.options.filter((o) => o.trim()) : [],
      answer_index: draft.answer_index,
      answer_text: draft.kind === "type" || draft.kind === "assemble" ? draft.answer_text.trim() : null,
      answer_bool: draft.kind === "truefalse" ? draft.answer_bool : null,
      explanation: draft.explanation.trim() || null,
    };
    try {
      if (editingId) await updateActivity(editingId, payload);
      else await createActivity(payload);
      setMsg(editingId ? "Atividade atualizada." : "Atividade criada.");
      resetForm();
      await reload();
    } catch {
      setMsg("Erro ao salvar a atividade.");
    }
  }

  function edit(a: CustomActivity) {
    setEditingId(a.id);
    setDraft({
      kind: (a.kind as Draft["kind"]) ?? "select",
      prompt: a.prompt,
      options: a.options.length ? [...a.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""],
      answer_index: a.answer_index,
      answer_text: a.answer_text ?? "",
      answer_bool: a.answer_bool ?? true,
      explanation: a.explanation ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    try {
      await deleteActivity(id);
      setMsg("Atividade excluída.");
      await reload();
    } catch {
      setMsg("Erro ao excluir.");
    }
  }

  const field = "w-full rounded-2xl border-2 border-border bg-card px-4 py-3 font-bold outline-none focus:border-primary";

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-28 pt-6">
      <Link to="/perfil" className="mb-4 inline-flex items-center gap-2 font-black uppercase text-muted-foreground">
        <ArrowLeft className="h-5 w-5" strokeWidth={3} /> Voltar
      </Link>
      <h1 className="text-2xl font-black">Gerenciar atividades</h1>
      <p className="mt-1 text-sm font-bold text-muted-foreground">
        As atividades criadas aqui aparecem primeiro na lição escolhida.
      </p>

      <div className="mt-5 grid gap-3">
        <select className={field} value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
          {GRADES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        <select className={field} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className={field} value={unitIndex} onChange={(e) => setUnitIndex(Number(e.target.value))}>
          {units.map((u, i) => (
            <option key={u.title} value={i}>
              {i + 1}. {u.title}
            </option>
          ))}
        </select>
      </div>

      <section className="card-soft mt-6 rounded-3xl border-2 border-border bg-card p-4">
        <h2 className="text-lg font-black">{editingId ? "Editar atividade" : "Nova atividade"}</h2>
        <div className="mt-3 grid gap-3">
          <select
            className={field}
            value={draft.kind}
            onChange={(e) => setDraft({ ...draft, kind: e.target.value as Draft["kind"] })}
          >
            <option value="select">Múltipla escolha</option>
            <option value="truefalse">Verdadeiro ou falso</option>
            <option value="type">Resposta digitada</option>
            <option value="assemble">Montar frase</option>
          </select>

          <textarea
            className={field}
            rows={3}
            placeholder="Enunciado"
            value={draft.prompt}
            onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
          />

          {draft.kind === "select" &&
            draft.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, answer_index: i })}
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-full border-2 border-border font-black",
                    draft.answer_index === i && "border-primary bg-primary text-primary-foreground",
                  )}
                  aria-label={`Marcar alternativa ${i + 1} como correta`}
                >
                  {i + 1}
                </button>
                <input
                  className={field}
                  placeholder={`Alternativa ${i + 1}`}
                  value={o}
                  onChange={(e) => {
                    const options = [...draft.options];
                    options[i] = e.target.value;
                    setDraft({ ...draft, options });
                  }}
                />
              </div>
            ))}

          {draft.kind === "truefalse" && (
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setDraft({ ...draft, answer_bool: v })}
                  className={cn(
                    "flex-1 rounded-2xl border-2 border-border px-4 py-3 font-black uppercase",
                    draft.answer_bool === v && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {v ? "Verdadeiro" : "Falso"}
                </button>
              ))}
            </div>
          )}

          {(draft.kind === "type" || draft.kind === "assemble") && (
            <input
              className={field}
              placeholder={draft.kind === "type" ? "Resposta correta" : "Frase completa na ordem certa"}
              value={draft.answer_text}
              onChange={(e) => setDraft({ ...draft, answer_text: e.target.value })}
            />
          )}

          <input
            className={field}
            placeholder="Explicação (opcional)"
            value={draft.explanation}
            onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
          />

          <div className="flex gap-2">
            <button
              onClick={() => void save()}
              className="btn-3d flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-primary/60 bg-primary px-4 py-3 font-black uppercase text-primary-foreground"
            >
              {editingId ? <Save className="h-5 w-5" strokeWidth={3} /> : <Plus className="h-5 w-5" strokeWidth={3} />}
              {editingId ? "Salvar" : "Criar"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-2xl border-2 border-border px-4 py-3 font-black uppercase text-muted-foreground"
              >
                Cancelar
              </button>
            )}
          </div>
          {msg && <p className="text-sm font-black text-primary">{msg}</p>}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-black">Atividades desta unidade</h2>
        {loading && <p className="mt-2 font-bold text-muted-foreground">Carregando…</p>}
        {!loading && items.length === 0 && (
          <p className="mt-2 font-bold text-muted-foreground">Nenhuma atividade personalizada ainda.</p>
        )}
        <ul className="mt-3 grid gap-3">
          {items.map((a) => (
            <li key={a.id} className="card-soft rounded-2xl border-2 border-border bg-card p-4">
              <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                {SUBJECTS[a.subject_id]?.name ?? a.subject_id} · {a.kind}
              </p>
              <p className="mt-1 font-extrabold">{a.prompt}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => edit(a)}
                  className="inline-flex items-center gap-1 rounded-xl border-2 border-border px-3 py-2 text-xs font-black uppercase"
                >
                  <Pencil className="h-4 w-4" strokeWidth={3} /> Editar
                </button>
                <button
                  onClick={() => void remove(a.id)}
                  className="inline-flex items-center gap-1 rounded-xl border-2 border-wrong-foreground/40 px-3 py-2 text-xs font-black uppercase text-wrong-foreground"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={3} /> Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
