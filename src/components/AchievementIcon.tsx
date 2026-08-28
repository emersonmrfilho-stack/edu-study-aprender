import {
  Award,
  Flame,
  GraduationCap,
  Gem,
  Sparkles,
  Star,
  Trophy,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "first-lesson": Sparkles,
  "streak-3": Flame,
  "streak-7": Flame,
  "streak-30": Trophy,
  "perfect-lesson": Star,
  "xp-1000": Gem,
  "first-exam": ClipboardCheck,
  "subject-master": GraduationCap,
};

/** Ícone profissional da conquista (substitui os emojis). */
export function AchievementIcon({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const Icon = ICONS[id] ?? Award;
  return <Icon aria-hidden className={cn("h-7 w-7", className)} strokeWidth={2.5} />;
}
