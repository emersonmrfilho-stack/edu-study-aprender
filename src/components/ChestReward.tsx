import { useMemo, useState } from "react";
import { Gem, Sparkles } from "lucide-react";
import { playOpen, playReward, playSelect } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Rarity = {
  id: string;
  name: string;
  min: number;
  max: number;
  ring: string;
  bg: string;
  text: string;
  chance: number;
};

/** Raridades do baú — quanto mais raro, mais gemas (máx. 1500). */
export const CHEST_RARITIES: Rarity[] = [
  { id: "comum", name: "Comum", min: 20, max: 60, ring: "border-muted-foreground/40", bg: "bg-muted", text: "text-muted-foreground", chance: 0.44 },
  { id: "raro", name: "Raro", min: 70, max: 180, ring: "border-primary/60", bg: "bg-primary/10", text: "text-primary", chance: 0.3 },
  { id: "epico", name: "Épico", min: 200, max: 500, ring: "border-streak/60", bg: "bg-streak/10", text: "text-streak", chance: 0.18 },
  { id: "lendario", name: "Lendário", min: 600, max: 1100, ring: "border-gem/70", bg: "bg-gem/10", text: "text-gem", chance: 0.06 },
  { id: "mitico", name: "Mítico", min: 1200, max: 1500, ring: "border-heart/70", bg: "bg-heart/10", text: "text-heart", chance: 0.02 },
];

const CLICKS_NEEDED = 5;

function rollRarity(): Rarity {
  const r = Math.random();
  let acc = 0;
  for (const rarity of CHEST_RARITIES) {
    acc += rarity.chance;
    if (r <= acc) return rarity;
  }
  return CHEST_RARITIES[0]!;
}

/** Cada clique pode fazer o baú "evoluir" de raridade. */
function upgrade(current: Rarity): Rarity {
  const idx = CHEST_RARITIES.findIndex((r) => r.id === current.id);
  const next = CHEST_RARITIES[idx + 1];
  if (!next) return current;
  // chance de evoluir diminui conforme a raridade sobe
  const odds = [0.45, 0.3, 0.18, 0.08][idx] ?? 0;
  return Math.random() < odds ? next : current;
}

export function ChestReward({ onDone }: { onDone?: (gems: number) => void }) {
  const { state, addGems } = useStore();
  const [clicks, setClicks] = useState(0);
  const [rarity, setRarity] = useState<Rarity>(() => rollRarity());
  const [opened, setOpened] = useState(false);
  const [reward, setReward] = useState(0);

  const progress = useMemo(() => (clicks / CLICKS_NEEDED) * 100, [clicks]);

  function hit() {
    if (opened) return;
    const nextClicks = clicks + 1;
    setClicks(nextClicks);
    const nextRarity = upgrade(rarity);
    if (nextRarity.id !== rarity.id) {
      setRarity(nextRarity);
      playSelect(state.soundEnabled);
    } else {
      playOpen(state.soundEnabled);
    }
    if (nextClicks >= CLICKS_NEEDED) {
      const gems = Math.min(
        1500,
        Math.round(nextRarity.min + Math.random() * (nextRarity.max - nextRarity.min)),
      );
      setReward(gems);
      setOpened(true);
      addGems(gems);
      playReward(state.soundEnabled);
      onDone?.(gems);
    }
  }

  return (
    <div className={cn("w-full max-w-sm rounded-3xl border-2 p-5 text-center", rarity.ring, rarity.bg)}>
      <p className={cn("text-xs font-black uppercase tracking-widest", rarity.text)}>
        Baú {rarity.name}
      </p>

      <button
        type="button"
        onClick={hit}
        disabled={opened}
        aria-label={opened ? "Baú aberto" : "Bater no baú"}
        className={cn(
          "press mx-auto mt-4 flex h-40 w-40 items-center justify-center rounded-3xl border-4 bg-card transition-transform",
          rarity.ring,
          !opened && "animate-pulse hover:scale-105 active:scale-95",
        )}
      >
        <ChestArt open={opened} className={rarity.text} />
      </button>

      {!opened ? (
        <>
          <p className="mt-4 text-sm font-black uppercase text-muted-foreground">
            Clique {CLICKS_NEEDED - clicks}x para abrir
          </p>
          <div className="mx-auto mt-2 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full bg-primary transition-all")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-muted-foreground">
            <Sparkles className="h-4 w-4" strokeWidth={3} />A cada clique o baú pode ficar mais raro!
          </p>
        </>
      ) : (
        <div className="mt-4">
          <p className={cn("text-sm font-black uppercase", rarity.text)}>Você abriu um baú {rarity.name}</p>
          <p className="mt-1 flex items-center justify-center gap-2 text-4xl font-black text-gem">
            <Gem className="h-8 w-8 fill-gem/20" strokeWidth={2.5} />+{reward}
          </p>
          <p className="mt-1 text-xs font-bold uppercase text-muted-foreground">gemas adicionadas</p>
        </div>
      )}
    </div>
  );
}

function ChestArt({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={cn("h-28 w-28", className)} aria-hidden="true">
      <g
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="round"
        className="opacity-95"
      >
        <g
          style={{
            transform: open ? "rotate(-24deg)" : "none",
            transformOrigin: "18px 44px",
            transition: "transform 300ms ease",
          }}
        >
          <path d="M16 44 A44 30 0 0 1 104 44 Z" fillOpacity={0.35} />
        </g>
        <rect x="16" y="48" width="88" height="40" rx="8" fillOpacity={0.18} />
        <rect x="52" y="52" width="16" height="20" rx="4" fillOpacity={0.9} />
      </g>
    </svg>
  );
}
