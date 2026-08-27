import { Link } from "@tanstack/react-router";
import { Flame, Heart, Gem, Crown } from "lucide-react";
import { useStore } from "@/lib/store";

export function TopBar({ title }: { title?: string }) {
  const { state } = useStore();
  return (
    <header className="safe-top sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-2.5">
        <span className="shrink-0 text-base font-black tracking-tight text-primary">
          {title ?? "Edu Study"}
        </span>
        <div className="flex items-center gap-1.5 text-[13px] font-extrabold">
          <span className="flex items-center gap-1 rounded-full bg-streak/12 px-2 py-1 text-streak">
            <Flame className="h-4 w-4 fill-streak" strokeWidth={2.5} />
            {state.streak}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-gem/12 px-2 py-1 text-gem">
            <Gem className="h-4 w-4" strokeWidth={2.5} />
            {state.gems}
          </span>
          <Link
            to="/premium"
            className="press flex items-center gap-1 rounded-full bg-heart/12 px-2 py-1 text-heart"
            aria-label="Corações e Premium"
          >
            <Heart className="h-4 w-4 fill-heart" strokeWidth={2.5} />
            {state.premium ? "∞" : state.hearts}
          </Link>
          {!state.premium && (
            <Link
              to="/premium"
              className="press hidden items-center gap-1 rounded-full bg-gem/12 px-2 py-1 text-[11px] font-black uppercase text-gem sm:flex"
              aria-label="Assinar Premium"
            >
              <Crown className="h-4 w-4" strokeWidth={3} /> Premium
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
