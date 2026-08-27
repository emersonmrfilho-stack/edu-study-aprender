import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";

export type PublicProfile = {
  user_id: string;
  username: string;
  display_name: string;
  grade_id: string | null;
  xp: number;
};

/** Perfil público do usuário logado (ou null se ainda não criou apelido). */
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("user_id, username, display_name, grade_id, xp")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as PublicProfile | null) ?? null;
  });

/** Cria ou atualiza o perfil público (apelido único). */
export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        username: z
          .string()
          .trim()
          .toLowerCase()
          .regex(/^[a-z0-9._]{3,20}$/, "Use de 3 a 20 caracteres: letras, números, ponto ou _"),
        displayName: z.string().trim().min(2).max(40),
        gradeId: z.string().trim().min(1).nullable().default(null),
        xp: z.number().int().min(0).default(0),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("profiles")
      .upsert(
        {
          user_id: context.userId,
          username: data.username,
          display_name: data.displayName,
          grade_id: data.gradeId,
          xp: data.xp,
        },
        { onConflict: "user_id" },
      )
      .select("user_id, username, display_name, grade_id, xp")
      .single();
    if (error) {
      if (error.code === "23505" || error.message.includes("duplicate key")) {
        throw new Error("Esse nome de usuário já está em uso. Escolha outro.");
      }
      throw new Error(error.message);
    }
    return row as PublicProfile;
  });

/** Busca amigos por apelido ou nome. */
export const searchProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ q: z.string().trim().min(2).max(40) }).parse(data))
  .handler(async ({ data, context }) => {
    const term = data.q.replace(/[%,]/g, "");
    const { data: rows, error } = await context.supabase
      .from("profiles")
      .select("user_id, username, display_name, grade_id, xp")
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .neq("user_id", context.userId)
      .limit(20);
    if (error) throw new Error(error.message);
    return (rows as PublicProfile[]) ?? [];
  });

/** Lista amizades (aceitas e pendentes) com os perfis das pessoas. */
export const listFriends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: links, error } = await context.supabase
      .from("friendships")
      .select()
      .or(`requester_id.eq.${context.userId},addressee_id.eq.${context.userId}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (links as Tables<"friendships">[]) ?? [];
    const otherIds = rows.map((r) =>
      r.requester_id === context.userId ? r.addressee_id : r.requester_id,
    );
    let profiles: PublicProfile[] = [];
    if (otherIds.length > 0) {
      const { data: profs, error: pErr } = await context.supabase
        .from("profiles")
        .select("user_id, username, display_name, grade_id, xp")
        .in("user_id", otherIds);
      if (pErr) throw new Error(pErr.message);
      profiles = (profs as PublicProfile[]) ?? [];
    }
    return rows.map((r) => {
      const otherId = r.requester_id === context.userId ? r.addressee_id : r.requester_id;
      return {
        id: r.id,
        status: r.status,
        incoming: r.addressee_id === context.userId && r.status === "pending",
        outgoing: r.requester_id === context.userId && r.status === "pending",
        profile: profiles.find((p) => p.user_id === otherId) ?? null,
      };
    });
  });

/** Envia pedido de amizade. */
export const requestFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("Você não pode adicionar a si mesmo.");
    const { data: existing } = await context.supabase
      .from("friendships")
      .select()
      .or(
        `and(requester_id.eq.${context.userId},addressee_id.eq.${data.userId}),and(requester_id.eq.${data.userId},addressee_id.eq.${context.userId})`,
      )
      .maybeSingle();
    if (existing) return existing as Tables<"friendships">;
    const { data: row, error } = await context.supabase
      .from("friendships")
      .insert({ requester_id: context.userId, addressee_id: data.userId, status: "pending" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as Tables<"friendships">;
  });

/** Aceita ou recusa/remove uma amizade. */
export const respondFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ friendshipId: z.string().uuid(), accept: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    if (!data.accept) {
      const { error } = await context.supabase
        .from("friendships")
        .delete()
        .eq("id", data.friendshipId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", data.friendshipId)
      .eq("addressee_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Cria uma batalha contra um amigo. */
export const createBattle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        opponentId: z.string().uuid(),
        subjectId: z.string().min(1).default("matematica"),
        gradeId: z.string().min(1).default("f5a"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: link } = await context.supabase
      .from("friendships")
      .select()
      .eq("status", "accepted")
      .or(
        `and(requester_id.eq.${context.userId},addressee_id.eq.${data.opponentId}),and(requester_id.eq.${data.opponentId},addressee_id.eq.${context.userId})`,
      )
      .maybeSingle();
    if (!link) throw new Error("Vocês precisam ser amigos para batalhar.");
    const { data: row, error } = await context.supabase
      .from("battles")
      .insert({
        challenger_id: context.userId,
        opponent_id: data.opponentId,
        subject_id: data.subjectId,
        grade_id: data.gradeId,
        seed: Math.floor(Math.random() * 100000),
        question_count: 5,
        status: "active",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as Tables<"battles">;
  });

/** Lista batalhas do usuário com o perfil do adversário. */
export const listBattles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("battles")
      .select()
      .or(`challenger_id.eq.${context.userId},opponent_id.eq.${context.userId}`)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    const battles = (rows as Tables<"battles">[]) ?? [];
    const ids = battles.map((b) =>
      b.challenger_id === context.userId ? b.opponent_id : b.challenger_id,
    );
    let profiles: PublicProfile[] = [];
    if (ids.length > 0) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("user_id, username, display_name, grade_id, xp")
        .in("user_id", ids);
      profiles = (profs as PublicProfile[]) ?? [];
    }
    return battles.map((b) => {
      const iAmChallenger = b.challenger_id === context.userId;
      const otherId = iAmChallenger ? b.opponent_id : b.challenger_id;
      return {
        battle: b,
        iAmChallenger,
        myScore: iAmChallenger ? b.challenger_score : b.opponent_score,
        theirScore: iAmChallenger ? b.opponent_score : b.challenger_score,
        myTurnDone: iAmChallenger ? b.challenger_finished : b.opponent_finished,
        opponent: profiles.find((p) => p.user_id === otherId) ?? null,
      };
    });
  });

/** Detalhes de uma batalha (só participantes). */
export const getBattle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ battleId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("battles")
      .select()
      .eq("id", data.battleId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Batalha não encontrada.");
    const b = row as Tables<"battles">;
    const iAmChallenger = b.challenger_id === context.userId;
    const otherId = iAmChallenger ? b.opponent_id : b.challenger_id;
    const { data: prof } = await context.supabase
      .from("profiles")
      .select("user_id, username, display_name, grade_id, xp")
      .eq("user_id", otherId)
      .maybeSingle();
    return {
      battle: b,
      iAmChallenger,
      myScore: iAmChallenger ? b.challenger_score : b.opponent_score,
      theirScore: iAmChallenger ? b.opponent_score : b.challenger_score,
      myTurnDone: iAmChallenger ? b.challenger_finished : b.opponent_finished,
      opponent: (prof as PublicProfile | null) ?? null,
    };
  });

/** Envia a pontuação final do usuário na batalha. */
export const submitBattleScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ battleId: z.string().uuid(), score: z.number().int().min(0).max(10000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("battles")
      .select()
      .eq("id", data.battleId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Batalha não encontrada.");
    const b = row as Tables<"battles">;
    const iAmChallenger = b.challenger_id === context.userId;
    const challengerScore = iAmChallenger ? data.score : b.challenger_score;
    const opponentScore = iAmChallenger ? b.opponent_score : data.score;
    const challengerFinished = iAmChallenger ? true : b.challenger_finished;
    const opponentFinished = iAmChallenger ? b.opponent_finished : true;
    const bothDone = challengerFinished && opponentFinished;
    const winner =
      !bothDone || challengerScore === opponentScore
        ? null
        : challengerScore > opponentScore
          ? b.challenger_id
          : b.opponent_id;

    const { data: updated, error: uErr } = await context.supabase
      .from("battles")
      .update({
        challenger_score: challengerScore,
        opponent_score: opponentScore,
        challenger_finished: challengerFinished,
        opponent_finished: opponentFinished,
        status: bothDone ? "finished" : "active",
        winner_id: winner,
      })
      .eq("id", b.id)
      .select()
      .single();
    if (uErr) throw new Error(uErr.message);
    return updated as Tables<"battles">;
  });
