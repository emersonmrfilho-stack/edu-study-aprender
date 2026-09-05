import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  Leaf,
  Magnet,
  PenTool,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  matematica: Calculator,
  portugues: BookOpen,
  ciencias: FlaskConical,
  historia: Landmark,
  geografia: Globe2,
  ingles: Languages,
  espanhol: Languages,

  fisica: Magnet,
  quimica: Atom,
  biologia: Leaf,
  literatura: PenTool,
  filosofia: Brain,
  sociologia: Users,
};

/** Ícone profissional da matéria (substitui os emojis). */
export function SubjectIcon({
  subjectId,
  className,
  strokeWidth = 2.5,
}: {
  subjectId: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[subjectId] ?? BookOpen;
  return <Icon aria-hidden className={cn("h-5 w-5", className)} strokeWidth={strokeWidth} />;
}
