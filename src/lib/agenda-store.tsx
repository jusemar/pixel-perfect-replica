import { createContext, useContext, useState, type ReactNode } from "react";

export const TODAY = new Date(2026, 9, 19); // segunda, 19/10/2026 (data fixa da demonstração)

export type Period = { id: string; start: string; end: string };
export type DaySchedule = { open: boolean; periods: Period[] };
export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  active: boolean;
};

export type Activity = {
  id: string;
  name: string;
  emoji: string;
  bookingEnabled: boolean;
  schedule: DaySchedule[]; // index 0 = domingo
  services: Service[];
};

export type Status = "confirmado" | "pendente" | "concluido" | "cancelado" | "falta";
export type Appointment = {
  id: string;
  client: string;
  phone: string;
  activityId: string;
  serviceId: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  note?: string;
  status: Status;
  origin: "cliente" | "profissional";
  history: { at: string; text: string }[];
};

export type Block = {
  id: string;
  title: string;
  kind: "periodo" | "dia" | "ferias";
  from: string;
  to: string;
  start?: string;
  end?: string;
};

export type Rules = {
  minNoticeMin: number;
  horizonDays: number;
  slotStepMin: number;
  bufferMin: number;
  cancelLimitMin: number;
  rescheduleLimitMin: number;
};

export type Reminders = {
  clientConfirm: boolean;
  client24h: boolean;
  client2h: boolean;
  proNewBooking: boolean;
  proDaily: boolean;
  proDailyTime: string;
  chatCard: boolean;
};

let uid = 100;
export const newId = () => `id${uid++}`;
const p = (start: string, end: string): Period => ({ id: newId(), start, end });

export const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const rel = (n: number) => fmtDate(addDays(TODAY, n));

export const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const duration = (m: number) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
};
export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
export const toTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const shortDate = (s: string) =>
  parseDate(s).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

const week = (rows: (Period[] | null)[]): DaySchedule[] =>
  rows.map((r) => ({ open: !!r, periods: r ?? [] }));

const initialActivities: Activity[] = [
  {
    id: "faxina",
    name: "Faxineira",
    emoji: "🧽",
    bookingEnabled: true,
    schedule: week([
      null,
      [p("08:30", "12:00"), p("13:15", "18:00")],
      [p("08:30", "18:00")],
      null,
      [p("08:30", "12:00"), p("13:15", "18:00")],
      [p("08:30", "17:00")],
      null,
    ]),
    services: [
      { id: "s1", name: "Limpeza residencial", description: "Limpeza completa da residência.", price: 150, durationMin: 480, active: true },
      { id: "s2", name: "Limpeza externa", description: "Quintal, garagem e áreas externas.", price: 120, durationMin: 300, active: true },
      { id: "s3", name: "Pós-obra", description: "Remoção de resíduos finos e limpeza pesada.", price: 280, durationMin: 600, active: false },
    ],
  },
  {
    id: "manicure",
    name: "Manicure",
    emoji: "💅",
    bookingEnabled: true,
    schedule: week([
      null,
      null,
      null,
      [p("09:00", "12:00"), p("14:00", "19:00")],
      null,
      null,
      [p("08:00", "13:00")],
    ]),
    services: [
      { id: "s4", name: "Manicure", description: "Cutilagem e esmaltação.", price: 35, durationMin: 60, active: true },
      { id: "s5", name: "Pé e mão", description: "Manicure e pedicure completas.", price: 65, durationMin: 105, active: true },
      { id: "s6", name: "Esmaltação em gel", description: "Duração de até 3 semanas.", price: 80, durationMin: 90, active: true },
    ],
  },
];

const mk = (
  id: string, client: string, activityId: string, serviceId: string, d: number, time: string,
  status: Status, note?: string, origin: "cliente" | "profissional" = "cliente",
): Appointment => ({
  id, client, phone: "(11) 9" + (8000 + Number(id.slice(1)) * 37) + "-" + (1000 + Number(id.slice(1)) * 91),
  activityId, serviceId, date: rel(d), time, status, note, origin,
  history: [{ at: rel(Math.min(d, 0) - 2), text: origin === "cliente" ? "Agendado pelo cliente na conversa" : "Criado por você na Agenda" }],
});

const initialAppointments: Appointment[] = [
  mk("a1", "Mariana Souza", "faxina", "s1", 0, "08:30", "confirmado", "Tenho dois gatos, por favor não deixe a porta aberta."),
  mk("a2", "Roberto Lima", "faxina", "s2", 1, "08:30", "confirmado"),
  mk("a3", "Juliana Prado", "manicure", "s5", 2, "09:00", "pendente", "Quero esmalte nude."),
  mk("a4", "Ana Ribeiro", "manicure", "s4", 2, "14:00", "confirmado", undefined, "profissional"),
  mk("a5", "Fernanda Alves", "manicure", "s6", 2, "16:00", "confirmado"),
  mk("a6", "Carlos Mendes", "faxina", "s1", 4, "08:30", "confirmado", "Apartamento 42, bloco B."),
  mk("a7", "Patrícia Gomes", "manicure", "s4", 5, "08:00", "confirmado"),
  mk("a8", "Luiza Martins", "faxina", "s2", 8, "09:30", "pendente"),
  mk("a9", "Beatriz Costa", "manicure", "s5", 9, "10:00", "confirmado"),
  mk("a10", "Helena Rocha", "faxina", "s1", 15, "08:30", "confirmado"),
  mk("a11", "Sônia Freitas", "faxina", "s1", -1, "08:30", "concluido"),
  mk("a12", "Paula Nunes", "manicure", "s4", -5, "09:00", "falta"),
  mk("a13", "Diego Torres", "faxina", "s2", -6, "13:15", "cancelado", "Precisei viajar."),
  mk("a14", "Renata Dias", "manicure", "s6", -5, "14:00", "concluido"),
  mk("a15", "Marcos Pinto", "faxina", "s1", -3, "08:30", "concluido"),
];

const initialBlocks: Block[] = [
  { id: "b1", title: "Consulta médica", kind: "periodo", from: "2026-10-22", to: "2026-10-22", start: "14:00", end: "16:00" },
  { id: "b2", title: "Compromisso", kind: "periodo", from: "2026-10-24", to: "2026-10-24", start: "06:00", end: "12:00" },
  { id: "b3", title: "Férias", kind: "ferias", from: "2026-11-01", to: "2026-11-10" },
];

type Store = {
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  rules: Rules;
  setRules: React.Dispatch<React.SetStateAction<Rules>>;
  reminders: Reminders;
  setReminders: React.Dispatch<React.SetStateAction<Reminders>>;
};

const Ctx = createContext<Store | null>(null);

export function AgendaProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState(initialActivities);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [rules, setRules] = useState<Rules>({
    minNoticeMin: 60, horizonDays: 30, slotStepMin: 60, bufferMin: 20, cancelLimitMin: 720, rescheduleLimitMin: 1440,
  });
  const [reminders, setReminders] = useState<Reminders>({
    clientConfirm: true, client24h: true, client2h: false, proNewBooking: true, proDaily: true, proDailyTime: "07:00", chatCard: true,
  });
  return (
    <Ctx.Provider value={{ activities, setActivities, appointments, setAppointments, blocks, setBlocks, rules, setRules, reminders, setReminders }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAgenda() {
  const c = useContext(Ctx);
  if (!c) throw new Error("AgendaProvider ausente");
  return c;
}

export function findService(activities: Activity[], a: Pick<Appointment, "activityId" | "serviceId">) {
  const act = activities.find((x) => x.id === a.activityId);
  return { activity: act, service: act?.services.find((s) => s.id === a.serviceId) };
}

/** Horários livres para um serviço em uma data, considerando expediente, passo, intervalo e bloqueios. */
export function availableSlots(
  store: Pick<Store, "activities" | "appointments" | "blocks" | "rules">,
  activityId: string,
  serviceId: string,
  date: string,
  ignoreId?: string,
) {
  const act = store.activities.find((a) => a.id === activityId);
  const svc = act?.services.find((s) => s.id === serviceId);
  if (!act || !svc) return [];
  const day = act.schedule[parseDate(date).getDay()];
  if (!day.open) return [];
  const busy = store.appointments
    .filter((a) => a.date === date && a.id !== ignoreId && (a.status === "confirmado" || a.status === "pendente"))
    .map((a) => {
      const s = findService(store.activities, a).service;
      const st = toMin(a.time);
      return [st, st + (s?.durationMin ?? 60) + store.rules.bufferMin] as const;
    });
  const blocked = store.blocks
    .filter((b) => b.from <= date && b.to >= date)
    .map((b) => (b.start && b.end ? ([toMin(b.start), toMin(b.end)] as const) : ([0, 1440] as const)));
  const out: string[] = [];
  for (const per of day.periods) {
    for (let t = toMin(per.start); t + svc.durationMin <= toMin(per.end); t += store.rules.slotStepMin) {
      const end = t + svc.durationMin;
      const clash = [...busy, ...blocked].some(([a, b]) => t < b && end > a);
      if (!clash) out.push(toTime(t));
    }
  }
  return out;
}
