import { useGlobalClickSound } from "@/hooks/useSfx";

/** Ativa o som global de clique (precisa estar dentro do StoreProvider). */
export function SoundLayer() {
  useGlobalClickSound();
  return null;
}
