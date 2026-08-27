import { useCallback, useEffect, useMemo } from "react";
import { SFX, type SfxName } from "@/lib/sound";
import { useStore } from "@/lib/store";

/** Toca efeitos sonoros respeitando a preferência do usuário. */
export function useSfx() {
  const { state } = useStore();
  const enabled = state.soundEnabled;

  const play = useCallback((name: SfxName) => SFX[name](enabled), [enabled]);

  return useMemo(() => ({ play, enabled }), [play, enabled]);
}

/** Som sutil em qualquer clique de botão/link do app. */
export function useGlobalClickSound() {
  const { state } = useStore();
  const enabled = state.soundEnabled;

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    const onPointerDown = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.(
        "button, a, [role='button'], input[type='checkbox'], input[type='radio'], select, label[for]",
      ) as HTMLElement | null;
      if (!el) return;
      if (el.hasAttribute("data-no-click-sound")) return;
      if (el instanceof HTMLButtonElement && el.disabled) return;
      if (el.getAttribute("aria-disabled") === "true") return;
      SFX.click(true);
    };
    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [enabled]);
}
