import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Crown, FlaskConical, Search, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { approvePremiumPurchase, createPremiumTest, listAdminPurchases, listPremiumTestUsers } from "@/lib/admin-premium.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/premium")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "Compras Premium — Painel Edu Study" },
    { name: "description", content: "Acompanhe compras, liberações e testes do Premium no painel Edu Study." },
    { property: "og:title", content: "Compras Premium — Painel Edu Study" },
    { property: "og:description", content: "Histórico administrativo de compras e liberações Premium." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: PremiumAdminPage,
});

type TestMode = "simulation" | "real";
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const formatDate = (value: string | null) => value ? dateFormatter.format(new Date(value)) : "Ainda não liberado";
const statusLabel = (status: string) => status === "approved" ? "Aprovado" : status === "rejected" ? "Recusado" : "Pendente";
const sourceLabel = (source: string, testMode: string | null) => testMode === "simulation" ? "Simulação" : testMode === "real" ? "Teste real" : source === "manual" ? "Manual" : "Automática";

function PremiumAdminPage() {
  const queryClient = useQueryClient();
  const fetchPurchases = useServerFn(listAdminPurchases);
  const fetchUsers = useServerFn(listPremiumTestUsers);
  const approve = useServerFn(approvePremiumPurchase);
  const createTest = useServerFn(createPremiumTest);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [testMode, setTestMode] = useState<TestMode | null>(null);
  const purchasesQuery = useQuery({ queryKey: ["admin-premium-purchases"], queryFn: fetchPurchases });
  const usersQuery = useQuery({ queryKey: ["admin-premium-users"], queryFn: fetchUsers });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-premium-purchases"] });
  const approveMutation = useMutation({
    mutationFn: (purchaseId: string) => approve({ data: { purchaseId } }),
    onSuccess: async () => { setSelectedPurchase(null); toast.success("Premium liberado e registrado no histórico."); await refresh(); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível aprovar."),
  });
  const testMutation = useMutation({
    mutationFn: (input: { userId: string; mode: TestMode }) => createTest({ data: input }),
    onSuccess: async (_, variables) => { setTestMode(null); toast.success(variables.mode === "real" ? "Teste real concluído: Premium liberado." : "Simulação registrada sem liberar Premium."); await refresh(); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível executar o teste."),
  });
  const realPurchases = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return (purchasesQuery.data ?? []).filter((purchase) => {
      if (purchase.test_mode || (status !== "all" && purchase.status !== status)) return false;
      if (!term) return true;
      return [purchase.profile?.display_name, purchase.profile?.username, purchase.user_id, purchase.external_id]
        .filter(Boolean).some((value) => value?.toLocaleLowerCase("pt-BR").includes(term));
    });
  }, [purchasesQuery.data, search, status]);
  const testPurchases = (purchasesQuery.data ?? []).filter((purchase) => purchase.test_mode !== null);
  const selectedProfile = (usersQuery.data ?? []).find((profile) => profile.user_id === selectedUser);
  const accessDenied = purchasesQuery.isError && String(purchasesQuery.error).includes("administradores");

  if (accessDenied) return <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8"><ShieldCheck className="h-10 w-10 text-destructive" /><h1 className="mt-4 text-2xl font-black">Acesso restrito</h1><p className="mt-2 font-bold text-muted-foreground">Somente administradores podem consultar ou alterar compras.</p><Button asChild variant="outline" className="mt-5"><Link to="/perfil">Voltar ao perfil</Link></Button></main>;

  return <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-28 pt-6">
    <Link to="/admin" className="mb-4 inline-flex items-center gap-2 font-black uppercase text-muted-foreground"><ArrowLeft className="h-5 w-5" /> Voltar ao painel</Link>
    <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gem/10 text-gem"><Crown className="h-7 w-7" /></span><div><h1 className="text-2xl font-black">Compras Premium</h1><p className="text-sm font-bold text-muted-foreground">Compradores, liberações e testes.</p></div></div>
    <Tabs defaultValue="purchases" className="mt-6">
      <TabsList className="grid h-11 w-full grid-cols-2"><TabsTrigger value="purchases" className="font-black">Compras</TabsTrigger><TabsTrigger value="tests" className="font-black">Testes</TabsTrigger></TabsList>
      <TabsContent value="purchases" className="mt-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]"><label className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome ou usuário" className="h-11 pl-10 font-bold" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-md border border-input bg-background px-3 text-sm font-bold"><option value="all">Todas as situações</option><option value="pending">Pendentes</option><option value="approved">Aprovadas</option><option value="rejected">Recusadas</option></select></div>
        <div className="mt-4 grid gap-3">
          {purchasesQuery.isLoading && <p className="py-8 text-center font-bold text-muted-foreground">Carregando compras...</p>}
          {!purchasesQuery.isLoading && realPurchases.length === 0 && <p className="rounded-lg border border-border p-6 text-center font-bold text-muted-foreground">Nenhuma compra encontrada.</p>}
          {realPurchases.map((purchase) => <article key={purchase.id} className="rounded-lg border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary"><UserRound className="h-5 w-5" /></span><div className="min-w-0"><h2 className="truncate font-black">{purchase.profile?.display_name ?? "Usuário sem perfil"}</h2><p className="truncate text-sm font-bold text-muted-foreground">@{purchase.profile?.username ?? purchase.user_id}</p></div></div><Badge variant={purchase.status === "approved" ? "default" : purchase.status === "rejected" ? "destructive" : "secondary"}>{statusLabel(purchase.status)}</Badge></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="font-bold text-muted-foreground">Compra</dt><dd className="font-black">{formatDate(purchase.created_at)}</dd></div><div><dt className="font-bold text-muted-foreground">Liberação</dt><dd className="font-black">{formatDate(purchase.approved_at)}</dd></div><div><dt className="font-bold text-muted-foreground">Origem</dt><dd className="font-black">{sourceLabel(purchase.release_source, purchase.test_mode)}</dd></div></dl><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><span className="font-black">R$ {Number(purchase.amount).toFixed(2).replace(".", ",")}</span>{purchase.status === "pending" && <Button onClick={() => setSelectedPurchase(purchase.id)}><CheckCircle2 /> Aprovar</Button>}</div></article>)}
        </div>
      </TabsContent>
      <TabsContent value="tests" className="mt-5 space-y-5">
        <section className="rounded-lg border border-border bg-card p-4"><div className="flex items-start gap-3"><FlaskConical className="mt-1 h-6 w-6 text-primary" /><div><h2 className="font-black">Testar o Premium</h2><p className="text-sm font-bold text-muted-foreground">Simulações não alteram o acesso; testes reais liberam Premium.</p></div></div><select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)} className="mt-4 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-bold"><option value="">Selecione uma conta</option>{(usersQuery.data ?? []).map((profile) => <option key={profile.user_id} value={profile.user_id}>{profile.display_name} (@{profile.username})</option>)}</select><div className="mt-3 grid gap-2 sm:grid-cols-2"><Button variant="outline" disabled={!selectedUser} onClick={() => setTestMode("simulation")}><FlaskConical /> Simular compra</Button><Button disabled={!selectedUser} onClick={() => setTestMode("real")}><Crown /> Testar liberação real</Button></div></section>
        <section><h2 className="font-black">Histórico de testes</h2><div className="mt-3 grid gap-3">{testPurchases.length === 0 && <p className="rounded-lg border border-border p-5 text-center font-bold text-muted-foreground">Nenhum teste realizado.</p>}{testPurchases.map((purchase) => <div key={purchase.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4"><div><p className="font-black">{purchase.profile?.display_name ?? purchase.user_id}</p><p className="text-sm font-bold text-muted-foreground">{formatDate(purchase.created_at)}</p></div><Badge variant={purchase.test_mode === "real" ? "default" : "outline"}>{sourceLabel(purchase.release_source, purchase.test_mode)}</Badge></div>)}</div></section>
      </TabsContent>
    </Tabs>
    <AlertDialog open={selectedPurchase !== null} onOpenChange={(open) => !open && setSelectedPurchase(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Liberar Premium?</AlertDialogTitle><AlertDialogDescription>Confirme somente depois de verificar o pagamento. A liberação ficará registrada com seu usuário e horário.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={approveMutation.isPending} onClick={() => selectedPurchase && approveMutation.mutate(selectedPurchase)}>Confirmar aprovação</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={testMode !== null} onOpenChange={(open) => !open && setTestMode(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{testMode === "real" ? "Executar teste real?" : "Registrar simulação?"}</AlertDialogTitle><AlertDialogDescription>{testMode === "real" ? `O Premium será liberado de verdade para ${selectedProfile?.display_name ?? "a conta selecionada"}.` : "A simulação ficará no histórico e não liberará Premium."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={!selectedUser || testMutation.isPending} onClick={() => testMode && testMutation.mutate({ userId: selectedUser, mode: testMode })}>{testMode === "real" ? "Liberar Premium" : "Criar simulação"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}