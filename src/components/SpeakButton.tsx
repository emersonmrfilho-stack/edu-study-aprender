import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { speak, speechSupported, stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";

/** Botão que lê o enunciado da atividade em voz alta. */
export function SpeakButton({ text, className }: { text: string; className?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => setSupported(speechSupported()), []);
  useEffect(() => {
    setSpeaking(false);
    stopSpeaking();
    return stopSpeaking;
  }, [text]);

  if (!supported) return null;

  return (
    <button
      type="button"
      data-no-click-sound
      aria-label={speaking ? "Parar leitura" : "Ouvir enunciado"}
      onClick={() => {
        if (speaking) {
          stopSpeaking();
          setSpeaking(false);
          return;
        }
        setSpeaking(true);
        speak(text, () => setSpeaking(false));
      }}
      className={cn(
        "press flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-primary",
        speaking && "border-primary/60 bg-primary/10 animate-pulse",
        className,
      )}
    >
      {speaking ? <VolumeX className="h-5 w-5" strokeWidth={3} /> : <Volume2 className="h-5 w-5" strokeWidth={3} />}
    </button>
  );
}
