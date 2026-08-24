import { LESSONS_PER_UNIT, unitsFor } from "./curriculum";
import type { State } from "./store";

export function lessonStatus(
  state: State,
  gradeId: string,
  subjectId: string,
  unitIndex: number,
  lessonIndex: number,
): "done" | "current" | "locked" | "skipped" {
  const id = `${gradeId}-${subjectId}-${unitIndex}-${lessonIndex}`;
  const startUnit = state.profile?.startUnit ?? 0;
  if (state.completed[id] !== undefined) return "done";
  if (unitIndex < startUnit) return "skipped";

  const flat = unitIndex * LESSONS_PER_UNIT + lessonIndex;
  const startFlat = startUnit * LESSONS_PER_UNIT;
  for (let i = startFlat; i < flat; i++) {
    const u = Math.floor(i / LESSONS_PER_UNIT);
    const l = i % LESSONS_PER_UNIT;
    // Ao entrar em uma nova unidade, exige que a prova da unidade anterior tenha sido passada.
    if (l === 0 && u > startUnit) {
      const examKey = `${gradeId}-${subjectId}-${u - 1}`;
      if (!state.examsPassed[examKey]) return "locked";
    }
    if (state.completed[`${gradeId}-${subjectId}-${u}-${l}`] === undefined) return "locked";
  }
  return "current";
}

export function unitLessonsDone(state: State, gradeId: string, subjectId: string, unitIndex: number) {
  for (let l = 0; l < LESSONS_PER_UNIT; l++) {
    if (state.completed[`${gradeId}-${subjectId}-${unitIndex}-${l}`] === undefined) return false;
  }
  return true;
}

export function examStatus(
  state: State,
  gradeId: string,
  subjectId: string,
  unitIndex: number,
): "locked" | "available" | "passed" {
  const key = `${gradeId}-${subjectId}-${unitIndex}`;
  if (state.examsPassed[key]) return "passed";
  if (!unitLessonsDone(state, gradeId, subjectId, unitIndex)) return "locked";
  return "available";
}

export function subjectProgress(state: State, gradeId: string, subjectId: string) {
  const units = unitsFor(gradeId, subjectId);
  const total = units.length * LESSONS_PER_UNIT;
  let done = 0;
  for (const u of units)
    for (const l of u.lessons) if (state.completed[l.id] !== undefined) done++;
  const skipped = Math.min(total, (state.profile?.startUnit ?? 0) * LESSONS_PER_UNIT);
  return { done, total, percent: total ? Math.round(((done + skipped) / total) * 100) : 0 };
}

export function nextLessonId(state: State, gradeId: string, subjectId: string) {
  const units = unitsFor(gradeId, subjectId);
  for (const u of units)
    for (const l of u.lessons)
      if (lessonStatus(state, gradeId, subjectId, u.index, l.lessonIndex) === "current") return l.id;
  return units[0]?.lessons[0]?.id ?? null;
}
