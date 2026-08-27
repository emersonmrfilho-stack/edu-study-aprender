import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchRemoteState, pickRicher, saveRemoteState } from "./sync";
import { getLatestPurchase } from "./payments.functions";
import { dayKey, type DayStats } from "./challenges";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = {
  name: string;
  gradeId: string;
  startUnit: number; // resultado do teste de nivelamento
  placementScore: number;
  onboarded: boolean;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type State = {
  profile: Profile | null;
  xp: number;
  gems: number;
  hearts: number;
  heartsUpdatedAt: number;
  streak: number;
  lastStudyDay: string | null;
  completed: Record<string, number>; // lessonId -> acertos
  currentSubject: string;
  achievements: string[]; // ids desbloqueados
  soundEnabled: boolean;
  examsPassed: Record<string, boolean>; // `${gradeId}-${subjectId}-${unitIndex}`
  premium: boolean;
  premiumSince: number | null;
  activity: Record<string, DayStats>; // dia ISO -> lições/acertos/xp
  claimedChallenges: string[]; // ids de desafios já resgatados
  lostStreak: { value: number; day: string } | null; // ofensiva perdida aguardando resgate
};

export const PREMIUM_PRICE_LABEL = "R$ 24,90";
export const MAX_HEARTS = 5;

const EMPTY: State = {
  profile: null,
  xp: 0,
  gems: 500,
  hearts: 5,
  heartsUpdatedAt: Date.now(),
  streak: 0,
  lastStudyDay: null,
  completed: {},
  currentSubject: "matematica",
  achievements: [],
  soundEnabled: true,
  examsPassed: {},
  premium: false,
  premiumSince: null,
};

const KEY = "edu-study-state-v2";

type Ctx = {
  state: State;
  ready: boolean;
  setProfile: (p: Profile) => void;
  setSubject: (s: string) => void;
  loseHeart: () => void;
  refillHearts: (cost?: number) => void;
  completeLesson: (lessonId: string, correct: number, xp: number) => string[];
  reset: () => void;
  unlockAchievements: (ids: string[]) => string[];
  toggleSound: () => void;
  passExam: (key: string) => void;
  activatePremium: () => void;
  cancelPremium: () => void;
  syncPremium: () => Promise<Tables<"premium_purchases"> | null>;
};

const StoreContext = createContext<Ctx | null>(null);

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Ao entrar na conta, mescla o progresso local com o da nuvem (fica o mais completo)
  const syncFromCloud = useCallback(async (uid: string) => {
    const remote = await fetchRemoteState(uid);
    if (!remote) return; // conta nova: o efeito de salvamento envia o progresso local
    setState((local) =>
      pickRicher(local, remote)
        ? { ...EMPTY, ...remote, soundEnabled: remote.soundEnabled ?? true }
        : local,
    );
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        setState({ ...EMPTY, ...parsed, soundEnabled: parsed.soundEnabled ?? true });
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  // sessão: detecta login/logout e dispara a primeira sincronização
  useEffect(() => {
    if (!ready) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      if (active && uid) {
        setUserId(uid);
        void syncFromCloud(uid);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user.id ?? null;
      if (event === "SIGNED_IN" && uid) {
        setUserId(uid);
        void syncFromCloud(uid);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [ready, syncFromCloud]);

  // salva na nuvem (com debounce) sempre que o progresso muda e há usuário logado
  useEffect(() => {
    if (!ready || !userId) return;
    const timer = setTimeout(() => {
      void saveRemoteState(userId, state);
    }, 1200);
    return () => clearTimeout(timer);
  }, [state, ready, userId]);

  // regeneração de corações: 1 a cada 20 minutos
  useEffect(() => {
    if (!ready) return;
    const tick = () =>
      setState((s) => {
        if (s.premium || s.hearts >= MAX_HEARTS) return s;
        const elapsed = Date.now() - s.heartsUpdatedAt;
        const gained = Math.floor(elapsed / (20 * 60 * 1000));
        if (gained <= 0) return s;
        return {
          ...s,
          hearts: Math.min(MAX_HEARTS, s.hearts + gained),
          heartsUpdatedAt: s.heartsUpdatedAt + gained * 20 * 60 * 1000,
        };
      });
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [ready]);

  const setProfile = useCallback((p: Profile) => setState((s) => ({ ...s, profile: p })), []);
  const setSubject = useCallback((sub: string) => setState((s) => ({ ...s, currentSubject: sub })), []);
  const loseHeart = useCallback(
    () =>
      setState((s) =>
        s.premium ? s : { ...s, hearts: Math.max(0, s.hearts - 1), heartsUpdatedAt: Date.now() },
      ),
    [],
  );
  const refillHearts = useCallback(
    (cost = 350) =>
      setState((s) =>
        s.gems >= cost
          ? { ...s, gems: s.gems - cost, hearts: MAX_HEARTS, heartsUpdatedAt: Date.now() }
          : s,
      ),
    [],
  );

  const unlockAchievements = useCallback((ids: string[]) => {
    let newlyUnlocked: string[] = [];
    setState((s) => {
      const set = new Set(s.achievements);
      newlyUnlocked = ids.filter((id) => !set.has(id));
      if (newlyUnlocked.length === 0) return s;
      newlyUnlocked.forEach((id) => set.add(id));
      return { ...s, achievements: [...set] };
    });
    return newlyUnlocked;
  }, []);

  const completeLesson = useCallback((lessonId: string, correct: number, xp: number) => {
    let unlocked: string[] = [];
    setState((s) => {
      const d = today();
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const streak = s.lastStudyDay === d ? s.streak : s.lastStudyDay === yesterday ? s.streak + 1 : 1;
      const next = {
        ...s,
        xp: s.xp + xp,
        gems: s.gems + 10,
        streak,
        lastStudyDay: d,
        completed: { ...s.completed, [lessonId]: Math.max(s.completed[lessonId] ?? 0, correct) },
      };
      const candidates: string[] = [];
      if (Object.keys(next.completed).length === 1) candidates.push("first-lesson");
      if (next.streak >= 3) candidates.push("streak-3");
      if (next.streak >= 7) candidates.push("streak-7");
      if (next.streak >= 30) candidates.push("streak-30");
      if (correct === 8) candidates.push("perfect-lesson");
      if (next.xp >= 1000) candidates.push("xp-1000");
      unlocked = candidates.filter((id) => !s.achievements.includes(id));
      if (unlocked.length > 0) next.achievements = [...s.achievements, ...unlocked];
      return next;
    });
    return unlocked;
  }, []);

  const toggleSound = useCallback(
    () => setState((s) => ({ ...s, soundEnabled: !s.soundEnabled })),
    [],
  );

  const passExam = useCallback(
    (key: string) => setState((s) => ({ ...s, examsPassed: { ...s.examsPassed, [key]: true } })),
    [],
  );

  const activatePremium = useCallback(
    () =>
      setState((s) => ({
        ...s,
        premium: true,
        premiumSince: Date.now(),
        hearts: MAX_HEARTS,
        heartsUpdatedAt: Date.now(),
      })),
    [],
  );

  const cancelPremium = useCallback(
    () => setState((s) => ({ ...s, premium: false, premiumSince: null })),
    [],
  );

  const syncPremium = useCallback(async () => {
    const purchase = await getLatestPurchase({ data: undefined });
    if (purchase?.status === "approved") {
      setState((s) => ({
        ...s,
        premium: true,
        premiumSince: s.premiumSince ?? new Date(purchase.approved_at || purchase.created_at).getTime(),
        hearts: MAX_HEARTS,
        heartsUpdatedAt: Date.now(),
      }));
    } else if (purchase?.status === "rejected") {
      setState((s) => ({ ...s, premium: false, premiumSince: null }));
    }
    return purchase;
  }, []);

  const reset = useCallback(() => {
    setState(EMPTY);
    localStorage.removeItem(KEY);
  }, []);

  const value = useMemo(
    () => ({
      state,
      ready,
      setProfile,
      setSubject,
      loseHeart,
      refillHearts,
      completeLesson,
      reset,
      unlockAchievements,
      toggleSound,
      passExam,
      activatePremium,
      cancelPremium,
      syncPremium,
    }),
    [
      state,
      ready,
      setProfile,
      setSubject,
      loseHeart,
      refillHearts,
      completeLesson,
      reset,
      unlockAchievements,
      toggleSound,
      passExam,
      activatePremium,
      cancelPremium,
      syncPremium,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de StoreProvider");
  return ctx;
}
