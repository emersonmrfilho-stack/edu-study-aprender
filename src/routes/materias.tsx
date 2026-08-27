import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { GRADES, getGrade, subjectsForGrade, totalLessons } from "@/lib/curriculum";
import { subjectProgress } from "@/lib/progress";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/materias")({
  head: () => ({
    meta: [
      { title: "Matérias do seu ano — Edu Study" },
      {
        name: "description",
        content: "Veja todas as matérias do seu ano escolar e acompanhe seu progresso em cada uma delas.",
      },
      { property: "og:title", content: "Matérias do seu ano — Edu Study" },
      { property: "og:description", content: "Progresso por matéria, do 1º ano ao 3º ano do Ensino Médio." },
    ],
  }),
  component: Materias,
});

function Materias() {
  const { state, ready, setSubject, setProfile } = useStore();
  const navigate = useNavigate();

  if (!ready || !state.profile) return <div className="min-h-screen bg-background" />;
  const grade = getGrade(state.profile.gradeId);
  const subjects = subjectsForGrade(grade.id);

  return (
    <div className="min-h-screen bg-background pb-28">
      <TopBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-black">Minhas matérias</h1>
        <p className="mt-1 text-sm font-bold text-muted-foreground">{grade.label}</p>

        <label className="mt-5 block text-xs font-black uppercase tracking-widest text-muted-foreground">
          Trocar de ano escolar
        </label>
        <select
          value={grade.id}
          onChange={(e) => setProfile({ ...state.profile!, gradeId: e.target.value })}
          className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-base font-extrabold shadow-soft"
        >
          {GRADES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>

        <ul className="mt-6 grid gap-3">
          {subjects.map((s) => {
            const p = subjectProgress(state, grade.id, s.id);
            return (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setSubject(s.id);
                    navigate({ to: "/trilha" });
                  }}
                  className="press lift card-soft w-full p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {s.emoji}
                    </span>
                    <div className="flex-1">
                      <p className="text-base font-black">{s.name}</p>
                      <p className="text-xs font-bold text-muted-foreground">
                        {p.done} de {totalLessons(grade.id, s.id)} lições concluídas
                      </p>
                    </div>
                    <span className="text-sm font-black" style={{ color: `var(--${s.color})` }}>
                      {p.percent}%
                    </span>
                  </div>
                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${p.percent}%`, backgroundColor: `var(--${s.color})` }}
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </main>
      <BottomNav />
    </div>
  );
}
