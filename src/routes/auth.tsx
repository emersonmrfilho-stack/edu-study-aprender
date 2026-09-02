import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Cloud, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Mascot } from "@/components/Mascot";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Edu Study" },
      {
        name: "description",
        content:
          "Entre na sua conta do Edu Study ou crie uma grátis para salvar seu progresso na nuvem e estudar em qualquer dispositivo.",
      },
      { property: "og:title", content: "Entrar ou criar conta — Edu Study" },
      {
        property: "og:description",
        content: "Salve seu progresso na nuvem e estude em qualquer dispositivo.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPage,
});

function translateError(message: string) {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("User already registered"))
    return "Este e-mail já tem uma conta. Toque em Entrar.";
  if (message.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (message.includes("Unable to validate email")) return "Digite um e-mail válido.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // sessão confirmada (login, cadastro com auto-confirmação ou retorno do Google)
  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [loading, user, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) setError(translateError(err.message));
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) setError(translateError(err.message));
        else if (!data.session)
          setInfo(
            "Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme para começar a sincronizar.",
          );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setInfo(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("Não foi possível entrar com o Google. Tente novamente.");
    // se redirecionou, o navegador sai da página; se a sessão veio direto, o useEffect navega
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Mascot size={140} priority />
          <h1 className="mt-2 text-2xl font-black tracking-tight text-primary">
            {mode === "login" ? "Bem-vindo de volta!" : "Crie sua conta grátis"}
          </h1>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-bold text-muted-foreground">
            <Cloud className="h-4 w-4 shrink-0" />
            Seu progresso fica salvo na nuvem, em qualquer aparelho.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border-2 border-border bg-muted p-1.5">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setInfo(null);
              }}
              className={cn(
                "rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-wide",
                mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {m === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
          <label className="relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              autoComplete="email"
              className="w-full rounded-2xl border-2 border-border bg-muted py-4 pl-12 pr-4 text-base font-bold outline-none focus:border-accent"
            />
          </label>
          <label className="relative block">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha (mín. 6 caracteres)"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-2xl border-2 border-border bg-muted py-4 pl-12 pr-12 text-base font-bold outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </label>

          {error && (
            <p className="rounded-xl border-2 border-wrong-foreground/40 bg-wrong px-4 py-3 text-sm font-bold text-wrong-foreground">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl border-2 border-correct-foreground/40 bg-correct px-4 py-3 text-sm font-bold text-correct-foreground">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-3d flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/60 bg-primary px-4 py-4 text-base font-black uppercase tracking-wide text-primary-foreground disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : mode === "login" ? (
              "Entrar"
            ) : (
              "Criar conta"
            )}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="h-0.5 flex-1 rounded bg-border" />
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">ou</span>
          <span className="h-0.5 flex-1 rounded bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="btn-3d flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-4 text-base font-black uppercase tracking-wide text-foreground"
        >
          <GoogleIcon />
          Continuar com Google
        </button>

        <Link
          to="/"
          className="mt-6 block text-center text-sm font-extrabold uppercase tracking-wide text-muted-foreground"
        >
          Continuar sem conta
        </Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.27v-3.1H1.29a12 12 0 0 0 0 10.74l3.98-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.63l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  );
}
