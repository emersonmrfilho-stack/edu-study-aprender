import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", Icon: Home, match: ["/"] },
  { to: "/materias", label: "Estudos", Icon: BookOpen, match: ["/materias", "/trilha", "/praticar", "/edu-ia", "/desafios"] },
  { to: "/ranking", label: "Ranking", Icon: Trophy, match: ["/ranking", "/amigos"] },
  { to: "/perfil", label: "Perfil", Icon: User, match: ["/perfil", "/premium"] },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg">
      <ul className="safe-bottom mx-auto flex max-w-2xl items-stretch justify-between gap-1 px-2 pt-2">
        {items.map(({ to, label, Icon, match }) => {
          const active = (match as readonly string[]).some(
            (m) => pathname === m || (m !== "/" && pathname.startsWith(m)),
          );
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "press flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground",
                  active && "text-primary",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/12",
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.8 : 2.2} />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
