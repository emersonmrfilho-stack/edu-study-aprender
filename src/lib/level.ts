/** Sistema de níveis baseado no XP acumulado. */

const STEP = 250;

export type LevelInfo = {
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForLevel: number;
  percent: number;
  xpToNext: number;
};

const TITLES = [
  "Explorador",
  "Aprendiz",
  "Estudante",
  "Curioso",
  "Dedicado",
  "Mestre",
  "Craque",
  "Gênio",
  "Lenda",
];

export function levelInfo(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  const level = Math.floor(safeXp / STEP) + 1;
  const xpIntoLevel = safeXp % STEP;
  return {
    level,
    title: TITLES[Math.min(TITLES.length - 1, level - 1)]!,
    xpIntoLevel,
    xpForLevel: STEP,
    percent: Math.round((xpIntoLevel / STEP) * 100),
    xpToNext: STEP - xpIntoLevel,
  };
}
