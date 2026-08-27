// Leitura em voz alta (texto para som) das atividades — usa a API nativa do navegador.

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang?.toLowerCase().startsWith("pt-br")) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith("pt")) ??
    null
  );
}

/** Fala um texto em português. Cancela qualquer fala anterior. */
export function speak(text: string, onEnd?: () => void) {
  if (!speechSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-BR";
  u.rate = 0.98;
  u.pitch = 1.05;
  const voice = pickVoice();
  if (voice) u.voice = voice;
  if (onEnd) {
    u.onend = onEnd;
    u.onerror = onEnd;
  }
  synth.speak(u);
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
}
