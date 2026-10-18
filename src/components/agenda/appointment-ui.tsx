import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Check, Clock, MessageCircle, Phone, UserX, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  type Appointment, type Status, TODAY, addDays, availableSlots, duration, findService, fmtDate, money,
  newId, parseDate, shortDate, toMin, toTime, useAgenda,
} from "@/lib/agenda-store";
import { cn } from "@/lib/utils";

export const statusMeta: Record<Status, { label: string; cls: string }> = {
  confirmado: { label: "Confirmado", cls: "bg-success/15 text-success border-success/30" },
  pendente: { label: "Aguardando confirmação", cls: "bg-warning/25 text-warning-foreground border-warning/40" },
  concluido: { label: "Concluído", cls: "bg-info/15 text-info border-info/30" },
  cancelado: { label: "Cancelado", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  falta: { label: "Não compareceu", cls: "bg-muted text-muted-foreground border-border" },
};

export function StatusBadge({ s }: { s: Status }) {
  return <Badge variant="outline" className={cn("font-medium", statusMeta[s].cls)}>{statusMeta[s].label}</Badge>;
}

export function AppointmentRow({ a, onOpen }: { a: Appointment; onOpen: () => void }) {
  const { activities } = useAgenda();
  const { activity, service } = findService(activities, a);
  const end = toTime(toMin(a.time) + (service?.durationMin ?? 0));
  return (
    <button onClick={onOpen} className="w-full text-left flex gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm">
      <div className="w-14 shrink-0 text-center">
        <p className="font-display text-lg font-bold leading-none">{a.time}</p>
        <p className="mt-1 text-xs text-muted-foreground">até {end}</p>
      </div>
      <div className={cn("w-1 rounded-full", a.status === "cancelado" || a.status === "falta" ? "bg-border" : "bg-primary")} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("font-semibold", a.status === "cancelado" && "line-through text-muted-foreground")}>{a.client}</p>
          <StatusBadge s={a.status} />
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {activity?.emoji} {service?.name} · {duration(service?.durationMin ?? 0)} · {money(service?.price ?? 0)}
        </p>
        {a.note && <p className="mt-1 text-xs italic text-muted-foreground truncate">“{a.note}”</p>}
      </div>
    </button>
  );
}

export function ChatCard({ a }: { a: Appointment }) {
  const { activities } = useAgenda();
  const { service } = findService(activities, a);
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-secondary-foreground">
        <MessageCircle className="size-3.5" /> Como aparece na conversa com {a.client.split(" ")[0]}
      </p>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-card p-3 shadow-sm">
        <p className="text-xs text-muted-foreground">📅 Agendamento</p>
        <p className="font-semibold">{service?.name}</p>
        <p className="text-sm">{shortDate(a.date)} · {a.time}</p>
        <div className="mt-2"><StatusBadge s={a.status} /></div>
      </div>
    </div>
  );
}

export function AppointmentSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { appointments, setAppointments, activities, rules } = useAgenda();
  const a = appointments.find((x) => x.id === id);
  const [resched, setResched] = useState(false);
  const [confirm, setConfirm] = useState<null | Status>(null);
  if (!a) return null;
  const { activity, service } = findService(activities, a);
  const active = a.status === "confirmado" || a.status === "pendente";
  const isPast = a.date <= fmtDate(TODAY);

  const update = (status: Status, text: string) => {
    setAppointments((all) => all.map((x) => x.id === a.id ? { ...x, status, history: [...x.history, { at: fmtDate(TODAY), text }] } : x));
    toast.success(text, { description: "A conversa com o cliente recebeu a atualização." });
    setConfirm(null);
  };

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{a.client}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge s={a.status} />
            <Badge variant="secondary">{a.origin === "cliente" ? "Pelo cliente na conversa" : "Criado por você"}</Badge>
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-2xl border bg-card p-4 text-sm">
            <Info k="Serviço" v={`${activity?.emoji} ${service?.name}`} />
            <Info k="Preço" v={money(service?.price ?? 0)} />
            <Info k="Data" v={shortDate(a.date)} />
            <Info k="Horário" v={`${a.time} – ${toTime(toMin(a.time) + (service?.durationMin ?? 0))}`} />
            <Info k="Duração" v={duration(service?.durationMin ?? 0)} />
            <Info k="Contato" v={a.phone} />
          </dl>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Observação do cliente</p>
            <p className="text-sm rounded-xl bg-muted p-3">{a.note ?? "Nenhuma observação."}</p>
          </div>
          <ChatCard a={a} />
          {active && (
            <div className="grid grid-cols-2 gap-2">
              {a.status === "pendente" && (
                <Button className="col-span-2" onClick={() => update("confirmado", "Agendamento confirmado")}>
                  <Check /> Confirmar agendamento
                </Button>
              )}
              <Button variant="outline" onClick={() => setResched(true)}><CalendarClock /> Reagendar</Button>
              <Button variant="outline" className="text-destructive" onClick={() => setConfirm("cancelado")}><X /> Cancelar</Button>
              <Button disabled={!isPast} onClick={() => setConfirm("concluido")}><Check /> Concluir</Button>
              <Button variant="secondary" disabled={!isPast} onClick={() => setConfirm("falta")}><UserX /> Não compareceu</Button>
              {!isPast && <p className="col-span-2 text-xs text-muted-foreground">Concluir e marcar ausência ficam disponíveis no dia do atendimento.</p>}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm"><MessageCircle /> Abrir conversa</Button>
            <Button variant="ghost" size="sm"><Phone /> Ligar</Button>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Histórico</p>
            <ol className="space-y-2 border-l pl-4">
              {a.history.map((h, i) => (
                <li key={i} className="text-sm"><span className="text-muted-foreground">{shortDate(h.at)} — </span>{h.text}</li>
              ))}
            </ol>
          </div>
          <p className="text-xs text-muted-foreground flex gap-1"><Clock className="size-3.5" /> O cliente pode cancelar até {duration(rules.cancelLimitMin)} antes.</p>
        </div>
        <RescheduleDialog a={a} open={resched} onOpenChange={setResched} />
        <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirm === "cancelado" ? "Cancelar agendamento?" : confirm === "concluido" ? "Concluir atendimento?" : "Marcar não comparecimento?"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {a.client} · {service?.name} · {shortDate(a.date)} às {a.time}. {confirm === "cancelado" && "O horário volta a ficar disponível e o cliente é avisado na conversa."}
            </p>
            {confirm === "cancelado" && <Textarea placeholder="Motivo (opcional, enviado ao cliente)" />}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirm(null)}>Voltar</Button>
              <Button
                variant={confirm === "cancelado" ? "destructive" : "default"}
                onClick={() => update(confirm!, confirm === "cancelado" ? "Cancelado por você" : confirm === "concluido" ? "Atendimento concluído" : "Marcado como não compareceu")}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function DayPicker({ value, onChange, isOpen }: { value: string; onChange: (d: string) => void; isOpen: (d: string) => boolean }) {
  const { rules } = useAgenda();
  const days = Array.from({ length: Math.min(rules.horizonDays, 30) }, (_, i) => fmtDate(addDays(TODAY, i)));
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map((d) => {
        const dt = parseDate(d);
        const open = isOpen(d);
        return (
          <button
            key={d}
            disabled={!open}
            onClick={() => onChange(d)}
            className={cn(
              "flex w-12 shrink-0 flex-col items-center rounded-xl border py-2 text-xs transition disabled:opacity-35",
              value === d ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50",
            )}
          >
            <span className="capitalize">{dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
            <span className="font-display text-base font-bold">{dt.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}

function SlotGrid({ slots, value, onChange }: { slots: string[]; value: string; onChange: (s: string) => void }) {
  if (!slots.length) return <p className="text-sm text-muted-foreground rounded-xl bg-muted p-3">Nenhum horário livre neste dia para a duração do serviço.</p>;
  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((s) => (
        <button key={s} onClick={() => onChange(s)}
          className={cn("rounded-lg border py-2 text-sm font-medium", value === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50")}>
          {s}
        </button>
      ))}
    </div>
  );
}

function RescheduleDialog({ a, open, onOpenChange }: { a: Appointment; open: boolean; onOpenChange: (o: boolean) => void }) {
  const store = useAgenda();
  const { service, activity } = findService(store.activities, a);
  const [date, setDate] = useState(a.date);
  const [time, setTime] = useState("");
  const slots = availableSlots(store, a.activityId, a.serviceId, date, a.id);
  const save = () => {
    store.setAppointments((all) => all.map((x) => x.id === a.id ? {
      ...x, date, time, history: [...x.history, { at: fmtDate(TODAY), text: `Reagendado de ${shortDate(a.date)} ${a.time} para ${shortDate(date)} ${time}` }],
    } : x));
    toast.success("Agendamento reagendado", { description: "O cartão na conversa foi atualizado." });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Reagendar</DialogTitle></DialogHeader>
        <div className="rounded-xl bg-muted p-3 text-sm">
          <p className="font-medium">{a.client} · {activity?.emoji} {service?.name}</p>
          <p className="text-muted-foreground">Atual: {shortDate(a.date)} às {a.time}</p>
        </div>
        <Label>Nova data</Label>
        <DayPicker value={date} onChange={(d) => { setDate(d); setTime(""); }} isOpen={(d) => !!activity?.schedule[parseDate(d).getDay()].open} />
        <Label>Horário disponível</Label>
        <SlotGrid slots={slots} value={time} onChange={setTime} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button disabled={!time} onClick={save}>Confirmar reagendamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const contacts = ["Mariana Souza", "Roberto Lima", "Juliana Prado", "Ana Ribeiro", "Carlos Mendes", "Helena Rocha", "Sônia Freitas"];

export function NewAppointmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const store = useAgenda();
  const acts = store.activities.filter((x) => x.bookingEnabled);
  const [client, setClient] = useState("");
  const [actId, setActId] = useState(acts[0]?.id ?? "");
  const act = store.activities.find((x) => x.id === actId);
  const [svcId, setSvcId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const slots = date && svcId ? availableSlots(store, actId, svcId, date) : [];
  const reset = () => { setClient(""); setSvcId(""); setDate(""); setTime(""); setNote(""); };
  const save = () => {
    store.setAppointments((all) => [...all, {
      id: newId(), client, phone: "(11) 90000-0000", activityId: actId, serviceId: svcId, date, time, note: note || undefined,
      status: "confirmado", origin: "profissional", history: [{ at: fmtDate(TODAY), text: "Criado por você na Agenda" }],
    }]);
    toast.success("Agendamento criado", { description: `${client} recebeu o cartão do compromisso na conversa.` });
    reset();
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Input list="contatos" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Buscar contato ou digitar nome" />
            <datalist id="contatos">{contacts.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Atividade</Label>
              <Select value={actId} onValueChange={(v) => { setActId(v); setSvcId(""); setDate(""); setTime(""); }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{acts.map((x) => <SelectItem key={x.id} value={x.id}>{x.emoji} {x.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Serviço</Label>
              <Select value={svcId} onValueChange={(v) => { setSvcId(v); setTime(""); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Escolher" /></SelectTrigger>
                <SelectContent>
                  {act?.services.filter((s) => s.active).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} · {duration(s.durationMin)} · {money(s.price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {svcId && (
            <>
              <Label>Data</Label>
              <DayPicker value={date} onChange={(d) => { setDate(d); setTime(""); }} isOpen={(d) => !!act?.schedule[parseDate(d).getDay()].open} />
            </>
          )}
          {date && (<><Label>Horário</Label><SlotGrid slots={slots} value={time} onChange={setTime} /></>)}
          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: pediu por telefone, levar produtos" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!client || !svcId || !date || !time} onClick={save}>Criar agendamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
