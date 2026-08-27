/** Desafios diários, semanais e mensais — gerados de forma determinística pela data. */

export type ChallengePeriod = "daily" | "weekly" | "monthly";

export type Challenge = {
  id: string;
  period: ChallengePeriod;
  title: string;
  description: string;
  metric: "lessons" | "correct" | "xp";
  goal: number;
  reward: number; // gemas
};

export type DayStats = { lessons: number; correct: number; xp: number };

export const EMPTY_DAY: DayStats = { lessons: 0, correct: 0, xp: 0 };

export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

/** Chave ISO da semana (segunda a domingo). */
export function weekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const DAILY: Omit<Challenge, "id" | "period">[] = [
  { title: "Aquecimento", description: "Complete 1 lição hoje", metric: "lessons", goal: 1, reward: 20 },
  { title: "Ritmo bom", description: "Complete 2 lições hoje", metric: "lessons", goal: 2, reward: 35 },
  { title: "Mira certeira", description: "Acerte 15 questões hoje", metric: "correct", goal: 15, reward: 30 },
  { title: "Caçador de XP", description: "Ganhe 60 XP hoje", metric: "xp", goal: 60, reward: 30 },
];

const WEEKLY: Omit<Challenge, "id" | "period">[] = [
  { title: "Semana firme", description: "Complete 8 lições nesta semana", metric: "lessons", goal: 8, reward: 120 },
  { title: "Cérebro afiado", description: "Acerte 80 questões nesta semana", metric: "correct", goal: 80, reward: 140 },
  { title: "Maratona de XP", description: "Ganhe 400 XP nesta semana", metric: "xp", goal: 400, reward: 150 },
];

const MONTHLY: Omit<Challenge, "id" | "period">[] = [
  { title: "Mês dedicado", description: "Complete 30 lições neste mês", metric: "lessons", goal: 30, reward: 400 },
  { title: "Mestre das questões", description: "Acerte 300 questões neste mês", metric: "correct", goal: 300, reward: 450 },
  { title: "Lenda do XP", description: "Ganhe 1500 XP neste mês", metric: "xp", goal: 1500, reward: 500 },
];

function pick<T>(list: T[], seed: string, count: number): T[] {
  const start = hash(seed) % list.length;
  return Array.from({ length: Math.min(count, list.length) }, (_, i) => list[(start + i) % list.length]!);
}

/** Desafios ativos agora (2 diários, 1 semanal, 1 mensal). */
export function activeChallenges(now = new Date()): Challenge[] {
  const d = dayKey(now);
  const w = weekKey(now);
  const m = monthKey(now);
  return [
    ...pick(DAILY, d, 2).map((c, i) => ({ ...c, period: "daily" as const, id: `d:${d}:${i}:${c.metric}${c.goal}` })),
    ...pick(WEEKLY, w, 1).map((c) => ({ ...c, period: "weekly" as const, id: `w:${w}:${c.metric}${c.goal}` })),
    ...pick(MONTHLY, m, 1).map((c) => ({ ...c, period: "monthly" as const, id: `m:${m}:${c.metric}${c.goal}` })),
  ];
}

/** Soma as estatísticas do período do desafio. */
export function progressFor(
  challenge: Challenge,
  activity: Record<string, DayStats>,
  now = new Date(),
): number {
  const keys = Object.keys(activity);
  const inPeriod = keys.filter((k) => {
    const d = new Date(`${k}T12:00:00Z`);
    if (challenge.period === "daily") return k === dayKey(now);
    if (challenge.period === "weekly") return weekKey(d) === weekKey(now);
    return monthKey(d) === monthKey(now);
  });
  return inPeriod.reduce((sum, k) => sum + (activity[k]?.[challenge.metric] ?? 0), 0);
}

export const PERIOD_LABEL: Record<ChallengePeriod, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
};

/** Recuperação de ofensiva: erra 60% ou mais → não recupera. */
export const RESCUE_QUESTIONS = 5;
export function rescueSucceeded(correct: number, total = RESCUE_QUESTIONS) {
  return total > 0 && (total - correct) / total < 0.6;
}
