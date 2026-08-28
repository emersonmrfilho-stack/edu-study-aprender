import { avatarSrc } from "@/lib/avatars";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Mascot({
  className,
  size = 140,
  priority = false,
  avatarId,
  src,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
  /** Força um avatar específico (ex.: o do adversário na batalha). */
  avatarId?: string | null;
  src?: string;
}) {
  const { state } = useStore();
  const finalSrc = src ?? avatarSrc(avatarId ?? state.avatarId);
  return (
    <img
      src={finalSrc}
      alt="Edu, o macaco mascote do Edu Study"
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      className={cn("select-none object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function SpeechBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border-2 border-border bg-card px-4 py-3 text-[15px] font-bold text-foreground">
      <span
        aria-hidden
        className="absolute -left-2 top-6 h-3 w-3 rotate-45 border-b-2 border-l-2 border-border bg-card"
      />
      {children}
    </div>
  );
}
