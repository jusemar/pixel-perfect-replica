import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentRow, AppointmentSheet, NewAppointmentDialog } from "@/components/agenda/appointment-ui";
import { TODAY, findService, fmtDate, money, parseDate, useAgenda } from "@/lib/agenda-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agenda — Jaaa Profissional" },
      { name: "description", content: "Acompanhe hoje, próximos compromissos, mês e histórico de agendamentos." },
      { property: "og:title", content: "Agenda — Jaaa Profissional" },
      { property: "og:description", content: "Agenda operacional do profissional no Jaaa." },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const { appointments, activities, blocks } = useAgenda();
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const today = fmtDate(TODAY);
  const sorted = useMemo(() => [...appointments].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), [appointments]);
  const todays = sorted.filter((a) => a.date === today);
  const upcoming = sorted.filter((a) => a.date > today && (a.status === "confirmado" || a.status === "pendente"));
  const history = sorted.filter((a) => a.date < today || ["concluido", "cancelado", "falta"].includes(a.status)).reverse();
  const weekRevenue = upcoming.filter((a) => a.date <= fmtDate(new Date(TODAY.getTime() + 6 * 864e5)))
    .reduce((s, a) => s + (findService(activities, a).service?.price ?? 0), 0);
  const pending = appointments.filter((a) => a.status === "pendente").length;

  const groups = upcoming.reduce<Record<string, typeof upcoming>>((g, a) => ((g[a.date] ??= []).push(a), g), {});

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={TODAY.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        action={<Button size="lg" onClick={() => setCreating(true)}><Plus /> Agendar</Button>}
      />
      <div className="px-4 md:px-10 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Hoje" value={String(todays.filter((a) => a.status !== "cancelado").length)} />
          <Stat label="Aguardando você" value={String(pending)} highlight={pending > 0} />
          <Stat label="Previsto 7 dias" value={money(weekRevenue)} />
        </div>
        <Tabs defaultValue="hoje">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="hoje">Hoje</TabsTrigger>
            <TabsTrigger value="proximos">Próximos</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="hoje" className="mt-4 space-y-3">
            {todays.length ? todays.map((a) => <AppointmentRow key={a.id} a={a} onOpen={() => setOpen(a.id)} />)
              : <Empty text="Nenhum atendimento hoje." />}
          </TabsContent>
          <TabsContent value="proximos" className="mt-4 space-y-6">
            {Object.entries(groups).map(([d, list]) => (
              <section key={d}>
                <h3 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
                  {parseDate(d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                </h3>
                <div className="space-y-3">{list.map((a) => <AppointmentRow key={a.id} a={a} onOpen={() => setOpen(a.id)} />)}</div>
              </section>
            ))}
            {!upcoming.length && <Empty text="Nenhum compromisso futuro." />}
          </TabsContent>
          <TabsContent value="mes" className="mt-4">
            <MonthView onOpen={setOpen} blockedDays={blocks} />
          </TabsContent>
          <TabsContent value="historico" className="mt-4 space-y-3">
            {history.map((a) => <AppointmentRow key={a.id} a={a} onOpen={() => setOpen(a.id)} />)}
          </TabsContent>
        </Tabs>
      </div>
      <AppointmentSheet id={open} onClose={() => setOpen(null)} />
      <NewAppointmentDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-4", highlight ? "bg-accent text-accent-foreground border-transparent" : "bg-card")}>
      <p className="text-xs opacity-75">{label}</p>
      <p className="font-display text-xl md:text-2xl font-bold">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</p>;
}

function MonthView({ onOpen, blockedDays }: { onOpen: (id: string) => void; blockedDays: { from: string; to: string; title: string }[] }) {
  const { appointments, activities } = useAgenda();
  const [cursor, setCursor] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  const [sel, setSel] = useState(fmtDate(TODAY));
  const first = cursor.getDay();
  const daysIn = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => fmtDate(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)))];
  const selList = appointments.filter((a) => a.date === sel).sort((a, b) => a.time.localeCompare(b.time));
  const blockOf = (d: string) => blockedDays.find((b) => b.from <= d && b.to >= d);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="rounded-2xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft /></Button>
          <p className="font-display font-bold capitalize">{cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</p>
          <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const n = appointments.filter((a) => a.date === d && a.status !== "cancelado").length;
            const blk = blockOf(d);
            return (
              <button key={d} onClick={() => setSel(d)} title={blk?.title}
                className={cn("aspect-square rounded-xl text-sm flex flex-col items-center justify-center gap-0.5 transition",
                  sel === d ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  d === fmtDate(TODAY) && sel !== d && "ring-1 ring-primary",
                  blk && sel !== d && "bg-destructive/10 text-destructive")}>
                {parseDate(d).getDate()}
                <span className="flex gap-0.5 h-1.5">{Array.from({ length: Math.min(n, 3) }).map((_, k) => <span key={k} className={cn("size-1.5 rounded-full", sel === d ? "bg-primary-foreground" : "bg-primary")} />)}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><span className="size-3 rounded bg-destructive/15" /> Dia com bloqueio</p>
      </div>
      <div className="space-y-3">
        <p className="font-semibold capitalize">{parseDate(sel).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        {blockOf(sel) && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">Bloqueado: {blockOf(sel)!.title}</p>}
        {selList.map((a) => <AppointmentRow key={a.id} a={a} onOpen={() => onOpen(a.id)} />)}
        {!selList.length && <Empty text="Sem agendamentos neste dia." />}
        {selList.length > 0 && <p className="text-xs text-muted-foreground">Total do dia: {money(selList.filter((a) => a.status !== "cancelado").reduce((s, a) => s + (findService(activities, a).service?.price ?? 0), 0))}</p>}
      </div>
    </div>
  );
}
