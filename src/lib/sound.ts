// Efeitos sonoros usando Web Audio API — sem dependências externas.

let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  type: OscillatorType,
  duration: number,
  when: number,
  gain = 0.15,
  freqEnd?: number,
) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration: number, when: number, gain = 0.08) {
  const c = getCtx();
  if (!c) return;
  const frames = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, Math.max(frames, 1), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buffer;
  g.gain.setValueAtTime(gain, c.currentTime + when);
  src.connect(g);
  g.connect(c.destination);
  src.start(c.currentTime + when);
}

export function playCorrect(enabled: boolean) {
  if (!enabled) return;
  tone(523.25, "sine", 0.15, 0, 0.12);
  tone(659.25, "sine", 0.2, 0.12, 0.12);
  tone(783.99, "sine", 0.35, 0.28, 0.12);
}

export function playWrong(enabled: boolean) {
  if (!enabled) return;
  tone(200, "sawtooth", 0.25, 0, 0.08);
  tone(150, "sawtooth", 0.35, 0.2, 0.08);
}

export function playAchievement(enabled: boolean) {
  if (!enabled) return;
  tone(523.25, "triangle", 0.12, 0, 0.12);
  tone(659.25, "triangle", 0.12, 0.12, 0.12);
  tone(783.99, "triangle", 0.12, 0.24, 0.12);
  tone(1046.5, "triangle", 0.5, 0.36, 0.15);
}

export function playClick(enabled: boolean) {
  if (!enabled) return;
  tone(880, "sine", 0.045, 0, 0.045);
}

/** Toque leve para seleção de alternativa/opção. */
export function playSelect(enabled: boolean) {
  if (!enabled) return;
  tone(620, "triangle", 0.06, 0, 0.06);
  tone(930, "sine", 0.05, 0.045, 0.04);
}

/** Abrir tela/modal. */
export function playOpen(enabled: boolean) {
  if (!enabled) return;
  tone(420, "sine", 0.16, 0, 0.06, 780);
}

/** Fechar/voltar. */
export function playClose(enabled: boolean) {
  if (!enabled) return;
  tone(700, "sine", 0.16, 0, 0.06, 360);
}

/** Início de lição/batalha. */
export function playStart(enabled: boolean) {
  if (!enabled) return;
  tone(392, "triangle", 0.12, 0, 0.1);
  tone(523.25, "triangle", 0.12, 0.1, 0.1);
  tone(659.25, "triangle", 0.22, 0.2, 0.12);
}

/** Fim de lição/prova concluída. */
export function playFinish(enabled: boolean) {
  if (!enabled) return;
  tone(659.25, "sine", 0.14, 0, 0.12);
  tone(783.99, "sine", 0.14, 0.13, 0.12);
  tone(1046.5, "sine", 0.45, 0.26, 0.14);
  noise(0.35, 0.26, 0.04);
}

/** Subiu de nível. */
export function playLevelUp(enabled: boolean) {
  if (!enabled) return;
  tone(523.25, "square", 0.1, 0, 0.07);
  tone(659.25, "square", 0.1, 0.09, 0.07);
  tone(783.99, "square", 0.1, 0.18, 0.07);
  tone(1046.5, "square", 0.1, 0.27, 0.07);
  tone(1318.5, "sine", 0.5, 0.36, 0.12);
}

/** Ganhou XP / gemas. */
export function playReward(enabled: boolean) {
  if (!enabled) return;
  tone(1200, "sine", 0.08, 0, 0.07);
  tone(1600, "sine", 0.16, 0.07, 0.07);
}

/** Perdeu um coração. */
export function playHeartLost(enabled: boolean) {
  if (!enabled) return;
  tone(330, "sine", 0.3, 0, 0.1, 110);
}

/** Contagem regressiva da batalha. */
export function playTick(enabled: boolean) {
  if (!enabled) return;
  tone(1000, "square", 0.03, 0, 0.03);
}

/** Tempo esgotado. */
export function playTimeout(enabled: boolean) {
  if (!enabled) return;
  tone(400, "sawtooth", 0.18, 0, 0.07);
  tone(260, "sawtooth", 0.3, 0.16, 0.07);
}

/** Mensagem enviada (chat da IA). */
export function playSend(enabled: boolean) {
  if (!enabled) return;
  tone(760, "sine", 0.09, 0, 0.05, 1180);
}

/** Mensagem recebida (chat da IA). */
export function playReceive(enabled: boolean) {
  if (!enabled) return;
  tone(1180, "sine", 0.1, 0, 0.05, 760);
}

/** Erro/ação bloqueada. */
export function playError(enabled: boolean) {
  if (!enabled) return;
  tone(220, "square", 0.12, 0, 0.05);
  tone(180, "square", 0.16, 0.11, 0.05);
}

/** Vitória na batalha. */
export function playVictory(enabled: boolean) {
  if (!enabled) return;
  tone(523.25, "triangle", 0.14, 0, 0.12);
  tone(659.25, "triangle", 0.14, 0.13, 0.12);
  tone(783.99, "triangle", 0.14, 0.26, 0.12);
  tone(1046.5, "triangle", 0.5, 0.39, 0.15);
  tone(1318.5, "sine", 0.6, 0.45, 0.1);
  noise(0.4, 0.4, 0.05);
}

/** Derrota na batalha. */
export function playDefeat(enabled: boolean) {
  if (!enabled) return;
  tone(392, "sawtooth", 0.22, 0, 0.09);
  tone(330, "sawtooth", 0.22, 0.2, 0.09);
  tone(262, "sawtooth", 0.5, 0.4, 0.09, 160);
}

export const SFX = {
  click: playClick,
  select: playSelect,
  open: playOpen,
  close: playClose,
  correct: playCorrect,
  wrong: playWrong,
  achievement: playAchievement,
  start: playStart,
  finish: playFinish,
  levelUp: playLevelUp,
  reward: playReward,
  heartLost: playHeartLost,
  tick: playTick,
  timeout: playTimeout,
  send: playSend,
  receive: playReceive,
  error: playError,
  victory: playVictory,
  defeat: playDefeat,
} as const;

export type SfxName = keyof typeof SFX;
