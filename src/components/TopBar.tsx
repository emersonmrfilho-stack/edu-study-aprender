import { Link } from "@tanstack/react-router";
import { Flame, Heart, Gem, Crown } from "lucide-react";
import { useStore } from "@/lib/store";

export function TopBar() {
  const { state } = useStore();
  return (
    <header className="sticky top-0 z-30 border-b-2 border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <span className="text-lg font-black tracking-tight text-primary">Edu Study</span>
        <div className="flex items-center gap-4 text-sm font-extrabold">
          <span className="flex items-center gap-1 text-streak">
            <Flame className="h-5 w-5 fill-streak" strokeWidth={2.5} />
            {state.streak}
          </span>
          <span className="flex items-center gap-1 text-gem">
            <Gem className="h-5 w-5" strokeWidth={2.5} />
            {state.gems}
          </span>
          <Link to="/premium" className="flex items-center gap-1 text-heart" aria-label="Corações e Premium">
            <Heart className="h-5 w-5 fill-heart" strokeWidth={2.5} />
            {state.premium ? "∞" : state.hearts}
          </Link>
          {!state.premium && (
            <Link
              to="/premium"
              className="flex items-center gap-1 rounded-full border-2 border-gem/50 bg-gem/10 px-2 py-0.5 text-[11px] font-black uppercase text-gem"
            >
              <Crown className="h-4 w-4" strokeWidth={3} /> Premium
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
