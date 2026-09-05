import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "@/lib/questions";

export type CustomActivity = {
  id: string;
  grade_id: string;
  subject_id: string;
  unit_index: number;
  kind: string;
  prompt: string;
  options: string[];
  answer_index: number;
  answer_text: string | null;
  answer_bool: boolean | null;
  explanation: string | null;
};

function asRow(r: Record<string, unknown>): CustomActivity {
  return {
    id: String(r.id),
    grade_id: String(r.grade_id),
    subject_id: String(r.subject_id),
    unit_index: Number(r.unit_index ?? 0),
    kind: String(r.kind ?? "select"),
    prompt: String(r.prompt ?? ""),
    options: Array.isArray(r.options) ? (r.options as string[]).map(String) : [],
    answer_index: Number(r.answer_index ?? 0),
    answer_text: (r.answer_text as string | null) ?? null,
    answer_bool: (r.answer_bool as boolean | null) ?? null,
    explanation: (r.explanation as string | null) ?? null,
  };
}

/** Converte uma atividade do painel em exercício jogável. */
export function toExercise(a: CustomActivity): Exercise {
  const explanation = a.explanation ?? undefined;
  if (a.kind === "truefalse") {
    return { kind: "truefalse", prompt: a.prompt, answer: a.answer_bool ?? true, explanation };
  }
  if (a.kind === "type") {
    return { kind: "type", prompt: a.prompt, answer: a.answer_text ?? "", explanation };
  }
  if (a.kind === "assemble") {
    return { kind: "assemble", prompt: a.prompt, sentence: a.answer_text ?? "", explanation };
  }
  const options = a.options.length >= 2 ? a.options : ["Verdadeiro", "Falso"];
  return {
    kind: "select",
    prompt: a.prompt,
    options,
    answer: Math.min(Math.max(a.answer_index, 0), options.length - 1),
    explanation,
  };
}

export async function listActivities(filter?: {
  gradeId?: string;
  subjectId?: string;
  unitIndex?: number;
}): Promise<CustomActivity[]> {
  let q = supabase.from("custom_activities").select("*").order("created_at", { ascending: false });
  if (filter?.gradeId) q = q.eq("grade_id", filter.gradeId);
  if (filter?.subjectId) q = q.eq("subject_id", filter.subjectId);
  if (typeof filter?.unitIndex === "number") q = q.eq("unit_index", filter.unitIndex);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => asRow(r as Record<string, unknown>));
}

export async function createActivity(input: Omit<CustomActivity, "id">) {
  const { error } = await supabase.from("custom_activities").insert(input);
  if (error) throw error;
}

export async function updateActivity(id: string, input: Partial<Omit<CustomActivity, "id">>) {
  const { error } = await supabase.from("custom_activities").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteActivity(id: string) {
  const { error } = await supabase.from("custom_activities").delete().eq("id", id);
  if (error) throw error;
}

/** Exercícios personalizados de uma lição (mesclados aos gerados). */
export async function customExercisesFor(gradeId: string, subjectId: string, unitIndex: number): Promise<Exercise[]> {
  try {
    const rows = await listActivities({ gradeId, subjectId, unitIndex });
    return rows.map(toExercise);
  } catch {
    return [];
  }
}
