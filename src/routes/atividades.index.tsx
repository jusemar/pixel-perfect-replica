import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WEEKDAYS, newId, useAgenda } from "@/lib/agenda-store";

export const Route = createFileRoute("/atividades/")({
  head: () => ({
    meta: [
      { title: "Atividades — Jaaa Profissional" },
      { name: "description", content: "Atividades profissionais, horários e serviços oferecidos." },
      { property: "og:title", content: "Atividades — Jaaa Profissional" },
      { property: "og:description", content: "Gerencie suas atividades e quais aceitam agendamento." },
    ],
  }),
  component: Atividades,
});

function Atividades() {
  const { activities, setActivities } = useAgenda();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  return (
    <>
      <PageHeader title="Atividades" subtitle="Cada atividade tem seus próprios horários e serviços. Os clientes veem apenas as que aceitam agendamento."
        action={<Button variant="outline" onClick={() => setAdding(true)}><Plus /> Nova atividade</Button>} />
      <div className="px-4 md:px-10 grid gap-4 md:grid-cols-2">
        {activities.map((a) => {
          const openDays = a.schedule.map((d, i) => d.open ? WEEKDAYS[i].slice(0, 3) : null).filter(Boolean);
          return (
            <div key={a.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-12 place-items-center rounded-xl bg-secondary text-2xl">{a.emoji}</span>
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{a.name}</h2>
                  <p className="text-sm text-muted-foreground">{a.services.filter((s) => s.active).length} serviços ativos · {openDays.join(", ") || "sem horários"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-muted p-3">
                <div>
                  <p className="text-sm font-medium">Aceita agendamento</p>
                  <p className="text-xs text-muted-foreground">{a.bookingEnabled ? "Visível no botão de agendar das conversas" : "Oculta para clientes"}</p>
                </div>
                <Switch checked={a.bookingEnabled} onCheckedChange={(v) => {
                  setActivities((all) => all.map((x) => x.id === a.id ? { ...x, bookingEnabled: v } : x));
                  toast(v ? `Agendamento ligado para ${a.name}` : `Agendamento desligado para ${a.name}`);
                }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button asChild variant="secondary"><Link to="/atividades/$id" params={{ id: a.id }} search={{ tab: "horarios" }}>Horários</Link></Button>
                <Button asChild variant="secondary"><Link to="/atividades/$id" params={{ id: a.id }} search={{ tab: "servicos" }}>Serviços <ChevronRight /></Link></Button>
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova atividade</DialogTitle></DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Passadeira, Personal trainer" />
          <DialogFooter>
            <Button disabled={!name} onClick={() => {
              setActivities((all) => [...all, { id: newId(), name, emoji: "⭐", bookingEnabled: false, services: [], schedule: WEEKDAYS.map(() => ({ open: false, periods: [] })) }]);
              setName(""); setAdding(false); toast.success("Atividade criada. Configure horários e serviços.");
            }}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
