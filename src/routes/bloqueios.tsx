import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarOff, Plane, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Block, TODAY, fmtDate, newId, parseDate, useAgenda } from "@/lib/agenda-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bloqueios")({
  head: () => ({
    meta: [
      { title: "Bloqueios e férias — Jaaa Profissional" },
      { name: "description", content: "Bloqueie períodos, dias inteiros ou férias sem alterar sua semana." },
      { property: "og:title", content: "Bloqueios e férias — Jaaa Profissional" },
      { property: "og:description", content: "Indisponibilidades que impedem novos agendamentos." },
    ],
  }),
  component: Bloqueios,
});

const d = (s: string) => parseDate(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
const kinds = [
  { k: "periodo", label: "Parte do dia" },
  { k: "dia", label: "Dia inteiro" },
  { k: "ferias", label: "Vários dias / férias" },
] as const;

function Bloqueios() {
  const { blocks, setBlocks, appointments } = useAgenda();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Block>({ id: "", title: "", kind: "periodo", from: fmtDate(TODAY), to: fmtDate(TODAY), start: "14:00", end: "16:00" });
  const sorted = [...blocks].sort((a, b) => a.from.localeCompare(b.from));
  const conflicts = (b: Block) => appointments.filter((a) => a.date >= b.from && a.date <= b.to && (a.status === "confirmado" || a.status === "pendente")).length;

  return (
    <>
      <PageHeader title="Bloqueios e férias" subtitle="Impedem novos agendamentos no período, sem mexer nos seus horários semanais."
        action={<Button onClick={() => setOpen(true)}><Plus /> Novo bloqueio</Button>} />
      <div className="px-4 md:px-10 space-y-3 max-w-3xl">
        {sorted.map((b) => {
          const c = conflicts(b);
          return (
            <div key={b.id} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
              <span className={cn("grid size-11 place-items-center rounded-xl", b.kind === "ferias" ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive")}>
                {b.kind === "ferias" ? <Plane className="size-5" /> : <CalendarOff className="size-5" />}
              </span>
              <div className="flex-1">
                <p className="font-semibold">{b.title}</p>
                <p className="text-sm text-muted-foreground">
                  {b.from === b.to ? d(b.from) : `${d(b.from)} – ${d(b.to)}`}
                  {b.start && b.end ? ` · ${b.start}–${b.end}` : " · dia inteiro"}
                </p>
                {c > 0 && <p className="mt-1 text-xs text-warning-foreground bg-warning/25 inline-block rounded px-2 py-0.5">{c} agendamento(s) já marcados neste período</p>}
              </div>
              <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => { setBlocks((all) => all.filter((x) => x.id !== b.id)); toast("Bloqueio removido"); }}><Trash2 /></Button>
            </div>
          );
        })}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo bloqueio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {kinds.map((k) => (
                <button key={k.k} onClick={() => setF({ ...f, kind: k.k, to: k.k === "ferias" ? f.to : f.from })}
                  className={cn("rounded-xl border p-2 text-xs font-medium", f.kind === k.k ? "bg-primary text-primary-foreground border-primary" : "bg-card")}>{k.label}</button>
              ))}
            </div>
            <div className="space-y-1.5"><Label>Motivo</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Consulta médica" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{f.kind === "ferias" ? "De" : "Data"}</Label><Input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value, to: f.kind === "ferias" ? f.to : e.target.value })} /></div>
              {f.kind === "ferias" && <div className="space-y-1.5"><Label>Até</Label><Input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>}
            </div>
            {f.kind === "periodo" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Início</Label><Input type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Fim</Label><Input type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button disabled={!f.title || f.to < f.from} onClick={() => {
              setBlocks((all) => [...all, { ...f, id: newId(), ...(f.kind !== "periodo" ? { start: undefined, end: undefined } : {}) }]);
              setOpen(false); setF({ ...f, title: "" }); toast.success("Bloqueio criado");
            }}>Bloquear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
