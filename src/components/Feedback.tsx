import type { ReactNode } from "react";
import { Mascot } from "@/components/Mascot";
import { cn } from "@/lib/utils";

/** Bloco de skeleton reutilizável. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/** Skeleton padrão de uma página do app. */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
      <SkeletonBlock className="h-28 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-20 rounded-2xl" />
        <SkeletonBlock className="h-20 rounded-2xl" />
      </div>
      <SkeletonBlock className="h-5 w-40 rounded-full" />
      <SkeletonBlock className="h-24 w-full rounded-2xl" />
      <SkeletonBlock className="h-24 w-full rounded-2xl" />
      <SkeletonBlock className="h-24 w-full rounded-2xl" />
    </div>
  );
}

/** Lista de skeletons em linha. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="grid gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="card-soft flex items-center gap-3 p-4">
          <SkeletonBlock className="h-11 w-11 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3.5 w-1/2 rounded-full" />
            <SkeletonBlock className="h-3 w-1/3 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Estado vazio amigável com o Edu. */
export function EmptyState({
  title,
  description,
  action,
  emoji,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  emoji?: string;
}) {
  return (
    <div className="card-soft flex flex-col items-center gap-3 px-6 py-10 text-center animate-rise">
      {emoji ? (
        <span className="text-4xl" aria-hidden>
          {emoji}
        </span>
      ) : (
        <Mascot size={96} className="animate-float" />
      )}
      <p className="text-lg font-black">{title}</p>
      <p className="max-w-xs text-sm font-bold text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

/** Mensagem de erro amigável. */
export function ErrorState({
  title = "Algo deu errado",
  description = "Não conseguimos carregar isso agora. Tente novamente em instantes.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/8 px-6 py-8 text-center animate-rise">
      <span className="text-3xl" aria-hidden>
        🙈
      </span>
      <p className="mt-2 text-base font-black text-destructive">{title}</p>
      <p className="mt-1 text-sm font-bold text-muted-foreground">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="press mt-4 rounded-2xl bg-primary px-5 py-2.5 text-sm font-black uppercase tracking-wide text-primary-foreground"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
