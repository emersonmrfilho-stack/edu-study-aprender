import eduMascot from "@/assets/edu-mascot.png";
import { cn } from "@/lib/utils";

export function Mascot({
  className,
  size = 140,
  priority = false,
}: {
  className?: string;
  size?: number;
  priority?: boolean;
}) {
  return (
    <img
      src={eduMascot}
      alt="Edu, o macaco mascote do Edu Study"
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      className={cn("select-none", className)}
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
