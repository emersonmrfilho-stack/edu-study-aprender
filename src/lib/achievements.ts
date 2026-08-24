import type { Achievement } from "./store";

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-lesson",
    title: "Primeira lição",
    description: "Complete sua primeira lição no Edu Study.",
    icon: "🌟",
  },
  {
    id: "streak-3",
    title: "Três dias seguidos",
    description: "Estude 3 dias seguidos.",
    icon: "🔥",
  },
  {
    id: "streak-7",
    title: "Uma semana de ofensiva",
    description: "Estude 7 dias seguidos.",
    icon: "🔥🔥",
  },
  {
    id: "streak-30",
    title: "Ofensiva de um mês",
    description: "Estude 30 dias seguidos.",
    icon: "🏆",
  },
  {
    id: "perfect-lesson",
    title: "Lição perfeita",
    description: "Acerte todas as questões de uma lição.",
    icon: "⭐",
  },
  {
    id: "xp-1000",
    title: "Mil de XP",
    description: "Acumule 1.000 pontos de XP.",
    icon: "💎",
  },
  {
    id: "first-exam",
    title: "Primeira prova",
    description: "Passe em uma prova de unidade.",
    icon: "📝",
  },
  {
    id: "subject-master",
    title: "Mestre da matéria",
    description: "Complete 100% de uma matéria.",
    icon: "🎓",
  },
];

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
