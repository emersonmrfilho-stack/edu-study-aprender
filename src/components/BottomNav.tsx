import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Dumbbell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Aprender", Icon: Home },
  { to: "/materias", label: "Matérias", Icon: BookOpen },
  { to: "/praticar", label: "Praticar", Icon: Dumbbell },
  { to: "/perfil", label: "Perfil", Icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-card">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2 py-2">
        {items.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl border-2 border-transparent px-2 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground transition-colors",
                  active && "border-primary/40 bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={2.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
