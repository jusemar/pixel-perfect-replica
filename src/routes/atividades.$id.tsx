import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type DaySchedule, type Service, WEEKDAYS, duration, money, newId, toMin, useAgenda } from "@/lib/agenda-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/atividades/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ tab: s.tab === "servicos" ? "servicos" : "horarios" }) as { tab: "horarios" | "servicos" },
  head: () => ({
    meta: [
      { title: "Configurar atividade — Jaaa Profissional" },
      { name: "description", content: "Horários semanais e serviços oferecidos da atividade." },
      { property: "og:title", content: "Configurar atividade — Jaaa Profissional" },
      { property: "og:description", content: "Horários, períodos e serviços com preço e duração." },
    ],
  }),
  component: AtividadeDetalhe,
  notFoundComponent: () => <p className="p-10">Atividade não encontrada.</p>,
});

const ORDER = [1, 2, 3, 4, 5, 6, 0];

function AtividadeDetalhe() {
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { activities, setActivities } = useAgenda();
  const act = activities.find((a) => a.id === id);
  if (!act) throw notFound();
  return (
    <div className="px-4 md:px-10 pt-6 md:pt-10 max-w-4xl">
      <Link to="/atividades" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Atividades</Link>
      <div className="mt-3 mb-5 flex flex-wrap items-center gap-3">
        <span className="grid size-12 place-items-center rounded-xl bg-secondary text-2xl">{act.emoji}</span>
        <h1 className="text-2xl md:text-3xl font-bold flex-1">{act.name}</h1>
        <label className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
          Agendamento
          <Switch checked={act.bookingEnabled} onCheckedChange={(v) => setActivities((all) => all.map((x) => x.id === id ? { ...x, bookingEnabled: v } : x))} />
        </label>
      </div>
      <Tabs value={tab} onValueChange={(v) => navigate({ search: { tab: v as "horarios" | "servicos" }, replace: true })}>
        <TabsList>
          <TabsTrigger value="horarios">Horários de atendimento</TabsTrigger>
          <TabsTrigger value="servicos">Serviços oferecidos</TabsTrigger>
        </TabsList>
        <TabsContent value="horarios" className="mt-4"><ScheduleEditor key={id} activityId={id} initial={act.schedule} /></TabsContent>
        <TabsContent value="servicos" className="mt-4"><ServicesEditor activityId={id} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ScheduleEditor({ activityId, initial }: { activityId: string; initial: DaySchedule[] }) {
  const { setActivities } = useAgenda();
  const [sched, setSched] = useState<DaySchedule[]>(() => structuredClone(initial));
  const [dirty, setDirty] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [src, setSrc] = useState(1);
  const [targets, setTargets] = useState<number[]>([]);
  const edit = (fn: (s: DaySchedule[]) => void) => { const n = structuredClone(sched); fn(n); setSched(n); setDirty(true); };
  const invalid = sched.some((d) => d.open && d.periods.some((p, i, arr) => toMin(p.end) <= toMin(p.start) || (i > 0 && toMin(p.start) < toMin(arr[i - 1].end))));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="text-sm text-muted-foreground">Defina quando você atende nesta atividade. Adicione mais de um período para pausas.</p>
        <Button variant="outline" size="sm" onClick={() => { setTargets([]); setCopyOpen(true); }}><Copy /> Copiar horários</Button>
      </div>
      {ORDER.map((i) => {
        const d = sched[i];
        return (
          <div key={i} className={cn("rounded-2xl border p-4 flex flex-col md:flex-row gap-3 md:items-start", d.open ? "bg-card" : "bg-muted/60")}>
            <div className="flex items-center gap-3 md:w-40 md:pt-1.5">
              <Switch checked={d.open} onCheckedChange={(v) => edit((s) => { s[i].open = v; if (v && !s[i].periods.length) s[i].periods = [{ id: newId(), start: "08:00", end: "17:00" }]; })} />
              <span className="font-medium">{WEEKDAYS[i]}</span>
            </div>
            {d.open ? (
              <div className="flex-1 space-y-2">
                {d.periods.map((p, k) => {
                  const bad = toMin(p.end) <= toMin(p.start) || (k > 0 && toMin(p.start) < toMin(d.periods[k - 1].end));
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <Input type="time" value={p.start} className={cn("w-28", bad && "border-destructive")} onChange={(e) => edit((s) => { s[i].periods[k].start = e.target.value; })} />
                      <span className="text-muted-foreground">até</span>
                      <Input type="time" value={p.end} className={cn("w-28", bad && "border-destructive")} onChange={(e) => edit((s) => { s[i].periods[k].end = e.target.value; })} />
                      <Button variant="ghost" size="icon" aria-label="Excluir período" onClick={() => edit((s) => { s[i].periods.splice(k, 1); if (!s[i].periods.length) s[i].open = false; })}><Trash2 /></Button>
                    </div>
                  );
                })}
                <Button variant="ghost" size="sm" className="text-primary" onClick={() => edit((s) => {
                  const last = s[i].periods.at(-1);
                  const st = last ? Math.min(toMin(last.end) + 60, 22 * 60) : 480;
                  s[i].periods.push({ id: newId(), start: `${String(Math.floor(st / 60)).padStart(2, "0")}:${String(st % 60).padStart(2, "0")}`, end: "20:00" });
                })}><Plus /> Adicionar período</Button>
              </div>
            ) : <p className="flex-1 text-sm text-muted-foreground md:pt-2">Fechado</p>}
          </div>
        );
      })}
      <div className="sticky bottom-20 md:bottom-4 flex items-center justify-end gap-3 rounded-2xl border bg-card/95 p-3 backdrop-blur">
        {invalid && <p className="text-sm text-destructive mr-auto">Corrija períodos com horário inválido ou sobreposto.</p>}
        {dirty && !invalid && <p className="text-sm text-muted-foreground mr-auto">Alterações não salvas</p>}
        <Button variant="ghost" disabled={!dirty} onClick={() => { setSched(structuredClone(initial)); setDirty(false); }}>Descartar</Button>
        <Button disabled={!dirty || invalid} onClick={() => {
          setActivities((all) => all.map((x) => x.id === activityId ? { ...x, schedule: sched } : x));
          setDirty(false); toast.success("Horários salvos");
        }}>Salvar horários</Button>
      </div>

      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Copiar horários</DialogTitle></DialogHeader>
          <Label>Copiar de</Label>
          <div className="flex flex-wrap gap-2">
            {ORDER.filter((i) => sched[i].open).map((i) => (
              <button key={i} onClick={() => { setSrc(i); setTargets((t) => t.filter((x) => x !== i)); }}
                className={cn("rounded-full border px-3 py-1 text-sm", src === i ? "bg-primary text-primary-foreground border-primary" : "bg-card")}>{WEEKDAYS[i]}</button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{sched[src].periods.map((p) => `${p.start}–${p.end}`).join(" · ")}</p>
          <Label className="mt-2">Aplicar em</Label>
          <div className="grid grid-cols-2 gap-2">
            {ORDER.filter((i) => i !== src).map((i) => (
              <label key={i} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                <Checkbox checked={targets.includes(i)} onCheckedChange={(c) => setTargets((t) => c ? [...t, i] : t.filter((x) => x !== i))} />
                {WEEKDAYS[i]}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button disabled={!targets.length || !sched[src].open} onClick={() => {
              edit((s) => targets.forEach((t) => { s[t] = { open: true, periods: s[src].periods.map((p) => ({ ...p, id: newId() })) }; }));
              setCopyOpen(false); toast(`Horários de ${WEEKDAYS[src]} aplicados em ${targets.length} dia(s). Lembre de salvar.`);
            }}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const PRESETS = [15, 30, 45, 60, 90, 120, 180, 240, 300, 480];

function ServicesEditor({ activityId }: { activityId: string }) {
  const { activities, setActivities } = useAgenda();
  const act = activities.find((a) => a.id === activityId)!;
  const [editing, setEditing] = useState<Service | null>(null);
  const setServices = (fn: (s: Service[]) => Service[]) => setActivities((all) => all.map((x) => x.id === activityId ? { ...x, services: fn(x.services) } : x));
  const move = (i: number, d: number) => setServices((s) => { const n = [...s]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-between gap-2">
        <p className="text-sm text-muted-foreground">Esta é a lista que o cliente vê ao tocar em agendar na conversa, nesta ordem.</p>
        <Button size="sm" onClick={() => setEditing({ id: "", name: "", description: "", price: 0, durationMin: 60, active: true })}><Plus /> Novo serviço</Button>
      </div>
      {act.services.map((s, i) => (
        <div key={s.id} className={cn("flex items-center gap-3 rounded-2xl border bg-card p-4", !s.active && "opacity-60")}>
          <div className="flex flex-col">
            <Button variant="ghost" size="icon" className="size-7" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir"><ArrowUp /></Button>
            <Button variant="ghost" size="icon" className="size-7" disabled={i === act.services.length - 1} onClick={() => move(i, 1)} aria-label="Descer"><ArrowDown /></Button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm text-muted-foreground truncate">{s.description}</p>
            <p className="mt-1 text-sm"><span className="font-semibold">{money(s.price)}</span> · {duration(s.durationMin)}</p>
          </div>
          <Switch checked={s.active} onCheckedChange={(v) => setServices((all) => all.map((x) => x.id === s.id ? { ...x, active: v } : x))} />
          <Button variant="ghost" size="icon" onClick={() => setEditing(s)} aria-label="Editar"><Pencil /></Button>
        </div>
      ))}
      {!act.services.length && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum serviço ainda.</p>}

      <div className="rounded-2xl bg-secondary p-4">
        <p className="text-xs font-medium text-secondary-foreground mb-2">Prévia: o que o cliente vê na conversa</p>
        <div className="max-w-sm rounded-2xl bg-card p-3 shadow-sm space-y-2">
          {act.services.filter((s) => s.active).map((s) => (
            <div key={s.id} className="flex justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
              <span>{s.name}</span><span className="text-muted-foreground">{money(s.price)} · {duration(s.durationMin)}</span>
            </div>
          ))}
          {!act.bookingEnabled && <p className="text-xs text-destructive">Agendamento desligado: o cliente não verá estes serviços.</p>}
        </div>
      </div>

      {editing && <ServiceDialog s={editing} onClose={() => setEditing(null)} onSave={(s) => {
        setServices((all) => s.id ? all.map((x) => x.id === s.id ? s : x) : [...all, { ...s, id: newId() }]);
        setEditing(null); toast.success("Serviço salvo");
      }} onDelete={editing.id ? () => { setServices((all) => all.filter((x) => x.id !== editing.id)); setEditing(null); } : undefined} />}
    </div>
  );
}

function ServiceDialog({ s, onClose, onSave, onDelete }: { s: Service; onClose: () => void; onSave: (s: Service) => void; onDelete?: () => void }) {
  const [f, setF] = useState(s);
  const h = Math.floor(f.durationMin / 60);
  const m = f.durationMin % 60;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{s.id ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Nome</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Limpeza residencial" /></div>
          <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Preço</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input className="pl-9" inputMode="decimal" value={f.price ? String(f.price).replace(".", ",") : ""} onChange={(e) => setF({ ...f, price: Number(e.target.value.replace(",", ".")) || 0 })} placeholder="0,00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Duração · {duration(f.durationMin)}</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setF({ ...f, durationMin: p })}
                  className={cn("rounded-full border px-3 py-1 text-xs", f.durationMin === p ? "bg-primary text-primary-foreground border-primary" : "bg-card")}>{duration(p)}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Input type="number" min={0} max={23} className="w-20" value={h} onChange={(e) => setF({ ...f, durationMin: Number(e.target.value) * 60 + m })} /> <span className="text-sm">h</span>
              <Input type="number" min={0} max={55} step={5} className="w-20" value={m} onChange={(e) => setF({ ...f, durationMin: h * 60 + Number(e.target.value) })} /> <span className="text-sm">min</span>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {onDelete && <Button variant="ghost" className="text-destructive mr-auto" onClick={onDelete}><Trash2 /> Excluir</Button>}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={!f.name || !f.durationMin} onClick={() => onSave(f)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
