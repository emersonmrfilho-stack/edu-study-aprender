import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpenCheck, CreditCard } from "lucide-react";
import { Mascot } from "@/components/Mascot";

export const Route = createFileRoute("/_authenticated/admin/")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Painel admin — Edu Study" },
      { name: "description", content: "Painel administrativo do Edu Study para gerenciar atividades e aprovar pagamentos." },
      { property: "og:title", content: "Painel admin — Edu Study" },
      { property: "og:description", content: "Gerencie atividades e pagamentos do Edu Study." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminIndexPage,
});

function AdminIndexPage() {
  const items = [
    {
      to: "/admin/atividades",
      Icon: BookOpenCheck,
      title: "Atividades",
      description: "Crie, edite e exclua atividades personalizadas das lições.",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/40",
    },
    {
      to: "/admin/pagamentos",
      Icon: CreditCard,
      title: "Pagamentos",
      description: "Aprove ou rejeite compras Premium pendentes.",
      color: "text-gem",
      bg: "bg-gem/10",
      border: "border-gem/40",
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Mascot size={64} />
          <div>
            <h1 className="text-xl font-black">Painel admin</h1>
            <p className="text-sm font-bold text-muted-foreground">Gerencie atividades e pagamentos.</p>
          </div>
        </div>

        <Link
          to="/perfil"
          className="mb-4 inline-flex items-center gap-1 text-sm font-extrabold uppercase text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mt-4 grid gap-4">
          {items.map(({ to, Icon, title, description, color, bg, border }) => (
            <Link
              key={to}
              to={to}
              className={`press lift flex items-center gap-4 rounded-3xl border-2 ${border} ${bg} p-5`}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card ${color}`}>
                <Icon className="h-6 w-6" strokeWidth={2.5} />
              </span>
              <div>
                <p className={`font-black ${color}`}>{title}</p>
                <p className="text-sm font-bold text-muted-foreground">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
