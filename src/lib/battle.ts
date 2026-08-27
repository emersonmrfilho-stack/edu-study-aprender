import { unitsFor } from "./curriculum";
import { examExercises, type Exercise } from "./questions";

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Segundos por pergunta na batalha. */
export const BATTLE_SECONDS = 15;

/** Pontos: 100 pela resposta certa + até 100 de bônus por velocidade. */
export function battlePoints(secondsLeft: number) {
  return 100 + Math.round((Math.max(secondsLeft, 0) / BATTLE_SECONDS) * 100);
}

/** Perguntas idênticas para os dois jogadores, determinísticas pela semente. */
export function battleExercises(
  gradeId: string,
  subjectId: string,
  seed: number,
  count: number,
): Exercise[] {
  const units = unitsFor(gradeId, subjectId);
  const unitIndex = units.length > 0 ? seed % units.length : 0;
  const pool = examExercises(gradeId, subjectId, unitIndex);
  const r = mulberry32(seed + 7);
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr.slice(0, count);
}
