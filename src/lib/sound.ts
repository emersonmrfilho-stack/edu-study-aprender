// Sons simples usando Web Audio API — sem dependências externas.

let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, type: OscillatorType, duration: number, when: number, gain = 0.15) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + when);
  g.gain.setValueAtTime(gain, c.currentTime + when);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(c.currentTime + when);
  osc.stop(c.currentTime + when + duration);
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
  tone(800, "sine", 0.05, 0, 0.05);
}
