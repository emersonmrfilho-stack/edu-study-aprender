import { supabase } from "@/integrations/supabase/client";
import type { State } from "./store";

/** Lê o progresso salvo na nuvem do usuário logado. */
export async function fetchRemoteState(userId: string): Promise<Partial<State> | null> {
  const { data, error } = await supabase
    .from("progress")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("Erro ao carregar progresso da nuvem", error);
    return null;
  }
  return (data?.state as Partial<State> | undefined) ?? null;
}

/** Salva (cria ou atualiza) o progresso do usuário logado. */
export async function saveRemoteState(userId: string, state: State) {
  const { error } = await supabase
    .from("progress")
    .upsert({ user_id: userId, state: state as unknown as Record<string, unknown> });
  if (error) console.error("Erro ao salvar progresso na nuvem", error);
}

/** Decide qual progresso vale mais: o local ou o da nuvem. */
export function pickRicher(local: State, remote: Partial<State>): boolean {
  const localScore = local.xp + Object.keys(local.completed ?? {}).length * 5;
  const remoteScore = (remote.xp ?? 0) + Object.keys(remote.completed ?? {}).length * 5;
  return remoteScore >= localScore;
}
